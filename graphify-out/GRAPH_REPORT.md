# Graph Report - Mertilo  (2026-11-28)

## Corpus Check
- 237 files · ~1,415,563 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 84 file(s) not represented in the graph (top: .pak 56, (none) 9, .csv 7)

## Summary
- 1462 nodes · 2798 edges · 105 communities (83 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2bfb69a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiCall
- auth.service.ts
- csv-import.service.ts
- verification-resend-concurrency.test.ts
- app/package.json
- AssistantService
- TaxIRPFContext.tsx
- email.service.ts
- phase-1.md
- migrations.ts
- Assistant/index.jsx
- app.ts
- converter.py
- api/package.json
- package.json
- .utf8_package.json
- steps
- irpf.controller.ts
- IRPFDependents
- HoleriteReader
- file-processor.ts
- .eslintrc.json
- compilerOptions
- dependencies
- irpf-validation.ts
- Dashboard/index.jsx
- Template Conversion Rules
- designSystem.js
- Agent Skill: Principal UI/UX Architect & Motion Choreographer (Awwwards-Tier)
- Getting Started
- financial-http-isolation.test.ts
- vercel.json
- store.ts
- irpf/types/index.ts
- irpf.controller.ts
- main.cjs
- App.jsx
- Header.jsx
- *
- AGENTS.md
- 2. ESTRUTURA OBRIGATÓRIA DO RELATÓRIO
- CLAUDE.md
- .claude/CLAUDE.md
- api/src/yamljs.d.ts
- How to Migrate Email Templates to Mailtrap
- IRPFDocuments
- dependencies
- Strix Cloud (managed, no local infra)
- Quick reference
- ref_fs
- Receiving emails (Mailtrap Inbound Email)
- scripts
- Quick reference
- main.test.jsx
- logger.ts
- express
- test-holerite.js
- Managing Mailtrap contacts
- Quick reference
- financial-http-isolation.test.ts
- better-sqlite3
- confirmCsvImport
- api/src/utils/validation.ts
- legal-documents.ts
- ref_node_fs
- AuthProvider
- Response
- Converting email templates
- policy
- schemas/validation.ts
- ImportacaoFinanceira/index.jsx
- penetration-testing-with-strix/SKILL.md
- Authorizing Mailtrap API requests
- csvDetection.ts
- Test_segurança_site.ps1
- salary.controller.ts
- json-to-sqlite.ts
- Setting up a Mailtrap sending domain
- holerite-reader.ts
- ci-security-scanning-with-strix/SKILL.md
- Find security vulnerabilities in code
- vite-env.d.ts
- Security-test an API
- Application security testing
- Fix Strix findings and verify
- Test against the OWASP Top 10
- Pentest a web application
- Arquitetura
- consolidation.ts
- ocr-service.ts
- account.controller.ts
- two-user.isolation.test.ts
- SqliteSyncError
- mailtrap

## God Nodes (most connected - your core abstractions)
1. `apiCall()` - 59 edges
2. `react` - 38 edges
3. `App()` - 32 edges
4. `getDatabase()` - 31 edges
5. `badRequest()` - 31 edges
6. `lucide-react` - 31 edges
7. `express` - 25 edges
8. `react-router-dom` - 23 edges
9. `logger` - 22 edges
10. `Dashboard()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Backend IRPF — Fase 8.3` --references--> `requireAuth()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/api/src/middleware/auth.middleware.ts
- `Integração` --references--> `TaxProvider()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/context/TaxIRPFContext.tsx
- `Integração` --references--> `useTax()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/context/TaxIRPFContext.tsx
- `Integração` --references--> `IRPF()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/pages/index.jsx
- `Integração` --references--> `apiCall()`  [INFERRED]
  docs/ARCHITECTURE.md → resources/app/src/modules/irpf/services/client.ts

## Import Cycles
- None detected.

## Communities (105 total, 22 thin omitted)

### Community 0 - "apiCall"
Cohesion: 0.11
Nodes (32): Integração, useTax(), getAlertDescription(), IRPFAlerts(), loadAlerts(), resolveAlert(), IRPFAssets(), handleAddAsset() (+24 more)

### Community 1 - "auth.service.ts"
Cohesion: 0.16
Nodes (8): runDiagnostic(), User, usersRepository, authService, _databaseWriteQueue, _resendVerificationMutexes, emailService, setup()

### Community 2 - "csv-import.service.ts"
Cohesion: 0.14
Nodes (24): buildDuplicateHash(), buildDuplicateMatchKey(), buildSuggestedMapping(), classifyTransaction(), CompensationRecoveryResult, CsvImportPreview, CsvRow, DEFAULT_CATEGORIES (+16 more)

### Community 3 - "verification-resend-concurrency.test.ts"
Cohesion: 0.11
Nodes (17): assertRealOverlap(), first(), formatTimeline(), GateDb, nowMs(), outcomeOf(), RaceCall, RaceChild (+9 more)

### Community 4 - "app/package.json"
Cohesion: 0.06
Nodes (46): RFC-4180, eslint, jsdom, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, vite, @vitejs/plugin-react (+38 more)

### Community 6 - "TaxIRPFContext.tsx"
Cohesion: 0.18
Nodes (6): initialState, TaxAction, TaxContext, TaxProvider(), taxReducer(), TaxState

### Community 7 - "email.service.ts"
Cohesion: 0.08
Nodes (20): nodemailer, nodemailer@^6.9.4, BrevoEmailProvider, classifyError(), EmailDiagnostic, EmailError, EmailErrorType, EmailMessage (+12 more)

### Community 8 - "phase-1.md"
Cohesion: 0.07
Nodes (29): 1. Arquivo `__tests__/business-rules.test.ts` não existe, 1. Remoção: `resources/app/api/src/utils/response.ts`, 2. Remoção: `resources/app/electron/main.js`, 2. Vulnerabilidades detectadas no audit, 3. Remoção: Dependências npm não utilizadas, 4. Modificação: `resources/app/src/main.jsx`, Arquivos Modificados, Arquivos Removidos (+21 more)

### Community 9 - "migrations.ts"
Cohesion: 0.18
Nodes (16): closeDatabase(), initializeDatabase(), shutdownDatabase(), columnExists(), __dirname, ensureLegacyUserColumns(), ensureUserIdColumn(), executeMigration() (+8 more)

### Community 10 - "Assistant/index.jsx"
Cohesion: 0.53
Nodes (5): getSeverityIcon(), IRPFAssistant(), loadAnalysis(), IssueSection(), StatCard()

### Community 11 - "app.ts"
Cohesion: 0.12
Nodes (21): allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, authController, irpfController, authRateLimiter (+13 more)

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
Cohesion: 0.09
Nodes (37): backupDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), alertsRepository, assetsRepository, correctionsRepository (+29 more)

