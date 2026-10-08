import { Router } from 'express'
import { buscarMatrizDecisao, listarCriterios } from '../repositories/dados.repository.js'

const router = Router()

router.get('/topsis', async (_req, res) => {
  try {
    const [municipios, criterios] = await Promise.all([buscarMatrizDecisao(), listarCriterios()])
    res.status(200).json({ municipios, criterios })
  } catch (erro) {
    console.error(erro)
    const mensagens = {
      ECONNREFUSED: 'O PostgreSQL não está acessível. Confira se o serviço está iniciado e DB_HOST/DB_PORT estão corretos.',
      ENOTFOUND: 'O endereço do PostgreSQL não foi encontrado. Confira DB_HOST no arquivo backend/.env.',
      '28P01': 'O PostgreSQL recusou a senha. Confira DB_USER e DB_PASSWORD no arquivo backend/.env.',
      '3D000': 'A base indicada em DB_NAME não existe. Crie a base e execute a migração inicial.',
      '42P01': 'As tabelas ainda não existem. Execute backend/migrations/001_initial_schema.sql e depois o seed.',
      '42883': 'Uma função necessária não existe. Confira se a extensão PostGIS foi instalada e ativada na base.',
      '42704': 'Um tipo ou objeto necessário não existe. Confira se a migração com PostGIS foi concluída.',
    }
    const mensagem = mensagens[erro.code] ||
      'Não foi possível consultar a base. Confira a conexão, a migração SQL e os dados iniciais; veja o terminal do backend para o detalhe.'

    res.status(503).json({ erro: mensagem })
  }
})

export default router
