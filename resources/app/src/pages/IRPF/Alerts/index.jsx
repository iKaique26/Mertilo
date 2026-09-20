/**
 * Página de Alertas e Pendências - IRPF
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function IRPFAlerts() {
  const { exerciseId } = useParams();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const SEVERITY_CONFIG = {
    critical: {
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: 'var(--color-danger)',
      label: 'Crítico',
    },
    error: {
      icon: AlertCircle,
      color: 'var(--color-danger)',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: 'var(--color-danger)',
      label: 'Erro',
    },
    warning: {
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      bgColor: 'rgba(217, 119, 6, 0.1)',
      borderColor: 'var(--color-warning)',
      label: 'Aviso',
    },
    info: {
      icon: Info,
      color: 'var(--color-primary)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'var(--color-primary)',
      label: 'Informação',
    },
  };

  // Carregar alertas
  useEffect(() => {
    if (state.currentExerciseId) {
      loadAlerts();
    }
  }, [state.currentExerciseId]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/irpf/exercises/${state.currentExerciseId}/alerts-pending`
      );
      const data = await response.json();
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(alertId) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/irpf/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Erro ao resolver alerta');
      await loadAlerts();
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

  const alertsBySeverity = {
    critical: alerts.filter((a) => a.severity === 'critical'),
    error: alerts.filter((a) => a.severity === 'error'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Alertas e Pendências</h2>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            CRÍTICO
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            {alertsBySeverity.critical.length}
          </p>
        </div>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            ERRO
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            {alertsBySeverity.error.length}
          </p>
        </div>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            AVISO
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-warning)' }}>
            {alertsBySeverity.warning.length}
          </p>
        </div>
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            INFORMAÇÃO
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            {alertsBySeverity.info.length}
          </p>
        </div>
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <p>Carregando alertas...</p>
      ) : alerts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle size={48} style={{ marginBottom: '1rem', color: 'var(--color-success)' }} />
          <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Nenhum alerta pendente
          </p>
          <p style={{ fontSize: '0.875rem' }}>Sua declaração está em dia!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {['critical', 'error', 'warning', 'info'].map((severity) => {
            const severityAlerts = alertsBySeverity[severity];
            if (severityAlerts.length === 0) return null;

            const config = SEVERITY_CONFIG[severity];
            const Icon = config.icon;

            return (
              <div key={severity}>
                <h4 style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {config.label} ({severityAlerts.length})
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {severityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        background: config.bgColor,
                        border: `1px solid ${config.borderColor}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        display: 'flex',
                        gap: '1rem',
                      }}
                    >
                      <Icon size={24} style={{ color: config.color, flexShrink: 0, marginTop: '0.25rem' }} />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ marginBottom: '0.5rem', color: config.color }}>
                          {alert.message}
                        </h5>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          {getAlertDescription(alert.alert_type)}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        title="Marcar como resolvido"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          color: config.color,
                        }}
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getAlertDescription(alertType) {
  const descriptions = {
    documents_pending_review: 'Revise os documentos para confirmar os dados extraídos',
    income_pending_review: 'Verifique e confirme os rendimentos cadastrados',
    low_confidence_documents: 'Estes documentos foram extraídos com baixa confiança. Revise manualmente.',
    duplicate_documents: 'O mesmo documento foi importado mais de uma vez. Considere remover duplicatas.',
    income_without_document: 'Estes rendimentos não têm documento de suporte. Considere adicionar comprovantes.',
    dependents_missing_cpf: 'Os dependentes precisam ter CPF informado para a declaração ser válida.',
    assets_missing_description: 'Alguns bens não têm descrição completa. Adicione detalhes para melhorar a rastreabilidade.',
    partial_holerites: 'Nem todos os meses de trabalho foram importados. Verifique se há holerites faltantes.',
    inconsistent_values: 'Foram detectados valores que parecem inconsistentes. Revise-os manualmente.',
  };

  return descriptions[alertType] || 'Revise esta informação';
}
