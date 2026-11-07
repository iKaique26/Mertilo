/**
 * Página Dashboard - Visão geral financeira profissional
 * Exibe todos os dados financeiros em um único painel
 */

import { useEffect, useState } from 'react';
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

const PERIOD_STORAGE_KEY = 'mertilo_selected_period';
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

function getStoredPeriod() {
  if (typeof window === 'undefined') return 'month';
  return localStorage.getItem(PERIOD_STORAGE_KEY) || 'month';
}

function getPeriodLabel(period) {
  switch (period) {
    case 'quarter': return 'Últimos 3 meses';
    case 'all': return 'Todo o período';
    default: return 'Este mês';
  }
}

function filterHistoryByPeriod(history, period) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const safeEntries = history
    .map((entry) => ({
      ...entry,
      monthKey: entry?.mes || entry?.data || entry?.criadoEm || '',
    }))
    .filter((entry) => entry.monthKey)
    .sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));

  if (period === 'quarter') {
    return safeEntries.slice(-3);
  }

  if (period === 'all') {
    return safeEntries;
  }

  return safeEntries.slice(-1);
}

function buildSavingsRecommendations({ salario, contas, categories, history, totalExpenses, balance }) {
  const fixedExpenses = (contas || []).filter((item) => item.isFixed).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const mainCategory = [...(categories || [])].sort((a, b) => Number(b.gasto) - Number(a.gasto))[0];
  const targetedCategory = (categories || []).find((category) => ['Lazer', 'Assinaturas e serviços digitais', 'Compras'].some((name) => category.nome?.toLowerCase().includes(name.toLowerCase())) && Number(category.gasto) > 0);
  const targetedPercent = targetedCategory && salario > 0 ? (Number(targetedCategory.gasto) / salario) * 100 : 0;
  const totalHistory = (history || []).reduce((sum, item) => sum + (Number(item.totalContas) || 0), 0);
  const avgSpent = history && history.length ? totalHistory / history.length : fixedExpenses;
  const highestCategory = (categories || []).reduce((best, category) => {
    const value = Number(category.gasto || category.percentual || 0);
    if (!best || value > best.value) {
      return { name: category.nome, value };
    }
    return best;
  }, null);

  const recommendations = [];

  if (targetedCategory && targetedPercent > 15) {
    recommendations.push({
      title: 'Dica de economia',
      description: `Atenção: seus gastos com ${targetedCategory.nome} estão em ${targetedPercent.toFixed(1)}% da sua renda. Que tal revisar suas assinaturas?`,
      value: 'Revisar',
    });
  }

  if (totalExpenses > salario && mainCategory) {
    recommendations.push({
      title: 'Alerta de orçamento',
      description: `Alerta: Você gastou mais do que ganhou este mês. Reveja seus gastos com ${mainCategory.nome}.`,
      value: 'Atenção',
    });
  } else if (balance > 0) {
    recommendations.push({
      title: 'Boa evolução',
      description: `Parabéns! Você economizou ${formatCurrency(balance)} este mês. Considere investir esse valor.`,
      value: 'Investir',
    });
  }

  if (salario && fixedExpenses > salario * 0.45) {
    recommendations.push({
      title: 'Reduzir despesas fixas',
      description: 'Suas contas fixas representam mais de 45% da sua renda. Revise contratos, renegocie e ajuste itens recorrentes.',
      value: 'Prioridade alta',
    });
  }

  if (highestCategory && highestCategory.value > avgSpent * 0.28) {
    recommendations.push({
      title: 'Revisar categoria dominante',
      description: `A categoria ${highestCategory.name} está concentrando grande parte dos gastos. Avalie cortes e metas mensais mais rigorosas.`,
      value: 'Ajuste mensal',
    });
  }

  if (history && history.length > 1) {
    const recent = Number(history[history.length - 1]?.totalContas || 0);
    const previousAverage = history.slice(0, -1).reduce((sum, item) => sum + (Number(item.totalContas) || 0), 0) / Math.max(history.length - 1, 1);
    if (recent > previousAverage * 1.15) {
      recommendations.push({
        title: 'Controlar gastos recorrentes',
        description: 'O último período ficou acima da média histórica. Reduzir pequenos gastos recorrentes pode recuperar mais do que o suficiente.',
        value: 'Atenção',
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Manter disciplina atual',
      description: 'Seu padrão financeiro está equilibrado. Continue mantendo a recorrência e a reserva de emergência.',
      value: 'Estável',
    });
  }

  return recommendations.slice(0, 3);
}

export function Dashboard() {
  const { state } = useFinancial();
  const [selectedPeriod, setSelectedPeriod] = useState(getStoredPeriod);

  useEffect(() => {
    const handlePeriodChange = (event) => {
      setSelectedPeriod(event.detail || getStoredPeriod());
    };

    window.addEventListener('mertilo-period-change', handlePeriodChange);
    return () => window.removeEventListener('mertilo-period-change', handlePeriodChange);
  }, []);

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
  const summary = state.summary || {};
  const salario = Number(summary.receitaTotal ?? state.salario) || 0;
  const contas = state.accounts || [];
  const categorias = summary.gastosPorCategoria?.length ? summary.gastosPorCategoria : state.categories || [];
  const historico = state.history || [];
  const historicoFiltrado = filterHistoryByPeriod(historico, selectedPeriod);

  // Calcular métricas
  const totalFixos = contas.reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0
  );
  const saldo = Number(summary.saldoTotal ?? (salario - totalFixos));
  const totalExpenses = Number(summary.despesaTotal ?? summary.totalDespesas ?? totalFixos) || 0;
  const recommendations = buildSavingsRecommendations({
    salario,
    contas,
    categories: categorias,
    history: historicoFiltrado,
    totalExpenses,
    balance: saldo,
  });
  const gastoMedio =
    historicoFiltrado.length
      ? historicoFiltrado.reduce(
          (sum, item) => sum + (Number(item.totalContas) || 0),
          0
        ) / historicoFiltrado.length
      : 0;
  const rendaTotal = historicoFiltrado.length
    ? historicoFiltrado.reduce(
        (sum, item) => sum + (Number(item.rendaTotal) || 0),
        0
      )
    : salario;

  // Verificar se há dados
  const temContas = contas.length > 0;
  const temCategorias = categorias.length > 0;
  const temHistorico = historico.length > 0;
  const atividadeRecente = summary.atividadeRecente || [];

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
        totalExpenses={totalExpenses}
        saldo={saldo}
      />

      {categorias.length > 0 && (() => {
        const maior = [...categorias].sort((a, b) => Number(b.gasto) - Number(a.gasto))[0];
        const share = salario > 0 ? (Number(maior?.gasto || 0) / salario) * 100 : 0;
        return <div className="expense-highlight"><strong>Sua maior despesa no mês foi com {maior?.nome}: {formatCurrency(maior?.gasto)}</strong><span>{share.toFixed(1)}% da sua renda</span></div>;
      })()}

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

      <section className="panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <div>
            <h3>Atividade recente</h3>
            <small>Importações e movimentações</small>
          </div>
        </div>
        {atividadeRecente.length ? atividadeRecente.slice(0, 5).map((item) => (
          <div className="history-row" key={`${item.type}-${item.id}`}>
            <div><strong>{item.description || item.category || 'Movimentação'}</strong><small>{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : ''}</small></div>
            <strong className={Number(item.value) >= 0 ? 'positive' : 'negative'}>{formatCurrency(item.value)}</strong>
          </div>
        )) : <EmptyState title="Nenhuma atividade recente" message="Importe movimentações para acompanhar seu fluxo financeiro." />}
      </section>

      <section className="panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <div>
            <h3>Recomendações de economia</h3>
            <small>{getPeriodLabel(selectedPeriod)}</small>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation.title}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.02)',
              }}
            >
              <div>
                <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{recommendation.title}</strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{recommendation.description}</span>
              </div>
              <span
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: '999px',
                  background: 'var(--color-primary-soft, rgba(59, 130, 246, 0.12))',
                  color: 'var(--color-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {recommendation.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico e transações recentes */}
      {temHistorico ? (
        <HistoryPanel history={historicoFiltrado} />
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
