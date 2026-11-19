/**
 * Página Accounts - Gerenciamento de contas
 *
 * Semântica do modelo (mantida conforme a arquitetura existente):
 * um registro de "conta" é um lançamento de despesa a pagar.
 * `isFixed` distingue despesa recorrente (fixa) de despesa ocasional (variável).
 * O saldo é calculado contra o salário configurado, nunca somando contas como
 * se fossem saldos bancários.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFinancial } from '../../hooks/useFinancial';
import {
  ErrorState,
  EmptyState,
  SkeletonGrid,
  SkeletonRow,
} from '../../components/common';
import { FormModal } from '../../components/common/FormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { financialService } from '../../services/api/financial';
import {
  Wallet,
  PlusCircle,
  Edit2,
  Trash2,
  Repeat,
  TrendingDown,
  Scale,
  AlertCircle,
} from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);

const EMPTY_FORM = { nome: '', valor: '', categoria: 'Outros', isFixed: true };

/** Extrai uma mensagem legível a partir de um erro da API. */
function readError(error, fallback) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  // A API embrulha erros como "Erro na requisição: <mensagem real>".
  const message = raw.replace(/^Erro na requisição:\s*/i, '').trim();
  return message || fallback;
}

export function Accounts() {
  const { state, dispatch } = useFinancial();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [toast, setToast] = useState(null);

  const contas = state.accounts || [];
  const categorias = state.categories || [];

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------------------------------------------------------------- */
  /* Métricas                                                          */
  /* ---------------------------------------------------------------- */

  const metrics = useMemo(() => {
    const total = contas.reduce((sum, acc) => sum + (Number(acc.valor) || 0), 0);
    const fixas = contas
      .filter((c) => c.isFixed)
      .reduce((sum, acc) => sum + (Number(acc.valor) || 0), 0);
    const variaveis = total - fixas;
    const renda = Number(state.summary?.receitaTotal ?? state.salario) || 0;
    return { total, fixas, variaveis, renda, saldo: renda - total };
  }, [contas, state.salario, state.summary]);

  /* ---------------------------------------------------------------- */
  /* Ações                                                              */
  /* ---------------------------------------------------------------- */

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(account) {
    setEditing(account);
    setForm({
      nome: account.nome ?? '',
      valor: String(account.valor ?? ''),
      categoria: account.categoria || 'Outros',
      isFixed: Boolean(account.isFixed),
    });
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFormError('');
    setFieldErrors({});
  }

  function validate() {
    const errors = {};
    const nome = form.nome.trim();
    if (!nome) {
      errors.nome = 'Informe o nome da conta.';
    } else if (nome.length > 80) {
      errors.nome = 'Use no máximo 80 caracteres.';
    }

    if (form.valor === '' || form.valor === null || form.valor === undefined) {
      errors.valor = 'Informe o valor da conta.';
    } else {
      const valor = Number(form.valor);
      if (!Number.isFinite(valor)) {
        errors.valor = 'O valor deve ser um número.';
      } else if (valor < 0) {
        errors.valor = 'O valor não pode ser negativo.';
      }
    }

    if (!form.categoria || !form.categoria.trim()) {
      errors.categoria = 'Informe a categoria da conta.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (saving) return;
    if (!validate()) return;

    const payload = {
      nome: form.nome.trim(),
      valor: Number(form.valor),
      categoria: form.categoria.trim(),
      isFixed: Boolean(form.isFixed),
    };

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const updated = await financialService.updateAccount(editing.id, payload);
        dispatch({ type: 'UPDATE_ACCOUNT', payload: updated });
        showToast(`Conta "${updated.nome}" atualizada com sucesso.`);
      } else {
        const created = await financialService.createAccount(payload);
        dispatch({ type: 'ADD_ACCOUNT', payload: created });
        showToast(`Conta "${created.nome}" criada com sucesso.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      setFormError(readError(error, 'Não foi possível salvar a conta.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await financialService.deleteAccount(deleting.id);
      dispatch({ type: 'DELETE_ACCOUNT', payload: deleting.id });
      showToast(`Conta "${deleting.nome}" excluída.`);
      setDeleting(null);
    } catch (error) {
      showToast(readError(error, 'Não foi possível excluir a conta.'), 'error');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                              */
  /* ---------------------------------------------------------------- */

  if (state.loading) {
    return (
      <>
        <SkeletonGrid count={3} />
        <div className="panel">
          <SkeletonRow />
        </div>
      </>
    );
  }

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

  const categoriaOptions = Array.from(
    new Set([
      ...categorias.map((c) => c.nome).filter(Boolean),
      ...contas.map((c) => c.categoria).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <>
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="eyebrow">Gerenciamento</p>
          <h1>Suas contas</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Registre suas contas a pagar e acompanhe o saldo do mês
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate} disabled={saving}>
          <PlusCircle size={18} strokeWidth={2} />
          Nova conta
        </button>
      </div>

      <section
        className="stats-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Wallet size={18} strokeWidth={2} />
              <span>Total em contas</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(metrics.total)}</strong>
          <small>
            {contas.length} conta{contas.length !== 1 ? 's' : ''} a pagar
          </small>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-label">
              <Repeat size={18} strokeWidth={2} />
              <span>Despesas fixas</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(metrics.fixas)}</strong>
          <small>{contas.filter((c) => c.isFixed).length} recorrente(s)</small>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <div className="stat-label">
              <TrendingDown size={18} strokeWidth={2} />
              <span>Despesas variáveis</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(metrics.variaveis)}</strong>
          <small>{contas.filter((c) => !c.isFixed).length} eventual(is)</small>
        </article>

        <article className={`stat-card ${metrics.saldo < 0 ? 'negative' : 'positive'}`}>
          <div className="stat-header">
            <div className="stat-label">
              <Scale size={18} strokeWidth={2} />
              <span>Saldo do mês</span>
            </div>
          </div>
          <strong className="stat-value">{formatCurrency(metrics.saldo)}</strong>
          <small>
            {metrics.renda > 0
              ? `Renda de ${formatCurrency(metrics.renda)}`
              : 'Defina sua renda para calcular o saldo'}
          </small>
        </article>
      </section>

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <h3>Contas registradas</h3>
          <span>
            {contas.length} item{contas.length !== 1 ? 'ns' : ''}
          </span>
        </div>

        {contas.length > 0 ? (
          <div className="account-list">
            {contas.map((account) => (
              <div key={account.id} className="account-row">
                <div style={{ minWidth: 0 }}>
                  <strong>{account.nome}</strong>
                  <small>{account.categoria}</small>
                </div>
                <div className="account-meta">
                  <span className={`pill ${account.isFixed ? 'active' : ''}`}>
                    {account.isFixed ? 'Fixa' : 'Variável'}
                  </span>
                  <strong>{formatCurrency(account.valor)}</strong>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="Editar conta"
                      aria-label={`Editar conta ${account.nome}`}
                      onClick={() => openEdit(account)}
                    >
                      <Edit2 size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      title="Excluir conta"
                      aria-label={`Excluir conta ${account.nome}`}
                      onClick={() => setDeleting(account)}
                      disabled={deleteBusy}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma conta registrada"
            message="Crie sua primeira conta a pagar para acompanhar o saldo do mês"
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <PlusCircle size={18} strokeWidth={2} />
                Criar primeira conta
              </button>
            }
          />
        )}
      </section>

      <FormModal
        isOpen={formOpen}
        title={editing ? 'Editar conta' : 'Nova conta'}
        description={
          editing
            ? 'Atualize os dados desta conta a pagar.'
            : 'Registre uma conta a pagar fixa ou variável.'
        }
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Salvar alterações' : 'Criar conta'}
        saving={saving}
        error={formError}
      >
        <div className="form-field">
          <label className="form-label" htmlFor="account-nome">
            Nome da conta
          </label>
          <input
            id="account-nome"
            className="form-control"
            type="text"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Ex.: Aluguel"
            aria-invalid={fieldErrors.nome ? 'true' : 'false'}
            aria-describedby={fieldErrors.nome ? 'account-nome-error' : undefined}
            maxLength={80}
          />
          {fieldErrors.nome && (
            <small className="form-error" id="account-nome-error">
              {fieldErrors.nome}
            </small>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="account-valor">
              Valor (R$)
            </label>
            <input
              id="account-valor"
              className="form-control"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              placeholder="0,00"
              aria-invalid={fieldErrors.valor ? 'true' : 'false'}
              aria-describedby={fieldErrors.valor ? 'account-valor-error' : undefined}
            />
            {fieldErrors.valor && (
              <small className="form-error" id="account-valor-error">
                {fieldErrors.valor}
              </small>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="account-categoria">
              Categoria
            </label>
            <input
              id="account-categoria"
              className="form-control"
              type="text"
              list="account-categoria-options"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="Ex.: Moradia"
              aria-invalid={fieldErrors.categoria ? 'true' : 'false'}
              aria-describedby={fieldErrors.categoria ? 'account-categoria-error' : undefined}
              maxLength={60}
            />
            <datalist id="account-categoria-options">
              {categoriaOptions.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>
            {fieldErrors.categoria && (
              <small className="form-error" id="account-categoria-error">
                {fieldErrors.categoria}
              </small>
            )}
          </div>
        </div>

        <fieldset className="form-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="form-label" style={{ padding: 0, marginBottom: '0.4rem' }}>
            Tipo de despesa
          </legend>
          <div className="form-radio-group">
            <label className="form-radio-option">
              <input
                type="radio"
                name="account-is-fixed"
                value="fixed"
                checked={form.isFixed}
                onChange={() => setForm((f) => ({ ...f, isFixed: true }))}
              />
              <Repeat size={14} strokeWidth={2} />
              Fixa (recorrente)
            </label>
            <label className="form-radio-option">
              <input
                type="radio"
                name="account-is-fixed"
                value="variable"
                checked={!form.isFixed}
                onChange={() => setForm((f) => ({ ...f, isFixed: false }))}
              />
              <TrendingDown size={14} strokeWidth={2} />
              Variável (eventual)
            </label>
          </div>
        </fieldset>
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Excluir conta"
        message={
          <>
            Tem certeza que deseja excluir a conta <strong>{deleting?.nome}</strong> no valor de{' '}
            <strong>{formatCurrency(deleting?.valor)}</strong>? Esta ação não pode ser desfeita.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deleteBusy}
      />

      {toast && (
        <div className="toast-stack">
          <div className={`toast toast-${toast.type}`} role="status">
            {toast.type === 'error' && (
              <AlertCircle size={16} strokeWidth={2} style={{ verticalAlign: -2 }} />
            )}{' '}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
