import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // basic client-side validation
      if (!email || !email.includes('@')) throw new Error('E-mail inválido');
      if (!password || password.length < 8) throw new Error('Senha inválida');
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao logar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="auth-card">
          <h2 className="form-title">Entrar</h2>
          <p className="form-subtitle">Acesse sua conta Mertilo</p>
          <form onSubmit={handleSubmit} aria-label="login-form">
            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" aria-required="true" />
              </div>
            </div>

            <div className="field input-wrapper">
              <label className="input-label">Senha</label>
              <div className="input-container">
                <span className="input-icon"><Lock size={16} /></span>
                <input className="input with-icon" value={password} onChange={(e) => setPassword(e.target.value)} type="password" aria-required="true" />
              </div>
            </div>

            {error && <div className="error" role="alert">{error}</div>}

            <button className="primary-btn" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="spinner" aria-hidden="true"></span> : 'Entrar'}
            </button>
          </form>
          <div className="links">
            <Link to="/register">Criar conta</Link>
            <Link to="/forgot-password">Esqueci minha senha</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
