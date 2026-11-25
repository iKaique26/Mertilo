import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateCsvContent, downloadCsvFile } from '../../utils/csvExport';

/**
 * Painel de exportação de transações importadas e histórico mensal em CSV.
 * @param {{ importedTransactions?: Array<Record<string, any>>, history?: Array<Record<string, any>>, accounts?: Array<Record<string, any>> }} props
 */
export function ExportPanel({ importedTransactions = [], history = [], accounts = [] }) {
    const [exportScope, setExportScope] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [delimiter, setDelimiter] = useState(';');
    const [statusMessage, setStatusMessage] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Anos disponíveis para filtro a partir das transações
    const availableYears = Array.from(
        new Set(
            [
                ...importedTransactions.map((tx) => tx.date ? String(tx.date).slice(0, 4) : null),
                ...history.map((h) => h.mes ? String(h.mes).slice(0, 4) : null),
            ].filter(Boolean)
        )
    ).sort().reverse();

    // Calcula contagem e dados para exportação
    function getPreparedRows() {
        const rows = [];

        const filterByYear = (dateStr) => {
            if (selectedYear === 'all') return true;
            return String(dateStr).startsWith(selectedYear);
        };

        if (exportScope === 'all' || exportScope === 'imported') {
            const filteredImported = importedTransactions.filter((tx) => filterByYear(tx.date || tx.importedAt));
            filteredImported.forEach((tx) => {
                rows.push([
                    tx.date || '',
                    tx.description || '',
                    tx.type || (tx.value >= 0 ? 'entrada' : 'saída'),
                    Number(tx.value) || 0,
                    tx.category || 'Geral',
                    tx.subcategory || '',
                    tx.account || 'Importado',
                    'Transação Extrato',
                ]);
            });
        }

        if (exportScope === 'all' || exportScope === 'history') {
            const filteredHistory = history.filter((h) => filterByYear(h.mes));
            filteredHistory.forEach((h) => {
                rows.push([
                    h.mes ? `${h.mes}-01` : '',
                    `Fechamento mensal ${h.mes || ''}`,
                    'fechamento',
                    Number(h.saldoDisponivel) || 0,
                    'Histórico Mensal',
                    '',
                    'Consolidado',
                    'Fechamento Mensal',
                ]);
            });
        }

        const headers = [
            'Data',
            'Descrição',
            'Tipo',
            'Valor (R$)',
            'Categoria',
            'Subcategoria',
            'Conta',
            'Origem',
        ];

        return { headers, rows, count: rows.length };
    }

    const { count } = getPreparedRows();

    async function handleExport() {
        setStatusMessage(null);
        setIsExporting(true);

        try {
            const { headers, rows } = getPreparedRows();

            if (rows.length === 0) {
                setStatusMessage({
                    type: 'error',
                    text: 'Nenhum registro encontrado para os filtros e período selecionados.',
                });
                setIsExporting(false);
                return;
            }

            const csvContent = generateCsvContent(headers, rows, delimiter);
            const timestamp = new Date().toISOString().slice(0, 10);
            const scopeLabel = exportScope === 'imported' ? 'transacoes_importadas' : exportScope === 'history' ? 'historico_mensal' : 'extrato_completo';
            const yearLabel = selectedYear !== 'all' ? `_${selectedYear}` : '';
            const filename = `mertilo_${scopeLabel}${yearLabel}_${timestamp}.csv`;

            const success = downloadCsvFile(csvContent, filename);

            if (success) {
                setStatusMessage({
                    type: 'success',
                    text: `Arquivo "${filename}" exportado com sucesso (${rows.length} registros).`,
                });
            } else {
                setStatusMessage({
                    type: 'error',
                    text: 'Não foi possível acionar o download do arquivo no navegador.',
                });
            }
         } catch (err) {
            setStatusMessage({
                type: 'error',
                text: err?.message || 'Falha ao processar a exportação.',
            });
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="panel" style={{ display: 'grid', gap: '1.25rem' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileSpreadsheet size={20} color="var(--color-primary)" />
                    <h3 style={{ margin: 0 }}>Exportação de Dados em CSV</h3>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {count} registro(s) no escopo selecionado
                </span>
            </div>

            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Exporte suas movimentações e históricos consolidados em formato CSV padrão RFC 4180 com sanitização automática contra fórmulas e proteção de dados.
            </p>

            {/* Grid de opções e filtros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Escopo */}
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <label htmlFor="exportScope" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        Conjunto de dados
                    </label>
                    <select
                        id="exportScope"
                        className="input"
                        aria-label="Conjunto de dados para exportação"
                        value={exportScope}
                        onChange={(e) => setExportScope(e.target.value)}
                        disabled={isExporting}
                    >
                        <option value="all">Todas as movimentações e fechamentos</option>
                        <option value="imported">Apenas transações importadas ({importedTransactions.length})</option>
                        <option value="history">Apenas histórico mensal ({history.length})</option>
                    </select>
                </div>

                {/* Ano / Período */}
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <label htmlFor="exportYear" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        Período
                    </label>
                    <select
                        id="exportYear"
                        className="input"
                        aria-label="Filtro de período para exportação"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={isExporting}
                    >
                        <option value="all">Todo o período histórico</option>
                        {availableYears.map((year) => (
                            <option key={year} value={year}>Ano {year}</option>
                        ))}
                    </select>
                </div>

                {/* Delimitador */}
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <label htmlFor="exportDelimiter" style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        Separador de colunas
                    </label>
                    <select
                        id="exportDelimiter"
                        className="input"
                        aria-label="Separador de colunas"
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value)}
                        disabled={isExporting}
                    >
                        <option value=";">Ponto e vírgula (;) - Padrão Excel Brasil</option>
                        <option value=",">Vírgula (,) - Padrão internacional</option>
                    </select>
                </div>
            </div>

            {/* Status da Exportação */}
            {statusMessage && (
                <div
                    role={statusMessage.type === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                    className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: statusMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                        fontSize: '0.9rem'
                    }}
                >
                    {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Botão de Exportação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={isExporting || count === 0}
                    aria-label="Gerar e baixar arquivo CSV"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={16} />
                    {isExporting ? 'Gerando arquivo...' : `Exportar ${count} registro(s)`}
                </button>
                {count === 0 && !isExporting && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }} role="status" aria-live="polite">
                        Nenhum registro disponível para exportação no escopo e período selecionados.
                    </div>
                )}
            </div>
        </div>
    );
}
