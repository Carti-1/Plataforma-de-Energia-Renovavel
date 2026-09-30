export function normalizar(matriz) {
  const denominadores = matriz[0].map((_, coluna) =>
    Math.sqrt(matriz.reduce((soma, linha) => soma + linha[coluna] ** 2, 0)),
  )

  return matriz.map((linha) =>
    linha.map((valor, coluna) => {
      const denominador = denominadores[coluna]
      return denominador === 0 ? 0 : valor / denominador
    }),
  )
}

export function calcularTopsis(matriz, pesos, tipos) {
  if (!matriz.length || !matriz[0].length) {
    throw new Error('A matriz de decisão precisa ter municípios e critérios.')
  }

  const quantidadeCriterios = matriz[0].length
  if (
    pesos.length !== quantidadeCriterios ||
    tipos.length !== quantidadeCriterios ||
    matriz.some((linha) => linha.length !== quantidadeCriterios)
  ) {
    throw new Error('Cada município precisa ter um valor para cada critério.')
  }

  if (matriz.some((linha) => linha.some((valor) => !Number.isFinite(valor)))) {
    throw new Error('Todos os valores da matriz precisam ser números válidos.')
  }

  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0)
  if (pesos.some((peso) => peso < 0) || Math.abs(somaPesos - 1) > 0.000001) {
    throw new Error('Os pesos precisam ser não negativos e somar 1,00.')
  }

  if (tipos.some((tipo) => !['beneficio', 'custo'].includes(tipo))) {
    throw new Error('Cada critério precisa ser do tipo benefício ou custo.')
  }

  // 1. Normalização vetorial.
  const normalizada = normalizar(matriz)

  // 2. Aplicação dos pesos à matriz normalizada.
  const ponderada = normalizada.map((linha) =>
    linha.map((valor, coluna) => valor * pesos[coluna]),
  )

  // 3–4. Soluções ideais positiva e negativa conforme o tipo do critério.
  const idealPositiva = pesos.map((_, coluna) => {
    const valores = ponderada.map((linha) => linha[coluna])
    return tipos[coluna] === 'beneficio' ? Math.max(...valores) : Math.min(...valores)
  })
  const idealNegativa = pesos.map((_, coluna) => {
    const valores = ponderada.map((linha) => linha[coluna])
    return tipos[coluna] === 'beneficio' ? Math.min(...valores) : Math.max(...valores)
  })

  // 5. Distâncias euclidianas de cada município às soluções ideais.
  const distanciaPositiva = ponderada.map((linha) =>
    Math.sqrt(linha.reduce((soma, valor, coluna) => soma + (valor - idealPositiva[coluna]) ** 2, 0)),
  )
  const distanciaNegativa = ponderada.map((linha) =>
    Math.sqrt(linha.reduce((soma, valor, coluna) => soma + (valor - idealNegativa[coluna]) ** 2, 0)),
  )

  // 6–7. Ci alto fica mais próximo da solução ideal positiva (menos vulnerável).
  return distanciaPositiva
    .map((distanciaMais, indice) => {
      const somaDistancias = distanciaMais + distanciaNegativa[indice]
      const ci = somaDistancias === 0 ? 0.5 : distanciaNegativa[indice] / somaDistancias
      return { indice, ci, distanciaPositiva: distanciaMais, distanciaNegativa: distanciaNegativa[indice] }
    })
    .sort((a, b) => b.ci - a.ci)
}
