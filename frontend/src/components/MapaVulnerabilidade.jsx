import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { authFetch } from '../services/auth.js';

// Correção dos ícones padrão do Leaflet no React / Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function MapaVulnerabilidade({ resultadosTopsis }) {
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    // Procura os dados GeoJSON dos municípios no backend
    authFetch('/api/municipios/geojson')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.features) {
          setGeoData(data.features);
        }
      })
      .catch((err) => console.error('Erro ao carregar dados do mapa:', err));
  }, []);

  // Centro inicial do mapa (Bahia / Nordeste)
  const posicaoInicial = [-12.97, -38.50];

  return (
    <div style={{ height: '500px', width: '100%', marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer center={posicaoInicial} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData.map((feature) => {
          const { id, nome, uf, populacao, idh } = feature.properties;
          const [lon, lat] = feature.geometry.coordinates;

          // Cruza com o resultado do TOPSIS (a lista já vem ordenada por Ci)
          const indiceRanking = resultadosTopsis?.findIndex((r) => r.id === id) ?? -1;
          const resultado = indiceRanking >= 0 ? resultadosTopsis[indiceRanking] : null;

          return (
            <Marker key={id} position={[lat, lon]}>
              <Popup>
                <div style={{ minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{nome} - {uf}</h4>
                  <p style={{ margin: '2px 0' }}><strong>População:</strong> {populacao?.toLocaleString('pt-BR')}</p>
                  <p style={{ margin: '2px 0' }}><strong>IDH:</strong> {idh}</p>
                  {resultado ? (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
                      <p style={{ margin: '2px 0', color: '#2b6cb0' }}><strong>Ranking TOPSIS:</strong> #{indiceRanking + 1}</p>
                      <p style={{ margin: '2px 0', color: '#2b6cb0' }}><strong>Coeficiente (Ci):</strong> {resultado.score?.toFixed(4)}</p>
                    </div>
                  ) : (
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>Sem cálculo TOPSIS ativo</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}