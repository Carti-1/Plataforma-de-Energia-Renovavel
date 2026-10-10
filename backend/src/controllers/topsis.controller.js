import { topsis } from '../services/topsis.service.js'
import { pool } from '../config/db.js'

function validarCorpo({ municipios }) {
  if (!Array.isArray(municipios) || municipios.length === 0) {
    return 'Informe ao menos um município.'
  }

  const invalido = municipios.some(
    (municipio) =>
      !municipio ||
      typeof municipio.nome !== 'string' ||
      !municipio.nome.trim() ||
      !Array.isArray(municipio.valores),
  )

  return invalido ? 'Cada município precisa ter um nome e uma lista de valores.' : null
}

// Nomes dos critérios são opcionais e só servem para deixar o relatório legível.
function nomesDosCriterios(criterios, quantidade) {
  const validos =
    Array.isArray(criterios) &&
    criterios.length === quantidade &&
    criterios.every((nome) => typeof nome === 'string')

  return validos ? criterios.map((nome) => nome.trim().slice(0, 150)) : null
}

async function salvarSimulacao({ usuarioId, parametros, resultado, municipios }) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO simulacoes
        (usuario_id, parametros, status)
       VALUES ($1, $2, 'concluida')
       RETURNING id, data_execucao, status`,
      [usuarioId, JSON.stringify(parametros)],
    )
    const simulacao = rows[0]

    for (const [indice, item] of resultado.entries()) {
      const nome = municipios[item.indice].nome.trim()
      const { rows: encontrados } = await client.query(
        'SELECT id FROM municipios WHERE LOWER(nome) = LOWER($1) LIMIT 1',
        [nome],
      )

      // Municípios que não estão cadastrados no banco entram no ranking da resposta, mas não no histórico.
      if (encontrados[0]) {
        await client.query(
          `INSERT INTO resultados_ranking
            (simulacao_id, municipio_id, coeficiente_ci, distancia_positiva, distancia_negativa, posicao)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            simulacao.id,
            encontrados[0].id,
            item.ci,
            item.distanciaPositiva,
            item.distanciaNegativa,
            indice + 1,
          ],
        )
      }
    }

    await client.query('COMMIT')
    return simulacao
  } catch (erro) {
    await client.query('ROLLBACK')
    throw erro
  } finally {
    client.release()
  }
}

export async function executarTopsis(req, res) {
  const { municipios, pesos, tipos, criterios, salvar = true } = req.body ?? {}
  // O autor da simulação vem do token JWT, nunca do corpo da requisição.
  const usuarioId = req.usuario?.id ?? null

  const problema = validarCorpo({ municipios })
  if (problema) {
    return res.status(400).json({ erro: problema })
  }

  let resultado
  try {
    resultado = topsis(
      municipios.map((municipio) => municipio.valores),
      pesos,
      tipos,
    )
  } catch (erro) {
    return res.status(400).json({ erro: erro.message })
  }

  // "salvar: false" calcula sem gravar histórico (usado pela tela ao carregar).
  let simulacao = null
  if (salvar !== false) {
    const parametros = {
      pesos,
      tipos,
      criterios: nomesDosCriterios(criterios, pesos.length),
      municipios: municipios.map((municipio) => municipio.nome.trim()),
    }

    try {
      simulacao = await salvarSimulacao({ usuarioId, parametros, resultado, municipios })
    } catch (erro) {
      console.error(erro)
      return res.status(503).json({
        erro: 'O cálculo foi feito, mas não foi possível salvar a simulação. Confira a conexão e a migração do banco.',
      })
    }
  }

  return res.status(200).json({
    ranking: resultado.map((item, indice) => ({
      posicao: indice + 1,
      municipio: municipios[item.indice].nome.trim(),
      ci: item.ci,
      distanciaPositiva: item.distanciaPositiva,
      distanciaNegativa: item.distanciaNegativa,
    })),
    simulacao: simulacao
      ? { id: simulacao.id, dataExecucao: simulacao.data_execucao, status: simulacao.status }
      : null,
    metadata: {
      quantidadeMunicipios: municipios.length,
      quantidadeCriterios: pesos.length,
      interpretacao: 'Maior Ci indica menor vulnerabilidade.',
    },
  })
}
