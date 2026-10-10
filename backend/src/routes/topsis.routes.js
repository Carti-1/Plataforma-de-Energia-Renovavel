import { Router } from 'express'
import { autenticar } from '../middlewares/auth.middleware.js'
import { executarTopsis } from '../controllers/topsis.controller.js'

const router = Router()

// UC03: pesquisadores, gestores e administradores podem executar o TOPSIS.
router.use(autenticar)

router.post('/executar', executarTopsis)

export default router
