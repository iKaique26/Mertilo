import React, { useState } from 'react';
import { apiCall } from '../../services/api/client';
import { Mail, Key, Lock } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
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
    try {
      await apiCall('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) });
      setMessage('Senha alterada com sucesso. Faça login.');
    } catch (err) {
      setMessage(err.message || 'Ocorreu um erro ao alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container auth-container--single">
        <div className="auth-card auth-card--compact">
          <h2 className="form-title">Redefinir senha</h2>
          <p className="form-subtitle">Crie uma nova senha para acessar sua conta.</p>
          <form onSubmit={handle}>
            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Token</label>
              <div className="input-container">
                <span className="input-icon"><Key size={16} /></span>
                <input className="input with-icon" value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Nova senha</label>
              <div className="input-container">
                <span className="input-icon"><Lock size={16} /></span>
                <input className="input with-icon" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Confirmar senha</label>
              <div className="input-container">
                <span className="input-icon"><Lock size={16} /></span>
                <input className="input with-icon" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
              </div>
            </div>

            <button className="primary-btn" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : 'Alterar senha'}</button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
}
