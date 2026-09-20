import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../services/api/client';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Key } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { setUser, login } = useContext(AuthContext);
  const [email, setEmail] = useState(() => {
    const sessionEmail = sessionStorage.getItem('mertilo_verification_email');
    return sessionEmail || '';
  });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (email) sessionStorage.setItem('mertilo_verification_email', email);
  }, [email]);

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }, [email]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      setMessage('Informe o e-mail e o código para continuar.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await apiCall('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
      localStorage.setItem('mertilo_token', result.token);
      setUser(result.user);
      sessionStorage.removeItem('mertilo_verification_email');
      setVerified(true);
      setMessage('Conta verificada com sucesso. Redirecionando...');
      setTimeout(() => navigate('/'), 700);
    } catch (err) {
      setMessage(err.message || 'Ocorreu um erro ao verificar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Informe o e-mail antes de reenviar o código.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await apiCall('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
      setMessage('Código reenviado com sucesso.');
    } catch (err) {
      setMessage(err.message || 'Erro ao reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container auth-container--single">
        <div className="auth-card auth-card--compact">
          <h2 className="form-title">Verificar e-mail</h2>
          <p className="form-subtitle">Confirme seu cadastro com o código recebido para {maskedEmail || 'o seu e-mail'}.</p>
          <form onSubmit={handleVerify}>
            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required disabled={loading || verified} />
              </div>
            </div>
            <div className="field input-wrapper">
              <label className="input-label">Código</label>
              <div className="input-container">
                <span className="input-icon"><Key size={16} /></span>
                <input className="input with-icon" value={code} onChange={(e) => setCode(e.target.value)} required disabled={loading || verified} />
              </div>
            </div>
            <button className="primary-btn" type="submit" disabled={loading || verified} aria-disabled={loading || verified}>{loading ? <span className="spinner" /> : verified ? 'Verificado' : 'Verificar'}</button>
          </form>
          <button className="secondary-btn" onClick={handleResend} disabled={loading || verified} aria-disabled={loading || verified}>Reenviar código</button>
          {message && <div className="message" role="status">{message}</div>}
        </div>
      </div>
    </div>
  );
}
