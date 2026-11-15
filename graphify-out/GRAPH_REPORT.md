# Graph Report - Mertilo  (2026-11-14)

## Corpus Check
- 1512 files · ~3,900,663 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 242 file(s) not represented in the graph (top: .db-shm 80, .db-wal 80, .pak 56)

## Summary
- 1356 nodes · 2671 edges · 90 communities (68 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0e6830b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiCall
- legal-documents.ts
- csv-import.service.ts
- api/src/utils/logger.ts
- app/package.json
- AssistantService
- test-upload.js
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
- irpf.controller.ts
- pre-phase-3/src/data/store.ts
- HoleriteReader
- file-processor.ts
- .eslintrc.json
- compilerOptions
- dependencies
- holerite-reader.ts
- Dashboard/index.jsx
- Template Conversion Rules
- designSystem.js
- Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)
- Getting Started
- auth.service.ts
- vercel.json
- duplicate-detector.ts
- TaxIRPFContext.tsx
- rateLimiter.ts
- ref_fs
- react
- Sidebar.jsx
- *
- AGENTS.md
- pre-phase-3/src/yamljs.d.ts
- CLAUDE.md
- .claude/CLAUDE.md
- api/src/yamljs.d.ts
- How to Migrate Email Templates to Mailtrap
- IRPFDocuments
- dependencies
- api/src/services/salary.service.ts
- Quick reference
- pre-phase-3/src/schemas/validation.ts
- Receiving emails (Mailtrap Inbound Email)
- scripts
- Quick reference
- PrivacyContext.jsx
- main.cjs
- App.jsx
- consolidation.ts
- Managing Mailtrap contacts
- Quick reference
- financial-http-isolation.test.ts
- pre-phase-3/src/types.ts
- irpf.controller.ts
- api/src/utils/validation.ts
- pre-phase-3/src/repositories/vehicle-expense.repository.ts
- api/src/index.ts
- pre-phase-3/src/repositories/history.repository.ts
- Response
- Converting email templates
- policy
- sharp
- ImportacaoFinanceira/index.jsx
- irpf/types/index.ts
- Authorizing Mailtrap API requests
- Arquitetura
- Test_segurança_site.ps1
- pre-phase-3/src/utils/validation.ts
- Setting up a Mailtrap sending domain
- test-holerite.js
- api/src/utils/schema.ts
- vite-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `apiCall()` - 59 edges
2. `express` - 37 edges
3. `react` - 33 edges
4. `App()` - 32 edges
5. `badRequest()` - 31 edges
6. `getDatabase()` - 30 edges
7. `lucide-react` - 28 edges
8. `react-router-dom` - 23 edges
9. `logger` - 22 edges
10. `Dashboard()` - 20 edges

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

## Communities (90 total, 22 thin omitted)

### Community 0 - "apiCall"
Cohesion: 0.12
Nodes (29): AuthProvider(), init(), getAlertDescription(), IRPFAlerts(), loadAlerts(), resolveAlert(), IRPFAssets(), handleAddAsset() (+21 more)

### Community 1 - "legal-documents.ts"
Cohesion: 0.23
Nodes (11): currentLegalDocuments(), __dirname, __filename, getLegalDocument(), LEGAL_DOCUMENTS, LegalDocument, legalDocumentHash(), LegalDocumentsContainer (+3 more)

### Community 2 - "csv-import.service.ts"
Cohesion: 0.10
Nodes (44): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), normalizeOwnerData(), OwnerData (+36 more)

### Community 3 - "api/src/utils/logger.ts"
Cohesion: 0.19
Nodes (8): financialIntegrationService, AssistantAnalysis, AssistantCheckitem, AssistantIssue, TaxAlert, taxIntelligenceService, logger, LogLevel

### Community 4 - "app/package.json"
Cohesion: 0.07
Nodes (38): eslint, jsdom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, vite, @vitejs/plugin-react, vitest (+30 more)

### Community 6 - "test-upload.js"
Cohesion: 0.25
Nodes (6): base64Content, fileContent, fileStats, options, payload, req

### Community 7 - "email.service.ts"
Cohesion: 0.08
Nodes (20): nodemailer, nodemailer@^6.9.4, BrevoEmailProvider, classifyError(), EmailDiagnostic, EmailError, EmailErrorType, EmailMessage (+12 more)

### Community 8 - "phase-1.md"
Cohesion: 0.07
Nodes (29): 1. Arquivo `__tests__/business-rules.test.ts` não existe, 1. Remoção: `resources/app/api/src/utils/response.ts`, 2. Remoção: `resources/app/electron/main.js`, 2. Vulnerabilidades detectadas no audit, 3. Remoção: Dependências npm não utilizadas, 4. Modificação: `resources/app/src/main.jsx`, Arquivos Modificados, Arquivos Removidos (+21 more)

