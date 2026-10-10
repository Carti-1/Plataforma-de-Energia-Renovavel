import { useState } from 'react'
import { entrar } from '../services/auth.js'

export default function Login({ onEntrar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      onEntrar(await entrar(email.trim(), senha))
    } catch (falha) {
      setErro(falha.message)
      setCarregando(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>
            <strong>Energia</strong>
            <small>PLATAFORMA TOPSIS</small>
          </span>
        </div>

        <h1>Entrar</h1>
        <p className="login-copy">Acesse com o e-mail e a senha fornecidos pelo administrador.</p>

        <label className="login-field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>

        <label className="login-field">
          <span>Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {erro && <p className="login-error" role="alert">{erro}</p>}

        <button className="primary-button login-submit" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
