# Diagrama de implantação (Docker Compose)

```mermaid
flowchart LR
    nav["Navegador do usuário"]

    subgraph Compose["docker compose up --build"]
        subgraph c1["contêiner frontend (nginx), porta 8080"]
            estatico["Arquivos estáticos do build"]
            proxy["Proxy /api para o backend"]
        end
        subgraph c2["contêiner backend (Node 22), porta 3000"]
            api["API Express"]
        end
        subgraph c3["contêiner db (postgis/postgis:16), porta 5432"]
            pg[("PostgreSQL + PostGIS")]
        end
    end

    nav -- "HTTP :8080" --> estatico
    nav -- "/api/*" --> proxy
    proxy --> api
    api -- "SQL :5432" --> pg
    vol[("volume pgdata")] --- pg
```

Em produção, coloque um proxy HTTPS na frente do `frontend` e defina `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_SENHA` próprios (os padrões do Compose são só para estudo).
