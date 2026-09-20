import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      sessionStorage.setItem('mertilo_verification_email', email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-screen">
        <div className="auth-container auth-container--single">
          <div className="auth-card auth-card--compact">
            <h2>Registro realizado</h2>
            <p>Verifique seu e-mail para o código de confirmação.</p>
            <Link to="/verify-email">Ir para verificação</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-identity" aria-label="identidade Mertilo">
          <div className="brand">
            <div className="brand-mark">M</div>
            <div>
              <span className="brand-label">Mertilo</span>
              <h1>Mertilo</h1>
            </div>
          </div>
          <p>Gestão financeira pessoal</p>
        </div>

        <div className="auth-card auth-card--tall">
          <h2 className="form-title">Criar conta</h2>
          <p className="form-subtitle">Crie sua conta Mertilo</p>
          <form onSubmit={handleSubmit} aria-label="register-form">
            <div className="field input-wrapper">
              <label className="input-label">Nome</label>
              <div className="input-container">
                <span className="input-icon"><User size={16} /></span>
                <input className="input with-icon" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Senha</label>
              <div className="input-container">
                <span className="input-icon"><Lock size={16} /></span>
                <input className="input with-icon" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Confirmar senha</label>
              <div className="input-container">
                <span className="input-icon"><Lock size={16} /></span>
                <input className="input with-icon" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
              </div>
            </div>

            {error && <div className="error" role="alert">{error}</div>}

            <button className="primary-btn" type="submit" disabled={loading} aria-disabled={loading}>{loading ? <span className="spinner" /> : 'Criar conta'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
