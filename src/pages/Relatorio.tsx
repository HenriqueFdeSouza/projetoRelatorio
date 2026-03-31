import { useState, useCallback, useRef, useMemo, type ChangeEvent, type ClipboardEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { storage, getDiaSemana, createEmptyReport } from '@/lib/storage';
import {
  ReportData, INTERFONE_OPTIONS, ReportShift,
  Colaborador, SupervisorCastelo, Fornecedor, Gestor, Plantonista, TipoEntrega, Setor,
  VisitaRow, GecRow, AchadoRow, AutorizacaoMenorRow, TentativaMenorRow,
  SaidaMaterialRow, TesourariaRow, EntradaGestorRow, EntregaHospedeRow,
  EntregaFornecedorRow, HelpdeskRow, EncomendaRow, OcorrenciaItem,
} from '@/lib/types';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FileDown,
  RotateCcw,
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { generatePDF } from '@/lib/pdfExport';
import { configuracoesAdmin } from '@/lib/configuracoesAdmin';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getColaboradores,
  getSupervisoresCastelo,
  getFornecedores,
  getGestores,
  getPlantonistas,
  getTiposEntrega,
  getPrestadores,
  getSetores,
} from '@/lib/api/cadastros'



export default function Relatorio() {

  useEffect(() => {
  console.log('URL SUPABASE:', import.meta.env.VITE_SUPABASE_URL)
  console.log('KEY EXISTE:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

  async function testar() {
    const { data, error } = await supabase
      .from('funcoes_seguranca')
      .select('*')

    console.log('DADOS:', data)
    console.log('ERRO:', error)
  }

  testar()
}, [])

  const imageViewId = useMemo(() => new URLSearchParams(window.location.search).get('ocorrenciaImagem'), []);
  const reportFromStorage = useMemo(() => storage.getReport(), []);
  const occurrenceForImageView = useMemo(() => {
    if (!imageViewId) return null;
    return reportFromStorage.ocorrencias.find((oc) => oc.imagemId === imageViewId && oc.imagemBase64) || null;
  }, [imageViewId, reportFromStorage]);

  const [report, setReport] = useState<ReportData>(reportFromStorage);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  const autoSave = useCallback((data: ReportData) => { storage.setReport(data); }, []);
  const update = useCallback((partial: Partial<ReportData>) => {
    setReport(prev => { const next = { ...prev, ...partial }; autoSave(next); return next; });
  }, [autoSave]);

  useEffect(() => {
    if (report.data) {
      const d = new Date(report.data + 'T12:00:00');
      const dia = getDiaSemana(d);
      if (dia !== report.diaSemana) update({ diaSemana: dia });
    }
  }, [report.data]);

  if (imageViewId) {
    if (!occurrenceForImageView?.imagemBase64) {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="max-w-lg w-full rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <h1 className="text-xl font-bold">Imagem da ocorrência não encontrada</h1>
            <p className="text-sm text-muted-foreground">A imagem não está disponível neste navegador ou foi removida do relatório.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h1 className="text-xl font-bold">{occurrenceForImageView.titulo || 'Imagem da ocorrência'}</h1>
            <p className="text-sm text-muted-foreground">Ocorrência aberta a partir do link do PDF.</p>
          </div>

          {occurrenceForImageView.descricao && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Descrição</div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{occurrenceForImageView.descricao}</p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex justify-center overflow-hidden rounded-md border border-border bg-muted/20 p-3">
              <img
                src={occurrenceForImageView.imagemBase64}
                alt={occurrenceForImageView.titulo || 'Imagem da ocorrência'}
                className="max-h-[72vh] w-auto max-w-full rounded-md object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }


  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const isOpen = (key: string) => openSections[key] !== false;

  // Load config data
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [supervisoresCastelo, setSupervisoresCastelo] = useState<SupervisorCastelo[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [plantonistas, setPlantonistas] = useState<Plantonista[]>([]);
  const [tiposEntrega, setTiposEntrega] = useState<TipoEntrega[]>([]);
  const [prestadores, setPrestadores] = useState<Fornecedor[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  const empresasPrestadores = useMemo(() => {
    const mapa = new Map<string, Fornecedor>();

    [...fornecedores, ...prestadores].forEach((item) => {
      const nome = item.nome?.trim();
      if (!nome) return;

      const existente = mapa.get(nome);
      if (!existente) {
        mapa.set(nome, item);
        return;
      }

      if (!existente.setor?.trim() && item.setor?.trim()) {
        mapa.set(nome, item);
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fornecedores, prestadores]);

  useEffect(() => {
    async function carregarCadastros() {
      try {
        const [
          colaboradoresData,
          supervisoresData,
          fornecedoresData,
          gestoresData,
          plantonistasData,
          tiposEntregaData,
          prestadoresData,
          setoresData,
        ] = await Promise.all([
          getColaboradores(),
          getSupervisoresCastelo(),
          getFornecedores(),
          getGestores(),
          getPlantonistas(),
          getTiposEntrega(),
          getPrestadores(),
          getSetores(),
        ]);

        setColaboradores(colaboradoresData);
        setSupervisoresCastelo(supervisoresData);
        setFornecedores(fornecedoresData);
        setGestores(gestoresData);
        setPlantonistas(plantonistasData);
        setTiposEntrega(tiposEntregaData);
        setPrestadores(prestadoresData);
        setSetores(setoresData);
      } catch (error) {
        console.error('Erro ao carregar cadastros:', error);
      }
    }

    carregarCadastros();
  }, []);

  const handleNewReport = () => {
    const fresh = createEmptyReport();
    setReport(fresh); storage.setReport(fresh);
    toast({ title: 'Novo plantão', description: 'Relatório limpo. Cadastros mantidos.' });
  };

  const handleExportPDF = async () => {
  try {
    const plantonistaSelecionado = plantonistas.find(
      (p) => p.nome === report.plantonista
    );

    const reportParaPdf = {
      ...report,
      plantonista: plantonistaSelecionado
        ? `${plantonistaSelecionado.nome} — ${plantonistaSelecionado.cargo}`
        : report.plantonista,
    };

    await generatePDF(reportParaPdf);
    toast({ title: 'PDF gerado!' });
  } catch {
    toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
  }
};


  const handlePreencherPadrao = () => {
  update({
    efetivo: configuracoesAdmin.efetivo,
    elevadorTeste: configuracoesAdmin.elevadores,
    radiosRecebimento: configuracoesAdmin.radios.recebimento,
    radiosPassagem: configuracoesAdmin.radios.passagem,
    mesCrachas: configuracoesAdmin.crachas.mes,
    crachas: [
      {
        descricao: 'VISITANTES',
        quantidade: configuracoesAdmin.crachas.visitantes,
        cor: configuracoesAdmin.crachas.cor
      },
      {
        descricao: 'PROVISÓRIOS',
        quantidade: configuracoesAdmin.crachas.provisórios,
        cor: configuracoesAdmin.crachas.cor
      }
    ]
  });
};



  const updateArray = <T,>(key: keyof ReportData, index: number, value: T) => {
    const arr = [...(report[key] as T[])]; arr[index] = value;
    update({ [key]: arr } as Partial<ReportData>);
  };
  const addToArray = <T,>(key: keyof ReportData, item: T) => {
    update({ [key]: [...(report[key] as T[]), item] } as Partial<ReportData>);
  };
  const removeFromArray = (key: keyof ReportData, index: number) => {
    update({ [key]: (report[key] as unknown[]).filter((_, i) => i !== index) } as Partial<ReportData>);
  };

  const readImageAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(file);
  });

  const createOccurrenceImageId = () => `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getOccurrenceImageViewUrl = (imagemId?: string) => {
    if (!imagemId) return '#';
    return `${window.location.origin}${window.location.pathname}?ocorrenciaImagem=${encodeURIComponent(imagemId)}`;
  };

  const attachImageToOccurrence = async (file: File, index: number) => {
    try {
      const imagemBase64 = await readImageAsBase64(file);
      const ocorrenciaAtual = report.ocorrencias[index];
      if (!ocorrenciaAtual) return;
      updateArray('ocorrencias', index, {
        ...ocorrenciaAtual,
        imagemBase64,
        imagemId: ocorrenciaAtual.imagemId || createOccurrenceImageId(),
        imagemNome: file.name || 'imagem-ocorrencia',
      });
    } catch {
      toast({ title: 'Erro ao anexar imagem', variant: 'destructive' });
    }
  };

  const handleOccurrenceImageUpload = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await attachImageToOccurrence(file, index);
    event.target.value = '';
  };

  const handleOccurrencePaste = async (event: ClipboardEvent<HTMLTextAreaElement>, index: number) => {
    const items = Array.from(event.clipboardData?.items || []) as DataTransferItem[];
    const imageItem = items.find((item: DataTransferItem) => item.type.startsWith('image/'));

    if (!imageItem) return;

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    try {
      await attachImageToOccurrence(file, index);
    } catch {
      toast({ title: 'Erro ao colar imagem', variant: 'destructive' });
    }
  };

  return (
    <div className="fade-in" ref={reportRef}>
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="page-header rounded-lg flex-1 min-w-[300px]">
          <h1 className="text-xl font-bold">RELATÓRIO {report.tipoRelatorio}</h1>
          <p className="text-xs opacity-80">Departamento de Segurança Patrimonial</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportPDF} className="gap-2"><FileDown className="w-4 h-4" /> Gerar PDF</Button>
          <Button variant="secondary" onClick={handlePreencherPadrao} className="gap-2">Preencher padrão</Button>
          <Button variant="outline" onClick={handleNewReport} className="gap-2"><RotateCcw className="w-4 h-4" /> Novo Plantão</Button>
        </div>
      </div>

      {/* Header fields */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Data</label>
          <Input type="date" value={report.data} onChange={e => update({ data: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Dia da Semana</label>
          <Input value={report.diaSemana} readOnly className="bg-muted" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Tipo de Relatório</label>
          <select
            value={report.tipoRelatorio}
            onChange={e => update({ tipoRelatorio: e.target.value as ReportShift })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DIURNO">DIURNO</option>
            <option value="NOTURNO">NOTURNO</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Plantonista</label>
          <FreeTextCombobox
            value={report.plantonista}
            onChange={value => update({ plantonista: value })}
            options={plantonistas.map(p => ({ value: p.nome, label: `${p.nome} — ${p.cargo}` }))}
            placeholder="Digite..."
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* 1.1 Efetivo */}
        <Section id="1.1" title="1.1 — Efetivo de Segurança" isOpen={isOpen('1.1')} toggle={() => toggle('1.1')}>
          <table className="report-table">
            <thead><tr><th>Função</th><th>Nome</th><th>Horário</th><th>Rádio</th></tr></thead>
            <tbody>
              {report.efetivo.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border border-border font-medium">{row.funcao}</td>
                  <td className="px-3 py-2 border border-border">
                    <FreeTextCombobox
                      value={row.nome}
                      onChange={value => {
                        const colaborador = colaboradores.find(c => c.nome === value);
                        const arr = [...report.efetivo];
                        arr[i] = { ...row, nome: value, horario: colaborador?.horario || row.horario };
                        update({ efetivo: arr });
                      }}
                      options={colaboradores
                        .filter(c => c.nome?.trim())
                        .map((c, idx) => ({
                          value: c.nome,
                          label: c.horario?.trim() ? `${c.nome} — ${c.horario}` : c.nome || `Colaborador ${idx + 1}`,
                        }))}
                      placeholder="Digite..."
                    />
                  </td>
                  <td className="px-3 py-2 border border-border">
                    <TimeInput value={row.horario} onChange={v => { const arr = [...report.efetivo]; arr[i] = { ...row, horario: v }; update({ efetivo: arr }); }} placeholder="07:00-19:00" allowRange />
                  </td>
                  <td className="px-3 py-2 border border-border">
                    <Input value={row.radio} onChange={e => { const arr = [...report.efetivo]; arr[i] = { ...row, radio: e.target.value }; update({ efetivo: arr }); }} placeholder="-" className="w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 1.2 Visita Castelo Borges */}
        <Section id="1.2" title="1.2 — Visita Castelo Borges" isOpen={isOpen('1.2')} toggle={() => toggle('1.2')}>
          <DynamicTable<VisitaRow>
            columns={['Nome', 'Função', 'Entrada', 'Saída']}
            rows={report.visitas}
            renderRow={(row, i) => (
              <>
                <td className="px-3 py-2 border border-border">
                  <FreeTextCombobox
                    value={row.nome}
                    onChange={value => {
                      const s = supervisoresCastelo.find(s => s.nome === value);
                      updateArray('visitas', i, { ...row, nome: value, funcao: s?.funcao || row.funcao });
                    }}
                    options={supervisoresCastelo.map(s => ({ value: s.nome, label: s.nome }))}
                    placeholder="Digite..."
                  />
                </td>
                <TdInput value={row.funcao} onChange={v => updateArray('visitas', i, { ...row, funcao: v })} />
                <TdInput value={row.entrada} onChange={v => updateArray('visitas', i, { ...row, entrada: v })} placeholder="HH:MM" isTime />
                <TdInput value={row.saida} onChange={v => updateArray('visitas', i, { ...row, saida: v })} placeholder="HH:MM" isTime />
              </>
            )}
            onAdd={() => addToArray('visitas', { nome: '', funcao: '', entrada: '', saida: '' })}
            onRemove={i => removeFromArray('visitas', i)}
          />
        </Section>

        {/* 1.3 Ocupação */}
        <Section id="1.3" title="1.3 — Ocupação do Resort" isOpen={isOpen('1.3')} toggle={() => toggle('1.3')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ocupação Atual (%)" value={report.ocupacao.atual} onChange={v => update({ ocupacao: { ...report.ocupacao, atual: v } })} />
              <Field label="Ocupação Prevista (%)" value={report.ocupacao.prevista} onChange={v => update({ ocupacao: { ...report.ocupacao, prevista: v } })} />
              <Field label="Check-in" value={report.ocupacao.checkin} onChange={v => update({ ocupacao: { ...report.ocupacao, checkin: v } })} />
              <Field label="Check-out" value={report.ocupacao.checkout} onChange={v => update({ ocupacao: { ...report.ocupacao, checkout: v } })} />
            </div>
            <OccupancyStats ocupacao={report.ocupacao} />
          </div>
        </Section>

        {/* 1.4 Estacionamento */}
        <Section id="1.4" title="1.4 — Controle de Estacionamento" isOpen={isOpen('1.4')} toggle={() => toggle('1.4')}>
          <table className="report-table">
            <thead><tr><th>Local</th><th>Capacidade</th><th>Quantidade</th><th>Agente</th></tr></thead>
            <tbody>
              {report.estacionamento.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border border-border font-medium">{row.local}</td>
                  <td className="px-3 py-2 border border-border">{row.capacidade}</td>
                  <td className="px-3 py-2 border border-border">
                    <Input value={row.quantidade} onChange={e => { const arr = [...report.estacionamento]; arr[i] = { ...row, quantidade: e.target.value }; update({ estacionamento: arr }); }} placeholder="0" />
                  </td>
                  <td className="px-3 py-2 border border-border">
                    <Input value={row.agente} onChange={e => { const arr = [...report.estacionamento]; arr[i] = { ...row, agente: e.target.value }; update({ estacionamento: arr }); }} />
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="px-3 py-2 border border-border">TOTAL</td>
                <td className="px-3 py-2 border border-border">{report.estacionamento.reduce((s, r) => s + r.capacidade, 0)}</td>
                <td className="px-3 py-2 border border-border">{report.estacionamento.reduce((s, r) => s + (parseInt(r.quantidade) || 0), 0)}</td>
                <td className="px-3 py-2 border border-border">-</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* 1.5 Viatura */}
        <Section id="1.5" title="1.5 — Viatura / Apoio" isOpen={isOpen('1.5')} toggle={() => toggle('1.5')}>
          <table className="report-table">
            <thead><tr><th>Nome</th><th>Horário 1</th><th>Horário 2</th><th>Horário 3</th></tr></thead>
            <tbody>
              {report.viaturas.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border border-border font-medium">{row.nome}</td>
                  <td className="px-3 py-2 border border-border"><TimeInput value={row.horario1} onChange={v => { const arr = [...report.viaturas]; arr[i] = { ...row, horario1: v }; update({ viaturas: arr }); }} /></td>
                  <td className="px-3 py-2 border border-border"><TimeInput value={row.horario2} onChange={v => { const arr = [...report.viaturas]; arr[i] = { ...row, horario2: v }; update({ viaturas: arr }); }} /></td>
                  <td className="px-3 py-2 border border-border"><TimeInput value={row.horario3} onChange={v => { const arr = [...report.viaturas]; arr[i] = { ...row, horario3: v }; update({ viaturas: arr }); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 1.6 Elevadores */}
        <Section id="1.6" title="1.6 — Teste Interfone/Alarme/Elevadores" isOpen={isOpen('1.6')} toggle={() => toggle('1.6')}>
          <table className="report-table">
            <thead><tr><th>Elevador/Bloco</th><th>Horário</th><th>Interfone</th><th>Alarme</th><th>Agente</th></tr></thead>
            <tbody>
              {report.elevadorTeste.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border border-border font-medium">{row.elevador}</td>
                  <td className="px-3 py-2 border border-border"><TimeInput value={row.horario} onChange={v => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, horario: v }; update({ elevadorTeste: arr }); }} /></td>
                  <td className="px-3 py-2 border border-border">
                    <FreeTextCombobox
                      value={row.interfone}
                      onChange={value => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, interfone: value }; update({ elevadorTeste: arr }); }}
                      options={INTERFONE_OPTIONS.map(o => ({ value: o, label: o }))}
                      placeholder="Digite..."
                    />
                  </td>
                  <td className="px-3 py-2 border border-border">
                    <FreeTextCombobox
                      value={row.alarme}
                      onChange={value => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, alarme: value }; update({ elevadorTeste: arr }); }}
                      options={INTERFONE_OPTIONS.map(o => ({ value: o, label: o }))}
                      placeholder="Digite..."
                    />
                  </td>
                  <td className="px-3 py-2 border border-border"><Input value={row.agente} onChange={e => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, agente: e.target.value }; update({ elevadorTeste: arr }); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 1.7 Rádios */}
        <Section id="1.7" title="1.7 — Controle de Rádios" isOpen={isOpen('1.7')} toggle={() => toggle('1.7')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Total no Recebimento do Plantão" value={report.radiosRecebimento} onChange={v => update({ radiosRecebimento: v })} />
            <Field label="Total na Passagem de Plantão" value={report.radiosPassagem} onChange={v => update({ radiosPassagem: v })} />
          </div>
        </Section>

        {/* 1.8/1.9 Crachás */}
        <Section id="1.8" title="1.8/1.9 — Crachás na Portaria" isOpen={isOpen('1.8')} toggle={() => toggle('1.8')}>
          <div className="mb-3">
            <Field label="Mês de Referência" value={report.mesCrachas} onChange={v => update({ mesCrachas: v })} />
          </div>
          <table className="report-table">
            <thead><tr><th>Descrição</th><th>Quantidade</th><th>Cor</th></tr></thead>
            <tbody>
              {report.crachas.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border border-border font-medium">{row.descricao}</td>
                  <td className="px-3 py-2 border border-border"><Input value={row.quantidade} onChange={e => { const arr = [...report.crachas]; arr[i] = { ...row, quantidade: e.target.value }; update({ crachas: arr }); }} /></td>
                  <td className="px-3 py-2 border border-border"><Input value={row.cor} onChange={e => { const arr = [...report.crachas]; arr[i] = { ...row, cor: e.target.value }; update({ crachas: arr }); }} /></td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="px-3 py-2 border border-border">TOTAL</td>
                <td className="px-3 py-2 border border-border">{report.crachas.reduce((s, r) => s + (parseInt(r.quantidade) || 0), 0)}</td>
                <td className="px-3 py-2 border border-border">-</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* 1.10 GEC */}
        <Section id="1.10" title="1.10 — Liberação Sistema GEC" isOpen={isOpen('1.10')} toggle={() => toggle('1.10')}>
          <DynamicTable<GecRow>
            columns={['Empresa', 'Quantidade', 'Setor', 'Status', 'Atividade']}
            rows={report.gec}
            renderRow={(row, i) => (
              <>
                <td className="px-3 py-2 border border-border">
                  <FreeTextCombobox
                    value={row.empresa}
                    onChange={value => {
                      const f = fornecedores.find(fornecedor => fornecedor.nome === value);
                      updateArray('gec', i, { ...row, empresa: value, setor: f?.setor || row.setor });
                    }}
                    options={fornecedores.map(f => ({ value: f.nome, label: f.nome }))}
                    placeholder="Selecione ou digite..."
                  />
                </td>
                <TdInput value={row.quantidade} onChange={v => updateArray('gec', i, { ...row, quantidade: v })} />
                <TdSectorSelect value={row.setor} onChange={v => updateArray('gec', i, { ...row, setor: v })} setores={setores} />
                <td className="px-3 py-2 border border-border">
                  <select value={row.status} onChange={e => updateArray('gec', i, { ...row, status: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                    <option value="">-</option>
                    <option value="LIBERADO">LIBERADO</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                  </select>
                </td>
                <TdInput value={row.atividade} onChange={v => updateArray('gec', i, { ...row, atividade: v })} />
              </>
            )}
            onAdd={() => addToArray('gec', { empresa: '', quantidade: '', setor: '', status: '', atividade: '' })}
            onRemove={i => removeFromArray('gec', i)}
          />
        </Section>

        {/* 1.11 Achados */}
        <Section id="1.11" title="1.11 — Achados e Perdidos" isOpen={isOpen('1.11')} toggle={() => toggle('1.11')}>
          <DynamicTable<AchadoRow>
            columns={['Local', 'Segurança', 'Objeto Encontrado', 'Entregue para']}
            rows={report.achados}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.local} onChange={v => updateArray('achados', i, { ...row, local: v })} />
                <TdInput value={row.seguranca} onChange={v => updateArray('achados', i, { ...row, seguranca: v })} />
                <TdInput value={row.objeto} onChange={v => updateArray('achados', i, { ...row, objeto: v })} />
                <TdInput value={row.entregue} onChange={v => updateArray('achados', i, { ...row, entregue: v })} />
              </>
            )}
            onAdd={() => addToArray('achados', { local: '', seguranca: '', objeto: '', entregue: '' })}
            onRemove={i => removeFromArray('achados', i)}
          />
        </Section>

        {/* 1.12 Autorização Menor */}
        <Section id="1.12" title="1.12 — Autorização de Saída de Menor" isOpen={isOpen('1.12')} toggle={() => toggle('1.12')}>
          <DynamicTable<AutorizacaoMenorRow>
            columns={['Nome da Criança', 'Autorizador', 'UH', 'Validade', 'Status']}
            rows={report.autorizacaoMenor}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.nomeCrianca} onChange={v => updateArray('autorizacaoMenor', i, { ...row, nomeCrianca: v })} />
                <TdInput value={row.autorizador} onChange={v => updateArray('autorizacaoMenor', i, { ...row, autorizador: v })} />
                <TdInput value={row.uh} onChange={v => updateArray('autorizacaoMenor', i, { ...row, uh: v })} />
                <TdInput value={row.validade} onChange={v => updateArray('autorizacaoMenor', i, { ...row, validade: v })} />
                <TdInput value={row.status} onChange={v => updateArray('autorizacaoMenor', i, { ...row, status: v })} />
              </>
            )}
            onAdd={() => addToArray('autorizacaoMenor', { nomeCrianca: '', autorizador: '', uh: '', validade: '', status: '' })}
            onRemove={i => removeFromArray('autorizacaoMenor', i)}
          />
        </Section>

        {/* 1.13 Tentativa Menor */}
        <Section id="1.13" title="1.13 — Tentativa de Saída de Menor Desacompanhado" isOpen={isOpen('1.13')} toggle={() => toggle('1.13')}>
          <DynamicTable<TentativaMenorRow>
            columns={['Nome da Criança', 'UH', 'Portaria Social/Praia', 'Possui Autorização?']}
            rows={report.tentativaMenor}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.nomeCrianca} onChange={v => updateArray('tentativaMenor', i, { ...row, nomeCrianca: v })} />
                <TdInput value={row.uh} onChange={v => updateArray('tentativaMenor', i, { ...row, uh: v })} />
                <TdInput value={row.portaria} onChange={v => updateArray('tentativaMenor', i, { ...row, portaria: v })} />
                <TdInput value={row.possuiAutorizacao} onChange={v => updateArray('tentativaMenor', i, { ...row, possuiAutorizacao: v })} />
              </>
            )}
            onAdd={() => addToArray('tentativaMenor', { nomeCrianca: '', uh: '', portaria: '', possuiAutorizacao: '' })}
            onRemove={i => removeFromArray('tentativaMenor', i)}
          />
        </Section>

        {/* 1.14 Saída Material */}
        <Section id="1.14" title="1.14 — Saída de Material" isOpen={isOpen('1.14')} toggle={() => toggle('1.14')}>
          <DynamicTable<SaidaMaterialRow>
            columns={['Responsável', 'Setor', 'Autorizador', 'Descrição', 'Retorno']}
            rows={report.saidaMaterial}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.responsavel} onChange={v => updateArray('saidaMaterial', i, { ...row, responsavel: v })} />
                <TdSectorSelect value={row.setor} onChange={v => updateArray('saidaMaterial', i, { ...row, setor: v })} setores={setores} />
                <TdInput value={row.autorizador} onChange={v => updateArray('saidaMaterial', i, { ...row, autorizador: v })} />
                <TdInput value={row.descricao} onChange={v => updateArray('saidaMaterial', i, { ...row, descricao: v })} />
                <TdInput value={row.retorno} onChange={v => updateArray('saidaMaterial', i, { ...row, retorno: v })} />
              </>
            )}
            onAdd={() => addToArray('saidaMaterial', { responsavel: '', setor: '', autorizador: '', descricao: '', retorno: '' })}
            onRemove={i => removeFromArray('saidaMaterial', i)}
          />
        </Section>

        {/* 1.15 Tesouraria */}
        <Section id="1.15" title="1.15 — Procedimento Tesouraria" isOpen={isOpen('1.15')} toggle={() => toggle('1.15')}>
          <DynamicTable<TesourariaRow>
            columns={['Nome', 'Entrada', 'Saída', 'Nível', 'Senha', 'Destino']}
            rows={report.tesouraria}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.nome} onChange={v => updateArray('tesouraria', i, { ...row, nome: v })} />
                <TdInput value={row.entrada} onChange={v => updateArray('tesouraria', i, { ...row, entrada: v })} isTime />
                <TdInput value={row.saida} onChange={v => updateArray('tesouraria', i, { ...row, saida: v })} isTime />
                <TdInput value={row.nivel} onChange={v => updateArray('tesouraria', i, { ...row, nivel: v })} />
                <TdInput value={row.senha} onChange={v => updateArray('tesouraria', i, { ...row, senha: v })} />
                <TdInput value={row.destino} onChange={v => updateArray('tesouraria', i, { ...row, destino: v })} />
              </>
            )}
            onAdd={() => addToArray('tesouraria', { nome: '', entrada: '', saida: '', nivel: '', senha: '', destino: '' })}
            onRemove={i => removeFromArray('tesouraria', i)}
          />
        </Section>

        {/* 1.16 Entradas Gestores */}
        <Section id="1.16" title="1.16 — Entradas de Gestores/Líderes na Portaria" isOpen={isOpen('1.16')} toggle={() => toggle('1.16')}>
          <DynamicTable<EntradaGestorRow>
            columns={['Entrada', 'Nome', 'Setor/Cargo', 'Saída']}
            rows={report.entradaGestores}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.entrada} onChange={v => updateArray('entradaGestores', i, { ...row, entrada: v })} placeholder="HH:MM" isTime />
                <td className="px-3 py-2 border border-border">
                  <FreeTextCombobox
                    value={row.nome}
                    onChange={value => {
                      const g = gestores.find(gestor => gestor.nome === value);
                      updateArray('entradaGestores', i, { ...row, nome: value, setorCargo: g?.setorCargo || row.setorCargo });
                    }}
                    options={gestores.map(g => ({ value: g.nome, label: g.nome }))}
                    placeholder="Selecione ou digite..."
                  />
                </td>
                <TdInput value={row.setorCargo} onChange={v => updateArray('entradaGestores', i, { ...row, setorCargo: v })} />
                <TdInput value={row.saida} onChange={v => updateArray('entradaGestores', i, { ...row, saida: v })} placeholder="HH:MM" isTime />
              </>
            )}
            onAdd={() => addToArray('entradaGestores', { entrada: '', nome: '', setorCargo: '', saida: '' })}
            onRemove={i => removeFromArray('entradaGestores', i)}
          />
        </Section>

        {/* 1.17 Entregas Hóspedes */}
        <Section id="1.17" title="1.17 — Entregas a Hóspedes/Proprietários" isOpen={isOpen('1.17')} toggle={() => toggle('1.17')}>
          <DynamicTable<EntregaHospedeRow>
            columns={['Nº', 'Tipo de Entrega', 'UH']}
            rows={report.entregaHospedes}
            renderRow={(row, i) => (
              <>
                <td className="px-3 py-2 border border-border text-center font-medium w-16">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-3 py-2 border border-border">
                  <FreeTextCombobox
                    value={row.tipo}
                    onChange={value => updateArray('entregaHospedes', i, { ...row, tipo: value })}
                    options={tiposEntrega.map(t => ({ value: t.nome, label: t.nome }))}
                    placeholder="Digite..."
                  />
                </td>
                <TdInput value={row.uh} onChange={v => updateArray('entregaHospedes', i, { ...row, uh: v })} placeholder="0-000" />
              </>
            )}
            onAdd={() => addToArray('entregaHospedes', { numero: '', tipo: '', uh: '' })}
            onRemove={i => removeFromArray('entregaHospedes', i)}
          />
        </Section>

        {/* 1.18 Entregas Fornecedores */}
        <Section id="1.18" title="1.18 — Entregas de Fornecedores/Prestadores" isOpen={isOpen('1.18')} toggle={() => toggle('1.18')}>
          <DynamicTable<EntregaFornecedorRow>
            columns={['Nº', 'Empresa', 'Setor']}
            rows={report.entregaFornecedores}
            renderRow={(row, i) => (
              <>
                <td className="px-3 py-2 border border-border text-center font-medium w-16">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-3 py-2 border border-border">
                  <FreeTextCombobox
                    value={row.empresa}
                    onChange={value => {
                      const empresaSelecionada = empresasPrestadores.find(item => item.nome === value);
                      updateArray('entregaFornecedores', i, { ...row, empresa: value, setor: empresaSelecionada?.setor || row.setor });
                    }}
                    options={empresasPrestadores.map(item => ({ value: item.nome, label: item.nome }))}
                    placeholder="Selecione ou digite..."
                  />
                </td>
                <TdSectorSelect value={row.setor} onChange={v => updateArray('entregaFornecedores', i, { ...row, setor: v })} setores={setores} />
              </>
            )}
            onAdd={() => addToArray('entregaFornecedores', { numero: '', empresa: '', setor: '' })}
            onRemove={i => removeFromArray('entregaFornecedores', i)}
          />
        </Section>

        {/* 1.19 Falta de Energia */}
        <Section id="1.19" title="1.19 — Falta de Energia" isOpen={isOpen('1.19')} toggle={() => toggle('1.19')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nº Protocolo ENEL" value={report.faltaEnergia.protocolo} onChange={v => update({ faltaEnergia: { ...report.faltaEnergia, protocolo: v } })} />
            <Field label="Horário da Falta" value={report.faltaEnergia.horarioFalta} onChange={v => update({ faltaEnergia: { ...report.faltaEnergia, horarioFalta: v } })} isTime />
            <Field label="Horário do Retorno" value={report.faltaEnergia.horarioRetorno} onChange={v => update({ faltaEnergia: { ...report.faltaEnergia, horarioRetorno: v } })} isTime />
          </div>
        </Section>

        {/* 1.20 HelpDesk */}
        <Section id="1.20" title="1.20 — HelpDesk" isOpen={isOpen('1.20')} toggle={() => toggle('1.20')}>
          <DynamicTable<HelpdeskRow>
            columns={['Nome', 'Descrição', 'Nº Chamado', 'Setor']}
            rows={report.helpdesk}
            renderRow={(row, i) => (
              <>
                <TdInput value={row.nome} onChange={v => updateArray('helpdesk', i, { ...row, nome: v })} />
                <TdInput value={row.descricao} onChange={v => updateArray('helpdesk', i, { ...row, descricao: v })} />
                <TdInput value={row.chamado} onChange={v => updateArray('helpdesk', i, { ...row, chamado: v })} />
                <TdSectorSelect value={row.setor} onChange={v => updateArray('helpdesk', i, { ...row, setor: v })} setores={setores} />
              </>
            )}
            onAdd={() => addToArray('helpdesk', { nome: '', descricao: '', chamado: '', setor: '' })}
            onRemove={i => removeFromArray('helpdesk', i)}
          />
        </Section>

        {/* 1.21 Encomendas */}
        <Section id="1.21" title="1.21 — Encomendas de Proprietários" isOpen={isOpen('1.21')} toggle={() => toggle('1.21')}>
          <DynamicTable<EncomendaRow>
            columns={['Nº', 'UH', 'Quantidade', 'Proprietário']}
            rows={report.encomendas}
            renderRow={(row, i) => (
              <>
                <td className="px-3 py-2 border border-border text-center font-medium w-16">{String(i + 1).padStart(2, '0')}</td>
                <TdInput value={row.uh} onChange={v => updateArray('encomendas', i, { ...row, uh: v })} />
                <TdInput value={row.quantidade} onChange={v => updateArray('encomendas', i, { ...row, quantidade: v })} />
                <TdInput value={row.proprietario} onChange={v => updateArray('encomendas', i, { ...row, proprietario: v })} />
              </>
            )}
            onAdd={() => addToArray('encomendas', { numero: '', uh: '', quantidade: '', proprietario: '' })}
            onRemove={i => removeFromArray('encomendas', i)}
          />
        </Section>

        {/* Ocorrências */}
        <Section id="ocorrencias" title="Ocorrências / Intervenções do Plantão" isOpen={isOpen('ocorrencias')} toggle={() => toggle('ocorrencias')}>
          <div className="space-y-4">
            {report.ocorrencias.map((oc, i) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Input value={oc.titulo} onChange={e => updateArray('ocorrencias', i, { ...oc, titulo: e.target.value })} placeholder="Título da ocorrência" className="font-semibold" />
                  <Button variant="ghost" size="sm" onClick={() => removeFromArray('ocorrencias', i)} className="text-destructive h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea
                  value={oc.descricao}
                  onChange={e => updateArray('ocorrencias', i, { ...oc, descricao: e.target.value })}
                  onPaste={event => handleOccurrencePaste(event, i)}
                  placeholder="Descreva a ocorrência..."
                  rows={3}
                />
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <ImageIcon className="h-4 w-4" />
                      Anexar imagem
                      <input type="file" accept="image/*" className="hidden" onChange={event => handleOccurrenceImageUpload(event, i)} />
                    </label>

                    {oc.imagemBase64 && oc.imagemId && (
                      <>
                        <a
                          href={getOccurrenceImageViewUrl(oc.imagemId)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-primary hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir imagem local
                        </a>

                        <div className="relative inline-flex">
                          <a href={getOccurrenceImageViewUrl(oc.imagemId)} target="_blank" rel="noreferrer">
                            <img
                              src={oc.imagemBase64}
                              alt={oc.imagemNome || 'Imagem da ocorrência'}
                              className="max-h-[80px] max-w-[80px] rounded border border-border object-cover"
                            />
                          </a>
                          <button
                            type="button"
                            onClick={() => updateArray('ocorrencias', i, { ...oc, imagemBase64: undefined, imagemId: undefined, imagemNome: undefined })}
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs shadow"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToArray('ocorrencias', { titulo: '', descricao: '' })} className="gap-1">
              <Plus className="w-3 h-3" /> Adicionar Ocorrência
            </Button>
          </div>
          <div className="mt-6 text-center font-bold text-lg italic text-muted-foreground">"REPASSO O PLANTÃO SEM MAIS"</div>
        </Section>
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={handleExportPDF} size="lg" className="gap-2"><FileDown className="w-5 h-5" /> Gerar PDF do Relatório</Button>
      </div>
    </div>
  );
}

// ─── Shared Components ───

function Section({ title, isOpen, toggle, children }: { id: string; title: string; isOpen: boolean; toggle: () => void; children: ReactNode }) {
  return (
    <div>
      <div className="section-header" onClick={toggle}>
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      {isOpen && <div className="section-body fade-in">{children}</div>}
    </div>
  );
}

function normalizeTimeDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

function formatSingleTimeValue(value: string) {
  const digits = normalizeTimeDigits(value);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function formatTimeValue(value: string, allowRange = false) {
  const normalized = value.replace(/\s+/g, '');
  if (!allowRange) return formatSingleTimeValue(normalized);

  const [startValue = '', endValue = ''] = normalized.split('-');
  const startFormatted = formatSingleTimeValue(startValue);
  const endDigits = normalizeTimeDigits(endValue);
  const endFormatted = endDigits.length <= 2 ? endDigits : `${endDigits.slice(0, 2)}:${endDigits.slice(2, 4)}`;

  if (!normalized.includes('-') && normalizeTimeDigits(normalized).length <= 4) {
    return startFormatted;
  }

  if (normalized.includes('-')) {
    return `${startFormatted}-${endFormatted}`;
  }

  const digits = normalized.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return formatSingleTimeValue(digits);
  return `${formatSingleTimeValue(digits.slice(0, 4))}-${formatSingleTimeValue(digits.slice(4, 8))}`;
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function validateTimeValue(value: string, allowRange = false) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!allowRange) return isValidTime(trimmed);

  const [start, end] = trimmed.split('-');
  if (!start || !end) return false;
  return isValidTime(start) && isValidTime(end);
}

function TimeInput({ value, onChange, placeholder, allowRange = false }: { value: string; onChange: (v: string) => void; placeholder?: string; allowRange?: boolean }) {
  const [touched, setTouched] = useState(false);
  const formattedValue = useMemo(() => formatTimeValue(value, allowRange), [allowRange, value]);
  const digitsCount = value.replace(/\D/g, '').length;
  const shouldValidate = touched || digitsCount >= (allowRange ? 8 : 4);
  const isValid = validateTimeValue(formattedValue, allowRange);
  const showError = shouldValidate && formattedValue !== '' && !isValid;

  useEffect(() => {
    if (formattedValue !== value) {
      onChange(formattedValue);
    }
  }, [formattedValue, onChange, value]);

  return (
    <div>
      <Input
        value={formattedValue}
        onChange={e => onChange(formatTimeValue(e.target.value, allowRange))}
        onBlur={() => {
          setTouched(true);
          onChange(formatTimeValue(formattedValue, allowRange));
        }}
        placeholder={placeholder || 'HH:MM'}
        inputMode="numeric"
        maxLength={allowRange ? 11 : 5}
        className={showError ? 'border-red-500 focus-visible:ring-red-500' : undefined}
      />
      {showError && <p className="mt-1 text-xs text-red-500">Horário inválido</p>}
    </div>
  );
}

function Field({ label, value, onChange, isTime = false }: { label: string; value: string; onChange: (v: string) => void; isTime?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      {isTime ? <TimeInput value={value} onChange={onChange} /> : <Input value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function TdInput({ value, onChange, placeholder, isTime = false }: { value: string; onChange: (v: string) => void; placeholder?: string; isTime?: boolean }) {
  return (
    <td className="px-3 py-2 border border-border">
      {isTime ? (
        <TimeInput value={value} onChange={onChange} placeholder={placeholder || 'HH:MM'} />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || '-'} />
      )}
    </td>
  );
}

function TdSectorSelect({ value, onChange, setores }: { value: string; onChange: (v: string) => void; setores: { id: string; nome: string }[] }) {
  return (
    <td className="px-3 py-2 border border-border">
      <FreeTextCombobox
        value={value}
        onChange={onChange}
        options={setores.map(setor => ({ value: setor.nome, label: setor.nome }))}
        placeholder="Digite..."
      />
    </td>
  );
}

type ComboboxOption = { value: string; label: string };

function FreeTextCombobox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const search = inputValue.trim().toLowerCase();
    if (!search) return options;
    return options.filter(
      option =>
        option.label.toLowerCase().includes(search) ||
        option.value.toLowerCase().includes(search)
    );
  }, [inputValue, options]);

  const handleValueChange = (nextValue: string) => {
    setInputValue(nextValue);
    onChange(nextValue);
  };

  const commitCustomValue = () => {
    const trimmedValue = inputValue.trim();
    setInputValue(trimmedValue);
    onChange(trimmedValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex w-full items-stretch gap-2">
        <Input
          value={inputValue}
          onChange={event => {
            handleValueChange(event.target.value);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              commitCustomValue();
            }, 120);
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitCustomValue();
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full h-10"
        />
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-10 shrink-0 px-0"
            type="button"
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        className="w-[320px] max-w-[var(--radix-popper-available-width)] p-0"
        align="end"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={handleValueChange}
            placeholder="Pesquisar..."
          />
          <CommandList>
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={`__custom__${inputValue}`}
                onSelect={() => {
                  commitCustomValue();
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    filteredOptions.some(option => option.value === value)
                      ? 'opacity-0'
                      : 'opacity-100'
                  )}
                />
                Digitar
              </CommandItem>

              {filteredOptions.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setInputValue(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
function OccupancyStats({ ocupacao }: { ocupacao: ReportData['ocupacao'] }) {
  const colors = {
    atual: '#7B2D8B',
    prevista: '#4CAF50',
    checkin: '#2196F3',
    checkout: '#FF9800',
  };

  const data = [
    { name: 'Atual', value: Number(ocupacao.atual) || 0, fill: colors.atual },
    { name: 'Prevista', value: Number(ocupacao.prevista) || 0, fill: colors.prevista },
    { name: 'Check-in', value: Number(ocupacao.checkin) || 0, fill: colors.checkin },
    { name: 'Check-out', value: Number(ocupacao.checkout) || 0, fill: colors.checkout },
  ];

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 min-h-[220px]">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">Resumo Visual</div>
      <div className="h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={62} tick={{ fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        {data.map(item => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            <span>{item.name}: <strong>{item.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DynamicTable<T>({ columns, rows, renderRow, onAdd, onRemove }: {
  columns: string[]; rows: T[]; renderRow: (row: T, index: number) => ReactNode; onAdd: () => void; onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="report-table">
          <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}<th className="w-10"></th></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="py-4 text-muted-foreground text-center border border-border">Nenhum registro.</td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={i}>
                {renderRow(row, i)}
                <td className="px-1 py-2 border border-border">
                  <Button variant="ghost" size="sm" onClick={() => onRemove(i)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2">
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1"><Plus className="w-3 h-3" /> Adicionar</Button>
      </div>
    </div>
  );
}
