import { Router } from 'express'
import { autenticar, autorizar } from '../middlewares/auth.middleware.js'
import { hashSenha, usuarioPublico, validarUsuario } from '../services/auth.service.js'
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '../repositories/usuarios.repository.js'
import { ErroValidacao, responderErro } from '../utils/erros.js'

const router = Router()

// Gerenciamento de usuários e perfis (RF08): somente administradores.
router.use(autenticar, autorizar('administrador'))

router.get('/', async (_req, res) => {
  try {
    const usuarios = await listarUsuarios()
    res.status(200).json(usuarios.map(usuarioPublico))
  } catch (erro) {
    responderErro(res, erro, 'Não foi possível listar os usuários.')
  }
})

router.post('/', async (req, res) => {
  try {
    const dados = req.body ?? {}
    validarUsuario(dados)

    const usuario = await criarUsuario({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senhaHash: await hashSenha(dados.senha),
      perfil: dados.perfil,
    })
    return res.status(201).json(usuarioPublico(usuario))
  } catch (erro) {
    return responderErro(res, erro)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const dados = req.body ?? {}
    validarUsuario(dados, { parcial: true })

    if (Number(req.params.id) === req.usuario.id && dados.perfil && dados.perfil !== 'administrador') {
      throw new ErroValidacao('Você não pode remover seu próprio perfil de administrador.')
    }

    const usuario = await atualizarUsuario(req.params.id, {
      nome: dados.nome?.trim(),
      perfil: dados.perfil,
      senhaHash: dados.senha ? await hashSenha(dados.senha) : undefined,
    })

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' })
    }
    return res.status(200).json(usuarioPublico(usuario))
  } catch (erro) {
    return responderErro(res, erro)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (Number(req.params.id) === req.usuario.id) {
      throw new ErroValidacao('Você não pode excluir o próprio usuário.')
    }

    const usuario = await excluirUsuario(req.params.id)
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' })
    }
    return res.status(204).send()
  } catch (erro) {
    return responderErro(res, erro)
  }
})

export default router
