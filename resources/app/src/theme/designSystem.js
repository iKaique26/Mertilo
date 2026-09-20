/**
 * Design System - Tokens e constantes visuais centralizadas
 * Importar este arquivo para garantir consistência visual
 */

// ============================================================
// CORES
// ============================================================

export const colors = {
  // Backgrounds
  background: {
    primary: '#07111f',      // Fundo principal (--bg)
    secondary: '#101d2d',    // Fundo secundário (--bg-soft)
    surface: 'rgba(15, 23, 42, 0.82)',      // Panels (--panel)
    surfaceStrong: 'rgba(14, 23, 37, 0.98)', // Panels elevados
    overlay: 'rgba(7, 17, 31, 0.88)',        // Modals, overlays
  },

  // Text
  text: {
    primary: '#e2e8f0',      // Texto principal (--text)
    secondary: '#94a3b8',    // Texto secundário (--muted)
    muted: '#64748b',        // Texto muito fraco
    inverse: '#07111f',      // Texto em backgrounds claros
  },

  // Semantic
  success: '#22c55e',        // Verde para sucesso (--primary-2)
  danger: '#ef4444',         // Vermelho para erro/perigo
  warning: '#fbbf24',        // Amarelo para aviso (--warning)
  info: '#38bdf8',           // Azul para informação (--accent)

  // Primary
  primary: '#8b5cf6',        // Roxo para ações principais (--primary)
  primaryHover: '#a78bfa',
  primaryActive: '#7c3aed',

  // Borders
  border: 'rgba(148, 163, 184, 0.18)',  // (--border)
  borderLight: 'rgba(148, 163, 184, 0.06)',

  // Interactive
  hover: 'rgba(148, 163, 184, 0.04)',
  active: 'rgba(139, 92, 246, 0.12)',
};

// ============================================================
// TIPOGRAFIA
// ============================================================

export const typography = {
  // Font family
  fontFamily: {
    body: "Inter, 'Segoe UI', sans-serif",
    mono: "'Fira Code', monospace",
  },

  // Font sizes (escala)
  fontSize: {
    xs: '0.72rem',     // 11.5px
    sm: '0.8rem',      // 12.8px
    base: '1rem',      // 16px
    lg: '1.05rem',     // 16.8px
    xl: '1.5rem',      // 24px
    '2xl': 'clamp(2rem, 4vw, 3rem)',  // Heading principal
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// ============================================================
// ESPAÇAMENTO (em rem, baseado em 16px)
// ============================================================

export const spacing = {
  xs: '4px',      // 0.25rem
  sm: '8px',      // 0.5rem
  md: '12px',     // 0.75rem
  lg: '16px',     // 1rem
  xl: '20px',     // 1.25rem
  '2xl': '24px',  // 1.5rem
  '3xl': '32px',  // 2rem
  '4xl': '40px',  // 2.5rem
};

// ============================================================
// BORDER RADIUS
// ============================================================

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '28px',
  round: '50%',
};

// ============================================================
// SHADOWS
// ============================================================

export const shadows = {
  sm: '0 2px 4px rgba(15, 23, 42, 0.12)',
  md: '0 4px 12px rgba(15, 23, 42, 0.24)',
  lg: '0 24px 60px rgba(15, 23, 42, 0.38)',  // (--shadow)
  xl: '0 40px 80px rgba(15, 23, 42, 0.48)',
};

// ============================================================
// TRANSITIONS / ANIMAÇÕES
// ============================================================

export const transitions = {
  fast: '0.15s ease-in-out',
  base: '0.2s ease-in-out',
  slow: '0.35s ease-in-out',
};

// ============================================================
// TAMANHOS DE ÍCONES
// ============================================================

export const iconSizes = {
  xs: '16px',    // Nav items, badges
  sm: '20px',    // Small buttons, labels
  md: '24px',    // Default buttons, table icons
  lg: '32px',    // Large buttons, card icons
  xl: '48px',    // Hero section
};

// ============================================================
// BREAKPOINTS (Responsive)
// ============================================================

export const breakpoints = {
  sm: '620px',    // Mobile
  md: '980px',    // Tablet
  lg: '1280px',   // Desktop
  xl: '1920px',   // Large desktop
};

// ============================================================
// Z-INDEX (Stacking context)
// ============================================================

export const zIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  tooltip: 50,
  notification: 60,
};

// ============================================================
// ÍCONES - Mapeamento semântico (Lucide React)
// ============================================================

export const iconMap = {
  // Navigation
  dashboard: 'LayoutDashboard',
  transactions: 'ArrowLeftRight',
  accounts: 'Wallet',
  categories: 'Tags',
  
  // Actions
  add: 'Plus',
  edit: 'Pencil',
  delete: 'Trash2',
  search: 'Search',
  filter: 'SlidersHorizontal',
  sort: 'ArrowUpDown',
  
  // Status
  success: 'CheckCircle2',
  error: 'AlertCircle',
  warning: 'AlertTriangle',
  info: 'Info',
  
  // Financial
  income: 'TrendingUp',
  expense: 'TrendingDown',
  balance: 'Scale',
  settings: 'Settings',
  
  // Utility
  close: 'X',
  menu: 'Menu',
  chevronDown: 'ChevronDown',
  chevronUp: 'ChevronUp',
  chevronLeft: 'ChevronLeft',
  chevronRight: 'ChevronRight',
  calendar: 'Calendar',
  clock: 'Clock',
};
