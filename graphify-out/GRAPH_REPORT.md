# Graph Report - Mertilo  (2026-11-08)

## Corpus Check
- 1198 files · ~2,923,086 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 242 file(s) not represented in the graph (top: .db-shm 80, .db-wal 80, .pak 56)

## Summary
- 1306 nodes · 2537 edges · 92 communities (74 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb33ccf9`
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
- converter.py
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
- Template Conversion Rules
- designSystem.js
- Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)
- Getting Started
- express
- vercel.json
- irpf/types/index.ts
- TaxIRPFContext.tsx
- api/src/controllers/salary.controller.ts
- ref_fs
- IRPFDependents
- Header.jsx
- *
- AGENTS.md
- pre-phase-3/src/yamljs.d.ts
- CLAUDE.md
- .claude/CLAUDE.md
- api/src/yamljs.d.ts
- How to Migrate Email Templates to Mailtrap
- IRPFDocuments
- dependencies
- pre-phase-3/src/controllers/vehicle-expense.controller.ts
- Quick reference
- Arquitetura
- Receiving emails (Mailtrap Inbound Email)
- scripts
- Quick reference
- api/src/schemas/validation.ts
- main.cjs
- api/src/data/store.ts
- financial-http-isolation.test.ts
- Managing Mailtrap contacts
- Quick reference
- dependencies
- pre-phase-3/src/types.ts
- pre-phase-3/src/utils/http.ts
- Assistant/index.jsx
- irpf-validation.ts
- holerite-reader.ts
- better-sqlite3
- api/src/utils/logger.ts
- Converting email templates
- policy
- ref_node_assert
- csv-import.test.ts
- api/src/index.ts
- Authorizing Mailtrap API requests
- database/index.ts
- Test_segurança_site.ps1
- pre-phase-3/src/utils/validation.ts
- api/src/utils/validation.ts
- Setting up a Mailtrap sending domain
- pre-phase-3/src/controllers/salary.controller.ts
- test-holerite.js
- api/src/utils/schema.ts
- vite-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `apiCall()` - 59 edges
2. `express` - 37 edges
3. `badRequest()` - 31 edges
4. `getDatabase()` - 30 edges
5. `react` - 28 edges
6. `App()` - 27 edges
7. `lucide-react` - 24 edges
8. `logger` - 21 edges
9. `react-router-dom` - 19 edges
10. `Dashboard()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Backend IRPF — Fase 8.3` --references--> `requireAuth()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/api/src/middleware/auth.middleware.ts
- `Integração` --references--> `apiCall()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/services/client.ts
- `Integração` --references--> `TaxProvider()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/context/TaxIRPFContext.tsx
- `Integração` --references--> `useTax()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/context/TaxIRPFContext.tsx
- `Integração` --references--> `IRPF()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/pages/index.jsx

## Import Cycles
- None detected.

## Communities (92 total, 18 thin omitted)

### Community 0 - "apiCall"
Cohesion: 0.14
Nodes (28): App(), AuthProvider(), init(), getAlertDescription(), IRPFAlerts(), loadAlerts(), resolveAlert(), IRPFAssets() (+20 more)

### Community 1 - "irpf.controller.ts"
Cohesion: 0.23
Nodes (22): createAsset(), deleteAsset(), getAssetById(), getAssets(), updateAsset(), createDeduction(), deleteDeduction(), getDeductionById() (+14 more)

### Community 2 - "csv-import.service.ts"
Cohesion: 0.19
Nodes (19): buildDuplicateHash(), buildDuplicateMatchKey(), buildSuggestedMapping(), classifyTransaction(), CsvImportPreview, DEFAULT_CATEGORIES, detectDelimiter(), getExistingImportedTransactions() (+11 more)

### Community 3 - "pre-phase-3/src/app.ts"
Cohesion: 0.14
Nodes (11): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, router, logger (+3 more)

### Community 4 - "app/package.json"
Cohesion: 0.07
Nodes (38): eslint, jsdom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, vite, @vitejs/plugin-react, vitest (+30 more)

### Community 6 - "api/src/app.ts"
Cohesion: 0.12
Nodes (21): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, irpfController, authRateLimiter, createRateLimiter() (+13 more)

### Community 7 - "email.service.ts"
Cohesion: 0.08
Nodes (20): nodemailer, nodemailer@^6.9.4, BrevoEmailProvider, classifyError(), EmailDiagnostic, EmailError, EmailErrorType, EmailMessage (+12 more)

### Community 8 - "phase-1.md"
Cohesion: 0.07
Nodes (29): 1. Arquivo `__tests__/business-rules.test.ts` não existe, 1. Remoção: `resources/app/api/src/utils/response.ts`, 2. Remoção: `resources/app/electron/main.js`, 2. Vulnerabilidades detectadas no audit, 3. Remoção: Dependências npm não utilizadas, 4. Modificação: `resources/app/src/main.jsx`, Arquivos Modificados, Arquivos Removidos (+21 more)

### Community 9 - "migrations.ts"
Cohesion: 0.23
Nodes (12): __dirname, ensureLegacyUserColumns(), ensureUserIdColumn(), executeMigration(), __filename, getAvailableMigrations(), getExecutedMigrations(), migrationRequirements (+4 more)

### Community 10 - "joi"
Cohesion: 0.15
Nodes (11): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, accountSchema, categorySchema, historySchema (+3 more)

### Community 11 - "FinancialContext.tsx"
Cohesion: 0.09
Nodes (20): FinancialContext, FinancialProvider(), financialReducer(), initialState, formatCurrency(), ImportacaoFinanceira(), previewFallback, financialService (+12 more)

### Community 12 - "converter.py"
Cohesion: 0.09
Nodes (18): _add_flag_warning(), Change, _comment_out_flagged(), ConversionResult, convert_brevo(), convert_file(), convert_mailgun(), convert_mandrill_handlebars() (+10 more)

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
Cohesion: 0.08
Nodes (41): backupDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), alertsRepository, assetsRepository, correctionsRepository (+33 more)

