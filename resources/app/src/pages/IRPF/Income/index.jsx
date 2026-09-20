/**
 * Página de Rendimentos - IRPF
 * Gerencia rendimentos tributáveis, isentos e de tributação exclusiva
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Check, X, Eye } from 'lucide-react';

export function IRPFIncome() {
  const { exerciseId } = useParams();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [formData, setFormData] = useState({
    income_type: 'tributavel',
    description: '',
    amount: '',
    month: '',
    source: '',
  });

  // Carregar rendimentos
  useEffect(() => {
    if (exerciseId) {
      loadIncomes();
    }
  }, [exerciseId]);

  async function loadIncomes() {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/income/exercise/${exerciseId}`
      );
      const data = await response.json();
      setIncomes(data || []);
    } catch (error) {
      console.error('Erro ao carregar rendimentos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIncome(e) {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.income_type) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/irpf/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          income_type: formData.income_type,
          description: formData.description,
          amount: parseFloat(formData.amount),
          month: formData.month ? parseInt(formData.month) : null,
          source: formData.source || null,
          confidence_score: 100,
          is_verified: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao adicionar rendimento');

      await loadIncomes();
      setFormData({ income_type: 'tributavel', description: '', amount: '', month: '', source: '' });
      setShowForm(false);
    } catch (error) {
      alert('Erro ao adicionar rendimento: ' + error.message);
    }
  }

  async function handleVerifyIncome(incomeId) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/income/${incomeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: true }),
      });

      if (!response.ok) throw new Error('Erro ao verificar rendimento');
      await loadIncomes();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleDeleteIncome(incomeId) {
    if (!confirm('Tem certeza que deseja deletar este rendimento?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/income/${incomeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');
      await loadIncomes();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  if (!state.currentExerciseId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Selecione um exercício primeiro</p>
      </div>
    );
  }

  const tributavelTotal = incomes
    .filter((i) => i.income_type === 'tributavel')
    .reduce((sum, i) => sum + i.amount, 0);
  const isentoTotal = incomes
    .filter((i) => i.income_type === 'isento')
    .reduce((sum, i) => sum + i.amount, 0);
  const tributacaoExcTotal = incomes
    .filter((i) => i.income_type === 'tributacao_exclusiva')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Rendimentos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <Plus size={16} /> Novo Rendimento
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddIncome}
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Tipo de Rendimento
              </label>
              <select
                value={formData.income_type}
                onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <option value="tributavel">Tributável</option>
                <option value="isento">Isento</option>
                <option value="tributacao_exclusiva">Tributação Exclusiva</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Mês
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <option value="">Selecionar mês</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Salário mensal, IRRF, etc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Fonte
              </label>
              <input
                type="text"
                placeholder="Ex: Empresa XYZ"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Tributável
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>R$ {tributavelTotal.toFixed(2)}</p>
        </div>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Isento
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>R$ {isentoTotal.toFixed(2)}</p>
        </div>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Trib. Exclusiva
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>R$ {tributacaoExcTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p>Carregando...</p>
      ) : incomes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p>Nenhum rendimento cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {incomes.map((income) => (
            <div
              key={income.id}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '0.25rem' }}>{income.description}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <span>
                    <strong>Tipo:</strong> {income.income_type.replace(/_/g, ' ')}
                  </span>
                  {income.month && <span>Mês: {String(income.month).padStart(2, '0')}</span>}
                  {income.source && <span>Fonte: {income.source}</span>}
                  <span style={{ marginLeft: 'auto', fontWeight: 600 }}>R$ {income.amount.toFixed(2)}</span>
                </div>
                {income.confidence_score && income.confidence_score < 100 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                    Confiança: {income.confidence_score}%
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!income.is_verified && (
                  <button
                    onClick={() => handleVerifyIncome(income.id)}
                    title="Verificar"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <Check size={16} />
                  </button>
                )}
                {income.is_verified && (
                  <span title="Verificado" style={{ color: 'var(--color-success)', padding: '0.5rem' }}>
                    <Check size={16} />
                  </span>
                )}
                <button
                  onClick={() => handleDeleteIncome(income.id)}
                  title="Deletar"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
