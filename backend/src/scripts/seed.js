import { pool } from '../config/db.js'

const ANO = 2025 // ano de referência fictício do exemplo

// Use `npm run db:seed -- --reset` para apagar os dados e recarregar o exemplo.
const RESETAR = process.argv.includes('--reset')

const criterios = [
  { nome: 'Domicílios sem acesso à eletricidade', unidade: '%', fonte: 'IBGE', tipo: 'custo', peso: 0.2 },
  { nome: 'Capacidade instalada solar', unidade: 'kW/hab', fonte: 'ANEEL', tipo: 'beneficio', peso: 0.2 },
  { nome: 'Renda per capita', unidade: 'R$', fonte: 'IBGE', tipo: 'beneficio', peso: 0.15 },
  { nome: 'Tarifa média de energia', unidade: 'R$/kWh', fonte: 'ANEEL', tipo: 'custo', peso: 0.25 },
  { nome: 'Índice de irradiação solar', unidade: 'kWh/m²/dia', fonte: 'INPE', tipo: 'beneficio', peso: 0.2 },
]

// Municípios do exemplo 7.3 do roteiro. Os nomes são fictícios; as coordenadas
// são apenas posições de demonstração na Bahia para o mapa exibir os pontos.
const municipios = [
  { nome: 'Município A', uf: 'BA', latitude: -12.97, longitude: -38.5, valores: [15, 0.8, 980, 0.75, 5.2] },
  { nome: 'Município B', uf: 'BA', latitude: -12.25, longitude: -38.96, valores: [5, 2.1, 1850, 0.62, 5.8] },
  { nome: 'Município C', uf: 'BA', latitude: -14.86, longitude: -40.84, valores: [22, 0.3, 650, 0.89, 4.9] },
]

const client = await pool.connect()
try {
  if (RESETAR) {
    // Não apaga a tabela usuarios.
    await client.query(
      `TRUNCATE resultados_ranking, simulacoes, matriz_decisao, criterios, municipios
       RESTART IDENTITY CASCADE`,
    )
    console.log('Dados anteriores removidos (--reset).')
  }

  const { rows } = await client.query('SELECT COUNT(*)::int AS total FROM municipios')
  if (rows[0].total > 0) {
    console.log('O banco já tem municípios. Seed ignorado para não duplicar. Use --reset para recarregar.')
  } else {
    await client.query('BEGIN')

    const idsCriterios = []
    for (const c of criterios) {
      const r = await client.query(
        `INSERT INTO criterios (nome, descricao, tipo, peso, unidade)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [c.nome, c.fonte, c.tipo, c.peso, c.unidade],
      )
      idsCriterios.push(r.rows[0].id)
    }

    for (const m of municipios) {
      const r = await client.query(
        `INSERT INTO municipios (nome, uf, coordenadas)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3::float8, $4::float8), 4326))
         RETURNING id`,
        [m.nome, m.uf, m.longitude, m.latitude], // PostGIS usa a ordem (longitude, latitude)
      )
      for (let i = 0; i < m.valores.length; i++) {
        await client.query(
          `INSERT INTO matriz_decisao (municipio_id, criterio_id, valor, ano_referencia)
           VALUES ($1, $2, $3, $4)`,
          [r.rows[0].id, idsCriterios[i], m.valores[i], ANO],
        )
      }
    }

    await client.query('COMMIT')
    console.log('Seed concluído: 3 municípios (com coordenadas), 5 critérios e 15 valores.')
  }
} catch (erro) {
  await client.query('ROLLBACK')
  console.error('Falha no seed:', erro.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}