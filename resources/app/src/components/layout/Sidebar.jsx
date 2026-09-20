/**
 * Sidebar - Navegação principal com Design System
 */

import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  FileText,
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      Icon: LayoutDashboard,
      ariaLabel: 'Ir para Dashboard',
    },
    {
      path: '/transactions',
      label: 'Transações',
      Icon: ArrowLeftRight,
      ariaLabel: 'Ir para Transações',
    },
    {
      path: '/accounts',
      label: 'Contas',
      Icon: Wallet,
      ariaLabel: 'Ir para Contas',
    },
    {
      path: '/categories',
      label: 'Categorias',
      Icon: Tags,
      ariaLabel: 'Ir para Categorias',
    },
    {
      path: '/irpf',
      label: 'Imposto de Renda',
      Icon: FileText,
      ariaLabel: 'Ir para Imposto de Renda',
    },
  ];

  return (
    <aside className="sidebar" role="navigation" aria-label="Navegação principal">
      <div className="brand">
        <div className="brand-mark" aria-label="Logo Mertilo">
          M
        </div>
        <div>
          <span className="brand-label">Financeiro</span>
          <strong>Mertilo</strong>
        </div>
      </div>

      <nav className="nav" aria-label="Menu de navegação">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <item.Icon size={20} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mini-card" role="region" aria-label="Meta mensal">
        <span>Meta do mês</span>
        <strong>R$ 10.000,00</strong>
        <small>Guardar para investimentos</small>
      </div>
    </aside>
  );
}
