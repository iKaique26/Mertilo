import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import legalDocuments from '../../../shared/legal-documents.json';

const termsVersion = legalDocuments.terms.version;
const termsDate = legalDocuments.terms.publishedAt;

export default function TermsOfUse() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container">
          <Link to="/register" className="btn-back">
            <ArrowLeft size={20} />
            <span>Voltar para o cadastro</span>
          </Link>
          <div className="legal-brand">
            <Shield size={32} className="text-primary" />
            <h1>Termos de Uso</h1>
            <p className="version">Versão {termsVersion} — Atualizado em {termsDate}</p>
          </div>
        </div>
      </header>

      <main className="legal-content container">
        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o Mertilo, o usuário reconhece que o serviço é um sistema de organização financeira pessoal e apoio à preparação de informações para o IRPF, sem substituir consultoria profissional específica.
          </p>
        </section>

        <section>
          <h2>2. Descrição do Serviço</h2>
          <p>
            O Mertilo oferece organização financeira pessoal, gerenciamento de contas, categorias, documentos e orientações relacionadas ao IRPF.
          </p>
          <p className="alert-box">
            <strong>Importante:</strong> o Mertilo não é uma instituição financeira, banco, escritório de contabilidade ou advocacia e não substitui a orientação de profissionais qualificados.
          </p>
        </section>

        <section>
          <h2>3. Cadastro e elegibilidade</h2>
          <p>
            O uso do serviço assume que o usuário tem capacidade civil para aceitar estes termos e que a data de nascimento informada foi fornecida de boa-fé. A verificação de maioridade independe da confirmação de data de nascimento fornecida em cadastro.
          </p>
        </section>

        <section>
          <h2>4. Responsabilidades do Usuário</h2>
          <ul>
            <li>fornecer informações exatas e atualizadas;</li>
            <li>manter a segurança das credenciais e do equipamento de acesso;</li>
            <li>não usar o serviço para fins ilícitos, fraudulentos ou contrários à legislação;</li>
            <li>revisar e confirmar a exatidão das informações antes de usá-las em contexto fiscal ou jurídic.</li>
          </ul>
        </section>

        <section>
          <h2>5. Limitação de responsabilidade</h2>
          <p>
            O Mertilo busca manter disponibilidade, qualidade e segurança, mas não garante ausência de erros, interrupções ou riscos de dados. A responsabilidade final sobre declarações tributárias, importações e uso de documentos é do usuário, observadas as regras legais aplicáveis.
          </p>
        </section>

        <section>
          <h2>6. Proteção de Dados</h2>
          <p>
            O tratamento de dados pessoais e financeiros é regido pela Política de Privacidade do Mertilo e pela legislação aplicável, especialmente a LGPD, com a separação adequada entre dados essenciais, consentimento funcional e preferências opcionais.
          </p>
        </section>

        <section>
          <h2>7. Alterações e comunicação</h2>
          <p>
            O projeto pode alterar estes termos e a Política de Privacidade. Alterações relevantes serão apresentadas ao usuário de forma transparente e, quando necessário, exigirão nova ciência ou manifestação, especialmente quando houver mudança material na finalidade de tratamento.
          </p>
        </section>

        <section>
          <h2>8. Contato e pendências</h2>
          <p>
            O canal formal de contato deve ser confirmado antes da publicação definitiva do serviço. Enquanto isso, o projeto mantém transparência sobre pendências e não declara conformidade jurídica absoluta.
          </p>
        </section>
      </main>

      <footer className="legal-footer container">
        <p>&copy; 2026 Mertilo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
