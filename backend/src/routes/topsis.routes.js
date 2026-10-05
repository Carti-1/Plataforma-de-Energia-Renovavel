import { Router } from 'express'
import { executarTopsis } from '../controllers/topsis.controller.js'

const router = Router()

router.post('/executar', executarTopsis)

export default router
