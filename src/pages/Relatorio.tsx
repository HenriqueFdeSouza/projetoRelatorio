import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { storage, getDiaSemana, createEmptyReport } from '@/lib/storage';
import {
  ReportData, INTERFONE_OPTIONS,
  VisitaRow, GecRow, AchadoRow, AutorizacaoMenorRow, TentativaMenorRow,
  SaidaMaterialRow, TesourariaRow, EntradaGestorRow, EntregaHospedeRow,
  EntregaFornecedorRow, HelpdeskRow, EncomendaRow, OcorrenciaItem,
} from '@/lib/types';
import { ChevronDown, ChevronRight, Plus, Trash2, FileDown, RotateCcw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { generatePDF } from '@/lib/pdfExport';
import { configuracoesAdmin } from '@/lib/configuracoesAdmin';


export default function Relatorio() {
  const [report, setReport] = useState<ReportData>(storage.getReport());
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

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const isOpen = (key: string) => openSections[key] !== false;

  // Load config data
  const colaboradores = storage.getColaboradores();
  const supervisoresCastelo = storage.getSupervisoresCastelo();
  const fornecedores = storage.getFornecedores();
  const gestores = storage.getGestores();
  const plantonistas = storage.getPlantonistas();
  const tiposEntrega = storage.getTiposEntrega();
  const prestadores = storage.getPrestadores();
  const setores = storage.getSetores();

  const handleNewReport = () => {
    const fresh = createEmptyReport();
    setReport(fresh); storage.setReport(fresh);
    toast({ title: 'Novo plantão', description: 'Relatório limpo. Cadastros mantidos.' });
  };

  const handleExportPDF = async () => {
    try { await generatePDF(report); toast({ title: 'PDF gerado!' }); }
    catch { toast({ title: 'Erro ao gerar PDF', variant: 'destructive' }); }
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

  return (
    <div className="fade-in" ref={reportRef}>
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="page-header rounded-lg flex-1 min-w-[300px]">
          <h1 className="text-xl font-bold">RELATÓRIO DIURNO</h1>
          <p className="text-xs opacity-80">Departamento de Segurança Patrimonial</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportPDF} className="gap-2"><FileDown className="w-4 h-4" /> Gerar PDF</Button>
          <Button variant="secondary" onClick={handlePreencherPadrao} className="gap-2">Preencher padrão</Button>
          <Button variant="outline" onClick={handleNewReport} className="gap-2"><RotateCcw className="w-4 h-4" /> Novo Plantão</Button>
        </div>
      </div>

      {/* Header fields */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Data</label>
          <Input type="date" value={report.data} onChange={e => update({ data: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Dia da Semana</label>
          <Input value={report.diaSemana} readOnly className="bg-muted" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Plantonista</label>
          <select
            value={report.plantonista}
            onChange={e => update({ plantonista: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {plantonistas.map(p => <option key={p.id} value={p.nome}>{p.nome} — {p.cargo}</option>)}
            
          </select>
          {report.plantonista === '__outro' && (
            <Input className="mt-1" placeholder="Digite o nome..." onChange={e => update({ plantonista: e.target.value })} />
          )}
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
                    <select
                      value={row.nome}
                      onChange={e => {
                        const val = e.target.value;
                        const c = configuracoesAdmin.efetivo.find(c => c.nome === val);
const arr = [...report.efetivo];
arr[i] = { ...row, nome: val, horario: c?.horario || row.horario };
update({ efetivo: arr });
                      }}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {configuracoesAdmin.efetivo.map((c, idx) => (
  <option key={idx} value={c.nome}>{c.nome}</option>
))}
                      
                    </select>
                    
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
                  <select
                    value={supervisoresCastelo.some(s => s.nome === row.nome) ? row.nome : ''}
                    onChange={e => {
                      const s = supervisoresCastelo.find(s => s.nome === e.target.value);
                      updateArray('visitas', i, { ...row, nome: e.target.value, funcao: s?.funcao || row.funcao });
                    }}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {supervisoresCastelo.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                  </select>
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
                    <select value={row.interfone} onChange={e => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, interfone: e.target.value }; update({ elevadorTeste: arr }); }} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                      <option value="">-</option>
                      {INTERFONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-border">
                    <select value={row.alarme} onChange={e => { const arr = [...report.elevadorTeste]; arr[i] = { ...row, alarme: e.target.value }; update({ elevadorTeste: arr }); }} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                      <option value="">-</option>
                      {INTERFONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
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
                  <select
                    value={row.empresa}
                    onChange={e => {
                      const f = fornecedores.find(f => f.nome === e.target.value);
                      updateArray('gec', i, { ...row, empresa: e.target.value, setor: f?.setor || row.setor });
                    }}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                  </select>
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
                  <select
                    value={gestores.some(g => g.nome === row.nome) ? row.nome : ''}
                    onChange={e => {
                      const g = gestores.find(g => g.nome === e.target.value);
                      updateArray('entradaGestores', i, { ...row, nome: e.target.value, setorCargo: g?.setorCargo || row.setorCargo });
                    }}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {gestores.map(g => <option key={g.id} value={g.nome}>{g.nome}</option>)}
                  </select>
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
                  <select value={row.tipo} onChange={e => updateArray('entregaHospedes', i, { ...row, tipo: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                    <option value="">-</option>
                    {tiposEntrega.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                  </select>
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
                  <select
                    value={row.empresa}
                    onChange={e => {
                      const p = prestadores.find(p => p.nome === e.target.value);
                      updateArray('entregaFornecedores', i, { ...row, empresa: e.target.value, setor: p?.setor || row.setor });
                    }}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {prestadores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                  </select>
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
                <Textarea value={oc.descricao} onChange={e => updateArray('ocorrencias', i, { ...oc, descricao: e.target.value })} placeholder="Descreva a ocorrência..." rows={3} />
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

function Section({ title, isOpen, toggle, children }: { id: string; title: string; isOpen: boolean; toggle: () => void; children: React.ReactNode }) {
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

function formatTimeValue(value: string, allowRange = false) {
  const digits = value.replace(/\D/g, '').slice(0, allowRange ? 8 : 4);
  if (!allowRange) {
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  if (digits.length <= 4) {
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  const first = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  const remaining = digits.slice(4, 8);
  if (remaining.length <= 2) return `${first}-${remaining}`;
  return `${first}-${remaining.slice(0, 2)}:${remaining.slice(2, 4)}`;
}

function TimeInput({ value, onChange, placeholder, allowRange = false }: { value: string; onChange: (v: string) => void; placeholder?: string; allowRange?: boolean }) {
  return (
    <Input
      value={value}
      onChange={e => onChange(formatTimeValue(e.target.value, allowRange))}
      placeholder={placeholder || 'HH:MM'}
      inputMode="numeric"
      maxLength={allowRange ? 11 : 5}
    />
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
  const isCustom = value === '__outro__' || (value !== '' && !setores.some(setor => setor.nome === value));

  return (
    <td className="px-3 py-2 border border-border">
      <select
        value={isCustom ? '__outro' : value}
        onChange={e => onChange(e.target.value === '__outro' ? '__outro__' : e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        <option value="">Selecione...</option>
        {setores.map(setor => <option key={setor.id} value={setor.nome}>{setor.nome}</option>)}
        <option value="__outro">Outro</option>
      </select>
      {isCustom && (
        <Input className="mt-1" value={value === '__outro__' ? '' : value} placeholder="Digite o setor..." onChange={e => onChange(e.target.value)} />
      )}
    </td>
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
  columns: string[]; rows: T[]; renderRow: (row: T, index: number) => React.ReactNode; onAdd: () => void; onRemove: (index: number) => void;
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
