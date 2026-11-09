import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiCall } from '../../services/api/client';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../assets/mirtilo-logo.svg';

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('validating'); // validating, valid, expired, invalid, success
  const [isRevealed, setIsRevealed] = useState(false);

  const handleFocus = () => setIsRevealed(true);
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    const validate = async () => {
      try {
        await apiCall('/auth/validate-reset-token', { method: 'POST', body: JSON.stringify({ token }) });
        setStatus('valid');
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('expirado') || msg.includes('expired')) setStatus('expired');
        else setStatus('invalid');
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setMessage('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('A senha deve ter ao menos 8 caracteres');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await apiCall('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      setStatus('success');
    } catch (err) {
      setMessage(err.message || 'Ocorreu um erro ao alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        <section
          className={`login-page__identity ${isRevealed ? 'login-page__identity--revealed' : ''}`}
          aria-hidden={!isRevealed}
          aria-labelledby="reset-brand-title"
        >
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          <div className="login-page__statement">
            <p className="login-page__eyebrow">SEGURANÇA MERTILO</p>
            <h1 id="reset-brand-title">Crie sua nova senha.</h1>
            <p>Escolha uma senha segura para proteger sua conta Mertilo.</p>
          </div>
        </section>

        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="reset-title">
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Redefinição</p>
            <h2 id="reset-title">Nova senha</h2>
          </div>
          
          {status === 'validating' && (
            <div className="login-panel__validating">
              <span className="login-panel__spinner" />
              <p>Validando link...</p>
            </div>
          )}
          {status === 'valid' && (
            <form onSubmit={handleSubmit} aria-label="reset-form" noValidate>
              <div className="login-field">
                <label htmlFor="new-password">Nova senha</label>
                <div className="login-field__control">
                  <Lock size={18} aria-hidden="true" />
                  <input
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="confirm-password">Confirmar senha</label>
                <div className="login-field__control">
                  <Lock size={18} aria-hidden="true" />
                  <input
                    id="confirm-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button className="login-panel__submit" type="submit" disabled={loading}>
                {loading ? <span className="login-panel__spinner" /> : 'Redefinir senha'}
              </button>
              {message && <div className="login-panel__error" role="alert">{message}</div>}
            </form>
          )}
          {status === 'success' && (
            <div className="login-panel__success">
              <CheckCircle size={48} style={{ color: '#22c55e' }} />
              <p>Senha alterada com sucesso.</p>
              <Link to="/login" className="login-panel__back-link">Ir para login</Link>
            </div>
          )}
          {(status === 'expired' || status === 'invalid') && (
            <div className="login-panel__error">
              <AlertCircle size={48} style={{ color: '#ef4444' }} />
              <p>{status === 'expired' ? 'Link expirado.' : 'Link inválido.'}</p>
              <Link to="/forgot-password" className="login-panel__back-link">Tentar novamente</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
