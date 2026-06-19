#!/usr/bin/env node
// add-skill-owners.mjs — one-time seed: inject `harness.owners` into every
// skill's frontmatter from the canonical ownership map below. Idempotent —
// re-running rewrites the owners line to match the map. Safe to delete after
// the owners field is committed; the map of record then lives in each
// SKILL.md frontmatter, enforced by build-skill-catalog.mjs --check.
//
//   node scripts/add-skill-owners.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SKILLS = join(here, '..', 'template', '.ruler', 'skills');

// Canonical functional ownership. A skill is "owned" by the main loop
// (`main` = instructions.md) and/or the subagent(s) whose phase applies it.
// `lessons-curator` is listed ONLY where it is the genuine functional owner
// (meta skills) — not as a catch-all, since it references nearly everything.
const OWNERS = {
  'accessibility': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'acceptance-verifier'],
  'ai-ui-patterns': ['main', 'architect-reviewer', 'code-reviewer'],
  'async-error-handling': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'async-python-patterns': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator'],
  'bug-investigation': ['main'],
  'bundle-size': ['main', 'architect-reviewer', 'code-reviewer', 'security-reviewer'],
  'code-simplifier': ['main', 'code-reviewer'],
  'cross-repo-workspace': ['main'],
  'cyclomatic-complexity': ['main', 'code-reviewer'],
  'database-transactions': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer', 'acceptance-verifier'],
  'db-write-protocol': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'decision-rules': ['main', 'spec-steward', 'architect-reviewer'],
  'design-review': ['main', 'spec-steward', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer', 'acceptance-verifier'],
  'documentation-and-adrs': ['main', 'spec-steward', 'architect-reviewer', 'code-reviewer'],
  'failure-mode-analysis': ['main', 'architect-reviewer', 'qa-validator'],
  'fastapi-best-practices': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer', 'acceptance-verifier'],
  'fastapi-clean-architecture': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'fastapi-patterns': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'fastapi-security': ['main', 'architect-reviewer', 'security-reviewer'],
  'fastapi-testing': ['main', 'qa-validator'],
  'frontend-security': ['main', 'architect-reviewer', 'code-reviewer', 'security-reviewer'],
  'git-workflow': ['main'],
  'js-performance-patterns': ['main', 'code-reviewer'],
  'meta-skill-hygiene': ['architect-reviewer', 'code-reviewer', 'security-reviewer', 'lessons-curator'],
  'openapi-contracts': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'plan-mode': ['main', 'architect-reviewer', 'code-reviewer'],
  'playwright-best-practices': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'acceptance-verifier'],
  'pushback-templates': ['main'],
  'pydantic-v2-patterns': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'python-best-practices': ['main', 'architect-reviewer', 'code-reviewer', 'security-reviewer'],
  'python-design-patterns': ['main', 'architect-reviewer', 'code-reviewer'],
  'quality-gates': ['main', 'architect-reviewer'],
  'react-2026': ['main', 'architect-reviewer'],
  'react-data-fetching': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator'],
  'react-design-patterns': ['main', 'architect-reviewer', 'code-reviewer'],
  'react-forms': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'react-patterns': ['main', 'architect-reviewer', 'code-reviewer'],
  'react-performance': ['main', 'architect-reviewer', 'code-reviewer'],
  'react-routing': ['main', 'architect-reviewer', 'code-reviewer', 'security-reviewer'],
  'react-state-management': ['main', 'architect-reviewer', 'code-reviewer'],
  'react-testing': ['main', 'qa-validator', 'acceptance-verifier'],
  'repo-conventions': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer', 'acceptance-verifier'],
  'rlm-explore': ['main', 'architect-reviewer', 'code-reviewer', 'qa-validator', 'security-reviewer'],
  'shadcn': ['main', 'code-reviewer'],
  'spec-workflow': ['main', 'spec-steward'],
  'tailwind-v4-shadcn': ['main', 'code-reviewer'],
  'tdd-workflow': ['main', 'architect-reviewer', 'qa-validator', 'acceptance-verifier'],
  'typescript-advanced-types': ['main', 'code-reviewer'],
  'vite': ['main', 'architect-reviewer'],
  'vitest': ['main', 'qa-validator'],
};

const dirs = readdirSync(SKILLS, { withFileTypes: true }).filter((e) => e.isDirectory());
let changed = 0;
const missing = [];

for (const e of dirs) {
  const name = e.name;
  if (!OWNERS[name]) { missing.push(name); continue; }
  const file = join(SKILLS, name, 'SKILL.md');
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // Locate the `harness:` block and its `gist:` line; insert/replace `owners:` after gist.
  const harnessIdx = lines.findIndex((l) => /^harness:\s*$/.test(l));
  if (harnessIdx === -1) throw new Error(`${name}: no harness: block`);
  const ownersLine = `  owners: [${OWNERS[name].join(', ')}]`;

  const existing = lines.findIndex((l, i) => i > harnessIdx && /^\s+owners:\s*\[/.test(l));
  if (existing === -1) {
    const gistIdx = lines.findIndex((l, i) => i > harnessIdx && /^\s+gist:/.test(l));
    const at = gistIdx === -1 ? harnessIdx + 1 : gistIdx + 1;
    lines.splice(at, 0, ownersLine);
    changed++;
  } else if (lines[existing] !== ownersLine) {
    lines[existing] = ownersLine;
    changed++;
  }
  writeFileSync(file, lines.join('\n'));
}

if (missing.length) throw new Error(`No owners mapped for: ${missing.join(', ')}`);
console.log(`add-skill-owners: updated ${changed} skill(s); ${dirs.length} total, all mapped.`);