### Community 9 - "migrations.ts"
Cohesion: 0.08
Nodes (31): db, tables, db, tables, better-sqlite3, db, db, rows (+23 more)

### Community 10 - "joi"
Cohesion: 0.15
Nodes (11): accountSchema, categorySchema, historySchema, vehicleExpenseSchema, joi, joi@^17.12.0, accountSchema, categorySchema (+3 more)

### Community 11 - "FinancialContext.tsx"
Cohesion: 0.14
Nodes (16): FinancialContext, FinancialProvider(), financialReducer(), initialState, financialService, Account, AppData, Category (+8 more)

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

### Community 17 - "irpf.controller.ts"
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

### Community 23 - "dependencies"
Cohesion: 0.33
Nodes (6): react-dom, dependencies, lucide-react@^1.41.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^7.18.3

### Community 24 - "holerite-reader.ts"
Cohesion: 0.39
Nodes (6): extractField(), FIELD_PATTERNS, FieldPattern, parseCurrency(), readHolerite(), validateAndCalculateConfidence()

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

### Community 30 - "auth.service.ts"
Cohesion: 0.16
Nodes (10): bcryptjs, runDiagnostic(), bcryptjs@^2.4.3, User, usersRepository, authService, emailService, login() (+2 more)

### Community 32 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 33 - "duplicate-detector.ts"
Cohesion: 0.38
Nodes (4): checkDuplicate(), checkDuplicateByHash(), checkDuplicatesInBatch(), DuplicateCheckResult

### Community 34 - "TaxIRPFContext.tsx"
Cohesion: 0.12
Nodes (16): Integração, initialState, TaxAction, TaxContext, TaxProvider(), taxReducer(), TaxState, useTax() (+8 more)

### Community 35 - "rateLimiter.ts"
Cohesion: 0.08
Nodes (33): Backend IRPF — Fase 8.3, allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, authController (+25 more)

### Community 36 - "ref_fs"
Cohesion: 0.18
Nodes (4): text, tmpFilePath, dir, files

### Community 37 - "react"
Cohesion: 0.23
Nodes (6): lucide-react, react, react-router-dom, AuthContext, API_BASE_URL, RequestOptions

### Community 38 - "Sidebar.jsx"
Cohesion: 0.24
Nodes (7): Header(), pageMetadata, periodOptions, STORAGE_KEYS, MainLayout(), formatCurrency(), Sidebar()

### Community 39 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 52 - "How to Migrate Email Templates to Mailtrap"
Cohesion: 0.12
Nodes (16): From Amazon SES, From Brevo, From Mailgun, From Mandrill, From Postmark, From SendGrid, How to Migrate Email Templates to Mailtrap, Prerequisites (+8 more)

### Community 53 - "IRPFDocuments"
Cohesion: 0.21
Nodes (10): ALLOWED_TYPES, getStatusColor(), IRPFDocuments(), confirmDocument(), handleDelete(), handleDrop(), handleFileUpload(), loadDocuments() (+2 more)

### Community 54 - "dependencies"
Cohesion: 0.10
Nodes (20): cors, express-rate-limit, jsonwebtoken, mailtrap, morgan, pdf-parse, swagger-ui-express, @types/morgan (+12 more)

### Community 56 - "Quick reference"
Cohesion: 0.12
Nodes (16): Choosing how to send, Common mistakes, Email API, Examples (`curl`), How to integrate (preference order), JSON body (non-template), JSON body (template), Overview (+8 more)

### Community 57 - "pre-phase-3/src/schemas/validation.ts"
Cohesion: 0.33
Nodes (5): accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema

### Community 58 - "Receiving emails (Mailtrap Inbound Email)"
Cohesion: 0.12
Nodes (15): API base and auth, Common mistakes, Create an inbox, Endpoints, Forwarding rules, How to integrate (preference order), Overview, Quick reference (+7 more)

### Community 59 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 60 - "Quick reference"
Cohesion: 0.12
Nodes (15): API base, Common mistakes, Example API paths, Key parameters, Overview, Quick reference, Sandbox email address, SDKs (+7 more)

### Community 61 - "PrivacyContext.jsx"
Cohesion: 0.13
Nodes (21): ConsentBanner(), ConsentPreferencesModal(), defaultPreferences, buildConsentRecord(), CONSENT_SCHEMA_VERSION, DEFAULT_PREFERENCES, FUNCTIONAL_STORAGE_KEYS, normalizeConsentRecord() (+13 more)

### Community 62 - "main.cjs"
Cohesion: 0.28
Nodes (3): checkBackendReady(), ensureBackend(), isPortInUse()

