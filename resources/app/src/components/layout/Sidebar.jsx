/**
 * Sidebar - Navegação principal com Design System
 */

import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { useFinancial } from '../../hooks/useFinancial';
import { Menu, X } from 'lucide-react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  FileText,
  Upload,
} from 'lucide-react';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

export function Sidebar() {
  const location = useLocation();
  const { state } = useFinancial();
  const [open, setOpen] = useState(false);
  const saldoTotal = state.summary?.saldoTotal ?? 0;

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
      path: '/importacao-financeira',
      label: 'Importação Financeira',
      Icon: Upload,
      ariaLabel: 'Ir para Importação Financeira',
    },
    {
      path: '/irpf',
      label: 'Imposto de Renda',
      Icon: FileText,
      ariaLabel: 'Ir para Imposto de Renda',
    },
  ];

  return (
    <>
      <button className="mobile-menu-toggle" type="button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && <button className="sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} role="navigation" aria-label="Navegação principal">
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
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                <item.Icon size={20} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mini-card" role="region" aria-label="Saldo em conta">
        <span>Saldo em conta</span>
        <strong>{formatCurrency(saldoTotal)}</strong>
        <small>Dados atualizados pelo Dashboard</small>
      </div>
      </aside>
    </>
  );
}
