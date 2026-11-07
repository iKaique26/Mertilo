import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { financialImportService } from '../../services/api/importacao';
import { financialService } from '../../services/api/financial';
import { useFinancial } from '../../hooks/useFinancial';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const previewFallback = {
  headers: [],
  suggestedMapping: {},
  summary: { rows: 0, entries: 0, exits: 0, invalid: 0, duplicates: 0, toReview: 0, willImport: 0 },
  records: [],
  errors: [],
};

export function ImportacaoFinanceira() {
  const fileInputRef = useRef(null);
  const { state, dispatch } = useFinancial();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(previewFallback);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [mapping, setMapping] = useState({});
  const [lastCsvText, setLastCsvText] = useState('');
  const [undoingImportId, setUndoingImportId] = useState(null);
  const [removingTransactionId, setRemovingTransactionId] = useState(null);
  const categories = state.categories || [];

  async function refreshPreview(nextMapping = mapping) {
    if (!lastCsvText) return;
    setLoading(true);
    setError('');
    try {
      const result = await financialImportService.previewCsv(lastCsvText, nextMapping, fileName || 'importacao.csv');
      setPreview(result);
      setMapping(result.suggestedMapping || nextMapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao analisar o CSV.');
      setPreview(previewFallback);
    } finally {
      setLoading(false);
    }
  }

  async function readAndPreviewFile(file) {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError('');
    try {
      const text = await file.text();
      setLastCsvText(text);
      const result = await financialImportService.previewCsv(text, mapping, file.name);
      setPreview(result);
      setMapping(result.suggestedMapping || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao analisar o CSV.');
      setPreview(previewFallback);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview.records || preview.records.length === 0) {
      setError('Nenhuma transação válida para confirmar.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const result = await financialImportService.confirmImport(preview.records, fileName || 'importacao.csv');
      const refreshed = await financialService.getAllFinancialData();
      dispatch({ type: 'SET_DATA', payload: refreshed });
      setPreview((current) => ({ ...current, summary: { ...current.summary, willImport: result.importedCount } }));
      setError('');
      window.alert(`Importação concluída: ${result.importedCount} registros gravados.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar importação.');
    } finally {
      setUploading(false);
    }
  }

  async function handleUndoImport(importId) {
    if (!importId || !window.confirm('Deseja desfazer esta importação? Isso remove as transações associadas do histórico atual.')) {
      return;
    }

    setUndoingImportId(importId);
    setError('');
    try {
      const result = await financialImportService.undoImport(importId);
      const refreshed = await financialService.getAllFinancialData();
      dispatch({ type: 'SET_DATA', payload: refreshed });
      window.alert(`Importação desfeita: ${result.revertedCount ?? 0} transações removidas.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desfazer a importação.');
    } finally {
      setUndoingImportId(null);
    }
  }

  async function handleRemoveTransaction(transactionId) {
    if (!transactionId || !window.confirm('Deseja remover esta transação importada do histórico atual?')) {
      return;
    }

    setRemovingTransactionId(transactionId);
    setError('');
    try {
      const result = await financialImportService.deleteImportedTransaction(transactionId);
      const refreshed = await financialService.getAllFinancialData();
      dispatch({ type: 'SET_DATA', payload: refreshed });
      window.alert(result.removed ? 'Transação removida com sucesso.' : 'Nenhuma transação foi removida.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover a transação importada.');
    } finally {
      setRemovingTransactionId(null);
    }
  }

  const summaryCards = [
    { label: 'Total de linhas', value: preview.summary.rows },
    { label: 'Entradas', value: preview.summary.entries, accent: 'positive' },
    { label: 'Saídas', value: preview.summary.exits, accent: 'danger' },
    { label: 'Possíveis duplicatas', value: preview.summary.duplicates },
    { label: 'Para revisão', value: preview.summary.toReview },
    { label: 'Prontos para importar', value: preview.summary.willImport },
  ];

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <p className="eyebrow">Importação</p>
        <h1>Importação Financeira</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Importe extratos bancários em CSV e veja antes de gravar as movimentações no Mertilo.
        </p>
      </div>

      <div className="panel" onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file) readAndPreviewFile(file); }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem', border: dragActive ? '2px dashed var(--color-primary)' : '2px dashed rgba(148, 163, 184, 0.5)', borderRadius: '12px' }}>
          <UploadCloud size={36} color="var(--color-primary)" />
          <div style={{ textAlign: 'center' }}>
            <strong>{fileName || 'Arraste um CSV ou selecione um arquivo'}</strong>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Suporta delimitadores como vírgula, ponto e vírgula e tabulação. Também reconhece valores em BRL.
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) readAndPreviewFile(file); }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading}>{loading ? 'Analisando...' : 'Selecionar arquivo'}</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {preview.headers.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Mapeamento de colunas</h3>
            <span>{preview.headers.length} colunas detectadas</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              ['date', 'Data'],
              ['description', 'Descrição'],
              ['value', 'Valor'],
              ['debit', 'Débito'],
              ['credit', 'Crédito'],
              ['account', 'Conta'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                {label}
                <select
                  className="input"
                  value={mapping[key] || ''}
                  onChange={(event) => {
                    const next = { ...mapping, [key]: event.target.value || undefined };
                    setMapping(next);
                    if (fileName && lastCsvText) {
                      refreshPreview(next);
                    }
                  }}
                >
                  <option value="">Auto</option>
                  {preview.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      {preview.headers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          {summaryCards.map((card) => (
            <div key={card.label} className="mini-card" style={{ minHeight: '110px' }}>
              <span>{card.label}</span>
              <strong style={{ color: card.accent === 'positive' ? 'var(--color-success)' : card.accent === 'danger' ? 'var(--color-danger)' : 'inherit', fontSize: '1.65rem' }}>{card.value}</strong>
            </div>
          ))}
        </div>
      )}

      {state.importHistory?.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>Histórico de importações</h3>
            <span>{state.importHistory.length} lote(s)</span>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {state.importHistory.slice(0, 5).map((batch) => (
              <div key={batch.id} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{batch.fileName}</strong>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    {new Date(batch.importedAt).toLocaleString('pt-BR')} · {batch.transactions?.length || 0} transações
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleUndoImport(batch.id)}
                  disabled={undoingImportId === batch.id}
                >
                  {undoingImportId === batch.id ? 'Desfazendo...' : 'Desfazer importação'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {state.importedTransactions?.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>Transações importadas</h3>
            <span>{state.importedTransactions.length} registros</span>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {state.importedTransactions.slice(0, 8).map((transaction) => (
              <div key={transaction.id} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{transaction.description}</strong>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    {transaction.date} · {transaction.category}/{transaction.subcategory} · {formatCurrency(transaction.value)}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRemoveTransaction(transaction.id)}
                  disabled={removingTransactionId === transaction.id}
                >
                  {removingTransactionId === transaction.id ? 'Removendo...' : 'Excluir'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && <div className="panel">Carregando prévia do CSV…</div>}

      {preview.records.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>Prévia das movimentações</h3>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || uploading}>{uploading ? 'Importando...' : 'Confirmar importação'}</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Descrição</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Valor</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Categoria</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.records.slice(0, 12).map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid rgba(148,163,184,0.18)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{item.date}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{item.description}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: item.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatCurrency(item.value)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <select className="input" value={item.category || ''} onChange={(event) => setPreview((current) => ({ ...current, records: current.records.map((record) => record.id === item.id ? { ...record, category: event.target.value } : record) }))} disabled={loading || uploading}>
                        <option value="">Sem categoria</option>
                        {categories.map((category) => <option key={typeof category === 'string' ? category : category.name} value={typeof category === 'string' ? category : category.name}>{typeof category === 'string' ? category : category.name}</option>)}
                      </select>
                      <small>{item.subcategory}</small>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {item.potentialDuplicate ? <span style={{ color: '#f59e0b' }}>Duplicata</span> : item.manualReview ? <span style={{ color: '#f59e0b' }}>Revisão</span> : <span style={{ color: 'var(--color-success)' }}>Pronto</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {preview.errors && preview.errors.length > 0 && (
        <div className="panel">
          <div className="panel-header"><h3>Erros detectados</h3></div>
          <ul>
            {preview.errors.slice(0, 10).map((item, index) => (
              <li key={`${item.line}-${index}`} style={{ marginBottom: '0.45rem' }}>Linha {item.line}: {item.message}</li>
            ))}
          </ul>
        </div>
      )}

      {!preview.records.length && !loading && !error && (
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <FileSpreadsheet size={20} />
          <span>Nenhum arquivo carregado. Selecione um extrato para iniciar a análise.</span>
        </div>
      )}
    </div>
  );
}
