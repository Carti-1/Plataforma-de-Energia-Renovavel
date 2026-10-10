import { Router } from 'express'
import { autenticar } from '../middlewares/auth.middleware.js'
import { buscarSimulacao, listarSimulacoes } from '../repositories/simulacoes.repository.js'
import { responderErro } from '../utils/erros.js'

const router = Router()

router.use(autenticar)

// Histórico de simulações (RF10), da mais recente para a mais antiga.
router.get('/', async (req, res) => {
  try {
    const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 20, 1), 100)
    res.status(200).json(await listarSimulacoes(limite))
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível listar as simulações.')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const resultado = await buscarSimulacao(req.params.id)

    if (!resultado) {
      return res.status(404).json({ erro: 'Simulação não encontrada.' })
    }

    return res.status(200).json(resultado)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível buscar a simulação.')
  }
})

export default router
