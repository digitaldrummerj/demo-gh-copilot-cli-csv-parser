const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const {
  fileExists,
  findBackupFolders
} = require('./helpers');
const { testExecOptions, setupTest, teardownTest } = require('./test-setup');

describe('Diff Command', () => {
  beforeEach(setupTest);
  afterEach(teardownTest);

  test('should identify new and changed records', async () => {
    const output = execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );

    assert.ok(output.includes('Diff Summary'));
    assert.ok(output.includes('New Records: 1')); // Eve
    assert.ok(output.includes('Changed Records: 2')); // Bob's email changed, Charlie's tag changed
    assert.ok(await fileExists('output-test/test-basic/diff/summary.log'));
  });

  test('should create diff files organized by tags', async () => {
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );

    assert.ok(await fileExists('output-test/test-basic/diff/customer.csv'));
    assert.ok(await fileExists('output-test/test-basic/diff/prospect.csv'));
  });

  test('should handle no differences gracefully', async () => {
    const output = execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );

    assert.ok(output.includes('No differences found'));
  });

  test('should create backup for diff directory', async () => {
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { ...testExecOptions, shell: '/bin/bash' }
    );

    const backups = await findBackupFolders('output-test/test-basic/diff');
    assert.ok(backups.length > 0, 'Should create backup folder in diff directory');
  });
});
