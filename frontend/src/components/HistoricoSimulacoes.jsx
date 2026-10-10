import { useEffect, useState } from 'react'
import { baixarRelatorio, listarSimulacoes } from '../services/relatoriosApi.js'

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// `atualizarEm` muda a cada nova simulação salva e faz a lista recarregar.
export default function HistoricoSimulacoes({ atualizarEm }) {
  const [simulacoes, setSimulacoes] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    listarSimulacoes()
      .then((lista) => {
        if (ativo) {
          setSimulacoes(lista)
          setErro(null)
        }
      })
      .catch((falha) => ativo && setErro(falha.message))
    return () => {
      ativo = false
    }
  }, [atualizarEm])

  async function baixar(id, formato) {
    try {
      await baixarRelatorio(id, formato)
    } catch (falha) {
      alert(falha.message)
    }
  }

  return (
    <section className="panel history-panel" id="historico">
      <div className="panel-heading">
        <div>
          <h2>Histórico de simulações</h2>
          <p>As 10 execuções mais recentes do TOPSIS</p>
        </div>
      </div>

      {erro && <p className="history-empty">{erro}</p>}
      {!erro && simulacoes === null && <p className="history-empty">Carregando histórico...</p>}
      {!erro && simulacoes?.length === 0 && (
        <p className="history-empty">Nenhuma simulação salva ainda. Execute o TOPSIS na configuração acima.</p>
      )}

      {simulacoes?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Data</th>
                <th>Executada por</th>
                <th>Municípios</th>
                <th>Relatório</th>
              </tr>
            </thead>
            <tbody>
              {simulacoes.map((simulacao) => (
                <tr key={simulacao.id}>
                  <td>{simulacao.id}</td>
                  <td>{formatarData(simulacao.dataExecucao)}</td>
                  <td>{simulacao.usuario?.nome ?? '—'}</td>
                  <td>{simulacao.totalMunicipios}</td>
                  <td>
                    <button className="history-link" type="button" onClick={() => baixar(simulacao.id, 'pdf')}>PDF</button>
                    <button className="history-link" type="button" onClick={() => baixar(simulacao.id, 'csv')}>CSV</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
