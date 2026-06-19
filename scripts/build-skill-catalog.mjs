#!/usr/bin/env node
// build-skill-catalog.mjs — generate template/.ruler/skills/README.md from each
// skill's frontmatter (name + harness.tier/family/gist). The frontmatter is the
// single source of truth; the catalog is derived, never hand-edited.
//
// Usage:
//   node scripts/build-skill-catalog.mjs           # (re)write the catalog
//   node scripts/build-skill-catalog.mjs --check   # exit 1 if catalog is stale
//
// Zero dependencies. Run via `npm run catalog` / `npm run catalog:check`.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SKILLS = join(here, '..', 'template', '.ruler', 'skills');
const OUT = join(SKILLS, 'README.md');

// Family display config — order, emoji, heading, tier note.
const FAMILIES = [
  ['process', '🧭', 'Process & discipline — apply on any tier'],
  ['language', '🔡', 'Language & code quality — any tier'],
  ['react-core', '⚛️', 'React core — `apps/web` changes'],
  ['frontend-platform', '🎨', 'Frontend platform & quality'],
  ['backend-fastapi', '🏗️', 'Backend — FastAPI & Python — `apps/api` changes'],
  ['data', '🗄️', 'Data & persistence'],
];

function frontmatter(text, file) {
  const lines = text.split('\n');
  if (lines[0] !== '---') throw new Error(`No frontmatter: ${file}`);
  const close = lines.indexOf('---', 1);
  if (close === -1) throw new Error(`Unclosed frontmatter: ${file}`);
  const fm = lines.slice(1, close);
  const get = (re) => fm.map((l) => l.match(re)).find(Boolean)?.[1] ?? null;
  const ownersRaw = get(/^\s+owners:\s*\[(.*)\]\s*$/);
  return {
    name: get(/^name:\s*(.+)$/),
    tier: get(/^\s+tier:\s*(\S+)/),
    family: get(/^\s+family:\s*(\S+)/),
    gist: get(/^\s+gist:\s*"(.+)"\s*$/),
    owners: ownersRaw == null ? null : ownersRaw.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

const skills = readdirSync(SKILLS, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => {
    const file = join(SKILLS, e.name, 'SKILL.md');
    const meta = frontmatter(readFileSync(file, 'utf8'), file);
    for (const k of ['name', 'tier', 'family', 'gist']) {
      if (!meta[k]) throw new Error(`Skill ${e.name}: missing harness ${k} in frontmatter`);
    }
    if (!meta.owners || meta.owners.length === 0) {
      throw new Error(`Skill ${e.name}: missing harness owners in frontmatter (every skill needs ≥1 functional owner)`);
    }
    if (meta.name !== e.name) throw new Error(`Skill dir ${e.name} ≠ frontmatter name ${meta.name}`);
    return meta;
  });

const known = new Set(FAMILIES.map(([f]) => f));
for (const s of skills) {
  if (!known.has(s.family)) throw new Error(`Skill ${s.name}: unknown family "${s.family}"`);
}

// --- Ownership enforcement (structural invariant; runs in BOTH modes) ---
// Every declared owner must actually reference the skill slug in its profile,
// so "all skills are used by their corresponding agent" can't silently drift.
const RULER = join(here, '..', 'template', '.ruler');
const OWNER_FILES = {
  main: join(RULER, 'instructions.md'),
  'spec-steward': join(RULER, 'agents', 'spec-steward.md'),
  'architect-reviewer': join(RULER, 'agents', 'architect-reviewer.md'),
  'code-reviewer': join(RULER, 'agents', 'code-reviewer.md'),
  'qa-validator': join(RULER, 'agents', 'qa-validator.md'),
  'security-reviewer': join(RULER, 'agents', 'security-reviewer.md'),
  'acceptance-verifier': join(RULER, 'agents', 'acceptance-verifier.md'),
  'lessons-curator': join(RULER, 'agents', 'lessons-curator.md'),
};
const ownerText = {};
const readOwner = (o) => (ownerText[o] ??= readFileSync(OWNER_FILES[o], 'utf8'));
const ownershipErrors = [];
for (const s of skills) {
  for (const o of s.owners) {
    if (!OWNER_FILES[o]) { ownershipErrors.push(`${s.name}: unknown owner "${o}"`); continue; }
    if (!readOwner(o).includes(s.name)) {
      const where = o === 'main' ? 'instructions.md' : `agents/${o}.md`;
      ownershipErrors.push(`${s.name}: declared owner "${o}" does not reference the skill — wire it into ${where}`);
    }
  }
}
if (ownershipErrors.length) {
  console.error(`Skill ownership check FAILED (${ownershipErrors.length}):\n  - ${ownershipErrors.join('\n  - ')}`);
  process.exit(1);
}

// --- Broken skill-link lint (structural invariant; runs in BOTH modes) ---
// Catches agents/instructions that cite skill files which don't exist — e.g. a
// `fastapi-patterns/patterns/cross-cutting.md` left over from a port, or a bare
// sub-path with no owning skill. Without this, dead pointers route reviewers to
// nothing and read as coverage. Skill names are validated too (catches typos/renames).
const validSkills = new Set(skills.map((s) => s.name));
const allSkillRel = new Set(
  readdirSync(SKILLS, { recursive: true }).map((p) => String(p).split(sep).join('/')),
);
const SUB = /\b([a-z0-9][a-z0-9-]*)\/(patterns|rules|topics)\/([A-Za-z0-9._-]+\.md)/g;       // prefixed sub-path
const BARE = /`(patterns|rules|topics)\/[A-Za-z0-9._-]+\.md`/g;                              // bare, unresolvable
const SKILLREF = /(?:\.claude\/skills\/|`)([a-z0-9][a-z0-9-]*)\/SKILL\.md/g;                 // skill-name citation
const linkErrors = [];
for (const [owner, file] of Object.entries(OWNER_FILES)) {
  const text = readFileSync(file, 'utf8');
  const label = owner === 'main' ? 'instructions.md' : `agents/${owner}.md`;
  for (const m of text.matchAll(SUB)) {
    if (!validSkills.has(m[1])) continue; // not a skill-prefixed path
    const rel = `${m[1]}/${m[2]}/${m[3]}`;
    if (!allSkillRel.has(rel)) linkErrors.push(`${label}: references missing skill file "${rel}"`);
  }
  for (const m of text.matchAll(BARE)) {
    linkErrors.push(`${label}: bare sub-path ${m[0]} — prefix with the owning skill (e.g. \`react-design-patterns/patterns/compound.md\`)`);
  }
  for (const m of text.matchAll(SKILLREF)) {
    if (!validSkills.has(m[1])) linkErrors.push(`${label}: cites unknown skill "${m[1]}" (renamed or removed?)`);
  }
}
// Also scan each skill's own SKILL.md — skill->skill dead links (e.g. a stale
// `<skill>/patterns/x.md`) were previously invisible to this lint. In a SKILL.md a
// bare `sub/file.md` resolves relative to THAT skill (unlike in an agent, where it
// is ambiguous and forbidden).
for (const s of skills) {
  const text = readFileSync(join(SKILLS, s.name, 'SKILL.md'), 'utf8');
  const label = `skills/${s.name}`;
  for (const m of text.matchAll(SUB)) {
    if (!validSkills.has(m[1])) continue;
    const rel = `${m[1]}/${m[2]}/${m[3]}`;
    if (!allSkillRel.has(rel)) linkErrors.push(`${label}: references missing skill file "${rel}"`);
  }
  for (const m of text.matchAll(BARE)) {
    const sub = m[0].slice(1, -1); // strip the backticks → e.g. "topics/x.md"
    const rel = `${s.name}/${sub}`;
    if (!allSkillRel.has(rel)) linkErrors.push(`${label}: bare sub-path \`${sub}\` doesn't resolve under this skill (${rel} missing)`);
  }
  for (const m of text.matchAll(SKILLREF)) {
    if (!validSkills.has(m[1])) linkErrors.push(`${label}: cites unknown skill "${m[1]}" (renamed or removed?)`);
  }
}
if (linkErrors.length) {
  console.error(`Skill-link check FAILED (${linkErrors.length}):\n  - ${linkErrors.join('\n  - ')}`);
  process.exit(1);
}

// --- Wrong-stack residue lint (NestJS/Node/Jest terms in a FastAPI + React repo) ---
// This repo's backend is FastAPI/SQLAlchemy/Pydantic; the inherited harness was NestJS.
// Banned tokens steer subagents toward the wrong stack. Frontend-legit TS (vitest, Zod,
// `.test.ts`/`.spec.ts`) is intentionally NOT banned. To keep a deliberate anti-pattern
// mention (e.g. "don't write `@Injectable`"), put `lint-allow-stack-term` on that line.
const BANNED = [
  /@nestjs\b/, /@Injectable\b/, /@InjectRepository\b/, /@InjectDataSource\b/, /@Inject\(/,
  /\bValidationPipe\b/, /\bNestFactory\b/, /\bScope\.REQUEST\b/, /\bTypeOrmModule\b/,
  /\bclass-validator\b/, /\bclass-transformer\b/, /\bgetRepository\b/, /\bQueryRunner\b/,
  /\bTest\.createTestingModule\b/, /\bTestingModule\b/, /\bts-jest\b/, /\bjest\.(?:fn|mock|spyOn)\b/,
  /\b(?:NotFound|BadRequest|Forbidden|Unauthorized|Conflict|InternalServerError)Exception\b/,
  /\bHttpException\b/, /\bTypeORM\b/, /\btypeorm\b/, /\bnestjs-[a-z]+\b/,
  /\.(?:controller|service|module|entity)\.ts\b/, /\.repository\.interface\.ts\b/,
];
const ALLOW_MARK = 'lint-allow-stack-term';
const filesToScan = [
  ...[...allSkillRel].filter((p) => p.endsWith('.md')).map((p) => [`skills/${p}`, join(SKILLS, ...p.split('/'))]),
  ...Object.entries(OWNER_FILES).map(([o, f]) => [o === 'main' ? 'instructions.md' : `agents/${o}.md`, f]),
];
const stackErrors = [];
for (const [label, path] of filesToScan) {
  readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes(ALLOW_MARK)) return;
    for (const re of BANNED) {
      const m = line.match(re);
      if (m) { stackErrors.push(`${label}:${i + 1}: wrong-stack term "${m[0]}" — port to FastAPI/Python, or mark the line with ${ALLOW_MARK} if it's deliberate anti-pattern text`); break; }
    }
  });
}
if (stackErrors.length) {
  console.error(`Wrong-stack residue check FAILED (${stackErrors.length}):\n  - ${stackErrors.join('\n  - ')}`);
  process.exit(1);
}

