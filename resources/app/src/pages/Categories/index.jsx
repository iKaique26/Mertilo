/**
 * Página Categories - Gerenciamento de categorias
 * Exibe todas as categorias com opções de editar/excluir
 */

import { useFinancial } from '../../hooks/useFinancial';
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
import { Tag, PlusCircle, Edit2, Trash2 } from 'lucide-react';

export function Categories() {
  const { state } = useFinancial();

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

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  const categorias = state.categories || [];

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Organização</p>
          <h1>Categorias</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Organize suas transações por categoria
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          <PlusCircle size={18} strokeWidth={2} />
          Nova categoria
        </button>
      </div>

      {/* Resumo */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Tag size={18} strokeWidth={2} />
              <span>Total de categorias</span>
            </div>
          </div>
          <strong className="stat-value">{categorias.length}</strong>
          <small>Categorias cadastradas</small>
        </article>
      </section>

      {/* Lista de categorias */}
      <section className="panel">
        <div className="panel-header">
          <h3>Suas Categorias</h3>
          <span>{categorias.length} item{categorias.length !== 1 ? 'ns' : ''}</span>
        </div>

        {categorias.length > 0 ? (
          <div className="category-list">
            {categorias.map((category) => (
              <div key={category.id} className="category-row">
                <div className="category-info">
                  <div className="category-label">
                    <span
                      className="swatch"
                      style={{ backgroundColor: category.cor || '#8b5cf6' }}
                      title={`Cor: ${category.cor}`}
                    />
                    <div>
                      <strong>{category.nome}</strong>
                      <small>
                        {Math.round((Number(category.percentual) || 0) * 100)}% de utilização
                      </small>
                    </div>
                  </div>
                </div>
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
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Editar categoria"
                    aria-label="Editar categoria"
                  >
                    <Edit2 size={16} strokeWidth={2} />
                  </button>
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
