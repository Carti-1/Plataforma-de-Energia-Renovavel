import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT_EXPIRES_IN, JWT_SECRET, PERFIS } from '../config/auth.js'
import { ErroValidacao } from '../utils/erros.js'

const CUSTO_BCRYPT = Number(process.env.BCRYPT_ROUNDS) || 10
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const TAMANHO_MINIMO_SENHA = 8

// Usado para gastar o mesmo tempo quando o e-mail não existe (evita revelar quais e-mails estão cadastrados).
export const HASH_FALSO = bcrypt.hashSync('senha-que-nunca-sera-usada', CUSTO_BCRYPT)

export function hashSenha(senha) {
  return bcrypt.hash(senha, CUSTO_BCRYPT)
}

export function conferirSenha(senha, hash) {
  return bcrypt.compare(senha, hash)
}

export function gerarToken(usuario) {
  return jwt.sign({ perfil: usuario.perfil, nome: usuario.nome }, JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  })
}

export function usuarioPublico(usuario) {
  const { id, nome, email, perfil, created_at: criadoEm } = usuario
  return { id, nome, email, perfil, criadoEm }
}

/**
 * Valida os dados de um usuário. Na edição (parcial) os campos ausentes são ignorados.
 */
export function validarUsuario({ nome, email, senha, perfil }, { parcial = false } = {}) {
  if (!parcial || nome !== undefined) {
    if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 150) {
      throw new ErroValidacao('Informe um nome com até 150 caracteres.')
    }
  }

  if (!parcial || email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_VALIDO.test(email.trim()) || email.length > 255) {
      throw new ErroValidacao('Informe um e-mail válido.')
    }
  }

  if (!parcial || senha !== undefined) {
    if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO_SENHA) {
      throw new ErroValidacao(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
    }
  }

  if (!parcial || perfil !== undefined) {
    if (!PERFIS.includes(perfil)) {
      throw new ErroValidacao(`O perfil precisa ser um destes: ${PERFIS.join(', ')}.`)
    }
  }
}