const byFamily = (f) => skills.filter((s) => s.family === f).sort((a, b) => a.name.localeCompare(b.name));

const mindmap = [
  '```mermaid', 'mindmap', '  root((skills))',
  ...FAMILIES.flatMap(([f, emoji, title]) => [
    `    ${emoji} ${title.split('—')[0].trim()}`,
    ...byFamily(f).map((s) => `      ${s.name}`),
  ]),
  '```',
].join('\n');

const tables = FAMILIES.map(([f, emoji, title]) => {
  const rows = byFamily(f);
  return [
    `## ${emoji} ${title} (${rows.length})`,
    '',
    '| Skill | What it gives you |',
    '|---|---|',
    ...rows.map((s) => `| [${s.name}](./${s.name}/SKILL.md) | ${s.gist} |`),
  ].join('\n');
}).join('\n\n');

const ownershipTable = [
  '## 🧭 Ownership — every skill maps to the agent(s) that apply it',
  '',
  'Derived from each skill\'s `harness.owners`. `main` is the implementer (instructions.md);',
  'the rest are the review/verify subagents that apply the skill at their phase. `catalog:check`',
  'fails if a skill has no owner or a declared owner stops referencing it.',
  '',
  '| Skill | Applied by (owners) |',
  '|---|---|',
  ...[...skills].sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => `| [${s.name}](./${s.name}/SKILL.md) | ${s.owners.join(', ')} |`),
].join('\n');

