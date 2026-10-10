# Documentação da API

A API é documentada com **OpenAPI 3** e exibida pelo **Swagger UI**.

- Interface interativa: `/api/docs` (ex.: <http://localhost:3000/api/docs> ou <http://localhost:8080/api/docs> no Docker)
- Especificação em JSON: `/api/docs.json`
- Código-fonte da especificação: [`backend/src/docs/openapi.js`](../../backend/src/docs/openapi.js)

A especificação é validada automaticamente nos testes (`npm test`, arquivo `backend/tests/openapi.test.js`).

## Como testar uma rota protegida

1. Em **Autenticação → POST /api/auth/login**, clique em *Try it out*, informe e-mail e senha e execute.
2. Copie o valor de `token` da resposta.
3. Clique em **Authorize** (cadeado, no topo) e cole o token.
4. Agora as demais rotas podem ser executadas pela própria página.
