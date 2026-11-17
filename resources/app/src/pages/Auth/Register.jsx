// Importa React e os hooks useState (estado local) e useContext (acessar contexto global)
import React, { useState, useContext } from 'react';
// Importa Link para navegação client-side entre rotas
import { Link } from 'react-router-dom';
// Importa o AuthContext, que expõe a função register() para criar a conta
import { AuthContext } from '../../context/AuthContext';
// Importa ícones: olho aberto/fechado (senha), cadeado (senha), envelope (e-mail) e usuário (nome)
import { Calendar, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
// Importa o logo SVG exibido no topo
import logo from '../../assets/mirtilo-logo.svg';

// Componente da página de Registro (criação de conta)
export default function Register() {
  // Consome do AuthContext apenas a função "register" (cria o usuário)
  const { register } = useContext(AuthContext);

  // Estado para cada campo do formulário
  const [name, setName] = useState('');                 // Nome completo
  const [email, setEmail] = useState('');               // E-mail
  const [password, setPassword] = useState('');         // Senha
  const [confirm, setConfirm] = useState('');           // Confirmação da senha
  const [dateOfBirth, setDateOfBirth] = useState('');   // Data de nascimento (input type="date")
  const [acceptTerms, setAcceptTerms] = useState(false);// Checkbox de aceite dos termos

  // Controles de visibilidade das senhas (mostrar como texto ou mascarar)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estado de loading durante a requisição de registro
  const [loading, setLoading] = useState(false);
  // Erros por campo (name, email, password, confirm, dateOfBirth, terms) e erro geral da API (form)
  const [errors, setErrors] = useState({});
  // Flag de sucesso: quando true, renderiza a tela de "conta criada"
  const [success, setSuccess] = useState(false);
  // Controla a revelação do painel esquerdo (animação quando o usuário foca em algum campo)
  const [isRevealed, setIsRevealed] = useState(false);

  // Focar em qualquer campo revela o painel visual esquerdo
  const handleFocus = () => setIsRevealed(true);

  // Ao sair do foco: se o próximo elemento focado não pertence ao mesmo form,
  // esconde novamente o painel esquerdo (evita "piscar" ao navegar entre campos)
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  // Remove o erro dos campos informados quando o usuário os edita
  const clearErrors = (...fields) => setErrors((prev) => {
    const next = { ...prev };
    fields.forEach((field) => delete next[field]);
    return next;
  });

  // Atributos ARIA de um campo: aria-invalid só quando ele tem erro; aria-describedby liga a mensagem (e ids extras)
  const a11y = (field, ...extraIds) => {
    const ids = [errors[field] && `register-${field}-error`, ...extraIds].filter(Boolean).join(' ');
    return { 'aria-invalid': Boolean(errors[field]), 'aria-describedby': ids || undefined };
  };

  // Mensagem de erro específica de um campo
  const fieldError = (field) => errors[field] && (
    <p id={`register-${field}-error`} className="login-panel__field-error" role="alert">{errors[field]}</p>
  );

  // Função chamada ao submeter o formulário de registro
  const handleSubmit = async (e) => {
    // Previne recarregamento da página
    e.preventDefault();
    // Evita submit duplicado se já estiver carregando
    if (loading) return;
    // Limpa erros anteriores
    setErrors({});

    // Normaliza o e-mail (remove espaços, minúsculas)
    const normalizedEmail = email.trim().toLowerCase();

    // Validação 1: todos os campos obrigatórios preenchidos (cada campo vazio recebe a sua mensagem)
    const missing = {};
    if (!name.trim()) missing.name = 'Informe seu nome.';
    if (!normalizedEmail) missing.email = 'Informe seu e-mail.';
    if (!password) missing.password = 'Informe uma senha.';
    if (!confirm) missing.confirm = 'Confirme sua senha.';
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    // Validação 2: formato do e-mail (algo@algo.algo)
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrors({ email: 'Informe um e-mail válido.' });
      return;
    }
    // Validação 3: senha e confirmação coincidem
    if (password !== confirm) {
      setErrors({ confirm: 'As senhas não coincidem.' });
      return;
    }
    // Validação 4: senha mínima de 8 caracteres
    if (password.length < 8) {
      setErrors({ password: 'A senha deve ter ao menos 8 caracteres.' });
      return;
    }
    // Validação 5: data de nascimento informada
    if (!dateOfBirth) {
      setErrors({ dateOfBirth: 'Informe sua data de nascimento. O Mertilo é exclusivo para maiores de 18 anos.' });
      return;
    }
    // Cálculo da idade a partir da data de nascimento (com fuso tratado via "T00:00:00")
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    // Ajusta a idade se o aniversário ainda não ocorreu este ano
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    // Validação 6: precisa ser maior de 18 anos
    if (age < 18) {
      setErrors({ dateOfBirth: 'O Mertilo é exclusivo para maiores de 18 anos.' });
      return;
    }
    // Validação 7: aceite dos termos obrigatório
    if (!acceptTerms) {
      setErrors({ terms: 'Você deve aceitar os Termos de Uso e a Política de Privacidade.' });
      return;
    }

    // Ativa loading enquanto o registro está em andamento
    setLoading(true);
    try {
      // Chama a função register do contexto (envia os dados para a API)
      // Passa nome sem espaços extras, e-mail normalizado, senha, aceite e data de nascimento
      await register(name.trim(), normalizedEmail, password, acceptTerms, dateOfBirth);
      // Salva o e-mail na sessionStorage para usar na próxima tela (verificação de e-mail)
      sessionStorage.setItem('mertilo_verification_email', normalizedEmail);
      // Ativa a tela de sucesso (a renderização abaixo muda)
      setSuccess(true);
    } catch (err) {
      // Em caso de erro da API, mostra a mensagem retornada (ou fallback genérico) como erro geral
      setErrors({ form: err.message || 'Erro ao registrar' });
    } finally {
      // Desativa loading em qualquer caso
      setLoading(false);
    }
  };

  // Se o registro teve sucesso, renderiza a tela de "Conta criada" (sem formulário)
  if (success) {
    return (
      <main className="login-page">
        <div className="login-page__frame">
          {/* Painel esquerdo com identidade/branding (sempre oculto para leitores de tela nessa tela) */}
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
            {/* Gráfico decorativo */}
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

          {/* Painel direito de sucesso: informa que a conta foi criada e oferece caminhos */}
          <section className="login-panel" aria-labelledby="register-title">
            <div className="login-panel__heading">
              <p className="login-panel__kicker">Cadastro realizado</p>
              <h2 id="register-title">Conta criada</h2>
              <p>Verifique seu e-mail para o código de confirmação.</p>
            </div>
            <div className="login-panel__success">
              {/* Link para a página de verificação de e-mail */}
              <Link to="/verify-email" viewTransition className="login-panel__verify-link">Ir para verificação</Link>
              {/* Link para a página de login, caso o usuário já queira entrar */}
              <Link to="/login" viewTransition className="login-panel__login-link">Já tenho conta, entrar</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Renderização principal: formulário de cadastro
  return (
    <main className="login-page">
      {/* Moldura dos dois painéis; classe extra aplicada quando isRevealed=true */}
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        {/* Painel esquerdo (identidade visual).
            aria-hidden=true quando não revelado (esconde de leitores de tela).
            aria-labelledby aponta para o título "register-brand-title" */}
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
          {/* Gráfico decorativo (barras) — puramente visual */}
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

        {/* Painel direito (formulário de cadastro).
            Recebe classe "--shifted" quando isRevealed=true (animação) */}
        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="register-title">
          {/* Cabeçalho do formulário */}
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Criar conta</p>
            <h2 id="register-title">Registrar-se</h2>
            <p>Preencha os dados para criar sua conta Mertilo</p>
          </div>
          {/* Formulário com submit handler; noValidate desliga validação nativa */}
          <form onSubmit={handleSubmit} aria-label="register-form" noValidate>
            {/* Campo: Nome */}
            <div className="login-field">
              <label htmlFor="register-name">Nome</label>
              <div className="login-field__control">
                {/* Ícone de usuário */}
                <User size={18} aria-hidden="true" />
                {/* Input controlado; onFocus/onBlur controlam a revelação do painel esquerdo.
                    aria-invalid e aria-describedby indicam erro para acessibilidade. */}
                <input
                  id="register-name"
                  name="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErrors('name'); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="text"
                  autoComplete="name"
                  inputMode="text"
                  placeholder="Seu nome completo"
                  required
                  {...a11y('name')}
                />
              </div>
              {fieldError('name')}
            </div>

            {/* Campo: E-mail */}
            <div className="login-field">
              <label htmlFor="register-email">E-mail</label>
              <div className="login-field__control">
                {/* Ícone de envelope */}
                <Mail size={18} aria-hidden="true" />
                <input
                  id="register-email"
                  name="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors('email'); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="SeuEmail@exemplo.com"
                  required
                  {...a11y('email')}
                />
              </div>
              {fieldError('email')}
            </div>

            {/* Campo: Data de nascimento.
                max = hoje (não permite datas futuras).
                aria-describedby aponta para o erro (se houver) e para o aviso de "maiores de 18". */}
            <div className="login-field">
              <label htmlFor="register-dateOfBirth">Data de nascimento</label>
              <div className="login-field__control">
                {/* Ícone de calendário */}
                <Calendar size={18} aria-hidden="true" />
                <input
                  id="register-dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => { setDateOfBirth(e.target.value); clearErrors('dateOfBirth'); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  {...a11y('dateOfBirth', 'adult-only-notice')}
                />
              </div>
              {fieldError('dateOfBirth')}
              {/* Aviso de restrição de idade */}
              <small id="adult-only-notice" className="login-field__note">Cadastro exclusivo para maiores de 18 anos.</small>
            </div>

            {/* Campo: Senha */}
            <div className="login-field">
              <label htmlFor="register-password">Senha</label>
              <div className="login-field__control">
                {/* Ícone de cadeado */}
                <Lock size={18} aria-hidden="true" />
                {/* type alterna entre text/password conforme showPassword */}
                <input
                  id="register-password"
                  name="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors('password', 'confirm'); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crie uma senha forte"
                  required
                  {...a11y('password')}
                />
                {/* Botão para mostrar/ocultar a senha.
                    type="button" evita submit; aria-pressed reflete o estado. */}
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
              {fieldError('password')}
            </div>

            {/* Campo: Confirmar senha */}
            <div className="login-field">
              <label htmlFor="register-confirm-password">Confirmar senha</label>
              <div className="login-field__control">
                <Lock size={18} aria-hidden="true" />
                {/* aria-invalid true se houver erro OU se a senha não coincidir (e o campo já tiver conteúdo).
                    aria-describedby aponta para o erro ou, quando as senhas coincidem, para o aviso de match. */}
                <input
                  id="register-confirm-password"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearErrors('confirm'); }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  required
                  {...a11y('confirm', confirm && password === confirm && 'register-password-match')}
                  aria-invalid={Boolean(errors.confirm) || (password !== confirm && confirm.length > 0)}
                />
                {/* Botão para mostrar/ocultar a confirmação */}
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
              {fieldError('confirm')}
              {/* Feedback imediato: mostra "Senhas coincidem" só quando confirm igual a password e ambos preenchidos */}
              {confirm && password === confirm && <p id="register-password-match" className="login-panel__field-hint">Senhas coincidem</p>}
            </div>

            {/* Checkbox de aceite dos Termos de Uso e Política de Privacidade */}
            <div className="login-field-checkbox">
              <input
                id="register-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); clearErrors('terms'); }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                {...a11y('terms')}
              />
              {/* Label com links para os termos (abrem em nova aba com target="_blank") */}
              <label htmlFor="register-terms">
                Li e aceito os <Link to="/termos-de-uso" target="_blank">Termos de Uso</Link> e a <Link to="/politica-de-privacidade" target="_blank">Política de Privacidade</Link> do Mertilo.
              </label>
            </div>
            {fieldError('terms')}

            {/* Erro geral (ex.: resposta da API sem campo associado). role="alert" para leitores de tela. */}
            {errors.form && <div id="register-form-error" className="login-panel__error" role="alert">{errors.form}</div>}

            {/* Botão de submit: desabilitado em loading; mostra spinner ou texto "Criar conta" */}
            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" /> : 'Criar conta'}
            </button>
          </form>
          {/* Rodapé: link para login caso já tenha conta */}
          <p className="login-panel__signup">
            Já possui conta? <Link to="/login" viewTransition>Entrar</Link>
          </p>
        </section>
      </div>
    </main>
  );
}