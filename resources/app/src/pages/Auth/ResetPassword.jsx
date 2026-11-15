// Importa React e os hooks useState (estado local) e useEffect (efeitos colaterais)
import React, { useState, useEffect } from 'react';
// Importa useParams (extrair parâmetros da URL, ex.: :token) e Link (navegação client-side)
import { useParams, Link } from 'react-router-dom';
// Importa a função utilitária para chamar a API
import { apiCall } from '../../services/api/client';
// Importa ícones: cadeado (senha), seta para voltar, check (sucesso), alerta (erro) e olho (visibilidade)
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
// Importa o logo SVG da marca
import logo from '../../assets/mirtilo-logo.svg';

// Componente da página de redefinição de senha (acessada via link com token na URL)
export default function ResetPassword() {
  // Extrai o "token" da URL (definido na rota, ex.: /reset-password/:token)
  const { token } = useParams();

  // Estados dos campos do formulário
  const [newPassword, setNewPassword] = useState('');   // Nova senha
  const [confirm, setConfirm] = useState('');           // Confirmação da nova senha

  // Mensagem de feedback do formulário (erro ou aviso)
  const [message, setMessage] = useState(null);
  // Estado de loading durante a requisição de redefinição
  const [loading, setLoading] = useState(false);

  // Estado da máquina de estados da página:
  // 'validating' = validando o token; 'valid' = token OK (mostra form);
  // 'expired' = link expirado; 'invalid' = link inválido; 'success' = senha alterada
  const [status, setStatus] = useState('validating');

  // Controla a revelação do painel esquerdo (animação ao focar em um campo)
  const [isRevealed, setIsRevealed] = useState(false);
  // Controla a visibilidade das senhas (mostrar/ocultar ambas ao mesmo tempo)
  const [showPasswords, setShowPasswords] = useState(false);

  // Calcula a "força" da senha com base em regras simples:
  // - Forte: >=12 caracteres, tem maiúscula e número
  // - Aceitável: >=8 caracteres
  // - Caso contrário: texto indicando o mínimo necessário
  const strength = newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'Forte' : newPassword.length >= 8 ? 'Aceitável' : 'Mínimo de 8 caracteres';

  // Focar em qualquer campo revela o painel esquerdo
  const handleFocus = () => setIsRevealed(true);

  // Ao sair do foco: se o próximo elemento focado não pertence ao mesmo <form>,
  // esconde novamente o painel esquerdo (evita piscar ao navegar entre campos)
  const handleBlur = (e) => {
    if (!e.currentTarget.form?.contains(e.relatedTarget)) {
      setIsRevealed(false);
    }
  };

  // Efeito executado quando "token" muda (na montagem do componente, basicamente).
  // Valida o token junto à API antes de mostrar o formulário de nova senha.
  useEffect(() => {
    // Se não há token na URL, marca como inválido e não chama a API
    if (!token) {
      setStatus('invalid');
      return;
    }
    // Função interna assíncrona para validação do token
    const validate = async () => {
      try {
        // Envia POST para validar o token; se responder OK, marca como 'valid'
        await apiCall('/auth/validate-reset-token', { method: 'POST', body: JSON.stringify({ token }) });
        setStatus('valid');
      } catch (err) {
        // Em caso de erro, decide o status conforme a mensagem retornada:
        // - se contém "expirado"/"expired" → 'expired'
        // - senão → 'invalid'
        const msg = err.message || '';
        if (msg.includes('expirado') || msg.includes('expired')) setStatus('expired');
        else setStatus('invalid');
      }
    };
    // Dispara a validação
    validate();
  }, [token]);

  // Função chamada ao submeter o formulário de nova senha
  const handleSubmit = async (e) => {
    // Previne recarregamento da página
    e.preventDefault();
    // Validação: senhas devem coincidir
    if (newPassword !== confirm) {
      setMessage('As senhas não coincidem');
      return;
    }
    // Validação: senha com no mínimo 8 caracteres
    if (newPassword.length < 8) {
      setMessage('A senha deve ter ao menos 8 caracteres');
      return;
    }
    // Ativa loading e limpa mensagens anteriores
    setLoading(true);
    setMessage(null);
    try {
      // Envia POST para efetivar a troca de senha com o token e a nova senha
      await apiCall('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      // Em caso de sucesso, muda o status para mostrar a tela de "senha alterada"
      setStatus('success');
    } catch (err) {
      // Em caso de erro, mostra mensagem retornada (ou fallback genérico)
      setMessage(err.message || 'Ocorreu um erro ao alterar a senha');
    } finally {
      // Sempre desativa loading
      setLoading(false);
    }
  };

  return (
    // Container principal (mesma estrutura visual das telas de login)
    <main className="login-page">
      {/* Moldura dos dois painéis; classe extra quando isRevealed=true */}
      <div className={`login-page__frame ${isRevealed ? 'login-frame--expanded' : ''}`}>
        {/* Painel esquerdo (identidade visual).
            aria-hidden=true quando não revelado (esconde de leitores de tela). */}
        <section
          className={`login-page__identity ${isRevealed ? 'login-page__identity--revealed' : ''}`}
          aria-hidden={!isRevealed}
          aria-labelledby="reset-brand-title"
        >
          <div className="login-page__brand">
            <span className="login-page__logo" aria-hidden="true">
              <img src={logo} alt="Mertilo" className="login-page__logo-img" />
            </span>
            <span>Mertilo</span>
          </div>
          <div className="login-page__statement">
            <p className="login-page__eyebrow">SEGURANÇA MERTILO</p>
            <h1 id="reset-brand-title">Crie sua nova senha.</h1>
            <p>Escolha uma senha segura para proteger sua conta Mertilo.</p>
          </div>
        </section>

        {/* Painel direito (conteúdo que muda conforme o "status").
            Recebe classe "--shifted" quando isRevealed=true (animação) */}
        <section className={`login-panel ${isRevealed ? 'login-panel--shifted' : ''}`} aria-labelledby="reset-title">
          {/* Cabeçalho do painel (comum a todos os estados) */}
          <div className="login-panel__heading">
            <p className="login-panel__kicker">Redefinição</p>
            <h2 id="reset-title">Nova senha</h2>
          </div>
          
          {/* Estado: validando token. Mostra spinner + mensagem "Validando link..." */}
          {status === 'validating' && (
            <div className="login-panel__validating">
              <span className="login-panel__spinner" />
              <p>Validando link...</p>
            </div>
          )}

          {/* Estado: token válido → mostra o formulário de nova senha */}
          {status === 'valid' && (
            <form onSubmit={handleSubmit} aria-label="reset-form" noValidate>
              {/* Campo: nova senha */}
              <div className="login-field">
                <label htmlFor="new-password">Nova senha</label>
                <div className="login-field__control">
                  {/* Ícone de cadeado */}
                  <Lock size={18} aria-hidden="true" />
                  {/* type alterna entre text/password conforme showPasswords.
                      onFocus/onBlur controlam a revelação do painel esquerdo. */}
                  <input
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                  />
                  {/* Botão para alternar visibilidade de ambas as senhas */}
                  <button type="button" aria-label={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'} onClick={() => setShowPasswords((value) => !value)}>
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Indicador de força da senha. aria-live="polite" anuncia mudanças para leitores de tela */}
                <small aria-live="polite">Força: {strength}</small>
              </div>

              {/* Campo: confirmação da senha */}
              <div className="login-field">
                <label htmlFor="confirm-password">Confirmar senha</label>
                <div className="login-field__control">
                  <Lock size={18} aria-hidden="true" />
                  {/* Usa o MESMO estado showPasswords para alternar visibilidade das duas senhas juntas */}
                  <input
                    id="confirm-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Botão de submit: desabilitado em loading; mostra spinner ou texto */}
              <button className="login-panel__submit" type="submit" disabled={loading}>
                {loading ? <span className="login-panel__spinner" /> : 'Redefinir senha'}
              </button>

              {/* Mensagem de erro (só renderiza se houver). role="alert" para acessibilidade */}
              {message && <div className="login-panel__error" role="alert">{message}</div>}
            </form>
          )}

          {/* Estado: senha alterada com sucesso → mostra ícone verde, mensagem e link para login */}
          {status === 'success' && (
            <div className="login-panel__success">
              <CheckCircle size={48} style={{ color: '#22c55e' }} />
              <p>Senha alterada com sucesso.</p>
              <Link to="/login" className="login-panel__back-link">Ir para login</Link>
            </div>
          )}

          {/* Estados de erro: link expirado ou inválido.
              Mostra ícone vermelho, mensagem apropriada e link para tentar novamente. */}
          {(status === 'expired' || status === 'invalid') && (
            <div className="login-panel__error">
              <AlertCircle size={48} style={{ color: '#ef4444' }} />
              <p>{status === 'expired' ? 'Link expirado.' : 'Link inválido.'}</p>
              <Link to="/forgot-password" className="login-panel__back-link">Tentar novamente</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}