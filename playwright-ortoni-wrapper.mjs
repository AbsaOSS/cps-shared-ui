#!/usr/bin/env node
// Wraps 'playwright test', translating --name= (OrtoniRunner) to --grep= (Playwright).
// OrtoniRunner appends --name="^scenario$" which Playwright does not recognise.
// Cross-platform replacement for playwright-ortoni-wrapper.sh.
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(dirname(fileURLToPath(import.meta.url)));

const args = process.argv.slice(2).map((arg) => {
  if (!arg.startsWith('--name=')) return arg;

  // OrtoniRunner passes --name="^scenario name$" but Playwright BDD wraps tests
  // in a describe block, making the full title "Feature > scenario name".
  // Strip the anchors so --grep matches as a substring of the full title.
  let value = arg.slice('--name='.length);
  value = value.replace(/^"(.*)"$/, '$1'); // strip surrounding quotes if any
  value = value.replace(/^\^/, '').replace(/\$$/, ''); // strip ^ and $ anchors
  return `--grep="${value}"`;
});

execSync(`npx bddgen && npx playwright test ${args.join(' ')}`, {
  stdio: 'inherit'
});
