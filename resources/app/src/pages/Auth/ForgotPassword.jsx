import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCall } from '../../services/api/client';
import { Mail, ArrowLeft } from 'lucide-react';
import logo from '../../assets/mirtilo-logo.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleFocus = () => setIsRevealed(true);
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  const handle = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage('Informe um e-mail válido.');
      return;
    }
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: normalizedEmail }) });
      setMessage('Se o e-mail estiver cadastrado, você receberá instruções de recuperação.');
    } catch (err) {
      setMessage('Não foi possível processar a solicitação. Tente novamente mais tarde.');
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
          aria-labelledby="forgot-brand-title"
        >
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          <div className="login-page__statement">
            <p className="login-page__eyebrow">SEGURANÇA MERTILO</p>
            <h1 id="forgot-brand-title">Seu acesso continua protegido.</h1>
            <p>Recupere o acesso à sua conta com segurança. Vamos orientar você em cada etapa.</p>
          </div>
          <div className="login-page__graphic" aria-hidden="true">
            <div className="login-page__graphic-card">
              <span className="login-page__graphic-label">Proteção</span>
              <span className="login-page__graphic-val">Autenticação Segura</span>
              <div className="login-page__graphic-bars">
                <span style={{ height: '35%' }} />
                <span style={{ height: '60%' }} />
                <span style={{ height: '45%' }} />
                <span style={{ height: '80%' }} />
                <span style={{ height: '100%' }} />
              </div>
            </div>
          </div>
        </section>

        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="forgot-title">
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Recuperação</p>
            <h2 id="forgot-title">Recuperar acesso</h2>
            <p>Informe seu e-mail para receber as instruções de recuperação.</p>
          </div>
          <form onSubmit={handle} aria-label="forgot-form" noValidate>
            <div className="login-field">
              <label htmlFor="forgot-email">E-mail</label>
              <div className="login-field__control">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="forgot-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="SeuEmail@exemplo.com"
                  required
                />
              </div>
            </div>

            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" /> : 'Enviar instruções'}
            </button>
          </form>
          {message && <div className="login-panel__error" role="alert" style={{ marginTop: '20px', background: 'rgba(16,185,129,.15)', borderColor: 'rgba(16,185,129,.3)', color: '#6ee7b7' }}>{message}</div>}
          <p className="login-panel__signup">
            <Link to="/login" viewTransition className="login-panel__back-link">
              <ArrowLeft size={16} /> Voltar para entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
