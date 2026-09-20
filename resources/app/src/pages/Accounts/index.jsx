/**
 * Página Accounts - Gerenciamento de contas
 * Exibe todas as contas registradas com opções de editar/excluir
 */

import { useFinancial } from '../../hooks/useFinancial';
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
import { Wallet, PlusCircle, Edit2, Trash2 } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
};

export function Accounts() {
  const { state } = useFinancial();

  if (state.loading) {
    return (
      <>
        <SkeletonGrid count={3} />
        <div className="panel">
          <SkeletonRow />
        </div>
      </>
    );
  }

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  const contas = state.accounts || [];
  const totalContas = contas.reduce((sum, acc) => sum + (Number(acc.valor) || 0), 0);
  const contasFixas = contas.filter((c) => c.isFixed).length;
  const contasVariaveis = contas.filter((c) => !c.isFixed).length;

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Gerenciamento</p>
          <h1>Suas contas</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Acompanhe todas as suas contas e saldos
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          <PlusCircle size={18} strokeWidth={2} />
          Nova conta
        </button>
      </div>

      {/* Resumo em cards */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Wallet size={18} strokeWidth={2} />
              <span>Total em contas</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(totalContas)}</strong>
          <small>{contas.length} conta{contas.length !== 1 ? 's' : ''}</small>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-label">
              <Wallet size={18} strokeWidth={2} />
              <span>Contas fixas</span>
            </div>
          </div>
          <strong className="stat-value">{contasFixas}</strong>
          <small>Despesas recorrentes</small>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-label">
              <Wallet size={18} strokeWidth={2} />
              <span>Contas variáveis</span>
            </div>
          </div>
          <strong className="stat-value">{contasVariaveis}</strong>
          <small>Despesas ocasionais</small>
        </article>
      </section>

      {/* Lista/Tabela de contas */}
      <section className="panel">
        <div className="panel-header">
          <h3>Contas Registradas</h3>
          <span>{contas.length} item{contas.length !== 1 ? 'ns' : ''}</span>
        </div>

        {contas.length > 0 ? (
          <div className="account-list">
            {contas.map((account) => (
              <div key={account.id} className="account-row">
                <div>
                  <strong>{account.nome}</strong>
                  <small>{account.categoria}</small>
                </div>
                <div className="account-meta">
                  <span className={`pill ${account.isFixed ? 'active' : ''}`}>
                    {account.isFixed ? 'Fixa' : 'Variável'}
                  </span>
                  <strong>{formatCurrency(account.valor)}</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Editar conta"
                      aria-label="Editar conta"
                    >
                      <Edit2 size={16} strokeWidth={2} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      title="Excluir conta"
                      aria-label="Excluir conta"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma conta registrada"
            message="Crie sua primeira conta para começar a acompanhá-la"
            action={
              <button className="btn btn-primary">
                <PlusCircle size={18} strokeWidth={2} />
                Criar primeira conta
              </button>
            }
          />
        )}
      </section>
    </>
  );
}
