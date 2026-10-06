import express from 'express'
import topsisRoutes from './routes/topsis.routes.js'
import dadosRoutes from './routes/dados.routes.js'

const app = express()

app.use(express.json())
app.use('/api/topsis', topsisRoutes)
app.use('/api/dados', dadosRoutes)

// Converte JSON inválido em uma resposta compreensível para o frontend.
app.use((erro, req, res, next) => {
  if (erro instanceof SyntaxError && 'body' in erro) {
    return res.status(400).json({ erro: 'O corpo da requisição precisa ser um JSON válido.' })
  }

  return next(erro)
})

export default app
