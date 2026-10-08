import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const variaveisObrigatorias = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
const variaveisAusentes = variaveisObrigatorias.filter((nome) => !process.env[nome])

if (variaveisAusentes.length > 0) {
  throw new Error(
    `Configure as variáveis ${variaveisAusentes.join(', ')} no arquivo backend/.env. ` +
      'Use backend/.env.example como modelo.',
  )
}

const porta = Number(process.env.DB_PORT)
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('DB_PORT precisa ser uma porta válida entre 1 e 65535.')
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: porta,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function testarConexao() {
  const { rows } = await pool.query('SELECT NOW() AS agora, postgis_version() AS postgis')
  return rows[0]
}
