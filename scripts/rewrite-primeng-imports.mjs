#!/usr/bin/env node
// One-off (and re-runnable) tool used to vendor PrimeNG source into cps-ui-kit.
// Usage: node scripts/rewrite-primeng-imports.mjs <path-to-primeng-repo-clone> [--copy]
//
// Phases:
//   1. (--copy only) Copy the required module folders from the PrimeNG source
//      clone into projects/cps-ui-kit/src/lib/primeng-temp/, excluding *.spec.ts
//      and ng-package.json.
//   2. Rewrite every `from 'primeng/<x>'` / `export ... from 'primeng/<x>'`
//      specifier - in both the vendored tree and cps-ui-kit's own call sites -
//      to a relative path pointing at <x>/public_api.
//   3. Inject a short provenance header into every vendored file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEST_ROOT = path.join(REPO_ROOT, 'projects/cps-ui-kit/src/lib/primeng-temp');
const CPS_UI_KIT_SRC = path.join(REPO_ROOT, 'projects/cps-ui-kit/src');

const MODULES = [
  'api',
  'autofocus',
  'badge',
  'base',
  'basecomponent',
  'baseeditableholder',
  'baseinput',
  'basemodelholder',
  'bind',
  'button',
  'checkbox',
  'config',
  'datepicker',
  'dom',
  'fluid',
  'iconfield',
  'icons',
  'inputicon',
  'inputnumber',
  'inputtext',
  'motion',
  'overlay',
  'paginator',
  'radiobutton',
  'ripple',
  'scroller',
  'select',
  'selectbutton',
  'table',
  'togglebutton',
  'tooltip',
  'tree',
  'treetable',
  'ts-helpers',
  'types',
  'usestyle',
  'utils'
];

const PRIMENG_TAG = '21.1.9';
const PRIMENG_COMMIT = 'c493b1c6d9f7cdffbe1c4dc195493dd73d733593';

const args = process.argv.slice(2);
const shouldCopy = args.includes('--copy');
const srcCloneArg = args.find((a) => !a.startsWith('--'));

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, cb);
    } else {
      cb(full);
    }
  }
}

function copyModules(srcRoot) {
  fs.rmSync(DEST_ROOT, { recursive: true, force: true });
  fs.mkdirSync(DEST_ROOT, { recursive: true });

  let copied = 0;
  for (const mod of MODULES) {
    const modSrc = path.join(srcRoot, mod);
    if (!fs.existsSync(modSrc)) {
      throw new Error(`Module not found in source clone: ${mod}`);
    }
    walk(modSrc, (file) => {
      const base = path.basename(file);
      if (base.endsWith('.spec.ts') || base === 'ng-package.json') return;
      if (!file.endsWith('.ts')) return;
      const rel = path.relative(srcRoot, file);
      const dest = path.join(DEST_ROOT, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(file, dest);
      copied++;
    });
  }
  console.log(`Copied ${copied} vendored .ts files into ${path.relative(REPO_ROOT, DEST_ROOT)}`);
}

// Build an index of every module specifier `<x>` -> absolute path of its public_api.ts
function buildPublicApiIndex() {
  const index = new Map();
  walk(DEST_ROOT, (file) => {
    if (path.basename(file) === 'public_api.ts') {
      const dir = path.dirname(file);
      const specifier = path.relative(DEST_ROOT, dir).split(path.sep).join('/');
      index.set(specifier, file);
    }
  });
  return index;
}

const IMPORT_RE = /((?:from|import)\s+)(['"])primeng\/([^'"]+)\2/g;

function rewriteImportsInFile(filePath, index) {
  const text = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const rewritten = text.replace(IMPORT_RE, (match, prefix, quote, specifier) => {
    const target = index.get(specifier);
    if (!target) {
      throw new Error(`No public_api.ts found for 'primeng/${specifier}' referenced in ${filePath}`);
    }
    let rel = path.relative(path.dirname(filePath), target);
    rel = rel.split(path.sep).join('/').replace(/\.ts$/, '');
    if (!rel.startsWith('.')) rel = './' + rel;
    changed = true;
    return `${prefix}${quote}${rel}${quote}`;
  });
  if (changed) {
    fs.writeFileSync(filePath, rewritten);
  }
  return changed;
}

function collectTsFiles(dir) {
  const files = [];
  walk(dir, (file) => {
    if (file.endsWith('.ts')) files.push(file);
  });
  return files;
}

function injectHeaders() {
  let count = 0;
  walk(DEST_ROOT, (file) => {
    if (!file.endsWith('.ts')) return;
    const rel = path.relative(DEST_ROOT, file).split(path.sep).join('/');
    const header = `// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG ${PRIMENG_TAG} (https://github.com/primefaces/primeng, tag ${PRIMENG_TAG}, commit ${PRIMENG_COMMIT}).
 * Original file: packages/primeng/src/${rel}
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
`;
    const text = fs.readFileSync(file, 'utf8');
    if (text.startsWith('// @ts-nocheck')) return; // idempotent re-run guard
    fs.writeFileSync(file, header + text);
    count++;
  });
  console.log(`Injected provenance headers into ${count} vendored files`);
}

function verifyNoRemainingReferences(dirs) {
  const offenders = [];
  for (const dir of dirs) {
    for (const file of collectTsFiles(dir)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/from\s+['"]primeng\//.test(text)) {
        offenders.push(file);
      }
    }
  }
  if (offenders.length) {
    console.error('Remaining unrewritten primeng/ references:');
    for (const f of offenders) console.error(' -', path.relative(REPO_ROOT, f));
    process.exit(1);
  }
  console.log('Verified: zero remaining "primeng/" import references.');
}

// --- run ---

if (shouldCopy) {
  if (!srcCloneArg) {
    console.error('Usage with --copy: node scripts/rewrite-primeng-imports.mjs <path-to-primeng-clone>/packages/primeng/src --copy');
    process.exit(1);
  }
  copyModules(path.resolve(srcCloneArg));
}

const index = buildPublicApiIndex();
console.log(`Indexed ${index.size} public_api.ts entry points`);

let rewrittenCount = 0;
for (const file of collectTsFiles(DEST_ROOT)) {
  if (rewriteImportsInFile(file, index)) rewrittenCount++;
}
for (const file of collectTsFiles(CPS_UI_KIT_SRC)) {
  if (file.startsWith(DEST_ROOT)) continue;
  if (rewriteImportsInFile(file, index)) rewrittenCount++;
}
console.log(`Rewrote imports in ${rewrittenCount} files`);

if (shouldCopy) {
  injectHeaders();
}

verifyNoRemainingReferences([DEST_ROOT, CPS_UI_KIT_SRC]);
