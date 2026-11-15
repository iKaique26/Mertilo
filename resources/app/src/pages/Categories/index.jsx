/**
 * Página Categories - Gerenciamento de categorias
 * Exibe todas as categorias com opções de editar/excluir
 */

// Importa o hook customizado que dá acesso ao estado financeiro global (categorias, loading, error, etc.)
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
import { Tag, PlusCircle, Edit2, Trash2 } from 'lucide-react';

// Componente principal da página de categorias
export function Categories() {
  // Pega apenas o "state" do contexto financeiro (contém loading, error, categories, etc.)
  const { state } = useFinancial();

  // Se estiver carregando, retorna placeholders (skeleton grid + skeleton row).
  // Isso evita "pulos" de layout enquanto os dados reais não chegam.
  if (state.loading) {
    return (
      <>
        <SkeletonGrid count={2} />
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

  // Garante que "categorias" seja sempre um array, mesmo se state.categories for null/undefined
  const categorias = state.categories || [];

  return (
    <>
      {/* Header da página: título, subtítulo e botão "Nova categoria" alinhados em flex */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* "eyebrow" é o texto pequeno acima do título (rótulo de seção) */}
          <p className="eyebrow">Organização</p>
          <h1>Categorias</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Organize suas transações por categoria
          </p>
        </div>
        {/* Botão para adicionar nova categoria (ainda sem handler de clique) */}
        <button className="btn btn-primary btn-md">
          <PlusCircle size={18} strokeWidth={2} />
          Nova categoria
        </button>
      </div>

      {/* Resumo em cards (grid de estatísticas). gridTemplateColumns responsivo com auto-fit */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Card: total de categorias cadastradas - com classe "accent" para destaque visual */}
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Tag size={18} strokeWidth={2} />
              <span>Total de categorias</span>
            </div>
          </div>
          {/* Exibe a quantidade total de categorias */}
          <strong className="stat-value">{categorias.length}</strong>
          <small>Categorias cadastradas</small>
        </article>
      </section>

      {/* Painel com a lista de categorias registradas */}
      <section className="panel">
        {/* Cabeçalho do painel com título e contador de itens */}
        <div className="panel-header">
          <h3>Suas Categorias</h3>
          <span>{categorias.length} item{categorias.length !== 1 ? 'ns' : ''}</span>
        </div>

        {/* Renderização condicional: se há categorias, mostra a lista; caso contrário, mostra o EmptyState */}
        {categorias.length > 0 ? (
          <div className="category-list">
            {/* Itera sobre cada categoria, criando uma "linha" (category-row) por categoria */}
            {categorias.map((category) => (
              // key={category.id} ajuda o React a identificar cada item de forma única
              <div key={category.id} className="category-row">
                {/* Bloco esquerdo: cor, nome e percentual de utilização */}
                <div className="category-info">
                  <div className="category-label">
                    {/* "swatch" é o quadradinho colorido que representa a cor da categoria.
                        Se category.cor não existir, usa "#8b5cf6" como fallback.
                        title mostra a cor ao passar o mouse. */}
                    <span
                      className="swatch"
                      style={{ backgroundColor: category.cor || '#8b5cf6' }}
                      title={`Cor: ${category.cor}`}
                    />
                    <div>
                      {/* Nome da categoria */}
                      <strong>{category.nome}</strong>
                      {/* Percentual de utilização: converte o valor (0–1) em porcentagem inteira.
                          Number(...) || 0 protege contra valores nulos/inválidos. */}
                      <small>
                        {Math.round((Number(category.percentual) || 0) * 100)}% de utilização
                      </small>
                    </div>
                  </div>
                </div>
                {/* Barra de progresso visual que representa o percentual de utilização.
                    A largura é limitada a 100% com Math.min. */}
                <div className="category-progress-wrap">
                  <div
                    className="category-progress"
                    style={{
                      width: `${Math.min((Number(category.percentual) || 0) * 100, 100)}%`,
                      backgroundColor: category.cor || '#8b5cf6',
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round((Number(category.percentual) || 0) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                {/* Bloco de ações (editar/excluir). flexShrink: 0 evita que os botões encolham. */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {/* Botão de editar categoria - usa ícone de lápis (ainda sem handler de clique) */}
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Editar categoria"
                    aria-label="Editar categoria"
                  >
                    <Edit2 size={16} strokeWidth={2} />
                  </button>
                  {/* Botão de excluir categoria - usa ícone de lixeira (ainda sem handler de clique) */}
                  <button
                    className="btn btn-danger btn-sm"
                    title="Excluir categoria"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Estado vazio: mostra ícone, mensagem e botão para criar a primeira categoria
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma categoria cadastrada"
            message="Crie sua primeira categoria para organizar suas transações"
            action={
              <button className="btn btn-primary">
                <PlusCircle size={18} strokeWidth={2} />
                Criar primeira categoria
              </button>
            }
          />
        )}
      </section>
    </>
  );
}