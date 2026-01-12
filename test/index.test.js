const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const {
  cleanTestOutput,
  cleanTestTemp,
  createTempTestFile,
  readCSV,
  readCSVHeaders,
  fileExists,
  countFiles,
  findBackupFolders
} = require('./helpers');

// Test configuration
const TEST_TIMEOUT = 10000;

describe('Contact CSV Parser - Parse Command', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should parse CSV and create files by tags', async (t) => {
    const output = execSync(
      'node index.js parse test/fixtures/test-basic.csv Tags',
      { encoding: 'utf8' }
    );

    assert.ok(output.includes('Parse Summary'));
    assert.ok(output.includes('Total Tags: 3'));
    assert.ok(await fileExists('output/test-basic/customer.csv'));
    assert.ok(await fileExists('output/test-basic/prospect.csv'));
    assert.ok(await fileExists('output/test-basic/vip.csv'));
    assert.ok(await fileExists('output/test-basic/untagged.csv'));
    assert.ok(await fileExists('output/test-basic/summary.log'));
  });

  test('should handle records with multiple tags correctly', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const customerRecords = await readCSV('output/test-basic/customer.csv');
    const vipRecords = await readCSV('output/test-basic/vip.csv');

    // Bob has both customer and vip tags
    assert.strictEqual(customerRecords.length, 2); // Alice and Bob
    assert.strictEqual(vipRecords.length, 1); // Bob only
    assert.ok(customerRecords.some(r => r.Name === 'Bob'));
    assert.ok(vipRecords.some(r => r.Name === 'Bob'));
  });

  test('should handle untagged records', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const untaggedRecords = await readCSV('output/test-basic/untagged.csv');
    assert.strictEqual(untaggedRecords.length, 1);
    assert.strictEqual(untaggedRecords[0].Name, 'Diana');
  });

  test('should create summary log with correct format', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const summary = await fs.readFile('output/test-basic/summary.log', 'utf8');
    assert.ok(summary.includes('Parse Summary'));
    assert.ok(summary.includes('Source File: test/fixtures/test-basic.csv'));
    assert.ok(summary.includes('Tag Column: Tags'));
    assert.ok(summary.includes('Files Created:'));
    assert.ok(summary.includes('customer.csv'));
    assert.ok(summary.includes('Total:'));
  });

  test('should sanitize tag names for filenames', async () => {
    // Create a test file with special characters in tags
    const testFile = await createTempTestFile('test-special-chars.csv', 
      'ID,Name,Tags\n1,Test,"my-tag!@#$%"');

    execSync(`node index.js parse ${testFile} Tags`);
    assert.ok(await fileExists('output/test-special-chars/my_tag_____.csv'));
  });

  test('should backup existing files before overwriting', async () => {
    // First run
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    
    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second run - should create backup
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const backups = await findBackupFolders('output/test-basic');
    assert.ok(backups.length > 0, 'Should create backup folder');
    assert.ok(backups[0].includes('backup_'), 'Backup folder should have correct name');
  });

  test('should handle case-insensitive tag column', async () => {
    const output = execSync(
      'node index.js parse test/fixtures/test-case-sensitive.csv tags',
      { encoding: 'utf8' }
    );

    assert.ok(output.includes('Parse Summary'));
    assert.ok(await fileExists('output/test-case-sensitive/customer.csv'));
  });

  test('should error on duplicate tag columns with different casing', async () => {
    try {
      execSync('node index.js parse test/fixtures/test-duplicate-columns.csv Tags', {
        encoding: 'utf8'
      });
      assert.fail('Should have thrown error');
    } catch (error) {
      const output = error.stdout || error.message || '';
      assert.ok(output.includes('Multiple tag columns found'), `Expected error message, got: ${output}`);
    }
  });

  test('should error on non-existent file', async () => {
    try {
      execSync('node index.js parse nonexistent.csv Tags', {
        encoding: 'utf8'
      });
      assert.fail('Should have thrown error');
    } catch (error) {
      const output = error.stdout || error.message || '';
      assert.ok(output.includes('not found'), `Expected 'not found' in output, got: ${output}`);
    }
  });
});

describe('Contact CSV Parser - Diff Command', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should identify new and changed records', async () => {
    const output = execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { encoding: 'utf8', shell: '/bin/bash' }
    );

    assert.ok(output.includes('Diff Summary'));
    assert.ok(output.includes('New Records: 1')); // Eve
    assert.ok(output.includes('Changed Records: 2')); // Bob's email changed, Charlie's tag changed
    assert.ok(await fileExists('output/test-basic/diff/summary.log'));
  });

  test('should create diff files organized by tags', async () => {
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    assert.ok(await fileExists('output/test-basic/diff/customer.csv'));
    assert.ok(await fileExists('output/test-basic/diff/prospect.csv'));
  });

  test('should handle no differences gracefully', async () => {
    const output = execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic.csv',
      { encoding: 'utf8', shell: '/bin/bash' }
    );

    assert.ok(output.includes('No differences found'));
  });

  test('should create backup for diff directory', async () => {
    // First diff
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second diff - should create backup
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    const backups = await findBackupFolders('output/test-basic/diff');
    assert.ok(backups.length > 0, 'Should create backup folder in diff directory');
  });
});

