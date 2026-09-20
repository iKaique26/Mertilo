/**
 * Página Dashboard - Visão geral financeira profissional
 * Exibe todos os dados financeiros em um único painel
 */

import { useFinancial } from '../../hooks/useFinancial';
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
import {
  HeroCard,
  StatsGrid,
  CategoryDistribution,
  AccountsPanel,
  HistoryPanel,
} from '../../components/dashboard';
import { TrendingUp, PlusCircle } from 'lucide-react';

export function Dashboard() {
  const { state } = useFinancial();

  if (state.loading) {
    return (
      <main className="main-panel">
        <div style={{ padding: '2rem 0' }}>
          <SkeletonGrid count={4} />
        </div>
        <div style={{ padding: '2rem 0' }}>
          <div className="panel">
            <SkeletonRow columns={3} />
          </div>
        </div>
      </main>
    );
  }

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  // Extrair dados
  const salario = Number(state.salario) || 0;
  const contas = state.accounts || [];
  const categorias = state.categories || [];
  const historico = state.history || [];

  // Calcular métricas
  const totalFixos = contas.reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0
  );
  const saldo = salario - totalFixos;
  const gastoMedio =
    historico.length
      ? historico.reduce(
          (sum, item) => sum + (Number(item.totalContas) || 0),
          0
        ) / historico.length
      : 0;
  const rendaTotal = historico.length
    ? historico.reduce(
        (sum, item) => sum + (Number(item.rendaTotal) || 0),
        0
      )
    : salario;

  // Verificar se há dados
  const temContas = contas.length > 0;
  const temCategorias = categorias.length > 0;
  const temHistorico = historico.length > 0;

  return (
    <>
      {/* Header com título e descrição */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Visão geral</p>
        <h1>Acompanhe sua situação financeira</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Resumo completo de receitas, despesas e saldo atual
        </p>
      </div>

      {/* Hero Card com saldo principal */}
      <HeroCard saldo={saldo} />

      {/* Stats Grid - 4 métricas principais */}
      <StatsGrid
        salario={salario}
        totalFixos={totalFixos}
        rendaTotal={rendaTotal}
        gastoMedio={gastoMedio}
      />

      {/* Seção de gráficos e categorias */}
      <section className="content-grid">
        {/* Gráfico de categorias */}
        {temCategorias ? (
          <CategoryDistribution categories={categorias} />
        ) : (
          <div className="panel">
            <div className="panel-header">
              <h3>Gastos por categoria</h3>
            </div>
            <EmptyState
              icon={TrendingUp}
              title="Nenhuma categoria registrada"
              message="Crie categorias para começar a organizar seus gastos"
            />
          </div>
        )}

        {/* Painel de contas */}
        {temContas ? (
          <AccountsPanel accounts={contas} />
        ) : (
          <div className="panel">
            <div className="panel-header">
              <h3>Suas contas</h3>
            </div>
            <EmptyState
              icon={PlusCircle}
              title="Nenhuma conta registrada"
              message="Adicione suas contas para começar a acompanhá-las"
            />
          </div>
        )}
      </section>

      {/* Histórico e transações recentes */}
      {temHistorico ? (
        <HistoryPanel history={historico} />
      ) : (
        <section className="panel">
          <div className="panel-header">
            <h3>Histórico recente</h3>
          </div>
          <EmptyState
            icon={TrendingUp}
            title="Nenhuma transação ainda"
            message="Adicione sua primeira receita ou despesa para começar a acompanhar suas finanças"
          />
        </section>
      )}
    </>
  );
}
