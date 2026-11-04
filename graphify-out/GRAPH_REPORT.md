# Graph Report - Mertilo  (2026-10-27)

## Corpus Check
- 251 files · ~1,352,452 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 243 file(s) not represented in the graph (top: .db-shm 81, .db-wal 81, .pak 56)

## Summary
- 947 nodes · 1864 edges · 61 communities (47 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ab02c41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiCall
- api/src/app.ts
- api/src/data/store.ts
- pre-phase-3/src/data/store.ts
- app/package.json
- migrations.ts
- file-processor.ts
- email.service.ts
- phase-1.md
- ref_node_assert
- pre-phase-3/src/schemas/validation.ts
- irpf.controller.ts
- TaxIRPFContext.tsx
- api/package.json
- package.json
- .utf8_package.json
- steps
- db.ts
- api/src/types.ts
- HoleriteReader
- FinancialContext.tsx
- .eslintrc.json
- compilerOptions
- App.jsx
- AssistantService
- Dashboard/index.jsx
- pre-phase-3/src/app.ts
- designSystem.js
- pre-phase-3/src/utils/http.ts
- Getting Started
- main.cjs
- vercel.json
- irpf-validation.ts
- auth.service.ts
- api/src/repositories/account.repository.ts
- api/src/repositories/category.repository.ts
- api/src/repositories/history.repository.ts
- api/src/repositories/vehicle-expense.repository.ts
- *
- AGENTS.md
- pre-phase-3/src/yamljs.d.ts
- CLAUDE.md
- .claude/CLAUDE.md
- api/src/yamljs.d.ts
- api/src/index.ts
- IRPFDocuments
- dependencies
- express
- IRPF
- api/src/controllers/salary.controller.ts
- Header
- scripts
- Assistant/index.jsx

## God Nodes (most connected - your core abstractions)
1. `apiCall()` - 57 edges
2. `express` - 32 edges
3. `react` - 27 edges
4. `App()` - 27 edges
5. `lucide-react` - 24 edges
6. `logger` - 21 edges
7. `react-router-dom` - 19 edges
8. `Dashboard()` - 18 edges
9. `getDatabase()` - 17 edges
10. `parseCsvPreview()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `loadAnalysis()` --calls--> `apiCall()`  [EXTRACTED]
  resources/app/src/pages/IRPF/Assistant/index.jsx → resources/app/src/services/api/client.ts
- `loadDashboard()` --calls--> `apiCall()`  [EXTRACTED]
  resources/app/src/pages/IRPF/index.jsx → resources/app/src/services/api/client.ts
- `loadExercises()` --calls--> `apiCall()`  [EXTRACTED]
  resources/app/src/pages/IRPF/index.jsx → resources/app/src/services/api/client.ts
- `loadSummary()` --calls--> `apiCall()`  [EXTRACTED]
  resources/app/src/pages/IRPF/index.jsx → resources/app/src/services/api/client.ts
- `handleCreateExercise()` --calls--> `apiCall()`  [EXTRACTED]
  resources/app/src/pages/IRPF/index.jsx → resources/app/src/services/api/client.ts

## Import Cycles
- None detected.

## Communities (61 total, 14 thin omitted)

### Community 0 - "apiCall"
Cohesion: 0.12
Nodes (29): AuthProvider(), init(), getAlertDescription(), IRPFAlerts(), loadAlerts(), resolveAlert(), IRPFAssets(), handleAddAsset() (+21 more)

### Community 1 - "api/src/app.ts"
Cohesion: 0.13
Nodes (15): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, categoryController, historyController (+7 more)

### Community 2 - "api/src/data/store.ts"
Cohesion: 0.07
Nodes (41): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), readData(), writeData() (+33 more)

### Community 3 - "pre-phase-3/src/data/store.ts"
Cohesion: 0.09
Nodes (26): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), readData(), writeData() (+18 more)

### Community 4 - "app/package.json"
Cohesion: 0.06
Nodes (43): electron, eslint, jsdom, react-dom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, vite (+35 more)

### Community 5 - "migrations.ts"
Cohesion: 0.07
Nodes (29): db, tables, db, tables, better-sqlite3, db, db, rows (+21 more)

### Community 6 - "file-processor.ts"
Cohesion: 0.09
Nodes (28): tesseract.js, tesseract.js@^7.0.0, ConsolidatedHolerite, calculateConfidence(), DocumentTypeResult, extractBankStatementFields(), ExtractedField, extractGenericFields() (+20 more)

### Community 7 - "email.service.ts"
Cohesion: 0.13
Nodes (17): BrevoApiEmailProvider, EmailMessage, EmailProvider, EmailResult, MockEmailProvider, SmtpEmailProvider, buildPasswordResetEmail(), buildVerificationEmail() (+9 more)

### Community 8 - "phase-1.md"
Cohesion: 0.07
Nodes (29): 1. Arquivo `__tests__/business-rules.test.ts` não existe, 1. Remoção: `resources/app/api/src/utils/response.ts`, 2. Remoção: `resources/app/electron/main.js`, 2. Vulnerabilidades detectadas no audit, 3. Remoção: Dependências npm não utilizadas, 4. Modificação: `resources/app/src/main.jsx`, Arquivos Modificados, Arquivos Removidos (+21 more)

### Community 9 - "ref_node_assert"
Cohesion: 0.10
Nodes (11): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense(), api(), assertNoAccess(), idsA, TripType (+3 more)

### Community 10 - "pre-phase-3/src/schemas/validation.ts"
Cohesion: 0.08
Nodes (20): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, accountSchema, categorySchema, historySchema (+12 more)

### Community 11 - "irpf.controller.ts"
Cohesion: 0.18
Nodes (11): DocumentExtractionResult, ExtractedField, financialIntegrationService, AssistantAnalysis, AssistantCheckitem, AssistantIssue, irpfService, TaxAlert (+3 more)

### Community 12 - "TaxIRPFContext.tsx"
Cohesion: 0.09
Nodes (14): initialState, TaxAction, TaxContext, taxReducer(), TaxState, Account, Category, FinancialAction (+6 more)

### Community 13 - "api/package.json"
Cohesion: 0.12
Nodes (22): ts-node, tsx, @types/better-sqlite3, @types/cors, @types/express, @types/joi, @types/node, @types/swagger-ui-express (+14 more)

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
Cohesion: 0.16
Nodes (14): backupDatabase(), closeDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), initializeDatabase(), shutdownDatabase() (+6 more)

### Community 18 - "api/src/types.ts"
Cohesion: 0.21
Nodes (18): alertsRepository, assetsRepository, deductionsRepository, dependentsRepository, documentsRepository, exercisesRepository, incomeRepository, rulesRepository (+10 more)

### Community 19 - "HoleriteReader"
Cohesion: 0.16
Nodes (5): documentReaderManager, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 20 - "FinancialContext.tsx"
Cohesion: 0.13
Nodes (10): FinancialContext, FinancialProvider(), financialReducer(), initialState, formatCurrency(), ImportacaoFinanceira(), previewFallback, financialService (+2 more)

### Community 21 - ".eslintrc.json"
Cohesion: 0.13
Nodes (14): eslint:recommended, env, browser, es2021, node, extends, parserOptions, ecmaVersion (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 23 - "App.jsx"
Cohesion: 0.18
Nodes (16): lucide-react, react, react-router-dom, App(), RequireAuth(), pageMetadata, periodOptions, STORAGE_KEYS (+8 more)

### Community 25 - "Dashboard/index.jsx"
Cohesion: 0.22
Nodes (24): EmptyState(), ErrorState(), Loading(), Skeleton(), SkeletonCard(), SkeletonGrid(), SkeletonRow(), AccountsPanel() (+16 more)

### Community 26 - "pre-phase-3/src/app.ts"
Cohesion: 0.11
Nodes (16): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, salaryController, router, router (+8 more)

### Community 27 - "designSystem.js"
Cohesion: 0.18
Nodes (10): borderRadius, breakpoints, colors, iconMap, iconSizes, shadows, spacing, transitions (+2 more)

### Community 28 - "pre-phase-3/src/utils/http.ts"
Cohesion: 0.18
Nodes (9): accountController, categoryController, historyController, vehicleExpenseController, router, router, router, badRequest() (+1 more)

### Community 29 - "Getting Started"
Cohesion: 0.22
Nodes (8): Building for Production, Features, Getting Started, Installation, License, Package the app for your platform, Prerequisites, Project Structure

### Community 30 - "main.cjs"
Cohesion: 0.14
Nodes (9): base64Content, fileContent, fileStats, options, payload, req, checkBackendReady(), ensureBackend() (+1 more)

### Community 32 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 33 - "irpf-validation.ts"
Cohesion: 0.19
Nodes (10): correctionsRepository, validationsRepository, checkDuplicate(), checkDuplicateByHash(), checkDuplicatesInBatch(), DuplicateCheckResult, deterministicKey(), IRPFValidationService (+2 more)

### Community 34 - "auth.service.ts"
Cohesion: 0.23
Nodes (6): authController, User, usersRepository, router, authService, emailService

### Community 35 - "api/src/repositories/account.repository.ts"
Cohesion: 0.60
Nodes (3): accountRepository, accountService, Account

### Community 36 - "api/src/repositories/category.repository.ts"
Cohesion: 0.60
Nodes (3): categoryRepository, categoryService, Category

### Community 37 - "api/src/repositories/history.repository.ts"
Cohesion: 0.60
Nodes (3): historyRepository, historyService, MonthlyHistory

### Community 38 - "api/src/repositories/vehicle-expense.repository.ts"
Cohesion: 0.60
Nodes (3): vehicleExpenseRepository, vehicleExpenseService, VehicleExpense

### Community 39 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 52 - "api/src/index.ts"
Cohesion: 0.15
Nodes (8): dotenv, nodemailer, dotenv@^16.4.5, nodemailer@^6.9.4, envPath, transporter, apiDirectory, envPath

### Community 53 - "IRPFDocuments"
Cohesion: 0.24
Nodes (10): ALLOWED_TYPES, getStatusColor(), IRPFDocuments(), confirmDocument(), handleDelete(), handleDrop(), handleFileUpload(), loadDocuments() (+2 more)

### Community 54 - "dependencies"
Cohesion: 0.17
Nodes (12): bcryptjs, jsonwebtoken, pdf-parse, sharp, @types/morgan, dependencies, bcryptjs@^2.4.3, express@^4.18.2 (+4 more)

### Community 55 - "express"
Cohesion: 0.38
Nodes (5): express, vehicleExpenseController, router, badRequest(), notFound()

### Community 56 - "IRPF"
Cohesion: 0.25
Nodes (9): useTax(), formatCurrency(), IRPF(), handleCreateExercise(), loadDashboard(), loadExercises(), loadSummary(), MetricCard() (+1 more)

### Community 57 - "api/src/controllers/salary.controller.ts"
Cohesion: 0.36
Nodes (4): salaryController, router, salaryRepository, salaryService

### Community 58 - "Header"
Cohesion: 0.43
Nodes (3): Header(), MainLayout(), Sidebar()

### Community 59 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 60 - "Assistant/index.jsx"
Cohesion: 0.53
Nodes (5): getSeverityIcon(), IRPFAssistant(), loadAnalysis(), IssueSection(), StatCard()

## Knowledge Gaps
- **1 isolated node(s):** `eslint:recommended`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `app/package.json` to `main.cjs`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **What connects `eslint:recommended` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiCall` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App.jsx` to `app/package.json`, `TaxIRPFContext.tsx`, `FinancialContext.tsx`, `IRPFDocuments`, `IRPF`, `Dashboard/index.jsx`, `Assistant/index.jsx`, `components.jsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `api/src/app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `api/src/app.ts`, `auth.service.ts`, `api/src/data/store.ts`, `irpf.controller.ts`, `api/package.json`, `dependencies`, `api/src/controllers/salary.controller.ts`, `pre-phase-3/src/app.ts`, `pre-phase-3/src/utils/http.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `api/src/data/store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._