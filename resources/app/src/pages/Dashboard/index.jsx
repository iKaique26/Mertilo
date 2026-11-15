/**
 * Página Dashboard - Visão geral financeira profissional
 * Exibe todos os dados financeiros em um único painel
 */

// Importa os hooks useEffect (efeitos colaterais) e useState (estado local)
import { useEffect, useState } from 'react';
// Importa o hook que dá acesso ao estado financeiro global (contas, categorias, histórico, summary, etc.)
import { useFinancial } from '../../hooks/useFinancial';
// Importa o hook/contexto de privacidade, que expõe getFunctionalValue
// (lê valores da storage respeitando a preferência de privacidade do usuário)
import { usePrivacy } from '../../context/PrivacyContext';
// Importa componentes de UI para estados de loading, erro e vazio, além de skeletons
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
// Importa componentes específicos do dashboard:
// - HeroCard: card de destaque (saldo principal)
// - StatsGrid: grid com métricas principais
// - CategoryDistribution: gráfico/distribuição por categoria
// - AccountsPanel: painel de contas
// - HistoryPanel: painel de histórico
import {
  HeroCard,
  StatsGrid,
  CategoryDistribution,
  AccountsPanel,
  HistoryPanel,
} from '../../components/dashboard';
// Importa ícones (tendência de alta e "+" para adicionar)
import { TrendingUp, PlusCircle } from 'lucide-react';

// Chave usada para persistir o período selecionado na storage
const PERIOD_STORAGE_KEY = 'mertilo_selected_period';
// Função utilitária que formata um número como moeda brasileira (R$).
// Number(value) || 0 protege contra valores nulos/inválidos.
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

// Lê o período salvo usando a função do PrivacyContext (respeita privacidade).
// Se não houver valor salvo, retorna o default 'month'.
function getStoredPeriod(getFunctionalValue) {
  return getFunctionalValue(PERIOD_STORAGE_KEY, 'month');
}

// Retorna o rótulo amigável do período selecionado
function getPeriodLabel(period) {
  switch (period) {
    case 'quarter': return 'Últimos 3 meses';
    case 'all': return 'Todo o período';
    default: return 'Este mês';
  }
}

// Filtra o histórico de acordo com o período selecionado
function filterHistoryByPeriod(history, period) {
  // Se não for array ou estiver vazio, retorna array vazio
  if (!Array.isArray(history) || history.length === 0) return [];

  // Normaliza cada entrada: adiciona "monthKey" a partir de campos possíveis
  // (mes, data ou criadoEm), descartando entradas sem chave, e ordena por mês
  const safeEntries = history
    .map((entry) => ({
      ...entry,
      monthKey: entry?.mes || entry?.data || entry?.criadoEm || '',
    }))
    .filter((entry) => entry.monthKey)
    .sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));

  // Período "trimestre": últimos 3 meses
  if (period === 'quarter') {
    return safeEntries.slice(-3);
  }

  // Período "tudo": todos os meses
  if (period === 'all') {
    return safeEntries;
  }

  // Período "mês" (default): apenas o último mês
  return safeEntries.slice(-1);
}

