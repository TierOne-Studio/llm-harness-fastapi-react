// Proves the fixture-quality scorer discriminates: the golden fixture passes every
// invariant, and each seeded violation makes exactly its invariant fail. A scorer
// that can't fail bad code is decoration — this is the eval of that eval.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreFixture } from '../scripts/fixture-quality.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(here, '..', 'eval', 'fixtures', 'golden');
const M = 'apps/api/app/modules/orders';

function scoreWithMutation(rel, mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'fixq-'));
  try {
    cpSync(GOLDEN, dir, { recursive: true });
    const p = join(dir, rel);
    writeFileSync(p, mutate(readFileSync(p, 'utf8')));
    return scoreFixture(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const didFail = (r, id) => r.invariants.some((i) => i.id === id && !i.ok);

test('golden fixture passes every invariant', () => {
  const r = scoreFixture(GOLDEN);
  assert.equal(r.passed, r.total, `golden should be clean; failing: ${JSON.stringify(r.invariants.filter((i) => !i.ok))}`);
});

const SEEDS = [
  ['domain-purity', `${M}/domain/models.py`, (t) => `import sqlalchemy\n${t}`],
  ['no-sql-in-routers', `${M}/api/routes.py`, (t) => `${t}\nasync def _bad(session):\n    await session.execute(text("SELECT 1"))\n`],
  ['application-not-infra', `${M}/application/services.py`, (t) => `${t}\nfrom ..infrastructure.repositories import SqlAlchemyOrderRepository\n`],
  ['repo-no-commit', `${M}/infrastructure/repositories.py`, (t) => `${t}\n        await self._session.commit()\n`],
  ['no-wrong-stack', `${M}/api/routes.py`, (t) => `# @Injectable()\n${t}`],
  ['react-generated-client', 'apps/web/src/features/orders/api.ts', (t) => `${t}\ninterface OrderRead { id: string }\n`],
  ['pydantic-boundary', `${M}/api/schemas.py`, () => 'class OrderRead:\n    id: str\n'],
  ['infra-uses-orm', `${M}/infrastructure/repositories.py`, () => 'class SqlAlchemyOrderRepository:\n    pass\n'],
];

for (const [id, rel, mutate] of SEEDS) {
  test(`scorer catches a ${id} violation`, () => {
    const r = scoreWithMutation(rel, mutate);
    assert.ok(didFail(r, id), `expected '${id}' to FAIL after seeding; got ${JSON.stringify(r.invariants.find((i) => i.id === id))}`);
  });
}