describe('Contact CSV Parser - Headers Command', () => {
  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should display sorted headers', async () => {
    const output = execSync('node index.js headers test/fixtures/test-basic.csv', {
      encoding: 'utf8'
    });

    assert.ok(output.includes('Email'));
    assert.ok(output.includes('ID'));
    assert.ok(output.includes('Name'));
    assert.ok(output.includes('Tags'));
    assert.ok(output.includes('Total: 4 columns'));
  });

  test('should number headers sequentially', async () => {
    const output = execSync('node index.js headers test/fixtures/test-basic.csv', {
      encoding: 'utf8'
    });

    assert.ok(output.match(/\s1\./));
    assert.ok(output.match(/\s2\./));
    assert.ok(output.match(/\s3\./));
    assert.ok(output.match(/\s4\./));
  });

  test('should handle non-existent file', async () => {
    try {
      execSync('node index.js headers nonexistent.csv', {
        encoding: 'utf8'
      });
      assert.fail('Should have thrown error');
    } catch (error) {
      const output = error.stdout || error.message || '';
      assert.ok(output.includes('not found'), `Expected 'not found' in output, got: ${output}`);
    }
  });
});

describe('Contact CSV Parser - Utility Functions', () => {
  test('should read CSV headers correctly', async () => {
    const headers = await readCSVHeaders('test/fixtures/test-basic.csv');
    assert.deepStrictEqual(headers, ['ID', 'Name', 'Email', 'Tags']);
  });

  test('should read CSV records correctly', async () => {
    const records = await readCSV('test/fixtures/test-basic.csv');
    assert.strictEqual(records.length, 4);
    assert.strictEqual(records[0].Name, 'Alice');
    assert.strictEqual(records[1].Name, 'Bob');
  });

  test('should parse tags with multiple values', async () => {
    const records = await readCSV('test/fixtures/test-basic.csv');
    const bobsTags = records[1].Tags;
    assert.ok(bobsTags.includes('customer'));
    assert.ok(bobsTags.includes('vip'));
  });
});

describe('Contact CSV Parser - Integration Tests', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should handle full workflow: parse, diff, and verify output', async () => {
    // Parse original file
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    const initialFileCount = await countFiles('output/test-basic');
    assert.ok(initialFileCount >= 4, 'Should create at least 4 files');

    // Run diff
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );
    assert.ok(await fileExists('output/test-basic/diff/summary.log'));

    // Verify both directories exist
    assert.ok(await fileExists('output/test-basic/summary.log'));
    assert.ok(await fileExists('output/test-basic/diff/summary.log'));
  });

  test('should preserve all CSV columns in output files', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const customerRecords = await readCSV('output/test-basic/customer.csv');
    const originalHeaders = await readCSVHeaders('test/fixtures/test-basic.csv');
    const outputHeaders = await readCSVHeaders('output/test-basic/customer.csv');

    assert.deepStrictEqual(outputHeaders, originalHeaders, 'Should preserve all columns');
  });

  test('should handle sample files correctly', async () => {
    const output = execSync('node index.js parse sample-contacts.csv Tags', {
      encoding: 'utf8'
    });

    assert.ok(output.includes('Parse Summary'));
    assert.ok(await fileExists('output/sample-contacts/customer.csv'));
    assert.ok(await fileExists('output/sample-contacts/newsletter.csv'));
    assert.ok(await fileExists('output/sample-contacts/prospect.csv'));
    assert.ok(await fileExists('output/sample-contacts/vip.csv'));
  });
});

describe('Contact CSV Parser - Error Handling', () => {
  beforeEach(async () => {
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should handle empty CSV file gracefully', async () => {
    const testFile = await createTempTestFile('test-empty.csv', 'ID,Name,Tags\n');

    const output = execSync(`node index.js parse ${testFile} Tags`, {
      encoding: 'utf8'
    });
    assert.ok(output.includes('Parse Summary'));
  });

  test('should handle CSV with only headers', async () => {
    const testFile = await createTempTestFile('test-headers-only.csv', 'ID,Name,Tags');

    const output = execSync(`node index.js parse ${testFile} Tags`, {
      encoding: 'utf8'
    });
    assert.ok(output.includes('Parse Summary'));
  });
});
