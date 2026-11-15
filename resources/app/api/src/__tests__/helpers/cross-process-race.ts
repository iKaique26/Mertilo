/**
 * Harness de teste (somente testes) para provar concorrência REAL entre processos sobre o
 * mesmo arquivo SQLite.
 *
 * Mecanismo:
 *  1. Dois processos filhos independentes (`spawn`, memórias separadas) importam o `dist` real,
 *     abrem a MESMA conexão de arquivo SQLite e instrumentam `db.exec` (apenas dentro do filho).
 *  2. Cada filho emite `ready` e aguarda o sinal de largada via stdin.
 *  3. O pai só libera a largada depois que os DOIS emitiram `ready` (barreira de prontidão) e,
 *     antes disso, segura um `BEGIN IMMEDIATE` no mesmo banco (portão de contenção).
 *  4. Os filhos disparam a operação ao mesmo instante (`startAt`), chegam ao `BEGIN IMMEDIATE`
 *     enquanto o pai segura o lock e ficam bloqueados ao mesmo tempo na entrada da região crítica.
 *  5. O pai só libera o lock depois que os DOIS registraram a tentativa de `BEGIN IMMEDIATE`.
 *
 * Nada aqui altera código de produção. Os eventos não carregam senha, token nem código.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type GateDb = import('better-sqlite3').Database;

export type RaceEvent = {
  ev: string;
  pid: number;
  t: number;
  sql?: string;
  changes?: number;
  ok?: boolean;
  message?: string;
};

export type RaceCall = { method: 'resetPassword' | 'resendVerification'; args: unknown[] };

export type RaceChild = {
  label: string;
  pid: number;
  events: RaceEvent[];
  exitCode: number | null;
  stderr: string;
};

export type RaceReport = {
  parentPid: number;
  children: [RaceChild, RaceChild];
  startAt: number;
  goSentAt: number;
  gateHeldAt: number;
  gateReleasedAt: number;
  gateTimedOut: boolean;
};

// Relógio de parede comum a todos os processos (comparável entre pai e filhos; resolução de 1 ms).
const nowMs = () => Date.now();
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CHILD_SCRIPT = `
import fs from 'node:fs';

const now = () => Date.now();
const emit = (ev, extra) => fs.writeSync(1, JSON.stringify({ ev, pid: process.pid, t: now(), ...extra }) + '\\n');

process.env.NODE_ENV = 'test';
process.env.EMAIL_PROVIDER = 'mock';
const call = JSON.parse(process.env.RACE_CALL);
const base = process.env.RACE_DIST_BASE;

const { authService } = await import(base + 'services/auth.service.js');
const { usersRepository } = await import(base + 'repositories/users.repository.js');
const { getDatabase, closeDatabase } = await import(base + 'database/db.js');

const db = getDatabase();
const originalExec = db.exec.bind(db);
db.exec = (sql) => {
  const tag = String(sql).trim().split(/\\s+/).slice(0, 2).join(' ').toUpperCase();
  const isTransactionControl = /^(BEGIN|COMMIT|ROLLBACK)/.test(tag);
  if (isTransactionControl) emit('sql-attempt', { sql: tag });
  const result = originalExec(sql);
  if (isTransactionControl) emit('sql-done', { sql: tag });
  return result;
};
const originalConsume = usersRepository.consumePasswordReset.bind(usersRepository);
usersRepository.consumePasswordReset = (...args) => {
  const changes = originalConsume(...args);
  emit('consume', { changes });
  return changes;
};

emit('ready');
const go = await new Promise((resolve) => {
  let buffer = '';
  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();
    const index = buffer.indexOf('\\n');
    if (index >= 0) { process.stdin.pause(); resolve(JSON.parse(buffer.slice(0, index))); }
  });
});

const coarse = go.startAt - now() - 5;
if (coarse > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, coarse);
while (now() < go.startAt) { /* espera ativa curta até o instante comum de largada */ }

