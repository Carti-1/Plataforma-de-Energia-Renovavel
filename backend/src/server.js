import app from './app.js'

const porta = process.env.PORT || 3000

app.listen(porta, () => {
  console.log(`API disponível em http://localhost:${porta}`)
})