### Community 63 - "App.jsx"
Cohesion: 0.23
Nodes (14): App(), RequireAuth(), getSeverityIcon(), IRPFAssistant(), loadAnalysis(), IssueSection(), StatCard(), ForgotPassword() (+6 more)

### Community 64 - "consolidation.ts"
Cohesion: 0.33
Nodes (3): ConsolidatedHolerite, FileExtractionResult, HoleriteData

### Community 65 - "Managing Mailtrap contacts"
Cohesion: 0.14
Nodes (13): Authorization, Bulk import (array of contacts), Campaigns use case, Common mistakes, Concepts, CRM and sync, Custom event (event name + payload), Endpoints (replace placeholders) (+5 more)

### Community 67 - "Quick reference"
Cohesion: 0.14
Nodes (13): API operations, Authorization, Common mistakes, Example (`curl`) — template send, Generating template HTML, Handlebars (supported patterns), Overview, Payload shape (+5 more)

### Community 68 - "financial-http-isolation.test.ts"
Cohesion: 0.07
Nodes (17): envPath, transporter, db, dbPath, dependentA, dependentB, root, dataDir (+9 more)

### Community 69 - "pre-phase-3/src/types.ts"
Cohesion: 0.38
Nodes (5): accountRepository, categoryRepository, Account, AppData, Category

### Community 70 - "irpf.controller.ts"
Cohesion: 0.07
Nodes (45): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, categoryController, historyController (+37 more)

### Community 71 - "api/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 72 - "pre-phase-3/src/repositories/vehicle-expense.repository.ts"
Cohesion: 0.60
Nodes (3): vehicleExpenseRepository, vehicleExpenseService, VehicleExpense

### Community 73 - "api/src/index.ts"
Cohesion: 0.29
Nodes (6): dotenv, dotenv@^16.4.5, apiDirectory, envPath, shutdown(), start()

### Community 76 - "Converting email templates"
Cohesion: 0.17
Nodes (11): Converting email templates, Inline conversion (no file), Input, Purpose, Rules, Step 1: Detect mode, Step 2: Run the converter script, Step 3: Handle flags (Deep mode) (+3 more)

### Community 79 - "ImportacaoFinanceira/index.jsx"
Cohesion: 0.22
Nodes (4): formatCurrency(), ImportacaoFinanceira(), previewFallback, financialImportService

### Community 80 - "irpf/types/index.ts"
Cohesion: 0.18
Nodes (10): Account, AppData, Category, FinancialAction, FinancialImportHistoryEntry, FinancialState, ImportedFinancialTransaction, MonthlyHistory (+2 more)

### Community 81 - "Authorizing Mailtrap API requests"
Cohesion: 0.18
Nodes (10): API tokens, Auth headers (two equivalent forms), Authorizing Mailtrap API requests, Common mistakes, Overview, Quick reference, Recommended env var names, Resolving `account_id` automatically (+2 more)

### Community 82 - "Arquitetura"
Cohesion: 0.33
Nodes (5): Arquitetura, Dependências compartilhadas, Estado anterior, Limites desta etapa, Organização atual

### Community 83 - "Test_segurança_site.ps1"
Cohesion: 0.44
Nodes (10): Invoke-ModuleA_HttpRecon(), Invoke-ModuleB_FileExposure(), Invoke-ModuleC_GitAudit(), Invoke-ModuleD_FrontendAudit(), Invoke-ModuleE_ApiAudit(), Invoke-ModuleF_DocumentSecurity(), Invoke-ModuleG_InjectionAudit(), Invoke-SafeWebRequest() (+2 more)

### Community 84 - "pre-phase-3/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 86 - "Setting up a Mailtrap sending domain"
Cohesion: 0.20
Nodes (9): Authorization, Automating setup (API and DNS providers), DNS provider guides (documentation), Important DNS caveat (proxied DNS), Overview, Setting up a Mailtrap sending domain, When not to use, When to use (+1 more)

### Community 88 - "test-holerite.js"
Cohesion: 0.29
Nodes (3): result, text, validation

### Community 89 - "api/src/utils/schema.ts"
Cohesion: 0.40
Nodes (4): accountSchema, categorySchema, historySchema, vehicleExpenseSchema

## Knowledge Gaps
- **1 isolated node(s):** `eslint:recommended`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 547 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireAuth()` connect `rateLimiter.ts` to `csv-import.service.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **What connects `eslint:recommended` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiCall` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `Arquitetura` connect `Arquitetura` to `TaxIRPFContext.tsx`, `rateLimiter.ts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `csv-import.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10460992907801418 - nodes in this community are weakly interconnected._
- **Why does `Backend IRPF — Fase 8.3` connect `rateLimiter.ts` to `Arquitetura`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `app/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06538461538461539 - nodes in this community are weakly interconnected._