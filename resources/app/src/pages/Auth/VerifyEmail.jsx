// Importa React e os hooks: useContext (acessar contexto global), useEffect (efeitos colaterais),
// useMemo (memorizar valor calculado) e useState (estado local)
import React, { useContext, useEffect, useMemo, useState } from 'react';
// Importa useNavigate para navegação programática (ex.: redirecionar após verificação)
import { useNavigate } from 'react-router-dom';
// Importa a função utilitária para chamar a API
import { apiCall } from '../../services/api/client';
// Importa o AuthContext, que expõe setUser (definir usuário no estado global) e login
import { AuthContext } from '../../context/AuthContext';
// Importa ícones: envelope (e-mail) e chave (código de verificação)
import { Mail, Key } from 'lucide-react';

// Componente da página de verificação de e-mail (confirmação de cadastro via código)
export default function VerifyEmail() {
  // Hook de navegação programática
  const navigate = useNavigate();
  // Consome do AuthContext as funções setUser (atualiza usuário global) e login
  const { setUser, login } = useContext(AuthContext);

  // Estado do e-mail. Inicialização "lazy" (função): ao montar, tenta recuperar
  // o e-mail salvo na sessionStorage (definido na tela de registro) para pré-preencher o campo.
  const [email, setEmail] = useState(() => {
    const sessionEmail = sessionStorage.getItem('mertilo_verification_email');
    return sessionEmail || '';
  });

  // Estado do código de verificação digitado pelo usuário
  const [code, setCode] = useState('');
  // Estado de loading durante chamadas à API (verificar ou reenviar)
  const [loading, setLoading] = useState(false);
  // Mensagem de feedback (sucesso ou erro)
  const [message, setMessage] = useState(null);
  // Flag que indica se a conta já foi verificada com sucesso (bloqueia reenvios/verificações)
  const [verified, setVerified] = useState(false);

  // Efeito: sempre que "email" muda, sincroniza o valor na sessionStorage.
  // Assim, se o usuário sair/voltar, o e-mail permanece pré-preenchido.
  useEffect(() => {
    if (email) sessionStorage.setItem('mertilo_verification_email', email);
  }, [email]);

  // Valor memorizado: versão "mascarada" do e-mail para exibir na UI
  // (ex.: "em****@dominio.com"), evitando expor o e-mail completo.
  // useMemo evita recalcular a cada render, só quando "email" muda.
  const maskedEmail = useMemo(() => {
    // Se não houver e-mail válido, retorna como está
    if (!email || !email.includes('@')) return email;
    // Separa parte local e domínio
    const [local, domain] = email.split('@');
    // Mostra 1 caractere se a parte local tiver até 2 caracteres; senão, mostra 2
    const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
    // Junta parte visível + "***" + domínio
    return `${visible}***@${domain}`;
  }, [email]);

  // Função chamada ao submeter o formulário de verificação
  const handleVerify = async (e) => {
    // Previne recarregamento da página
    e.preventDefault();
    // Validação básica: e-mail e código precisam estar preenchidos
    if (!email || !code) {
      setMessage('Informe o e-mail e o código para continuar.');
      return;
    }

    // Ativa loading e limpa mensagens anteriores
    setLoading(true);
    setMessage(null);
    try {
      // Envia POST para o endpoint de verificação com e-mail e código
      const result = await apiCall('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
      // Em caso de sucesso, guarda o token de autenticação no localStorage
      localStorage.setItem('mertilo_token', result.token);
      // Atualiza o usuário no contexto global (usuário autenticado)
      setUser(result.user);
      // Remove o e-mail da sessionStorage (não é mais necessário)
      sessionStorage.removeItem('mertilo_verification_email');
      // Marca como verificado (bloqueia inputs e botões)
      setVerified(true);
      // Mostra mensagem de sucesso
      setMessage('Conta verificada com sucesso. Redirecionando...');
      // Após 700ms, redireciona o usuário para a home "/"
      setTimeout(() => navigate('/'), 700);
    } catch (err) {
      // Em caso de erro, mostra a mensagem retornada (ou fallback genérico)
      setMessage(err.message || 'Ocorreu um erro ao verificar.');
    } finally {
      // Sempre desativa loading
      setLoading(false);
    }
  };

  // Função chamada ao clicar em "Reenviar código"
  const handleResend = async () => {
    // Validação: precisa de e-mail para reenviar
    if (!email) {
      setMessage('Informe o e-mail antes de reenviar o código.');
      return;
    }

    // Ativa loading e limpa mensagens anteriores
    setLoading(true);
    setMessage(null);
    try {
      // Envia POST para o endpoint de reenvio de código de verificação
      await apiCall('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
      // Em caso de sucesso, mostra mensagem informando o reenvio
      setMessage('Código reenviado com sucesso.');
    } catch (err) {
      // Em caso de erro, mostra mensagem retornada (ou fallback genérico)
      setMessage(err.message || 'Erro ao reenviar código.');
    } finally {
      // Sempre desativa loading
      setLoading(false);
    }
  };

  return (
    // Container da tela de autenticação (estrutura visual específica dessa página)
    <div className="auth-screen">
      {/* Container "single": versão de coluna única (sem painel lateral) */}
      <div className="auth-container auth-container--single">
        {/* Card compacto contendo o formulário */}
        <div className="auth-card auth-card--compact">
          {/* Título e subtítulo da tela.
              Subtítulo mostra o e-mail mascarado (ou "o seu e-mail" como fallback) */}
          <h2 className="form-title">Verificar e-mail</h2>
          <p className="form-subtitle">Confirme seu cadastro com o código recebido para {maskedEmail || 'o seu e-mail'}.</p>
          {/* Formulário de verificação (submit -> handleVerify) */}
          <form onSubmit={handleVerify}>
            {/* Campo: e-mail (pré-preenchido via sessionStorage, mas editável).
                Desabilitado durante loading ou se já verificado. */}
            <div className="field input-wrapper">
              <label className="input-label">E-mail</label>
              <div className="input-container">
                {/* Ícone de envelope dentro do input */}
                <span className="input-icon"><Mail size={16} /></span>
                <input className="input with-icon" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required disabled={loading || verified} />
              </div>
            </div>
            {/* Campo: código de verificação (digitado pelo usuário).
                Também desabilitado durante loading/verificado. */}
            <div className="field input-wrapper">
              <label className="input-label">Código</label>
              <div className="input-container">
                {/* Ícone de chave dentro do input */}
                <span className="input-icon"><Key size={16} /></span>
                <input className="input with-icon" value={code} onChange={(e) => setCode(e.target.value)} required disabled={loading || verified} />
              </div>
            </div>
            {/* Botão de submit: desabilitado em loading ou já verificado.
                Mostra spinner durante loading, "Verificado" se já concluiu, senão "Verificar" */}
            <button className="primary-btn" type="submit" disabled={loading || verified} aria-disabled={loading || verified}>{loading ? <span className="spinner" /> : verified ? 'Verificado' : 'Verificar'}</button>
          </form>
          {/* Botão secundário para reenviar o código por e-mail */}
          <button className="secondary-btn" onClick={handleResend} disabled={loading || verified} aria-disabled={loading || verified}>Reenviar código</button>
          {/* Mensagem de feedback (sucesso ou erro). role="status" para leitores de tela */}
          {message && <div className="message" role="status">{message}</div>}
        </div>
      </div>
    </div>
  );
}