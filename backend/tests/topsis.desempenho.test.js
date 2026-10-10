import { describe, expect, test } from '@jest/globals'
import { topsis } from '../src/services/topsis.service.js'

// RNF01: o cálculo do TOPSIS deve levar menos de 3 s para 500 alternativas.
describe('Desempenho do TOPSIS (RNF01)', () => {
  test('500 alternativas com os 7 critérios do roteiro em menos de 3 segundos', () => {
    const alternativas = 500
    const matriz = Array.from({ length: alternativas }, (_, i) =>
      Array.from({ length: 7 }, (_, j) => ((i * 31 + j * 17) % 997) + 1),
    )
    const pesos = [0.2, 0.15, 0.15, 0.1, 0.15, 0.15, 0.1]
    const tipos = ['custo', 'beneficio', 'beneficio', 'custo', 'beneficio', 'custo', 'beneficio']

    const inicio = performance.now()
    const resultado = topsis(matriz, pesos, tipos)
    const duracao = performance.now() - inicio

    expect(resultado).toHaveLength(alternativas)
    expect(duracao).toBeLessThan(3000)
  })
})
