const CHAVE_SESSAO = 'energia.sessao'

function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SESSAO))
  } catch {
    return null
  }
}

let sessao = lerSessao()

export function obterSessao() {
  return sessao
}

export function encerrarSessao() {
  sessao = null
  try {
    localStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // Sem localStorage a sessão vale apenas até recarregar a página.
  }
  window.dispatchEvent(new Event('sessao-encerrada'))
}

export async function entrar(email, senha) {
  let resposta
  try {
    resposta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
  } catch {
    throw new Error('Não foi possível conectar à API. O backend está rodando?')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(dados.erro || `Não foi possível entrar (HTTP ${resposta.status}).`)
  }

  sessao = { token: dados.token, usuario: dados.usuario }
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
  } catch {
    // Continua funcionando em memória.
  }
  return dados.usuario
}

// fetch que envia o token JWT. Se a API recusar o token (401), volta para a tela de login.
export async function authFetch(url, opcoes = {}) {
  const headers = { ...opcoes.headers }
  if (sessao?.token) {
    headers.Authorization = `Bearer ${sessao.token}`
  }

  const resposta = await fetch(url, { ...opcoes, headers })
  if (resposta.status === 401) {
    encerrarSessao()
  }
  return resposta
}
