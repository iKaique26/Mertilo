/**
 * Loading - Componente de carregamento
 */

export function Loading() {
  return (
    <div className="screen state">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando...</p>
      </div>
    </div>
  );
}

/**
 * ErrorState - Componente de erro
 */
export function ErrorState({ error }) {
  return (
    <div className="screen error">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Erro: {error}</p>
      </div>
    </div>
  );
}

/**
 * EmptyState - Estado vazio profissional
 */
export function EmptyState({
  icon: Icon,
  title = 'Nenhum dado disponível',
  message,
  action,
}) {
  return (
    <div className="empty-state-container">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/**
 * Skeleton - Componente de skeleton loader
 */
export function Skeleton({ width = '100%', height = '20px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * SkeletonCard - Skeleton para cards
 */
export function SkeletonCard() {
  return (
    <div className="stat-card">
      <Skeleton height="16px" width="40%" style={{ marginBottom: '12px' }} />
      <Skeleton height="32px" width="60%" style={{ marginBottom: '12px' }} />
      <Skeleton height="12px" width="50%" />
    </div>
  );
}

/**
 * SkeletonGrid - Skeleton para grid de cards
 */
export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonRow - Skeleton para linha de tabela
 */
export function SkeletonRow({ columns = 5 }) {
  return (
    <div className="skeleton-row">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height="16px" width="100%" />
      ))}
    </div>
  );
}
