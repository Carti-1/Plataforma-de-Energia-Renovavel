import { describe, expect, test } from '@jest/globals'
import jwt from 'jsonwebtoken'
import {
  conferirSenha,
  gerarToken,
  hashSenha,
  usuarioPublico,
  validarUsuario,
} from '../src/services/auth.service.js'

const usuarioValido = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com',
  senha: 'senha-segura-123',
  perfil: 'pesquisador',
}

describe('Serviço de autenticação', () => {
  test('o hash da senha usa bcrypt e confere somente com a senha original', async () => {
    const hash = await hashSenha('minha-senha-123')

    expect(hash).toMatch(/^\$2[aby]\$/)
    expect(hash).not.toContain('minha-senha-123')
    await expect(conferirSenha('minha-senha-123', hash)).resolves.toBe(true)
    await expect(conferirSenha('outra-senha', hash)).resolves.toBe(false)
  })

  test('o token JWT leva id, perfil e nome, e tem prazo de validade', () => {
    const token = gerarToken({ id: 7, nome: 'Maria', perfil: 'gestor' })
    const dados = jwt.decode(token)

    expect(dados.sub).toBe('7')
    expect(dados.perfil).toBe('gestor')
    expect(dados.nome).toBe('Maria')
    expect(dados.exp).toBeGreaterThan(dados.iat)
  })

  test('o usuário público não expõe o hash da senha', () => {
    const publico = usuarioPublico({ id: 1, nome: 'A', email: 'a@b.co', perfil: 'gestor', senha_hash: 'segredo' })

    expect(publico).not.toHaveProperty('senha_hash')
    expect(publico).toMatchObject({ id: 1, email: 'a@b.co' })
  })

  test('aceita um usuário válido', () => {
    expect(() => validarUsuario(usuarioValido)).not.toThrow()
  })

  test.each([
    ['nome vazio', { nome: '  ' }, /nome/i],
    ['e-mail inválido', { email: 'sem-arroba' }, /e-mail/i],
    ['senha curta', { senha: '1234567' }, /senha/i],
    ['perfil inexistente', { perfil: 'superusuario' }, /perfil/i],
  ])('rejeita %s', (_descricao, alteracao, mensagem) => {
    expect(() => validarUsuario({ ...usuarioValido, ...alteracao })).toThrow(mensagem)
  })

  test('na edição parcial ignora campos ausentes, mas valida os informados', () => {
    expect(() => validarUsuario({ perfil: 'gestor' }, { parcial: true })).not.toThrow()
    expect(() => validarUsuario({ perfil: 'x' }, { parcial: true })).toThrow(/perfil/i)
  })
})