### Community 18 - "IRPFDependents"
Cohesion: 0.53
Nodes (5): IRPFDependents(), handleAddDependent(), handleDeleteDependent(), loadDependents(), validateCPF()

### Community 19 - "HoleriteReader"
Cohesion: 0.15
Nodes (7): DocumentExtractionResult, documentReaderManager, ExtractedField, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 20 - "file-processor.ts"
Cohesion: 0.23
Nodes (13): calculateConfidence(), DocumentTypeResult, extractBankStatementFields(), ExtractedField, extractGenericFields(), extractIncomeStatementFields(), extractMedicalFields(), extractTextFromPDF() (+5 more)

### Community 21 - ".eslintrc.json"
Cohesion: 0.13
Nodes (14): eslint:recommended, env, browser, es2021, node, extends, parserOptions, ecmaVersion (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, rootDir (+5 more)

### Community 23 - "dependencies"
Cohesion: 0.33
Nodes (6): react-dom, dependencies, lucide-react@^1.41.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^7.18.3

### Community 24 - "irpf-validation.ts"
Cohesion: 0.23
Nodes (8): checkDuplicate(), checkDuplicateByHash(), checkDuplicatesInBatch(), DuplicateCheckResult, deterministicKey(), IRPFValidationService, isNumberLike(), safeParse()

### Community 25 - "Dashboard/index.jsx"
Cohesion: 0.06
Nodes (55): ConfirmDialog(), FormModal(), EmptyState(), ErrorState(), Loading(), Skeleton(), SkeletonCard(), SkeletonGrid() (+47 more)

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

### Community 30 - "financial-http-isolation.test.ts"
Cohesion: 0.14
Nodes (7): bcryptjs, bcryptjs@^2.4.3, login(), root, createVerifiedUser(), createUser(), root

### Community 32 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 33 - "store.ts"
Cohesion: 0.24
Nodes (20): acquireFileLock(), DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), isProcessDead(), moduleDir, normalizeData() (+12 more)

