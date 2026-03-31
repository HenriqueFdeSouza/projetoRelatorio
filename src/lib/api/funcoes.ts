import { supabase } from '@/lib/supabase'

export async function getFuncoes() {
  const { data, error } = await supabase
    .from('funcoes_seguranca')
    .select('*')
    .order('nome')

  if (error) throw error
  return data
}