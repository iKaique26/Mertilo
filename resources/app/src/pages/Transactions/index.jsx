/**
 * Página Transactions - Histórico de transações
 * Exibe todas as transações com opções de filtro e busca
 */

import { useState } from 'react';
import { useFinancial } from '../../hooks/useFinancial';
import {
  Loading,
  ErrorState,
  EmptyState,
  SkeletonRow,
} from '../../components/common';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
};

export function Transactions() {
  const { state } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  if (state.loading) {
    return (
      <div className="panel">
        <SkeletonRow columns={4} />
      </div>
    );
  }

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  const historico = state.history || [];

  // Filtrar transações
  const filtradas = historico.filter((item) => {
    const matchSearch = searchTerm === '' || 
      item.mes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Histórico</p>
        <h1>Transações</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Acompanhe todas as suas movimentações financeiras
        </p>
      </div>

      {/* Barra de filtros e busca */}
      <div className="filters-bar" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar por período..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ paddingLeft: '36px' }}
          />
          <Search
            size={18}
            strokeWidth={2}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-secondary)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <button className="btn btn-secondary btn-md">
          <Filter size={18} strokeWidth={2} />
          Filtrar
        </button>
      </div>

      {/* Lista de transações */}
      <section className="panel">
        <div className="panel-header">
          <h3>Registros de transações</h3>
          <span>{filtradas.length} item{filtradas.length !== 1 ? 'ns' : ''}</span>
        </div>

        {filtradas.length > 0 ? (
          <div className="history-list">
            {filtradas.map((item, idx) => (
              <div key={idx} className="history-row">
                <div>
                  <strong>{item.mes || 'Período indefinido'}</strong>
                  <small>
                    Receita: {formatCurrency(item.rendaTotal || 0)}
                  </small>
                  <small style={{ display: 'block' }}>
                    Despesa: {formatCurrency(item.totalContas || 0)}
                  </small>
                </div>
                <div className="history-metrics">
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: 'var(--color-text-secondary)' }}>Saldo disponível</small>
                    <strong className={Number(item.saldoDisponivel || 0) >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(item.saldoDisponivel || 0)}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                    }}
                  >
                    {Number(item.saldoDisponivel || 0) >= 0 ? (
                      <TrendingUp size={16} color="var(--color-success)" />
                    ) : (
                      <TrendingDown size={16} color="var(--color-danger)" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Nenhuma transação encontrada"
            message="Comece a adicionar receitas e despesas para ver o histórico"
          />
        )}
      </section>

      {/* Nota sobre filtros pendentes */}
      {filtradas.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderRadius: '8px',
            borderLeft: '4px solid var(--color-info)',
            color: 'var(--color-text-secondary)',
            fontSize: '12px',
          }}
        >
          <strong>Nota:</strong> Filtros adicionais (Tipo, Categoria, Conta) estão em desenvolvimento.
        </div>
      )}
    </>
  );
}
