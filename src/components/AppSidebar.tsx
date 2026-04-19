import { NavLink as RouterNavLink } from 'react-router-dom';
import { BarChart3, FileSearch, FileText, Settings, Shield } from 'lucide-react';
import { Info } from "lucide-react"

export default function AppSidebar() {
  const links = [
    { to: '/', label: 'Relatório', icon: FileText },
    { to: '/cadastros', label: 'Configurações', icon: Settings },
    { to: '/admin', label: 'Consulta de relatórios', icon: FileSearch },
    { to: '/estatisticas', label: 'Estatísticas', icon: BarChart3 },
    { to: '/updates', label: 'Atualizações', icon: Info },
  ];

  return (
    <aside className="w-56 min-h-screen bg-primary text-primary-foreground flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <div>
            <div className="font-bold text-sm leading-tight">Wellness</div>
            <div className="text-[10px] opacity-80">Segurança Patrimonial</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(link => (
          <RouterNavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent font-semibold'
                  : 'hover:bg-sidebar-accent/50 opacity-80 hover:opacity-100'
              }`
            }
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </RouterNavLink>
        ))}
      </nav>
      <div className="p-3 text-[10px] opacity-50 text-center border-t border-sidebar-border">
        Relatório Diurno v1.0
      </div>
    </aside>
  );
}
