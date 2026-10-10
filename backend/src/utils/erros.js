export class ErroValidacao extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.name = 'ErroValidacao'
  }
}

// Erros conhecidos do PostgreSQL traduzidos para respostas HTTP sem expor detalhes internos.
const ERROS_POSTGRES = {
  '23503': [409, 'Este registro está em uso por outros dados e não pode ser removido.'],
  '23505': [409, 'Já existe um registro com esses dados.'],
  '23502': [400, 'Há um campo obrigatório ausente.'],
  '22001': [400, 'Algum valor excede o tamanho permitido.'],
  '23514': [400, 'Algum valor não é permitido para o campo.'],
  '22P02': [400, 'Algum valor tem formato inválido.'],
  '22003': [400, 'Algum valor numérico está fora do intervalo permitido.'],
}

export function responderErro(res, erro, mensagemPadrao = 'Erro interno ao processar a requisição.') {
  if (erro instanceof ErroValidacao) {
    return res.status(400).json({ erro: erro.message })
  }

  const conhecido = ERROS_POSTGRES[erro?.code]
  if (conhecido) {
    return res.status(conhecido[0]).json({ erro: conhecido[1] })
  }

  console.error(erro)
  return res.status(500).json({ erro: mensagemPadrao })
}
