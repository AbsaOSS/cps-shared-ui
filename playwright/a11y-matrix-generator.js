#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Accessibility Test Matrix Generator
 *
 * Runs Playwright accessibility tests and produces a summary matrix table.
 *
 * Usage:
 *   node playwright/a11y-matrix-generator.js                  # run tests + print table
 *   node playwright/a11y-matrix-generator.js --from-file <f>  # use existing JSON report
 *   node playwright/a11y-matrix-generator.js --help
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  node playwright/a11y-matrix-generator.js                  Run tests and print matrix
  node playwright/a11y-matrix-generator.js --from-file <f>  Build matrix from existing JSON report

Options:
  --from-file <path>   Path to a Playwright JSON report (skips running tests)
  --help, -h           Show this help message
`);
  process.exit(0);
}

let jsonPath;

const fromFileIdx = args.indexOf('--from-file');
if (fromFileIdx !== -1) {
  jsonPath = args[fromFileIdx + 1];
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    console.error(`Error: file not found – ${jsonPath}`);
    process.exit(1);
  }
} else {
  // Run the tests and capture the JSON report
  const reportDir = path.resolve(__dirname, '..', 'playwright-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const tmpReport = path.join(reportDir, 'a11y-report.json');
  console.log('Running accessibility tests …\n');
  try {
    execSync(`npx playwright test --project=accessibility --reporter=json`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['inherit', fs.openSync(tmpReport, 'w'), 'pipe']
    });
  } catch {
    // Tests may exit non-zero when there are failures — that's expected
  }
  console.log(`Report saved to ${tmpReport}\n`);
  jsonPath = tmpReport;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function flattenSuites(suites) {
  const out = [];
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const result = spec.tests?.[0]?.results?.[0];
      out.push({
        suite: suite.title,
        test: spec.title,
        status: result?.status ?? 'unknown',
        error: result?.error?.message ?? '',
        axeResults: parseAxeAttachment(result)
      });
    }
    for (const sub of suite.suites || []) {
      for (const spec of sub.specs || []) {
        const result = spec.tests?.[0]?.results?.[0];
        out.push({
          suite: suite.title,
          test: `${sub.title} - ${spec.title}`,
          status: result?.status ?? 'unknown',
          error: result?.error?.message ?? '',
          axeResults: parseAxeAttachment(result)
        });
      }
    }
  }
  return out;
}

/** Extract the axe-core results object from the test attachment */
function parseAxeAttachment(result) {
  if (!result?.attachments) return null;
  const att = result.attachments.find(
    (a) => a.name === 'accessibility-scan-results' && a.body
  );
  if (!att) return null;
  try {
    return JSON.parse(Buffer.from(att.body, 'base64').toString());
  } catch {
    return null;
  }
}

const tests = flattenSuites(data.suites?.[0]?.suites ?? []);

// ---------------------------------------------------------------------------
// Extract violations and applicability per component
// ---------------------------------------------------------------------------

const failedRules = {}; // { "Component|||rule-id": true }
const applicableRules = {}; // { "Component|||rule-id": true }
const allComponents = new Set();
const allRules = new Set(); // only rules that have at least one violation

function extractViolationIds(errorMsg) {
  return [
    ...new Set(
      (errorMsg.match(/] ([a-z][a-z0-9-]+):/g) || []).map((m) => m.slice(2, -1))
    )
  ];
}

function addResults(comp, status, errorMsg, axeResults) {
  allComponents.add(comp);

  // Use axe attachment for accurate applicability data
  if (axeResults) {
    for (const v of axeResults.violations || []) {
      failedRules[`${comp}|||${v.id}`] = true;
      applicableRules[`${comp}|||${v.id}`] = true;
      allRules.add(v.id);
    }
    for (const p of axeResults.passes || []) {
      applicableRules[`${comp}|||${p.id}`] = true;
    }
    for (const inc of axeResults.incomplete || []) {
      applicableRules[`${comp}|||${inc.id}`] = true;
    }
    // inapplicable rules are NOT added to applicableRules
    return;
  }

  // Fallback: parse from error message (no attachment available)
  if (status !== 'passed') {
    const ids = extractViolationIds(errorMsg);
    for (const id of ids) {
      allRules.add(id);
      failedRules[`${comp}|||${id}`] = true;
      applicableRules[`${comp}|||${id}`] = true;
    }
  }
}

for (const t of tests) {
  const s = t.suite;
  const n = t.test;

  if (
    s === 'Accessibility - axe scan' ||
    s === 'Accessibility - responsive axe scan'
  ) {
    addResults(n.replace(/ should.*/, ''), t.status, t.error, t.axeResults);
    continue;
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const cols = [...allRules].sort();
const components = [...allComponents].sort();

function cell(comp, rule) {
  const key = `${comp}|||${rule}`;
  if (failedRules[key]) return '❌';
  if (applicableRules[key]) return '✅';
  return '-';
}

const COL_WIDTHS = [22, ...cols.map((c) => Math.max(c.length, 6))];
const padEnd = (s, w) => s + ' '.repeat(Math.max(0, w - s.length));

function row(cells) {
  return cells.map((c, i) => padEnd(c, COL_WIDTHS[i])).join(' | ');
}

console.log();
console.log(row(['Component', ...cols]));
console.log(row(COL_WIDTHS.map((w) => '-'.repeat(w))));

let totalPass = 0;
let totalFail = 0;
let totalNA = 0;

for (const comp of components) {
  const cells = cols.map((rule) => {
    const v = cell(comp, rule);
    if (v === '✅') totalPass++;
    else if (v === '❌') totalFail++;
    else totalNA++;
    return v;
  });
  console.log(row([comp, ...cells]));
}

// Summary row
const summaries = cols.map((rule) => {
  let fail = 0;
  let applicable = 0;
  for (const comp of components) {
    const key = `${comp}|||${rule}`;
    if (applicableRules[key]) {
      applicable++;
      if (failedRules[key]) fail++;
    }
  }
  return `${applicable - fail}/${applicable}`;
});

console.log(row(COL_WIDTHS.map((w) => '-'.repeat(w))));
console.log(row(['PASS / TESTED', ...summaries]));

console.log(`\nCells: ${totalPass} PASS, ${totalFail} FAIL, ${totalNA} N/A`);
console.log(`Components: ${components.length}`);
console.log(`Rules with violations: ${cols.length}`);
