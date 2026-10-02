import { describe, expect, test } from '@jest/globals'
import { normalizar, topsis } from '../src/services/topsis.service.js'

const matrizExemplo = [
  [15, 0.8, 980, 0.75, 5.2],
  [5, 2.1, 1850, 0.62, 5.8],
  [22, 0.3, 650, 0.89, 4.9],
]
const pesosExemplo = [0.2, 0.2, 0.15, 0.25, 0.2]
const tiposExemplo = ['custo', 'beneficio', 'beneficio', 'custo', 'beneficio']

describe('Serviço TOPSIS', () => {
  test('normalização vetorial preserva as proporções do exemplo do roteiro', () => {
    const resultado = normalizar([3, 4])

    expect(resultado[0]).toBeCloseTo(0.6)
    expect(resultado[1]).toBeCloseTo(0.8)
  })

  test('exemplo 7.3 gera o ranking B > A > C', () => {
    const resultado = topsis(matrizExemplo, pesosExemplo, tiposExemplo)

    expect(resultado.map((item) => item.indice)).toEqual([1, 0, 2])
    expect(resultado.map((item) => item.ci)).toEqual([
      expect.closeTo(1),
      expect.closeTo(0.3360579328),
      expect.closeTo(0),
    ])
  })

  test('coeficientes Ci permanecem entre 0 e 1', () => {
    const resultado = topsis(matrizExemplo, pesosExemplo, tiposExemplo)

    resultado.forEach((item) => {
      expect(item.ci).toBeGreaterThanOrEqual(0)
      expect(item.ci).toBeLessThanOrEqual(1)
    })
  })

  test('rejeita pesos cuja soma não seja 1,00', () => {
    expect(() => topsis(matrizExemplo, [0.2, 0.2, 0.15, 0.25, 0.1], tiposExemplo))
      .toThrow('A soma dos pesos precisa ser igual a 1,00.')
  })
})
