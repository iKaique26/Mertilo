/**
 * Página Accounts - Gerenciamento de contas
 * Exibe todas as contas registradas com opções de editar/excluir
 */

// Importa o hook customizado que dá acesso ao estado financeiro global (contas, loading, error, etc.)
import { useFinancial } from '../../hooks/useFinancial';
// Importa componentes reutilizáveis de UI para estados de carregamento, erro e vazio,
// além de "skeletons" (placeholders animados) usados enquanto os dados carregam
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
// Importa ícones da biblioteca lucide-react usados nos botões e cards
import { Wallet, PlusCircle, Edit2, Trash2 } from 'lucide-react';

// Função utilitária que formata um número como moeda brasileira (R$).
// Usa Intl.NumberFormat com locale 'pt-BR' e currency 'BRL'.
// Number(value) || 0 garante que valores inválidos/nulos virem 0.
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
};

// Componente principal da página de contas
export function Accounts() {
  // Pega apenas o "state" do contexto financeiro (contém loading, error, accounts, etc.)
  const { state } = useFinancial();

  // Se estiver carregando, retorna placeholders (skeleton grid + skeleton row).
  // Isso evita "pulos" de layout enquanto os dados reais não chegam.
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

  // Se houver erro no carregamento, delega a renderização ao componente ErrorState
  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  // Garante que "contas" seja sempre um array, mesmo se state.accounts for null/undefined
  const contas = state.accounts || [];
  // Soma o valor de todas as contas para exibir o total (Number(valor) || 0 protege contra nulos)
  const totalContas = contas.reduce((sum, acc) => sum + (Number(acc.valor) || 0), 0);
  // Conta quantas contas são fixas (isFixed === true)
  const contasFixas = contas.filter((c) => c.isFixed).length;
  // Conta quantas contas são variáveis (isFixed === false)
  const contasVariaveis = contas.filter((c) => !c.isFixed).length;

  return (
    <>
      {/* Header da página: título, subtítulo e botão "Nova conta" alinhados em flex */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* "eyebrow" é o texto pequeno acima do título (rótulo de seção) */}
          <p className="eyebrow">Gerenciamento</p>
          <h1>Suas contas</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Acompanhe todas as suas contas e saldos
          </p>
        </div>
        {/* Botão para adicionar nova conta (ainda sem handler de clique) */}
        <button className="btn btn-primary btn-md">
          <PlusCircle size={18} strokeWidth={2} />
          Nova conta
        </button>
      </div>

      {/* Resumo em cards (grid de estatísticas). gridTemplateColumns responsivo com auto-fit */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Card 1: total em contas (soma dos valores) - com classe "accent" para destaque visual */}
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Wallet size={18} strokeWidth={2} />
              <span>Total em contas</span>
            </div>
          </div>
          {/* Exibe o total formatado como moeda */}
          <strong className="stat-value">{formatCurrency(totalContas)}</strong>
          {/* Exibe a quantidade de contas (pluraliza corretamente "conta"/"contas") */}
          <small>{contas.length} conta{contas.length !== 1 ? 's' : ''}</small>
        </article>

        {/* Card 2: quantidade de contas fixas (despesas recorrentes) */}
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

        {/* Card 3: quantidade de contas variáveis (despesas ocasionais) */}
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

      {/* Painel com a lista/tabela de contas registradas */}
      <section className="panel">
        {/* Cabeçalho do painel com título e contador de itens */}
        <div className="panel-header">
          <h3>Contas Registradas</h3>
          <span>{contas.length} item{contas.length !== 1 ? 'ns' : ''}</span>
        </div>

        {/* Renderização condicional: se há contas, mostra a lista; caso contrário, mostra o EmptyState */}
        {contas.length > 0 ? (
          <div className="account-list">
            {/* Itera sobre cada conta, criando uma "linha" (account-row) por conta */}
            {contas.map((account) => (
              // key={account.id} ajuda o React a identificar cada item de forma única
              <div key={account.id} className="account-row">
                {/* Coluna esquerda: nome da conta + categoria */}
                <div>
                  <strong>{account.nome}</strong>
                  <small>{account.categoria}</small>
                </div>
                {/* Coluna direita: pill do tipo, valor formatado e ações (editar/excluir) */}
                <div className="account-meta">
                  {/* Pill indica se é Fixa ou Variável; recebe classe "active" quando fixa */}
                  <span className={`pill ${account.isFixed ? 'active' : ''}`}>
                    {account.isFixed ? 'Fixa' : 'Variável'}
                  </span>
                  {/* Valor da conta formatado como moeda */}
                  <strong>{formatCurrency(account.valor)}</strong>
                  {/* Botões de ação (ainda sem handlers de clique implementados) */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Botão de editar conta - usa ícone de lápis */}
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Editar conta"
                      aria-label="Editar conta"
                    >
                      <Edit2 size={16} strokeWidth={2} />
                    </button>
                    {/* Botão de excluir conta - usa ícone de lixeira */}
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
          // Estado vazio: mostra ícone, mensagem e botão para criar a primeira conta
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