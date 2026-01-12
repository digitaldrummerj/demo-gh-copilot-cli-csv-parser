/**
 * Common test setup and configuration
 * Shared across all test files
 */

const { execSync } = require('child_process');
const {
  cleanTestOutput,
  cleanTestTemp,
  getTestEnv
} = require('./helpers');

// Test exec options with environment
const testExecOptions = {
  encoding: 'utf8',
  env: getTestEnv()
};

/**
 * Standard beforeEach hook for tests
 */
async function setupTest() {
  await cleanTestOutput();
  await cleanTestTemp();
}

/**
 * Standard afterEach hook for tests
 */
async function teardownTest() {
  await cleanTestTemp();
}

/**
 * Execute command with test environment
 */
function execCommand(command, options = {}) {
  return execSync(command, { ...testExecOptions, ...options });
}

module.exports = {
  testExecOptions,
  setupTest,
  teardownTest,
  execCommand
};
