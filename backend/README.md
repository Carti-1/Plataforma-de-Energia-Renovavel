# Backend da plataforma

API feita com Node.js e Express. O cálculo TOPSIS está em `src/services/topsis.service.js`; as rotas e repositórios acessam PostgreSQL. A leitura do banco exige que PostgreSQL, PostGIS, migração, credenciais e seed estejam prontos.

## Configurar a conexão

1. Copie `.env.example` para `.env` nesta pasta.
2. Para usar o banco do Compose, mantenha as configurações de exemplo. Para uma instalação nativa, ajuste `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.
3. Não compartilhe nem envie o arquivo `.env` ao Git.
4. Com Docker Desktop ativo, execute `docker compose up -d` na raiz. Na primeira criação do volume, o Compose executa a migração. Para instalação nativa, selecione a base indicada por `DB_NAME` no pgAdmin e execute `migrations/001_initial_schema.sql`.
5. Execute `npm run db:test`. A saída informa a versão do PostGIS; se falhar, confira o erro do terminal antes de abrir o frontend.
6. Execute `npm run db:seed` para inserir os três municípios, cinco critérios e valores do exemplo numérico 7.3.

Se a extensão ainda não estiver instalada, a migração falhará no comando `CREATE EXTENSION postgis`. Instale a extensão compatível com a versão do PostgreSQL e repita a migração na base correta.

## Iniciar e verificar

```bash
npm install
npm run dev
```

A API inicia em `http://localhost:3000`. Para os testes unitários do algoritmo, execute `npm test`.

## Rotas principais

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/api/dados/topsis` | Lê municípios, matriz de decisão e critérios do banco. |
| POST | `/api/topsis/executar` | Calcula TOPSIS e grava a simulação e o ranking. |
| GET | `/api/municipios/geojson` | Devolve municípios com coordenadas como GeoJSON. |
| GET, POST, PUT, DELETE | `/api/municipios` | Lista, cadastra, atualiza ou remove municípios. |
| GET, POST, PUT, DELETE | `/api/criterios` | Lista, cadastra, atualiza ou remove critérios. |

O endpoint GeoJSON ignora municípios sem coordenadas. O seed do exemplo não inventa coordenadas para os municípios fictícios; por isso o mapa informa quando não há pontos disponíveis.

## Mensagens de erro do banco

Se uma consulta falhar, a API retorna uma mensagem de configuração conhecida e o terminal do backend registra o erro técnico. Verifique se o serviço PostgreSQL está ativo, as variáveis do `.env`, a existência das tabelas e a conclusão da migração/seed. O frontend oferece o botão “Tentar novamente” depois que a configuração for corrigida.