### Community 18 - "pre-phase-3/src/data/store.ts"
Cohesion: 0.24
Nodes (11): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), readData(), writeData() (+3 more)

### Community 19 - "HoleriteReader"
Cohesion: 0.15
Nodes (7): DocumentExtractionResult, documentReaderManager, ExtractedField, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 20 - "file-processor.ts"
Cohesion: 0.15
Nodes (19): tesseract.js, tesseract.js@^7.0.0, calculateConfidence(), DocumentTypeResult, extractBankStatementFields(), ExtractedField, extractGenericFields(), extractIncomeStatementFields() (+11 more)

### Community 21 - ".eslintrc.json"
Cohesion: 0.13
Nodes (14): eslint:recommended, env, browser, es2021, node, extends, parserOptions, ecmaVersion (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, rootDir (+5 more)

### Community 23 - "App.jsx"
Cohesion: 0.21
Nodes (10): lucide-react, react, react-router-dom, RequireAuth(), AuthContext, ALLOWED_TYPES, API_BASE_URL, RequestOptions (+2 more)

### Community 24 - "auth.service.ts"
Cohesion: 0.26
Nodes (6): runDiagnostic(), authController, User, usersRepository, authService, emailService

### Community 25 - "Dashboard/index.jsx"
Cohesion: 0.21
Nodes (25): EmptyState(), ErrorState(), Loading(), Skeleton(), SkeletonCard(), SkeletonGrid(), SkeletonRow(), AccountsPanel() (+17 more)

### Community 26 - "Template Conversion Rules"
Cohesion: 0.08
Nodes (24): API field changes (informational, not template-level), Auto-convertible patterns, Auto-convertible patterns, Auto-convertible patterns, Auto-convertible patterns, Auto-convertible patterns, Auto-convertible patterns, Auto-convertible patterns (+16 more)

### Community 27 - "designSystem.js"
Cohesion: 0.18
Nodes (10): borderRadius, breakpoints, colors, iconMap, iconSizes, shadows, spacing, transitions (+2 more)

### Community 28 - "Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)"
Cohesion: 0.11
Nodes (17): 1. Meta Information & Core Directive, 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS), 3. THE CREATIVE VARIANCE ENGINE, 4. HAPTIC MICRO-AESTHETICS (COMPONENT MASTERY), 5. MOTION CHOREOGRAPHY (FLUID DYNAMICS), 6. PERFORMANCE GUARDRAILS, 7. EXECUTION PROTOCOL, 8. PRE-OUTPUT CHECKLIST (+9 more)

### Community 29 - "Getting Started"
Cohesion: 0.22
Nodes (8): Building for Production, Features, Getting Started, Installation, License, Package the app for your platform, Prerequisites, Project Structure

### Community 30 - "express"
Cohesion: 0.20
Nodes (9): express, accountController, categoryController, historyController, vehicleExpenseController, requireAuth(), router, router (+1 more)

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
Cohesion: 0.36
Nodes (4): salaryController, router, salaryRepository, salaryService

