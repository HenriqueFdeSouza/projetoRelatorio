import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Package,
  SearchCheck,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { getRelatorioById, listRelatorios } from '@/lib/api/relatorios'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

type StatsPeriod = '7d' | '30d' | '6m' | '1y'
type MetricKey =
  | 'achados'
  | 'tentativaMenorBarrada'
  | 'entregasFornecedores'
  | 'encomendas'
  | 'helpdesk'
  | 'ocorrencias'

type StatsBucket = {
  label: string
  achados: number
  tentativaMenorBarrada: number
  entregasFornecedores: number
  encomendas: number
  helpdesk: number
  ocorrencias: number
}

type MetricOption = {
  key: MetricKey
  title: string
  description: string
  icon: React.ComponentType<any>
  valueFormatter?: (value: number) => string
  accent: string
  area: string
}

const METRICS: MetricOption[] = [
  {
    key: 'achados',
    title: 'Achados e perdidos',
    description: 'Quantidade de registros de objetos/local encontrados.',
    icon: SearchCheck,
    accent: '#7B2D8B',
    area: 'rgba(123,45,139,0.14)',
  },
  {
    key: 'tentativaMenorBarrada',
    title: 'Tentativas de saída de menor barradas',
    description: 'Somente casos identificados como barrados, negados ou impedidos.',
    icon: ShieldAlert,
    accent: '#D1455B',
    area: 'rgba(209,69,91,0.14)',
  },
  {
    key: 'entregasFornecedores',
    title: 'Entregas de fornecedores/prestadores',
    description: 'Quantidade de empresas/prestadores registrados no período.',
    icon: Boxes,
    accent: '#2563EB',
    area: 'rgba(37,99,235,0.14)',
  },
  {
    key: 'encomendas',
    title: 'Encomendas de proprietários',
    description: 'Total de encomendas registradas para proprietários.',
    icon: Package,
    accent: '#0F766E',
    area: 'rgba(15,118,110,0.14)',
  },
  {
    key: 'helpdesk',
    title: 'Help Desk abertos',
    description: 'Número de chamados Help Desk registrados no período.',
    icon: ClipboardList,
    accent: '#EA580C',
    area: 'rgba(234,88,12,0.14)',
  },
  {
    key: 'ocorrencias',
    title: 'Ocorrências / intervenções do plantão',
    description: 'Quantidade de ocorrências ou intervenções registradas.',
    icon: AlertTriangle,
    accent: '#4F46E5',
    area: 'rgba(79,70,229,0.14)',
  },
]

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
  return new Date(`${value}T12:00:00`)
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function hasAnyText(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
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

function countFilledRows<T extends Record<string, unknown>>(rows: T[], requiredKeys: Array<keyof T>) {
  return rows.filter((row) => requiredKeys.some((key) => hasAnyText(row[key]))).length
}

function buildEmptyBucket(label: string): StatsBucket {
  return {
    label,
    achados: 0,
    tentativaMenorBarrada: 0,
    entregasFornecedores: 0,
    encomendas: 0,
    helpdesk: 0,
    ocorrencias: 0,
  }
}

function buildStatsBuckets(period: StatsPeriod, reports: Array<{ data_relatorio: string; conteudo: any }>) {
  const today = startOfDay(new Date())
  const buckets: StatsBucket[] = []
  const sourceMap = new Map<string, StatsBucket>()

  if (period === '6m' || period === '1y') {
    const totalMonths = period === '6m' ? 6 : 12

    for (let i = totalMonths - 1; i >= 0; i -= 1) {
      const current = startOfDay(addMonths(today, -i))
      current.setDate(1)
      const label = monthLabel(current)
      const bucket = buildEmptyBucket(label)
      buckets.push(bucket)
      sourceMap.set(label, bucket)
    }

    reports.forEach((report) => {
      const reportDate = parseDateOnly(report.data_relatorio)
      const label = monthLabel(reportDate)
      const bucket = sourceMap.get(label)
      if (!bucket) return

      const data = report.conteudo
      bucket.achados += countFilledRows(data.achados || [], ['local', 'objeto'])
      bucket.tentativaMenorBarrada += (data.tentativaMenor || []).filter((item: any) => isBlockedAttempt(item.possuiAutorizacao || '')).length
      bucket.entregasFornecedores += countFilledRows(data.entregaFornecedores || [], ['empresa'])
      bucket.encomendas += countFilledRows(data.encomendas || [], ['proprietario', 'quantidade', 'uh'])
      bucket.helpdesk += countFilledRows(data.helpdesk || [], ['nome', 'descricao', 'chamado', 'setor'])
      bucket.ocorrencias += (data.ocorrencias || []).filter((item: any) => hasAnyText(item.titulo) || hasAnyText(item.descricao)).length
    })

    return buckets
  }

  const totalDays = period === '7d' ? 7 : 30
  const startDate = addDays(today, -(totalDays - 1))

  for (let i = 0; i < totalDays; i += 1) {
    const current = addDays(startDate, i)
    const label = dayLabel(current)
    const bucket = buildEmptyBucket(label)
    buckets.push(bucket)
    sourceMap.set(label, bucket)
  }

  reports.forEach((report) => {
    const reportDate = parseDateOnly(report.data_relatorio)
    if (reportDate < startDate || reportDate > today) return

    const label = dayLabel(reportDate)
    const bucket = sourceMap.get(label)
    if (!bucket) return

    const data = report.conteudo
    bucket.achados += countFilledRows(data.achados || [], ['local', 'objeto'])
    bucket.tentativaMenorBarrada += (data.tentativaMenor || []).filter((item: any) => isBlockedAttempt(item.possuiAutorizacao || '')).length
    bucket.entregasFornecedores += countFilledRows(data.entregaFornecedores || [], ['empresa'])
    bucket.encomendas += countFilledRows(data.encomendas || [], ['proprietario', 'quantidade', 'uh'])
    bucket.helpdesk += countFilledRows(data.helpdesk || [], ['nome', 'descricao', 'chamado', 'setor'])
    bucket.ocorrencias += (data.ocorrencias || []).filter((item: any) => hasAnyText(item.titulo) || hasAnyText(item.descricao)).length
  })

  return buckets
}

function sumMetric(items: StatsBucket[], key: MetricKey) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0)
}