// Constrói as recomendações de economia com base nos dados financeiros
function buildSavingsRecommendations({ salario, contas, categories, history, totalExpenses, balance }) {
  // Soma das despesas fixas (contas com isFixed=true)
  const fixedExpenses = (contas || []).filter((item) => item.isFixed).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  // Categoria com maior gasto
  const mainCategory = [...(categories || [])].sort((a, b) => Number(b.gasto) - Number(a.gasto))[0];
  // Procura uma categoria "alvo" (Lazer, Assinaturas e serviços digitais, Compras) com gasto > 0
  const targetedCategory = (categories || []).find((category) => ['Lazer', 'Assinaturas e serviços digitais', 'Compras'].some((name) => category.nome?.toLowerCase().includes(name.toLowerCase())) && Number(category.gasto) > 0);
  // Percentual que essa categoria "alvo" representa em relação ao salário
  const targetedPercent = targetedCategory && salario > 0 ? (Number(targetedCategory.gasto) / salario) * 100 : 0;
  // Soma total dos gastos históricos
  const totalHistory = (history || []).reduce((sum, item) => sum + (Number(item.totalContas) || 0), 0);
  // Média de gastos (se não houver histórico, usa as despesas fixas como fallback)
  const avgSpent = history && history.length ? totalHistory / history.length : fixedExpenses;
  // Categoria com o maior valor gasto (considera campo "gasto" ou "percentual")
  const highestCategory = (categories || []).reduce((best, category) => {
    const value = Number(category.gasto || category.percentual || 0);
    if (!best || value > best.value) {
      return { name: category.nome, value };
    }
    return best;
  }, null);

  // Array acumulador de recomendações
  const recommendations = [];

  // Se a categoria "alvo" passa de 15% da renda, sugere revisar assinaturas
  if (targetedCategory && targetedPercent > 15) {
    recommendations.push({
      title: 'Dica de economia',
      description: `Atenção: seus gastos com ${targetedCategory.nome} estão em ${targetedPercent.toFixed(1)}% da sua renda. Que tal revisar suas assinaturas?`,
      value: 'Revisar',
    });
  }

  // Se gastou mais do que ganhou, alerta sobre orçamento
  if (totalExpenses > salario && mainCategory) {
    recommendations.push({
      title: 'Alerta de orçamento',
      description: `Alerta: Você gastou mais do que ganhou este mês. Reveja seus gastos com ${mainCategory.nome}.`,
      value: 'Atenção',
    });
  } else if (balance > 0) {
    // Caso contrário, se sobrou saldo, incentiva investir
    recommendations.push({
      title: 'Boa evolução',
      description: `Parabéns! Você economizou ${formatCurrency(balance)} este mês. Considere investir esse valor.`,
      value: 'Investir',
    });
  }

  // Se despesas fixas passam de 45% da renda, sugere renegociar/reduzir
  if (salario && fixedExpenses > salario * 0.45) {
    recommendations.push({
      title: 'Reduzir despesas fixas',
      description: 'Suas contas fixas representam mais de 45% da sua renda. Revise contratos, renegocie e ajuste itens recorrentes.',
      value: 'Prioridade alta',
    });
  }

  // Se a maior categoria concentra mais de 28% da média de gastos, sugere revisão
  if (highestCategory && highestCategory.value > avgSpent * 0.28) {
    recommendations.push({
      title: 'Revisar categoria dominante',
      description: `A categoria ${highestCategory.name} está concentrando grande parte dos gastos. Avalie cortes e metas mensais mais rigorosas.`,
      value: 'Ajuste mensal',
    });
  }

  // Se o último período ficou 15% acima da média, sugere controlar recorrentes
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

  // Se nenhuma condição disparou, dá um retorno positivo padrão
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Manter disciplina atual',
      description: 'Seu padrão financeiro está equilibrado. Continue mantendo a recorrência e a reserva de emergência.',
      value: 'Estável',
    });
  }

  // Retorna no máximo 3 recomendações
  return recommendations.slice(0, 3);
}

