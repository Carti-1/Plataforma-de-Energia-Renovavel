import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/auth.js'

// Exige o cabeçalho "Authorization: Bearer <token>" e preenche req.usuario.
export function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ')

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para acessar este recurso.' })
  }

  try {
    const dados = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    req.usuario = { id: Number(dados.sub), perfil: dados.perfil, nome: dados.nome }
    return next()
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
  }
}

// Libera a rota somente para os perfis informados. Use depois de autenticar.
export function autorizar(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario?.perfil)) {
      return res.status(403).json({ erro: 'Seu perfil não tem permissão para esta ação.' })
    }
    return next()
  }
}