### Community 36 - "ref_fs"
Cohesion: 0.20
Nodes (4): text, tmpFilePath, dir, files

### Community 37 - "IRPFDependents"
Cohesion: 0.53
Nodes (5): IRPFDependents(), handleAddDependent(), handleDeleteDependent(), loadDependents(), validateCPF()

### Community 38 - "Header.jsx"
Cohesion: 0.24
Nodes (7): Header(), pageMetadata, periodOptions, STORAGE_KEYS, MainLayout(), formatCurrency(), Sidebar()

### Community 39 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 52 - "How to Migrate Email Templates to Mailtrap"
Cohesion: 0.12
Nodes (16): From Amazon SES, From Brevo, From Mailgun, From Mandrill, From Postmark, From SendGrid, How to Migrate Email Templates to Mailtrap, Prerequisites (+8 more)

### Community 53 - "IRPFDocuments"
Cohesion: 0.23
Nodes (9): getStatusColor(), IRPFDocuments(), confirmDocument(), handleDelete(), handleDrop(), handleFileUpload(), loadDocuments(), uploadFile() (+1 more)

### Community 54 - "dependencies"
Cohesion: 0.10
Nodes (20): cors, express-rate-limit, jsonwebtoken, mailtrap, morgan, pdf-parse, sharp, @types/morgan (+12 more)

### Community 55 - "pre-phase-3/src/controllers/vehicle-expense.controller.ts"
Cohesion: 0.33
Nodes (5): vehicleExpenseController, router, vehicleExpenseRepository, vehicleExpenseService, VehicleExpense

### Community 56 - "Quick reference"
Cohesion: 0.12
Nodes (16): Choosing how to send, Common mistakes, Email API, Examples (`curl`), How to integrate (preference order), JSON body (non-template), JSON body (template), Overview (+8 more)

### Community 57 - "Arquitetura"
Cohesion: 0.29
Nodes (6): Arquitetura, Backend IRPF — Fase 8.3, Dependências compartilhadas, Estado anterior, Limites desta etapa, Organização atual

### Community 58 - "Receiving emails (Mailtrap Inbound Email)"
Cohesion: 0.12
Nodes (15): API base and auth, Common mistakes, Create an inbox, Endpoints, Forwarding rules, How to integrate (preference order), Overview, Quick reference (+7 more)

### Community 59 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 60 - "Quick reference"
Cohesion: 0.12
Nodes (15): API base, Common mistakes, Example API paths, Key parameters, Overview, Quick reference, Sandbox email address, SDKs (+7 more)

### Community 61 - "api/src/schemas/validation.ts"
Cohesion: 0.33
Nodes (5): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema

### Community 62 - "main.cjs"
Cohesion: 0.14
Nodes (9): base64Content, fileContent, fileStats, options, payload, req, checkBackendReady(), ensureBackend() (+1 more)

### Community 63 - "api/src/data/store.ts"
Cohesion: 0.27
Nodes (14): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), normalizeOwnerData(), OwnerData (+6 more)

### Community 64 - "financial-http-isolation.test.ts"
Cohesion: 0.15
Nodes (6): bcryptjs, bcryptjs@^2.4.3, login(), root, createUser(), root

### Community 65 - "Managing Mailtrap contacts"
Cohesion: 0.14
Nodes (13): Authorization, Bulk import (array of contacts), Campaigns use case, Common mistakes, Concepts, CRM and sync, Custom event (event name + payload), Endpoints (replace placeholders) (+5 more)

### Community 67 - "Quick reference"
Cohesion: 0.14
Nodes (13): API operations, Authorization, Common mistakes, Example (`curl`) — template send, Generating template HTML, Handlebars (supported patterns), Overview, Payload shape (+5 more)

### Community 68 - "dependencies"
Cohesion: 0.33
Nodes (6): react-dom, dependencies, lucide-react@^1.41.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^7.18.3

### Community 69 - "pre-phase-3/src/types.ts"
Cohesion: 0.38
Nodes (5): accountRepository, historyRepository, Account, AppData, MonthlyHistory

### Community 70 - "pre-phase-3/src/utils/http.ts"
Cohesion: 0.19
Nodes (9): categoryController, historyController, router, router, accountService, categoryService, historyService, badRequest() (+1 more)

### Community 71 - "Assistant/index.jsx"
Cohesion: 0.53
Nodes (5): getSeverityIcon(), IRPFAssistant(), loadAnalysis(), IssueSection(), StatCard()