const doc = `# Skill Catalog

<!-- GENERATED FILE — do not edit by hand. Source of truth: each skill's frontmatter
     (harness: tier/family/gist). Regenerate: npm run catalog. CI fails if stale. -->

${skills.length} skills in ${FAMILIES.length} families. The directories are **flat by requirement** — agent runtimes
(Claude Code, Codex, Cursor) discover skills as \`skills/<name>/SKILL.md\`, so grouping
lives here, not in the filesystem. Depth lives in each skill's \`topics/\` / \`patterns/\` /
\`rules/\` files, read on demand. Tier routing rules (what loads when) are in
\`instructions.md\` § P3.0 and § Skill Pointers; this page is the human-facing map.

${mindmap}

${tables}

${ownershipTable}

---

Adding a skill? Keep the directory flat, set \`harness: tier/family/gist\` in its
frontmatter, and run \`npm run catalog\` (the acceptance suite and \`catalog:check\` fail
if this file is stale). Respect the size ceiling (\`meta-skill-hygiene\` § Bloat: warn
>400 lines, fail >800 — split into index + topics).
`;

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8');
  if (current !== doc) {
    console.error('Skill catalog is STALE — run `npm run catalog` and commit the result.');
    process.exit(1);
  }
  console.log(`Catalog up to date (${skills.length} skills, ${FAMILIES.length} families).`);
} else {
  writeFileSync(OUT, doc);
  console.log(`Catalog written: ${skills.length} skills, ${FAMILIES.length} families → ${OUT}`);
}
