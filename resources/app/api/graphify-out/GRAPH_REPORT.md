# Graph Report - api  (2026-11-08)

## Corpus Check
- 1025 files · ~1,471,544 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 163 file(s) not represented in the graph (top: .db-shm 80, .db-wal 80, .sqlite-shm 1)

## Summary
- 548 nodes · 1261 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f63bebee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- irpf.controller.ts
- file-processor.ts
- db.ts
- src/index.ts
- csv-import.service.ts
- email.service.ts
- migrations.ts
- package.json
- ref_fs
- document-reader.ts
- dependencies
- compilerOptions
- schemas/validation.ts
- AssistantService
- auth.service.ts
- scripts
- *
- yamljs.d.ts
- irpf.controller.ts
- financial-http-isolation.test.ts
- ref_node_assert
- dependents.repository.test.ts
- two-user.isolation.test.ts
- utils/validation.ts
- ownership.isolation.test.ts

## God Nodes (most connected - your core abstractions)
1. `badRequest()` - 31 edges
2. `getDatabase()` - 30 edges
3. `express` - 24 edges
4. `logger` - 21 edges
5. `notFound()` - 18 edges
6. `parseCsvPreview()` - 16 edges
7. `MailtrapEmailProvider` - 15 edges
8. `AssistantService` - 15 edges
9. `processFile()` - 13 edges
10. `readUserData()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `runDiagnostic()` --calls--> `getDatabase()`  [EXTRACTED]
  diagnose-resend.ts → src/database/db.ts
- `resetData()` --calls--> `writeUserData()`  [EXTRACTED]
  src/__tests__/csv-import.test.ts → src/data/store.ts
- `initializeDatabase()` --calls--> `getDatabase()`  [EXTRACTED]
  src/database/index.ts → src/database/db.ts
- `FileExtractionResult` --references--> `HoleriteData`  [EXTRACTED]
  src/services/file-processor.ts → src/services/holerite-reader.ts
- `migrateJsonToSqlite()` --calls--> `readLegacyData()`  [EXTRACTED]
  src/database/json-to-sqlite.ts → src/data/store.ts

## Import Cycles
- None detected.

## Communities (28 total, 5 thin omitted)

### Community 0 - "irpf.controller.ts"
Cohesion: 0.09
Nodes (27): express, allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, categoryController (+19 more)

### Community 1 - "file-processor.ts"
Cohesion: 0.09
Nodes (28): tesseract.js@^7.0.0, tesseract.js, ConsolidatedHolerite, calculateConfidence(), DocumentTypeResult, extractBankStatementFields(), ExtractedField, extractGenericFields() (+20 more)

### Community 2 - "db.ts"
Cohesion: 0.09
Nodes (32): backupDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), alertsRepository, assetsRepository, deductionsRepository (+24 more)

### Community 3 - "src/index.ts"
Cohesion: 0.18
Nodes (6): dotenv@^16.4.5, dotenv, envPath, transporter, apiDirectory, envPath

### Community 4 - "csv-import.service.ts"
Cohesion: 0.14
Nodes (32): normalizeOwnerData(), readRawObject(), readUserData(), writeUserData(), buildDuplicateHash(), buildDuplicateMatchKey(), buildSuggestedMapping(), classifyTransaction() (+24 more)

### Community 5 - "email.service.ts"
Cohesion: 0.09
Nodes (18): nodemailer, BrevoEmailProvider, classifyError(), EmailDiagnostic, EmailErrorType, EmailMessage, EmailProvider, EmailResult (+10 more)

### Community 6 - "migrations.ts"
Cohesion: 0.08
Nodes (37): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), OwnerData, readLegacyData() (+29 more)

### Community 7 - "package.json"
Cohesion: 0.11
Nodes (26): devDependencies, @eslint/js@^10.0.1, globals@^17.14.0, ts-node@^10.9.1, tsx@^3.12.7, @types/better-sqlite3@^9.6.0, @types/cors@^2.8.19, @types/express@^4.17.17 (+18 more)

### Community 8 - "ref_fs"
Cohesion: 0.10
Nodes (11): text, tmpFilePath, result, text, validation, base64Content, fileContent, fileStats (+3 more)

### Community 9 - "document-reader.ts"
Cohesion: 0.15
Nodes (7): DocumentExtractionResult, documentReaderManager, ExtractedField, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 10 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, cors@^2.8.5, express@^4.18.2, jsonwebtoken@^9.0.0, mailtrap@^6.1.0, morgan@^1.10.1, nodemailer@^6.9.4, pdf-parse@^2.4.5 (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, rootDir (+5 more)

### Community 12 - "schemas/validation.ts"
Cohesion: 0.15
Nodes (11): joi@^17.12.0, joi, accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, accountSchema (+3 more)

### Community 13 - "AssistantService"
Cohesion: 0.12
Nodes (9): db, db, rows, better-sqlite3@^13.0.3, better-sqlite3, AssistantAnalysis, AssistantCheckitem, AssistantIssue (+1 more)

### Community 14 - "auth.service.ts"
Cohesion: 0.26
Nodes (6): runDiagnostic(), authController, User, usersRepository, authService, emailService

### Community 15 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 16 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

### Community 20 - "irpf.controller.ts"
Cohesion: 0.12
Nodes (32): createAsset(), deleteAsset(), getAssetById(), getAssets(), updateAsset(), createDeduction(), deleteDeduction(), getDeductionById() (+24 more)

### Community 21 - "financial-http-isolation.test.ts"
Cohesion: 0.15
Nodes (6): bcryptjs@^2.4.3, bcryptjs, login(), root, createUser(), root

### Community 23 - "dependents.repository.test.ts"
Cohesion: 0.22
Nodes (5): db, dbPath, dependentA, dependentB, dataDir

### Community 24 - "two-user.isolation.test.ts"
Cohesion: 0.25
Nodes (3): api(), assertNoAccess(), idsA

### Community 25 - "utils/validation.ts"
Cohesion: 0.43
Nodes (4): TripType, validateCategoryPayload(), validateHistorySummary(), validateVehicleExpense()

### Community 26 - "ownership.isolation.test.ts"
Cohesion: 0.40
Nodes (4): db, dbPath, dependentB, now

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `irpf.controller.ts` to `dependencies`, `irpf.controller.ts`, `auth.service.ts`, `package.json`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `irpf.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08865248226950355 - nodes in this community are weakly interconnected._
- **Why does `logger` connect `migrations.ts` to `irpf.controller.ts`, `file-processor.ts`, `db.ts`, `email.service.ts`, `document-reader.ts`, `AssistantService`, `auth.service.ts`, `irpf.controller.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `file-processor.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0915915915915916 - nodes in this community are weakly interconnected._
- **Why does `better-sqlite3` connect `AssistantService` to `db.ts`, `email.service.ts`, `migrations.ts`, `package.json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09433962264150944 - nodes in this community are weakly interconnected._
- **Should `csv-import.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13903743315508021 - nodes in this community are weakly interconnected._