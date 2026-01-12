const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const { createTempTestFile } = require('./helpers');
const { testExecOptions, setupTest, teardownTest } = require('./test-setup');

describe('Error Handling', () => {
  beforeEach(setupTest);
  afterEach(teardownTest);

  test('should handle empty CSV file gracefully', async () => {
    const testFile = await createTempTestFile('test-empty.csv', 'ID,Name,Tags\n');

    const output = execSync(`node index.js parse ${testFile} Tags`, testExecOptions);
    assert.ok(output.includes('Parse Summary'));
  });

  test('should handle CSV with only headers', async () => {
    const testFile = await createTempTestFile('test-headers-only.csv', 'ID,Name,Tags');

    const output = execSync(`node index.js parse ${testFile} Tags`, testExecOptions);
    assert.ok(output.includes('Parse Summary'));
  });
});
