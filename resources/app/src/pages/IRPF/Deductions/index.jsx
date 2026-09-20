/**
 * Página de Deduções - IRPF
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function IRPFDeductions() {
  const { exerciseId } = useParams();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    deduction_type: 'saude',
    description: '',
    amount: '',
    category: '',
  });

  const DEDUCTION_TYPES = {
    saude: 'Saúde',
    educacao: 'Educação',
    dependentes: 'Dependentes',
    previdencia: 'Previdência',
    pensao: 'Pensão',
    outras: 'Outras Deduções',
  };

  const CATEGORIES = {
    consulta_medica: 'Consulta Médica',
    medicamento: 'Medicamento',
    procedimento: 'Procedimento Médico',
    plano_saude: 'Plano de Saúde',
    escola: 'Escola/Educação',
    universidade: 'Universidade',
    curso: 'Curso',
    livros: 'Livros/Material',
    inps: 'INPS',
    privada: 'Previdência Privada',
    judicial: 'Judicial',
    voluntaria: 'Voluntária',
  };

  // Carregar deduções
  useEffect(() => {
    if (state.currentExerciseId) {
      loadDeductions();
    }
  }, [state.currentExerciseId]);

  async function loadDeductions() {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/deductions/exercise/${state.currentExerciseId}`
      );
      const data = await response.json();
      setDeductions(data || []);
    } catch (error) {
      console.error('Erro ao carregar deduções:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDeduction(e) {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.deduction_type) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId
        ? `http://127.0.0.1:5000/api/irpf/deductions/${editingId}`
        : 'http://127.0.0.1:5000/api/irpf/deductions';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: state.currentExerciseId,
          deduction_type: formData.deduction_type,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category || null,
          confidence_score: 100,
          is_verified: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar dedução');

      await loadDeductions();
      setFormData({ deduction_type: 'saude', description: '', amount: '', category: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleDeleteDeduction(dedId) {
    if (!confirm('Tem certeza?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/deductions/${dedId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');
      await loadDeductions();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  function handleEdit(deduction) {
    setFormData({
      deduction_type: deduction.deduction_type,
      description: deduction.description,
      amount: deduction.amount.toString(),
      category: deduction.category || '',
    });
    setEditingId(deduction.id);
    setShowForm(true);
  }

  if (!state.currentExerciseId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Selecione um exercício primeiro</p>
      </div>
    );
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  const deductionsByType = Object.keys(DEDUCTION_TYPES).reduce((acc, type) => {
    acc[type] = deductions.filter((d) => d.deduction_type === type);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Deduções</h2>
        <button
          onClick={() => {
            setFormData({ deduction_type: 'saude', description: '', amount: '', category: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
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
          }}
        >
          <Plus size={16} /> Nova Dedução
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddDeduction}
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
                Tipo de Dedução
              </label>
              <select
                value={formData.deduction_type}
                onChange={(e) => setFormData({ ...formData, deduction_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {Object.entries(DEDUCTION_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <option value="">Selecionar categoria</option>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
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
              placeholder="Ex: Consulta Oftalmológica - Clínica Visão"
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

          <div style={{ marginBottom: '1rem' }}>
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
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
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

      {/* Alerta */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <AlertCircle size={20} style={{ color: 'var(--color-primary)' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Adicione apenas despesas que são permitidas pela legislação de imposto de renda. Despesas do dia a dia
          não são automaticamente deduções fiscais.
        </p>
      </div>

      {/* Total */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
          Total de Deduções
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>R$ {totalDeductions.toFixed(2)}</p>
      </div>

      {/* Lista por tipo */}
      {loading ? (
        <p>Carregando...</p>
      ) : deductions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p>Nenhuma dedução cadastrada</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.entries(deductionsByType).map(([type, typeDeductions]) =>
            typeDeductions.length > 0 ? (
              <div key={type}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                  {DEDUCTION_TYPES[type]}
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {typeDeductions.map((deduction) => (
                    <div
                      key={deduction.id}
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
                        <h5 style={{ marginBottom: '0.25rem' }}>{deduction.description}</h5>
                        {deduction.category && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {CATEGORIES[deduction.category] || deduction.category}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <p style={{ fontWeight: 600 }}>R$ {deduction.amount.toFixed(2)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(deduction)}
                          title="Editar"
                          style={{
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeduction(deduction.id)}
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
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
