import { pool, testarConexao } from '../config/db.js'

try {
  console.log('Conexão OK:', await testarConexao())
} catch (erro) {
  console.error('Falha na conexão:', erro.message)
} finally {
  await pool.end()
}