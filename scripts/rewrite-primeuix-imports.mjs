#!/usr/bin/env node
// Companion to rewrite-primeng-imports.mjs, used to vendor @primeuix/{utils,styled,motion,styles}
// source into cps-ui-kit. Usage: node scripts/rewrite-primeuix-imports.mjs
//
// Rewrites every `from '@primeuix/<pkg>[/<subpath>]'` specifier - across the vendored
// primeuix-temp/ tree itself, the existing primeng-temp/ tree, and the rest of
// cps-ui-kit/src - to a relative path pointing at primeuix-temp/<pkg>/src/<subpath>/index.
// Also injects a provenance header (no @ts-nocheck - primeuix's own tsconfig is already
// strict, see NOTICE.md) into every file under primeuix-temp/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PRIMEUIX_ROOT = path.join(REPO_ROOT, 'projects/cps-ui-kit/src/lib/primeuix-temp');
const CPS_UI_KIT_SRC = path.join(REPO_ROOT, 'projects/cps-ui-kit/src');

const PRIMEUIX_COMMIT = 'b9467bc448d35738d4f651dbc3caa4d4cb9a6a96';
const PRIMEUIX_FETCH_DATE = '2026-07-13';

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

function collectTsFiles(dir) {
  const files = [];
  walk(dir, (file) => {
    if (file.endsWith('.ts')) files.push(file);
  });
  return files;
}

const IMPORT_RE = /((?:from|import)\s+)(['"])@primeuix\/([^'"]+)\2/g;

function targetForSpecifier(rest) {
  const segments = rest.split('/');
  const pkg = segments[0];
  const subpath = segments.slice(1).join('/');
  const target = subpath
    ? path.join(PRIMEUIX_ROOT, pkg, 'src', subpath, 'index.ts')
    : path.join(PRIMEUIX_ROOT, pkg, 'src', 'index.ts');
  if (!fs.existsSync(target)) {
    throw new Error(`No vendored file found for '@primeuix/${rest}' -> ${target}`);
  }
  return target;
}

function rewriteImportsInFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const rewritten = text.replace(IMPORT_RE, (match, prefix, quote, rest) => {
    const target = targetForSpecifier(rest);
    let rel = path.relative(path.dirname(filePath), target);
    rel = rel.split(path.sep).join('/').replace(/\.ts$/, '');
    if (!rel.startsWith('.')) rel = './' + rel;
    changed = true;
    return `${prefix}${quote}${rel}${quote}`;
  });
  if (changed) fs.writeFileSync(filePath, rewritten);
  return changed;
}

function injectHeaders() {
  let count = 0;
  walk(PRIMEUIX_ROOT, (file) => {
    if (!file.endsWith('.ts')) return;
    const rel = path.relative(PRIMEUIX_ROOT, file).split(path.sep).join('/');
    // rel is like "utils/src/dom/index.ts" -> original path is "packages/utils/src/dom/index.ts"
    const pkg = rel.split('/')[0];
    const originalRel = rel.replace(new RegExp(`^${pkg}/`), `packages/${pkg}/`);
    let noticeRel = path.relative(path.dirname(file), path.join(PRIMEUIX_ROOT, 'NOTICE.md'));
    noticeRel = noticeRel.split(path.sep).join('/');
    if (!noticeRel.startsWith('.')) noticeRel = './' + noticeRel;
    const header = `/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit ${PRIMEUIX_COMMIT}).
 * Original file: ${originalRel}
 * Modified: import paths rewritten to resolve locally. See ${noticeRel}.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
`;
    const text = fs.readFileSync(file, 'utf8');
    if (text.startsWith('/**\n * Vendored from primeuix')) return; // idempotent re-run guard
    fs.writeFileSync(file, header + text);
    count++;
  });
  console.log(`Injected provenance headers into ${count} vendored primeuix files`);
}

function verifyNoRemainingReferences(dirs) {
  const offenders = [];
  for (const dir of dirs) {
    for (const file of collectTsFiles(dir)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/from\s+['"]@primeuix\//.test(text)) offenders.push(file);
    }
  }
  if (offenders.length) {
    console.error('Remaining unrewritten @primeuix/ references:');
    for (const f of offenders) console.error(' -', path.relative(REPO_ROOT, f));
    process.exit(1);
  }
  console.log('Verified: zero remaining "@primeuix/" import references.');
}

// --- run ---

let rewrittenCount = 0;
for (const file of collectTsFiles(PRIMEUIX_ROOT)) {
  if (rewriteImportsInFile(file)) rewrittenCount++;
}
for (const file of collectTsFiles(CPS_UI_KIT_SRC)) {
  if (file.startsWith(PRIMEUIX_ROOT)) continue;
  if (rewriteImportsInFile(file)) rewrittenCount++;
}
console.log(`Rewrote imports in ${rewrittenCount} files`);

injectHeaders();
verifyNoRemainingReferences([PRIMEUIX_ROOT, CPS_UI_KIT_SRC]);
