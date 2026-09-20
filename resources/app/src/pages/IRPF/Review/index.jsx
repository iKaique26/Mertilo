import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, CheckSquare, RefreshCw } from 'lucide-react';

export function IRPFReview() {
  const { exerciseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (exerciseId) loadAll();
  }, [exerciseId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [vRes, cRes, dRes] = await Promise.all([
        fetch(`/api/irpf/exercises/${exerciseId}/validations`),
        fetch(`/api/irpf/exercises/${exerciseId}/corrections`),
        fetch(`/api/irpf/exercises/${exerciseId}/dashboard`),
      ]);

      if (!vRes.ok) throw new Error('Erro ao carregar validações');
      const vJson = await vRes.json();
      setValidations(vJson || []);

      if (cRes.ok) setCorrections(await cRes.json());
      if (dRes.ok) setDashboard(await dRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/irpf/validations/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error('Falha ao atualizar');
      const updated = await res.json();
      setValidations((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  }

  async function rerun() {
    try {
      setLoading(true);
      const res = await fetch(`/api/irpf/exercises/${exerciseId}/validations/rerun`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao reexecutar');
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filters = ['All', 'Pending', 'Reviewed', 'Resolved', 'Ignored', 'Critical', 'Divergence', 'LowConfidence', 'Duplicates', 'Anomalies'];

  const filtered = validations.filter((v) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return v.status === 'PENDING';
    if (filter === 'Reviewed') return v.status === 'REVIEWED';
    if (filter === 'Resolved') return v.status === 'RESOLVED';
    if (filter === 'Ignored') return v.status === 'IGNORED';
    if (filter === 'Critical') return v.severity === 'critical' || v.severity === 'high';
    if (filter === 'Divergence') return v.type === 'conference' || (v.title && v.title.toLowerCase().includes('diverg'));
    if (filter === 'LowConfidence') return v.title && v.title.toLowerCase().includes('baixa') || v.description && v.description.toLowerCase().includes('baixa');
    if (filter === 'Duplicates') return v.type === 'duplicate';
    if (filter === 'Anomalies') return v.type === 'anomaly' || v.title && v.title.toLowerCase().includes('anomalia');
    return true;
  });

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">IRPF</p>
          <h1>Central de Revisão</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Revisar e auditar inconsistências do exercício</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={rerun} title="Executar nova conferência"><RefreshCw size={16} /> Executar nova conferência</button>
          <Link to={`/irpf/${exerciseId}/assistente`} className="btn">Voltar ao Assistente</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'active' : ''}`}>{f}</button>
            ))}
          </div>

          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h3>Validações ({filtered.length})</h3>
            {loading && <p>Carregando...</p>}
            {!loading && filtered.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>Nenhuma validação encontrada.</p>}
            {!loading && filtered.map((v) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.title}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{v.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Status: {v.status} • Severidade: {v.severity || 'n/a'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn" onClick={() => updateStatus(v.id, 'REVIEWED')}>Marcar como Revisado</button>
                  <button className="btn" onClick={() => updateStatus(v.id, 'RESOLVED')}>Resolver</button>
                  <button className="btn" onClick={() => updateStatus(v.id, 'IGNORED')}>Ignorar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
            <h4>Resumo</h4>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <div>Pendências: {dashboard?.pending_actions?.documents_awaiting_review ?? '—'}</div>
              <div>Divergências: {dashboard?.pending_actions?.duplicate_candidates ?? '—'}</div>
              <div>Baixa confiança: {dashboard?.pending_actions?.low_confidence_docs ?? '—'}</div>
              <div>Meses faltando: {dashboard?.pending_actions?.missing_months_count ?? '—'}</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4>Correções recentes</h4>
            {corrections.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>Nenhuma correção registrada.</p>}
            {corrections.slice(0,5).map((c) => (
              <div key={c.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{c.field_name}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{c.original_value} → {c.corrected_value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
