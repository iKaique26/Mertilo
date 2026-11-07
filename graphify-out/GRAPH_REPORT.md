# Graph Report - Mertilo  (2026-11-06)

## Corpus Check
- 868 files · ~1,918,697 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 243 file(s) not represented in the graph (top: .db-shm 81, .db-wal 81, .pak 56)

## Summary
- 1117 nodes · 2255 edges · 72 communities (56 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b45caff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiCall
- irpf.controller.ts
- csv-import.service.ts
- pre-phase-3/src/app.ts
- app/package.json
- AssistantService
- api/src/app.ts
- email.service.ts
- phase-1.md
- migrations.ts
- joi
- FinancialContext.tsx
- Relatório detalhado — Importação financeira
- api/package.json
- package.json
- .utf8_package.json
- steps
- db.ts
- pre-phase-3/src/data/store.ts
- HoleriteReader
- file-processor.ts
- .eslintrc.json
- compilerOptions
- App.jsx
- auth.service.ts
- Dashboard/index.jsx
- ImportacaoFinanceira/index.jsx
- designSystem.js
- Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)
- Getting Started
- smtpdiag.mjs
- vercel.json
- irpf/types/index.ts
- TaxIRPFContext.tsx
- api/src/controllers/salary.controller.ts
- ref_fs
- IRPFDependents
- App.jsx
- *
- AGENTS.md
- pre-phase-3/src/yamljs.d.ts
- CLAUDE.md
- .claude/CLAUDE.md
- api/src/yamljs.d.ts
- Fase 3A — Integração de dados: Importação, Dashboard e IRPF
- IRPFDocuments
- dependencies
- pre-phase-3/src/controllers/vehicle-expense.controller.ts
- pre-phase-3/src/utils/schema.ts
- Arquitetura
- scripts
- api/src/schemas/validation.ts
- main.cjs
- financial-http-isolation.test.ts
- dependencies
- pre-phase-3/src/controllers/account.controller.ts
- pre-phase-3/src/utils/http.ts
- Assistant/index.jsx
- policy
- api/src/index.ts
- ref_node_assert
- pre-phase-3/src/types.ts
- api/src/utils/validation.ts

## God Nodes (most connected - your core abstractions)
1. `apiCall()` - 59 edges
2. `express` - 36 edges
3. `badRequest()` - 31 edges
4. `getDatabase()` - 27 edges
5. `react` - 27 edges
6. `App()` - 27 edges
7. `lucide-react` - 24 edges
8. `logger` - 21 edges
9. `react-router-dom` - 19 edges
10. `Dashboard()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Backend IRPF — Fase 8.3` --references--> `requireAuth()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/api/src/middleware/auth.middleware.ts
- `8. Classificação automática` --references--> `confirmCsvImport()`  [INFERRED]
  auditoria-ux-ui/20-relatorio-importacao-financeira.md → resources/app/api/src/services/csv-import.service.ts
- `Segurança` --references--> `readLegacyData()`  [INFERRED]
  auditoria-ux-ui/23-refinamento-integracao-ui.md → resources/app/api/src/data/store.ts
- `3. Rotas HTTP` --references--> `requireAuth()`  [INFERRED]
  auditoria-ux-ui/20-relatorio-importacao-financeira.md → resources/app/api/src/middleware/auth.middleware.ts
- `Integração` --references--> `apiCall()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/services/client.ts

## Import Cycles
- None detected.

## Communities (72 total, 16 thin omitted)

### Community 0 - "apiCall"
Cohesion: 0.15
Nodes (24): AuthProvider(), init(), getAlertDescription(), IRPFAlerts(), loadAlerts(), resolveAlert(), IRPFAssets(), handleAddAsset() (+16 more)

### Community 1 - "irpf.controller.ts"
Cohesion: 0.10
Nodes (35): accountController, categoryController, historyController, createAsset(), deleteAsset(), getAssetById(), getAssets(), updateAsset() (+27 more)

