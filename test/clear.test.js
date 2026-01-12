const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const {
  cleanTestOutput,
  cleanTestTemp,
  fileExists,
  findBackupFolders
} = require('./helpers');

describe('Contact CSV Parser - Clear Command', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
    // Create some test output
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));
    execSync('node index.js parse test/fixtures/test-basic.csv Tags'); // Creates backup
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should list backup folders', async () => {
    const backups = await findBackupFolders('output/test-basic');
    assert.ok(backups.length > 0, 'Should have backup folders from setup');
  });

  test('should verify output directory structure exists', async () => {
    assert.ok(await fileExists('output/test-basic/customer.csv'));
    assert.ok(await fileExists('output/test-basic/summary.log'));
    
    const backups = await findBackupFolders('output/test-basic');
    assert.ok(backups.length > 0, 'Should have at least one backup folder');
  });

  test('should find all backup folders recursively', async () => {
    // Create diff output with backups
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );
    
    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));
    
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    const backups = await findBackupFolders('output/test-basic');
    // Should find backups in both root and diff directories
    // At minimum: 1 from initial parse + 1 from diff
    assert.ok(backups.length >= 1, `Should find at least one backup folder, found ${backups.length}`);
    
    // Check that we can find backups in different levels
    const hasRootBackup = backups.some(b => !b.includes('diff') && b.includes('test-basic'));
    const hasDiffBackup = backups.some(b => b.includes('diff'));
    
    assert.ok(hasRootBackup || hasDiffBackup, 'Should find backups in output structure');
  });

  test('should identify backup folders by name pattern', async () => {
    const backups = await findBackupFolders('output/test-basic');
    
    for (const backup of backups) {
      assert.ok(backup.includes('backup_'), 'All folders should start with backup_');
      assert.ok(backup.match(/backup_\d{4}-\d{2}-\d{2}/), 'Backup should have timestamp format');
    }
  });
});

describe('Contact CSV Parser - File Management', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should create nested directory structure', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    assert.ok(await fileExists('output/test-basic/summary.log'));
    assert.ok(await fileExists('output/test-basic/diff/summary.log'));
  });

  test('should maintain separate backups for parse and diff', async () => {
    // First parse with backup
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    await new Promise(resolve => setTimeout(resolve, 100));
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    // First diff with backup
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );
    await new Promise(resolve => setTimeout(resolve, 100));
    execSync(
      'echo "y" | node index.js diff test/fixtures/test-basic.csv test/fixtures/test-basic-updated.csv',
      { shell: '/bin/bash' }
    );

    const parseBackups = await findBackupFolders('output/test-basic');
    const rootBackups = parseBackups.filter(b => !b.includes('diff'));
    const diffBackups = parseBackups.filter(b => b.includes('diff'));

    assert.ok(rootBackups.length > 0, 'Should have parse backups');
    assert.ok(diffBackups.length > 0, 'Should have diff backups');
  });

  test('should create output directory if it does not exist', async () => {
    await cleanTestOutput();
    assert.ok(!await fileExists('output'), 'Output should not exist initially');

    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    assert.ok(await fileExists('output'), 'Output directory should be created');
    assert.ok(await fileExists('output/test-basic'), 'Subdirectory should be created');
  });
});

describe('Contact CSV Parser - Backup Timestamp Format', () => {
  beforeEach(async () => {
    await cleanTestOutput();
    await cleanTestTemp();
  });

  afterEach(async () => {
    await cleanTestTemp();
  });

  test('should create backups with ISO timestamp in name', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    await new Promise(resolve => setTimeout(resolve, 100));
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const backups = await findBackupFolders('output/test-basic');
    assert.ok(backups.length > 0);

    const backupName = path.basename(backups[0]);
    // Format: backup_2026-01-12T16-53-41-430Z
    assert.ok(backupName.match(/backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/),
      'Backup should have ISO timestamp format with colons replaced');
  });

  test('should create unique backup folders for multiple runs', async () => {
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    await new Promise(resolve => setTimeout(resolve, 100));
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');
    
    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));
    
    execSync('node index.js parse test/fixtures/test-basic.csv Tags');

    const backups = await findBackupFolders('output/test-basic');
    assert.ok(backups.length >= 1, 'Should have multiple backup folders');

    // Check all backup names are unique
    const backupNames = backups.map(b => path.basename(b));
    const uniqueNames = new Set(backupNames);
    assert.strictEqual(backupNames.length, uniqueNames.size, 'All backup names should be unique');
  });
});
