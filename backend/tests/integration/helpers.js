import { pool } from '../../src/config/db.js'
import { hashSenha } from '../../src/services/auth.service.js'

// Sufixo único por execução: evita colisão com dados reais e permite limpar só o que o teste criou.
export const SUFIXO = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
export const SENHA_TESTE = 'senha-de-teste-123'

export async function criarUsuarioTeste(perfil) {
  const email = `teste-${perfil}-${SUFIXO}@exemplo.com`
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [`Teste ${perfil}`, email, await hashSenha(SENHA_TESTE), perfil],
  )
  return { id: rows[0].id, email, senha: SENHA_TESTE }
}

export async function entrar(request, app, usuario) {
  const resposta = await request(app)
    .post('/api/auth/login')
    .send({ email: usuario.email, senha: usuario.senha })
  return resposta.body.token
}

export async function limparDadosDeTeste() {
  const emails = `teste-%-${SUFIXO}@exemplo.com`
  const nomes = `Teste-%-${SUFIXO}`

  await pool.query(
    `DELETE FROM resultados_ranking
      WHERE simulacao_id IN (
        SELECT id FROM simulacoes
         WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE $1))
         OR municipio_id IN (SELECT id FROM municipios WHERE nome LIKE $2)`,
    [emails, nomes],
  )
  await pool.query(
    'DELETE FROM simulacoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE $1)',
    [emails],
  )
  await pool.query(
    `DELETE FROM matriz_decisao
      WHERE municipio_id IN (SELECT id FROM municipios WHERE nome LIKE $1)
         OR criterio_id IN (SELECT id FROM criterios WHERE nome LIKE $1)`,
    [nomes],
  )
  await pool.query('DELETE FROM criterios WHERE nome LIKE $1', [nomes])
  await pool.query('DELETE FROM municipios WHERE nome LIKE $1', [nomes])
  await pool.query('DELETE FROM usuarios WHERE email LIKE $1', [emails])
}

export async function encerrarConexao() {
  await limparDadosDeTeste()
  await pool.end()
}
