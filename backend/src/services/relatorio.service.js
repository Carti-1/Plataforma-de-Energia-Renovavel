import PDFDocument from 'pdfkit'

const VERDE = '#163e32'

// Mesma leitura exibida na tela: o maior Ci é o menos vulnerável.
export function leituraPorPosicao(posicao, total) {
  if (posicao === 1) return 'Menos vulnerável'
  if (posicao === total) return 'Mais vulnerável'
  return 'Intermediário'
}

function numero(valor, casas = 4) {
  return Number(valor).toFixed(casas).replace('.', ',')
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    timeZone: 'America/Bahia',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function campoCsv(valor) {
  let texto = String(valor ?? '')
  // Evita que o Excel interprete o texto como fórmula (injeção de CSV).
  if (/^[=+\-@\t\r]/.test(texto)) {
    texto = `'${texto}`
  }
  return `"${texto.replace(/"/g, '""')}"`
}

export function gerarCsv({ ranking }) {
  const cabecalho = [
    'Posição',
    'Município',
    'UF',
    'Índice Ci',
    'Distância ao ideal positivo',
    'Distância ao ideal negativo',
    'Leitura',
  ]

  const linhas = ranking.map((item) =>
    [
      item.posicao,
      campoCsv(item.nome),
      campoCsv(item.uf),
      numero(item.ci),
      numero(item.distanciaPositiva),
      numero(item.distanciaNegativa),
      campoCsv(leituraPorPosicao(item.posicao, ranking.length)),
    ].join(';'),
  )

  // BOM + ponto e vírgula + vírgula decimal: abre corretamente no Excel em português.
  return `\uFEFF${[cabecalho.join(';'), ...linhas].join('\r\n')}\r\n`
}

function desenharTabela(doc, colunas, linhas) {
  const x0 = doc.page.margins.left
  const largura = colunas.reduce((soma, coluna) => soma + coluna.largura, 0)
  const altura = 18

  const desenharCabecalho = () => {
    const y = doc.y
    doc.save().rect(x0, y, largura, altura).fill('#e8f1ec').restore()
    doc.font('Helvetica-Bold').fontSize(9).fillColor(VERDE)
    let x = x0
    for (const coluna of colunas) {
      doc.text(coluna.titulo, x + 4, y + 5, {
        width: coluna.largura - 8,
        align: coluna.alinhar ?? 'left',
        lineBreak: false,
      })
      x += coluna.largura
    }
    doc.y = y + altura
    doc.font('Helvetica').fontSize(9).fillColor('#222222')
  }

  desenharCabecalho()

  linhas.forEach((linha, indice) => {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage()
      desenharCabecalho()
    }

    const y = doc.y
    if (indice % 2 === 1) {
      doc.save().rect(x0, y, largura, altura).fill('#f6f8f6').restore()
      doc.fillColor('#222222')
    }

    let x = x0
    colunas.forEach((coluna, posicao) => {
      doc.text(String(linha[posicao]), x + 4, y + 5, {
        width: coluna.largura - 8,
        height: altura - 6,
        align: coluna.alinhar ?? 'left',
        lineBreak: false,
        ellipsis: true,
      })
      x += coluna.largura
    })
    doc.y = y + altura
  })

  doc.x = x0
}

/**
 * Escreve o relatório em PDF no destino (por exemplo, a resposta HTTP).
 * Usa a fonte padrão Helvetica, que já inclui acentos do português.
 */
export function escreverPdf({ simulacao, ranking }, destino) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: {
      Title: `Relatório TOPSIS nº ${simulacao.id}`,
      Author: 'Plataforma de Energia Renovável',
    },
  })
  doc.pipe(destino)

  doc.font('Helvetica-Bold').fontSize(18).fillColor(VERDE)
    .text('Relatório de vulnerabilidade social energética')
  doc.font('Helvetica').fontSize(10).fillColor('#666666')
    .text('Plataforma de Energia Renovável · Método TOPSIS')
  doc.moveDown(0.8)

  const parametros = simulacao.parametros ?? {}
  doc.font('Helvetica').fontSize(10).fillColor('#222222')
  doc.text(`Simulação nº ${simulacao.id} · executada em ${formatarData(simulacao.dataExecucao)}`)
  doc.text(`Responsável: ${simulacao.usuario?.nome ?? 'não informado'}`)
  doc.text(`Municípios no ranking: ${ranking.length}`)
  doc.moveDown(1)

  const pesos = parametros.pesos ?? []
  if (pesos.length > 0) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor(VERDE).text('Critérios e pesos')
    doc.moveDown(0.4)
    desenharTabela(
      doc,
      [
        { titulo: 'Cód.', largura: 45 },
        { titulo: 'Critério', largura: 270 },
        { titulo: 'Tipo', largura: 90 },
        { titulo: 'Peso', largura: 90, alinhar: 'right' },
      ],
      pesos.map((peso, indice) => [
        `C${indice + 1}`,
        parametros.criterios?.[indice] ?? '—',
        parametros.tipos?.[indice] === 'custo' ? 'Custo' : 'Benefício',
        `${numero(peso * 100, 1)}%`,
      ]),
    )
    doc.moveDown(1)
  }

  doc.font('Helvetica-Bold').fontSize(12).fillColor(VERDE).text('Ranking de municípios')
  doc.moveDown(0.4)
  desenharTabela(
    doc,
    [
      { titulo: 'Pos.', largura: 36 },
      { titulo: 'Município', largura: 150 },
      { titulo: 'UF', largura: 32 },
      { titulo: 'Ci', largura: 62, alinhar: 'right' },
      { titulo: 'D+', largura: 62, alinhar: 'right' },
      { titulo: 'D-', largura: 62, alinhar: 'right' },
      { titulo: 'Leitura', largura: 91 },
    ],
    ranking.map((item) => [
      item.posicao,
      item.nome,
      item.uf === 'ND' ? '—' : item.uf,
      numero(item.ci),
      numero(item.distanciaPositiva),
      numero(item.distanciaNegativa),
      leituraPorPosicao(item.posicao, ranking.length),
    ]),
  )

  doc.moveDown(1)
  doc.font('Helvetica').fontSize(8).fillColor('#666666').text(
    'Ci é o coeficiente de proximidade: quanto mais perto de 1, mais próximo da solução ideal e menor a ' +
      'vulnerabilidade. D+ e D- são as distâncias euclidianas às soluções ideal positiva e negativa.',
    { width: 495 },
  )

  // Numeração de páginas (escrita depois, quando o total de páginas é conhecido).
  const { start, count } = doc.bufferedPageRange()
  for (let indice = 0; indice < count; indice += 1) {
    doc.switchToPage(start + indice)
    const margemInferior = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    doc.font('Helvetica').fontSize(8).fillColor('#888888').text(
      `Página ${indice + 1} de ${count} · gerado em ${formatarData(new Date())}`,
      50,
      doc.page.height - 36,
      { width: 495, align: 'center', lineBreak: false },
    )
    doc.page.margins.bottom = margemInferior
  }

  doc.end()
}
