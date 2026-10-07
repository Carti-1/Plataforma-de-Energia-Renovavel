import { pool } from '../config/db.js'

export async function listarCriteriosCrud() {
  const { rows } = await pool.query(
    `SELECT id, nome, descricao, tipo, peso, unidade
       FROM criterios
      ORDER BY id`,
  )

  return rows
}

export async function buscarCriterio(id) {
  const { rows } = await pool.query(
    `SELECT id, nome, descricao, tipo, peso, unidade
       FROM criterios
      WHERE id = $1`,
    [id],
  )

  return rows[0]
}

export async function criarCriterio({
  nome,
  descricao,
  tipo,
  peso,
  unidade,
}) {
  const { rows } = await pool.query(
    `INSERT INTO criterios
      (nome, descricao, tipo, peso, unidade)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nome, descricao, tipo, peso, unidade`,
    [nome, descricao, tipo, peso, unidade],
  )

  return rows[0]
}

export async function atualizarCriterio(
  id,
  { nome, descricao, tipo, peso, unidade },
) {
  const { rows } = await pool.query(
    `UPDATE criterios
        SET nome = $1,
            descricao = $2,
            tipo = $3,
            peso = $4,
            unidade = $5
      WHERE id = $6
      RETURNING id, nome, descricao, tipo, peso, unidade`,
    [nome, descricao, tipo, peso, unidade, id],
  )

  return rows[0]
}

export async function excluirCriterio(id) {
  const { rows } = await pool.query(
    `DELETE FROM criterios
      WHERE id = $1
      RETURNING id`,
    [id],
  )

  return rows[0]
}