### Community 34 - "irpf/types/index.ts"
Cohesion: 0.18
Nodes (10): Account, AppData, Category, FinancialAction, FinancialImportHistoryEntry, FinancialState, ImportedFinancialTransaction, MonthlyHistory (+2 more)

### Community 35 - "irpf.controller.ts"
Cohesion: 0.23
Nodes (22): createAsset(), deleteAsset(), getAssetById(), getAssets(), updateAsset(), createDeduction(), deleteDeduction(), getDeductionById() (+14 more)

### Community 36 - "main.cjs"
Cohesion: 0.13
Nodes (9): base64Content, fileContent, fileStats, options, payload, req, checkBackendReady(), ensureBackend() (+1 more)

### Community 37 - "App.jsx"
Cohesion: 0.18
Nodes (14): lucide-react, react, react-router-dom, RequireAuth(), AuthContext, ALLOWED_TYPES, API_BASE_URL, RequestOptions (+6 more)

### Community 38 - "Header.jsx"
Cohesion: 0.24
Nodes (7): Header(), pageMetadata, periodOptions, STORAGE_KEYS, MainLayout(), formatCurrency(), Sidebar()

### Community 39 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 41 - "2. ESTRUTURA OBRIGATÓRIA DO RELATÓRIO"
Cohesion: 0.11
Nodes (18): 1. REGRA OBRIGATÓRIA, 2.10. Veredito técnico, 2.1. Identificação da tarefa, 2.2. Diagnóstico inicial, 2.3. Arquivos modificados e criados, 2.4. Implementação técnica, 2.5. Segurança e integridade, 2.6. Testes realizados (+10 more)

### Community 52 - "How to Migrate Email Templates to Mailtrap"
Cohesion: 0.12
Nodes (16): From Amazon SES, From Brevo, From Mailgun, From Mandrill, From Postmark, From SendGrid, How to Migrate Email Templates to Mailtrap, Prerequisites (+8 more)

### Community 53 - "IRPFDocuments"
Cohesion: 0.23
Nodes (9): getStatusColor(), IRPFDocuments(), confirmDocument(), handleDelete(), handleDrop(), handleFileUpload(), loadDocuments(), uploadFile() (+1 more)

### Community 54 - "dependencies"
Cohesion: 0.09
Nodes (22): cors, express-rate-limit, jsonwebtoken, morgan, pdf-parse, sharp, swagger-ui-express, tesseract.js (+14 more)

### Community 55 - "Strix Cloud (managed, no local infra)"
Cohesion: 0.12
Nodes (15): 0. Credits & top-ups, 1. Register the target as an asset, 2. Launch a scan, 3. Wait for completion, 4. Read findings, 5. Export & report, 6. PR reviews, 7. Continuous testing (schedules & webhooks) (+7 more)

### Community 56 - "Quick reference"
Cohesion: 0.12
Nodes (16): Choosing how to send, Common mistakes, Email API, Examples (`curl`), How to integrate (preference order), JSON body (non-template), JSON body (template), Overview (+8 more)

### Community 57 - "ref_fs"
Cohesion: 0.18
Nodes (4): text, tmpFilePath, dir, files

### Community 58 - "Receiving emails (Mailtrap Inbound Email)"
Cohesion: 0.12
Nodes (15): API base and auth, Common mistakes, Create an inbox, Endpoints, Forwarding rules, How to integrate (preference order), Overview, Quick reference (+7 more)

### Community 59 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 60 - "Quick reference"
Cohesion: 0.12
Nodes (15): API base, Common mistakes, Example API paths, Key parameters, Overview, Quick reference, Sandbox email address, SDKs (+7 more)

### Community 61 - "main.test.jsx"
Cohesion: 0.12
Nodes (26): App(), ConsentBanner(), ConsentPreferencesModal(), defaultPreferences, buildConsentRecord(), CONSENT_SCHEMA_VERSION, DEFAULT_PREFERENCES, FUNCTIONAL_STORAGE_KEYS (+18 more)

