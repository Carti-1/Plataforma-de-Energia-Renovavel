import { authFetch } from './auth.js'

async function lerErro(resposta, mensagemPadrao) {
  const dados = await resposta.json().catch(() => ({}))
  return new Error(dados.erro || `${mensagemPadrao} (HTTP ${resposta.status}).`)
}

export async function listarSimulacoes() {
  let resposta
  try {
    resposta = await authFetch('/api/simulacoes?limite=10')
  } catch {
    throw new Error('Não foi possível conectar à API. O backend está rodando?')
  }

  if (!resposta.ok) {
    throw await lerErro(resposta, 'Não foi possível carregar o histórico')
  }
  return resposta.json()
}

// O download passa pelo fetch porque a API exige o token no cabeçalho (um link simples não o enviaria).
export async function baixarRelatorio(simulacaoId, formato) {
  let resposta
  try {
    resposta = await authFetch(`/api/relatorios/${simulacaoId}/${formato}`)
  } catch {
    throw new Error('Não foi possível conectar à API. O backend está rodando?')
  }

  if (!resposta.ok) {
    throw await lerErro(resposta, 'Não foi possível gerar o relatório')
  }

  const url = URL.createObjectURL(await resposta.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-topsis-${simulacaoId}.${formato}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
