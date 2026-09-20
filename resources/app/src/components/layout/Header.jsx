/**
 * Header/Topbar - Cabeçalho principal com Design System
 */

import { useLocation } from 'react-router-dom';
import { SlidersHorizontal, Settings, LogOut } from 'lucide-react';
import { useContext } from 'react';
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
};

export function Header() {
  const location = useLocation();
  const metadata = pageMetadata[location.pathname] || {
    title: 'Mertilo',
    eyebrow: 'Painel',
  };

  const { user, logout } = useContext(AuthContext);
  const userInitials = user ? (user.name || '') .split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : '??';

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
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
          <span>Filtrar</span>
        </button>
        <button
          className="ghost-button"
          aria-label="Abrir configurações"
          title="Configurações"
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
        <button className="ghost-button" onClick={() => logout()} title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
