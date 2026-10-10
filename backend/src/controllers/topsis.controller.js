import { topsis } from '../services/topsis.service.js'
import { pool } from '../config/db.js'

export async function executarTopsis(req, res) {
  const { municipios, pesos, tipos } = req.body ?? {}
  // O autor da simulação vem do token JWT, nunca do corpo da requisição.
  const usuarioId = req.usuario?.id ?? null

  if (!Array.isArray(municipios) || municipios.length === 0) {
    return res.status(400).json({ erro: 'Informe ao menos um município.' })
  }

  if (
    municipios.some((municipio) =>
      !municipio ||
      typeof municipio.nome !== 'string' ||
      !municipio.nome.trim() ||
      !Array.isArray(municipio.valores),
    )
  ) {
    return res.status(400).json({
      erro: 'Cada município precisa ter um nome e uma lista de valores.',
    })
  }

  try {
    const matriz = municipios.map((municipio) => municipio.valores)

    const resultado = topsis(matriz, pesos, tipos)

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const parametros = {
        pesos,
        tipos,
        municipios: municipios.map((municipio) => municipio.nome.trim()),
      }

      const simulacaoResult = await client.query(
        `INSERT INTO simulacoes
          (usuario_id, parametros, status)
         VALUES ($1, $2, 'concluida')
         RETURNING id, data_execucao, status`,
        [usuarioId, JSON.stringify(parametros)],
      )

      const simulacao = simulacaoResult.rows[0]

      for (const [indice, item] of resultado.entries()) {
        const municipio = municipios[item.indice]

        const municipioResult = await client.query(
          `SELECT id
             FROM municipios
            WHERE LOWER(nome) = LOWER($1)
            LIMIT 1`,
          [municipio.nome.trim()],
        )

        const municipioBanco = municipioResult.rows[0]

        if (municipioBanco) {
          await client.query(
            `INSERT INTO resultados_ranking
              (
                simulacao_id,
                municipio_id,
                coeficiente_ci,
                distancia_positiva,
                distancia_negativa,
                posicao
              )
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              simulacao.id,
              municipioBanco.id,
              item.ci,
              item.distanciaPositiva,
              item.distanciaNegativa,
              indice + 1,
            ],
          )
        }
      }

      await client.query('COMMIT')

      const ranking = resultado.map((item, indice) => ({
        posicao: indice + 1,
        municipio: municipios[item.indice].nome.trim(),
        ci: item.ci,
        distanciaPositiva: item.distanciaPositiva,
        distanciaNegativa: item.distanciaNegativa,
      }))

      return res.status(200).json({
        ranking,
        simulacao: {
          id: simulacao.id,
          dataExecucao: simulacao.data_execucao,
          status: simulacao.status,
        },
        metadata: {
          quantidadeMunicipios: municipios.length,
          quantidadeCriterios: pesos.length,
          interpretacao: 'Maior Ci indica menor vulnerabilidade.',
        },
      })
    } catch (erro) {
      await client.query('ROLLBACK')
      throw erro
    } finally {
      client.release()
    }
  } catch (erro) {
    console.error(erro)
    if (erro.code) {
      return res.status(503).json({
        erro: 'O cálculo foi feito, mas não foi possível salvar a simulação. Confira a conexão e a migração do banco.',
      })
    }
    return res.status(400).json({ erro: erro.message })
  }
}