emit('released');
emit('call-start');
let result;
try {
  await authService[call.method](...call.args);
  result = { ok: true };
} catch (error) {
  result = { ok: false, message: error?.message ?? String(error) };
}
emit('call-end', result);
try { closeDatabase(); } catch { /* ignore */ }
process.exit(0);
`;

function spawnChild(label: string, call: RaceCall, scriptPath: string, distBase: string, env: NodeJS.ProcessEnv) {
  const proc: ChildProcessWithoutNullStreams = spawn(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env: { ...env, RACE_CALL: JSON.stringify(call), RACE_DIST_BASE: distBase },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const child: RaceChild & { proc: ChildProcessWithoutNullStreams; closed: boolean; closedPromise: Promise<void> } = {
    label,
    pid: proc.pid ?? -1,
    events: [],
    exitCode: null,
    stderr: '',
    proc,
    closed: false,
    closedPromise: Promise.resolve(),
  };
  return child;
}

export async function runCrossProcessRace(options: {
  tempDir: string;
  gateDb: GateDb;
  calls: [RaceCall, RaceCall];
  gateTimeoutMs?: number;
  holdAfterAttemptsMs?: number;
}): Promise<RaceReport> {
  const gateTimeoutMs = options.gateTimeoutMs ?? 3000;
  const holdAfterAttemptsMs = options.holdAfterAttemptsMs ?? 150;
  const distDir = path.resolve(process.cwd(), 'dist');
  const distBase = pathToFileURL(distDir).href.replace(/\/?$/, '/');
  const scriptPath = path.join(options.tempDir, `race-child-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  fs.writeFileSync(scriptPath, CHILD_SCRIPT, 'utf8');

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MERTILO_DB_PATH: process.env.MERTILO_DB_PATH,
    MERTILO_DATA_DIR: process.env.MERTILO_DATA_DIR ?? options.tempDir,
  };

  const emitter = new EventEmitter();
  const children = options.calls.map((call, index) => spawnChild(index === 0 ? 'A' : 'B', call, scriptPath, distBase, env));

  for (const child of children) {
    let buffer = '';
    child.proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line.startsWith('{')) {
          try { child.events.push(JSON.parse(line) as RaceEvent); } catch { /* ignora linha inválida */ }
        }
        newline = buffer.indexOf('\n');
      }
      emitter.emit('evt');
    });
    child.proc.stderr.on('data', (chunk) => { child.stderr += chunk.toString(); });
    child.closedPromise = new Promise<void>((resolve) => {
      child.proc.on('error', (error) => { child.stderr += String(error); child.closed = true; emitter.emit('evt'); resolve(); });
      child.proc.on('close', (exitCode) => { child.exitCode = exitCode; child.closed = true; emitter.emit('evt'); resolve(); });
    });
  }

  const waitUntil = (condition: () => boolean, timeoutMs: number) => new Promise<boolean>((resolve) => {
    if (condition()) { resolve(true); return; }
    const cleanup = () => { clearTimeout(timer); emitter.off('evt', onEvent); };
    const onEvent = () => { if (condition()) { cleanup(); resolve(true); } };
    const timer = setTimeout(() => { cleanup(); resolve(false); }, timeoutMs);
    emitter.on('evt', onEvent);
  });

  const hasEvent = (child: RaceChild, ev: string, sql?: string) => child.events.some((e) => e.ev === ev && (sql === undefined || e.sql === sql));

  let gateHeldAt = 0;
  let goSentAt = 0;
  let startAt = 0;
  let gateReleasedAt = 0;
  let gateTimedOut = false;
  try {
    const ready = await waitUntil(() => children.every((c) => hasEvent(c, 'ready')) || children.some((c) => c.closed), 30000);
    assert.ok(ready && children.every((c) => hasEvent(c, 'ready')), `processos filhos não ficaram prontos: ${children.map((c) => c.stderr.slice(0, 200)).join(' | ')}`);

    // Portão de contenção: o pai segura o lock de escrita do MESMO arquivo SQLite antes da largada.
    options.gateDb.exec('BEGIN IMMEDIATE');
    gateHeldAt = nowMs();

    startAt = nowMs() + 400;
    goSentAt = nowMs();
    for (const child of children) child.proc.stdin.write(`${JSON.stringify({ startAt })}\n`);

    const attempted = await waitUntil(
      () => children.every((c) => hasEvent(c, 'sql-attempt', 'BEGIN IMMEDIATE')) || children.some((c) => c.closed),
      gateTimeoutMs + 400,
    );
    gateTimedOut = !(attempted && children.every((c) => hasEvent(c, 'sql-attempt', 'BEGIN IMMEDIATE')));
    if (!gateTimedOut) await sleep(holdAfterAttemptsMs);
  } finally {
    gateReleasedAt = nowMs();
    if (options.gateDb.inTransaction) options.gateDb.exec('COMMIT');
  }

  await Promise.all(children.map((c) => c.closedPromise));
  try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }

  return {
    parentPid: process.pid,
    children: children.map((c) => ({ label: c.label, pid: c.pid, events: c.events, exitCode: c.exitCode, stderr: c.stderr })) as [RaceChild, RaceChild],
    startAt,
    goSentAt,
    gateHeldAt,
    gateReleasedAt,
    gateTimedOut,
  };
}

