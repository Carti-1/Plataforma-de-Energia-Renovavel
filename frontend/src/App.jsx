import { useEffect, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import './App.css'
import MapaVulnerabilidade from './components/MapaVulnerabilidade';
import { executarTopsisApi } from './services/topsisApi.js'
import { carregarDados } from './services/dadosApi.js'
import { exportarParaCSV } from './utils/exportRelatorio.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

function statusPorPosicao(position, total) {
  if (position === 0) return 'Menos vulnerável'
  if (position === total - 1) return 'Mais vulnerável'
  return 'Intermediário'
}

function rankingDaApi(resposta, municipios) {
  const lista = resposta.ranking
  return lista.map((item, position) => {
    const municipio = municipios.find((m) => m.name === item.municipio)
    return {
      ...municipio,
      score: item.ci,
      status: statusPorPosicao(position, lista.length),
    }
  })
}

const navigation = [
  { label: 'Visão geral', href: '#inicio', icon: '▦' },
  { label: 'Municípios', href: '#ranking', icon: '⌖' },
  { label: 'Mapa de municípios', href: '#mapa', icon: '◎' },
  { label: 'Configuração TOPSIS', href: '#config-topsis', icon: '◫' },
]

const chartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `Ci: ${context.parsed.x.toFixed(2).replace('.', ',')}`,
      },
    },
  },
  scales: {
    x: {
      min: 0,
      max: 1,
      grid: { color: '#edf1ec', drawTicks: false },
      border: { display: false },
      ticks: {
        stepSize: 0.25,
        color: '#a0aaa2',
        font: { size: 9 },
        callback: (value) => Number(value).toFixed(2).replace('.', ','),
      },
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#5d6b61', font: { size: 10 } },
    },
  },
}

