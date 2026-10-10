import { useEffect, useState } from 'react'
import App from './App.jsx'
import Login from './components/Login.jsx'
import { encerrarSessao, obterSessao } from './services/auth.js'

export default function Raiz() {
  const [usuario, setUsuario] = useState(obterSessao()?.usuario ?? null)

  // A API devolveu 401 (token expirado) ou o usuário clicou em "Sair".
  useEffect(() => {
    const aoEncerrar = () => setUsuario(null)
    window.addEventListener('sessao-encerrada', aoEncerrar)
    return () => window.removeEventListener('sessao-encerrada', aoEncerrar)
  }, [])

  if (!usuario) {
    return <Login onEntrar={setUsuario} />
  }

  return <App usuario={usuario} onSair={encerrarSessao} />
}
