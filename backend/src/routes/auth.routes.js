import { Router } from 'express'
import { autenticar } from '../middlewares/auth.middleware.js'
import {
  HASH_FALSO,
  conferirSenha,
  gerarToken,
  usuarioPublico,
} from '../services/auth.service.js'
import { buscarUsuarioPorEmail, buscarUsuarioPorId } from '../repositories/usuarios.repository.js'
import { ErroValidacao, responderErro } from '../utils/erros.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body ?? {}
    if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
      throw new ErroValidacao('Informe e-mail e senha.')
    }

    const usuario = await buscarUsuarioPorEmail(email.trim().toLowerCase())
    const senhaCorreta = await conferirSenha(senha, usuario?.senha_hash ?? HASH_FALSO)

    if (!usuario || !senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    return res.status(200).json({ token: gerarToken(usuario), usuario: usuarioPublico(usuario) })
  } catch (erro) {
    return responderErro(res, erro, 'Não foi possível entrar.')
  }
})

// Dados do usuário logado (útil para o frontend validar o token salvo).
router.get('/eu', autenticar, async (req, res) => {
  try {
    const usuario = await buscarUsuarioPorId(req.usuario.id)
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado. Faça login novamente.' })
    }
    return res.status(200).json(usuarioPublico(usuario))
  } catch (erro) {
    return responderErro(res, erro)
  }
})

export default router
