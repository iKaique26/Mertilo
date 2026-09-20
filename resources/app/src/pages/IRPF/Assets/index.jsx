/**
 * Página de Bens e Direitos - IRPF
 * Gerencia veículos, imóveis, investimentos, contas bancárias
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function IRPFAssets() {
  const { exerciseId } = useParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    asset_type: 'veiculo',
    description: '',
    value: '',
    location: '',
  });

  const ASSET_TYPES = {
    veiculo: 'Veículo',
    imovel: 'Imóvel',
    investimento: 'Investimento',
    conta_bancaria: 'Conta Bancária',
    aplicacao: 'Aplicação Financeira',
    criptomoeda: 'Criptomoeda',
    outro: 'Outro',
  };

  // Carregar bens
  useEffect(() => {
    if (state.currentExerciseId) {
      loadAssets();
    }
  }, [state.currentExerciseId]);

  async function loadAssets() {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/assets/exercise/${state.currentExerciseId}`
      );
      const data = await response.json();
      setAssets(data || []);
    } catch (error) {
      console.error('Erro ao carregar bens:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAsset(e) {
    e.preventDefault();
    if (!formData.description || !formData.value || !formData.asset_type) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId
        ? `http://127.0.0.1:5000/api/irpf/assets/${editingId}`
        : 'http://127.0.0.1:5000/api/irpf/assets';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: state.currentExerciseId,
          asset_type: formData.asset_type,
          description: formData.description,
          value: parseFloat(formData.value),
          location: formData.location || null,
          confidence_score: 100,
          is_verified: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar bem');

      await loadAssets();
      setFormData({ asset_type: 'veiculo', description: '', value: '', location: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleDeleteAsset(assetId) {
    if (!confirm('Tem certeza?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');
      await loadAssets();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  function handleEdit(asset) {
    setFormData({
      asset_type: asset.asset_type,
      description: asset.description,
      value: asset.value.toString(),
      location: asset.location || '',
    });
    setEditingId(asset.id);
    setShowForm(true);
  }

  if (!state.currentExerciseId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Selecione um exercício primeiro</p>
      </div>
    );
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  const assetsByType = Object.keys(ASSET_TYPES).reduce((acc, type) => {
    acc[type] = assets.filter((a) => a.asset_type === type);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Bens e Direitos</h2>
        <button
          onClick={() => {
            setFormData({ asset_type: 'veiculo', description: '', value: '', location: '' });
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
          <Plus size={16} /> Novo Bem
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddAsset}
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
                Tipo de Bem
              </label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {Object.entries(ASSET_TYPES).map(([key, label]) => (
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
              placeholder="Ex: Toyota Corolla 2020, Apartamento Zona Sul"
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
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
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
                Localização
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
          Patrimônio Total
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>R$ {totalAssets.toFixed(2)}</p>
      </div>

      {/* Lista por tipo */}
      {loading ? (
        <p>Carregando...</p>
      ) : assets.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p>Nenhum bem cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.entries(assetsByType).map(([type, typeAssets]) =>
            typeAssets.length > 0 ? (
              <div key={type}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                  {ASSET_TYPES[type]} ({typeAssets.length})
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {typeAssets.map((asset) => (
                    <div
                      key={asset.id}
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
                        <h5 style={{ marginBottom: '0.25rem' }}>{asset.description}</h5>
                        {asset.location && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Local: {asset.location}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>R$ {asset.value.toFixed(2)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(asset)}
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
                          onClick={() => handleDeleteAsset(asset.id)}
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
