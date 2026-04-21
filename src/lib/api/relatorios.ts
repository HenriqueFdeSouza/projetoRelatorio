import { supabase } from '@/lib/supabase'
import { ReportData, ReportShift } from '@/lib/types'

const MAX_VERSIONS_PER_SHIFT = 2

export type RelatorioSaveStatus =
  | 'saved_first'
  | 'saved_second'
  | 'replaced_worst'
  | 'duplicate'
  | 'less_complete'

export interface RelatorioSaveResult {
  status: RelatorioSaveStatus
  message: string
  rowId?: string
}

export interface RelatorioListItem {
  id: string
  data_relatorio: string
  turno: ReportShift
  status: string
  pdf_version: string
  finalized_at: string
  version_num: number
  is_principal: boolean
  completeness_score: number
}

interface RelatorioRow {
  id: string
  data_relatorio: string
  turno: ReportShift
  status: string
  pdf_version: string
  conteudo: ReportData
  finalized_at: string
  created_at: string
  version_num: number
  is_principal: boolean
  content_hash: string | null
  completeness_score: number
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`
}

function hashString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return `h${Math.abs(hash).toString(16)}`
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function scoreWhen<T>(items: T[], scorer: (item: T) => number): number {
  return items.reduce((total, item) => total + scorer(item), 0)
}

function calculateCompletenessScore(report: ReportData): number {
  let score = 0

  if ((report.data || '').trim()) score += 2
  if ((report.diaSemana || '').trim()) score += 1
  if ((report.tipoRelatorio || '').trim()) score += 2
  if ((report.plantonista || '').trim()) score += 8

  score += scoreWhen(report.efetivo, (item) => (hasValue(item.nome) ? 2 : 0) + (hasValue(item.horario) ? 1 : 0) + (hasValue(item.radio) ? 1 : 0))
  score += scoreWhen(report.visitas, (item) => (hasValue(item.nome) ? 2 : 0) + (hasValue(item.funcao) ? 1 : 0) + (hasValue(item.entrada) ? 1 : 0) + (hasValue(item.saida) ? 1 : 0))
  score += scoreWhen(report.gec, (item) => (hasValue(item.empresa) ? 2 : 0) + (hasValue(item.quantidade) ? 1 : 0) + (hasValue(item.setor) ? 1 : 0) + (hasValue(item.status) ? 1 : 0) + (hasValue(item.atividade) ? 1 : 0))
  score += scoreWhen(report.achados, (item) => (hasValue(item.local) ? 1 : 0) + (hasValue(item.seguranca) ? 1 : 0) + (hasValue(item.objeto) ? 2 : 0) + (hasValue(item.entregue) ? 1 : 0))
  score += scoreWhen(report.autorizacaoMenor, (item) => (hasValue(item.nomeCrianca) ? 2 : 0) + (hasValue(item.autorizador) ? 1 : 0) + (hasValue(item.uh) ? 1 : 0) + (hasValue(item.validade) ? 1 : 0) + (hasValue(item.status) ? 1 : 0))
  score += scoreWhen(report.tentativaMenor, (item) => (hasValue(item.nomeCrianca) ? 2 : 0) + (hasValue(item.uh) ? 1 : 0) + (hasValue(item.portaria) ? 1 : 0) + (hasValue(item.possuiAutorizacao) ? 1 : 0))
  score += scoreWhen(report.saidaMaterial, (item) => (hasValue(item.responsavel) ? 2 : 0) + (hasValue(item.setor) ? 1 : 0) + (hasValue(item.autorizador) ? 1 : 0) + (hasValue(item.descricao) ? 1 : 0) + (hasValue(item.retorno) ? 1 : 0))
  score += scoreWhen(report.tesouraria, (item) => (hasValue(item.nome) ? 2 : 0) + (hasValue(item.entrada) ? 1 : 0) + (hasValue(item.saida) ? 1 : 0) + (hasValue(item.nivel) ? 1 : 0) + (hasValue(item.senha) ? 1 : 0) + (hasValue(item.destino) ? 1 : 0))
  score += scoreWhen(report.entradaGestores, (item) => (hasValue(item.nome) ? 6 : 0) + (hasValue(item.setorCargo) ? 2 : 0) + (hasValue(item.entrada) ? 1 : 0) + (hasValue(item.saida) ? 1 : 0))
  score += scoreWhen(report.entregaHospedes, (item) => (hasValue(item.tipo) ? 2 : 0) + (hasValue(item.uh) ? 2 : 0))
  score += scoreWhen(report.entregaFornecedores, (item) => (hasValue(item.empresa) ? 6 : 0) + (hasValue(item.setor) ? 2 : 0))
  score += scoreWhen(report.helpdesk, (item) => (hasValue(item.nome) ? 1 : 0) + (hasValue(item.descricao) ? 2 : 0) + (hasValue(item.chamado) ? 1 : 0) + (hasValue(item.setor) ? 1 : 0))
  score += scoreWhen(report.encomendas, (item) => (hasValue(item.uh) ? 2 : 0) + (hasValue(item.quantidade) ? 1 : 0) + (hasValue(item.proprietario) ? 1 : 0))
  score += scoreWhen(report.ocorrencias, (item) => (hasValue(item.titulo) ? 4 : 0) + (hasValue(item.descricao) ? 8 : 0) + (hasValue(item.imagemBase64) ? 2 : 0))

  if (hasValue(report.ocupacao.atual)) score += 1
  if (hasValue(report.ocupacao.prevista)) score += 1
  if (hasValue(report.ocupacao.checkin)) score += 1
  if (hasValue(report.ocupacao.checkout)) score += 1
  if (hasValue(report.radiosRecebimento)) score += 1
  if (hasValue(report.radiosPassagem)) score += 1
  if (hasValue(report.mesCrachas)) score += 1
  if (hasValue(report.faltaEnergia.protocolo)) score += 1
  if (hasValue(report.faltaEnergia.horarioFalta)) score += 1
  if (hasValue(report.faltaEnergia.horarioRetorno)) score += 1

  return score
}

function buildHash(report: ReportData): string {
  return hashString(stableStringify(report))
}

function sortByPriority(rows: RelatorioRow[]) {
  return [...rows].sort((a, b) => {
    if (a.is_principal !== b.is_principal) return a.is_principal ? -1 : 1
    if (a.completeness_score !== b.completeness_score) return b.completeness_score - a.completeness_score
    return new Date(b.finalized_at).getTime() - new Date(a.finalized_at).getTime()
  })
}

function getWorstRow(rows: RelatorioRow[]) {
  return [...rows].sort((a, b) => {
    if (a.completeness_score !== b.completeness_score) return a.completeness_score - b.completeness_score
    return new Date(a.finalized_at).getTime() - new Date(b.finalized_at).getTime()
  })[0]
}

function getNextVersionNumber(rows: RelatorioRow[]) {
  const used = new Set(rows.map((row) => row.version_num))
  for (let i = 1; i <= MAX_VERSIONS_PER_SHIFT; i += 1) {
    if (!used.has(i)) return i
  }
  return MAX_VERSIONS_PER_SHIFT
}

async function fetchRowsByDateAndShift(data: string, turno: ReportShift): Promise<RelatorioRow[]> {
  const { data: rows, error } = await supabase
    .from('relatorios')
    .select('id, data_relatorio, turno, status, pdf_version, conteudo, finalized_at, created_at, version_num, is_principal, content_hash, completeness_score')
    .eq('data_relatorio', data)
    .eq('turno', turno)

  if (error) throw error
  return (rows || []) as RelatorioRow[]
}

async function insertVersion(params: {
  report: ReportData
  score: number
  hash: string
  versionNum: number
  isPrincipal: boolean
}) {
  const { report, score, hash, versionNum, isPrincipal } = params

  const { data, error } = await supabase
    .from('relatorios')
    .insert([
      {
        data_relatorio: report.data,
        turno: report.tipoRelatorio,
        status: 'finalizado',
        pdf_version: 'v1',
        conteudo: report,
        version_num: versionNum,
        is_principal: isPrincipal,
        content_hash: hash,
        completeness_score: score,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select('id')
    .single()

  if (error) throw error
  return data?.id as string | undefined
}

async function markPrincipal(data: string, turno: ReportShift, principalId: string) {
  const { error: clearError } = await supabase
    .from('relatorios')
    .update({ is_principal: false })
    .eq('data_relatorio', data)
    .eq('turno', turno)

  if (clearError) throw clearError

  const { error: setError } = await supabase
    .from('relatorios')
    .update({ is_principal: true })
    .eq('id', principalId)

  if (setError) throw setError
}

export async function upsertRelatorioFinalizado(report: ReportData): Promise<RelatorioSaveResult> {
  const contentHash = buildHash(report)
  const completenessScore = calculateCompletenessScore(report)
  const existingRows = sortByPriority(await fetchRowsByDateAndShift(report.data, report.tipoRelatorio))

  const duplicate = existingRows.find((row) => row.content_hash === contentHash)
  if (duplicate) {
    return {
      status: 'duplicate',
      rowId: duplicate.id,
      message: 'Este relatório já foi salvo anteriormente sem alterações.',
    }
  }

  const bestExisting = existingRows[0]
  if (bestExisting && completenessScore < bestExisting.completeness_score) {
    return {
      status: 'less_complete',
      rowId: bestExisting.id,
      message: 'Já existe um relatório mais completo para esta data e turno. O novo não foi salvo.',
    }
  }

  if (existingRows.length === 0) {
    const rowId = await insertVersion({
      report,
      score: completenessScore,
      hash: contentHash,
      versionNum: 1,
      isPrincipal: true,
    })

    return {
      status: 'saved_first',
      rowId,
      message: 'Primeira versão salva com sucesso.',
    }
  }

  if (existingRows.length < MAX_VERSIONS_PER_SHIFT) {
    const isPrincipal = completenessScore >= bestExisting.completeness_score
    const rowId = await insertVersion({
      report,
      score: completenessScore,
      hash: contentHash,
      versionNum: getNextVersionNumber(existingRows),
      isPrincipal,
    })

    if (rowId && isPrincipal) {
      await markPrincipal(report.data, report.tipoRelatorio, rowId)
    }

    return {
      status: 'saved_second',
      rowId,
      message: 'Nova versão salva com sucesso.',
    }
  }

  const worstExisting = getWorstRow(existingRows)
  if (!worstExisting || completenessScore <= worstExisting.completeness_score) {
    return {
      status: 'less_complete',
      rowId: bestExisting.id,
      message: 'As 2 versões já salvas para esta data e turno estão iguais ou mais completas. O novo relatório não foi salvo.',
    }
  }

  const { error: deleteError } = await supabase
    .from('relatorios')
    .delete()
    .eq('id', worstExisting.id)

  if (deleteError) throw deleteError

  const isPrincipal = completenessScore >= bestExisting.completeness_score
  const rowId = await insertVersion({
    report,
    score: completenessScore,
    hash: contentHash,
    versionNum: worstExisting.version_num,
    isPrincipal,
  })

  if (rowId && isPrincipal) {
    await markPrincipal(report.data, report.tipoRelatorio, rowId)
  }

  return {
    status: 'replaced_worst',
    rowId,
    message: 'A versão menos completa foi substituída por uma nova versão melhor.',
  }
}

export async function listRelatorios(filters?: {
  data?: string
  turno?: '' | ReportShift
  status?: '' | 'finalizado'
}) {
  let query = supabase
    .from('relatorios')
    .select('id, data_relatorio, turno, status, pdf_version, finalized_at, version_num, is_principal, completeness_score')

  if (filters?.data) query = query.eq('data_relatorio', filters.data)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
    .order('data_relatorio', { ascending: false })
    .order('turno', { ascending: true })
    .order('is_principal', { ascending: false })
    .order('completeness_score', { ascending: false })
    .order('finalized_at', { ascending: false })

  if (error) throw error
  return (data || []) as RelatorioListItem[]
}



function normalizeConteudo<T>(value: T | string): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      throw new Error('O conteúdo do relatório veio em texto, mas não pôde ser convertido para JSON.')
    }
  }

  return value as T
}

export async function getRelatorioById(id: string) {
  const { data, error } = await supabase
    .from('relatorios')
    .select('id, data_relatorio, turno, status, pdf_version, conteudo, finalized_at, version_num, is_principal, completeness_score')
    .eq('id', id)
    .single()

  if (error) throw error

  

  return {
  ...data,
  conteudo: normalizeConteudo(data.conteudo),
} as RelatorioRow
}
