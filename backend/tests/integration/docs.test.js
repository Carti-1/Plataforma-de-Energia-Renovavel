import { afterAll, describe, expect, test } from '@jest/globals'
import request from 'supertest'
import app from '../../src/app.js'
import { pool } from '../../src/config/db.js'

afterAll(() => pool.end())

describe('Documentação da API (Swagger)', () => {
  test('a interface do Swagger abre sem login', async () => {
    const resposta = await request(app).get('/api/docs/')

    expect(resposta.status).toBe(200)
    expect(resposta.headers['content-type']).toContain('text/html')
    expect(resposta.text).toContain('swagger-ui')
  })

  test('a especificação JSON é servida sem login', async () => {
    const resposta = await request(app).get('/api/docs.json')

    expect(resposta.status).toBe(200)
    expect(resposta.body.paths['/api/topsis/executar']).toBeDefined()
  })
})
