/**
 * Dashboard Components - Componentes reutilizáveis do Dashboard
 * Com Design System integrado
 */

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  ArrowRight,
} from "lucide-react";

// ============================================================
// UTILITIES
// ============================================================

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

// ============================================================
// HERO CARD
// ============================================================

/**
 * Cartão de herói com saldo principal
 */
export function HeroCard({ saldo }) {
  const isPositive = saldo >= 0;

  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow light">Seu patrimônio</p>
        <h2>Saldo total</h2>
      </div>
      <div className="hero-content">
        <div
          className={`hero-amount ${isPositive ? "positive" : "negative"}`}
        >
          {formatCurrency(saldo)}
        </div>
        <div className="hero-trend">
          {isPositive ? (
            <TrendingUp size={20} color="var(--color-success)" />
          ) : (
            <TrendingDown size={20} color="var(--color-danger)" />
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STATS GRID
// ============================================================

/**
 * Grade de cards de estatísticas com ícones
 */
export function StatsGrid({ salario, totalFixos, rendaTotal, gastoMedio }) {
  const stats = [
    {
      label: "Salário",
      value: salario,
      Icon: DollarSign,
      description: "Receita principal",
      highlighted: true,
    },
    {
      label: "Contas fixas",
      value: totalFixos,
      Icon: Wallet,
      description: "Despesas recorrentes",
      highlighted: false,
    },
    {
      label: "Renda total",
      value: rendaTotal,
      Icon: TrendingUp,
      description: "Últimos 3 meses",
      highlighted: false,
    },
    {
      label: "Gasto médio",
      value: gastoMedio,
      Icon: TrendingDown,
      description: "Por mês",
      highlighted: false,
    },
  ];

  return (
    <section className="stats-grid">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className={`stat-card ${stat.highlighted ? "accent" : ""}`}
        >
          <div className="stat-header">
            <div className="stat-label">
              <stat.Icon size={18} strokeWidth={2} />
              <span>{stat.label}</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(stat.value)}</strong>
          <small>{stat.description}</small>
        </article>
      ))}
    </section>
  );
}

// ============================================================
// CATEGORY DISTRIBUTION
// ============================================================

/**
 * Distribuição de gastos por categoria
 */
export function CategoryDistribution({ categories }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const maxValue = Math.max(...categories.map((c) => c.gasto || 0));

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Gastos por categoria</h3>
          <small>Distribuição do mês</small>
        </div>
      </div>

      <div className="category-list">
        {categories.map((category) => {
          const percentage = maxValue ? (category.gasto / maxValue) * 100 : 0;

          return (
            <div key={category.id} className="category-row">
              <div className="category-info">
                <div className="category-label">
                  <span
                    className="swatch"
                    style={{ backgroundColor: category.cor }}
                    aria-label={`Cor ${category.nome}`}
                  />
                  <strong>{category.nome}</strong>
                </div>
                <small>{category.gasto ? formatCurrency(category.gasto) : "R$ 0,00"}</small>
              </div>
              <div className="category-progress-wrap">
                <div
                  className="category-progress"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.cor,
                  }}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// ACCOUNTS PANEL
// ============================================================

/**
 * Painel de contas registradas
 */
export function AccountsPanel({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  const totalAccounts = accounts.reduce((sum, acc) => sum + acc.valor, 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Suas contas</h3>
          <small>{accounts.length} contas ativas</small>
        </div>
        <div className="panel-header-right">
          <strong>{formatCurrency(totalAccounts)}</strong>
        </div>
      </div>

      <div className="account-list">
        {accounts.map((account) => (
          <div key={account.id} className="account-row">
            <div>
              <strong>{account.nome}</strong>
              <small>{account.categoria}</small>
            </div>
            <div className="account-meta">
              <span className={`pill ${account.isFixed ? "active" : ""}`}>
                {account.isFixed ? "Fixa" : "Variável"}
              </span>
              <strong>{formatCurrency(account.valor)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// HISTORY PANEL
// ============================================================

/**
 * Painel de histórico de transações
 */
export function HistoryPanel({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Histórico recente</h3>
          <small>Últimas movimentações</small>
        </div>
        <button className="ghost-button">
          Ver tudo
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="history-list">
        {history.slice(0, 5).map((entry) => (
          <div key={entry.id} className="history-row">
            <div>
              <strong>{entry.categoria}</strong>
              <small>
                {new Date(entry.data).toLocaleDateString("pt-BR")}
              </small>
            </div>
            <div className="history-metrics">
              <strong
                className={entry.valor > 0 ? "positive" : "negative"}
              >
                {entry.valor > 0 ? "+" : ""}
                {formatCurrency(entry.valor)}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
