import React, { useState } from 'react';
import { apiCall } from '../../services/api/client';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setMessage('Se o e-mail estiver cadastrado, você receberá instruções de recuperação.');
    } catch (err) {
      setMessage(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container auth-container--single">
        <div className="auth-card auth-card--compact">
          <h2 className="form-title">Recuperar senha</h2>
          <p className="form-subtitle">Informe seu e-mail para receber as instruções.</p>
          <form onSubmit={handle}>
            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
            </div>
            <button className="primary-btn" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : 'Enviar'}</button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
}
