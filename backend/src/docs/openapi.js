// Especificação OpenAPI 3.0 da API. Servida em /api/docs (interface) e /api/docs.json (JSON).

const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` })
const resposta = (nome) => ({ $ref: `#/components/responses/${nome}` })
const json = (schema) => ({ 'application/json': { schema } })
const idNaRota = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }

const erros = {
  400: resposta('DadosInvalidos'),
  401: resposta('NaoAutenticado'),
  403: resposta('SemPermissao'),
  404: resposta('NaoEncontrado'),
  409: resposta('Conflito'),
}
const usar = (...codigos) => Object.fromEntries(codigos.map((codigo) => [codigo, erros[codigo]]))

const mensagemErro = (exemplo) => ({
  type: 'object',
  properties: { erro: { type: 'string', example: exemplo } },
  required: ['erro'],
})

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'API — Plataforma de Energia Renovável (TOPSIS)',
    version: '1.0.0',
    description:
      'API REST para cadastrar municípios e critérios, executar o método TOPSIS e consultar o histórico de ' +
      'simulações e relatórios.\n\n' +
      '**Como testar aqui:** faça `POST /api/auth/login`, copie o `token` da resposta, clique em **Authorize** ' +
      'e cole o token (sem a palavra "Bearer").\n\n' +
      '**Perfis:** `administrador`, `pesquisador` e `gestor`. Cada operação indica quem pode usá-la.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Autenticação' },
    { name: 'Usuários' },
    { name: 'Municípios' },
    { name: 'Critérios' },
    { name: 'TOPSIS' },
    { name: 'Simulações' },
    { name: 'Relatórios' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Entrar',
        description: 'Única rota pública. Devolve o token JWT usado nas demais requisições.',
        security: [],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'senha'],
            properties: {
              email: { type: 'string', format: 'email', example: 'admin@energia.local' },
              senha: { type: 'string', format: 'password' },
            },
          }),
        },
        responses: {
          200: {
            description: 'Login realizado.',
            content: json({
              type: 'object',
              properties: { token: { type: 'string' }, usuario: ref('Usuario') },
            }),
          },
          400: erros[400],
          401: { description: 'E-mail ou senha incorretos.', content: json(ref('Erro')) },
        },
      },
    },
    '/api/auth/eu': {
      get: {
        tags: ['Autenticação'],
        summary: 'Dados do usuário logado',
        responses: { 200: { description: 'Usuário atual.', content: json(ref('Usuario')) }, ...usar(401) },
      },
    },

    '/api/usuarios': {
      get: {
        tags: ['Usuários'],
        summary: 'Listar usuários',
        description: 'Perfis permitidos: administrador.',
        responses: {
          200: { description: 'Lista de usuários.', content: json({ type: 'array', items: ref('Usuario') }) },
          ...usar(401, 403),
        },
      },
      post: {
        tags: ['Usuários'],
        summary: 'Criar usuário',
        description: 'Perfis permitidos: administrador. Não há cadastro público.',
        requestBody: { required: true, content: json(ref('UsuarioEntrada')) },
        responses: {
          201: { description: 'Usuário criado.', content: json(ref('Usuario')) },
          ...usar(400, 401, 403, 409),
        },
      },
    },
    '/api/usuarios/{id}': {
      put: {
        tags: ['Usuários'],
        summary: 'Alterar nome, perfil ou senha',
        description: 'Perfis permitidos: administrador. Todos os campos são opcionais. Não é possível rebaixar o próprio perfil.',
        parameters: [idNaRota],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              nome: { type: 'string' },
              perfil: { $ref: '#/components/schemas/Perfil' },
              senha: { type: 'string', format: 'password', minLength: 8 },
            },
          }),
        },
        responses: {
          200: { description: 'Usuário atualizado.', content: json(ref('Usuario')) },
          ...usar(400, 401, 403, 404),
        },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Excluir usuário',
        description: 'Perfis permitidos: administrador. Não é possível excluir o próprio usuário. O histórico de simulações é mantido, sem autor.',
        parameters: [idNaRota],
        responses: { 204: { description: 'Usuário excluído.' }, ...usar(400, 401, 403, 404) },
      },
    },

    '/api/municipios': {
      get: {
        tags: ['Municípios'],
        summary: 'Listar municípios',
        responses: {
          200: { description: 'Municípios cadastrados.', content: json({ type: 'array', items: ref('Municipio') }) },
          ...usar(401),
        },
      },
      post: {
        tags: ['Municípios'],
        summary: 'Cadastrar município (UC01)',
        description: 'Perfis permitidos: administrador. `latitude` e `longitude` são opcionais, mas necessárias para o mapa.',
        requestBody: { required: true, content: json(ref('MunicipioEntrada')) },
        responses: {
          201: { description: 'Município criado.', content: json(ref('Municipio')) },
          ...usar(400, 401, 403),
        },
      },
    },
    '/api/municipios/geojson': {
      get: {
        tags: ['Municípios'],
        summary: 'Municípios com coordenadas (GeoJSON)',
        description: 'Usado pelo mapa. Só inclui municípios que têm coordenadas.',
        responses: {
          200: {
            description: 'FeatureCollection de pontos.',
            content: json({
              type: 'object',
              properties: {
                type: { type: 'string', example: 'FeatureCollection' },
                features: { type: 'array', items: { type: 'object' } },
              },
            }),
          },
          ...usar(401),
        },
      },
    },
    '/api/municipios/{id}': {
      get: {
        tags: ['Municípios'],
        summary: 'Buscar município',
        parameters: [idNaRota],
        responses: { 200: { description: 'Município.', content: json(ref('Municipio')) }, ...usar(400, 401, 404) },
      },
      put: {
        tags: ['Municípios'],
        summary: 'Atualizar município',
        description: 'Perfis permitidos: administrador.',
        parameters: [idNaRota],
        requestBody: { required: true, content: json(ref('MunicipioEntrada')) },
        responses: {
          200: { description: 'Município atualizado.', content: json(ref('Municipio')) },
          ...usar(400, 401, 403, 404),
        },
      },
      delete: {
        tags: ['Municípios'],
        summary: 'Excluir município',
        description: 'Perfis permitidos: administrador.',
        parameters: [idNaRota],
        responses: { 204: { description: 'Município excluído.' }, ...usar(400, 401, 403, 404) },
      },
    },

    '/api/criterios': {
      get: {
        tags: ['Critérios'],
        summary: 'Listar critérios',
        responses: {
          200: { description: 'Critérios cadastrados.', content: json({ type: 'array', items: ref('Criterio') }) },
          ...usar(401),
        },
      },
      post: {
        tags: ['Critérios'],
        summary: 'Cadastrar critério (UC02)',
        description: 'Perfis permitidos: administrador e pesquisador.',
        requestBody: { required: true, content: json(ref('CriterioEntrada')) },
        responses: {
          201: { description: 'Critério criado.', content: json(ref('Criterio')) },
          ...usar(400, 401, 403),
        },
      },
    },
    '/api/criterios/{id}': {
      get: {
        tags: ['Critérios'],
        summary: 'Buscar critério',
        parameters: [idNaRota],
        responses: { 200: { description: 'Critério.', content: json(ref('Criterio')) }, ...usar(400, 401, 404) },
      },
      put: {
        tags: ['Critérios'],
        summary: 'Atualizar critério',
        description: 'Perfis permitidos: administrador e pesquisador.',
        parameters: [idNaRota],
        requestBody: { required: true, content: json(ref('CriterioEntrada')) },
        responses: {
          200: { description: 'Critério atualizado.', content: json(ref('Criterio')) },
          ...usar(400, 401, 403, 404),
        },
      },
      delete: {
        tags: ['Critérios'],
        summary: 'Excluir critério',
        description: 'Perfis permitidos: administrador e pesquisador. Falha com 409 se o critério tiver valores na matriz de decisão.',
        parameters: [idNaRota],
        responses: { 204: { description: 'Critério excluído.' }, ...usar(400, 401, 403, 404, 409) },
      },
    },

    '/api/dados/topsis': {
      get: {
        tags: ['TOPSIS'],
        summary: 'Matriz de decisão e critérios',
        description: 'Lê do banco os municípios com seus valores (na ordem dos critérios) e os critérios com tipo e peso.',
        responses: {
          200: {
            description: 'Dados para o cálculo.',
            content: json({
              type: 'object',
              properties: {
                municipios: { type: 'array', items: ref('MunicipioDaMatriz') },
                criterios: { type: 'array', items: ref('CriterioDaMatriz') },
              },
            }),
          },
          ...usar(401),
          503: { description: 'Banco de dados indisponível ou não migrado.', content: json(ref('Erro')) },
        },
      },
    },
    '/api/topsis/executar': {
      post: {
        tags: ['TOPSIS'],
        summary: 'Executar o TOPSIS (UC03)',
        description:
          'Perfis permitidos: todos os autenticados. Calcula o ranking e, por padrão, grava a simulação no histórico ' +
          'em nome do usuário do token. Use `"salvar": false` para apenas calcular.\n\n' +
          'Maior `ci` indica **menor** vulnerabilidade. Os pesos devem somar 1.',
        requestBody: { required: true, content: json(ref('ExecutarTopsisEntrada')) },
        responses: {
          200: { description: 'Ranking calculado.', content: json(ref('ExecutarTopsisResposta')) },
          ...usar(400, 401),
          503: { description: 'O cálculo foi feito, mas a simulação não pôde ser salva.', content: json(ref('Erro')) },
        },
      },
    },

    '/api/simulacoes': {
      get: {
        tags: ['Simulações'],
        summary: 'Histórico de simulações (RF10)',
        description: 'Da mais recente para a mais antiga.',
        parameters: [
          { name: 'limite', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: { description: 'Simulações salvas.', content: json({ type: 'array', items: ref('SimulacaoResumo') }) },
          ...usar(401),
        },
      },
    },
    '/api/simulacoes/{id}': {
      get: {
        tags: ['Simulações'],
        summary: 'Parâmetros e ranking de uma simulação',
        parameters: [idNaRota],
        responses: {
          200: {
            description: 'Simulação e ranking salvo.',
            content: json({
              type: 'object',
              properties: {
                simulacao: ref('SimulacaoResumo'),
                ranking: { type: 'array', items: ref('ItemRankingSalvo') },
              },
            }),
          },
          ...usar(400, 401, 404),
        },
      },
    },

    '/api/relatorios/{id}/pdf': {
      get: {
        tags: ['Relatórios'],
        summary: 'Relatório da simulação em PDF (UC04)',
        parameters: [idNaRota],
        responses: {
          200: { description: 'Arquivo PDF.', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
          ...usar(400, 401, 404),
        },
      },
    },
    '/api/relatorios/{id}/csv': {
      get: {
        tags: ['Relatórios'],
        summary: 'Relatório da simulação em CSV',
        description: 'Separador `;`, vírgula decimal e BOM UTF-8 (abre direto no Excel em português).',
        parameters: [idNaRota],
        responses: {
          200: { description: 'Arquivo CSV.', content: { 'text/csv': { schema: { type: 'string' } } } },
          ...usar(400, 401, 404),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    responses: {
      DadosInvalidos: { description: 'Dados inválidos.', content: json(mensagemErro('Informe e-mail e senha.')) },
      NaoAutenticado: {
        description: 'Token ausente, inválido ou expirado.',
        content: json(mensagemErro('Faça login para acessar este recurso.')),
      },
      SemPermissao: {
        description: 'O perfil do usuário não permite esta ação.',
        content: json(mensagemErro('Seu perfil não tem permissão para esta ação.')),
      },
      NaoEncontrado: { description: 'Registro não encontrado.', content: json(mensagemErro('Município não encontrado.')) },
      Conflito: {
        description: 'Conflito com dados existentes (registro duplicado ou em uso).',
        content: json(mensagemErro('Já existe um registro com esses dados.')),
      },
    },
    schemas: {
      Erro: mensagemErro('Mensagem explicando o problema.'),
      Perfil: { type: 'string', enum: ['administrador', 'pesquisador', 'gestor'] },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          perfil: ref('Perfil'),
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
      UsuarioEntrada: {
        type: 'object',
        required: ['nome', 'email', 'senha', 'perfil'],
        properties: {
          nome: { type: 'string', maxLength: 150 },
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', format: 'password', minLength: 8 },
          perfil: ref('Perfil'),
        },
      },
      Municipio: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          uf: { type: 'string', minLength: 2, maxLength: 2, example: 'BA' },
          populacao: { type: 'integer', nullable: true },
          idh: { type: 'string', nullable: true, description: 'Decimal devolvido como texto pelo PostgreSQL.', example: '0.700' },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
        },
      },
      MunicipioEntrada: {
        type: 'object',
        required: ['nome', 'uf'],
        properties: {
          nome: { type: 'string', maxLength: 200 },
          uf: { type: 'string', minLength: 2, maxLength: 2, example: 'BA' },
          populacao: { type: 'integer' },
          idh: { type: 'number', minimum: 0, maximum: 1 },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
      },
      Criterio: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          descricao: { type: 'string', nullable: true },
          tipo: { type: 'string', enum: ['beneficio', 'custo'] },
          peso: { type: 'string', description: 'Decimal devolvido como texto pelo PostgreSQL.', example: '0.2000' },
          unidade: { type: 'string', nullable: true },
        },
      },
      CriterioEntrada: {
        type: 'object',
        required: ['nome', 'tipo'],
        properties: {
          nome: { type: 'string', maxLength: 150 },
          descricao: { type: 'string' },
          tipo: { type: 'string', enum: ['beneficio', 'custo'] },
          peso: { type: 'number', minimum: 0, maximum: 1 },
          unidade: { type: 'string', maxLength: 50 },
        },
      },
      MunicipioDaMatriz: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          uf: { type: 'string' },
          valores: { type: 'array', items: { type: 'number' }, description: 'Um valor por critério, na ordem de `criterios`.' },
        },
      },
      CriterioDaMatriz: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          fonte: { type: 'string', nullable: true },
          tipo: { type: 'string', enum: ['beneficio', 'custo'] },
          peso: { type: 'number' },
          unidade: { type: 'string', nullable: true },
        },
      },
      ExecutarTopsisEntrada: {
        type: 'object',
        required: ['municipios', 'pesos', 'tipos'],
        properties: {
          municipios: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['nome', 'valores'],
              properties: { nome: { type: 'string' }, valores: { type: 'array', items: { type: 'number' } } },
            },
          },
          pesos: { type: 'array', items: { type: 'number' }, description: 'Um peso por critério; a soma deve ser 1.', example: [0.2, 0.2, 0.15, 0.25, 0.2] },
          tipos: { type: 'array', items: { type: 'string', enum: ['beneficio', 'custo'] }, example: ['custo', 'beneficio', 'beneficio', 'custo', 'beneficio'] },
          criterios: { type: 'array', items: { type: 'string' }, description: 'Opcional. Nomes dos critérios, usados no relatório.' },
          salvar: { type: 'boolean', default: true, description: 'Com `false`, calcula sem gravar no histórico.' },
        },
      },
      ExecutarTopsisResposta: {
        type: 'object',
        properties: {
          ranking: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                posicao: { type: 'integer' },
                municipio: { type: 'string' },
                ci: { type: 'number', description: 'Coeficiente de proximidade (0 a 1). Maior = menos vulnerável.' },
                distanciaPositiva: { type: 'number' },
                distanciaNegativa: { type: 'number' },
              },
            },
          },
          simulacao: {
            type: 'object',
            nullable: true,
            description: 'Nulo quando `salvar` é `false`.',
            properties: {
              id: { type: 'integer' },
              dataExecucao: { type: 'string', format: 'date-time' },
              status: { type: 'string', example: 'concluida' },
            },
          },
          metadata: {
            type: 'object',
            properties: {
              quantidadeMunicipios: { type: 'integer' },
              quantidadeCriterios: { type: 'integer' },
              interpretacao: { type: 'string' },
            },
          },
        },
      },
      SimulacaoResumo: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          dataExecucao: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          usuario: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, nome: { type: 'string' } } },
          parametros: { type: 'object', description: 'Pesos, tipos, nomes dos critérios e dos municípios usados.' },
          totalMunicipios: { type: 'integer', description: 'Presente apenas na listagem.' },
        },
      },
      ItemRankingSalvo: {
        type: 'object',
        properties: {
          posicao: { type: 'integer' },
          municipioId: { type: 'integer' },
          nome: { type: 'string' },
          uf: { type: 'string' },
          ci: { type: 'number' },
          distanciaPositiva: { type: 'number' },
          distanciaNegativa: { type: 'number' },
        },
      },
    },
  },
}