### Community 2 - "csv-import.service.ts"
Cohesion: 0.09
Nodes (49): Causa, Correção, Resultado, Segurança, Testes e builds, DATA_FILE, DEFAULT_CATEGORIES, defaultData() (+41 more)

### Community 3 - "pre-phase-3/src/app.ts"
Cohesion: 0.16
Nodes (9): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, historyController, router, logger (+1 more)

### Community 4 - "app/package.json"
Cohesion: 0.06
Nodes (41): electron, eslint, jsdom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, vite, @vitejs/plugin-react (+33 more)

### Community 5 - "AssistantService"
Cohesion: 0.06
Nodes (21): db, tables, db, tables, better-sqlite3, db, db, rows (+13 more)

### Community 6 - "api/src/app.ts"
Cohesion: 0.14
Nodes (15): express, allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, irpfController, vehicleExpenseController (+7 more)

### Community 7 - "email.service.ts"
Cohesion: 0.14
Nodes (13): EmailMessage, EmailProvider, EmailResult, MailtrapEmailProvider, MockEmailProvider, buildPasswordResetEmail(), buildVerificationEmail(), emailService (+5 more)

### Community 8 - "phase-1.md"
Cohesion: 0.07
Nodes (29): 1. Arquivo `__tests__/business-rules.test.ts` não existe, 1. Remoção: `resources/app/api/src/utils/response.ts`, 2. Remoção: `resources/app/electron/main.js`, 2. Vulnerabilidades detectadas no audit, 3. Remoção: Dependências npm não utilizadas, 4. Modificação: `resources/app/src/main.jsx`, Arquivos Modificados, Arquivos Removidos (+21 more)

### Community 9 - "migrations.ts"
Cohesion: 0.23
Nodes (12): __dirname, ensureLegacyUserColumns(), ensureUserIdColumn(), executeMigration(), __filename, getAvailableMigrations(), getExecutedMigrations(), migrationRequirements (+4 more)

### Community 10 - "joi"
Cohesion: 0.15
Nodes (11): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, joi, joi@^17.12.0, accountSchema (+3 more)

### Community 11 - "FinancialContext.tsx"
Cohesion: 0.13
Nodes (16): FinancialContext, FinancialProvider(), financialReducer(), initialState, financialService, Account, AppData, Category (+8 more)

### Community 12 - "Relatório detalhado — Importação financeira"
Cohesion: 0.07
Nodes (27): 10. Confirmação e persistência, 11. Histórico mensal, 12. Undo e remoção individual, 13. Isolamento entre usuários, 14. Falhas e respostas HTTP, 15. Evidências executadas, 16. Limitação sobre rollback, 17. Pontos de atenção (+19 more)

### Community 13 - "api/package.json"
Cohesion: 0.11
Nodes (26): ts-node, tsx, @types/better-sqlite3, @types/cors, @types/express, @types/joi, @types/node, @types/swagger-ui-express (+18 more)

### Community 14 - "package.json"
Cohesion: 0.11
Nodes (20): dependencies, gh@^2.8.9, devDependencies, concurrently@^8.2.0, electron-builder@^24.9.1, concurrently, electron-builder, gh (+12 more)

### Community 15 - ".utf8_package.json"
Cohesion: 0.11
Nodes (20): dependencies, gh@^2.8.9, devDependencies, concurrently@^8.2.0, electron-builder@^24.9.1, concurrently, electron-builder, gh (+12 more)

### Community 16 - "steps"
Cohesion: 0.10
Nodes (19): runs-on, steps, strategy, jobs, build-test, node-version, name, branches (+11 more)

### Community 17 - "db.ts"
Cohesion: 0.06
Nodes (48): backupDatabase(), closeDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), initializeDatabase(), shutdownDatabase() (+40 more)

### Community 18 - "pre-phase-3/src/data/store.ts"
Cohesion: 0.29
Nodes (9): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), readData(), writeData() (+1 more)

