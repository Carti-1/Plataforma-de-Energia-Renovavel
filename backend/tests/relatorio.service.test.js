import { describe, expect, test } from '@jest/globals'
import { PassThrough } from 'node:stream'
import { escreverPdf, gerarCsv, leituraPorPosicao } from '../src/services/relatorio.service.js'

function ranking(quantidade) {
  return Array.from({ length: quantidade }, (_, i) => ({
    posicao: i + 1,
    municipioId: i + 1,
    nome: `Município ${i + 1}`,
    uf: 'BA',
    ci: 1 - i / quantidade,
    distanciaPositiva: i / 100,
    distanciaNegativa: 0.5,
  }))
}

function simulacao() {
  return {
    id: 7,
    dataExecucao: '2026-10-10T12:00:00Z',
    usuario: { id: 1, nome: 'Maria' },
    parametros: { pesos: [0.6, 0.4], tipos: ['custo', 'beneficio'], criterios: ['Tarifa', 'Renda'] },
  }
}

function gerarPdf(dados) {
  return new Promise((resolve, reject) => {
    const saida = new PassThrough()
    const partes = []
    saida.on('data', (parte) => partes.push(parte))
    saida.on('end', () => resolve(Buffer.concat(partes)))
    saida.on('error', reject)
    escreverPdf(dados, saida)
  })
}

describe('Relatório', () => {
  test('a leitura segue a posição: 1º menos vulnerável, último mais vulnerável', () => {
    expect(leituraPorPosicao(1, 3)).toBe('Menos vulnerável')
    expect(leituraPorPosicao(2, 3)).toBe('Intermediário')
    expect(leituraPorPosicao(3, 3)).toBe('Mais vulnerável')
  })

  test('CSV tem BOM, separador ; e vírgula decimal', () => {
    const csv = gerarCsv({ ranking: ranking(2) })
    const linhas = csv.replace('\uFEFF', '').trim().split('\r\n')

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(linhas[0]).toBe('Posição;Município;UF;Índice Ci;Distância ao ideal positivo;Distância ao ideal negativo;Leitura')
    expect(linhas[1]).toBe('1;"Município 1";"BA";1,0000;0,0000;0,5000;"Menos vulnerável"')
    expect(linhas).toHaveLength(3)
  })

  test('CSV escapa aspas e neutraliza fórmulas', () => {
    const csv = gerarCsv({ ranking: [{ ...ranking(1)[0], nome: '=SOMA(A1)', uf: 'a"b' }] })

    expect(csv).toContain(`"'=SOMA(A1)"`)
    expect(csv).toContain('"a""b"')
  })

  test('gera um PDF válido', async () => {
    const pdf = await gerarPdf({ simulacao: simulacao(), ranking: ranking(3) })

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.subarray(-6).toString()).toContain('%%EOF')
  })

  test('com muitos municípios o PDF quebra em várias páginas', async () => {
    const poucas = await gerarPdf({ simulacao: simulacao(), ranking: ranking(3) })
    const muitas = await gerarPdf({ simulacao: simulacao(), ranking: ranking(300) })

    const paginas = (pdf) => (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length
    expect(paginas(poucas)).toBe(1)
    expect(paginas(muitas)).toBeGreaterThan(5)
  })
})
