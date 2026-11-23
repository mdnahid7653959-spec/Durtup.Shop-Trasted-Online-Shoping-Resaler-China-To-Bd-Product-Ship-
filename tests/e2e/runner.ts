#!/usr/bin/env node
/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Standalone Test Suite Runner
 *
 * Usage:
 *   npx tsx tests/e2e/runner.ts
 *   npx tsx tests/e2e/runner.ts --tier=1
 *   npx tsx tests/e2e/runner.ts --tier=2
 *   npx tsx tests/e2e/runner.ts --tier=3
 *   npx tsx tests/e2e/runner.ts --tier=4
 *   npx tsx tests/e2e/runner.ts --verbose
 */

import { TestCase, TestResult, TestSuite } from './helpers/types';

// Import Tier 1 Test Suites (F1 - F14)
import { f01Tests } from './tier1/f01_guestBrowsing.test';
import { f02Tests } from './tier1/f02_authModalGate.test';
import { f03Tests } from './tier1/f03_profileCreation.test';
import { f04Tests } from './tier1/f04_cartPersistenceMerge.test';
import { f05Tests } from './tier1/f05_logoutPrivacy.test';
import { f06Tests } from './tier1/f06_orderApiEndpoint.test';
import { f07Tests } from './tier1/f07_tokenVerification.test';
import { f08Tests } from './tier1/f08_pricingRecomputation.test';
import { f09Tests } from './tier1/f09_uidSpoofingProtection.test';
import { f10Tests } from './tier1/f10_businessLogicPayment.test';
import { f11Tests } from './tier1/f11_orderIsolation.test';
import { f12Tests } from './tier1/f12_orderDetailGuard.test';
import { f13Tests } from './tier1/f13_securityRules.test';
import { f14Tests } from './tier1/f14_adminSellerWorkflows.test';

// Import Tier 2 Boundary Suites
import { authBoundaryTests } from './tier2/authBoundaries.test';
import { cartBoundaryTests } from './tier2/cartBoundaries.test';
import { pricingBoundaryTests } from './tier2/pricingBoundaries.test';
import { payloadBoundaryTests } from './tier2/payloadBoundaries.test';

// Import Tier 3 & Tier 4 Suites
import { tier3Tests } from './tier3/crossFeatureWorkflows.test';
import { tier4Tests } from './tier4/realWorldScenarios.test';

// ANSI Color Helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  white: '\x1b[37m'
};

const suites: TestSuite[] = [
  {
    tier: 1,
    title: 'Tier 1: Feature Coverage (F1-F14, >=5 tests/feature)',
    tests: [
      ...f01Tests,
      ...f02Tests,
      ...f03Tests,
      ...f04Tests,
      ...f05Tests,
      ...f06Tests,
      ...f07Tests,
      ...f08Tests,
      ...f09Tests,
      ...f10Tests,
      ...f11Tests,
      ...f12Tests,
      ...f13Tests,
      ...f14Tests
    ]
  },
  {
    tier: 2,
    title: 'Tier 2: Boundary & Corner Cases (Auth, Cart, Pricing, Payloads)',
    tests: [
      ...authBoundaryTests,
      ...cartBoundaryTests,
      ...pricingBoundaryTests,
      ...payloadBoundaryTests
    ]
  },
  {
    tier: 3,
    title: 'Tier 3: Cross-Feature Combinations (Pairwise Interception & Data Flow)',
    tests: tier3Tests
  },
  {
    tier: 4,
    title: 'Tier 4: Real-World Application Scenarios (Customer End-to-End Journeys)',
    tests: tier4Tests
  }
];

// CLI Arguments Parser
const args = process.argv.slice(2);
let selectedTier: number | null = null;
let verbose = false;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    const val = parseInt(arg.split('=')[1], 10);
    if ([1, 2, 3, 4].includes(val)) {
      selectedTier = val;
    }
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  }
}