### Community 19 - "HoleriteReader"
Cohesion: 0.15
Nodes (7): DocumentExtractionResult, documentReaderManager, ExtractedField, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 20 - "file-processor.ts"
Cohesion: 0.10
Nodes (26): ConsolidatedHolerite, calculateConfidence(), DocumentTypeResult, extractBankStatementFields(), ExtractedField, extractGenericFields(), extractIncomeStatementFields(), extractMedicalFields() (+18 more)

### Community 21 - ".eslintrc.json"
Cohesion: 0.13
Nodes (14): eslint:recommended, env, browser, es2021, node, extends, parserOptions, ecmaVersion (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 23 - "App.jsx"
Cohesion: 0.23
Nodes (8): lucide-react, react, react-router-dom, pageMetadata, periodOptions, STORAGE_KEYS, AuthContext, RequestOptions

### Community 24 - "auth.service.ts"
Cohesion: 0.26
Nodes (5): authController, User, usersRepository, router, authService

### Community 25 - "Dashboard/index.jsx"
Cohesion: 0.18
Nodes (27): EmptyState(), ErrorState(), Loading(), Skeleton(), SkeletonCard(), SkeletonGrid(), SkeletonRow(), AccountsPanel() (+19 more)

### Community 26 - "ImportacaoFinanceira/index.jsx"
Cohesion: 0.22
Nodes (4): formatCurrency(), ImportacaoFinanceira(), previewFallback, financialImportService

### Community 27 - "designSystem.js"
Cohesion: 0.18
Nodes (10): borderRadius, breakpoints, colors, iconMap, iconSizes, shadows, spacing, transitions (+2 more)

### Community 28 - "Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)"
Cohesion: 0.11
Nodes (17): 1. Meta Information & Core Directive, 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS), 3. THE CREATIVE VARIANCE ENGINE, 4. HAPTIC MICRO-AESTHETICS (COMPONENT MASTERY), 5. MOTION CHOREOGRAPHY (FLUID DYNAMICS), 6. PERFORMANCE GUARDRAILS, 7. EXECUTION PROTOCOL, 8. PRE-OUTPUT CHECKLIST (+9 more)

### Community 29 - "Getting Started"
Cohesion: 0.22
Nodes (8): Building for Production, Features, Getting Started, Installation, License, Package the app for your platform, Prerequisites, Project Structure

### Community 30 - "smtpdiag.mjs"
Cohesion: 0.29
Nodes (6): dotenv, nodemailer, dotenv@^16.4.5, nodemailer@^6.9.4, envPath, transporter

### Community 32 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 33 - "irpf/types/index.ts"
Cohesion: 0.18
Nodes (10): Account, AppData, Category, FinancialAction, FinancialImportHistoryEntry, FinancialState, ImportedFinancialTransaction, MonthlyHistory (+2 more)

### Community 34 - "TaxIRPFContext.tsx"
Cohesion: 0.12
Nodes (16): Integração, initialState, TaxAction, TaxContext, TaxProvider(), taxReducer(), TaxState, useTax() (+8 more)

### Community 35 - "api/src/controllers/salary.controller.ts"
Cohesion: 0.47
Nodes (3): salaryController, router, salaryService

### Community 36 - "ref_fs"
Cohesion: 0.12
Nodes (7): text, tmpFilePath, result, text, validation, dir, files

### Community 37 - "IRPFDependents"
Cohesion: 0.53
Nodes (5): IRPFDependents(), handleAddDependent(), handleDeleteDependent(), loadDependents(), validateCPF()

### Community 38 - "App.jsx"
Cohesion: 0.23
Nodes (9): App(), RequireAuth(), Header(), MainLayout(), ForgotPassword(), Login(), Register(), ResetPassword() (+1 more)

### Community 39 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 52 - "Fase 3A — Integração de dados: Importação, Dashboard e IRPF"
Cohesion: 0.22
Nodes (8): Backend, Escopo, Fase 3A — Integração de dados: Importação, Dashboard e IRPF, Fora do escopo, Frontend, Importação → IRPF, Isolamento, Validação

