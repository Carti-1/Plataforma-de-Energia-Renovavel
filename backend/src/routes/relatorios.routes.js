import { Router } from 'express'
import { autenticar } from '../middlewares/auth.middleware.js'
import { buscarSimulacao } from '../repositories/simulacoes.repository.js'
import { escreverPdf, gerarCsv } from '../services/relatorio.service.js'
import { responderErro } from '../utils/erros.js'

const router = Router()

router.use(autenticar)

// UC04: exportar o relatório de uma simulação em PDF ou CSV (RF06).
async function carregar(req, res) {
  const dados = await buscarSimulacao(req.params.id)

  if (!dados) {
    res.status(404).json({ erro: 'Simulação não encontrada.' })
    return null
  }

  return dados
}

router.get('/:id/pdf', async (req, res) => {
  try {
    const dados = await carregar(req, res)
    if (!dados) return

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-topsis-${dados.simulacao.id}.pdf"`)
    escreverPdf(dados, res)
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível gerar o relatório em PDF.')
  }
})

router.get('/:id/csv', async (req, res) => {
  try {
    const dados = await carregar(req, res)
    if (!dados) return

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-topsis-${dados.simulacao.id}.csv"`)
    res.status(200).send(gerarCsv(dados))
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível gerar o relatório em CSV.')
  }
})

export default router
