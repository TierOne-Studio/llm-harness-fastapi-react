#!/usr/bin/env node
// fixture-quality.mjs — deterministic, model-free scorer for the FastAPI + React
// architecture invariants a code-quality reviewer enforces: the clean-architecture
// dependency rule, no SQL in routers, repositories don't own the commit, React
// consumes the generated client (SSoT), Pydantic at the boundary, and no wrong-stack
// (NestJS) residue. Two uses:
//   1. Deterministic CI gate over eval/fixtures/golden ("what good looks like").
//   2. The scorer a keyed fixture-task eval runs after the model patches a copy —
//      a code-quality eval, not just a routing/adherence one.
//
// Usage: node scripts/fixture-quality.mjs [--root <dir>] [--json]
// Exit: 0 if every invariant passes, 1 otherwise.

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(here, '..', 'eval', 'fixtures', 'golden');

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(py|ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// Unambiguous wrong-stack tokens. FastAPI's `HTTPException` (all-caps HTTP) and
// frontend TS are intentionally NOT here — only NestJS/Node/Jest idioms.
const WRONG_STACK = [
  /@nestjs\b/, /@Injectable\b/, /@InjectRepository\b/, /\bValidationPipe\b/, /\bTypeORM\b/, /\btypeorm\b/,
  /\bgetRepository\b/, /\b(?:NotFound|BadRequest|Forbidden|Unauthorized|Conflict)Exception\b/,
  /\bHttpException\b/, /\bclass-validator\b/, /\bTestingModule\b/, /\bjest\.(?:fn|mock)\b/,
  /\.(?:controller|service|module|entity)\.ts\b/,
];

export function scoreFixture(root) {
  const files = walk(root).map((p) => ({ rel: relative(root, p).split('\\').join('/'), text: readFileSync(p, 'utf8') }));
  const py = (f) => f.rel.endsWith('.py');
  // Files whose IMMEDIATE parent directory is the named layer (`api`/`domain`/…).
  // Matching the layer dir, not the `apps/api` workspace, is the whole trick.
  const layer = (s) => files.filter((f) => f.rel.split('/').slice(-2, -1)[0] === s);

  const inv = [];
  const add = (id, ok, detail) => inv.push({ id, ok, detail });

  // INV1 — domain purity: domain imports no framework/ORM.
  {
    const domain = layer('domain');
    const bad = domain.filter((f) => /^\s*(?:from|import)\s+(?:fastapi|sqlalchemy|sqlmodel)\b/m.test(f.text));
    add('domain-purity', bad.length === 0,
      bad.length ? `domain imports framework/ORM: ${bad.map((f) => f.rel).join(', ')}` : `${domain.length} domain file(s) pure`);
  }
  // INV2 — no raw SQL in routers (api layer).
  {
    const api = layer('api').filter(py);
    const SQL = /\btext\s*\(|\.execute\s*\(|\b(?:SELECT|INSERT|UPDATE|DELETE)\s/i;
    const bad = api.filter((f) => SQL.test(f.text));
    add('no-sql-in-routers', bad.length === 0,
      bad.length ? `raw SQL in api/: ${bad.map((f) => f.rel).join(', ')}` : `${api.length} api file(s) SQL-free`);
  }
  // INV3 — infrastructure implements the port via an ORM.
  {
    const infra = layer('infrastructure').filter(py);
    const ok = infra.length === 0 || infra.some((f) => /\b(?:sqlalchemy|sqlmodel)\b/.test(f.text));
    add('infra-uses-orm', ok, ok ? 'infrastructure imports SQLAlchemy/SQLModel' : 'no ORM import in infrastructure/');
  }
  // INV4 — application depends on the port, not the concrete adapter.
  {
    const app = layer('application').filter(py);
    const bad = app.filter((f) => /^\s*(?:from|import)\s+\S*infrastructure/m.test(f.text));
    add('application-not-infra', bad.length === 0,
      bad.length ? `application imports infrastructure: ${bad.map((f) => f.rel).join(', ')}` : `${app.length} service file(s) port-only`);
  }
  // INV5 — repositories don't own the commit (the application service does).
  {
    const infra = layer('infrastructure').filter(py);
    const bad = infra.filter((f) => /\.commit\s*\(/.test(f.text));
    add('repo-no-commit', bad.length === 0,
      bad.length ? `repository commits: ${bad.map((f) => f.rel).join(', ')}` : 'repositories do not commit');
  }
  // INV6 — no NestJS/Node/Jest residue anywhere.
  {
    const bad = [];
    for (const f of files) for (const re of WRONG_STACK) if (re.test(f.text)) { bad.push(`${f.rel} (${f.text.match(re)[0]})`); break; }
    add('no-wrong-stack', bad.length === 0, bad.length ? `wrong-stack tokens: ${bad.join(', ')}` : 'no NestJS/Node residue');
  }
  // INV7 — React consumes the generated client; no hand-redeclared contract type.
  {
    const feat = files.filter((f) => f.rel.includes('/features/'));
    const importsGen = feat.some((f) => /from\s+['"][^'"]*generated[^'"]*['"]/.test(f.text));
    const redeclare = feat.filter((f) => /\b(?:interface|type)\s+OrderRead\b\s*[={]/.test(f.text));
    const ok = feat.length === 0 || (importsGen && redeclare.length === 0);
    add('react-generated-client', ok,
      feat.length && !importsGen ? 'feature does not import the generated client'
        : redeclare.length ? `feature redeclares a contract type: ${redeclare.map((f) => f.rel).join(', ')}`
          : 'feature consumes generated client types');
  }
  // INV8 — Pydantic at the API boundary.
  {
    const schemas = layer('api').filter((f) => py(f) && /schemas?\.py$/.test(f.rel));
    const ok = schemas.length === 0 || schemas.every((f) => /\bBaseModel\b/.test(f.text));
    add('pydantic-boundary', ok, ok ? 'API DTOs use Pydantic BaseModel' : 'api schemas missing BaseModel');
  }

  const passed = inv.filter((i) => i.ok).length;
  return { invariants: inv, passed, total: inv.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = argValue('--root', DEFAULT_ROOT);
  const r = scoreFixture(root);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Fixture quality: ${root}`);
    for (const i of r.invariants) console.log(`  ${i.ok ? 'PASS' : 'FAIL'}  ${i.id} — ${i.detail}`);
    console.log(`\n${r.passed}/${r.total} invariants passed.`);
  }
  process.exit(r.passed === r.total ? 0 : 1);
}
