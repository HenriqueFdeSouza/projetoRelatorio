import {
  Colaborador, Fornecedor, Gestor, Bloco, Elevador, ReportData,
  FuncaoSeguranca, SupervisorCastelo, Plantonista, TipoEntrega, Setor,
  VIATURAS_FIXAS,
} from './types';

const KEYS = {
  funcoes: 'funcoes_seguranca',
  colaboradores: 'colaboradores',
  supervisoresCastelo: 'supervisores_castelo',
  fornecedores: 'empresas_fornecedores',
  gestores: 'gestores_lideres',
  plantonistas: 'plantonistas',
  tiposEntrega: 'tipos_entrega',
  prestadores: 'prestadores_servico',
  setores: 'setores',
  blocos: 'wbp_blocos',
  elevadores: 'wbp_elevadores',
  report: 'wbp_report_current',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Default data
function defaultFuncoes(): FuncaoSeguranca[] {
  return ['Supervisor', 'Portaria Social', 'Portaria Praia', 'Rondante', 'Bombeiro', 'Apoio']
    .map((n, i) => ({ id: String(i + 1), nome: n }));
}

function defaultSupervisoresCastelo(): SupervisorCastelo[] {
  return [
    { id: '1', nome: 'Felipe', funcao: 'Supervisor' },
    { id: '2', nome: 'Marcos', funcao: 'Supervisor' },
  ];
}

function defaultFornecedores(): Fornecedor[] {
  const nomes = ['BST', 'IBRAVA', 'ALIMEMPRO', 'RMC', 'LLPRODUTOS', 'GRUPO IMAGEM', 'BRASIL SOLDAS', 'VERDE AGRÍCOLA', 'SAMPAS', 'FLORA TROPICAL', 'MÁXIMA DEDETIZAÇÃO', 'RC FRIO', 'VULP', 'NOSSO CLIMA', 'GI-CAMAREIRAS', 'BST CLIMATIZAÇÃO'];
  return nomes.map((n, i) => ({ id: String(i + 1), nome: n, setor: '' }));
}

function defaultGestores(): Gestor[] {
  const data = [
    ['Wagner Costa', 'Supervisor Segurança'], ['Lucas Aragão', 'Gerente'], ['Marina Lemenhe', 'Governanta'],
    ['Alisson Emanuel', 'Líder E&L'], ['Lucas Lourenço', 'Líder Piscina'], ['Alan Jared', 'Desenvolvimento'],
    ['Kelma Maia', 'Vacation'], ['Erasmo Carlos', 'Supervisor Hotelaria'], ['Nilton Martins', 'Coordenador A&B'],
    ['Danieli Castro', 'Engenheira'], ['Ana Laura', 'SPA'], ['Rafael Aragão', 'Manutenção'],
  ];
  return data.map(([nome, setorCargo], i) => ({ id: String(i + 1), nome, setorCargo }));
}

function defaultPlantonistas(): Plantonista[] {
  return [{ id: '1', nome: 'Maria Noélia', cargo: 'Coordenadora E&L' }];
}

function defaultTiposEntrega(): TipoEntrega[] {
  return ['IFOOD', 'Água', 'Correios', 'Mercado', 'Encomenda', 'Outro']
    .map((n, i) => ({ id: String(i + 1), nome: n }));
}

function defaultSetores(): Setor[] {
  return ['Manutenção', 'Cozinha', 'Governança', 'Segurança', 'Piscina', 'SPA', 'E&L', 'Desenvolvimento', 'A&B', 'Hotelaria', 'Recepção']
    .map((n, i) => ({ id: String(i + 1), nome: n }));
}

function defaultBlocos(): Bloco[] {
  return [
    { id: '1', nome: 'SUB. BLOCO 1', capacidade: 60 },
    { id: '2', nome: 'BLOCO 1-2', capacidade: 90 },
    { id: '3', nome: 'BLOCO 3', capacidade: 90 },
    { id: '4', nome: 'BLOCO 6-7', capacidade: 60 },
    { id: '5', nome: 'SUB. BLOCO 7', capacidade: 65 },
  ];
}

function defaultElevadores(): Elevador[] {
  return [
    { id: '1', nome: 'BLOCO 01' }, { id: '2', nome: 'BLOCO 02' },
    { id: '3', nome: 'BLOCO 03 PAR' }, { id: '4', nome: 'BLOCO 03 ÍMPAR' },
    { id: '5', nome: 'BLOCO 04' }, { id: '6', nome: 'BLOCO 05' },
    { id: '7', nome: 'BLOCO 06' }, { id: '8', nome: 'BLOCO 07' },
  ];
}

export const storage = {
  getFuncoes: () => get<FuncaoSeguranca[]>(KEYS.funcoes, defaultFuncoes()),
  setFuncoes: (v: FuncaoSeguranca[]) => set(KEYS.funcoes, v),

  getColaboradores: () => get<Colaborador[]>(KEYS.colaboradores, []),
  setColaboradores: (v: Colaborador[]) => set(KEYS.colaboradores, v),

  getSupervisoresCastelo: () => get<SupervisorCastelo[]>(KEYS.supervisoresCastelo, defaultSupervisoresCastelo()),
  setSupervisoresCastelo: (v: SupervisorCastelo[]) => set(KEYS.supervisoresCastelo, v),

  getFornecedores: () => get<Fornecedor[]>(KEYS.fornecedores, defaultFornecedores()),
  setFornecedores: (v: Fornecedor[]) => set(KEYS.fornecedores, v),

  getGestores: () => get<Gestor[]>(KEYS.gestores, defaultGestores()),
  setGestores: (v: Gestor[]) => set(KEYS.gestores, v),

  getPlantonistas: () => get<Plantonista[]>(KEYS.plantonistas, defaultPlantonistas()),
  setPlantonistas: (v: Plantonista[]) => set(KEYS.plantonistas, v),

  getTiposEntrega: () => get<TipoEntrega[]>(KEYS.tiposEntrega, defaultTiposEntrega()),
  setTiposEntrega: (v: TipoEntrega[]) => set(KEYS.tiposEntrega, v),

  getPrestadores: () => get<Fornecedor[]>(KEYS.prestadores, defaultFornecedores()),
  setPrestadores: (v: Fornecedor[]) => set(KEYS.prestadores, v),

  getSetores: () => get<Setor[]>(KEYS.setores, defaultSetores()),
  setSetores: (v: Setor[]) => set(KEYS.setores, v),

  getBlocos: () => get<Bloco[]>(KEYS.blocos, defaultBlocos()),
  setBlocos: (v: Bloco[]) => set(KEYS.blocos, v),

  getElevadores: () => get<Elevador[]>(KEYS.elevadores, defaultElevadores()),
  setElevadores: (v: Elevador[]) => set(KEYS.elevadores, v),

  getReport: (): ReportData => get<ReportData>(KEYS.report, createEmptyReport()),
  setReport: (v: ReportData) => set(KEYS.report, v),
  clearReport: () => set(KEYS.report, createEmptyReport()),
};

export function createEmptyReport(): ReportData {
  const blocos = get<Bloco[]>(KEYS.blocos, defaultBlocos());
  const elevadores = get<Elevador[]>(KEYS.elevadores, defaultElevadores());
  const funcoes = get<FuncaoSeguranca[]>(KEYS.funcoes, defaultFuncoes());

  return {
    data: new Date().toISOString().split('T')[0],
    diaSemana: getDiaSemana(new Date()),
    plantonista: '',
    efetivo: funcoes.map(f => ({ funcao: f.nome, nome: '', horario: '', radio: '-' })),
    visitas: [],
    ocupacao: { atual: '', prevista: '', checkin: '', checkout: '' },
    estacionamento: blocos.map(b => ({ local: b.nome, capacidade: b.capacidade, quantidade: '', agente: '' })),
    viaturas: VIATURAS_FIXAS.map(n => ({ nome: n, horario1: '', horario2: '', horario3: '' })),
    elevadorTeste: elevadores.map(e => ({ elevador: e.nome, horario: '', interfone: '', alarme: '', agente: '' })),
    radiosRecebimento: '',
    radiosPassagem: '',
    crachas: [
      { descricao: 'VISITANTES', quantidade: '', cor: '' },
      { descricao: 'PROVISÓRIOS', quantidade: '', cor: '' },
    ],
    mesCrachas: '',
    gec: [],
    achados: [],
    autorizacaoMenor: [],
    tentativaMenor: [],
    saidaMaterial: [],
    tesouraria: [],
    entradaGestores: [],
    entregaHospedes: [],
    entregaFornecedores: [],
    faltaEnergia: { protocolo: '', horarioFalta: '', horarioRetorno: '' },
    helpdesk: [],
    encomendas: [],
    ocorrencias: [],
  };
}

export function getDiaSemana(date: Date): string {
  const dias = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
  return dias[date.getDay()];
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
