import { Router } from 'express'
import { autenticar, autorizar } from '../middlewares/auth.middleware.js'
import {
  listarCriteriosCrud,
  buscarCriterio,
  criarCriterio,
  atualizarCriterio,
  excluirCriterio,
} from '../repositories/criterios.repository.js'
import { responderErro } from '../utils/erros.js'

const router = Router()

router.use(autenticar)

router.get('/', async (_req, res) => {
  try {
    const criterios = await listarCriteriosCrud()
    res.status(200).json(criterios)
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível listar os critérios.')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const criterio = await buscarCriterio(req.params.id)

    if (!criterio) {
      return res.status(404).json({ erro: 'Critério não encontrado.' })
    }

    return res.status(200).json(criterio)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível buscar o critério.')
  }
})

// Configuração de critérios: UC02 do roteiro (ator: Pesquisador).
router.post('/', autorizar('administrador', 'pesquisador'), async (req, res) => {
  try {
    const criterio = await criarCriterio(req.body ?? {})
    return res.status(201).json(criterio)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível cadastrar o critério.')
  }
})

router.put('/:id', autorizar('administrador', 'pesquisador'), async (req, res) => {
  try {
    const criterio = await atualizarCriterio(req.params.id, req.body ?? {})

    if (!criterio) {
      return res.status(404).json({ erro: 'Critério não encontrado.' })
    }

    return res.status(200).json(criterio)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível atualizar o critério.')
  }
})

router.delete('/:id', autorizar('administrador', 'pesquisador'), async (req, res) => {
  try {
    const criterio = await excluirCriterio(req.params.id)

    if (!criterio) {
      return res.status(404).json({ erro: 'Critério não encontrado.' })
    }

    return res.status(204).send()
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível excluir o critério.')
  }
})

export default router
