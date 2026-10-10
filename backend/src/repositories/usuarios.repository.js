import { pool } from '../config/db.js'

const COLUNAS = 'id, nome, email, perfil, created_at'

export async function listarUsuarios() {
  const { rows } = await pool.query(`SELECT ${COLUNAS} FROM usuarios ORDER BY id`)
  return rows
}

export async function buscarUsuarioPorId(id) {
  const { rows } = await pool.query(`SELECT ${COLUNAS} FROM usuarios WHERE id = $1`, [id])
  return rows[0]
}

// Inclui o hash da senha: use apenas no login.
export async function buscarUsuarioPorEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS}, senha_hash FROM usuarios WHERE email = $1`,
    [email],
  )
  return rows[0]
}

export async function criarUsuario({ nome, email, senhaHash, perfil }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUNAS}`,
    [nome, email, senhaHash, perfil],
  )
  return rows[0]
}

export async function atualizarUsuario(id, { nome, perfil, senhaHash }) {
  const { rows } = await pool.query(
    `UPDATE usuarios
        SET nome = COALESCE($1, nome),
            perfil = COALESCE($2, perfil),
            senha_hash = COALESCE($3, senha_hash)
      WHERE id = $4
      RETURNING ${COLUNAS}`,
    [nome ?? null, perfil ?? null, senhaHash ?? null, id],
  )
  return rows[0]
}

export async function excluirUsuario(id) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Mantém o histórico de simulações, apenas sem autor.
    await client.query('UPDATE simulacoes SET usuario_id = NULL WHERE usuario_id = $1', [id])
    const { rows } = await client.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id])
    await client.query('COMMIT')
    return rows[0]
  } catch (erro) {
    await client.query('ROLLBACK')
    throw erro
  } finally {
    client.release()
  }
}
