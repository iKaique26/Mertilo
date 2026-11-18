/**
 * Página Categories - Gerenciamento de categorias
 * Permite criar, editar, excluir categorias de despesas.
 * Percentual (0‑1) representa a fração do total de despesas atribuída à categoria.
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
  Tag,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const EMPTY_FORM = { nome: '', cor: '#6366F1', percentual: 0 };

/** Normaliza erro da API */
function readError(error, fallback) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  return raw.replace(/^Erro na requisição:\s*/i, '').trim() || fallback;
}

export function Categories() {
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

  const categorias = state.categories || [];

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  function openEdit(cat) {
    setEditing(cat);
    setForm({
      nome: cat.nome ?? '',
      cor: cat.cor ?? '#6366F1',
      percentual: cat.percentual ?? 0,
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
      errors.nome = 'Informe o nome da categoria.';
    } else if (nome.length > 80) {
      errors.nome = 'Use no máximo 80 caracteres.';
    } else {
      const duplicate = categorias.find(
        (c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== (editing?.id ?? '')
      );
      if (duplicate) errors.nome = 'Já existe categoria com esse nome.';
    }

    if (!form.cor) {
      errors.cor = 'Selecione uma cor.';
    }

    const perc = Number(form.percentual);
    if (Number.isNaN(perc) || perc < 0 || perc > 100) {
      errors.percentual = 'Percentual deve estar entre 0 e 100.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (saving) return;
    if (!validate()) return;

    const payload = {
      nome: form.nome.trim(),
      cor: form.cor,
      percentual: Number(form.percentual) / 100,
    };

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const updated = await financialService.updateCategory(editing.id, payload);
        dispatch({ type: 'UPDATE_CATEGORY', payload: updated });
        showToast(`Categoria "${updated.nome}" atualizada.`);
      } else {
        const created = await financialService.createCategory(payload);
        dispatch({ type: 'ADD_CATEGORY', payload: created });
        showToast(`Categoria "${created.nome}" criada.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      setFormError(readError(error, 'Não foi possível salvar a categoria.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting || deleteBusy) return;
    // impede exclusão de categoria em uso (percentual > 0)
    if (deleting.percentual && deleting.percentual > 0) {
      showToast('Categoria em uso não pode ser excluída.', 'error');
      setDeleting(null);
      return;
    }
    setDeleteBusy(true);
    try {
      await financialService.deleteCategory(deleting.id);
      dispatch({ type: 'DELETE_CATEGORY', payload: deleting.id });
      showToast(`Categoria "${deleting.nome}" excluída.`);
      setDeleting(null);
    } catch (error) {
      showToast(readError(error, 'Não foi possível excluir a categoria.'), 'error');
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
        <SkeletonGrid count={2} />
        <div className="panel">
          <SkeletonRow />
        </div>
      </>
    );
  }

  if (state.error) {
    return <ErrorState error={state.error} />;
  }

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
          <p className="eyebrow">Organização</p>
          <h1>Categorias</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Organize suas transações por categoria
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate} disabled={saving}>
          <PlusCircle size={18} strokeWidth={2} />
          Nova categoria
        </button>
      </div>

      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <article className="stat-card accent">
          <div className="stat-header">
            <div className="stat-label">
              <Tag size={18} strokeWidth={2} />
              <span>Total de categorias</span>
            </div>
          </div>
          <strong className="stat-value">{categorias.length}</strong>
          <small>Categorias cadastradas</small>
        </article>
      </section>

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <h3>Suas categorias</h3>
          <span>{categorias.length} item{categorias.length !== 1 ? 'ns' : ''}</span>
        </div>

        {categorias.length > 0 ? (
          <div className="category-list">
            {categorias.map((cat) => (
              <div key={cat.id} className="category-row">
                <div className="category-info">
                  <div className="category-label">
                    <span className="swatch" style={{ backgroundColor: cat.cor || '#8b5cf6' }} title={`Cor: ${cat.cor}`} />
                    <div>
                      <strong>{cat.nome}</strong>
                      <small>{Math.round((cat.percentual || 0) * 100)}% de uso</small>
                    </div>
                  </div>
                </div>
                <div className="category-progress-wrap">
                  <div
                    className="category-progress"
                    style={{
                      width: `${Math.min((cat.percentual || 0) * 100, 100)}%`,
                      backgroundColor: cat.cor || '#8b5cf6',
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round((cat.percentual || 0) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="Editar categoria"
                    aria-label={`Editar categoria ${cat.nome}`}
                    onClick={() => openEdit(cat)}
                  >
                    <Edit2 size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    title="Excluir categoria"
                    aria-label={`Excluir categoria ${cat.nome}`}
                    onClick={() => setDeleting(cat)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma categoria cadastrada"
            message="Crie sua primeira categoria para organizar suas transações"
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <PlusCircle size={18} strokeWidth={2} />
                Criar primeira categoria
              </button>
            }
          />
        )}
      </section>

      <FormModal
        isOpen={formOpen}
        title={editing ? 'Editar categoria' : 'Nova categoria'}
        description={editing ? 'Atualize os dados da categoria.' : 'Crie uma nova categoria de despesas.'}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Salvar alterações' : 'Criar categoria'}
        saving={saving}
        error={formError}
      >
        <div className="form-field">
          <label className="form-label" htmlFor="cat-nome">Nome</label>
          <input
            id="cat-nome"
            className="form-control"
            type="text"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Ex.: Moradia"
            aria-invalid={fieldErrors.nome ? 'true' : 'false'}
            aria-describedby={fieldErrors.nome ? 'cat-nome-error' : undefined}
            maxLength={80}
          />
          {fieldErrors.nome && (
            <small className="form-error" id="cat-nome-error">{fieldErrors.nome}</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="cat-cor">Cor</label>
            <input
              id="cat-cor"
              className="form-control"
              type="color"
              value={form.cor}
              onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
              aria-invalid={fieldErrors.cor ? 'true' : 'false'}
              aria-describedby={fieldErrors.cor ? 'cat-cor-error' : undefined}
            />
            {fieldErrors.cor && (
              <small className="form-error" id="cat-cor-error">{fieldErrors.cor}</small>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="cat-percentual">Meta %</label>
            <input
              id="cat-percentual"
              className="form-control"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.percentual}
              onChange={(e) => setForm((f) => ({ ...f, percentual: e.target.value }))}
              placeholder="0"
              aria-invalid={fieldErrors.percentual ? 'true' : 'false'}
              aria-describedby={fieldErrors.percentual ? 'cat-percentual-error' : undefined}
            />
            {fieldErrors.percentual && (
              <small className="form-error" id="cat-percentual-error">{fieldErrors.percentual}</small>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Excluir categoria"
        message={
          <>
            Tem certeza que deseja excluir a categoria <strong>{deleting?.nome}</strong>? Esta ação não pode ser desfeita.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        busy={deleteBusy}
      />

      {toast && (
        <div className="toast-stack">
          <div className={`toast toast-${toast.type}`} role="status">
            {toast.type === 'error' && <AlertCircle size={16} strokeWidth={2} style={{ verticalAlign: -2 }} />}{' '}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
