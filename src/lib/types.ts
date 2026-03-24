// Config data types
export interface FuncaoSeguranca {
  id: string;
  nome: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  horario: string;
  setor: string;
}

export interface SupervisorCastelo {
  id: string;
  nome: string;
  funcao: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  setor: string;
}

export interface Gestor {
  id: string;
  nome: string;
  setorCargo: string;
}

export interface Plantonista {
  id: string;
  nome: string;
  cargo: string;
}

export interface TipoEntrega {
  id: string;
  nome: string;
}

export interface Setor {
  id: string;
  nome: string;
}

export interface Bloco {
  id: string;
  nome: string;
  capacidade: number;
}

export interface Elevador {
  id: string;
  nome: string;
}

// Report data types
export interface EfetivoRow {
  funcao: string;
  nome: string;
  horario: string;
  radio: string;
}

export interface VisitaRow {
  nome: string;
  funcao: string;
  entrada: string;
  saida: string;
}

export interface OcupacaoData {
  atual: string;
  prevista: string;
  checkin: string;
  checkout: string;
}

export interface EstacionamentoRow {
  local: string;
  capacidade: number;
  quantidade: string;
  agente: string;
}

export interface ViaturaRow {
  nome: string;
  horario1: string;
  horario2: string;
  horario3: string;
}

export interface ElevadorTesteRow {
  elevador: string;
  horario: string;
  interfone: string;
  alarme: string;
  agente: string;
}

export interface CrachaRow {
  descricao: string;
  quantidade: string;
  cor: string;
}

export interface GecRow {
  empresa: string;
  quantidade: string;
  setor: string;
  status: string;
  atividade: string;
}

export interface AchadoRow {
  local: string;
  seguranca: string;
  objeto: string;
  entregue: string;
}

export interface AutorizacaoMenorRow {
  nomeCrianca: string;
  autorizador: string;
  uh: string;
  validade: string;
  status: string;
}

export interface TentativaMenorRow {
  nomeCrianca: string;
  uh: string;
  portaria: string;
  possuiAutorizacao: string;
}

export interface SaidaMaterialRow {
  responsavel: string;
  setor: string;
  autorizador: string;
  descricao: string;
  retorno: string;
}

export interface TesourariaRow {
  nome: string;
  entrada: string;
  saida: string;
  nivel: string;
  senha: string;
  destino: string;
}

export interface EntradaGestorRow {
  entrada: string;
  nome: string;
  setorCargo: string;
  saida: string;
}

export interface EntregaHospedeRow {
  numero: string;
  tipo: string;
  uh: string;
}

export interface EntregaFornecedorRow {
  numero: string;
  empresa: string;
  setor: string;
}

export interface HelpdeskRow {
  nome: string;
  descricao: string;
  chamado: string;
  setor: string;
}

export interface EncomendaRow {
  numero: string;
  uh: string;
  quantidade: string;
  proprietario: string;
}

export interface OcorrenciaItem {
  titulo: string;
  descricao: string;
}

export interface ReportData {
  data: string;
  diaSemana: string;
  plantonista: string;
  efetivo: EfetivoRow[];
  visitas: VisitaRow[];
  ocupacao: OcupacaoData;
  estacionamento: EstacionamentoRow[];
  viaturas: ViaturaRow[];
  elevadorTeste: ElevadorTesteRow[];
  radiosRecebimento: string;
  radiosPassagem: string;
  crachas: CrachaRow[];
  mesCrachas: string;
  gec: GecRow[];
  achados: AchadoRow[];
  autorizacaoMenor: AutorizacaoMenorRow[];
  tentativaMenor: TentativaMenorRow[];
  saidaMaterial: SaidaMaterialRow[];
  tesouraria: TesourariaRow[];
  entradaGestores: EntradaGestorRow[];
  entregaHospedes: EntregaHospedeRow[];
  entregaFornecedores: EntregaFornecedorRow[];
  faltaEnergia: { protocolo: string; horarioFalta: string; horarioRetorno: string };
  helpdesk: HelpdeskRow[];
  encomendas: EncomendaRow[];
  ocorrencias: OcorrenciaItem[];
}

export const VIATURAS_FIXAS = ['DEMUTRAN', 'BPTUR', 'GCM', 'CIVIL'];
export const INTERFONE_OPTIONS = ['ON/ON', 'OFF/ON', 'ON/OFF', 'OFF/OFF'];