// Componente principal do Dashboard
export function Dashboard() {
  // Pega o estado financeiro global (summary, accounts, categories, history, loading, error)
  const { state } = useFinancial();
  // Pega a função getFunctionalValue do PrivacyContext (leitura de storage com privacidade)
  const { getFunctionalValue } = usePrivacy();
  // Estado do período selecionado (month/quarter/all).
  // Inicialização lazy: lê da storage via getStoredPeriod.
  const [selectedPeriod, setSelectedPeriod] = useState(() => getStoredPeriod(getFunctionalValue));

  // Efeito: escuta o evento customizado 'mertilo-period-change' disparado em outro lugar da app
  // (ex.: seletor de período no header). Ao receber, atualiza o período.
  useEffect(() => {
    const handlePeriodChange = (event) => {
      setSelectedPeriod(event.detail || getStoredPeriod(getFunctionalValue));
    };

    window.addEventListener('mertilo-period-change', handlePeriodChange);
    // Cleanup: remove o listener ao desmontar (evita vazamentos)
    return () => window.removeEventListener('mertilo-period-change', handlePeriodChange);
  }, [getFunctionalValue]);

  // Estado de loading: renderiza skeletons (grid de 4 cards + painel de linha)
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

  // Estado de erro: delega ao componente ErrorState
  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  // Extrair dados
  // summary é o resumo financeiro vindo do backend (pode estar ausente)
  const summary = state.summary || {};
  // Salário/receita total: prioriza summary.receitaTotal, senão state.salario, senão 0
  const salario = Number(summary.receitaTotal ?? state.salario) || 0;
  // Lista de contas
  const contas = state.accounts || [];
  // Categorias: prioriza as do summary (gastosPorCategoria); se vazio, usa state.categories
  const categorias = summary.gastosPorCategoria?.length ? summary.gastosPorCategoria : state.categories || [];
  // Histórico bruto e histórico filtrado pelo período selecionado
  const historico = state.history || [];
  const historicoFiltrado = filterHistoryByPeriod(historico, selectedPeriod);

  // Calcular métricas
  // Soma total das contas (valor de cada conta)
  const totalFixos = contas.reduce(
    (sum, item) => sum + (Number(item.valor) || 0),
    0
  );
  // Saldo: prioriza summary.saldoTotal; senão calcula (salario - totalFixos)
  const saldo = Number(summary.saldoTotal ?? (salario - totalFixos));
  // Total de despesas: prioriza summary.despesaTotal, depois summary.totalDespesas, senão totalFixos
  const totalExpenses = Number(summary.despesaTotal ?? summary.totalDespesas ?? totalFixos) || 0;
  // Gera recomendações de economia a partir dos dados
  const recommendations = buildSavingsRecommendations({
    salario,
    contas,
    categories: categorias,
    history: historicoFiltrado,
    totalExpenses,
    balance: saldo,
  });
  // Gasto médio no período filtrado (soma de totalContas / quantidade de meses)
  const gastoMedio =
    historicoFiltrado.length
      ? historicoFiltrado.reduce(
          (sum, item) => sum + (Number(item.totalContas) || 0),
          0
        ) / historicoFiltrado.length
      : 0;
  // Renda total no período filtrado (soma de rendaTotal); se não houver, usa salario
  const rendaTotal = historicoFiltrado.length
    ? historicoFiltrado.reduce(
        (sum, item) => sum + (Number(item.rendaTotal) || 0),
        0
      )
    : salario;

  // Verificações de existência de dados (para renderização condicional)
  const temContas = contas.length > 0;
  const temCategorias = categorias.length > 0;
  const temHistorico = historico.length > 0;
  // Lista de atividades recentes (importações/movimentações)
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

      {/* Hero Card com saldo principal (card em destaque) */}
      <HeroCard saldo={saldo} />

      {/* Stats Grid - 4 métricas principais, repassadas ao componente */}
      <StatsGrid
        salario={salario}
        totalFixos={totalFixos}
        rendaTotal={rendaTotal}
        gastoMedio={gastoMedio}
        totalExpenses={totalExpenses}
        saldo={saldo}
      />

      {/* Destaque da maior despesa do mês.
          IIFE (função autoexecutável) para calcular "maior" e "share" localmente e
          retornar o JSX. Só renderiza quando há categorias. */}
      {categorias.length > 0 && (() => {
        const maior = [...categorias].sort((a, b) => Number(b.gasto) - Number(a.gasto))[0];
        const share = salario > 0 ? (Number(maior?.gasto || 0) / salario) * 100 : 0;
        return <div className="expense-highlight"><strong>Sua maior despesa no mês foi com {maior?.nome}: {formatCurrency(maior?.gasto)}</strong><span>{share.toFixed(1)}% da sua renda</span></div>;
      })()}

      {/* Seção de gráficos e categorias (grid de 2 colunas) */}
      <section className="content-grid">
        {/* Gráfico de distribuição por categoria, ou estado vazio */}
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

        {/* Painel de contas, ou estado vazio */}
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

      {/* Painel: atividade recente (até 5 itens).
          Cada item exibe descrição/categoria, data formatada e valor com cor
          positiva (verde) ou negativa (vermelha) conforme o sinal. */}
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

      {/* Painel: recomendações de economia.
          Mostra o rótulo do período selecionado no subtítulo.
          Cada recomendação é um card com título, descrição e "tag" (value). */}
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

      {/* Histórico e transações recentes.
          Se houver histórico, delega ao componente HistoryPanel (com o filtrado).
          Senão, mostra EmptyState sugerindo adicionar a primeira movimentação. */}
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