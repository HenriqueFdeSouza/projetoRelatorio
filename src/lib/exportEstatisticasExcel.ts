import ExcelJS from 'exceljs'

export type ExportableMetricKey =
  | 'achados'
  | 'tentativaMenorBarrada'
  | 'entregasFornecedores'
  | 'encomendas'
  | 'helpdesk'
  | 'ocorrencias'

type StatsPeriod = '7d' | '30d' | '6m' | '1y'

type DetailedPrincipalReport = {
  id: string
  data_relatorio: string
  turno: 'DIURNO' | 'NOTURNO'
  conteudo: any
}

type ExportParams = {
  metricKey: ExportableMetricKey
  period: StatsPeriod
  reports: DetailedPrincipalReport[]
}

type MetricConfig = {
  title: string
  description: string
  columns: string[]
  mapRows: (report: DetailedPrincipalReport) => Array<Array<string | number>>
}

const COLORS = {
  header: 'FF7B2D8B',
  subheader: 'FFF2EAF5',
  border: 'FFD9C4DF',
  textDark: 'FF2B1633',
  white: 'FFFFFFFF',
}

const METRIC_CONFIGS: Record<ExportableMetricKey, MetricConfig> = {
  achados: {
    title: 'Achados e perdidos',
    description: 'Registros de objetos/local encontrados no período selecionado.',
    columns: ['Data', 'Turno', 'Local', 'Segurança', 'Objeto encontrado', 'Valor'],
    mapRows: (report) =>
      (report.conteudo.achados || [])
        .filter((item: any) => [item.local, item.seguranca, item.objeto, item.valor].some((value) => hasText(value)))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.local || '-',
          item.seguranca || '-',
          item.objeto || '-',
          parseCurrencyValue(item.valor),
        ]),
  },
  tentativaMenorBarrada: {
    title: 'Tentativas de saída de menor barradas',
    description: 'Casos identificados como barrados, negados ou impedidos.',
    columns: ['Data', 'Turno', 'Nome da criança', 'UH', 'Portaria', 'Situação'],
    mapRows: (report) =>
      (report.conteudo.tentativaMenor || [])
        .filter((item: any) => isBlockedAttempt(item.possuiAutorizacao || ''))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.nomeCrianca || '-',
          item.uh || '-',
          item.portaria || '-',
          item.possuiAutorizacao || '-',
        ]),
  },
  entregasFornecedores: {
    title: 'Entregas de fornecedores e prestadores',
    description: 'Empresas e prestadores registrados no período selecionado.',
    columns: ['Data', 'Turno', 'Empresa', 'Setor / Horário'],
    mapRows: (report) =>
      (report.conteudo.entregaFornecedores || [])
        .filter((item: any) => hasText(item.empresa))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.empresa || '-',
          item.setor || '-',
        ]),
  },
  encomendas: {
    title: 'Encomendas de proprietários',
    description: 'Encomendas registradas para proprietários no período selecionado.',
    columns: ['Data', 'Turno', 'UH', 'Quantidade', 'Proprietário'],
    mapRows: (report) =>
      (report.conteudo.encomendas || [])
        .filter((item: any) => [item.uh, item.quantidade, item.proprietario].some((value) => hasText(value)))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.uh || '-',
          item.quantidade || '-',
          item.proprietario || '-',
        ]),
  },
  helpdesk: {
    title: 'Help Desk',
    description: 'Chamados Help Desk abertos no período selecionado.',
    columns: ['Data', 'Turno', 'Nome', 'Descrição', 'Nº chamado', 'Setor'],
    mapRows: (report) =>
      (report.conteudo.helpdesk || [])
        .filter((item: any) => [item.nome, item.descricao, item.chamado, item.setor].some((value) => hasText(value)))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.nome || '-',
          item.descricao || '-',
          item.chamado || '-',
          item.setor || '-',
        ]),
  },
  ocorrencias: {
    title: 'Ocorrências e intervenções do plantão',
    description: 'Ocorrências e intervenções registradas no período selecionado.',
    columns: ['Data', 'Turno', 'Título', 'Descrição'],
    mapRows: (report) =>
      (report.conteudo.ocorrencias || [])
        .filter((item: any) => hasText(item.titulo) || hasText(item.descricao))
        .map((item: any) => [
          formatDateBr(report.data_relatorio),
          report.turno,
          item.titulo || '-',
          item.descricao || '-',
        ]),
  },
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateBr(value: string) {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateRangeBr(start: Date, end: Date) {
  const startText = start.toLocaleDateString('pt-BR')
  const endText = end.toLocaleDateString('pt-BR')
  return `De ${startText} até ${endText}`
}

function hasText(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function parseCurrencyValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : ''

  const raw = String(value || '').trim()
  if (!raw) return ''

  const normalized = raw
    .replace(/R\$\s?/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : raw
}

function isBlockedAttempt(value: string) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return false

  return (
    normalized.includes('não') ||
    normalized.includes('nao') ||
    normalized.includes('sem') ||
    normalized.includes('barr') ||
    normalized.includes('negad') ||
    normalized.includes('recus') ||
    normalized.includes('imped')
  )
}

function getPeriodLabel(period: StatsPeriod) {
  if (period === '7d') return 'Últimos 7 dias'
  if (period === '30d') return 'Últimos 30 dias'
  if (period === '6m') return 'Últimos 6 meses'
  return 'Último 1 ano'
}

function getPeriodStart(period: StatsPeriod) {
  const today = startOfDay(new Date())

  if (period === '7d') return addDays(today, -6)
  if (period === '30d') return addDays(today, -29)
  if (period === '6m') return startOfDay(addMonths(today, -5))
  return startOfDay(addMonths(today, -11))
}

function filterReportsByPeriod(period: StatsPeriod, reports: DetailedPrincipalReport[]) {
  const today = startOfDay(new Date())
  const start = startOfDay(getPeriodStart(period))

  return reports.filter((report) => {
    const date = startOfDay(parseDateOnly(report.data_relatorio))
    return date >= start && date <= today
  })
}

function applyBorders(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'thin', color: { argb: COLORS.border } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    }
  })
}

function autoSizeColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 12

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : ''
      maxLength = Math.max(maxLength, Math.min(value.length + 2, 42))
    })

    column.width = maxLength
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function exportEstatisticaParaExcel({ metricKey, period, reports }: ExportParams) {
  const config = METRIC_CONFIGS[metricKey]
  const filteredReports = filterReportsByPeriod(period, reports)
  const rows = filteredReports.flatMap((report) => config.mapRows(report))

  const today = startOfDay(new Date())
  const periodStart = startOfDay(getPeriodStart(period))
  const periodRangeLabel = formatDateRangeBr(periodStart, today)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema de Relatórios'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Dados')
  const lastColumnLetter = String.fromCharCode(64 + config.columns.length)

  worksheet.mergeCells(`A1:${lastColumnLetter}1`)
  const titleCell = worksheet.getCell('A1')
  titleCell.value = config.title.toUpperCase()
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  worksheet.mergeCells(`A2:${lastColumnLetter}2`)
  const descriptionCell = worksheet.getCell('A2')
  descriptionCell.value = `${config.description} • ${getPeriodLabel(period)} • ${periodRangeLabel}`
  descriptionCell.font = { italic: true, size: 11, color: { argb: COLORS.textDark } }
  descriptionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subheader } }
  descriptionCell.alignment = { horizontal: 'left', vertical: 'middle' }

  worksheet.addRow([])
  const headerRow = worksheet.addRow(config.columns)
  headerRow.height = 22
  headerRow.font = { bold: true, color: { argb: COLORS.white } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } }
  })
  applyBorders(headerRow)

  if (rows.length === 0) {
    const emptyRow = worksheet.addRow(['Nenhum registro encontrado para o período selecionado.'])
    worksheet.mergeCells(`A5:${lastColumnLetter}5`)
    emptyRow.height = 22
    const cell = worksheet.getCell('A5')
    cell.font = { italic: true, color: { argb: COLORS.textDark } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F4FA' } }
    applyBorders(emptyRow)
  } else {
    rows.forEach((rowValues, index) => {
      const row = worksheet.addRow(rowValues)
      row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      row.eachCell((cell) => {
        cell.font = { size: 11, color: { argb: COLORS.textDark } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF9F5FB' },
        }
      })
      applyBorders(row)
    })
  }

  if (metricKey === 'achados' && rows.length > 0) {
    worksheet.getColumn(6).width = 18

    for (let rowIndex = 5; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const cell = worksheet.getCell(`F${rowIndex}`)
      cell.numFmt = 'R$ #,##0.00'
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }

    const totalRowIndex = worksheet.rowCount + 1
    const totalRow = worksheet.addRow(['', '', '', '', 'TOTAL', { formula: `SUM(F5:F${totalRowIndex - 1})` }])
    totalRow.font = { bold: true, color: { argb: COLORS.textDark } }
    totalRow.alignment = { vertical: 'middle', horizontal: 'center' }
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subheader } }
    })
    worksheet.getCell(`F${totalRowIndex}`).numFmt = 'R$ #,##0.00'
    applyBorders(totalRow)
  }

  worksheet.views = [{ state: 'frozen', ySplit: 4 }]
  autoSizeColumns(worksheet)

  const buffer = await workbook.xlsx.writeBuffer()
  const safeName = config.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()

  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${safeName}_${period}.xlsx`
  )
}
