import React from 'react';
import { usePrivacy } from '../../context/PrivacyContext';
import { ShieldCheck, Settings2 } from 'lucide-react';

export const ConsentBanner = () => {
  const { showBanner, acceptAll, rejectAll, setShowModal } = usePrivacy();

  if (!showBanner) return null;

  return (
    <div className="consent-banner" role="region" aria-label="Privacidade e Cookies">
      <div className="consent-banner__content">
        <div className="consent-banner__info">
          <ShieldCheck className="consent-banner__icon" size={24} />
          <div className="consent-banner__text">
            <p>
              Utilizamos armazenamento local para melhorar sua experiência e garantir a segurança.
              Algumas tecnologias são essenciais para o funcionamento do Mertilo.
            </p>
          </div>
        </div>
        <div className="consent-banner__actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowModal(true)}
            aria-label="Personalizar preferências de privacidade"
          >
            <Settings2 size={16} />
            <span>Personalizar</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={rejectAll}
          >
            Recusar opcionais
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={acceptAll}
          >
            Aceitar todos
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .consent-banner {
          position: fixed;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          padding: 1.25rem;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .consent-banner__content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .consent-banner__info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 300px;
        }

        .consent-banner__icon {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .consent-banner__text p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-text-primary);
          line-height: 1.5;
        }

        .consent-banner__actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .consent-banner {
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            padding: 1.5rem;
          }
          .consent-banner__content {
            flex-direction: column;
            align-items: stretch;
          }
          .consent-banner__actions {
            flex-direction: column;
          }
          .consent-banner__actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}} />
    </div>
  );
};