function averageMetric(items: StatsBucket[], key: MetricKey) {
  if (items.length === 0) return 0
  return Number((sumMetric(items, key) / items.length).toFixed(1))
}

export default function Estatisticas() {
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('30d')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | ''>('')
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsData, setStatsData] = useState<StatsBucket[]>([])

  const metric = useMemo(
    () => METRICS.find((item) => item.key === selectedMetric) || null,
    [selectedMetric]
  )

  const totalValue = useMemo(
    () => (selectedMetric ? sumMetric(statsData, selectedMetric) : 0),
    [selectedMetric, statsData]
  )

  const averageValue = useMemo(
    () => (selectedMetric ? averageMetric(statsData, selectedMetric) : 0),
    [selectedMetric, statsData]
  )

  const peakBucket = useMemo(() => {
    if (!selectedMetric || statsData.length === 0) return null
    return [...statsData].sort((a, b) => Number(b[selectedMetric]) - Number(a[selectedMetric]))[0]
  }, [selectedMetric, statsData])

  const loadStats = async (period: StatsPeriod) => {
    setStatsLoading(true)

    try {
      const allReports = await listRelatorios({ status: 'finalizado' })
      const principalReports = allReports.filter((item) => item.is_principal)

      const details = await Promise.all(
        principalReports.map(async (item) => {
          const detail = await getRelatorioById(item.id)
          return {
            id: item.id,
            data_relatorio: item.data_relatorio,
            conteudo: detail.conteudo,
          }
        })
      )

      setStatsData(buildStatsBuckets(period, details))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar as estatísticas.'
      toast({ title: 'Erro ao carregar estatísticas', description: message, variant: 'destructive' })
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadStats(statsPeriod)
  }, [statsPeriod])

  return (
    <div className="fade-in space-y-6">
      <div className="page-header rounded-lg">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm opacity-80 mt-1">Acompanhe tendências operacionais com base nas versões principais salvas no banco.</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={statsPeriod === '7d' ? 'default' : 'outline'} onClick={() => setStatsPeriod('7d')}>
            Últimos 7 dias
          </Button>
          <Button size="sm" variant={statsPeriod === '30d' ? 'default' : 'outline'} onClick={() => setStatsPeriod('30d')}>
            Últimos 30 dias
          </Button>
          <Button size="sm" variant={statsPeriod === '6m' ? 'default' : 'outline'} onClick={() => setStatsPeriod('6m')}>
            Últimos 6 meses
          </Button>
          <Button size="sm" variant={statsPeriod === '1y' ? 'default' : 'outline'} onClick={() => setStatsPeriod('1y')}>
            1 ano
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {METRICS.map((item) => {
            const Icon = item.icon
            const isActive = selectedMetric === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedMetric(item.key)}
                className={`rounded-2xl border text-left p-4 transition-all ${
                  isActive
                    ? 'border-primary shadow-md bg-primary/5'
                    : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-base font-semibold">{item.title}</div>
                    <p className="text-sm text-muted-foreground leading-5">{item.description}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ backgroundColor: item.area }}>
                    <Icon className="w-5 h-5" color={item.accent} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {!selectedMetric && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Selecione acima o indicador que você deseja analisar.
        </div>
      )}

      {selectedMetric && metric && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Total no período</div>
              <div className="mt-2 text-3xl font-bold" style={{ color: metric.accent }}>{totalValue}</div>
              <div className="mt-2 text-xs text-muted-foreground">{metric.title}</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Média por intervalo</div>
              <div className="mt-2 text-3xl font-bold">{averageValue}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {statsPeriod === '7d' || statsPeriod === '30d' ? 'Média diária' : 'Média mensal'}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Maior pico</div>
              <div className="mt-2 text-3xl font-bold">
                {peakBucket ? Number(peakBucket[selectedMetric]) : 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {peakBucket ? `Em ${peakBucket.label}` : 'Sem dados no período'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{metric.title}</h2>
                  <p className="text-sm text-muted-foreground">Evolução no período selecionado</p>
                </div>
              </div>

              {statsLoading ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  Carregando estatísticas...
                </div>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData}>
                      <defs>
                        <linearGradient id="statsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={metric.accent} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={metric.accent} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey={metric.key}
                        stroke={metric.accent}
                        strokeWidth={2.5}
                        fill="url(#statsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Distribuição</h2>
                <p className="text-sm text-muted-foreground">Comparação por intervalo</p>
              </div>

              {statsLoading ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  Carregando estatísticas...
                </div>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" fontSize={11} />
                      <YAxis allowDecimals={false} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey={metric.key} fill={metric.accent} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Linha detalhada</h2>
              <p className="text-sm text-muted-foreground">Leitura refinada da tendência para {metric.title.toLowerCase()}.</p>
            </div>

            {statsLoading ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Carregando estatísticas...
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.accent}
                      strokeWidth={3}
                      dot={{ r: 4, fill: metric.accent }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
