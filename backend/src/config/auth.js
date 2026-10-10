import 'dotenv/config'

// Perfis de acesso (atores do roteiro): administrador, pesquisador e gestor público.
export const PERFIS = ['administrador', 'pesquisador', 'gestor']

const segredo = process.env.JWT_SECRET
if (!segredo || segredo.length < 16) {
  throw new Error(
    'Configure JWT_SECRET (mínimo de 16 caracteres) no arquivo backend/.env. ' +
      'Use backend/.env.example como modelo.',
  )
}

export const JWT_SECRET = segredo
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
