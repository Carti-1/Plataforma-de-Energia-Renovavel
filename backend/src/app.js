import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { openapi } from './docs/openapi.js'
import topsisRoutes from './routes/topsis.routes.js'
import dadosRoutes from './routes/dados.routes.js'
import municipiosRoutes from './routes/municipios.routes.js'
import criteriosRoutes from './routes/criterios.routes.js'
import authRoutes from './routes/auth.routes.js'
import usuariosRoutes from './routes/usuarios.routes.js'
import simulacoesRoutes from './routes/simulacoes.routes.js'
import relatoriosRoutes from './routes/relatorios.routes.js'

const app = express()

app.use(express.json())
// Documentação interativa (Swagger UI). Fica em /api/ para passar pelo proxy do Vite e do nginx.
app.get('/api/docs.json', (_req, res) => res.json(openapi))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'API — Plataforma de Energia Renovável' }))

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/topsis', topsisRoutes)
app.use('/api/simulacoes', simulacoesRoutes)
app.use('/api/relatorios', relatoriosRoutes)
app.use('/api/dados', dadosRoutes)
app.use('/api/municipios', municipiosRoutes)
app.use('/api/criterios', criteriosRoutes)

// Converte JSON inválido em uma resposta compreensível para o frontend.
app.use((erro, req, res, next) => {
  if (erro instanceof SyntaxError && 'body' in erro) {
    return res.status(400).json({ erro: 'O corpo da requisição precisa ser um JSON válido.' })
  }

  return next(erro)
})

export default app
