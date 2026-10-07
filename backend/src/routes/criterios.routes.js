import { Router } from 'express'
import {
  listarCriteriosCrud,
  buscarCriterio,
  criarCriterio,
  atualizarCriterio,
  excluirCriterio,
} from '../repositories/criterios.repository.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const criterios = await listarCriteriosCrud()
    res.status(200).json(criterios)
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Não foi possível listar os critérios.' })
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
    console.error(erro)
    return res.status(500).json({ erro: 'Não foi possível buscar o critério.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const criterio = await criarCriterio(req.body)
    return res.status(201).json(criterio)
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const criterio = await atualizarCriterio(req.params.id, req.body)

    if (!criterio) {
      return res.status(404).json({ erro: 'Critério não encontrado.' })
    }

    return res.status(200).json(criterio)
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const criterio = await excluirCriterio(req.params.id)

    if (!criterio) {
      return res.status(404).json({ erro: 'Critério não encontrado.' })
    }

    return res.status(204).send()
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

export default router