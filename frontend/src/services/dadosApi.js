export async function carregarDados() {
  let resposta
  try {
    resposta = await fetch('/api/dados/topsis')
  } catch {
    throw new Error('Não foi possível conectar à API. O backend está rodando?')
  }
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro ao carregar dados (HTTP ${resposta.status}).`)
  }

  return {
    municipios: dados.municipios.map((m) => ({
      id: m.id,
      name: m.nome,
      state: m.uf === 'ND' ? '—' : m.uf,
      values: m.valores,
    })),
    criteria: dados.criterios.map((c, i) => ({
      id: `C${i + 1}`,
      name: c.nome,
      unit: c.unidade,
      source: c.fonte,
      type: c.tipo,
      weight: Math.round(c.peso * 100), // banco em fração, tela em %
    })),
  }
}