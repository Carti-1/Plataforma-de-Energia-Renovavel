import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import request from 'supertest'
import app from '../../src/app.js'
import {
  SUFIXO,
  criarUsuarioTeste,
  encerrarConexao,
  entrar,
} from './helpers.js'

let admin
let pesquisador
let tokenAdmin
let tokenPesquisador

beforeAll(async () => {
  admin = await criarUsuarioTeste('administrador')
  pesquisador = await criarUsuarioTeste('pesquisador')
  tokenAdmin = await entrar(request, app, admin)
  tokenPesquisador = await entrar(request, app, pesquisador)
})

afterAll(encerrarConexao)

describe('Autenticação (JWT + bcrypt)', () => {
  test('rotas protegidas recusam requisições sem token', async () => {
    for (const rota of ['/api/municipios', '/api/criterios', '/api/dados/topsis', '/api/municipios/geojson']) {
      const resposta = await request(app).get(rota)
      expect(resposta.status).toBe(401)
    }
    expect((await request(app).post('/api/topsis/executar').send({})).status).toBe(401)
  })

  test('login com senha errada ou e-mail inexistente devolve a mesma mensagem 401', async () => {
    const senhaErrada = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, senha: 'senha-errada-123' })
    const emailInexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: `ninguem-${SUFIXO}@exemplo.com`, senha: 'qualquer-senha-123' })

    expect(senhaErrada.status).toBe(401)
    expect(emailInexistente.status).toBe(401)
    expect(senhaErrada.body.erro).toBe(emailInexistente.body.erro)
  })

  test('login sem corpo devolve 400', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400)
  })

  test('login correto devolve token e dados públicos, sem o hash da senha', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, senha: admin.senha })

    expect(resposta.status).toBe(200)
    expect(resposta.body.token).toEqual(expect.any(String))
    expect(resposta.body.usuario).toMatchObject({ email: admin.email, perfil: 'administrador' })
    expect(JSON.stringify(resposta.body)).not.toContain('senha_hash')
  })

  test('o token dá acesso e identifica o usuário em /api/auth/eu', async () => {
    const resposta = await request(app).get('/api/auth/eu').set('Authorization', `Bearer ${tokenPesquisador}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toMatchObject({ email: pesquisador.email, perfil: 'pesquisador' })
    expect((await request(app).get('/api/municipios').set('Authorization', `Bearer ${tokenPesquisador}`)).status).toBe(200)
  })

  test('token adulterado é recusado', async () => {
    const adulterado = `${tokenAdmin.slice(0, -4)}AAAA`
    const resposta = await request(app).get('/api/municipios').set('Authorization', `Bearer ${adulterado}`)

    expect(resposta.status).toBe(401)
  })
})

describe('Perfis de acesso', () => {
  const novoMunicipio = {
    nome: `Teste-Municipio-${SUFIXO}`,
    uf: 'BA',
    populacao: 1000,
    idh: 0.7,
    latitude: -12.9,
    longitude: -38.5,
  }

  test('pesquisador não pode cadastrar município (UC01 é do administrador)', async () => {
    const resposta = await request(app)
      .post('/api/municipios')
      .set('Authorization', `Bearer ${tokenPesquisador}`)
      .send(novoMunicipio)

    expect(resposta.status).toBe(403)
  })

  test('administrador cadastra, consulta e exclui município', async () => {
    const criado = await request(app)
      .post('/api/municipios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(novoMunicipio)

    expect(criado.status).toBe(201)
    expect(criado.body).toMatchObject({ nome: novoMunicipio.nome, latitude: -12.9, longitude: -38.5 })

    const geojson = await request(app).get('/api/municipios/geojson').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(geojson.body.features.some((f) => f.properties.id === criado.body.id)).toBe(true)

    const excluido = await request(app)
      .delete(`/api/municipios/${criado.body.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(excluido.status).toBe(204)
  })

  test('dados inválidos devolvem 400 sem expor mensagens internas do banco', async () => {
    const resposta = await request(app)
      .post('/api/municipios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: `Teste-Invalido-${SUFIXO}`, uf: 'BAHIA' })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).not.toMatch(/value too long|postgres|constraint/i)
  })

  test('id inexistente devolve 404 e id mal formado devolve 400', async () => {
    const auth = { Authorization: `Bearer ${tokenAdmin}` }
    expect((await request(app).get('/api/municipios/99999999').set(auth)).status).toBe(404)
    expect((await request(app).get('/api/municipios/abc').set(auth)).status).toBe(400)
  })
})

describe('Gerenciamento de usuários (RF08)', () => {
  const novo = {
    nome: 'Gestora Teste',
    email: `teste-gestor-novo-${SUFIXO}@exemplo.com`,
    senha: 'senha-nova-12345',
    perfil: 'gestor',
  }
  let idNovo

  test('apenas administrador acessa a gestão de usuários', async () => {
    const resposta = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenPesquisador}`)
    expect(resposta.status).toBe(403)
  })

  test('administrador cria usuário; o login funciona e a senha não é devolvida', async () => {
    const criado = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`).send(novo)

    expect(criado.status).toBe(201)
    expect(criado.body).toMatchObject({ email: novo.email, perfil: 'gestor' })
    expect(JSON.stringify(criado.body)).not.toMatch(/senha/i)
    idNovo = criado.body.id

    const login = await request(app).post('/api/auth/login').send({ email: novo.email, senha: novo.senha })
    expect(login.status).toBe(200)
  })

  test('e-mail repetido devolve 409; senha curta e perfil inválido devolvem 400', async () => {
    const auth = { Authorization: `Bearer ${tokenAdmin}` }

    expect((await request(app).post('/api/usuarios').set(auth).send(novo)).status).toBe(409)
    expect((await request(app).post('/api/usuarios').set(auth).send({ ...novo, email: `x-${novo.email}`, senha: '123' })).status).toBe(400)
    expect((await request(app).post('/api/usuarios').set(auth).send({ ...novo, email: `y-${novo.email}`, perfil: 'root' })).status).toBe(400)
  })

  test('administrador altera o perfil de outro usuário', async () => {
    const resposta = await request(app)
      .put(`/api/usuarios/${idNovo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ perfil: 'pesquisador' })

    expect(resposta.status).toBe(200)
    expect(resposta.body.perfil).toBe('pesquisador')
  })

  test('administrador não pode excluir nem rebaixar a si mesmo', async () => {
    const auth = { Authorization: `Bearer ${tokenAdmin}` }

    expect((await request(app).delete(`/api/usuarios/${admin.id}`).set(auth)).status).toBe(400)
    expect((await request(app).put(`/api/usuarios/${admin.id}`).set(auth).send({ perfil: 'gestor' })).status).toBe(400)
  })

  test('administrador exclui outro usuário', async () => {
    const resposta = await request(app).delete(`/api/usuarios/${idNovo}`).set('Authorization', `Bearer ${tokenAdmin}`)
    expect(resposta.status).toBe(204)
  })
})
