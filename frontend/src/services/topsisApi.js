import { authFetch } from './auth.js'

export async function executarTopsisApi(municipios, criteria) {
  const corpo = {
    municipios: municipios.map((m) => ({ nome: m.name, valores: m.values })),
    pesos: criteria.map((c) => c.weight / 100), // tela em %, API espera fração somando 1
    tipos: criteria.map((c) => c.type),         // "beneficio" ou "custo"
  }

  let resposta
  try {
    resposta = await authFetch('/api/topsis/executar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
  } catch {
    throw new Error('Não foi possível conectar à API. O backend está rodando?')
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro ao executar o TOPSIS (HTTP ${resposta.status}).`)
  }
  return dados
}