/**
 * Página Principal - IRPF
 * Central de Imposto de Renda
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTax } from '../../context/TaxIRPFContext';
import { FileText, Plus, ChevronRight, AlertCircle, CheckCircle, AlertTriangle, FileCheck, DollarSign, Home, Users, Percent, Brain } from 'lucide-react';

export function IRPF() {
  const { state, dispatch } = useTax();
  const [exercises, setExercises] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Carregar exercícios na montagem
  useEffect(() => {
    loadExercises();
  }, []);

  // Carregar resumo quando exercício muda
  useEffect(() => {
    if (state.currentExerciseId) {
      loadSummary();
      loadDashboard();
    }
  }, [state.currentExerciseId]);

  async function loadDashboard() {
    try {
      setDashboardLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/exercises/${state.currentExerciseId}/dashboard`
      );
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadExercises() {
    try {
      setLoading(true);
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('http://127.0.0.1:5000/api/irpf/exercises');
      const data = await response.json();

      setExercises(data);
      dispatch({ type: 'SET_EXERCISES', payload: data });
      if (data.length > 0) {
        dispatch({ type: 'SET_CURRENT_EXERCISE', payload: data[0].id });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar exercícios';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      setLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function loadSummary() {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/exercises/${state.currentExerciseId}/summary`
      );
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  }

  async function handleCreateExercise(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/irpf/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: newYear }),
      });

      if (!response.ok) throw new Error('Erro ao criar exercício');
      const exercise = await response.json();

      setExercises([...exercises, exercise]);
      dispatch({ type: 'SET_EXERCISES', payload: [...exercises, exercise] });
      dispatch({ type: 'SET_CURRENT_EXERCISE', payload: exercise.id });
      setShowForm(false);
      setNewYear(new Date().getFullYear());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar exercício';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      setLoading(false);
    }
  }

  function selectExercise(id) {
    dispatch({ type: 'SET_CURRENT_EXERCISE', payload: id });
  }

  const currentExercise = state.exercises.find((e) => e.id === state.currentExerciseId);

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Fiscal</p>
          <h1>Imposto de Renda</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Organize seus documentos e prepare sua declaração
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} strokeWidth={2} />
          Novo Exercício
        </button>
      </div>

      {/* Formulário para Novo Exercício */}
      {showForm && (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <form onSubmit={handleCreateExercise}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Ano do Exercício
              </label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                min="2020"
                max={new Date().getFullYear() + 1}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Criando...' : 'Criar'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exercícios */}
      {state.loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>Carregando...</div>
        </div>
      ) : state.exercises.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <FileText size={48} style={{ marginBottom: '1rem', color: 'var(--color-text-tertiary)' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Nenhum exercício fiscal criado</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Comece criando um novo exercício fiscal
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} strokeWidth={2} />
            Criar Exercício
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {state.exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => selectExercise(exercise.id)}
              style={{
                background: 'var(--color-bg-secondary)',
                border:
                  currentExercise?.id === exercise.id
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (currentExercise?.id !== exercise.id) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentExercise?.id !== exercise.id) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Exercício {exercise.year}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Status: <strong>{exercise.status}</strong>
                  </p>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>

              {/* Progresso */}
              <div style={{ marginTop: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Progresso</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{exercise.progress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${exercise.progress}%`,
                      height: '100%',
                      background: 'var(--color-primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalhes do Exercício Selecionado */}
      {currentExercise && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Exercício {currentExercise.year}</h2>

          {dashboardLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              Carregando métricas...
            </div>
          ) : dashboard ? (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Resumo</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <MetricCard
                  icon={FileText}
                  label="Documentos"
                  value={dashboard.documents?.total || 0}
                  subtext={`${dashboard.documents?.processed || 0} processados`}
                />
                <MetricCard
                  icon={DollarSign}
                  label="Rendimentos"
                  value={dashboard.income?.items_count || 0}
                  subtext={`Total: ${formatCurrency(dashboard.income?.total || 0)}`}
                />
                <MetricCard
                  icon={Home}
                  label="Bens"
                  value={dashboard.assets?.items_count || 0}
                  subtext={`Total: ${formatCurrency(dashboard.assets?.total || 0)}`}
                />
                <MetricCard
                  icon={Users}
                  label="Dependentes"
                  value={dashboard.dependents?.total || 0}
                  subtext="Registrados"
                />
                <MetricCard
                  icon={Percent}
                  label="Deduções"
                  value={dashboard.deductions?.items_count || 0}
                  subtext={`Total: ${formatCurrency(dashboard.deductions?.total || 0)}`}
                />
                <MetricCard
                  icon={AlertCircle}
                  label="Alertas"
                  value={dashboard.alerts?.total || 0}
                  subtext={`${dashboard.alerts?.critical || 0} críticos`}
                />
              </div>

              {dashboard.pending_actions && (
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                  }}
                >
                  <h3 style={{ marginBottom: '1rem' }}>Ações Pendentes</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {dashboard.pending_actions.missing_months && dashboard.pending_actions.missing_months.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                        <span>
                          Faltam holerites dos meses: {dashboard.pending_actions.missing_months.join(', ')}
                        </span>
                      </div>
                    )}
                    {dashboard.pending_actions.low_confidence_docs && dashboard.pending_actions.low_confidence_docs > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                        <span>{dashboard.pending_actions.low_confidence_docs} documentos com baixa confiança</span>
                      </div>
                    )}
                    {dashboard.pending_actions.duplicate_candidates && dashboard.pending_actions.duplicate_candidates > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                        <span>{dashboard.pending_actions.duplicate_candidates} possíveis duplicatas</span>
                      </div>
                    )}
                    {dashboard.pending_actions.documents_awaiting_review && dashboard.pending_actions.documents_awaiting_review > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={18} style={{ color: 'var(--color-info)' }} />
                        <span>{dashboard.pending_actions.documents_awaiting_review} documentos aguardando revisão</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <NavCard icon={Brain} label="Assistente" exerciseId={currentExercise.id} href="/assistente" />
            <NavCard icon={FileText} label="Documentos" exerciseId={currentExercise.id} href="/documentos" />
            <NavCard icon={FileText} label="Rendimentos" exerciseId={currentExercise.id} href="/rendimentos" />
            <NavCard icon={FileText} label="Bens" exerciseId={currentExercise.id} href="/bens" />
            <NavCard icon={FileText} label="Dependentes" exerciseId={currentExercise.id} href="/dependentes" />
            <NavCard icon={FileText} label="Deduções" exerciseId={currentExercise.id} href="/deducoes" />
            <NavCard icon={FileText} label="Alertas" exerciseId={currentExercise.id} href="/alertas" />
          </div>
        </div>
      )}
    </>
  );
}

function NavCard({ icon: Icon, label, exerciseId, href }) {
  const path = `/irpf/${exerciseId}${href}`;
  
  return (
    <Link
      to={path}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.background = 'var(--color-bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.background = 'var(--color-bg-secondary)';
      }}
    >
      <Icon size={32} style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
    </Link>
  );
}

function MetricCard({ icon: Icon, label, value, subtext }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <Icon size={24} style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {value}
      </p>
      {subtext && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
