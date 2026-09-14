#!/usr/bin/env node
// Reads a Playwright JSON-reporter report and prints every test that carries
// a 'warning' annotation (pushed by annotateIncomplete() for axe "incomplete"
// results) - lets you find those without opening the HTML report.
const fs = require('fs');

const reportPath = process.argv[2];
if (!reportPath) {
  console.error(
    'Usage: node playwright/print-accessibility-warnings.js <report.json>'
  );
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function* walkSpecs(suites) {
  for (const suite of suites) {
    yield* (suite.specs ?? []).map((spec) => spec);
    if (suite.suites) yield* walkSpecs(suite.suites);
  }
}

let count = 0;
for (const spec of walkSpecs(report.suites ?? [])) {
  for (const test of spec.tests ?? []) {
    const warnings = (test.annotations ?? []).filter(
      (a) => a.type === 'warning'
    );
    if (warnings.length === 0) continue;
    count++;
    console.log(
      `\n${spec.file}:${spec.line} - ${spec.title} [${test.projectName}]`
    );
    for (const w of warnings) console.log(`  ${w.description}`);
  }
}

console.log(
  count === 0
    ? '\nNo tests with accessibility warnings found.'
    : `\n${count} test(s) with accessibility warnings.`
);