function App() {
  const [activePage, setActivePage] = useState('Visão geral')
  const [search, setSearch] = useState('')
  const [municipios, setMunicipios] = useState([])
  const [criteria, setCriteria] = useState([])
  const [ranking, setRanking] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [analysisIsCurrent, setAnalysisIsCurrent] = useState(true)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    async function iniciar() {
      try {
        const dados = await carregarDados()
        setMunicipios(dados.municipios)
        setCriteria(dados.criteria)
        const resposta = await executarTopsisApi(dados.municipios, dados.criteria)
        setRanking(rankingDaApi(resposta, dados.municipios))
      } catch (error) {
        setApiError(error.message)
      } finally {
        setLoadingData(false)
      }
    }
    iniciar()
  }, [])

  const totalWeight = criteria.reduce((total, criterion) => total + criterion.weight, 0)

  function updateCriterion(id, field, value) {
    setCriteria((currentCriteria) =>
      currentCriteria.map((criterion) =>
        criterion.id === id ? { ...criterion, [field]: value } : criterion,
      ),
    )
    setAnalysisIsCurrent(false)
    setApiError(null)
  }

  async function handleConfigurationSubmit(event) {
    event.preventDefault()
    if (totalWeight !== 100) return

    setLoading(true)
    setApiError(null)
    try {
      const resposta = await executarTopsisApi(municipios, criteria)
      setRanking(rankingDaApi(resposta, municipios))
      setAnalysisIsCurrent(true)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => ({
    labels: ranking.map((item) => item.name),
    datasets: [{
      label: 'Coeficiente Ci',
      data: ranking.map((item) => item.score),
      backgroundColor: ranking.map((_, index) => index === 0 ? '#397557' : index === ranking.length - 1 ? '#c66d5d' : '#9fbea0'),
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 22,
    }],
  }), [ranking])

  const filteredRanking = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    if (!query) return ranking
    return ranking.filter((item) =>
      `${item.name} ${item.state}`.toLocaleLowerCase('pt-BR').includes(query),
    )
  }, [search, ranking])

  if (loadingData) return <p style={{ padding: 24 }}>Carregando dados...</p>

  if (ranking.length === 0) {
    return <p style={{ padding: 24 }}>{apiError || 'Nenhum dado encontrado no banco.'}</p>
  }

  const averageCi = ranking.reduce((total, item) => total + item.score, 0) / ranking.length
  const mostVulnerable = ranking[ranking.length - 1]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={() => setActivePage('Visão geral')}>
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>
            <strong>Energia</strong>
            <small>PLATAFORMA TOPSIS</small>
          </span>
        </a>

        <div className="workspace-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a
              className={`nav-link ${activePage === item.label ? 'active' : ''}`}
              href={item.href}
              key={item.label}
              onClick={() => setActivePage(item.label)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.label === 'Municípios' && <span className="nav-count">{ranking.length}</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">?</span>
            <strong>Como funciona?</strong>
            <p>O TOPSIS compara municípios usando critérios e pesos definidos pela equipe.</p>
            <a href="#config-topsis">Entenda os critérios <span aria-hidden="true">↗</span></a>
          </div>
          <div className="profile-row">
            <div className="avatar">EQ</div>
            <div className="profile-text"><strong>Equipe do projeto</strong><span>Pesquisador</span></div>
            <span className="profile-menu" aria-hidden="true">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="breadcrumb"><span>Plataforma</span><span className="crumb-separator">/</span><strong>{activePage}</strong></div>
          <div className="topbar-right">
            <span className="demo-badge"><i /> Exemplo numérico 7.3</span>
            <button className="icon-button" type="button" aria-label="Notificações">♧</button>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">VULNERABILIDADE SOCIAL ENERGÉTICA</p>
              <h1>Visão geral</h1>
              <p className="welcome-copy">Compare municípios usando os indicadores e o método TOPSIS do projeto.</p>
            </div>
            <a className="primary-button" href="#ranking"><span aria-hidden="true">＋</span> Ver municípios</a>
          </section>

          <section className="summary-grid" aria-label="Resumo dos indicadores">
            <article className="summary-card">
              <div className="card-heading"><span>Municípios analisados</span><span className="metric-icon green">⌖</span></div>
              <div className="metric-value">{ranking.length}</div>
              <div className="metric-foot"><span className="trend neutral">Exemplo do roteiro</span><span>3 municípios</span></div>
            </article>
            <article className="summary-card">
              <div className="card-heading"><span>Índice Ci médio</span><span className="metric-icon yellow">◉</span></div>
              <div className="metric-value">{averageCi.toFixed(2).replace('.', ',')} <small>/ 1,00</small></div>
              <div className="metric-foot"><span className="trend neutral">Média dos 3 exemplos</span><span>Ci maior = menos vulnerável</span></div>
            </article>
            <article className="summary-card">
              <div className="card-heading"><span>Critérios considerados</span><span className="metric-icon blue">◫</span></div>
              <div className="metric-value">{criteria.length}</div>
              <div className="metric-foot"><span className="trend neutral">3 benefícios</span><span>2 custos · exemplo</span></div>
            </article>
            <article className="summary-card highlight-card">
              <div className="card-heading"><span>Município mais vulnerável</span><span className="metric-icon red">↘</span></div>
              <div className="metric-value metric-name">{mostVulnerable.name}</div>
              <div className="metric-foot"><span className="trend danger">Ci {mostVulnerable.score.toFixed(2).replace('.', ',')}</span><span>menor proximidade</span></div>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
              <div><h2>Proximidade da solução ideal</h2><p>Calculado com a matriz do exemplo 7.3</p></div>
                <button className="select-button" type="button" onClick={() => document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth' })}>Ver ranking <span aria-hidden="true">⌄</span></button>
              </div>
              <div className="chart-legend"><span><i className="legend-dot" /> Índice Ci</span><span className="chart-note">Ci maior = menos vulnerável · resultado esperado: B &gt; A &gt; C</span></div>
              <div className="chart-canvas-wrap" role="img" aria-label="Gráfico de barras com os índices Ci dos três municípios do exemplo numérico">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </article>

          </section>

          <section className="panel config-panel" id="config-topsis">
            <div className="panel-heading config-heading">
              <div><h2>Configuração TOPSIS</h2><p>Defina o tipo e a importância relativa de cada indicador.</p></div>
              <div className={`weight-total ${totalWeight === 100 ? 'weight-total-valid' : ''}`}>
                <span>SOMA DOS PESOS</span>
                <strong>{totalWeight}% <small>/ 100%</small></strong>
              </div>
            </div>

            <form onSubmit={handleConfigurationSubmit}>
              <div className="criteria-config-list">
                {criteria.map((criterion) => (
                  <div className="criteria-config-row" key={criterion.id}>
                    <div className="criterion-details">
                      <span className={`criterion-code ${criterion.type}`}>{criterion.id}</span>
                      <span><strong>{criterion.name}</strong><small>{criterion.unit} · Fonte indicada: {criterion.source}</small></span>
                    </div>
                    <label className="criterion-type">
                      <span>Tipo de critério</span>
                      <select
                        value={criterion.type}
                        onChange={(event) => updateCriterion(criterion.id, 'type', event.target.value)}
                      >
                        <option value="beneficio">Benefício</option>
                        <option value="custo">Custo</option>
                      </select>
                    </label>
                    <label className="criterion-weight">
                      <span className="weight-label">Peso <output>{criterion.weight}%</output></span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={criterion.weight}
                        aria-label={`Peso do critério ${criterion.id}`}
                        onChange={(event) => updateCriterion(criterion.id, 'weight', Number(event.target.value))}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="config-footer">
                <div className="config-feedback" aria-live="polite">
                  {apiError ? (
                    <span className="config-error">{apiError}</span>
                  ) : analysisIsCurrent ? (
                    <span className="config-success">TOPSIS executado com sucesso. A configuração atual soma 100% (1,00).</span>
                  ) : totalWeight < 100 ? (
                    <span>Faltam {100 - totalWeight}% para completar a soma. O ranking exibido é da última execução.</span>
                  ) : totalWeight > 100 ? (
                    <span>A soma passou do limite em {totalWeight - 100}%. O ranking exibido é da última execução.</span>
                  ) : (
                    <span>Pesos alterados. Execute novamente para atualizar o ranking.</span>
                  )}
                </div>
                <button className="primary-button config-submit" type="submit" disabled={totalWeight !== 100 || loading}>
                  {loading ? 'Calculando...' : <>Executar TOPSIS <span aria-hidden="true">→</span></>}
                </button>
              </div>
            </form>
            <p className="config-note">Os pesos iniciais reproduzem o exemplo numérico 7.3 (C1–C5). Os critérios C6 e C7 do escopo geral não aparecem nessa matriz. Se alterar pesos ou tipos, clique em “Executar TOPSIS” para recalcular o ranking.</p>
          </section>

          <section className="panel map-panel" id="mapa">
            <div className="panel-heading">
              <div>
                <h2>Mapa de vulnerabilidade energética</h2>
                <p>Visualização georreferenciada com dados do PostGIS e resultados TOPSIS</p>
              </div>
              <span className="map-tech">Leaflet + PostGIS</span>
            </div>
            <div style={{ marginTop: '16px' }}>
              <MapaVulnerabilidade resultadosTopsis={ranking} />
            </div>
          </section>

          <section className="panel ranking-panel" id="ranking">
            <div className="panel-heading ranking-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div><h2>Ranking de municípios</h2><p>Municípios ordenados pelo índice Ci</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input 
                    value={search} 
                    onChange={(event) => setSearch(event.target.value)} 
                    placeholder="Buscar município" 
                    aria-label="Buscar município" 
                  />
                </label>

                <button 
                  className="primary-button" 
                  type="button" 
                  onClick={() => exportarParaCSV(filteredRanking)}
                  style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                >
                  <span aria-hidden="true">⬇</span> Exportar CSV
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>POSIÇÃO</th>
                    <th>MUNICÍPIO</th>
                    <th>UF</th>
                    <th>ÍNDICE Ci</th>
                    <th>LEITURA DEMONSTRATIVA</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRanking.map((item, index) => (
                    <tr key={item.name}>
                      <td><span className={`position ${index === 0 ? 'first-position' : ''}`}>{String(index + 1).padStart(2, '0')}</span></td>
                      <td><strong className="municipality-name">{item.name}</strong></td>
                      <td><span className="state-pill">{item.state}</span></td>
                      <td><strong>{item.score.toFixed(2).replace('.', ',')}</strong></td>
                      <td>
                        <span className={`status-pill ${item.status === 'Mais vulnerável' ? 'status-highest' : item.status === 'Intermediário' ? 'status-high' : 'status-medium'}`}>
                          <i />{item.status}
                        </span>
                      </td>
                      <td>
                        <button className="row-action" type="button" aria-label={`Ver detalhes de ${item.name}`}>→</button>
                      </td>
                    </tr>
                  ))}
                  {filteredRanking.length === 0 && (
                    <tr>
                      <td className="empty-state" colSpan="6">Nenhum município encontrado para “{search}”.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
  
            <div className="table-footer">
              <span>Exibindo {filteredRanking.length} de {ranking.length} municípios do exemplo 7.3</span>
              <button className="pagination-button" type="button" disabled>‹</button>
              <button className="pagination-button current-page" type="button">1</button>
              <button className="pagination-button" type="button" disabled>›</button>
            </div>
          </section>

          <footer className="page-footer"><span>Plataforma de Energia Renovável</span><span>Projeto acadêmico · Método TOPSIS</span></footer>
        </div>
      </main>
    </div>
  )
}

export default App
