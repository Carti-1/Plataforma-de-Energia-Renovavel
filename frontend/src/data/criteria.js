// Critérios C1-C5 e pesos usados no exemplo numérico 7.3 do roteiro.
// C6 e C7 seguem no escopo geral, mas não possuem dados nesse exemplo.
export const initialCriteria = [
  { id: 'C1', name: 'Domicílios sem acesso à eletricidade', unit: '%', source: 'IBGE', type: 'custo', weight: 20 },
  { id: 'C2', name: 'Capacidade instalada solar', unit: 'kW/hab', source: 'ANEEL', type: 'beneficio', weight: 20 },
  { id: 'C3', name: 'Renda per capita', unit: 'R$', source: 'IBGE', type: 'beneficio', weight: 15 },
  { id: 'C4', name: 'Tarifa média de energia', unit: 'R$/kWh', source: 'ANEEL', type: 'custo', weight: 25 },
  { id: 'C5', name: 'Índice de irradiação solar', unit: 'kWh/m²/dia', source: 'INPE', type: 'beneficio', weight: 20 },
]
