#!/usr/bin/env node
// Wraps 'playwright test', translating --name= (OrtoniRunner) to --grep= (Playwright).
// OrtoniRunner appends --name="^scenario$" which Playwright does not recognise.
// Cross-platform replacement for playwright-ortoni-wrapper.sh.
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(dirname(fileURLToPath(import.meta.url)));

const args = process.argv
  .slice(2)
  .filter((arg) => !['npx', 'playwright', 'test'].includes(arg))
  .map((arg) => {
    if (!arg.startsWith('--name=')) return arg;

    // OrtoniRunner passes --name="^test name$"; strip anchors so --grep matches
    // as a substring of the full title (e.g. "describe > test name").
    let value = arg.slice('--name='.length);
    value = value.replace(/^"(.*)"$/, '$1'); // strip surrounding quotes if any
    value = value.replace(/^\^/, '').replace(/\$$/, ''); // strip ^ and $ anchors
    return `--grep="${value}"`;
  });

const result = spawnSync('npx', ['playwright', 'test', ...args], {
  stdio: 'inherit',
  shell: false
});
process.exit(result.status ?? 1);
