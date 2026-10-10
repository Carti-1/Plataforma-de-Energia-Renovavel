import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import request from 'supertest'
import app from '../../src/app.js'
import { pool } from '../../src/config/db.js'
import { SUFIXO, criarUsuarioTeste, encerrarConexao, entrar } from './helpers.js'

let tokenAdmin
let tokenPesquisador
let tokenGestor

const comToken = (token) => ({ Authorization: `Bearer ${token}` })
const novoCriterio = {
  nome: `Teste-Criterio-${SUFIXO}`,
  descricao: 'Fonte de teste',
  tipo: 'custo',
  peso: 0.1,
  unidade: '%',
}

beforeAll(async () => {
  tokenAdmin = await entrar(request, app, await criarUsuarioTeste('administrador'))
  tokenPesquisador = await entrar(request, app, await criarUsuarioTeste('pesquisador'))
  tokenGestor = await entrar(request, app, await criarUsuarioTeste('gestor'))
})

afterAll(encerrarConexao)

describe('CRUD de critérios (UC02)', () => {
  let id

  test('gestor pode consultar, mas não cadastrar critérios', async () => {
    expect((await request(app).get('/api/criterios').set(comToken(tokenGestor))).status).toBe(200)
    expect((await request(app).post('/api/criterios').set(comToken(tokenGestor)).send(novoCriterio)).status).toBe(403)
  })

  test('pesquisador cadastra e consulta um critério', async () => {
    const criado = await request(app).post('/api/criterios').set(comToken(tokenPesquisador)).send(novoCriterio)

    expect(criado.status).toBe(201)
    expect(criado.body).toMatchObject({ nome: novoCriterio.nome, tipo: 'custo', unidade: '%' })
    id = criado.body.id

    const lista = await request(app).get('/api/criterios').set(comToken(tokenGestor))
    expect(lista.body.some((c) => c.id === id)).toBe(true)

    const unico = await request(app).get(`/api/criterios/${id}`).set(comToken(tokenGestor))
    expect(unico.body.nome).toBe(novoCriterio.nome)
  })

  test('tipo fora de beneficio/custo é recusado com 400', async () => {
    const resposta = await request(app)
      .post('/api/criterios')
      .set(comToken(tokenAdmin))
      .send({ ...novoCriterio, nome: `Teste-Criterio-Invalido-${SUFIXO}`, tipo: 'qualquer' })

    expect(resposta.status).toBe(400)
  })

  test('atualiza um critério e devolve 404 para id inexistente', async () => {
    const atualizado = await request(app)
      .put(`/api/criterios/${id}`)
      .set(comToken(tokenPesquisador))
      .send({ ...novoCriterio, tipo: 'beneficio' })

    expect(atualizado.status).toBe(200)
    expect(atualizado.body.tipo).toBe('beneficio')
    expect((await request(app).put('/api/criterios/99999999').set(comToken(tokenAdmin)).send(novoCriterio)).status).toBe(404)
    expect((await request(app).get('/api/criterios/99999999').set(comToken(tokenAdmin))).status).toBe(404)
  })

  test('critério com valores na matriz não pode ser excluído (409)', async () => {
    const municipio = await request(app)
      .post('/api/municipios')
      .set(comToken(tokenAdmin))
      .send({ nome: `Teste-Municipio-Fk-${SUFIXO}`, uf: 'BA' })
    await pool.query('INSERT INTO matriz_decisao (municipio_id, criterio_id, valor) VALUES ($1, $2, 1)', [
      municipio.body.id,
      id,
    ])

    const resposta = await request(app).delete(`/api/criterios/${id}`).set(comToken(tokenPesquisador))

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).not.toMatch(/violates|constraint|matriz_decisao/i)
  })

  test('exclui um critério sem uso e depois devolve 404', async () => {
    await pool.query('DELETE FROM matriz_decisao WHERE criterio_id = $1', [id])

    expect((await request(app).delete(`/api/criterios/${id}`).set(comToken(tokenPesquisador))).status).toBe(204)
    expect((await request(app).delete(`/api/criterios/${id}`).set(comToken(tokenPesquisador))).status).toBe(404)
  })
})

describe('Dados para o TOPSIS (matriz de decisão)', () => {
  test('devolve municípios com valores alinhados à ordem dos critérios', async () => {
    const criterio = await request(app)
      .post('/api/criterios')
      .set(comToken(tokenAdmin))
      .send({ ...novoCriterio, nome: `Teste-Criterio-Matriz-${SUFIXO}` })
    const municipio = await request(app)
      .post('/api/municipios')
      .set(comToken(tokenAdmin))
      .send({ nome: `Teste-Municipio-Matriz-${SUFIXO}`, uf: 'BA' })
    await pool.query('INSERT INTO matriz_decisao (municipio_id, criterio_id, valor) VALUES ($1, $2, 42.5)', [
      municipio.body.id,
      criterio.body.id,
    ])

    const resposta = await request(app).get('/api/dados/topsis').set(comToken(tokenGestor))
    const posicao = resposta.body.criterios.findIndex((c) => c.id === criterio.body.id)
    const encontrado = resposta.body.municipios.find((m) => m.id === municipio.body.id)

    expect(resposta.status).toBe(200)
    expect(posicao).toBeGreaterThanOrEqual(0)
    expect(resposta.body.criterios[posicao]).toMatchObject({ tipo: 'custo', peso: 0.1 })
    expect(encontrado.valores).toContain(42.5)
  })
})
