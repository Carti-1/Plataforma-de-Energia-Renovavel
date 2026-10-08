import { pool } from '../config/db.js'

export async function listarMunicipios() {
  const { rows } = await pool.query(
    `SELECT id, nome, uf, populacao, idh,
            ST_Y(coordenadas) AS latitude,
            ST_X(coordenadas) AS longitude
       FROM municipios
      ORDER BY id`,
  )

  return rows
}

export async function listarMunicipiosGeoJSON() {
  const { rows } = await pool.query(
    `SELECT jsonb_build_object(
       'type', 'FeatureCollection',
       'features', COALESCE(
         jsonb_agg(
           jsonb_build_object(
             'type', 'Feature',
             'geometry', ST_AsGeoJSON(coordenadas)::jsonb,
             'properties', jsonb_build_object(
               'id', id,
               'nome', nome,
               'uf', uf,
               'populacao', populacao,
               'idh', idh
             )
           )
         ) FILTER (WHERE coordenadas IS NOT NULL),
         '[]'::jsonb
       )
     ) AS geojson
       FROM municipios`,
  )

  return rows[0].geojson
}

export async function buscarMunicipio(id) {
  const { rows } = await pool.query(
    `SELECT id, nome, uf, populacao, idh,
            ST_Y(coordenadas) AS latitude,
            ST_X(coordenadas) AS longitude
       FROM municipios
      WHERE id = $1`,
    [id],
  )

  return rows[0]
}

export async function criarMunicipio({
  nome,
  uf,
  populacao,
  idh,
  latitude,
  longitude,
}) {
  const { rows } = await pool.query(
    `INSERT INTO municipios
      (nome, uf, populacao, idh, coordenadas)
     VALUES (
       $1,
       $2,
       $3,
       $4,
       CASE
         WHEN $5 IS NOT NULL AND $6 IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)
         ELSE NULL
       END
     )
     RETURNING id, nome, uf, populacao, idh,
               ST_Y(coordenadas) AS latitude,
               ST_X(coordenadas) AS longitude`,
    [nome, uf, populacao, idh, latitude, longitude],
  )

  return rows[0]
}

export async function atualizarMunicipio(
  id,
  { nome, uf, populacao, idh, latitude, longitude },
) {
  const { rows } = await pool.query(
    `UPDATE municipios
        SET nome = $1,
            uf = $2,
            populacao = $3,
            idh = $4,
            coordenadas = CASE
              WHEN $5 IS NOT NULL AND $6 IS NOT NULL
              THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)
              ELSE coordenadas
            END
      WHERE id = $7
      RETURNING id, nome, uf, populacao, idh,
                ST_Y(coordenadas) AS latitude,
                ST_X(coordenadas) AS longitude`,
    [nome, uf, populacao, idh, latitude, longitude, id],
  )

  return rows[0]
}

export async function excluirMunicipio(id) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      'DELETE FROM matriz_decisao WHERE municipio_id = $1',
      [id],
    )

    await client.query(
      'DELETE FROM resultados_ranking WHERE municipio_id = $1',
      [id],
    )

    const { rows } = await client.query(
      'DELETE FROM municipios WHERE id = $1 RETURNING id',
      [id],
    )

    await client.query('COMMIT')

    return rows[0]
  } catch (erro) {
    await client.query('ROLLBACK')
    throw erro
  } finally {
    client.release()
  }
}
