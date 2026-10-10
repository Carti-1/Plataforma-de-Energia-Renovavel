# Diagrama de sequência: executar o TOPSIS

```mermaid
sequenceDiagram
    actor U as Pesquisador
    participant F as Frontend (React)
    participant A as API (Express)
    participant M as Middleware JWT
    participant C as TopsisController
    participant S as TopsisService
    participant DB as PostgreSQL

    U->>F: Clica em "Executar TOPSIS"
    F->>A: POST /api/topsis/executar (Bearer token)
    A->>M: autenticar()
    alt token ausente, inválido ou expirado
        M-->>F: 401
        F-->>U: Volta para a tela de login
    else token válido
        M->>C: executarTopsis(req) com req.usuario
        C->>S: topsis(matriz, pesos, tipos)
        S->>S: normalizar, ponderar, A+, A-, distâncias, Ci
        alt dados inválidos (ex.: pesos não somam 1)
            S-->>C: erro
            C-->>F: 400 com a mensagem
        else cálculo concluído
            S-->>C: ranking ordenado por Ci
            C->>DB: BEGIN, INSERT simulacoes, INSERT resultados_ranking, COMMIT
            DB-->>C: id da simulação
            C-->>F: 200 {ranking, simulacao, metadata}
            F-->>U: Atualiza ranking, gráfico, mapa e histórico
        end
    end
```

O usuário que consta na simulação vem do token, nunca do corpo da requisição. Com `"salvar": false`, o controlador calcula e responde sem gravar no banco (usado ao abrir a página).
