/**
 * Página de Dependentes - IRPF
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2, User } from 'lucide-react';

export function IRPFDependents() {
  const { exerciseId } = useParams();
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    relationship: 'filho',
  });

  const RELATIONSHIPS = {
    filho: 'Filho(a)',
    conjuge: 'Cônjuge',
    enteado: 'Enteado(a)',
    paimadrasta: 'Pai/Madrasta',
    avopaterna: 'Avó Paterna',
    avomaterna: 'Avó Materna',
    irmasisteirmao: 'Irmã/Irmão',
    outro: 'Outro',
  };

  // Carregar dependentes
  useEffect(() => {
    if (state.currentExerciseId) {
      loadDependents();
    }
  }, [state.currentExerciseId]);

  async function loadDependents() {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/dependents/exercise/${state.currentExerciseId}`
      );
      const data = await response.json();
      setDependents(data || []);
    } catch (error) {
      console.error('Erro ao carregar dependentes:', error);
    } finally {
      setLoading(false);
    }
  }

  function validateCPF(cpf) {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    // Validação simplificada
    return true;
  }

  async function handleAddDependent(e) {
    e.preventDefault();
    if (!formData.name || !formData.relationship) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      alert('CPF inválido');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId
        ? `http://127.0.0.1:5000/api/irpf/dependents/${editingId}`
        : 'http://127.0.0.1:5000/api/irpf/dependents';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: state.currentExerciseId,
          name: formData.name,
          cpf: formData.cpf || null,
          birth_date: formData.birth_date || null,
          relationship: formData.relationship,
          is_verified: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar dependente');

      await loadDependents();
      setFormData({ name: '', cpf: '', birth_date: '', relationship: 'filho' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleDeleteDependent(depId) {
    if (!confirm('Tem certeza?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/dependents/${depId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');
      await loadDependents();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  function handleEdit(dependent) {
    setFormData({
      name: dependent.name,
      cpf: dependent.cpf || '',
      birth_date: dependent.birth_date || '',
      relationship: dependent.relationship,
    });
    setEditingId(dependent.id);
    setShowForm(true);
  }

  if (!state.currentExerciseId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Selecione um exercício primeiro</p>
      </div>
    );
  }

  const dependentsWithoutCPF = dependents.filter((d) => !d.cpf);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Dependentes</h2>
        <button
          onClick={() => {
            setFormData({ name: '', cpf: '', birth_date: '', relationship: 'filho' });
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
          <Plus size={16} /> Novo Dependente
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddDependent}
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Nome
            </label>
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                Parentesco
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {Object.entries(RELATIONSHIPS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Data de Nascimento
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
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

      {/* Alerta de CPF faltante */}
      {dependentsWithoutCPF.length > 0 && (
        <div
          style={{
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '0.25rem' }} />
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              {dependentsWithoutCPF.length} dependente(s) sem CPF informado
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              O CPF é obrigatório para a declaração. Adicione-o antes de enviar.
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p>Carregando...</p>
      ) : dependents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p>Nenhum dependente cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {dependents.map((dependent) => (
            <div
              key={dependent.id}
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
                <h4 style={{ marginBottom: '0.25rem' }}>{dependent.name}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <span>{RELATIONSHIPS[dependent.relationship]}</span>
                  {dependent.cpf && <span>CPF: {dependent.cpf}</span>}
                  {dependent.birth_date && (
                    <span>
                      Nascimento: {new Date(dependent.birth_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEdit(dependent)}
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
                  onClick={() => handleDeleteDependent(dependent.id)}
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
