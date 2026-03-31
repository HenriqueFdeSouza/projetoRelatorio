-- =========================================================
-- PROJETO RELATORIO - ESTRUTURA INICIAL SUPABASE
-- Arquivo: /database/01_init_supabase.sql
-- =========================================================

-- Extensão para gerar UUID
create extension if not exists pgcrypto;

-- =========================================================
-- TABELAS DE CONFIGURAÇÃO
-- =========================================================

create table if not exists funcoes_seguranca (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists colaboradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text not null default '',
  horario text not null default '',
  setor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists supervisores_castelo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists empresas_fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  setor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists gestores_lideres (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  setor_cargo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists plantonistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists tipos_entrega (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists prestadores_servico (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  setor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists blocos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  capacidade integer not null,
  created_at timestamptz not null default now()
);

create table if not exists elevadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

create index if not exists idx_colaboradores_nome on colaboradores (nome);
create index if not exists idx_supervisores_castelo_nome on supervisores_castelo (nome);
create index if not exists idx_empresas_fornecedores_nome on empresas_fornecedores (nome);
create index if not exists idx_gestores_lideres_nome on gestores_lideres (nome);
create index if not exists idx_plantonistas_nome on plantonistas (nome);
create index if not exists idx_prestadores_servico_nome on prestadores_servico (nome);
create index if not exists idx_setores_nome on setores (nome);
create index if not exists idx_blocos_nome on blocos (nome);
create index if not exists idx_elevadores_nome on elevadores (nome);

-- =========================================================
-- DADOS INICIAIS (baseado no storage.ts do projeto)
-- =========================================================

insert into funcoes_seguranca (nome)
values
  ('Supervisor'),
  ('Portaria Social'),
  ('Portaria Praia'),
  ('Rondante'),
  ('Bombeiro'),
  ('Apoio')
on conflict (nome) do nothing;

insert into supervisores_castelo (nome, funcao)
values
  ('Felipe', 'Supervisor'),
  ('Marcos', 'Supervisor')
on conflict do nothing;

insert into empresas_fornecedores (nome, setor)
values
  ('BST', ''),
  ('IBRAVA', ''),
  ('ALIMEMPRO', ''),
  ('RMC', ''),
  ('LLPRODUTOS', ''),
  ('GRUPO IMAGEM', ''),
  ('BRASIL SOLDAS', ''),
  ('VERDE AGRÍCOLA', ''),
  ('SAMPAS', ''),
  ('FLORA TROPICAL', ''),
  ('MÁXIMA DEDETIZAÇÃO', ''),
  ('RC FRIO', ''),
  ('VULP', ''),
  ('NOSSO CLIMA', ''),
  ('GI-CAMAREIRAS', ''),
  ('BST CLIMATIZAÇÃO', '')
on conflict (nome) do nothing;

insert into gestores_lideres (nome, setor_cargo)
values
  ('Wagner Costa', 'Supervisor Segurança'),
  ('Lucas Aragão', 'Gerente'),
  ('Marina Lemenhe', 'Governanta'),
  ('Alisson Emanuel', 'Líder E&L'),
  ('Lucas Lourenço', 'Líder Piscina'),
  ('Alan Jared', 'Desenvolvimento'),
  ('Kelma Maia', 'Vacation'),
  ('Erasmo Carlos', 'Supervisor Hotelaria'),
  ('Nilton Martins', 'Coordenador A&B'),
  ('Danieli Castro', 'Engenheira'),
  ('Ana Laura', 'SPA'),
  ('Rafael Aragão', 'Manutenção')
on conflict do nothing;

insert into plantonistas (nome, cargo)
values
  ('Maria Noélia', 'Coordenadora E&L'),
  ('Henrique', 'Administrador do Sistema')
on conflict do nothing;

insert into tipos_entrega (nome)
values
  ('IFOOD'),
  ('Água'),
  ('Correios'),
  ('Mercado'),
  ('Encomenda'),
  ('Outro')
on conflict (nome) do nothing;

insert into prestadores_servico (nome, setor)
values
  ('BST', ''),
  ('IBRAVA', ''),
  ('ALIMEMPRO', ''),
  ('RMC', ''),
  ('LLPRODUTOS', ''),
  ('GRUPO IMAGEM', ''),
  ('BRASIL SOLDAS', ''),
  ('VERDE AGRÍCOLA', ''),
  ('SAMPAS', ''),
  ('FLORA TROPICAL', ''),
  ('MÁXIMA DEDETIZAÇÃO', ''),
  ('RC FRIO', ''),
  ('VULP', ''),
  ('NOSSO CLIMA', ''),
  ('GI-CAMAREIRAS', ''),
  ('BST CLIMATIZAÇÃO', '')
on conflict (nome) do nothing;

insert into setores (nome)
values
  ('Manutenção'),
  ('Cozinha'),
  ('Governança'),
  ('Segurança'),
  ('Piscina'),
  ('SPA'),
  ('E&L'),
  ('Desenvolvimento'),
  ('A&B'),
  ('Hotelaria'),
  ('Recepção')
on conflict (nome) do nothing;

insert into blocos (nome, capacidade)
values
  ('SUB. BLOCO 1', 60),
  ('BLOCO 1-2', 90),
  ('BLOCO 3', 90),
  ('BLOCO 6-7', 60),
  ('SUB. BLOCO 7', 65)
on conflict (nome) do nothing;

insert into elevadores (nome)
values
  ('BLOCO 01'),
  ('BLOCO 02'),
  ('BLOCO 03 PAR'),
  ('BLOCO 03 ÍMPAR'),
  ('BLOCO 04'),
  ('BLOCO 05'),
  ('BLOCO 06'),
  ('BLOCO 07')
on conflict (nome) do nothing;

-- =========================================================
-- RLS
-- =========================================================
-- Como você vai acessar pelo frontend com a chave pública (anon),
-- o Supabase recomenda usar RLS nas tabelas expostas ao navegador.
-- Aqui estou liberando acesso total por enquanto, para facilitar
-- sua primeira integração. Depois a gente endurece isso.
-- =========================================================

alter table funcoes_seguranca enable row level security;
alter table colaboradores enable row level security;
alter table supervisores_castelo enable row level security;
alter table empresas_fornecedores enable row level security;
alter table gestores_lideres enable row level security;
alter table plantonistas enable row level security;
alter table tipos_entrega enable row level security;
alter table prestadores_servico enable row level security;
alter table setores enable row level security;
alter table blocos enable row level security;
alter table elevadores enable row level security;

create policy "funcoes_seguranca_select" on funcoes_seguranca
for select using (true);
create policy "funcoes_seguranca_insert" on funcoes_seguranca
for insert with check (true);
create policy "funcoes_seguranca_update" on funcoes_seguranca
for update using (true);
create policy "funcoes_seguranca_delete" on funcoes_seguranca
for delete using (true);

create policy "colaboradores_select" on colaboradores
for select using (true);
create policy "colaboradores_insert" on colaboradores
for insert with check (true);
create policy "colaboradores_update" on colaboradores
for update using (true);
create policy "colaboradores_delete" on colaboradores
for delete using (true);

create policy "supervisores_castelo_select" on supervisores_castelo
for select using (true);
create policy "supervisores_castelo_insert" on supervisores_castelo
for insert with check (true);
create policy "supervisores_castelo_update" on supervisores_castelo
for update using (true);
create policy "supervisores_castelo_delete" on supervisores_castelo
for delete using (true);

create policy "empresas_fornecedores_select" on empresas_fornecedores
for select using (true);
create policy "empresas_fornecedores_insert" on empresas_fornecedores
for insert with check (true);
create policy "empresas_fornecedores_update" on empresas_fornecedores
for update using (true);
create policy "empresas_fornecedores_delete" on empresas_fornecedores
for delete using (true);

create policy "gestores_lideres_select" on gestores_lideres
for select using (true);
create policy "gestores_lideres_insert" on gestores_lideres
for insert with check (true);
create policy "gestores_lideres_update" on gestores_lideres
for update using (true);
create policy "gestores_lideres_delete" on gestores_lideres
for delete using (true);

create policy "plantonistas_select" on plantonistas
for select using (true);
create policy "plantonistas_insert" on plantonistas
for insert with check (true);
create policy "plantonistas_update" on plantonistas
for update using (true);
create policy "plantonistas_delete" on plantonistas
for delete using (true);

create policy "tipos_entrega_select" on tipos_entrega
for select using (true);
create policy "tipos_entrega_insert" on tipos_entrega
for insert with check (true);
create policy "tipos_entrega_update" on tipos_entrega
for update using (true);
create policy "tipos_entrega_delete" on tipos_entrega
for delete using (true);

create policy "prestadores_servico_select" on prestadores_servico
for select using (true);
create policy "prestadores_servico_insert" on prestadores_servico
for insert with check (true);
create policy "prestadores_servico_update" on prestadores_servico
for update using (true);
create policy "prestadores_servico_delete" on prestadores_servico
for delete using (true);

create policy "setores_select" on setores
for select using (true);
create policy "setores_insert" on setores
for insert with check (true);
create policy "setores_update" on setores
for update using (true);
create policy "setores_delete" on setores
for delete using (true);

create policy "blocos_select" on blocos
for select using (true);
create policy "blocos_insert" on blocos
for insert with check (true);
create policy "blocos_update" on blocos
for update using (true);
create policy "blocos_delete" on blocos
for delete using (true);

create policy "elevadores_select" on elevadores
for select using (true);
create policy "elevadores_insert" on elevadores
for insert with check (true);
create policy "elevadores_update" on elevadores
for update using (true);
create policy "elevadores_delete" on elevadores
for delete using (true);