const TOLERANCIA_PESOS = 0.000001

/**
 * Normaliza um vetor ou cada coluna de uma matriz pela norma vetorial.
 * A forma de vetor também permite reproduzir o exemplo de normalização do roteiro.
 */
export function normalizar(valores) {
  if (!Array.isArray(valores) || valores.length === 0) {
    throw new Error('Informe um vetor ou uma matriz com valores.')
  }

  const recebeuVetor = !Array.isArray(valores[0])

  if (recebeuVetor) {
    if (valores.some((valor) => !Number.isFinite(valor))) {
      throw new Error('Todos os valores precisam ser números válidos.')
    }

    const norma = Math.sqrt(valores.reduce((soma, valor) => soma + valor ** 2, 0))
    return valores.map((valor) => (norma === 0 ? 0 : valor / norma))
  }

  const quantidadeColunas = valores[0].length
  if (
    quantidadeColunas === 0 ||
    valores.some((linha) =>
      !Array.isArray(linha) ||
      linha.length !== quantidadeColunas ||
      linha.some((valor) => !Number.isFinite(valor)),
    )
  ) {
    throw new Error('A matriz precisa ser retangular e conter apenas números válidos.')
  }

  const normas = valores[0].map((_, coluna) =>
    Math.sqrt(valores.reduce((soma, linha) => soma + linha[coluna] ** 2, 0)),
  )

  return valores.map((linha) =>
    linha.map((valor, coluna) => (normas[coluna] === 0 ? 0 : valor / normas[coluna])),
  )
}

/**
 * Executa os passos TOPSIS apresentados no roteiro e devolve o ranking
 * do maior Ci para o menor Ci (menos vulnerável para mais vulnerável).
 */
export function topsis(matriz, pesos, tipos) {
  if (!Array.isArray(matriz) || matriz.length === 0 || !Array.isArray(matriz[0])) {
    throw new Error('A matriz de decisão precisa conter municípios e critérios.')
  }

  const quantidadeCriterios = matriz[0].length
  if (
    quantidadeCriterios === 0 ||
    matriz.some((linha) => !Array.isArray(linha) || linha.length !== quantidadeCriterios) ||
    !Array.isArray(pesos) ||
    !Array.isArray(tipos) ||
    pesos.length !== quantidadeCriterios ||
    tipos.length !== quantidadeCriterios
  ) {
    throw new Error('Cada município precisa ter um valor, peso e tipo para cada critério.')
  }

  if (matriz.some((linha) => linha.some((valor) => !Number.isFinite(valor)))) {
    throw new Error('Todos os valores da matriz precisam ser números válidos.')
  }

  if (pesos.some((peso) => !Number.isFinite(peso) || peso < 0)) {
    throw new Error('Os pesos precisam ser números não negativos.')
  }

  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0)
  if (Math.abs(somaPesos - 1) > TOLERANCIA_PESOS) {
    throw new Error('A soma dos pesos precisa ser igual a 1,00.')
  }

  if (tipos.some((tipo) => !['beneficio', 'custo'].includes(tipo))) {
    throw new Error('Cada critério precisa ser do tipo beneficio ou custo.')
  }

  // Passo 1: normalização vetorial da matriz.
  const normalizada = normalizar(matriz)

  // Passo 2: multiplicação de cada coluna pelo peso correspondente.
  const ponderada = normalizada.map((linha) =>
    linha.map((valor, coluna) => valor * pesos[coluna]),
  )

  // Passo 3: ideal positiva usa máximo em benefício e mínimo em custo.
  const idealPositiva = pesos.map((_, coluna) => {
    const valoresColuna = ponderada.map((linha) => linha[coluna])
    return tipos[coluna] === 'beneficio'
      ? Math.max(...valoresColuna)
      : Math.min(...valoresColuna)
  })

  // Passo 4: ideal negativa usa mínimo em benefício e máximo em custo.
  const idealNegativa = pesos.map((_, coluna) => {
    const valoresColuna = ponderada.map((linha) => linha[coluna])
    return tipos[coluna] === 'beneficio'
      ? Math.min(...valoresColuna)
      : Math.max(...valoresColuna)
  })

  // Passo 5: distâncias Euclidianas até as soluções ideais.
  const distanciaPositiva = ponderada.map((linha) =>
    Math.sqrt(
      linha.reduce(
        (soma, valor, coluna) => soma + (valor - idealPositiva[coluna]) ** 2,
        0,
      ),
    ),
  )
  const distanciaNegativa = ponderada.map((linha) =>
    Math.sqrt(
      linha.reduce(
        (soma, valor, coluna) => soma + (valor - idealNegativa[coluna]) ** 2,
        0,
      ),
    ),
  )

  // Passos 6 e 7: calcula Ci e ordena do maior para o menor.
  return distanciaPositiva
    .map((distanciaMais, indice) => {
      const somaDistancias = distanciaMais + distanciaNegativa[indice]
      const ci = somaDistancias === 0
        ? 0.5
        : distanciaNegativa[indice] / somaDistancias

      return {
        indice,
        ci,
        distanciaPositiva: distanciaMais,
        distanciaNegativa: distanciaNegativa[indice],
      }
    })
    .sort((a, b) => b.ci - a.ci || a.indice - b.indice)
}
