import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { generatePDF } from '@/lib/pdfExport'
import { getRelatorioById, listRelatorios, type RelatorioListItem } from '@/lib/api/relatorios'

type GroupedRelatorio = {
  key: string
  data_relatorio: string
  turno: 'DIURNO' | 'NOTURNO'
  principal: RelatorioListItem
  versoes: RelatorioListItem[]
}

function formatDateBr(value: string) {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateTimeBr(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('pt-BR')
}

function groupRelatorios(items: RelatorioListItem[]): GroupedRelatorio[] {
  const groups = new Map<string, RelatorioListItem[]>()

  items.forEach((item) => {
    const key = `${item.data_relatorio}__${item.turno}`
    const current = groups.get(key) || []
    current.push(item)
    groups.set(key, current)
  })

  return Array.from(groups.entries()).map(([key, versoes]) => {
    const sortedVersions = [...versoes].sort((a, b) => {
      if (a.is_principal !== b.is_principal) return a.is_principal ? -1 : 1
      if (a.completeness_score !== b.completeness_score) return b.completeness_score - a.completeness_score
      return new Date(b.finalized_at).getTime() - new Date(a.finalized_at).getTime()
    })

    return {
      key,
      data_relatorio: sortedVersions[0].data_relatorio,
      turno: sortedVersions[0].turno,
      principal: sortedVersions.find((item) => item.is_principal) || sortedVersions[0],
      versoes: sortedVersions,
    }
  })
}

export default function Admin() {
  const [data, setData] = useState('')
  const [turno, setTurno] = useState<'' | 'DIURNO' | 'NOTURNO'>('')
  const [status, setStatus] = useState<'' | 'finalizado'>('')
  const [items, setItems] = useState<RelatorioListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const groupedItems = useMemo(() => groupRelatorios(items), [items])
  const totalGrupos = groupedItems.length

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      const result = await listRelatorios({ data, turno, status })
      setItems(result)
      setExpandedGroups({})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível consultar os relatórios.'
      toast({ title: 'Erro ao pesquisar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const downloadPdf = async (row: RelatorioListItem) => {
    setDownloadLoadingId(row.id)
    try {
      const detail = await getRelatorioById(row.id)
      await generatePDF(detail.conteudo)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível baixar o PDF.'
      toast({ title: 'Erro ao baixar PDF', description: message, variant: 'destructive' })
    } finally {
      setDownloadLoadingId(null)
    }
  }

  return (
    <div className="fade-in space-y-6">
      <div className="page-header rounded-lg">
        <h1 className="text-2xl font-bold">Consulta de relatórios</h1>
        <p className="text-sm opacity-80 mt-1">Pesquise relatórios finalizados, organize por data e baixe o PDF da versão desejada.</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Data</label>
          <Input type="date" value={data || ''} onChange={(e) => setData(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Turno</label>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value as '' | 'DIURNO' | 'NOTURNO')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="DIURNO">DIURNO</option>
            <option value="NOTURNO">NOTURNO</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as '' | 'finalizado')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>

        <Button onClick={handleSearch} className="gap-2" disabled={loading}>
          <Search className="w-4 h-4" />
          {loading ? 'Pesquisando...' : 'Pesquisar'}
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="section-header rounded-none">
          <div>
            <span className="font-semibold">Resultados</span>
            <p className="text-xs opacity-70 font-normal mt-0.5">
              {hasSearched
                ? `${totalGrupos} grupo(s) de relatório encontrado(s)`
                : 'Defina os filtros e clique em pesquisar.'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="report-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Status</th>
                <th>Principal</th>
                <th>Score</th>
                <th>Finalizado em</th>
                <th>Versões</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!hasSearched && (
                <tr>
                  <td colSpan={8} className="py-6 text-muted-foreground text-center border border-border">
                    Nenhuma pesquisa realizada ainda.
                  </td>
                </tr>
              )}

              {hasSearched && groupedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-muted-foreground text-center border border-border">
                    Nenhum relatório encontrado.
                  </td>
                </tr>
              )}

              {groupedItems.map((group) => {
                const row = group.principal
                const isExpanded = !!expandedGroups[group.key]
                const hasExtraVersions = group.versoes.length > 1

                return (
                  <>
                    <tr key={group.key}>
                      <td className="px-3 py-2 border border-border text-center">{formatDateBr(group.data_relatorio)}</td>
                      <td className="px-3 py-2 border border-border text-center">{group.turno}</td>
                      <td className="px-3 py-2 border border-border text-center">{row.status}</td>
                      <td className="px-3 py-2 border border-border text-center">SIM</td>
                      <td className="px-3 py-2 border border-border text-center">{row.completeness_score}</td>
                      <td className="px-3 py-2 border border-border text-center">{formatDateTimeBr(row.finalized_at)}</td>
                      <td className="px-3 py-2 border border-border text-center">
                        {hasExtraVersions ? (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleGroup(group.key)}>
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {isExpanded ? 'Ocultar versões' : `Ver versões (${group.versoes.length})`}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Apenas V1</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-border">
                        <div className="flex justify-center">
                          <Button size="sm" className="gap-2" onClick={() => downloadPdf(row)} disabled={downloadLoadingId === row.id}>
                            <Download className="w-4 h-4" />
                            {downloadLoadingId === row.id ? 'Baixando...' : 'Baixar PDF'}
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded &&
                      group.versoes
                        .filter((version) => version.id !== row.id)
                        .map((version) => (
                          <tr key={version.id} className="bg-muted/30">
                            <td className="px-3 py-2 border border-border text-center">{formatDateBr(version.data_relatorio)}</td>
                            <td className="px-3 py-2 border border-border text-center">{version.turno}</td>
                            <td className="px-3 py-2 border border-border text-center">{version.status}</td>
                            <td className="px-3 py-2 border border-border text-center">V{version.version_num}</td>
                            <td className="px-3 py-2 border border-border text-center">{version.completeness_score}</td>
                            <td className="px-3 py-2 border border-border text-center">{formatDateTimeBr(version.finalized_at)}</td>
                            <td className="px-3 py-2 border border-border text-center">
                              <span className="text-sm text-muted-foreground">Versão secundária</span>
                            </td>
                            <td className="px-3 py-2 border border-border">
                              <div className="flex justify-center">
                                <Button size="sm" className="gap-2" onClick={() => downloadPdf(version)} disabled={downloadLoadingId === version.id}>
                                  <Download className="w-4 h-4" />
                                  {downloadLoadingId === version.id ? 'Baixando...' : 'Baixar PDF'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
