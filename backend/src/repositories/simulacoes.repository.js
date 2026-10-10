import { pool } from '../config/db.js'

const CAMPOS_SIMULACAO = `s.id, s.data_execucao, s.status, s.usuario_id, u.nome AS usuario_nome, s.parametros`

function formatarSimulacao(linha) {
  return {
    id: linha.id,
    dataExecucao: linha.data_execucao,
    status: linha.status,
    usuario: linha.usuario_id ? { id: linha.usuario_id, nome: linha.usuario_nome } : null,
    parametros: linha.parametros,
  }
}

export async function listarSimulacoes(limite = 50) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS_SIMULACAO},
            (SELECT COUNT(*)::int FROM resultados_ranking r WHERE r.simulacao_id = s.id) AS total_municipios
       FROM simulacoes s
       LEFT JOIN usuarios u ON u.id = s.usuario_id
      ORDER BY s.data_execucao DESC, s.id DESC
      LIMIT $1`,
    [limite],
  )

  return rows.map((linha) => ({
    ...formatarSimulacao(linha),
    totalMunicipios: linha.total_municipios,
  }))
}

export async function buscarSimulacao(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS_SIMULACAO}
       FROM simulacoes s
       LEFT JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.id = $1`,
    [id],
  )

  if (!rows[0]) {
    return undefined
  }

  const { rows: resultados } = await pool.query(
    `SELECT r.posicao, r.municipio_id, m.nome, m.uf,
            r.coeficiente_ci, r.distancia_positiva, r.distancia_negativa
       FROM resultados_ranking r
       JOIN municipios m ON m.id = r.municipio_id
      WHERE r.simulacao_id = $1
      ORDER BY r.posicao`,
    [id],
  )

  return {
    simulacao: formatarSimulacao(rows[0]),
    ranking: resultados.map((r) => ({
      posicao: r.posicao,
      municipioId: r.municipio_id,
      nome: r.nome,
      uf: r.uf,
      ci: Number(r.coeficiente_ci),
      distanciaPositiva: Number(r.distancia_positiva),
      distanciaNegativa: Number(r.distancia_negativa),
    })),
  }
}
