# Plataforma de Energia Renovável — TOPSIS

Plataforma para mensurar a vulnerabilidade social energética de municípios com o método multicritério TOPSIS.

## Estrutura

- `frontend/`: React + Vite (dashboard, mapa com Leaflet, configuração de pesos e exportação).
- `backend/`: API Node.js + Express, cálculo TOPSIS e acesso ao PostgreSQL/PostGIS.
- `backend/migrations/`: esquema do banco (`001_initial_schema.sql`).
- `docs/`: requisitos, UML, documentação da API e manual do usuário.
- `docker-compose.yml`: banco, API e frontend.

## Subir tudo com Docker (1 comando)

Com o Docker Desktop ativo, na raiz do projeto:

```bash
docker compose up --build
```

- Frontend: <http://localhost:8080>
- API: <http://localhost:3000>

Login inicial (somente desenvolvimento): `admin@energia.local` / `trocar-esta-senha-123`.
Para mudar, defina `ADMIN_EMAIL`, `ADMIN_SENHA` e `JWT_SECRET` no ambiente antes de subir.

Na primeira execução o banco aplica a migração e a API carrega os dados do exemplo 7.3 do roteiro.
Se a porta 5432 já estiver em uso por um PostgreSQL local, rode `DB_HOST_PORT=5433 docker compose up --build`
(no PowerShell: `$env:DB_HOST_PORT=5433; docker compose up --build`).

Para apagar o banco e começar do zero: `docker compose down -v`.

## Executar sem Docker (desenvolvimento)

1. Suba só o banco: `docker compose up -d db` (ou use um PostgreSQL com PostGIS instalado e aplique a migração).
2. Backend: copie `backend/.env.example` para `backend/.env`, depois `cd backend && npm install && npm run db:seed && npm run usuario:criar && npm run dev` (o último comando cria o administrador definido em `ADMIN_EMAIL`/`ADMIN_SENHA`).
3. Frontend: `cd frontend && npm install && npm run dev` (abre em <http://localhost:5173> e usa a API da porta 3000 pelo proxy do Vite).

Mais detalhes em `backend/README.md`.
