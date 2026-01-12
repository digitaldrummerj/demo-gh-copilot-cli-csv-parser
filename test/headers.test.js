const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const { teardownTest, testExecOptions, execCommand } = require('./test-setup');

describe('Headers Command', () => {
  afterEach(teardownTest);

  test('should display sorted headers', async () => {
    const output = execSync('node index.js headers test/fixtures/test-basic.csv', testExecOptions);

    assert.ok(output.includes('Email'));
    assert.ok(output.includes('ID'));
    assert.ok(output.includes('Name'));
    assert.ok(output.includes('Tags'));
    assert.ok(output.includes('Total: 4 columns'));
  });

  test('should number headers sequentially', async () => {
    const output = execSync('node index.js headers test/fixtures/test-basic.csv', testExecOptions);

    assert.ok(output.match(/\s1\./));
    assert.ok(output.match(/\s2\./));
    assert.ok(output.match(/\s3\./));
    assert.ok(output.match(/\s4\./));
  });

  test('should handle non-existent file', async () => {
    const output = execCommand('node index.js headers nonexistent.csv');
    
    assert.ok(output.includes('not found'), `Expected 'not found' in output, got: ${output}`);
  });
});
