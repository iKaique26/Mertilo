// Importa React e o hook useState para gerenciar estado local do componente
import React, { useState } from 'react';
// Importa o componente Link do react-router-dom para navegação client-side (sem recarregar a página)
import { Link } from 'react-router-dom';
// Importa a função utilitária para fazer chamadas HTTP à API (wrapper de fetch)
import { apiCall } from '../../services/api/client';
// Importa ícones (envelope e seta para voltar) da biblioteca lucide-react
import { Mail, ArrowLeft } from 'lucide-react';
// Importa o logo SVG usado no topo da tela
import logo from '../../assets/mirtilo-logo.svg';

// Componente da página "Esqueci minha senha" / "Recuperar acesso"
export default function ForgotPassword() {
  // Estado que guarda o valor digitado no campo de e-mail
  const [email, setEmail] = useState('');
  // Estado que guarda a mensagem de feedback (sucesso ou erro) exibida ao usuário.
  // Começa como null para não mostrar nada inicialmente.
  const [message, setMessage] = useState(null);
  // Estado de loading: true enquanto a requisição de recuperação está em andamento,
  // usado para desabilitar o botão e mostrar spinner
  const [loading, setLoading] = useState(false);
  // Estado que controla se o painel lateral (identidade/visual) está "revelado".
  // Serve para animar a transição quando o usuário foca no campo de e-mail.
  const [isRevealed, setIsRevealed] = useState(false);

  // Ao focar no formulário (campo de e-mail), revela o painel visual da esquerda
  const handleFocus = () => setIsRevealed(true);

  // Ao sair do foco (blur): se o próximo elemento focado NÃO estiver dentro
  // do mesmo <form> (e.currentTarget.form), esconde o painel visual novamente.
  // Isso evita "piscar" o painel ao navegar entre elementos do próprio formulário.
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  // Função chamada ao submeter o formulário (clique no botão ou Enter)
  const handle = async (e) => {
    // Previne o comportamento padrão do formulário (recarregar a página)
    e.preventDefault();
    // Normaliza o e-mail: remove espaços extras e converte para minúsculas
    const normalizedEmail = email.trim().toLowerCase();
    // Validação simples via regex: precisa ter algo@algo.algo
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      // Se inválido, mostra mensagem e interrompe
      setMessage('Informe um e-mail válido.');
      return;
    }
    // Se já houver uma requisição em andamento, não dispara outra (evita duplo clique)
    if (loading) return;
    // Ativa o estado de loading e limpa mensagens anteriores
    setLoading(true);
    setMessage(null);
    try {
      // Envia POST para o endpoint de recuperação de senha com o e-mail normalizado.
      // Usa mensagem genérica de propósito (não revela se o e-mail existe ou não — boa prática de segurança).
      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: normalizedEmail }) });
      // Mensagem de sucesso (genérica, por segurança)
      setMessage('Se o e-mail estiver cadastrado, você receberá instruções de recuperação.');
    } catch (err) {
      // Em caso de falha de rede/erro do servidor, mostra mensagem amigável
      setMessage('Não foi possível processar a solicitação. Tente novamente mais tarde.');
    } finally {
      // Sempre desativa o loading, independentemente de sucesso ou erro
      setLoading(false);
    }
  };

  return (
    // Container principal da página de login/recuperação
    <main className="login-page">
      {/* "Frame" (moldura) que agrupa os dois painéis.
          A classe "login-frame--expanded" é aplicada quando isRevealed=true (para animação) */}
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        {/* Painel esquerdo (identidade visual / branding).
            Recebe classe "--revealed" quando isRevealed=true.
            aria-hidden é true quando NÃO revelado (para leitores de tela não focarem nele escondido).
            aria-labelledby aponta para o título "forgot-brand-title" */}
        <section
          className={`login-page__identity ${isRevealed ? 'login-page__identity--revealed' : ''}`}
          aria-hidden={!isRevealed}
          aria-labelledby="forgot-brand-title"
        >
          {/* Logotipo + nome da marca (Mertilo) */}
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          {/* Bloco de texto institucional do painel esquerdo */}
          <div className="login-page__statement">
            <p className="login-page__eyebrow">SEGURANÇA MERTILO</p>
            <h1 id="forgot-brand-title">Seu acesso continua protegido.</h1>
            <p>Recupere o acesso à sua conta com segurança. Vamos orientar você em cada etapa.</p>
          </div>
          {/* Elemento gráfico decorativo (barras) — puramente visual, aria-hidden */}
          <div className="login-page__graphic" aria-hidden="true">
            <div className="login-page__graphic-card">
              <span className="login-page__graphic-label">Proteção</span>
              <span className="login-page__graphic-val">Autenticação Segura</span>
              <div className="login-page__graphic-bars">
                {/* Cada span é uma barra do gráfico; height controla a altura visual (0–100%) */}
                <span style={{ height: '35%' }} />
                <span style={{ height: '60%' }} />
                <span style={{ height: '45%' }} />
                <span style={{ height: '80%' }} />
                <span style={{ height: '100%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Painel direito (formulário de recuperação).
            Recebe classe "--shifted" quando isRevealed=true (para animação de deslocamento) */}
        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="forgot-title">
          {/* Cabeçalho do formulário: kicker, título e descrição */}
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Recuperação</p>
            <h2 id="forgot-title">Recuperar acesso</h2>
            <p>Informe seu e-mail para receber as instruções de recuperação.</p>
          </div>
          {/* Formulário com submit handler; noValidate desativa a validação nativa do navegador
              (a validação é feita manualmente no handle) */}
          <form onSubmit={handle} aria-label="forgot-form" noValidate>
            {/* Campo de e-mail */}
            <div className="login-field">
              {/* Label acessível, ligado ao input via htmlFor="forgot-email" */}
              <label htmlFor="forgot-email">E-mail</label>
              <div className="login-field__control">
                {/* Ícone decorativo do envelope (aria-hidden para leitores de tela) */}
                <Mail size={18} aria-hidden="true" />
                {/* Input controlado: value = email, onChange atualiza o estado.
                    onFocus/handleBlur controlam a revelação do painel esquerdo.
                    type="email", autoComplete e inputMode melhoram UX em mobile/autofill. */}
                <input
                  id="forgot-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="email"
                  autoComplete="one-time-code"
                  inputMode="email"
                  placeholder="SeuEmail@exemplo.com"
                  required
                />
              </div>
            </div>

            {/* Botão de submit: desabilitado durante loading.
                Mostra spinner enquanto loading=true, senão o texto "Enviar instruções" */}
            <button className="login-panel__submit" type="submit" disabled={loading} aria-disabled={loading}>
              {loading ? <span className="login-panel__spinner" /> : 'Enviar instruções'}
            </button>
          </form>
          {/* Mensagem de feedback (sucesso ou erro). role="alert" anuncia para leitores de tela.
              Estilo inline sobrescreve as cores para o tom "verde/positivo" por padrão. */}
          {message && <div className="login-panel__error" role="alert" style={{ marginTop: '20px', background: 'rgba(16,185,129,.15)', borderColor: 'rgba(16,185,129,.3)', color: '#6ee7b7' }}>{message}</div>}
          {/* Rodapé do painel: link para voltar à página de login.
              viewTransition habilita animação de transição de rota (React Router). */}
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