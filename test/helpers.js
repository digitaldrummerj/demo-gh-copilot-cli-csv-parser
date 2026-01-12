const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const fsSync = require('fs');

// Test output directories
const TEST_OUTPUT_DIR = path.join(__dirname, '..', 'output');
const TEST_TEMP_DIR = path.join(__dirname, 'temp');

/**
 * Clean up test output directories
 */
async function cleanTestOutput() {
  try {
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  } catch (err) {
    // Ignore if doesn't exist
  }
}

/**
 * Clean up test temp directory
 */
async function cleanTestTemp() {
  try {
    await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
  } catch (err) {
    // Ignore if doesn't exist
  }
}

/**
 * Ensure test temp directory exists
 */
async function ensureTestTemp() {
  await fs.mkdir(TEST_TEMP_DIR, { recursive: true });
}

/**
 * Create a temporary test file
 */
async function createTempTestFile(filename, content) {
  await ensureTestTemp();
  const filePath = path.join(TEST_TEMP_DIR, filename);
  await fs.writeFile(filePath, content);
  return filePath;
}

/**
 * Read CSV file and return records
 */
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fsSync.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

/**
 * Read CSV file and return headers
 */
async function readCSVHeaders(filePath) {
  return new Promise((resolve, reject) => {
    let headers = [];
    fsSync.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        resolve(headers);
      })
      .on('error', reject);
  });
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Count files in directory
 */
async function countFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const stats = await Promise.all(
      files.map(f => fs.stat(path.join(dirPath, f)))
    );
    return files.filter((_, i) => stats[i].isFile()).length;
  } catch {
    return 0;
  }
}

/**
 * Get all backup folders in a directory recursively
 */
async function findBackupFolders(dirPath) {
  const backups = [];
  
  async function search(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.name.startsWith('backup_')) {
            backups.push(fullPath);
          }
          await search(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
  }
  
  await search(dirPath);
  return backups;
}

module.exports = {
  TEST_OUTPUT_DIR,
  TEST_TEMP_DIR,
  cleanTestOutput,
  cleanTestTemp,
  ensureTestTemp,
  createTempTestFile,
  readCSV,
  readCSVHeaders,
  fileExists,
  countFiles,
  findBackupFolders
};
