import React, { useEffect, useRef, useState } from 'react';
import { usePrivacy } from '../../context/PrivacyContext';
import { X, Shield, Settings, BarChart3, Target } from 'lucide-react';

const defaultPreferences = {
  functional: false,
  analytics: false,
  marketing: false,
};

export const ConsentPreferencesModal = () => {
  const { showModal, setShowModal, consent, saveConsent, storageNotice } = usePrivacy();
  const firstToggleRef = useRef(null);
  const modalRef = useRef(null);
  const openerRef = useRef(null);
  const [draft, setDraft] = useState({
    ...defaultPreferences,
    functional: Boolean(consent?.preferences?.functional),
  });

  useEffect(() => {
    if (!showModal) return undefined;
    openerRef.current = document.activeElement;
    const nextDraft = {
      ...defaultPreferences,
      functional: Boolean(consent?.preferences?.functional),
    };
    setDraft(nextDraft);
    const focusTimer = window.setTimeout(() => firstToggleRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      openerRef.current?.focus?.();
    };
  }, [showModal, consent]);

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        return;
      }
      if (event.key !== 'Tab') return;
      if (!modalRef.current) return;
      const focusable = [...modalRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, setShowModal]);

  if (!showModal) return null;

  const handleSave = () => {
    const persisted = saveConsent(draft);
    if (!persisted) {
      return;
    }
    setShowModal(false);
  };

  const closeModal = () => {
    setDraft({
      ...defaultPreferences,
      functional: Boolean(consent?.preferences?.functional),
    });
    setShowModal(false);
  };

  return (
    <div className="privacy-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title" aria-describedby="privacy-modal-description">
      <div className="privacy-modal" ref={modalRef}>
        <div className="privacy-modal__header">
          <h2 id="privacy-modal-title">Preferências de Privacidade</h2>
          <button
            className="ghost-button"
            onClick={closeModal}
            aria-label="Fechar modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="privacy-modal__content">
          <p id="privacy-modal-description" className="privacy-modal__intro">
            Gerencie como o Mertilo utiliza o armazenamento do seu navegador. Respeitamos sua privacidade e seguimos as diretrizes da LGPD.
          </p>

          {storageNotice && (
            <p className="privacy-modal__error" role="alert">
              {storageNotice}
            </p>
          )}

          <div className="privacy-option">
            <div className="privacy-option__info">
              <div className="privacy-option__title">
                <Shield size={18} />
                <span>Estritamente Necessários</span>
                <span className="badge badge--required">Sempre Ativo</span>
              </div>
              <p>Essenciais para o funcionamento do site, como autenticação e segurança. Não podem ser desativados.</p>
            </div>
            <div className="privacy-option__toggle">
              <input type="checkbox" checked disabled aria-label="Necessários sempre ativos" />
            </div>
          </div>

          <div className="privacy-option">
            <div className="privacy-option__info">
              <div className="privacy-option__title">
                <Settings size={18} />
                <span>Preferências Funcionais</span>
              </div>
              <p>Permitem que o site lembre suas escolhas, como o período selecionado no dashboard e configurações de interface.</p>
            </div>
            <div className="privacy-option__toggle">
              <label className="switch">
                <input
                  ref={firstToggleRef}
                  type="checkbox"
                  checked={draft.functional}
                  onChange={(event) => setDraft((current) => ({ ...current, functional: event.target.checked }))}
                  aria-label="Ativar preferências funcionais"
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="privacy-option disabled">
            <div className="privacy-option__info">
              <div className="privacy-option__title">
                <BarChart3 size={18} />
                <span>Estatísticas e Analytics</span>
                <span className="badge">Indisponível</span>
              </div>
              <p>O Mertilo não utiliza ferramentas de análise de terceiros nesta versão.</p>
            </div>
            <div className="privacy-option__toggle">
              <label className="switch">
                <input type="checkbox" checked={false} disabled aria-label="Analytics indisponível" />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="privacy-option disabled">
            <div className="privacy-option__info">
              <div className="privacy-option__title">
                <Target size={18} />
                <span>Marketing e Publicidade</span>
                <span className="badge">Indisponível</span>
              </div>
              <p>Não exibimos anúncios nem rastreamos seu comportamento para fins publicitários.</p>
            </div>
            <div className="privacy-option__toggle">
              <label className="switch">
                <input type="checkbox" checked={false} disabled aria-label="Marketing indisponível" />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="privacy-modal__footer">
          <button className="btn btn-secondary" type="button" onClick={closeModal}>Cancelar</button>
          <button className="btn btn-primary" type="button" onClick={handleSave}>Salvar Preferências</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .privacy-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .privacy-modal {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .privacy-modal__header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .privacy-modal__header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .privacy-modal__content {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .privacy-modal__intro {
          margin-bottom: 2rem;
          color: var(--color-text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .privacy-modal__error {
          margin: 0 0 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(220, 38, 127, 0.3);
          background: rgba(220, 38, 127, 0.08);
          color: var(--color-text-primary);
          font-size: 0.86rem;
        }

        .privacy-option {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.25rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .privacy-option:hover:not(.disabled) {
          border-color: var(--color-primary);
          background: rgba(var(--color-primary-rgb), 0.02);
        }

        .privacy-option.disabled {
          opacity: 0.6;
          background: var(--color-bg-tertiary);
        }

        .privacy-option__info {
          flex: 1;
        }

        .privacy-option__title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-text-primary);
        }

        .privacy-option__title svg {
          color: var(--color-primary);
        }

        .privacy-option__info p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
          background: var(--color-border);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge--required {
          background: rgba(var(--color-primary-rgb), 0.1);
          color: var(--color-primary);
        }

        .privacy-modal__footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-border);
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--color-primary);
        }

        input:focus + .slider {
          box-shadow: 0 0 1px var(--color-primary);
        }

        input:checked + .slider:before {
          transform: translateX(18px);
        }
      `}} />
    </div>
  );
};
