# Backend da plataforma

API feita com Node.js e Express. O cálculo TOPSIS está em `src/services/topsis.service.js`; as rotas e repositórios acessam PostgreSQL. A leitura do banco exige que PostgreSQL, PostGIS, migração, credenciais e seed estejam prontos.

## Configurar a conexão

1. Copie `.env.example` para `.env` nesta pasta.
2. Para usar o banco do Compose, mantenha as configurações de exemplo. Para uma instalação nativa, ajuste `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.
3. Não compartilhe nem envie o arquivo `.env` ao Git.
4. Com Docker Desktop ativo, execute `docker compose up -d db` na raiz (sobe só o banco; para subir tudo use `docker compose up --build`). Na primeira criação do volume, o Compose executa a migração. Para instalação nativa, selecione a base indicada por `DB_NAME` no pgAdmin e execute `migrations/001_initial_schema.sql`.
5. Execute `npm run db:test`. A saída informa a versão do PostGIS; se falhar, confira o erro do terminal antes de abrir o frontend.
6. Execute `npm run db:seed` para inserir os três municípios, cinco critérios e valores do exemplo numérico 7.3.

Se a extensão ainda não estiver instalada, a migração falhará no comando `CREATE EXTENSION postgis`. Instale a extensão compatível com a versão do PostgreSQL e repita a migração na base correta.

## Iniciar e verificar

```bash
npm install
npm run dev
```

A API inicia em `http://localhost:3000`. Execute `npm test` para os testes unitários (não precisam de banco) e `npm run test:integration` para os testes de integração da API (precisam do PostgreSQL migrado; usam dados temporários que são removidos ao final).

## Autenticação e perfis

A API usa **JWT** (cabeçalho `Authorization: Bearer <token>`) e senhas com hash **bcrypt**. Defina `JWT_SECRET` (mínimo de 16 caracteres) no `.env`; sem ele a API não inicia.

Não há cadastro público: o administrador cria os usuários. Para criar o primeiro administrador:

```bash
npm run usuario:criar -- --nome "Maria" --email maria@exemplo.com --senha "uma-senha-forte" --perfil administrador
```

(ou preencha `ADMIN_EMAIL` e `ADMIN_SENHA` no `.env` e rode `npm run usuario:criar`).

| Perfil | Pode |
| --- | --- |
| `administrador` | Tudo: cadastrar municípios (UC01), critérios, usuários e executar o TOPSIS. |
| `pesquisador` | Consultar dados, configurar critérios (UC02) e executar o TOPSIS (UC03). |
| `gestor` | Consultar dados e executar o TOPSIS (UC03). |

## Rotas principais

| Método | Rota | Uso |
| --- | --- | --- |
| POST | `/api/auth/login` | Recebe `email` e `senha`; devolve o token JWT. Única rota pública. |
| GET | `/api/auth/eu` | Dados do usuário logado. |
| GET, POST, PUT, DELETE | `/api/usuarios` | Gestão de usuários e perfis (somente administrador). |
| GET | `/api/dados/topsis` | Lê municípios, matriz de decisão e critérios do banco. |
| POST | `/api/topsis/executar` | Calcula TOPSIS e grava a simulação e o ranking. |
| GET | `/api/municipios/geojson` | Devolve municípios com coordenadas como GeoJSON. |
| GET, POST, PUT, DELETE | `/api/municipios` | Lista, cadastra, atualiza ou remove municípios. |
| GET, POST, PUT, DELETE | `/api/criterios` | Lista, cadastra, atualiza ou remove critérios. |

O endpoint GeoJSON ignora municípios sem coordenadas. O seed do exemplo não inventa coordenadas para os municípios fictícios; por isso o mapa informa quando não há pontos disponíveis.

## Mensagens de erro do banco

Se uma consulta falhar, a API retorna uma mensagem de configuração conhecida e o terminal do backend registra o erro técnico. Verifique se o serviço PostgreSQL está ativo, as variáveis do `.env`, a existência das tabelas e a conclusão da migração/seed. O frontend oferece o botão “Tentar novamente” depois que a configuração for corrigida.
