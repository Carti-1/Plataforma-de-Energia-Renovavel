import { Router } from 'express'
import { buscarMatrizDecisao, listarCriterios } from '../repositories/dados.repository.js'

const router = Router()

router.get('/topsis', async (_req, res) => {
  try {
    const [municipios, criterios] = await Promise.all([buscarMatrizDecisao(), listarCriterios()])
    res.status(200).json({ municipios, criterios })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Não foi possível ler os dados do banco.' })
  }
})

export default router