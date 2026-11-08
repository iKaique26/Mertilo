import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import logo from '../../assets/mirtilo-logo.svg';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="login-page">
      <div className="login-page__frame">
        <section className="login-page__identity" aria-labelledby="login-brand-title">
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          <div className="login-page__statement">
            <p className="login-page__eyebrow">PLATAFORMA DE FINANÇAS PESSOAIS</p>
            <h1 id="login-brand-title">Clareza para cada decisão.</h1>
            <p>Controle patrimonial, fluxo e planejamento integrados com segurança e precisão.</p>
          </div>
          <div className="login-page__graphic" aria-hidden="true">
            <div className="login-page__graphic-card">
              <span className="login-page__graphic-label">Patrimônio Líquido</span>
              <span className="login-page__graphic-val">R$ ••••••</span>
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

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Acesso à conta</p>
            <h2 id="login-title">Entrar</h2>
            <p>Acesse sua conta Mertilo</p>
          </div>
          <form onSubmit={handleSubmit} aria-label="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="login-email">E-mail</label>
              <div className="login-field__control">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@exemplo.com"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="login-password">Senha</label>
                <Link to="/forgot-password">Esqueci minha senha</Link>
              </div>
              <div className="login-field__control">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  className="login-field__visibility"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="login-panel__error" id="login-error" role="alert">{error}</div>}

            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" aria-hidden="true" /> : 'Entrar na Mertilo'}
            </button>
          </form>
          <p className="login-panel__signup">Ainda não usa Mertilo? <Link to="/register">Criar conta</Link></p>
        </section>
      </div>
    </main>
  );
}