### Community 72 - "irpf-validation.ts"
Cohesion: 0.23
Nodes (8): checkDuplicate(), checkDuplicateByHash(), checkDuplicatesInBatch(), DuplicateCheckResult, deterministicKey(), IRPFValidationService, isNumberLike(), safeParse()

### Community 73 - "holerite-reader.ts"
Cohesion: 0.20
Nodes (9): ConsolidatedHolerite, FileExtractionResult, extractField(), FIELD_PATTERNS, FieldPattern, HoleriteData, parseCurrency(), readHolerite() (+1 more)

### Community 74 - "better-sqlite3"
Cohesion: 0.15
Nodes (9): db, tables, db, tables, better-sqlite3, db, db, rows (+1 more)

### Community 75 - "api/src/utils/logger.ts"
Cohesion: 0.19
Nodes (8): financialIntegrationService, AssistantAnalysis, AssistantCheckitem, AssistantIssue, TaxAlert, taxIntelligenceService, logger, LogLevel

### Community 76 - "Converting email templates"
Cohesion: 0.17
Nodes (11): Converting email templates, Inline conversion (no file), Input, Purpose, Rules, Step 1: Detect mode, Step 2: Run the converter script, Step 3: Handle flags (Deep mode) (+3 more)

### Community 78 - "ref_node_assert"
Cohesion: 0.15
Nodes (4): __dirname, api(), assertNoAccess(), idsA

### Community 79 - "csv-import.test.ts"
Cohesion: 0.35
Nodes (11): readUserData(), writeUserData(), confirmCsvImport(), deleteImportedTransaction(), ensureCategory(), getMonthKey(), rebuildImportedMonthHistory(), requireUserId() (+3 more)

### Community 80 - "api/src/index.ts"
Cohesion: 0.12
Nodes (11): dotenv, dotenv@^16.4.5, envPath, transporter, apiDirectory, envPath, db, dbPath (+3 more)

### Community 81 - "Authorizing Mailtrap API requests"
Cohesion: 0.18
Nodes (10): API tokens, Auth headers (two equivalent forms), Authorizing Mailtrap API requests, Common mistakes, Overview, Quick reference, Recommended env var names, Resolving `account_id` automatically (+2 more)

### Community 82 - "database/index.ts"
Cohesion: 0.29
Nodes (9): closeDatabase(), initializeDatabase(), shutdownDatabase(), cryptoRandomId(), getDbStats(), getJsonStats(), migrateJsonToSqlite(), MigrationStats (+1 more)

### Community 83 - "Test_segurança_site.ps1"
Cohesion: 0.44
Nodes (10): Invoke-ModuleA_HttpRecon(), Invoke-ModuleB_FileExposure(), Invoke-ModuleC_GitAudit(), Invoke-ModuleD_FrontendAudit(), Invoke-ModuleE_ApiAudit(), Invoke-ModuleF_DocumentSecurity(), Invoke-ModuleG_InjectionAudit(), Invoke-SafeWebRequest() (+2 more)

### Community 84 - "pre-phase-3/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 85 - "api/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 86 - "Setting up a Mailtrap sending domain"
Cohesion: 0.20
Nodes (9): Authorization, Automating setup (API and DNS providers), DNS provider guides (documentation), Important DNS caveat (proxied DNS), Overview, Setting up a Mailtrap sending domain, When not to use, When to use (+1 more)

### Community 87 - "pre-phase-3/src/controllers/salary.controller.ts"
Cohesion: 0.38
Nodes (4): salaryController, router, salaryRepository, salaryService

### Community 88 - "test-holerite.js"
Cohesion: 0.29
Nodes (3): result, text, validation

### Community 89 - "api/src/utils/schema.ts"
Cohesion: 0.40
Nodes (4): accountSchema, categorySchema, historySchema, vehicleExpenseSchema

## Knowledge Gaps
- **1 isolated node(s):** `eslint:recommended`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 532 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arquitetura` connect `Arquitetura` to `TaxIRPFContext.tsx`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **What connects `eslint:recommended` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiCall` be split into smaller, more focused modules?**
  _Cohesion score 0.1425287356321839 - nodes in this community are weakly interconnected._
- **Why does `requireAuth()` connect `express` to `auth.service.ts`, `Arquitetura`, `api/src/controllers/salary.controller.ts`, `api/src/app.ts`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Should `pre-phase-3/src/app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Why does `Backend IRPF — Fase 8.3` connect `Arquitetura` to `express`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Should `app/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06538461538461539 - nodes in this community are weakly interconnected._