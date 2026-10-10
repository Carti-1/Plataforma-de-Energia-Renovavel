// Cria um usuário (por padrão, administrador). Não faz nada se o e-mail já existir.
//
//   npm run usuario:criar -- --nome "Maria" --email maria@exemplo.com --senha minhasenha123 --perfil administrador
//
// Também aceita as variáveis ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA (usadas pelo Docker Compose).
import { pool } from '../config/db.js'
import { hashSenha, validarUsuario } from '../services/auth.service.js'
import { buscarUsuarioPorEmail, criarUsuario } from '../repositories/usuarios.repository.js'

function argumento(nome) {
  const posicao = process.argv.indexOf(`--${nome}`)
  return posicao > -1 ? process.argv[posicao + 1] : undefined
}

const dados = {
  nome: argumento('nome') ?? process.env.ADMIN_NOME ?? 'Administrador',
  email: (argumento('email') ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(),
  senha: argumento('senha') ?? process.env.ADMIN_SENHA ?? '',
  perfil: argumento('perfil') ?? 'administrador',
}

try {
  if (!dados.email || !dados.senha) {
    console.log('Nenhum usuário criado: informe --email e --senha (ou ADMIN_EMAIL e ADMIN_SENHA).')
  } else {
    validarUsuario(dados)

    if (await buscarUsuarioPorEmail(dados.email)) {
      console.log(`O usuário ${dados.email} já existe. Nada a fazer.`)
    } else {
      await criarUsuario({ ...dados, senhaHash: await hashSenha(dados.senha) })
      console.log(`Usuário ${dados.email} criado com o perfil ${dados.perfil}.`)
    }
  }
} catch (erro) {
  console.error('Falha ao criar usuário:', erro.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
