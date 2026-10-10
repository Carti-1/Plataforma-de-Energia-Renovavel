import { Router } from 'express'
import { autenticar, autorizar } from '../middlewares/auth.middleware.js'
import {
  listarMunicipios,
  listarMunicipiosGeoJSON,
  buscarMunicipio,
  criarMunicipio,
  atualizarMunicipio,
  excluirMunicipio,
} from '../repositories/municipios.repository.js'
import { responderErro } from '../utils/erros.js'

const router = Router()

router.use(autenticar)

router.get('/geojson', async (_req, res) => {
  try {
    const geojson = await listarMunicipiosGeoJSON()
    return res.status(200).json(geojson)
  } catch (erro) {
    console.error(erro)
    return res.status(503).json({ erro: 'Não foi possível carregar as coordenadas. Confira a conexão com o PostgreSQL e o PostGIS.' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const municipios = await listarMunicipios()
    res.status(200).json(municipios)
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível listar os municípios.')
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
    return responderErro(res, erro, 'Não foi possível buscar o município.')
  }
})

// Cadastro de municípios: UC01 do roteiro (ator: Administrador).
router.post('/', autorizar('administrador'), async (req, res) => {
  try {
    const municipio = await criarMunicipio(req.body ?? {})
    return res.status(201).json(municipio)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível cadastrar o município.')
  }
})

router.put('/:id', autorizar('administrador'), async (req, res) => {
  try {
    const municipio = await atualizarMunicipio(req.params.id, req.body ?? {})

    if (!municipio) {
      return res.status(404).json({ erro: 'Município não encontrado.' })
    }

    return res.status(200).json(municipio)
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível atualizar o município.')
  }
})

router.delete('/:id', autorizar('administrador'), async (req, res) => {
  try {
    const municipio = await excluirMunicipio(req.params.id)

    if (!municipio) {
      return res.status(404).json({ erro: 'Município não encontrado.' })
    }

    return res.status(204).send()
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível excluir o município.')
  }
})

export default router
