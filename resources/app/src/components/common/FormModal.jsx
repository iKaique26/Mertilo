/**
 * Modal de formulário reutilizável para Contas e Categorias.
 * Mantém foco dentro do modal, fecha com Esc e devolve o foco ao fechar.
 */

import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FormModal({
    isOpen,
    title,
    description,
    onClose,
    onSubmit,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    saving = false,
    error,
    children,
}) {
    const dialogRef = useRef(null);
    const previouslyFocused = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        previouslyFocused.current = document.activeElement;
        const node = dialogRef.current;
        const first = node?.querySelector(FOCUSABLE);
        first?.focus();

        function handleKeyDown(event) {
            if (event.key === 'Escape' && !saving) {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab' || !node) return;

            const focusables = Array.from(node.querySelectorAll(FOCUSABLE));
            if (focusables.length === 0) return;
            const firstEl = focusables[0];
            const lastEl = focusables[focusables.length - 1];

            if (event.shiftKey && document.activeElement === firstEl) {
                event.preventDefault();
                lastEl.focus();
            } else if (!event.shiftKey && document.activeElement === lastEl) {
                event.preventDefault();
                firstEl.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused.current?.focus?.();
        };
    }, [isOpen, onClose, saving]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) onClose();
            }}
        >
            <div
                className="modal modal-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="form-modal-title"
                ref={dialogRef}
            >
                <div className="modal-header">
                    <h2 id="form-modal-title">{title}</h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fechar"
                        disabled={saving}
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                >
                    <div className="modal-body">
                        {description && (
                            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 1rem' }}>
                                {description}
                            </p>
                        )}

                        {error && (
                            <div className="form-alert" role="alert" style={{ marginBottom: '1rem' }}>
                                <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-grid">{children}</div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary btn-md" onClick={onClose} disabled={saving}>
                            {cancelLabel}
                        </button>
                        <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
                            {saving ? 'Salvando...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
