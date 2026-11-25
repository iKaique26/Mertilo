# ATUALIZAÇÃO — MERTILO CORE ENGINEER
## RELATÓRIO TÉCNICO FINAL OBRIGATÓRIO

### 1. REGRA OBRIGATÓRIA

Todo pedido de desenvolvimento, correção, auditoria, implementação, refatoração, otimização ou manutenção deve terminar com um **RELATÓRIO TÉCNICO FINAL DETALHADO**.

Essa regra é permanente e se aplica a:

- Solicitações pequenas ou grandes.
- Cada item individual de uma fase.
- Correções de bugs.
- Implementações de funcionalidades.
- Auditorias de segurança.
- Alterações de frontend e backend.
- Testes e correções de regressões.
- Trabalhos interrompidos por bloqueios técnicos.
- Solicitações que envolvam apenas investigação ou diagnóstico.

Não considerar a tarefa encerrada apenas porque o código foi alterado ou porque os testes passaram.

O relatório deve explicar o que foi solicitado, o que foi efetivamente realizado, como foi implementado, quais arquivos foram afetados e quais validações foram executadas.

### 2. ESTRUTURA OBRIGATÓRIA DO RELATÓRIO

Ao finalizar cada solicitação, apresentar as seguintes seções, adaptando o nível de detalhe ao tamanho do trabalho.

#### 2.1. Identificação da tarefa

- Nome da fase ou tarefa.
- Objetivo solicitado.
- Escopo previsto.
- Escopo efetivamente executado.
- Situação final: concluído, parcialmente concluído, bloqueado ou não iniciado.

Não declarar conclusão integral quando houver requisitos pendentes.

#### 2.2. Diagnóstico inicial

Descrever:

- Como o sistema funcionava antes da alteração.
- Qual problema foi identificado.
- Qual era a causa técnica, quando determinada.
- Quais arquivos, funções, componentes, serviços ou rotas estavam envolvidos.
- Quais riscos e dependências foram identificados.
- Quais alterações preexistentes foram encontradas e preservadas.

Se a tarefa não exigiu diagnóstico, informar isso explicitamente.

#### 2.3. Arquivos modificados e criados

Apresentar uma tabela:

| Arquivo | Tipo de alteração | Descrição detalhada |
|---|---|---|
| caminho/arquivo | Modificado/Criado | O que foi alterado e por quê |

Para cada arquivo, explicar:

- O que existia anteriormente.
- O que foi alterado.
- Qual comportamento mudou.
- Qual a finalidade da alteração.
- Como o arquivo se relaciona com os demais componentes.

Não listar arquivos apenas porque foram inspecionados. Diferenciar arquivos consultados, modificados, criados e removidos.

Se nenhum arquivo foi modificado, declarar isso.

#### 2.4. Implementação técnica

Explicar detalhadamente as mudanças realizadas:

- Funções implementadas ou modificadas.
- Componentes e serviços envolvidos.
- Regras de negócio aplicadas.
- Fluxo anterior e fluxo novo.
- Integrações realizadas.
- Tratamento de erros e casos extremos.
- Validações adicionadas.
- Alterações de contratos, interfaces e estruturas de dados.
- Impactos em compatibilidade e funcionalidades existentes.

Sempre que relevante, citar nomes reais de funções, métodos, componentes, rotas e estruturas.

Não apresentar explicações genéricas como "melhorada a segurança" ou "otimizado o código". Explicar exatamente o que foi feito e como isso produz o resultado esperado.

#### 2.5. Segurança e integridade

Informar os impactos sobre:

- Autenticação e autorização.
- Isolamento entre usuários.
- Proteção de dados financeiros.
- Validação de entradas.
- Persistência e integridade dos registros.
- Concorrência e operações simultâneas.
- Tratamento de erros.
- Privacidade e LGPD, quando aplicável.

Se algum desses aspectos não foi afetado, indicar que não houve alteração relevante no respectivo escopo.

Não afirmar que uma vulnerabilidade foi eliminada sem apresentar a correção implementada e a evidência de validação.

#### 2.6. Testes realizados

Apresentar uma tabela:

| Teste | Comando executado | Resultado | Evidência |
|---|---|---|---|
| Teste unitário | comando real | Aprovado/Falhou/Não executado | resultado observado |
| Integração | comando real | Aprovado/Falhou/Não executado | resultado observado |
| Regressão | comando real | Aprovado/Falhou/Não executado | resultado observado |
| Build | comando real | Aprovado/Falhou/Não executado | resultado observado |

Também explicar:

- Quais cenários foram testados.
- Quais casos extremos foram cobertos.
- Quantos testes passaram.
- Quantos falharam.
- Quantos foram ignorados ou cancelados.
- Quais falhas já existiam antes da alteração, quando comprovado.
- Quais falhas foram introduzidas pelo trabalho.
- Como cada falha foi tratada.

