import { describe, expect, test } from '@jest/globals'
import SwaggerParser from '@apidevtools/swagger-parser'
import { openapi } from '../src/docs/openapi.js'

describe('Especificação OpenAPI', () => {
  test('é um documento OpenAPI 3 válido (referências e esquemas consistentes)', async () => {
    const api = await SwaggerParser.validate(structuredClone(openapi))

    expect(api.openapi).toMatch(/^3\./)
  })

  test('documenta as rotas exigidas pelo roteiro (Cap. 5)', () => {
    const exigidas = [
      ['get', '/api/municipios'],
      ['post', '/api/municipios'],
      ['get', '/api/criterios'],
      ['post', '/api/topsis/executar'],
      ['get', '/api/simulacoes/{id}'],
      ['get', '/api/relatorios/{id}/pdf'],
    ]

    for (const [metodo, caminho] of exigidas) {
      expect(openapi.paths[caminho]?.[metodo]).toBeDefined()
    }
  })

  test('somente o login é público; as demais operações exigem token', () => {
    const publicas = []
    for (const [caminho, operacoes] of Object.entries(openapi.paths)) {
      for (const [metodo, operacao] of Object.entries(operacoes)) {
        if (Array.isArray(operacao.security) && operacao.security.length === 0) {
          publicas.push(`${metodo} ${caminho}`)
        }
      }
    }

    expect(publicas).toEqual(['post /api/auth/login'])
    expect(openapi.security).toEqual([{ bearerAuth: [] }])
  })
})
