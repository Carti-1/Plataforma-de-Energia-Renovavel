import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function testarConexao() {
  const { rows } = await pool.query('SELECT NOW() AS agora, postgis_version() AS postgis')
  return rows[0]
}