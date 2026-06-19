#!/usr/bin/env node
// fixture-task.mjs — a CODE-QUALITY eval (not routing/adherence). The model extends
// the golden fixture with a new feature; the deterministic scorer then checks it kept
// every architecture invariant (clean-arch dependency rule, no SQL in routers, repo
// doesn't commit, React consumes the generated client, no NestJS residue).
//
// Informative, not gated: a one-shot patch is noisy, but a drop in "keeps the
// architecture" is real signal. Self-skips (exit 0) without a live backend.
//
// Usage: node eval/fixture-task.mjs [--model <id>]

import { mkdtempSync, cpSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const GOLDEN = join(ROOT, 'eval', 'fixtures', 'golden');
const { callModel, detectBackend, appendHistory, argValue, DEFAULT_MODEL } = await import(join(ROOT, 'eval', 'lib.mjs'));
const { scoreFixture } = await import(join(ROOT, 'scripts', 'fixture-quality.mjs'));

const backend = detectBackend();
if (!backend) {
  console.log('SKIP: fixture-task — no live backend (no ANTHROPIC_API_KEY, no claude CLI).');
  process.exit(0);
}
const model = argValue('--model', DEFAULT_MODEL);

const system = `You are extending an existing FastAPI + React orders module. Follow the EXISTING architecture EXACTLY:
- domain/ stays pure Python — no fastapi/sqlalchemy imports;
- api/ routers contain NO SQL and raise FastAPI HTTPException;
- the application service owns the transaction (async with session.begin()) and depends on the domain repository Protocol, never the concrete SQLAlchemy adapter;
- the SQLAlchemy repository never commits;
- React consumes the generated client types — never hand-redeclare a contract type;
- NEVER use NestJS / TypeORM / Jest idioms.
Output ONLY the new or changed files. Emit each as a fenced code block whose info string is path=<relative path from repo root>, for example:
\`\`\`path=apps/api/app/modules/orders/domain/models.py
<file contents>
\`\`\``;

const prompt = `Add a "cancel order" capability end to end: a domain method Order.cancel(), an OrderService.cancel_order use-case, a POST /orders/{order_id}/cancel route returning OrderRead, and a React CancelOrderButton in the orders feature. Show every file you add or change, each as a path=... fenced block.`;

function parseFiles(text) {
  const out = [];
  const re = /```[^\n]*path=([^\s`]+)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) out.push({ path: m[1].trim(), body: m[2] });
  return out;
}

const dir = mkdtempSync(join(tmpdir(), 'fixture-task-'));
let result;
try {
  cpSync(GOLDEN, dir, { recursive: true });
  const text = await callModel({ system, prompt, model, backend, maxTokens: 4096 });
  const files = parseFiles(text ?? '');
  for (const f of files) {
    const dest = join(dir, f.path);
    if (!dest.startsWith(dir)) continue; // no path escapes
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.body);
  }
  const score = scoreFixture(dir);
  const routesPath = join(dir, 'apps/api/app/modules/orders/api/routes.py');
  const cancelWired = existsSync(routesPath) && /cancel/i.test(readFileSync(routesPath, 'utf8'));
  result = { files: files.length, passed: score.passed, total: score.total, cancelWired,
    failing: score.invariants.filter((i) => !i.ok).map((i) => i.id) };
  console.log(`fixture-task: model=${model} files=${result.files} invariants=${result.passed}/${result.total}` +
    (result.failing.length ? ` FAILING=[${result.failing.join(', ')}]` : ' (all kept)') +
    ` cancelWired=${result.cancelWired}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

appendHistory({ kind: 'fixture-task', model, ...result });
