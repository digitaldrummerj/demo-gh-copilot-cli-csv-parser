const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const {
  fileExists,
  countFiles,
  readCSV,
  readCSVHeaders
} = require('./helpers');
const { testExecOptions, setupTest, teardownTest, execCommand } = require('./test-setup');

describe('Integration Tests', () => {
  beforeEach(setupTest);
  afterEach(teardownTest);

  test('should handle full workflow: parse, diff, and verify output', async () => {
    // Parse original file
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');
    const initialFileCount = await countFiles('output-test/test-basic');
    assert.ok(initialFileCount >= 4, 'Should create at least 4 files');

    // Run diff
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );
    assert.ok(await fileExists('output-test/test-basic/diff/summary.log'));

    // Verify both directories exist
    assert.ok(await fileExists('output-test/test-basic/summary.log'));
    assert.ok(await fileExists('output-test/test-basic/diff/summary.log'));
  });

  test('should preserve all CSV columns in output files', async () => {
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');

    const customerRecords = await readCSV('output-test/test-basic/customer.csv');
    const originalHeaders = await readCSVHeaders('test/fixtures/test-basic.csv');
    const outputHeaders = await readCSVHeaders('output-test/test-basic/customer.csv');

    assert.deepStrictEqual(outputHeaders, originalHeaders, 'Should preserve all columns');
  });

  test('should handle sample files correctly', async () => {
    const output = execSync('node index.js parse sample-contacts.csv Tags', testExecOptions);

    assert.ok(output.includes('Parse Summary'));
    assert.ok(await fileExists('output-test/sample-contacts/customer.csv'));
    assert.ok(await fileExists('output-test/sample-contacts/newsletter.csv'));
    assert.ok(await fileExists('output-test/sample-contacts/prospect.csv'));
    assert.ok(await fileExists('output-test/sample-contacts/vip.csv'));
  });
});
