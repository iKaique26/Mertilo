# Graph Report - api  (2026-11-06)

## Corpus Check
- 486 files · ~154,928 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 165 file(s) not represented in the graph (top: .db-shm 81, .db-wal 81, .sqlite-shm 1)

## Summary
- 506 nodes · 1108 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b45caff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- irpf.controller.ts
- file-processor.ts
- db.ts
- ownership.isolation.test.ts
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

## God Nodes (most connected - your core abstractions)
1. `badRequest()` - 31 edges
2. `getDatabase()` - 27 edges
3. `express` - 24 edges
4. `logger` - 21 edges
5. `notFound()` - 18 edges
6. `parseCsvPreview()` - 15 edges
7. `AssistantService` - 14 edges
8. `readData()` - 13 edges
9. `processFile()` - 13 edges
10. `compilerOptions` - 12 edges

## Surprising Connections (you probably didn't know these)
- `resetData()` --calls--> `writeData()`  [EXTRACTED]
  src/__tests__/csv-import.test.ts → src/data/store.ts
- `migrateJsonToSqlite()` --calls--> `readData()`  [EXTRACTED]
  src/database/json-to-sqlite.ts → src/data/store.ts
- `initializeDatabase()` --calls--> `getDatabase()`  [EXTRACTED]
  src/database/index.ts → src/database/db.ts
- `FileExtractionResult` --references--> `HoleriteData`  [EXTRACTED]
  src/services/file-processor.ts → src/services/holerite-reader.ts
- `confirmCsvImport()` --calls--> `readData()`  [EXTRACTED]
  src/services/csv-import.service.ts → src/data/store.ts

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "irpf.controller.ts"
Cohesion: 0.08
Nodes (45): express, allowedOrigins, app, configuredOrigins, __dirname, swaggerDocument, accountController, authController (+37 more)

### Community 1 - "file-processor.ts"
Cohesion: 0.06
Nodes (44): tesseract.js@^7.0.0, tesseract.js, ConsolidatedHolerite, checkDuplicate(), checkDuplicateByHash(), checkDuplicatesInBatch(), DuplicateCheckResult, calculateConfidence() (+36 more)

### Community 2 - "db.ts"
Cohesion: 0.09
Nodes (39): backupDatabase(), getDatabase(), getDatabasePath(), moduleDir, withTransaction(), alertsRepository, assetsRepository, correctionsRepository (+31 more)

### Community 3 - "ownership.isolation.test.ts"
Cohesion: 0.06
Nodes (21): dotenv@^16.4.5, dotenv, envPath, transporter, apiDirectory, envPath, db, dbPath (+13 more)

### Community 4 - "csv-import.service.ts"
Cohesion: 0.12
Nodes (36): DATA_FILE, DEFAULT_CATEGORIES, defaultData(), ensureDataFile(), moduleDir, normalizeData(), readData(), writeData() (+28 more)

### Community 5 - "email.service.ts"
Cohesion: 0.10
Nodes (20): nodemailer@^6.9.4, nodemailer, BrevoApiEmailProvider, EmailMessage, EmailProvider, EmailResult, MockEmailProvider, SmtpEmailProvider (+12 more)

### Community 6 - "migrations.ts"
Cohesion: 0.10
Nodes (26): db, db, rows, better-sqlite3@^13.0.3, better-sqlite3, closeDatabase(), initializeDatabase(), shutdownDatabase() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.11
Nodes (26): devDependencies, @eslint/js@^10.0.1, globals@^17.14.0, ts-node@^10.9.1, tsx@^3.12.7, @types/better-sqlite3@^9.6.0, @types/cors@^2.8.19, @types/express@^4.17.17 (+18 more)

### Community 8 - "ref_fs"
Cohesion: 0.09
Nodes (11): text, tmpFilePath, result, text, validation, base64Content, fileContent, fileStats (+3 more)

### Community 9 - "document-reader.ts"
Cohesion: 0.15
Nodes (7): DocumentExtractionResult, documentReaderManager, ExtractedField, HoleriteReader, IDocumentReader, RendimentosReader, TextExtractor

### Community 10 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, cors@^2.8.5, express@^4.18.2, morgan@^1.10.1, pdf-parse@^2.4.5, sharp@^0.35.4, swagger-ui-express@^5.0.0, @types/morgan@^1.9.10 (+8 more)

### Community 11 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 12 - "schemas/validation.ts"
Cohesion: 0.15
Nodes (11): joi@^17.12.0, joi, accountSchema, categorySchema, historySchema, salarySchema, vehicleExpenseSchema, accountSchema (+3 more)

### Community 14 - "auth.service.ts"
Cohesion: 0.20
Nodes (7): bcryptjs@^2.4.3, jsonwebtoken@^9.0.0, bcryptjs, jsonwebtoken, User, usersRepository, emailService

### Community 15 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, dev:ts-node, start, test

### Community 16 - "*"
Cohesion: 0.50
Nodes (4): *, bcryptjs, jsonwebtoken, nodemailer

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `irpf.controller.ts` to `dependencies`, `csv-import.service.ts`, `package.json`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `irpf.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08281573498964803 - nodes in this community are weakly interconnected._
- **Why does `logger` connect `file-processor.ts` to `irpf.controller.ts`, `db.ts`, `csv-import.service.ts`, `email.service.ts`, `migrations.ts`, `document-reader.ts`, `auth.service.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `file-processor.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05505952380952381 - nodes in this community are weakly interconnected._
- **Why does `better-sqlite3` connect `migrations.ts` to `file-processor.ts`, `db.ts`, `email.service.ts`, `package.json`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0855094726062468 - nodes in this community are weakly interconnected._
- **Should `ownership.isolation.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06086956521739131 - nodes in this community are weakly interconnected._