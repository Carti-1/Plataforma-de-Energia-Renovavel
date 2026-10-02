import { topsis } from '../services/topsis.service.js'

/** Recebe a matriz enviada pelo frontend, executa o serviço e monta a resposta da API. */
export function executarTopsis(req, res) {
  const { municipios, pesos, tipos } = req.body ?? {}

  if (!Array.isArray(municipios) || municipios.length === 0) {
    return res.status(400).json({ erro: 'Informe ao menos um município.' })
  }

  if (municipios.some((municipio) =>
    !municipio || typeof municipio.nome !== 'string' || !municipio.nome.trim() ||
    !Array.isArray(municipio.valores),
  )) {
    return res.status(400).json({
      erro: 'Cada município precisa ter um nome e uma lista de valores.',
    })
  }

  try {
    const matriz = municipios.map((municipio) => municipio.valores)
    const resultado = topsis(matriz, pesos, tipos)
    const ranking = resultado.map((item, indice) => ({
      posicao: indice + 1,
      municipio: municipios[item.indice].nome.trim(),
      ci: item.ci,
      distanciaPositiva: item.distanciaPositiva,
      distanciaNegativa: item.distanciaNegativa,
    }))

    return res.status(200).json({
      ranking,
      metadata: {
        quantidadeMunicipios: municipios.length,
        quantidadeCriterios: pesos.length,
        interpretacao: 'Maior Ci indica menor vulnerabilidade.',
      },
    })
  } catch (erro) {
    return res.status(400).json({ erro: erro.message })
  }
}
