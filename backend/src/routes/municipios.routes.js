import { Router } from 'express'
import {
  listarMunicipios,
  buscarMunicipio,
  criarMunicipio,
  atualizarMunicipio,
  excluirMunicipio,
} from '../repositories/municipios.repository.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const municipios = await listarMunicipios()
    res.status(200).json(municipios)
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Não foi possível listar os municípios.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const municipio = await buscarMunicipio(req.params.id)

    if (!municipio) {
      return res.status(404).json({ erro: 'Município não encontrado.' })
    }

    return res.status(200).json(municipio)
  } catch (erro) {
    console.error(erro)
    return res.status(500).json({ erro: 'Não foi possível buscar o município.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const municipio = await criarMunicipio(req.body)
    return res.status(201).json(municipio)
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const municipio = await atualizarMunicipio(req.params.id, req.body)

    if (!municipio) {
      return res.status(404).json({ erro: 'Município não encontrado.' })
    }

    return res.status(200).json(municipio)
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const municipio = await excluirMunicipio(req.params.id)

    if (!municipio) {
      return res.status(404).json({ erro: 'Município não encontrado.' })
    }

    return res.status(204).send()
  } catch (erro) {
    console.error(erro)
    return res.status(400).json({ erro: erro.message })
  }
})

export default router