export function outcomeOf(child: RaceChild) {
  const end = child.events.find((e) => e.ev === 'call-end');
  assert.ok(end, `filho ${child.label} não reportou resultado: ${child.stderr.slice(0, 300)}`);
  return { ok: end.ok === true, message: end.message };
}

const first = (child: RaceChild, ev: string, sql?: string) => child.events.find((e) => e.ev === ev && (sql === undefined || e.sql === sql));

/** Linhas de evidência temporal (ms relativos ao primeiro `ready`), seguras para log. */
export function formatTimeline(report: RaceReport) {
  const t0 = Math.min(...report.children.map((c) => first(c, 'ready')?.t ?? Infinity));
  const rel = (t: number | undefined) => (t === undefined ? 'n/a' : `${t - t0}ms`);
  const lines = [
    `parent pid=${report.parentPid} | children pids=${report.children.map((c) => c.pid).join(',')}`,
    `gate held=${rel(report.gateHeldAt)} go-sent=${rel(report.goSentAt)} startAt=${rel(report.startAt)} gate-released=${rel(report.gateReleasedAt)} timedOut=${report.gateTimedOut}`,
  ];
  for (const child of report.children) {
    const end = first(child, 'call-end');
    lines.push(
      `child ${child.label} pid=${child.pid}: ready=${rel(first(child, 'ready')?.t)} released=${rel(first(child, 'released')?.t)} ` +
      `call-start=${rel(first(child, 'call-start')?.t)} BEGIN-attempt=${rel(first(child, 'sql-attempt', 'BEGIN IMMEDIATE')?.t)} ` +
      `BEGIN-acquired=${rel(first(child, 'sql-done', 'BEGIN IMMEDIATE')?.t)} COMMIT-attempt=${rel(first(child, 'sql-attempt', 'COMMIT')?.t)} ` +
      `ROLLBACK-attempt=${rel(first(child, 'sql-attempt', 'ROLLBACK')?.t)} call-end=${rel(end?.t)} ` +
      `result=${end?.ok ? 'ok' : `fail(${end?.message})`}`,
    );
  }
  return lines;
}

/**
 * Verifica a prova de simultaneidade real. Deve ser chamada DEPOIS das asserções de integridade
 * do banco, para que uma proteção removida falhe primeiro por violação de integridade.
 */