**Proibição de inventar evidências:** nunca afirmar que um teste passou, que um build foi concluído ou que um comando foi executado sem realmente executá-lo.

Se não foi possível executar alguma validação, informar o motivo e o risco correspondente.

#### 2.7. Impactos e regressões

Explicar:

- Funcionalidades afetadas.
- Compatibilidade com os fluxos anteriores.
- Riscos de regressão.
- Dependências que podem ser impactadas.
- Alterações que exigem validação manual.
- Comportamentos que ainda precisam ser observados.

Não declarar ausência de regressões sem executar as verificações apropriadas.

#### 2.8. Git e integridade das alterações

Informar:

- Branch utilizada.
- Commit inicial e final, quando disponíveis.
- Arquivos modificados.
- Arquivos novos.
- Arquivos removidos, se houver.
- Resultado do `git status`.
- Resumo do diff.
- Confirmação de preservação das alterações preexistentes.

Nunca fazer commit, push, merge ou deploy sem autorização explícita.

Nunca esconder alterações pendentes ou apresentar o repositório como limpo sem verificar.

#### 2.9. Pendências e limitações

Listar todas as pendências identificadas:

- Requisitos não implementados.
- Testes não executados.
- Falhas não resolvidas.
- Integrações incompletas.
- Dependências externas.
- Decisões que precisam de autorização.
- Riscos que ainda permanecem.

Para cada pendência, explicar sua consequência e o que falta para resolvê-la.

Se não houver pendências identificadas, dizer isso sem confundir ausência de pendências com garantia absoluta de ausência de problemas.

#### 2.10. Veredito técnico

Finalizar com uma classificação clara:

- **CONCLUÍDO:** todos os requisitos do escopo foram implementados e validados.
- **CONCLUÍDO COM PENDÊNCIAS:** o escopo principal foi entregue, mas existem limitações ou validações pendentes que devem ser explicitadas.
- **PARCIALMENTE CONCLUÍDO:** parte do escopo foi implementada, mas existem requisitos obrigatórios não atendidos.
- **BLOQUEADO:** não foi possível prosseguir por impedimento técnico ou falta de autorização.
- **NÃO INICIADO:** nenhuma implementação foi realizada.

Explicar objetivamente por que o veredito foi atribuído.

### 3. NÍVEL DE DETALHAMENTO

O relatório deve ser suficientemente detalhado para que o proprietário do Mertilo consiga:

1. Entender o que foi realizado sem precisar reler todo o código.
2. Identificar exatamente quais arquivos foram modificados.
3. Entender as decisões técnicas tomadas.
4. Saber o que mudou no funcionamento do sistema.
5. Verificar quais testes realmente foram executados.
6. Identificar riscos e pendências.
7. Decidir com segurança se autoriza a próxima etapa.

Não utilizar relatórios superficiais com frases como:

- "Tudo implementado com sucesso."
- "Código atualizado."
- "Testes passaram."
- "Problema corrigido."
- "Build funcionando."

Essas frases, isoladamente, não constituem evidência técnica.

### 4. RELATÓRIO NO CHAT — NÃO CRIAR ARQUIVO AUTOMATICAMENTE

O relatório deve ser apresentado diretamente na resposta final do agente no VS Code.

Não criar arquivos `.md`, `.txt` ou outros documentos de relatório automaticamente.

Somente criar um arquivo de relatório quando o proprietário solicitar expressamente.

### 5. CONTINUIDADE ENTRE ITENS E FASES

Quando uma solicitação fizer parte de uma fase com vários itens:

- Relatar exclusivamente o que foi executado no item atual.
- Identificar os itens anteriores que foram considerados.
- Informar quais itens permanecem pendentes.
- Não marcar a fase inteira como concluída quando apenas um item tiver sido finalizado.
- Informar claramente se o próximo item pode começar ou se depende de avaliação e autorização.
- Não avançar para etapas futuras quando houver instrução expressa para aguardar aprovação.

### 6. PROIBIÇÃO DE CONCLUSÃO SEM RELATÓRIO

Uma tarefa não pode ser considerada formalmente encerrada sem a apresentação do relatório técnico final.

Antes de encerrar, verificar:

- O relatório está completo?
- Os arquivos estão identificados corretamente?
- As alterações estão explicadas?
- Os testes possuem resultados reais?
- O estado do Git foi verificado?
- As pendências foram declaradas?
- O veredito corresponde ao que realmente foi executado?

Se alguma informação não estiver disponível, declarar explicitamente que não foi verificada.

**REGRA ABSOLUTA: entregue o trabalho e demonstre o que foi feito. O relatório técnico final é parte obrigatória da entrega, não uma etapa opcional de documentação.**