#!/usr/bin/env node
// Cross-platform replacement for the old bash-only pipeline
// (`--reporter=json > tmp; TEST_EXIT=$?; ...; if [ ]; exit`), which broke on
// Windows. Runs the accessibility project, writes the JSON report straight to
// a temp file (avoids piping potentially huge stdout - test attachments like
// screenshots/videos are base64-inlined and can exceed spawnSync's stdout
// buffer), prints axe "incomplete" warnings, then exits with the test run's
// own exit code.
// Usage: node playwright/run-a11y-incomplete.js [specFile]
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { printWarnings } = require('./print-a11y-warnings');

const specArgs = process.argv.slice(2);
const playwrightCli = require.resolve('@playwright/test/cli');
const reportPath = path.join(os.tmpdir(), `pw-a11y-${process.pid}.json`);

const result = spawnSync(
  process.execPath,
  [
    playwrightCli,
    'test',
    ...specArgs,
    '--project=accessibility',
    '--reporter=json'
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath }
  }
);

try {
  printWarnings(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
} catch {
  console.error(
    'Could not read Playwright JSON report; skipping accessibility warning summary.'
  );
} finally {
  fs.rmSync(reportPath, { force: true });
}

process.exit(result.status ?? 1);
