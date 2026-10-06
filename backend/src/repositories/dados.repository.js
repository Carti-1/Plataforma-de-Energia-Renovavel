import { pool } from '../config/db.js'

export async function listarMunicipios() {
  const { rows } = await pool.query(
    'SELECT id, nome, uf, populacao, idh FROM municipios ORDER BY id',
  )
  return rows
}

export async function listarCriterios() {
  const { rows } = await pool.query(
    'SELECT id, nome, descricao, tipo, peso, unidade FROM criterios ORDER BY id',
  )
  return rows.map((c) => ({
    id: c.id,
    nome: c.nome,
    fonte: c.descricao,
    tipo: c.tipo,
    peso: Number(c.peso),
    unidade: c.unidade,
  }))
}

/** Matriz de decisão: cada município com os valores na ordem dos critérios (por id). */
export async function buscarMatrizDecisao() {
  const { rows } = await pool.query(
    `SELECT m.id, m.nome, m.uf, md.valor
       FROM matriz_decisao md
       JOIN municipios m ON m.id = md.municipio_id
       JOIN criterios c ON c.id = md.criterio_id
      ORDER BY m.id, c.id`,
  )
  const porMunicipio = new Map()
  for (const linha of rows) {
    if (!porMunicipio.has(linha.id)) {
      porMunicipio.set(linha.id, { id: linha.id, nome: linha.nome, uf: linha.uf, valores: [] })
    }
    porMunicipio.get(linha.id).valores.push(Number(linha.valor))
  }
  return [...porMunicipio.values()]
}