import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import request from 'supertest'
import app from '../../src/app.js'
import { pool } from '../../src/config/db.js'
import { SUFIXO, criarUsuarioTeste, encerrarConexao, entrar } from './helpers.js'

// Exemplo numérico 7.3 do roteiro: resultado esperado B > A > C.
const EXEMPLO = [
  { nome: `Teste-A-${SUFIXO}`, valores: [15, 0.8, 980, 0.75, 5.2] },
  { nome: `Teste-B-${SUFIXO}`, valores: [5, 2.1, 1850, 0.62, 5.8] },
  { nome: `Teste-C-${SUFIXO}`, valores: [22, 0.3, 650, 0.89, 4.9] },
]
const PESOS = [0.2, 0.2, 0.15, 0.25, 0.2]
const TIPOS = ['custo', 'beneficio', 'beneficio', 'custo', 'beneficio']
const CRITERIOS = ['Sem eletricidade', 'Capacidade solar', 'Renda', 'Tarifa', 'Irradiação']

let pesquisador
let gestor
let tokenAdmin
let tokenPesquisador
let tokenGestor
let simulacaoId

const comToken = (token) => ({ Authorization: `Bearer ${token}` })
const binario = (resposta, callback) => {
  const partes = []
  resposta.on('data', (parte) => partes.push(parte))
  resposta.on('end', () => callback(null, Buffer.concat(partes)))
}
const totalSimulacoes = async (usuarioId) =>
  Number((await pool.query('SELECT COUNT(*) FROM simulacoes WHERE usuario_id = $1', [usuarioId])).rows[0].count)

beforeAll(async () => {
  const admin = await criarUsuarioTeste('administrador')
  pesquisador = await criarUsuarioTeste('pesquisador')
  gestor = await criarUsuarioTeste('gestor')
  tokenAdmin = await entrar(request, app, admin)
  tokenPesquisador = await entrar(request, app, pesquisador)
  tokenGestor = await entrar(request, app, gestor)

  for (const municipio of EXEMPLO) {
    const resposta = await request(app)
      .post('/api/municipios')
      .set(comToken(tokenAdmin))
      .send({ nome: municipio.nome, uf: 'BA' })
    expect(resposta.status).toBe(201)
  }
})

afterAll(encerrarConexao)

describe('Executar TOPSIS e registrar simulação', () => {
  test('exige autenticação', async () => {
    expect((await request(app).post('/api/topsis/executar').send({})).status).toBe(401)
  })

  test('reproduz o exemplo do roteiro (B > A > C) e salva a simulação', async () => {
    const resposta = await request(app)
      .post('/api/topsis/executar')
      .set(comToken(tokenPesquisador))
      .send({ municipios: EXEMPLO, pesos: PESOS, tipos: TIPOS, criterios: CRITERIOS, usuario_id: 999999 })

    expect(resposta.status).toBe(200)
    expect(resposta.body.ranking.map((item) => item.municipio)).toEqual([
      EXEMPLO[1].nome,
      EXEMPLO[0].nome,
      EXEMPLO[2].nome,
    ])
    expect(resposta.body.ranking[0].ci).toBeCloseTo(1, 6)
    expect(resposta.body.ranking[1].ci).toBeCloseTo(0.336058, 5)
    expect(resposta.body.ranking[2].ci).toBeCloseTo(0, 6)
    simulacaoId = resposta.body.simulacao.id
    expect(simulacaoId).toEqual(expect.any(Number))
  })

  test('o autor da simulação é o usuário do token, mesmo que o corpo informe outro', async () => {
    const resposta = await request(app).get(`/api/simulacoes/${simulacaoId}`).set(comToken(tokenGestor))

    expect(resposta.status).toBe(200)
    expect(resposta.body.simulacao.usuario.id).toBe(pesquisador.id)
  })

  test('"salvar: false" calcula sem gravar histórico', async () => {
    const antes = await totalSimulacoes(pesquisador.id)
    const resposta = await request(app)
      .post('/api/topsis/executar')
      .set(comToken(tokenPesquisador))
      .send({ municipios: EXEMPLO, pesos: PESOS, tipos: TIPOS, salvar: false })

    expect(resposta.status).toBe(200)
    expect(resposta.body.simulacao).toBeNull()
    expect(resposta.body.ranking).toHaveLength(3)
    expect(await totalSimulacoes(pesquisador.id)).toBe(antes)
  })

  test('pesos que não somam 1 devolvem 400 e nada é gravado', async () => {
    const antes = await totalSimulacoes(pesquisador.id)
    const resposta = await request(app)
      .post('/api/topsis/executar')
      .set(comToken(tokenPesquisador))
      .send({ municipios: EXEMPLO, pesos: [0.5, 0.2, 0.1, 0.1, 0.05], tipos: TIPOS })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toMatch(/soma dos pesos/i)
    expect(await totalSimulacoes(pesquisador.id)).toBe(antes)
  })

  test('corpo sem municípios devolve 400', async () => {
    const resposta = await request(app)
      .post('/api/topsis/executar')
      .set(comToken(tokenPesquisador))
      .send({ municipios: [], pesos: PESOS, tipos: TIPOS })

    expect(resposta.status).toBe(400)
  })
})

