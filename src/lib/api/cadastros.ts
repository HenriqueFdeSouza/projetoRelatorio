import { supabase } from '@/lib/supabase'
import {
  Colaborador,
  SupervisorCastelo,
  Fornecedor,
  Gestor,
  Plantonista,
  TipoEntrega,
  Setor,
} from '@/lib/types'

// =========================
// FUNÇÕES
// =========================
export async function getFuncoes() {
  const { data, error } = await supabase
    .from('funcoes_seguranca')
    .select('*')
    .order('nome')

  if (error) throw error
  return data || []
}

export async function addFuncao(nome: string) {
  const { error } = await supabase
    .from('funcoes_seguranca')
    .insert([{ nome }])

  if (error) throw error
}

export async function deleteFuncao(id: string) {
  const { error } = await supabase
    .from('funcoes_seguranca')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// COLABORADORES
// =========================
export async function getColaboradores(): Promise<Colaborador[]> {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as Colaborador[]
}

export async function addColaborador(nome: string, horario: string) {
  const { error } = await supabase
    .from('colaboradores')
    .insert([{ nome, horario, funcao: '', setor: '' }])

  if (error) throw error
}

export async function deleteColaborador(id: string) {
  const { error } = await supabase
    .from('colaboradores')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// SUPERVISORES CASTELO
// =========================
export async function getSupervisoresCastelo(): Promise<SupervisorCastelo[]> {
  const { data, error } = await supabase
    .from('supervisores_castelo')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as SupervisorCastelo[]
}

export async function addSupervisorCastelo(nome: string, funcao: string) {
  const { error } = await supabase
    .from('supervisores_castelo')
    .insert([{ nome, funcao }])

  if (error) throw error
}

export async function deleteSupervisorCastelo(id: string) {
  const { error } = await supabase
    .from('supervisores_castelo')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// EMPRESAS / FORNECEDORES
// =========================
export async function getFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('empresas_fornecedores')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as Fornecedor[]
}

export async function addFornecedor(nome: string) {
  const { error } = await supabase
    .from('empresas_fornecedores')
    .insert([{ nome, setor: '' }])

  if (error) throw error
}

export async function deleteFornecedor(id: string) {
  const { error } = await supabase
    .from('empresas_fornecedores')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// GESTORES / LÍDERES
// =========================
export async function getGestores(): Promise<Gestor[]> {
  const { data, error } = await supabase
    .from('gestores_lideres')
    .select('id, nome, setor_cargo')
    .order('nome')

  if (error) throw error

  return (data || []).map((item: { id: string; nome: string; setor_cargo: string | null }) => ({
    id: item.id,
    nome: item.nome,
    setorCargo: item.setor_cargo || '',
  }))
}

export async function addGestor(nome: string, setorCargo: string) {
  const { error } = await supabase
    .from('gestores_lideres')
    .insert([{ nome, setor_cargo: setorCargo }])

  if (error) throw error
}

export async function deleteGestor(id: string) {
  const { error } = await supabase
    .from('gestores_lideres')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// PLANTONISTAS
// =========================
export async function getPlantonistas(): Promise<Plantonista[]> {
  const { data, error } = await supabase
    .from('plantonistas')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as Plantonista[]
}

export async function addPlantonista(nome: string, cargo: string) {
  const { error } = await supabase
    .from('plantonistas')
    .insert([{ nome, cargo }])

  if (error) throw error
}

export async function deletePlantonista(id: string) {
  const { error } = await supabase
    .from('plantonistas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// TIPOS DE ENTREGA
// =========================
export async function getTiposEntrega(): Promise<TipoEntrega[]> {
  const { data, error } = await supabase
    .from('tipos_entrega')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as TipoEntrega[]
}

export async function addTipoEntrega(nome: string) {
  const { error } = await supabase
    .from('tipos_entrega')
    .insert([{ nome }])

  if (error) throw error
}

export async function deleteTipoEntrega(id: string) {
  const { error } = await supabase
    .from('tipos_entrega')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// PRESTADORES DE SERVIÇO
// =========================
export async function getPrestadores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('prestadores_servico')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as Fornecedor[]
}

export async function addPrestador(nome: string) {
  const { error } = await supabase
    .from('prestadores_servico')
    .insert([{ nome, setor: '' }])

  if (error) throw error
}

export async function deletePrestador(id: string) {
  const { error } = await supabase
    .from('prestadores_servico')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =========================
// SETORES
// =========================
export async function getSetores(): Promise<Setor[]> {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data || []) as Setor[]
}

export async function addSetor(nome: string) {
  const { error } = await supabase
    .from('setores')
    .insert([{ nome }])

  if (error) throw error
}

export async function deleteSetor(id: string) {
  const { error } = await supabase
    .from('setores')
    .delete()
    .eq('id', id)

  if (error) throw error
}
