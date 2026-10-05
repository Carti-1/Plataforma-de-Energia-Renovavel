-- Schema Principal
-- A extensão precisa estar instalada no servidor PostgreSQL antes de executar esta migração.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE municipios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    uf CHAR(2) NOT NULL,
    populacao INTEGER,
    idh DECIMAL(4,3),
    coordenadas GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE criterios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(10) CHECK (tipo IN ('beneficio','custo')),
    peso DECIMAL(5,4) DEFAULT 0.0,
    unidade VARCHAR(50)
);

CREATE TABLE matriz_decisao (
    id SERIAL PRIMARY KEY,
    municipio_id INTEGER REFERENCES municipios(id),
    criterio_id INTEGER REFERENCES criterios(id),
    valor DECIMAL(15,4) NOT NULL,
    ano_referencia INTEGER,
    UNIQUE(municipio_id, criterio_id, ano_referencia)
);

-- Complemento: a tabela simulacoes referencia usuarios(id)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL DEFAULT 'pesquisador',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    data_execucao TIMESTAMP DEFAULT NOW(),
    parametros JSONB,
    status VARCHAR(20) DEFAULT 'concluida'
);

CREATE TABLE resultados_ranking (
    id SERIAL PRIMARY KEY,
    simulacao_id INTEGER REFERENCES simulacoes(id),
    municipio_id INTEGER REFERENCES municipios(id),
    coeficiente_ci DECIMAL(10,8),
    distancia_positiva DECIMAL(10,8),
    distancia_negativa DECIMAL(10,8),
    posicao INTEGER
);
