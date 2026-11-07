# Arquitetura

## Estado anterior

Frontend agrupava páginas IRPF em `resources/app/src/pages/IRPF`, contexto em `resources/app/src/context` e cliente HTTP em `resources/app/src/services/api`.

## Organização atual

O módulo IRPF vive em `resources/app/src/modules/irpf`:

- `pages/`: páginas IRPF e subpáginas de exercícios.
- `context/`: `TaxIRPFContext.tsx`, estado fiscal global.
- `services/`: cliente HTTP usado por páginas IRPF.
- `types/`: tipos consumidos pelo contexto fiscal.
- `index.js`: ponto de entrada público do módulo.

## Integração

`App.jsx` importa `TaxProvider` e `IRPF` pelo módulo. Rotas das páginas IRPF preservam caminhos públicos existentes.

`TaxIRPFContext.tsx` mantém contrato `TaxProvider`, `TaxContext`, `useTax` e continua envolvendo rotas IRPF dentro de `App.jsx`.

O cliente `modules/irpf/services/client.ts` preserva `apiCall` e contratos HTTP existentes. Autenticação continua usando token em `localStorage`.

## Dependências compartilhadas

IRPF continua usando `react`, `react-router-dom`, `lucide-react` e componentes de layout/autenticação compartilhados. Nenhum componente financeiro foi movido para módulo IRPF.

Frontend financeiro mantém páginas em `resources/app/src/pages`, estado em `context/FinancialContext.tsx`, hook em `hooks/useFinancial.ts`, componentes reutilizáveis em `components/common` e API em `services/api`. Tipos financeiros voltaram para `resources/app/src/types/index.ts`; tipos não devem depender do módulo IRPF.

`resources/app/eslint.config.js` limita lint a `src/**/*.{js,jsx}`, habilita JSX e ignora `api/dist/**` e `dist/**`. Regras `no-var`, `prefer-const` e `eqeqeq` permanecem ativas.

## Limites desta etapa

Backend, SQLite, JSON financeiro, OCR, upload, Electron, autenticação e contratos API não foram alterados.

## Backend IRPF — Fase 8.3

Estado inicial: rotas em `resources/app/api/src/modules/irpf.ts`; controller, serviços e repositório em diretórios genéricos.

Movimento aplicado:

- Rotas canônicas movidas para `resources/app/api/src/modules/irpf/routes.ts`.
- `resources/app/api/src/modules/irpf.ts` virou reexport de compatibilidade.
- `resources/app/api/src/app.ts` não precisou mudar; `/api/irpf` e import legado continuam ativos.
- Todos paths, handlers e `requireAuth` foram preservados.

Limites preservados: `irpf.controller.ts`, `irpf.service.ts`, `irpf.repository.ts`, SQLite, migrations, JSON financeiro, upload, OCR, holerite, validações, assistente, integrações, auth, documentos e dados reais não foram alterados.

Riscos adiados: controller e repository continuam grandes; `irpf-validation.ts` depende de `irpf.service.ts`; split adicional exige auditoria de consumidores, testes e ciclos.

Validação Fase 8.3:

- Baseline: `npm run build` passou; `npm test` passou.
- Após movimento: `npm test` passou.
- Graphify antes: `982 nodes`, `1913 edges`, `60 communities`.
- Graphify depois: `983 nodes`, `1914 edges`, `60 communities`.
- Graphify emitiu warning existente: `tree_sitter_sql not installed`; sem alteração de dependência.
- Sem alterações frontend.