async function runTestSuite(suite: TestSuite): Promise<{ results: TestResult[]; duration: number }> {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} ${suite.title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} Total Tests: ${suite.tests.length}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);

  const results: TestResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < suite.tests.length; i++) {
    const test = suite.tests[i];
    const testStart = Date.now();
    let passed = false;
    let errorMsg: string | undefined;

    try {
      await test.run();
      passed = true;
    } catch (err: any) {
      passed = false;
      errorMsg = err.stack || err.message || String(err);
    }

    const testDuration = Date.now() - testStart;
    results.push({
      tier: suite.tier,
      feature: test.feature,
      id: test.id,
      name: test.name,
      passed,
      durationMs: testDuration,
      error: errorMsg
    });

    const statusIcon = passed ? `${colors.green}✔ PASS${colors.reset}` : `${colors.red}✖ FAIL${colors.reset}`;
    const idBadge = `${colors.dim}[${test.id}]${colors.reset}`;
    const durationText = `${colors.dim}(${testDuration}ms)${colors.reset}`;

    console.log(`  ${statusIcon} ${idBadge} ${test.name} ${durationText}`);

    if (!passed && errorMsg) {
      console.log(`\n${colors.red}    Error Details:${colors.reset}`);
      const indented = errorMsg.split('\n').map((line) => `      ${line}`).join('\n');
      console.log(`${colors.yellow}${indented}${colors.reset}\n`);
    }
  }

  const duration = Date.now() - startTime;
  return { results, duration };
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}`);
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║               DURTUP.SHOP MANDATORY AUTHENTICATION E2E RUNNER            ║');
  console.log('║                 Comprehensive 4-Tier Test Suite Verification             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const activeSuites = selectedTier !== null
    ? suites.filter((s) => s.tier === selectedTier)
    : suites;

  if (activeSuites.length === 0) {
    console.error(`${colors.red}Error: No test suites match --tier=${selectedTier}${colors.reset}`);
    process.exit(1);
  }

  const overallStart = Date.now();
  const allResults: TestResult[] = [];
  const tierSummary: Array<{ tier: number; name: string; total: number; passed: number; failed: number; duration: number }> = [];

  for (const suite of activeSuites) {
    const { results, duration } = await runTestSuite(suite);
    allResults.push(...results);

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    tierSummary.push({
      tier: suite.tier,
      name: suite.title.split(':')[0],
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      duration
    });
  }

  const overallDuration = Date.now() - overallStart;
  const totalTests = allResults.length;
  const totalPassed = allResults.filter((r) => r.passed).length;
  const totalFailed = allResults.filter((r) => !r.passed).length;

  // Print Summary Table
  console.log(`\n${colors.bold}${colors.white}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.white}                     E2E TEST EXECUTION SUMMARY                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.white}======================================================================${colors.reset}`);
  console.log(`| Tier   | Description                     | Total | Passed | Failed | Time (ms) |`);
  console.log(`|--------|---------------------------------|-------|--------|--------|-----------|`);

  for (const s of tierSummary) {
    const statusCol = s.failed === 0 ? colors.green : colors.red;
    const tierLabel = `Tier ${s.tier}`.padEnd(6);
    const desc = (s.tier === 1 ? 'Feature Coverage (F1-F14)' :
                  s.tier === 2 ? 'Boundaries & Corner Cases' :
                  s.tier === 3 ? 'Cross-Feature Combinations' : 'Real-World Scenarios').padEnd(31);
    const tot = String(s.total).padStart(5);
    const pass = `${statusCol}${String(s.passed).padStart(6)}${colors.reset}`;
    const fail = `${s.failed > 0 ? colors.red : colors.dim}${String(s.failed).padStart(6)}${colors.reset}`;
    const time = `${String(s.duration)}ms`.padStart(9);
    console.log(`| ${tierLabel} | ${desc} | ${tot} | ${pass} | ${fail} | ${time} |`);
  }

  console.log(`|--------|---------------------------------|-------|--------|--------|-----------|`);
  const finalPassText = totalPassed === totalTests ? `${colors.green}${totalPassed}${colors.reset}` : `${colors.yellow}${totalPassed}${colors.reset}`;
  const finalFailText = totalFailed > 0 ? `${colors.red}${totalFailed}${colors.reset}` : `${colors.green}0${colors.reset}`;
  console.log(`| TOTAL  | All Active Suites               | ${String(totalTests).padStart(5)} | ${finalPassText.padStart(6)} | ${finalFailText.padStart(6)} | ${String(overallDuration)}ms   |`);
  console.log(`${colors.bold}${colors.white}======================================================================${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.bold}${colors.bgGreen}${colors.white} SUCCESS ${colors.reset} ${colors.bold}${colors.green}All ${totalTests} E2E tests passed cleanly in ${overallDuration}ms!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.bgRed}${colors.white} FAILURE ${colors.reset} ${colors.bold}${colors.red}${totalFailed} out of ${totalTests} tests failed.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal Runner Error:`, err);
  process.exit(1);
});
