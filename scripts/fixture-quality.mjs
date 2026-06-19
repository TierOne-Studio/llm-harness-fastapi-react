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

// Trimmed `import`/`from` lines only — line-based to avoid backtracking-prone
// multiline regexes (each test runs on one short line, no `\s`/newline ambiguity).
const importLines = (text) =>
  text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('import ') || l.startsWith('from '));

const rels = (fs) => fs.map((f) => f.rel).join(', ');

// Each invariant is its own small function (ctx = { files, py, layer }) so the
// orchestrator stays trivial and each rule is independently readable/measurable.
function invDomainPurity({ layer }) {
  const domain = layer('domain');
  const bad = domain.filter((f) => importLines(f.text).some((l) => /\b(?:fastapi|sqlalchemy|sqlmodel)\b/.test(l)));
  return { id: 'domain-purity', ok: bad.length === 0,
    detail: bad.length ? `domain imports framework/ORM: ${rels(bad)}` : `${domain.length} domain file(s) pure` };
}
function invNoSqlInRouters({ layer, py }) {
  const api = layer('api').filter(py);
  const SQL = /\btext\s*\(|\.execute\s*\(|\b(?:SELECT|INSERT|UPDATE|DELETE)\s/i;
  const bad = api.filter((f) => SQL.test(f.text));
  return { id: 'no-sql-in-routers', ok: bad.length === 0,
    detail: bad.length ? `raw SQL in api/: ${rels(bad)}` : `${api.length} api file(s) SQL-free` };
}
function invInfraUsesOrm({ layer, py }) {
  const infra = layer('infrastructure').filter(py);
  const ok = infra.length === 0 || infra.some((f) => /\b(?:sqlalchemy|sqlmodel)\b/.test(f.text));
  return { id: 'infra-uses-orm', ok, detail: ok ? 'infrastructure imports SQLAlchemy/SQLModel' : 'no ORM import in infrastructure/' };
}
function invApplicationNotInfra({ layer, py }) {
  const app = layer('application').filter(py);
  const bad = app.filter((f) => importLines(f.text).some((l) => l.includes('infrastructure')));
  return { id: 'application-not-infra', ok: bad.length === 0,
    detail: bad.length ? `application imports infrastructure: ${rels(bad)}` : `${app.length} service file(s) port-only` };
}
function invRepoNoCommit({ layer, py }) {
  const infra = layer('infrastructure').filter(py);
  const bad = infra.filter((f) => /\.commit\s*\(/.test(f.text));
  return { id: 'repo-no-commit', ok: bad.length === 0,
    detail: bad.length ? `repository commits: ${rels(bad)}` : 'repositories do not commit' };
}
function invNoWrongStack({ files }) {
  const bad = [];
  for (const f of files) {
    const hit = WRONG_STACK.map((re) => f.text.match(re)).find(Boolean);
    if (hit) bad.push(`${f.rel} (${hit[0]})`);
  }
  return { id: 'no-wrong-stack', ok: bad.length === 0,
    detail: bad.length ? `wrong-stack tokens: ${bad.join(', ')}` : 'no NestJS/Node residue' };
}
function invReactGeneratedClient({ files }) {
  const feat = files.filter((f) => f.rel.includes('/features/'));
  if (feat.length === 0) return { id: 'react-generated-client', ok: true, detail: 'no feature files' };
  const importsGen = feat.some((f) => /from\s+['"][^'"]*generated[^'"]*['"]/.test(f.text));
  if (!importsGen) return { id: 'react-generated-client', ok: false, detail: 'feature does not import the generated client' };
  const redeclare = feat.filter((f) => /\b(?:interface|type)\s+OrderRead\b\s*[={]/.test(f.text));
  if (redeclare.length) return { id: 'react-generated-client', ok: false, detail: `feature redeclares a contract type: ${rels(redeclare)}` };
  return { id: 'react-generated-client', ok: true, detail: 'feature consumes generated client types' };
}
function invPydanticBoundary({ layer, py }) {
  const schemas = layer('api').filter((f) => py(f) && /schemas?\.py$/.test(f.rel));
  const ok = schemas.every((f) => /\bBaseModel\b/.test(f.text)); // [].every() is true → empty is fine
  return { id: 'pydantic-boundary', ok, detail: ok ? 'API DTOs use Pydantic BaseModel' : 'api schemas missing BaseModel' };
}

const INVARIANTS = [
  invDomainPurity, invNoSqlInRouters, invInfraUsesOrm, invApplicationNotInfra,
  invRepoNoCommit, invNoWrongStack, invReactGeneratedClient, invPydanticBoundary,
];

export function scoreFixture(root) {
  const files = walk(root).map((p) => ({ rel: relative(root, p).split('\\').join('/'), text: readFileSync(p, 'utf8') }));
  const py = (f) => f.rel.endsWith('.py');
  // Files whose IMMEDIATE parent directory is the named layer (`api`/`domain`/…).
  // Matching the layer dir, not the `apps/api` workspace, is the whole trick.
  const layer = (s) => files.filter((f) => f.rel.split('/').slice(-2, -1)[0] === s);

  const inv = INVARIANTS.map((check) => check({ files, py, layer }));
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
