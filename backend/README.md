# API do backend

## Iniciar a API

No terminal, entre na pasta `backend` e execute:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000`. O modo `dev` reinicia o servidor quando um arquivo é alterado.

## Executar o TOPSIS

- Método: `POST`
- Endereço: `http://localhost:3000/api/topsis/executar`
- Tipo do corpo: `application/json`

Envie os municípios (com os valores na mesma ordem dos critérios), os pesos e os tipos:

```json
{
  "municipios": [
    { "nome": "Município A", "valores": [15, 0.8, 980, 0.75, 5.2] },
    { "nome": "Município B", "valores": [5, 2.1, 1850, 0.62, 5.8] },
    { "nome": "Município C", "valores": [22, 0.3, 650, 0.89, 4.9] }
  ],
  "pesos": [0.2, 0.2, 0.15, 0.25, 0.2],
  "tipos": ["custo", "beneficio", "beneficio", "custo", "beneficio"]
}
```

Os tipos e valores seguem o exemplo numérico 7.3 do roteiro: C1 e C4 são custos; C2, C3 e C5 são benefícios. Os pesos devem somar `1`.

O sucesso retorna `200` com `ranking` (posição, município, Ci e distâncias) e `metadata`. Para esse exemplo, o ranking esperado é **Município B > Município A > Município C**: um Ci maior representa menor vulnerabilidade. Dados ausentes ou inválidos retornam `400` com uma mensagem no campo `erro`.

## Integração com o frontend

O Vite encaminha caminhos que começam com `/api` para o backend na porta `3000`. Portanto, no frontend, a chamada deve usar o caminho relativo `/api/topsis/executar`. Durante o desenvolvimento, mantenha o frontend e o backend em execução, cada um em seu terminal.

Esta primeira rota calcula e devolve os resultados. Ela ainda não grava simulações no banco; essa etapa depende da configuração do PostgreSQL.
