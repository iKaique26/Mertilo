import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, AlertTriangle, Info, TrendingUp, Clock } from 'lucide-react';

export function IRPFAssistant() {
  const { exerciseId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (exerciseId) {
      loadAnalysis();
    }
  }, [exerciseId]);

  async function loadAnalysis() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/irpf/exercises/${exerciseId}/assistant`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar análise do assistente');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Analisando seu exercício fiscal...
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div
        style={{
          background: 'var(--color-error)',
          color: 'white',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
        }}
      >
        {error || 'Erro ao carregar análise'}
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'var(--color-success)';
      case 'in_progress':
        return 'var(--color-warning)';
      case 'needs_attention':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />;
      case 'high':
        return <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />;
      case 'medium':
      case 'low':
      default:
        return <Info size={18} style={{ color: 'var(--color-info)' }} />;
    }
  };

  const statusLabel = {
    complete: 'Completo',
    in_progress: 'Em Progresso',
    needs_attention: 'Requer Atenção',
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Fiscal</p>
        <h1>Assistente IRPF</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Análise inteligente de seu exercício fiscal baseada em dados reais
        </p>
      </div>

      {/* Overall Status */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Status Geral</h2>
          <span
            style={{
              background: getStatusColor(analysis.overallStatus),
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {statusLabel[analysis.overallStatus]}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              width: `${analysis.completionPercentage}%`,
              height: '100%',
              background: getStatusColor(analysis.overallStatus),
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Progresso: {analysis.completionPercentage}%
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard label="Documentos Analisados" value={analysis.summary.documentsAnalyzed} />
        <StatCard label="Rendimentos" value={analysis.summary.incomeRecords} />
        <StatCard label="Deduções" value={analysis.summary.deductionRecords} />
        <StatCard label="Dependentes" value={analysis.summary.dependentRecords} />
        <StatCard label="Holerites" value={analysis.summary.holeriteCount} />
        <StatCard label="Informes" value={analysis.summary.incomeStatementsCount} />
      </div>

      {/* Critical Issues */}
      {analysis.criticalIssues.length > 0 && (
        <IssueSection
          title="Questões Críticas"
          issues={analysis.criticalIssues}
          severity="critical"
          expanded={expandedSection === 'critical'}
          onToggle={() => setExpandedSection(expandedSection === 'critical' ? null : 'critical')}
        />
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <IssueSection
          title="Atenção"
          issues={analysis.warnings}
          severity="warning"
          expanded={expandedSection === 'warning'}
          onToggle={() => setExpandedSection(expandedSection === 'warning' ? null : 'warning')}
        />
      )}

      {/* Missing Items */}
      {analysis.missingItems.length > 0 && (
        <IssueSection
          title="Itens Faltando"
          issues={analysis.missingItems}
          severity="info"
          expanded={expandedSection === 'missing'}
          onToggle={() => setExpandedSection(expandedSection === 'missing' ? null : 'missing')}
        />
      )}

      {/* Inconsistencies */}
      {analysis.inconsistencies.length > 0 && (
        <IssueSection
          title="Inconsistências Detectadas"
          issues={analysis.inconsistencies}
          severity="warning"
          expanded={expandedSection === 'inconsistencies'}
          onToggle={() => setExpandedSection(expandedSection === 'inconsistencies' ? null : 'inconsistencies')}
        />
      )}

      {/* Documents to Review */}
      {analysis.documentsToReview.length > 0 && (
        <IssueSection
          title="Documentos que Precisam de Revisão"
          issues={analysis.documentsToReview}
          severity="warning"
          expanded={expandedSection === 'documents'}
          onToggle={() => setExpandedSection(expandedSection === 'documents' ? null : 'documents')}
        />
      )}

      {/* Suggested Actions */}
      {analysis.suggestedActions.length > 0 && (
        <IssueSection
          title="Ações Recomendadas"
          issues={analysis.suggestedActions}
          severity="info"
          expanded={expandedSection === 'actions'}
          onToggle={() => setExpandedSection(expandedSection === 'actions' ? null : 'actions')}
        />
      )}

      {/* Positive Checks */}
      {analysis.positiveChecks.length > 0 && (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
            Tudo Bem
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {analysis.positiveChecks.map((check) => (
              <div
                key={check.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span>{check.title}</span>
                <strong style={{ color: 'var(--color-success)' }}>{check.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues message */}
      {analysis.criticalIssues.length === 0 &&
        analysis.warnings.length === 0 &&
        analysis.missingItems.length === 0 &&
        analysis.inconsistencies.length === 0 &&
        analysis.documentsToReview.length === 0 && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <CheckCircle size={32} style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }} />
            <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>Nenhuma questão identificada</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Seus dados parecem estar consistentes
            </p>
          </div>
        )}

      {/* Validation Summary */}
      {analysis.validation && (
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3>Conferência Fiscal</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {analysis.validation.summary.itemsForReview} itens para revisar — {analysis.validation.summary.conferencesDifferences} divergências detectadas.
          </p>
        </div>
      )}

      {/* Last Analysis Time */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Clock size={16} />
        Análise realizada em: {new Date(analysis.analyzedAt).toLocaleString('pt-BR')}
      </div>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function IssueSection({ title, issues, severity, expanded, onToggle }) {
  const severityColors = {
    critical: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'var(--color-error)',
      text: 'var(--color-error)',
    },
    warning: {
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'var(--color-info)',
      text: 'var(--color-info)',
    },
  };

  const colors = severityColors[severity] || severityColors.info;

  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1rem',
          background: colors.bg,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: colors.text,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        <span>
          {title} ({issues.length})
        </span>
        <span style={{ fontSize: '0.875rem' }}>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '1rem', borderTop: `1px solid ${colors.border}` }}>
          {issues.map((issue) => (
            <div
              key={issue.id}
              style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {getSeverityIcon(issue.severity)}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{issue.title}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {issue.description}
                  </p>
                  {issue.action && (
                    <button
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: colors.text,
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {issue.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical':
      return <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />;
    case 'high':
      return <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
    case 'medium':
    case 'low':
    default:
      return <Info size={18} style={{ color: 'var(--color-info)', flexShrink: 0 }} />;
  }
}
