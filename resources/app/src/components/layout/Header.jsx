/**
 * Header/Topbar - Cabeçalho principal com Design System
 */

import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, Settings, LogOut } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';

const pageMetadata = {
  '/': {
    title: 'MERTILO',
    eyebrow: 'Bem-vindo',
  },
  '/transactions': {
    title: 'Transações',
    eyebrow: 'Gerenciar',
  },
  '/accounts': {
    title: 'Contas',
    eyebrow: 'Suas contas',
  },
  '/categories': {
    title: 'Categorias',
    eyebrow: 'Classificação',
  },
  '/irpf': {
    title: 'Imposto de Renda',
    eyebrow: 'Fiscal',
  },
};

const periodOptions = [
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Últimos 3 meses' },
  { value: 'all', label: 'Todo o período' },
];

const STORAGE_KEYS = {
  period: 'mertilo_selected_period',
  settings: 'mertilo_account_settings',
};

export function Header() {
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.period);
    return stored || 'month';
  });

  useEffect(() => {
    const handlePeriodChange = (event) => {
      const nextValue = event.detail || localStorage.getItem(STORAGE_KEYS.period) || 'month';
      setSelectedPeriod(nextValue);
    };

    window.addEventListener('mertilo-period-change', handlePeriodChange);
    return () => window.removeEventListener('mertilo-period-change', handlePeriodChange);
  }, []);
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.settings);
      return stored ? JSON.parse(stored) : { notifications: true, performance: true };
    } catch {
      return { notifications: true, performance: true };
    }
  });

  const pathname = location.pathname || '/';
  const metadata = pageMetadata[pathname] || (pathname.startsWith('/irpf') ? pageMetadata['/irpf'] : {
    title: 'Mertilo',
    eyebrow: 'Painel',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.period, selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  const { user, logout } = useContext(AuthContext);
  const userInitials = user ? (user.name || '').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() : '??';

  function togglePanel(panel) {
    if (panel === 'filters') {
      setShowFilters((current) => !current);
      setShowSettings(false);
      return;
    }

    setShowSettings((current) => !current);
    setShowFilters(false);
  }

  function updateSetting(key) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow light">{metadata.eyebrow}</span>
        <h1>{metadata.title}</h1>
      </div>

      <div className="topbar-actions">
        <button
          className="ghost-button"
          aria-label="Abrir filtros"
          title="Filtrar dados"
          onClick={() => togglePanel('filters')}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
          <span>Filtrar</span>
        </button>
        <button
          className="ghost-button"
          aria-label="Abrir configurações"
          title="Configurações"
          onClick={() => togglePanel('settings')}
        >
          <Settings size={18} strokeWidth={2} />
        </button>
        <div
          className="profile-pill"
          title="Perfil do usuário"
          aria-label={`Iniciais do usuário: ${userInitials}`}
        >
          {userInitials}
        </div>
        <button className="ghost-button" onClick={() => logout()} title="Sair" aria-label="Sair">
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>

      {showFilters && (
        <div style={{ position: 'absolute', right: '1.5rem', top: '4.5rem', minWidth: '220px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 20 }} role="dialog" aria-label="Filtros do painel">
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filtro por período</p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedPeriod === option.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                aria-pressed={selectedPeriod === option.value}
                onClick={() => {
                  setSelectedPeriod(option.value);
                  localStorage.setItem(STORAGE_KEYS.period, option.value);
                  window.dispatchEvent(new CustomEvent('mertilo-period-change', { detail: option.value }));
                  setShowFilters(false);
                }}
                style={{ justifyContent: 'center' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: 'absolute', right: '5.5rem', top: '4.5rem', minWidth: '220px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 20 }} role="dialog" aria-label="Configurações do painel">
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Configurações da conta</p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>Notificações</span>
              <input type="checkbox" checked={Boolean(settings.notifications)} onChange={() => updateSetting('notifications')} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>Desempenho</span>
              <input type="checkbox" checked={Boolean(settings.performance)} onChange={() => updateSetting('performance')} />
            </label>
          </div>
        </div>
      )}
    </header>
  );
}
