// Importa React e os hooks useState (estado local) e useContext (consumir contextos globais)
import React, { useState, useContext } from 'react';
// Importa Link (navegação client-side) e useNavigate (navegação programática via JS)
import { Link, useNavigate } from 'react-router-dom';
// Importa o AuthContext, que expõe a função login() e (possivelmente) o usuário autenticado
import { AuthContext } from '../../context/AuthContext';
// Importa ícones: olho aberto/fechado (mostrar/ocultar senha), cadeado (senha) e envelope (e-mail)
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
// Importa o logo SVG exibido no topo da tela
import logo from '../../assets/mirtilo-logo.svg';

// Componente da página de Login
export default function Login() {
  // Consome do AuthContext apenas a função "login" (faz a autenticação do usuário)
  const { login } = useContext(AuthContext);
  // Hook para navegar programaticamente (ex.: redirecionar após login bem-sucedido)
  const navigate = useNavigate();

  // Estado do e-mail digitado
  const [email, setEmail] = useState('');
  // Estado da senha digitada
  const [password, setPassword] = useState('');
  // Controla se a senha está visível (texto) ou mascarada (password)
  const [showPassword, setShowPassword] = useState(false);
  // Estado de loading: true enquanto a requisição de login está em andamento
  const [loading, setLoading] = useState(false);
  // Mensagem de erro exibida ao usuário (null quando não há erro)
  const [error, setError] = useState(null);
  // Controla a "revelação" do painel visual esquerdo (animação quando o usuário foca nos campos)
  const [isRevealed, setIsRevealed] = useState(false);

  // Ao focar em qualquer campo do formulário, revela o painel esquerdo
  const handleFocus = () => setIsRevealed(true);

  // Ao sair do foco: se o próximo elemento focado NÃO pertencer ao mesmo <form>,
  // esconde o painel esquerdo novamente (evita piscar ao navegar entre campos do form)
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  // Função chamada ao submeter o formulário de login
  const handleSubmit = async (e) => {
    // Previne recarregamento padrão da página
    e.preventDefault();
    // Ativa estado de loading (para desabilitar botão e mostrar spinner)
    setLoading(true);
    // Limpa erro anterior
    setError(null);
    try {
      // Validações simples do lado do cliente (antes de chamar a API)
      // - e-mail precisa existir e conter "@"
      if (!email || !email.includes('@')) throw new Error('E-mail inválido');
      // - senha precisa existir e ter pelo menos 8 caracteres
      if (!password || password.length < 8) throw new Error('Senha inválida');
      // Chama a função login() do AuthContext (provavelmente chama a API e guarda o token/usuário)
      await login(email, password);
      // Em caso de sucesso, redireciona o usuário para a home "/"
      navigate('/');
    } catch (err) {
      // Em caso de falha, mostra a mensagem do erro (ou mensagem genérica como fallback)
      setError(err.message || 'Erro ao logar. Tente novamente.');
    } finally {
      // Desativa o loading independentemente do resultado
      setLoading(false);
    }
  };

  return (
    // Container principal da página de login
    <main className="login-page">
      {/* Moldura que agrupa os dois painéis; recebe classe extra quando isRevealed=true (animação) */}
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        {/* Painel esquerdo (identidade/branding).
            aria-hidden=true quando NÃO revelado (esconde de leitores de tela).
            aria-labelledby aponta para o título "login-brand-title" */}
        <section
          className={`login-page__identity ${isRevealed ? 'login-page__identity--revealed' : ''}`}
          aria-hidden={!isRevealed}
          aria-labelledby="login-brand-title"
        >
          {/* Logotipo + nome da marca */}
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          {/* Texto institucional do painel esquerdo */}
          <div className="login-page__statement">
            <p className="login-page__eyebrow">PLATAFORMA DE FINANÇAS PESSOAIS</p>
            <h1 id="login-brand-title">Clareza para cada decisão.</h1>
            <p>Controle patrimonial, fluxo e planejamento integrados com segurança e precisão.</p>
          </div>
          {/* Elemento gráfico decorativo (barras simulando um gráfico) — puramente visual */}
          <div className="login-page__graphic" aria-hidden="true">
            <div className="login-page__graphic-card">
              <span className="login-page__graphic-label">Patrimônio Líquido</span>
              <span className="login-page__graphic-val">R$ ••••••</span>
              <div className="login-page__graphic-bars">
                {/* Cada span representa uma barra; o height inline define sua altura relativa */}
                <span style={{ height: '35%' }} />
                <span style={{ height: '60%' }} />
                <span style={{ height: '45%' }} />
                <span style={{ height: '80%' }} />
                <span style={{ height: '100%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Painel direito (formulário de login).
            Recebe classe "--shifted" quando isRevealed=true (animação de deslocamento) */}
        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="login-title">
          {/* Cabeçalho: kicker, título e subtítulo do formulário */}
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Acesso à conta</p>
            <h2 id="login-title">Entrar</h2>
            <p>Acesse sua conta Mertilo</p>
          </div>
          {/* Formulário de login; noValidate desativa validação nativa (feita manualmente no handleSubmit) */}
          <form onSubmit={handleSubmit} aria-label="login-form" noValidate>
            {/* Campo de e-mail */}
            <div className="login-field">
              <label htmlFor="login-email">E-mail</label>
              <div className="login-field__control">
                {/* Ícone decorativo de envelope */}
                <Mail size={18} aria-hidden="true" />
                {/* Input controlado: value=email, onChange atualiza o estado.
                    onFocus/onBlur controlam a revelação do painel esquerdo.
                    aria-invalid e aria-describedby indicam erro para acessibilidade. */}
                <input
                  id="login-email"
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
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            {/* Campo de senha */}
            <div className="login-field">
              {/* Linha do label + link "Esqueci minha senha" */}
              <div className="login-field__label-row">
                <label htmlFor="login-password">Senha</label>
                {/* Link para a página de recuperação de senha */}
                <Link to="/forgot-password" viewTransition>Esqueci minha senha</Link>
              </div>
              <div className="login-field__control">
                {/* Ícone decorativo de cadeado */}
                <Lock size={18} aria-hidden="true" />
                {/* Input da senha. type alterna entre text (visível) e password (mascarado)
                    baseado em showPassword. */}
                <input
                  id="login-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                {/* Botão para alternar visibilidade da senha.
                    type="button" evita submit acidental do form.
                    aria-pressed reflete o estado atual (acessibilidade). */}
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

            {/* Mensagem de erro (só renderiza se error for truthy).
                role="alert" para ser anunciada por leitores de tela.
                id="login-error" é referenciado pelos inputs via aria-describedby. */}
            {error && <div className="login-panel__error" id="login-error" role="alert">{error}</div>}

            {/* Botão de submit: desabilitado em loading.
                Mostra spinner quando loading=true, senão o texto "Entrar na Mertilo" */}
            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" aria-hidden="true" /> : 'Entrar na Mertilo'}
            </button>
          </form>
          {/* Rodapé: convite ao cadastro caso ainda não tenha conta.
              viewTransition ativa a transição animada de rotas. */}
          <p className="login-panel__signup">Ainda não usa Mertilo? <Link to="/register" viewTransition>Criar conta</Link></p>
        </section>
      </div>
    </main>
  );
}