export function assertRealOverlap(report: RaceReport, expectations: { loserMessage: RegExp }) {
  const [a, b] = report.children;

  // 1-3. Dois processos distintos, independentes do processo de teste, ambos encerrados com sucesso.
  assert.notEqual(a.pid, b.pid, 'os filhos devem ser processos distintos');
  assert.ok(a.pid !== report.parentPid && b.pid !== report.parentPid, 'filhos não podem ser o processo do teste');
  for (const child of report.children) assert.equal(child.exitCode, 0, `filho ${child.label} falhou: ${child.stderr.slice(0, 300)}`);

  // 5-6. Barreira de prontidão: os DOIS estavam prontos antes da largada.
  for (const child of report.children) {
    const ready = first(child, 'ready');
    assert.ok(ready && ready.t <= report.goSentAt, `filho ${child.label} deve estar pronto antes da largada`);
  }

  // 7a. Largada simultânea: ambos liberados depois de startAt e com pequena diferença entre si.
  const releasedA = first(a, 'released')!.t;
  const releasedB = first(b, 'released')!.t;
  assert.ok(releasedA >= report.startAt - 1 && releasedB >= report.startAt - 1, 'liberação não pode ocorrer antes de startAt');
  assert.ok(Math.abs(releasedA - releasedB) <= 250, `largada dessincronizada: ${Math.abs(releasedA - releasedB)}ms`);

  // 7b. Sobreposição das chamadas: cada intervalo [call-start, call-end] intersecta o outro.
  const startA = first(a, 'call-start')!.t;
  const startB = first(b, 'call-start')!.t;
  const endA = first(a, 'call-end')!.t;
  const endB = first(b, 'call-end')!.t;
  assert.ok(startA <= endB && startB <= endA, 'as chamadas não se sobrepuseram no tempo');

  // 4/7c. Ambos chegaram à entrada da região crítica enquanto o lock era segurado pelo pai.
  assert.equal(report.gateTimedOut, false, 'os dois processos não chegaram ao BEGIN IMMEDIATE com o portão fechado');
  for (const child of report.children) {
    const attempt = first(child, 'sql-attempt', 'BEGIN IMMEDIATE')!;
    const acquired = first(child, 'sql-done', 'BEGIN IMMEDIATE')!;
    assert.ok(attempt && acquired, `filho ${child.label} deve registrar tentativa e aquisição do BEGIN IMMEDIATE`);
    assert.ok(attempt.t <= report.gateReleasedAt, `filho ${child.label} deve tentar o BEGIN IMMEDIATE antes da liberação do portão`);
    assert.ok(acquired.t >= report.gateReleasedAt, `filho ${child.label} só pode adquirir o lock após a liberação do portão`);
  }

  // Exclusão mútua: o perdedor só adquire o lock depois que o vencedor iniciou o COMMIT.
  const outcomes = report.children.map(outcomeOf);
  assert.equal(outcomes.filter((o) => o.ok).length, 1, `exatamente um vencedor esperado: ${JSON.stringify(outcomes)}`);
  const winner = outcomes[0].ok ? a : b;
  const loser = outcomes[0].ok ? b : a;
  const winnerCommit = first(winner, 'sql-attempt', 'COMMIT');
  const loserAcquired = first(loser, 'sql-done', 'BEGIN IMMEDIATE')!;
  assert.ok(winnerCommit, 'vencedor deve ter executado COMMIT');
  assert.ok(loserAcquired.t >= winnerCommit.t, 'o perdedor adquiriu o lock antes de o vencedor iniciar o COMMIT (sem exclusão mútua)');

  // O perdedor falhou DENTRO da região crítica (regra de negócio avaliada sob o lock).
  const loserOutcome = outcomeOf(loser);
  assert.match(loserOutcome.message ?? '', expectations.loserMessage, `perdedor falhou por motivo inesperado: ${loserOutcome.message}`);
  assert.ok(first(loser, 'sql-attempt', 'ROLLBACK'), 'perdedor deve ter feito ROLLBACK da transação');

  return { winner: winner.label, loser: loser.label };
}
