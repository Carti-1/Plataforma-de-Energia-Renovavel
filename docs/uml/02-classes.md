# Diagrama de classes (modelo de domínio)

Reflete as tabelas do banco (`backend/migrations/001_initial_schema.sql`). `Usuario` e o histórico são complementos ao diagrama do roteiro.

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        +string senha_hash
        +string perfil
        +datetime created_at
    }
    class Municipio {
        +int id
        +string nome
        +string uf
        +int populacao
        +decimal idh
        +geometry coordenadas
        +datetime created_at
    }
    class Criterio {
        +int id
        +string nome
        +string descricao
        +string tipo
        +decimal peso
        +string unidade
    }
    class MatrizDecisao {
        +int id
        +decimal valor
        +int ano_referencia
    }
    class Simulacao {
        +int id
        +datetime data_execucao
        +json parametros
        +string status
    }
    class ResultadoRanking {
        +int id
        +decimal coeficiente_ci
        +decimal distancia_positiva
        +decimal distancia_negativa
        +int posicao
    }
    class TopsisService {
        +topsis(matriz, pesos, tipos) Ranking
    }

    Municipio "1" --> "*" MatrizDecisao : possui valores
    Criterio "1" --> "*" MatrizDecisao : é medido por
    Usuario "1" --> "*" Simulacao : executa
    Simulacao "1" --> "*" ResultadoRanking : gera
    Municipio "1" --> "*" ResultadoRanking : aparece em
    TopsisService ..> MatrizDecisao : lê
    TopsisService ..> Simulacao : produz
```

Valores possíveis: `Usuario.perfil` = `administrador`, `pesquisador` ou `gestor`; `Criterio.tipo` = `beneficio` ou `custo`. `TopsisService` é uma função pura (não depende do banco).
