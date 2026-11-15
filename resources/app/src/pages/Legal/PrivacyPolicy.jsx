import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import legalDocuments from '../../../shared/legal-documents.json';

const privacyVersion = legalDocuments.privacy.version;
const privacyDate = legalDocuments.privacy.publishedAt;

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container">
          <Link to="/register" className="btn-back">
            <ArrowLeft size={20} />
            <span>Voltar para o cadastro</span>
          </Link>
          <div className="legal-brand">
            <Lock size={32} className="text-primary" />
            <h1>Política de Privacidade</h1>
            <p className="version">Versão {privacyVersion} — Atualizado em {privacyDate}</p>
          </div>
        </div>
      </header>

      <main className="legal-content container">
        <section>
          <h2>1. Introdução</h2>
          <p>
            Esta Política explica, de forma transparente, como o Mertilo trata dados pessoais, dados financeiros e dados técnicos no contexto da organização financeira pessoal e do auxílio ao IRPF.
            Este documento não substitui orientação jurídica especializada e não deve ser interpretado como declaração absoluta de conformidade legal final.
          </p>
        </section>

        <section>
          <h2>2. Controlador e canal de contato</h2>
          <p>
            O Mertilo é um projeto operado sob identidade comercial Mertilo e, no estado atual, a identificação formal do controlador e o canal de contato público definitivo ainda precisam ser confirmados antes da publicação final.
            A ausência dessa confirmação não autoriza a apresentação de dados pessoais fictícios, CNPJ, endereço, encarregado ou e-mail não verificado.
            Para solicitações sobre dados pessoais, a canalização interna e o ponto de contato operacional devem ser confirmados por responsável legal antes da publicação formal desta política.
          </p>
        </section>

        <section>
          <h2>3. Dados tratados</h2>
          <p>Os dados podem incluir, conforme a funcionalidade em uso:</p>
          <ul>
            <li><strong>Dados cadastrais:</strong> nome, e-mail e data de nascimento informados no cadastro.</li>
            <li><strong>Dados financeiros:</strong> informações de contas, transações, extratos e documentos importados para organização financeira e IRPF.</li>
            <li><strong>Dados técnicos:</strong> registros de autenticação, segurança, navegação local e preferências de uso necessárias para o bom funcionamento do sistema.</li>
          </ul>
        </section>

        <section>
          <h2>4. Finalidades</h2>
          <p>As finalidades relevantes incluem:</p>
          <ul>
            <li>criar e manter a conta do usuário;</li>
            <li>executar a autenticação e a segurança de acesso;</li>
            <li>organizar dados financeiros e apoiar a preparação do IRPF;</li>
            <li>reconhecer preferências funcionais do usuário no navegador;</li>
            <li>cumprir obrigações legais e medidas de segurança aplicáveis.</li>
          </ul>
        </section>

        <section>
          <h2>5. Bases legais e consentimento</h2>
          <p>
            O tratamento considera a finalidade específica, a necessidade operacional e a base legal aplicável, incluindo execução do serviço solicitado, proteção da conta e cumprimento de obrigações legais.
            O consentimento para preferências opcionais é tratado separadamente do consentimento para autenticação e armazenamento funcional essencial; não é uma autorização genérica para qualquer processamento.
            O Mertilo não utiliza analytics, marketing ou rastreamento de terceiros nesta versão e não deve ser apresentado como se houvesse tratamento adicional não implementado.
          </p>
        </section>

        <section>
          <h2>6. Compartilhamento, retenção e armazenamento</h2>
          <p>
            Dados podem ser processados por infraestrutura efetivamente utilizada para autenticação, armazenamento local do navegador, banco de dados, envio operacional de e-mail e processamento de documentos, quando necessário à operação do serviço.
            O compartilhamento com terceiros deve ser limitado ao estritamente necessário e devidamente identificado antes de qualquer publicação final.
            A retenção considera necessidade operacional, obrigações legais e a possibilidade de exigir registros mínimos de segurança.
          </p>
        </section>

        <section>
          <h2>7. Direitos dos titulares</h2>
          <p>
            O titular pode solicitar confirmação sobre o tratamento, acesso, correção, bloqueio, eliminação quando cabível, portabilidade e revogação de consentimento quando aplicável e conforme a regulamentação.
            Solicitações devem ser encaminhadas por canal formal identificado após confirmação do responsável e da via de atendimento do projeto.
          </p>
        </section>

        <section>
          <h2>8. Segurança e transparência</h2>
          <p>
            Medidas técnicas e organizacionais são aplicadas para reduzir riscos de acessos não autorizados, perda ou uso indevido. No entanto, a segurança absoluta não pode ser prometida sem contexto específico de infraestrutura e cronograma de implementação.
            As preferências de privacidade e a versão do consentimento são tratadas separadamente da versão do documento jurídico para evitar que alterações textuais irrelevantes sejam confundidas com nova manifestação do usuário.
          </p>
        </section>
      </main>

      <footer className="legal-footer container">
        <p>&copy; 2026 Mertilo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