describe('Histórico de simulações (RF10)', () => {
  test('lista a simulação salva, com autor e quantidade de municípios', async () => {
    const resposta = await request(app).get('/api/simulacoes').set(comToken(tokenGestor))
    const item = resposta.body.find((s) => s.id === simulacaoId)

    expect(resposta.status).toBe(200)
    expect(item).toMatchObject({ totalMunicipios: 3, usuario: { id: pesquisador.id } })
  })

  test('detalha o ranking salvo com nomes e distâncias', async () => {
    const resposta = await request(app).get(`/api/simulacoes/${simulacaoId}`).set(comToken(tokenGestor))

    expect(resposta.body.ranking.map((r) => r.posicao)).toEqual([1, 2, 3])
    expect(resposta.body.ranking[0].nome).toBe(EXEMPLO[1].nome)
    expect(resposta.body.ranking[0].distanciaNegativa).toBeGreaterThan(0)
    expect(resposta.body.simulacao.parametros.criterios).toEqual(CRITERIOS)
  })

  test('id inexistente devolve 404 e id inválido devolve 400', async () => {
    expect((await request(app).get('/api/simulacoes/99999999').set(comToken(tokenGestor))).status).toBe(404)
    expect((await request(app).get('/api/simulacoes/abc').set(comToken(tokenGestor))).status).toBe(400)
  })
})

describe('Relatórios (UC04, RF06)', () => {
  test('exigem autenticação', async () => {
    expect((await request(app).get(`/api/relatorios/${simulacaoId}/pdf`)).status).toBe(401)
    expect((await request(app).get(`/api/relatorios/${simulacaoId}/csv`)).status).toBe(401)
  })

  test('PDF é gerado com o tipo correto e conteúdo do ranking', async () => {
    const resposta = await request(app)
      .get(`/api/relatorios/${simulacaoId}/pdf`)
      .set(comToken(tokenGestor))
      .buffer(true)
      .parse(binario)

    expect(resposta.status).toBe(200)
    expect(resposta.headers['content-type']).toContain('application/pdf')
    expect(resposta.headers['content-disposition']).toContain(`relatorio-topsis-${simulacaoId}.pdf`)
    expect(resposta.body.subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('CSV traz o ranking em ordem', async () => {
    const resposta = await request(app).get(`/api/relatorios/${simulacaoId}/csv`).set(comToken(tokenGestor))
    const linhas = resposta.text.replace('\uFEFF', '').trim().split('\r\n')

    expect(resposta.status).toBe(200)
    expect(resposta.headers['content-type']).toContain('text/csv')
    expect(linhas).toHaveLength(4)
    expect(linhas[1]).toContain(EXEMPLO[1].nome)
    expect(linhas[1]).toContain('1,0000')
    expect(linhas[3]).toContain(EXEMPLO[2].nome)
  })

  test('simulação inexistente devolve 404', async () => {
    expect((await request(app).get('/api/relatorios/99999999/pdf').set(comToken(tokenGestor))).status).toBe(404)
  })
})
