import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import logo from '../../assets/mirtilo-logo.svg';

export default function Register() {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleFocus = () => setIsRevealed(true);
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || !password || !confirm) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), normalizedEmail, password);
      sessionStorage.setItem('mertilo_verification_email', normalizedEmail);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="login-page">
        <div className="login-page__frame">
          <section
            className="login-page__identity"
            aria-hidden="true"
            aria-labelledby="register-brand-title"
          >
            <div className="login-page__brand">
              <span className="login-page__logo" aria-hidden="true">
                <img src={logo} alt="Mertilo" className="login-page__logo-img" />
              </span>
              <span>Mertilo</span>
            </div>
            <div className="login-page__statement">
              <p className="login-page__eyebrow">SUA VIDA FINANCEIRA COMEÇA AQUI</p>
              <h1 id="register-brand-title">Um começo claro para seus planos.</h1>
              <p>Organize suas informações, acompanhe seu fluxo e construa seu planejamento com confiança.</p>
            </div>
            <div className="login-page__graphic" aria-hidden="true">
              <div className="login-page__graphic-card">
                <span className="login-page__graphic-label">Sua jornada financeira</span>
                <span className="login-page__graphic-val">Começa com clareza</span>
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

          <section className="login-panel" aria-labelledby="register-title">
            <div className="login-panel__heading">
              <p className="login-panel__kicker">Cadastro realizado</p>
              <h2 id="register-title">Conta criada</h2>
              <p>Verifique seu e-mail para o código de confirmação.</p>
            </div>
            <div className="login-panel__success">
              <Link to="/verify-email" viewTransition className="login-panel__verify-link">Ir para verificação</Link>
              <Link to="/login" viewTransition className="login-panel__login-link">Já tenho conta, entrar</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        <section
          className={`login-page__identity ${isRevealed ? 'login-page__identity--revealed' : ''}`}
          aria-hidden={!isRevealed}
          aria-labelledby="register-brand-title"
        >
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          <div className="login-page__statement">
            <p className="login-page__eyebrow">PLATAFORMA DE FINANÇAS PESSOAIS</p>
            <h1 id="register-brand-title">Sua organização financeira começa aqui.</h1>
            <p>Crie sua conta e tenha controle total do seu patrimônio, fluxo e planejamento.</p>
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

        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="register-title">
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Criar conta</p>
            <h2 id="register-title">Registrar-se</h2>
            <p>Preencha os dados para criar sua conta Mertilo</p>
          </div>
          <form onSubmit={handleSubmit} aria-label="register-form" noValidate>
            <div className="login-field">
              <label htmlFor="register-name">Nome</label>
              <div className="login-field__control">
                <User size={18} aria-hidden="true" />
                <input
                  id="register-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="text"
                  autoComplete="name"
                  inputMode="text"
                  placeholder="Seu nome completo"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'register-error' : undefined}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-email">E-mail</label>
              <div className="login-field__control">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="register-email"
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
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'register-error' : undefined}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-password">Senha</label>
              <div className="login-field__control">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="register-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crie uma senha forte"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'register-error' : undefined}
                />
                <button
                  type="button"
                  className="login-field__visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-confirm-password">Confirmar senha</label>
              <div className="login-field__control">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  required
                  aria-invalid={Boolean(error) || (password !== confirm && confirm.length > 0)}
                  aria-describedby={error ? 'register-error' : confirm && password === confirm ? 'register-password-match' : undefined}
                />
                <button
                  type="button"
                  className="login-field__visibility"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {confirm && password === confirm && <p id="register-password-match" className="login-panel__field-hint">Senhas coincidem</p>}
            </div>

            {error && <div id="register-error" className="login-panel__error" role="alert">{error}</div>}

            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" /> : 'Criar conta'}
            </button>
          </form>
          <p className="login-panel__signup">
            Já possui conta? <Link to="/login" viewTransition>Entrar</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