### Community 62 - "logger.ts"
Cohesion: 0.19
Nodes (8): financialIntegrationService, AssistantAnalysis, AssistantCheckitem, AssistantIssue, TaxAlert, taxIntelligenceService, logger, LogLevel

### Community 63 - "express"
Cohesion: 0.21
Nodes (9): Backend IRPF — Fase 8.3, express, categoryController, historyController, vehicleExpenseController, requireAuth(), router, router (+1 more)

### Community 64 - "test-holerite.js"
Cohesion: 0.25
Nodes (3): result, text, validation

### Community 65 - "Managing Mailtrap contacts"
Cohesion: 0.14
Nodes (13): Authorization, Bulk import (array of contacts), Campaigns use case, Common mistakes, Concepts, CRM and sync, Custom event (event name + payload), Endpoints (replace placeholders) (+5 more)

### Community 67 - "Quick reference"
Cohesion: 0.14
Nodes (13): API operations, Authorization, Common mistakes, Example (`curl`) — template send, Generating template HTML, Handlebars (supported patterns), Overview, Payload shape (+5 more)

### Community 68 - "financial-http-isolation.test.ts"
Cohesion: 0.10
Nodes (15): TEST_DIR, TEST_DIR, db, dbPath, dependentA, dependentB, dataDir, db (+7 more)

### Community 69 - "better-sqlite3"
Cohesion: 0.15
Nodes (9): db, tables, db, tables, better-sqlite3, db, db, rows (+1 more)

### Community 70 - "confirmCsvImport"
Cohesion: 0.28
Nodes (11): compensateSqliteBatch(), confirmCsvImport(), deleteImportedTransaction(), ensureCategory(), getMonthKey(), getPendingImportCompensations(), IncompleteImportCompensationError, rebuildImportedMonthHistory() (+3 more)

### Community 71 - "api/src/utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 72 - "legal-documents.ts"
Cohesion: 0.23
Nodes (11): currentLegalDocuments(), __dirname, __filename, getLegalDocument(), LEGAL_DOCUMENTS, LegalDocument, legalDocumentHash(), LegalDocumentsContainer (+3 more)

### Community 73 - "ref_node_fs"
Cohesion: 0.18
Nodes (8): dotenv, dotenv@^16.4.5, envPath, transporter, apiDirectory, envPath, shutdown(), start()

### Community 74 - "AuthProvider"
Cohesion: 0.67
Nodes (4): AuthProvider(), init(), safeTokenGet(), safeTokenRemove()

### Community 76 - "Converting email templates"
Cohesion: 0.17
Nodes (11): Converting email templates, Inline conversion (no file), Input, Purpose, Rules, Step 1: Detect mode, Step 2: Run the converter script, Step 3: Handle flags (Deep mode) (+3 more)

### Community 78 - "schemas/validation.ts"
Cohesion: 0.15
Nodes (11): joi, joi@^17.12.0, accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, accountSchema (+3 more)

### Community 79 - "ImportacaoFinanceira/index.jsx"
Cohesion: 0.22
Nodes (4): formatCurrency(), ImportacaoFinanceira(), previewFallback, financialImportService

### Community 80 - "penetration-testing-with-strix/SKILL.md"
Cohesion: 0.18
Nodes (10): Exit codes (headless), Option A — Open-source CLI (self-hosted), Option B — Managed cloud (no local infra), Prerequisites, Reading results, Reporting & next steps, Run a Strix pentest, Running a scan (+2 more)

### Community 81 - "Authorizing Mailtrap API requests"
Cohesion: 0.18
Nodes (10): API tokens, Auth headers (two equivalent forms), Authorizing Mailtrap API requests, Common mistakes, Overview, Quick reference, Recommended env var names, Resolving `account_id` automatically (+2 more)

### Community 82 - "csvDetection.ts"
Cohesion: 0.31
Nodes (7): detectDateFormat(), detectDelimiter(), detectEncoding(), detectHeaderRow(), escapeRegExp(), isValidDate(), parseMonetary()

