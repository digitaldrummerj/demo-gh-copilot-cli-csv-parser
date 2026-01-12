const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const {
  createTempTestFile,
  fileExists,
  findBackupFolders,
  readCSV
} = require('./helpers');
const { testExecOptions, setupTest, teardownTest, execCommand } = require('./test-setup');

describe('Parse Command', () => {
  beforeEach(setupTest);
  afterEach(teardownTest);

  test('should parse CSV and create files by tags', async () => {
    const output = execSync(
      'node index.js parse test/fixtures/test-basic.csv Tags',
      testExecOptions
    );

    assert.ok(output.includes('Parse Summary'));
    assert.ok(output.includes('Total Tags: 3'));
    assert.ok(await fileExists('output-test/test-basic/customer.csv'));
    assert.ok(await fileExists('output-test/test-basic/prospect.csv'));
    assert.ok(await fileExists('output-test/test-basic/vip.csv'));
    assert.ok(await fileExists('output-test/test-basic/untagged.csv'));
    assert.ok(await fileExists('output-test/test-basic/summary.log'));
  });

  test('should handle records with multiple tags correctly', async () => {
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');

    const customerRecords = await readCSV('output-test/test-basic/customer.csv');
    const vipRecords = await readCSV('output-test/test-basic/vip.csv');

    // Bob has both customer and vip tags
    assert.strictEqual(customerRecords.length, 2); // Alice and Bob
    assert.strictEqual(vipRecords.length, 1); // Bob only
    assert.ok(customerRecords.some(r => r.Name === 'Bob'));
    assert.ok(vipRecords.some(r => r.Name === 'Bob'));
  });

  test('should handle untagged records', async () => {
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');

    const untaggedRecords = await readCSV('output-test/test-basic/untagged.csv');
    assert.strictEqual(untaggedRecords.length, 1);
    assert.strictEqual(untaggedRecords[0].Name, 'Diana');
  });

  test('should create summary log with correct format', async () => {
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');

    const summary = await fs.readFile('output-test/test-basic/summary.log', 'utf8');
    assert.ok(summary.includes('Parse Summary'));
    assert.ok(summary.includes('Source File: test/fixtures/test-basic.csv'));
    assert.ok(summary.includes('Tag Column: Tags'));
    assert.ok(summary.includes('Files Created:'));
    assert.ok(summary.includes('customer.csv'));
    assert.ok(summary.includes('Total:'));
  });

  test('should sanitize tag names for filenames', async () => {
    const testFile = await createTempTestFile('test-special-chars.csv', 
      'ID,Name,Tags\n1,Test,"my-tag!@#$%"');

    execCommand(`node index.js parse ${testFile} Tags`);
    assert.ok(await fileExists('output-test/test-special-chars/my_tag_____.csv'));
  });

  test('should backup existing files before overwriting', async () => {
    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');
    
    await new Promise(resolve => setTimeout(resolve, 100));

    execCommand('node index.js parse test/fixtures/test-basic.csv Tags');

    const backups = await findBackupFolders('output-test/test-basic');
    assert.ok(backups.length > 0, 'Should create backup folder');
    assert.ok(backups[0].includes('backup_'), 'Backup folder should have correct name');
  });

  test('should handle case-insensitive tag column', async () => {
    const output = execSync(
      'node index.js parse test/fixtures/test-case-sensitive.csv tags',
      testExecOptions
    );

    assert.ok(output.includes('Parse Summary'));
    assert.ok(await fileExists('output-test/test-case-sensitive/customer.csv'));
  });

  test('should error on duplicate tag columns with different casing', async () => {
    const output = execCommand('node index.js parse test/fixtures/test-duplicate-columns.csv Tags');
    
    assert.ok(output.includes('Multiple tag columns found'), `Expected error message, got: ${output}`);
  });

  test('should error on non-existent file', async () => {
    const output = execCommand('node index.js parse nonexistent.csv Tags');
    
    assert.ok(output.includes('not found'), `Expected 'not found' in output, got: ${output}`);
  });
});