### Community 53 - "IRPFDocuments"
Cohesion: 0.21
Nodes (10): ALLOWED_TYPES, getStatusColor(), IRPFDocuments(), confirmDocument(), handleDelete(), handleDrop(), handleFileUpload(), loadDocuments() (+2 more)

### Community 54 - "dependencies"
Cohesion: 0.10
Nodes (20): cors, jsonwebtoken, morgan, pdf-parse, sharp, swagger-ui-express, tesseract.js, @types/morgan (+12 more)

### Community 55 - "pre-phase-3/src/controllers/vehicle-expense.controller.ts"
Cohesion: 0.33
Nodes (5): vehicleExpenseController, router, vehicleExpenseRepository, vehicleExpenseService, VehicleExpense

### Community 56 - "pre-phase-3/src/utils/schema.ts"
Cohesion: 0.40
Nodes (4): accountSchema, categorySchema, historySchema, vehicleExpenseSchema

### Community 57 - "Arquitetura"
Cohesion: 0.29
Nodes (6): Arquitetura, Backend IRPF — Fase 8.3, Dependências compartilhadas, Estado anterior, Limites desta etapa, Organização atual

### Community 59 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 61 - "api/src/schemas/validation.ts"
Cohesion: 0.33
Nodes (5): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema

### Community 62 - "main.cjs"
Cohesion: 0.12
Nodes (9): base64Content, fileContent, fileStats, options, payload, req, checkBackendReady(), ensureBackend() (+1 more)

### Community 64 - "financial-http-isolation.test.ts"
Cohesion: 0.14
Nodes (7): bcryptjs, bcryptjs@^2.4.3, historyService, login(), root, createUser(), root

### Community 68 - "dependencies"
Cohesion: 0.33
Nodes (6): react-dom, dependencies, lucide-react@^1.41.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^7.18.3

### Community 69 - "pre-phase-3/src/controllers/account.controller.ts"
Cohesion: 0.31
Nodes (5): accountController, router, accountRepository, accountService, Account

### Community 70 - "pre-phase-3/src/utils/http.ts"
Cohesion: 0.16
Nodes (10): categoryController, salaryController, router, router, salaryRepository, categoryService, historyService, salaryService (+2 more)

### Community 71 - "Assistant/index.jsx"
Cohesion: 0.53
Nodes (5): getSeverityIcon(), IRPFAssistant(), loadAnalysis(), IssueSection(), StatCard()

### Community 80 - "ref_node_assert"
Cohesion: 0.10
Nodes (13): router, db, dbPath, dependentA, dependentB, dataDir, db, dbPath (+5 more)

### Community 84 - "pre-phase-3/src/types.ts"
Cohesion: 0.21
Nodes (9): categoryRepository, historyRepository, AppData, Category, MonthlyHistory, TripType, validateCategoryPayload(), validateHistorySummary() (+1 more)

### Community 85 - "api/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

## Knowledge Gaps
- **1 isolated node(s):** `eslint:recommended`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 420 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `app/package.json` to `main.cjs`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **What connects `eslint:recommended` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `irpf.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10352941176470588 - nodes in this community are weakly interconnected._
- **Why does `requireAuth()` connect `api/src/app.ts` to `api/src/controllers/salary.controller.ts`, `Relatório detalhado — Importação financeira`, `ref_node_assert`, `auth.service.ts`, `Arquitetura`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `csv-import.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08635703918722787 - nodes in this community are weakly interconnected._
- **Why does `express` connect `api/src/app.ts` to `irpf.controller.ts`, `pre-phase-3/src/app.ts`, `api/src/controllers/salary.controller.ts`, `pre-phase-3/src/controllers/account.controller.ts`, `pre-phase-3/src/utils/http.ts`, `api/package.json`, `ref_node_assert`, `dependencies`, `pre-phase-3/src/controllers/vehicle-expense.controller.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `app/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06090808416389812 - nodes in this community are weakly interconnected._