### Community 83 - "Test_segurança_site.ps1"
Cohesion: 0.44
Nodes (10): Invoke-ModuleA_HttpRecon(), Invoke-ModuleB_FileExposure(), Invoke-ModuleC_GitAudit(), Invoke-ModuleD_FrontendAudit(), Invoke-ModuleE_ApiAudit(), Invoke-ModuleF_DocumentSecurity(), Invoke-ModuleG_InjectionAudit(), Invoke-SafeWebRequest() (+2 more)

### Community 84 - "salary.controller.ts"
Cohesion: 0.36
Nodes (4): salaryController, router, salaryRepository, salaryService

### Community 85 - "json-to-sqlite.ts"
Cohesion: 0.36
Nodes (6): cryptoRandomId(), getDbStats(), getJsonStats(), migrateJsonToSqlite(), MigrationStats, AppData

### Community 86 - "Setting up a Mailtrap sending domain"
Cohesion: 0.20
Nodes (9): Authorization, Automating setup (API and DNS providers), DNS provider guides (documentation), Important DNS caveat (proxied DNS), Overview, Setting up a Mailtrap sending domain, When not to use, When to use (+1 more)

### Community 87 - "holerite-reader.ts"
Cohesion: 0.39
Nodes (6): extractField(), FIELD_PATTERNS, FieldPattern, parseCurrency(), readHolerite(), validateAndCalculateConfidence()

### Community 88 - "ci-security-scanning-with-strix/SKILL.md"
Cohesion: 0.29
Nodes (6): GitHub Actions, Option A — Self-hosted OSS CLI in the runner, Option B — Managed platform (no runner infra), Optional: upload findings to GitHub code scanning, Other CI systems, Set up Strix in CI/CD

### Community 89 - "Find security vulnerabilities in code"
Cohesion: 0.29
Nodes (6): Complementary tooling, Find security vulnerabilities in code, Fix and verify, Read the results, Reviewing a pull request instead of the whole repo, Run it

### Community 92 - "Security-test an API"
Cohesion: 0.33
Nodes (5): 1. Gather what the agents need, 2. Run the scan, 3. Verify findings, 4. Fix, re-test, and keep it tested, Security-test an API

### Community 93 - "Application security testing"
Cohesion: 0.33
Nodes (5): 1. Map the assets, 2. Pick the right test per asset, 3. Consolidate into one plan, 4. Be honest about coverage, Application security testing

### Community 94 - "Fix Strix findings and verify"
Cohesion: 0.33
Nodes (5): 1. Triage, 2. Fix, 3. Verify by re-running Strix, 4. Report, Fix Strix findings and verify

### Community 95 - "Test against the OWASP Top 10"
Cohesion: 0.33
Nodes (5): Report honestly, Run it, Test against the OWASP Top 10, Then fix and re-test, What is and is not testable by an agent

### Community 96 - "Pentest a web application"
Cohesion: 0.33
Nodes (5): 1. Confirm authorization and scope, 2. Run the scan, 3. Review results, 4. Fix and verify, Pentest a web application

### Community 97 - "Arquitetura"
Cohesion: 0.33
Nodes (5): Arquitetura, Dependências compartilhadas, Estado anterior, Limites desta etapa, Organização atual

### Community 99 - "consolidation.ts"
Cohesion: 0.33
Nodes (3): ConsolidatedHolerite, FileExtractionResult, HoleriteData

### Community 100 - "ocr-service.ts"
Cohesion: 0.40
Nodes (4): detectIfScannedPDF(), extractTextFromImage(), loadTesseract(), OCRResult

### Community 102 - "two-user.isolation.test.ts"
Cohesion: 0.50
Nodes (3): api(), assertNoAccess(), idsA

## Knowledge Gaps
- **2 isolated node(s):** `eslint:recommended`, `RFC-4180`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 640 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireAuth()` connect `express` to `auth.service.ts`, `account.controller.ts`, `confirmCsvImport`, `app.ts`, `salary.controller.ts`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **What connects `eslint:recommended`, `RFC-4180` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiCall` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Why does `Arquitetura` connect `Arquitetura` to `apiCall`, `express`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Should `csv-import.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Why does `Backend IRPF — Fase 8.3` connect `express` to `Arquitetura`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Should `verification-resend-concurrency.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._