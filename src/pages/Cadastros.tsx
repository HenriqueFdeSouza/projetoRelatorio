import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { storage, genId } from '@/lib/storage';
import { FuncaoSeguranca, Colaborador, SupervisorCastelo, Fornecedor, Gestor, Plantonista, TipoEntrega, Setor } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

export default function Cadastros() {
  return (
    <div className="fade-in">
      <div className="page-header rounded-lg mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm opacity-80 mt-1">Gerencie a base de dados do sistema</p>
      </div>

      <Tabs defaultValue="funcoes" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-muted/50 p-1">
          <TabsTrigger value="funcoes" className="text-xs">Funções</TabsTrigger>
          <TabsTrigger value="colaboradores" className="text-xs">Colaboradores</TabsTrigger>
          <TabsTrigger value="supervisores" className="text-xs">Supervisores CB</TabsTrigger>
          <TabsTrigger value="empresas" className="text-xs">Empresas</TabsTrigger>
          <TabsTrigger value="gestores" className="text-xs">Gestores</TabsTrigger>
          <TabsTrigger value="plantonistas" className="text-xs">Plantonistas</TabsTrigger>
          <TabsTrigger value="tipos_entrega" className="text-xs">Tipos Entrega</TabsTrigger>
          <TabsTrigger value="prestadores" className="text-xs">Prestadores</TabsTrigger>
          <TabsTrigger value="setores" className="text-xs">Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="funcoes"><FuncoesTab /></TabsContent>
        <TabsContent value="colaboradores"><ColaboradoresTab /></TabsContent>
        <TabsContent value="supervisores"><SupervisoresTab /></TabsContent>
        <TabsContent value="empresas"><EmpresasTab /></TabsContent>
        <TabsContent value="gestores"><GestoresTab /></TabsContent>
        <TabsContent value="plantonistas"><PlantonistasTab /></TabsContent>
        <TabsContent value="tipos_entrega"><TiposEntregaTab /></TabsContent>
        <TabsContent value="prestadores"><PrestadoresTab /></TabsContent>
        <TabsContent value="setores"><SetoresTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── ABA 1: Funções de Segurança ───
function FuncoesTab() {
  const [items, setItems] = useState<FuncaoSeguranca[]>(storage.getFuncoes());
  const [newName, setNewName] = useState('');
  useEffect(() => { storage.setFuncoes(items); }, [items]);

  const add = () => {
    if (!newName.trim()) return;
    setItems([...items, { id: genId(), nome: newName.trim() }]);
    setNewName('');
  };

  return (
    <CrudCard
      title="Funções de Segurança"
      description="Funções que aparecem na seção 1.1 (Efetivo de Segurança)"
      addDialog={
        <AddDialog title="Adicionar Função" onAdd={add}>
          <Input placeholder="Nome da função" value={newName} onChange={e => setNewName(e.target.value)} />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome da Função</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={2} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 2: Colaboradores ───
function ColaboradoresTab() {
  const [items, setItems] = useState<Colaborador[]>(storage.getColaboradores());
  const [nome, setNome] = useState('');
  const [horario, setHorario] = useState('');
  useEffect(() => { storage.setColaboradores(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), funcao: '', horario: horario.trim(), setor: '' }]);
    setNome(''); setHorario('');
  };

  return (
    <CrudCard
      title="Colaboradores"
      description="Nomes disponíveis no campo Nome da seção 1.1"
      addDialog={
        <AddDialog title="Adicionar Colaborador" onAdd={add}>
          <Input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="Horário padrão (ex: 07:00-19:00)" value={horario} onChange={e => setHorario(e.target.value)} className="mt-2" />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome</th><th>Horário Padrão</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={3} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-3 py-2 border border-border">{item.horario || '-'}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 3: Supervisores Castelo Borges ───
function SupervisoresTab() {
  const [items, setItems] = useState<SupervisorCastelo[]>(storage.getSupervisoresCastelo());
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  useEffect(() => { storage.setSupervisoresCastelo(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), funcao: funcao.trim() }]);
    setNome(''); setFuncao('');
  };

  return (
    <CrudCard
      title="Supervisores Castelo Borges"
      description="Nomes disponíveis na seção 1.2 (Visita Castelo Borges)"
      addDialog={
        <AddDialog title="Adicionar Supervisor" onAdd={add}>
          <Input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="Função (ex: Supervisor)" value={funcao} onChange={e => setFuncao(e.target.value)} className="mt-2" />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome</th><th>Função</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={3} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-3 py-2 border border-border">{item.funcao || '-'}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 4: Empresas / Fornecedores ───
function EmpresasTab() {
  const [items, setItems] = useState<Fornecedor[]>(storage.getFornecedores());
  const [nome, setNome] = useState('');
  useEffect(() => { storage.setFornecedores(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), setor: '' }]);
    setNome('');
  };

  return (
    <CrudCard
      title="Empresas / Fornecedores"
      description="Empresas disponíveis nas seções 1.10 (GEC) e 1.18 (Entregas)"
      addDialog={
        <AddDialog title="Adicionar Empresa" onAdd={add}>
          <Input placeholder="Nome da Empresa" value={nome} onChange={e => setNome(e.target.value)} />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Empresa</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={2} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 5: Gestores / Líderes ───
function GestoresTab() {
  const [items, setItems] = useState<Gestor[]>(storage.getGestores());
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  useEffect(() => { storage.setGestores(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), setorCargo: setor.trim() }]);
    setNome(''); setSetor('');
  };

  return (
    <CrudCard
      title="Gestores / Líderes"
      description="Nomes disponíveis na seção 1.16 (Entradas de Gestores)"
      addDialog={
        <AddDialog title="Adicionar Gestor" onAdd={add}>
          <Input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="Setor / Cargo" value={setor} onChange={e => setSetor(e.target.value)} className="mt-2" />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome</th><th>Setor / Cargo</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={3} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-3 py-2 border border-border">{item.setorCargo || '-'}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 6: Plantonistas ───
function PlantonistasTab() {
  const [items, setItems] = useState<Plantonista[]>(storage.getPlantonistas());
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  useEffect(() => { storage.setPlantonistas(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), cargo: cargo.trim() }]);
    setNome(''); setCargo('');
  };

  return (
    <CrudCard
      title="Plantonistas"
      description="Nomes disponíveis no campo Plantonista do cabeçalho"
      addDialog={
        <AddDialog title="Adicionar Plantonista" onAdd={add}>
          <Input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
          <Input placeholder="Cargo / Setor" value={cargo} onChange={e => setCargo(e.target.value)} className="mt-2" />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome</th><th>Cargo</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={3} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-3 py-2 border border-border">{item.cargo || '-'}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 7: Tipos de Entrega ───
function TiposEntregaTab() {
  const [items, setItems] = useState<TipoEntrega[]>(storage.getTiposEntrega());
  const [nome, setNome] = useState('');
  useEffect(() => { storage.setTiposEntrega(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim() }]);
    setNome('');
  };

  return (
    <CrudCard
      title="Tipos de Entrega"
      description="Tipos disponíveis na seção 1.17 (Entregas a Hóspedes)"
      addDialog={
        <AddDialog title="Adicionar Tipo de Entrega" onAdd={add}>
          <Input placeholder="Nome do tipo" value={nome} onChange={e => setNome(e.target.value)} />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Tipo</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={2} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── ABA 8: Prestadores de Serviço ───
function PrestadoresTab() {
  const [items, setItems] = useState<Fornecedor[]>(storage.getPrestadores());
  const [nome, setNome] = useState('');
  useEffect(() => { storage.setPrestadores(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim(), setor: '' }]);
    setNome('');
  };

  return (
    <CrudCard
      title="Prestadores de Serviço"
      description="Prestadores disponíveis na seção 1.18 (Entregas Fornecedores)"
      addDialog={
        <AddDialog title="Adicionar Prestador" onAdd={add}>
          <Input placeholder="Nome da Empresa" value={nome} onChange={e => setNome(e.target.value)} />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Empresa</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={2} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}



// ─── ABA 9: Setores ───
function SetoresTab() {
  const [items, setItems] = useState<Setor[]>(storage.getSetores());
  const [nome, setNome] = useState('');
  useEffect(() => { storage.setSetores(items); }, [items]);

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: genId(), nome: nome.trim() }]);
    setNome('');
  };

  return (
    <CrudCard
      title="Setores"
      description="Setores disponíveis nos campos Setor do formulário principal"
      addDialog={
        <AddDialog title="Adicionar Setor" onAdd={add} triggerLabel="Adicionar Setor">
          <Input placeholder="Nome do setor" value={nome} onChange={e => setNome(e.target.value)} />
        </AddDialog>
      }
    >
      <table className="report-table">
        <thead><tr><th>Nome do Setor</th><th className="w-12">Ação</th></tr></thead>
        <tbody>
          {items.length === 0 && <EmptyRow cols={2} />}
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="px-3 py-2 border border-border">{item.nome}</td>
              <td className="px-2 py-2 border border-border">
                <DeleteBtn onClick={() => setItems(items.filter((_, idx) => idx !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CrudCard>
  );
}

// ─── Shared UI Components ───

function CrudCard({ title, description, addDialog, children }: {
  title: string; description: string; addDialog: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="section-header rounded-none">
        <div>
          <span className="font-semibold">{title}</span>
          <p className="text-xs opacity-70 font-normal mt-0.5">{description}</p>
        </div>
        {addDialog}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function AddDialog({ title, onAdd, children, triggerLabel = 'Adicionar' }: { title: string; onAdd: () => void; children: React.ReactNode; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const handleAdd = () => { onAdd(); setOpen(false); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1 h-7 text-xs">
          <Plus className="w-3 h-3" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">{children}</div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline" size="sm">Cancelar</Button></DialogClose>
          <Button size="sm" onClick={handleAdd}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="py-6 text-muted-foreground text-center border border-border">Nenhum item cadastrado.</td></tr>;
}
