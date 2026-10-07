// frontend/src/utils/exportRelatorio.js

export function exportarParaCSV(ranking, nomeArquivo = 'relatorio_vulnerabilidade_topsis.csv') {
  if (!ranking || ranking.length === 0) {
    alert('Nenhum dado disponível para exportar.');
    return;
  }

  // Cabeçalhos do CSV
  const headers = ['Posição', 'Município', 'Estado/UF', 'Índice Ci', 'Status de Vulnerabilidade'];

  // Formatação das linhas
  const rows = ranking.map((item, index) => [
    String(index + 1).padStart(2, '0'),
    `"${item.name || item.nome}"`,
    `"${item.state || item.uf || 'BA'}"`,
    (item.score || item.ci || 0).toFixed(4).replace('.', ','),
    `"${item.status || 'Analisado'}"`
  ]);

  // Montagem do conteúdo em formato CSV com suporte a UTF-8 (BOM)
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

  // Download do arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}