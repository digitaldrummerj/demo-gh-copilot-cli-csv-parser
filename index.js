#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { select, input, confirm } = require('@inquirer/prompts');

// Graceful exit handling
process.on('SIGINT', () => {
  console.log('\nOperation cancelled by user.');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  if (error.message === 'User force closed the prompt') {
    console.log('\nOperation cancelled by user.');
    process.exit(0);
  }
  throw error;
});

// Utility functions
function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

function getTimestamp() {
  return new Date().toISOString();
}

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

async function readCSVRecords(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fsSync.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

async function findCSVFiles() {
  const files = await fs.readdir('.');
  return files.filter(file => file.endsWith('.csv'));
}

async function selectTagColumn(headers, defaultTag = 'Tags') {
  const tagsColumns = headers.filter(h => h.toLowerCase() === defaultTag.toLowerCase());
  
  if (tagsColumns.length > 1) {
    throw new Error(`Multiple tag columns found with different casing: ${tagsColumns.join(', ')}`);
  }
  
  if (tagsColumns.length === 1) {
    const useDefault = await confirm({
      message: `Use '${tagsColumns[0]}' as tag column?`,
      default: true
    });
    
    if (useDefault) {
      return tagsColumns[0];
    }
  }
  
  return await select({
    message: 'Select tag column:',
    choices: headers.map(h => ({ value: h, name: h })),
    loop: false
  });
}

function parseTags(tagString) {
  if (!tagString) return [];
  return tagString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

async function backupDirectory(dirPath) {
  if (fsSync.existsSync(dirPath)) {
    const timestamp = getTimestamp().replace(/[:.]/g, '-');
    const backupDir = path.join(dirPath, `backup_${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });
    
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (!file.startsWith('backup_')) {
        const srcPath = path.join(dirPath, file);
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.rename(srcPath, path.join(backupDir, file));
        }
      }
    }
  }
}

async function writeCSVFile(filePath, headers, records) {
  const writer = createObjectCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h }))
  });
  await writer.writeRecords(records);
}

async function parseCommand(csvFile, tagColumn) {
  if (!csvFile) {
    const csvFiles = await findCSVFiles();
    if (csvFiles.length === 0) {
      console.log('No CSV files found in current directory.');
      return;
    }
    
    csvFile = await select({
      message: 'Select CSV file:',
      choices: csvFiles.map(f => ({ value: f, name: f })),
      loop: false
    });
  }
  
  if (!fsSync.existsSync(csvFile)) {
    console.log(`Error: File '${csvFile}' not found.`);
    return;
  }
  
  const headers = await readCSVHeaders(csvFile);
  
  if (!tagColumn) {
    tagColumn = await selectTagColumn(headers);
  } else if (!headers.includes(tagColumn)) {
    console.log(`Error: Tag column '${tagColumn}' not found in CSV.`);
    return;
  }
  
  const records = await readCSVRecords(csvFile);
  
  const outputDir = path.join('output', path.parse(csvFile).name);
  await fs.mkdir(outputDir, { recursive: true });
  await backupDirectory(outputDir);
  
  const tagGroups = {};
  const untagged = [];
  
  for (const record of records) {
    const tags = parseTags(record[tagColumn]);
    
    if (tags.length === 0) {
      untagged.push(record);
    } else {
      for (const tag of tags) {
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push(record);
      }
    }
  }
  
  const fileWrites = [];
  const fileCounts = [];
  
  for (const [tag, tagRecords] of Object.entries(tagGroups).sort()) {
    const filename = `${sanitizeFilename(tag)}.csv`;
    const filePath = path.join(outputDir, filename);
    fileWrites.push(writeCSVFile(filePath, headers, tagRecords));
    fileCounts.push({ filename, count: tagRecords.length });
  }
  
  if (untagged.length > 0) {
    const filename = 'untagged.csv';
    const filePath = path.join(outputDir, filename);
    fileWrites.push(writeCSVFile(filePath, headers, untagged));
    fileCounts.push({ filename, count: untagged.length });
  }
  
  await Promise.all(fileWrites);
  
  const totalRecords = fileCounts.reduce((sum, f) => sum + f.count, 0);
  const maxFilenameLength = Math.max(...fileCounts.map(f => f.filename.length));
  
  let summary = `Parse Summary - ${getTimestamp()}\n`;
  summary += `Source File: ${csvFile}\n`;
  summary += `Tag Column: ${tagColumn}\n`;
  summary += `Total Tags: ${Object.keys(tagGroups).length}\n\n`;
  summary += `Files Created:\n`;
  summary += `${'='.repeat(50)}\n`;
  
  for (const { filename, count } of fileCounts) {
    const padding = ' '.repeat(maxFilenameLength - filename.length);
    summary += `${filename}${padding}  ${count.toString().padStart(12)} records\n`;
  }
  
  summary += `${'='.repeat(50)}\n`;
  summary += `Total: ${totalRecords} records\n`;
  
  await fs.writeFile(path.join(outputDir, 'summary.log'), summary);
  
  console.log('\n' + summary);
  console.log(`Output directory: ${outputDir}/`);
}

async function diffCommand(baseFile, updatedFile) {
  if (!baseFile) {
    const csvFiles = await findCSVFiles();
    if (csvFiles.length === 0) {
      console.log('No CSV files found in current directory.');
      return;
    }
    
    baseFile = await select({
      message: 'Select base CSV file:',
      choices: csvFiles.map(f => ({ value: f, name: f })),
      loop: false
    });
  }
  
  if (!fsSync.existsSync(baseFile)) {
    console.log(`Error: File '${baseFile}' not found.`);
    return;
  }
  
  if (!updatedFile) {
    const csvFiles = await findCSVFiles();
    updatedFile = await select({
      message: 'Select updated CSV file:',
      choices: csvFiles.map(f => ({ value: f, name: f })),
      loop: false
    });
  }
  
  if (!fsSync.existsSync(updatedFile)) {
    console.log(`Error: File '${updatedFile}' not found.`);
    return;
  }
  
  const headers = await readCSVHeaders(baseFile);
  const tagColumn = await selectTagColumn(headers);
  
  if (!headers.includes(tagColumn)) {
    console.log(`Error: Tag column '${tagColumn}' not found in CSV.`);
    return;
  }
  
  const baseRecords = await readCSVRecords(baseFile);
  const updatedRecords = await readCSVRecords(updatedFile);
  
  const baseMap = new Map();
  const identifierCol = headers[0];
  
  for (const record of baseRecords) {
    const key = record[identifierCol];
    baseMap.set(key, record);
  }
  
  const changedRecords = [];
  const newRecords = [];
  
  for (const record of updatedRecords) {
    const key = record[identifierCol];
    const baseRecord = baseMap.get(key);
    
    if (!baseRecord) {
      newRecords.push(record);
    } else {
      const hasChanges = headers.some(h => record[h] !== baseRecord[h]);
      if (hasChanges) {
        changedRecords.push(record);
      }
    }
  }
  
  const allDiffRecords = [...newRecords, ...changedRecords];
  
  if (allDiffRecords.length === 0) {
    console.log('\nNo differences found between files.');
    return;
  }
  
  const outputDir = path.join('output', path.parse(baseFile).name, 'diff');
  await fs.mkdir(outputDir, { recursive: true });
  await backupDirectory(outputDir);
  
  const tagGroups = {};
  const untagged = [];
  
  for (const record of allDiffRecords) {
    const tags = parseTags(record[tagColumn]);
    
    if (tags.length === 0) {
      untagged.push(record);
    } else {
      for (const tag of tags) {
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push(record);
      }
    }
  }
  
  const fileWrites = [];
  const fileCounts = [];
  
  for (const [tag, tagRecords] of Object.entries(tagGroups).sort()) {
    const filename = `${sanitizeFilename(tag)}.csv`;
    const filePath = path.join(outputDir, filename);
    fileWrites.push(writeCSVFile(filePath, headers, tagRecords));
    fileCounts.push({ filename, count: tagRecords.length });
  }
  
  if (untagged.length > 0) {
    const filename = 'untagged.csv';
    const filePath = path.join(outputDir, filename);
    fileWrites.push(writeCSVFile(filePath, headers, untagged));
    fileCounts.push({ filename, count: untagged.length });
  }
  
  await Promise.all(fileWrites);
  
  const totalRecords = fileCounts.reduce((sum, f) => sum + f.count, 0);
  const maxFilenameLength = Math.max(...fileCounts.map(f => f.filename.length));
  
  let summary = `Diff Summary - ${getTimestamp()}\n`;
  summary += `Base File: ${baseFile}\n`;
  summary += `Updated File: ${updatedFile}\n`;
  summary += `Tag Column: ${tagColumn}\n`;
  summary += `New Records: ${newRecords.length}\n`;
  summary += `Changed Records: ${changedRecords.length}\n`;
  summary += `Total Tags: ${Object.keys(tagGroups).length}\n\n`;
  summary += `Files Created:\n`;
  summary += `${'='.repeat(50)}\n`;
  
  for (const { filename, count } of fileCounts) {
    const padding = ' '.repeat(maxFilenameLength - filename.length);
    summary += `${filename}${padding}  ${count.toString().padStart(12)} records\n`;
  }
  
  summary += `${'='.repeat(50)}\n`;
  summary += `Total: ${totalRecords} records\n`;
  
  await fs.writeFile(path.join(outputDir, 'summary.log'), summary);
  
  console.log('\n' + summary);
  console.log(`Output directory: ${outputDir}/`);
}

async function headersCommand(csvFile) {
  if (!csvFile) {
    const csvFiles = await findCSVFiles();
    if (csvFiles.length === 0) {
      console.log('No CSV files found in current directory.');
      return;
    }
    
    csvFile = await select({
      message: 'Select CSV file:',
      choices: csvFiles.map(f => ({ value: f, name: f })),
      loop: false
    });
  }
  
  if (!fsSync.existsSync(csvFile)) {
    console.log(`Error: File '${csvFile}' not found.`);
    return;
  }
  
  const headers = await readCSVHeaders(csvFile);
  const sortedHeaders = [...headers].sort();
  
  console.log(`\nHeaders in ${csvFile}:\n`);
  sortedHeaders.forEach((header, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${header}`);
  });
  console.log(`\nTotal: ${headers.length} columns`);
}

async function findBackupFolders(dirPath) {
  const backupFolders = [];
  
  async function search(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.name.startsWith('backup_')) {
            backupFolders.push(fullPath);
          }
          await search(fullPath);
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }
  
  await search(dirPath);
  return backupFolders;
}

async function clearCommand(csvFile) {
  const outputBase = 'output';
  
  if (!fsSync.existsSync(outputBase)) {
    console.log('No output directory found.');
    return;
  }
  
  let targetDir;
  
  if (csvFile) {
    targetDir = path.join(outputBase, path.parse(csvFile).name);
    if (!fsSync.existsSync(targetDir)) {
      console.log(`No output directory found for '${csvFile}'.`);
      return;
    }
  } else {
    const outputDirs = await fs.readdir(outputBase);
    const validDirs = [];
    
    for (const dir of outputDirs) {
      const fullPath = path.join(outputBase, dir);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        validDirs.push(dir);
      }
    }
    
    if (validDirs.length === 0) {
      console.log('No output directories found.');
      return;
    }
    
    targetDir = await select({
      message: 'Select output directory to clear:',
      choices: validDirs.map(d => ({ value: path.join(outputBase, d), name: d })),
      loop: false
    });
  }
  
  const clearOption = await select({
    message: 'What would you like to clear?',
    choices: [
      { value: 'everything', name: 'Everything (entire output directory)' },
      { value: 'backups', name: 'Backup folders only' }
    ],
    loop: false
  });
  
  let itemsToDelete = [];
  
  if (clearOption === 'everything') {
    itemsToDelete = [targetDir];
  } else {
    itemsToDelete = await findBackupFolders(targetDir);
    if (itemsToDelete.length === 0) {
      console.log('No backup folders found.');
      return;
    }
    console.log('\nBackup folders found:');
    itemsToDelete.forEach(folder => {
      console.log(`  - ${folder}`);
    });
  }
  
  const confirmed = await confirm({
    message: `Delete ${itemsToDelete.length} item(s)?`,
    default: false
  });
  
  if (!confirmed) {
    console.log('Operation cancelled.');
    return;
  }
  
  for (const item of itemsToDelete) {
    await fs.rm(item, { recursive: true, force: true });
  }
  
  console.log(`Successfully deleted ${itemsToDelete.length} item(s).`);
}

async function main() {
  const args = process.argv.slice(2);
  let command = args[0];
  
  if (!command) {
    command = await select({
      message: 'Select a command:',
      choices: [
        { value: 'parse', name: 'parse - Split CSV by tags' },
        { value: 'diff', name: 'diff - Compare two CSV files' },
        { value: 'headers', name: 'headers - Display CSV headers' },
        { value: 'clear', name: 'clear - Clear output directories' }
      ],
      loop: false
    });
  }
  
  try {
    switch (command) {
      case 'parse':
        await parseCommand(args[1], args[2]);
        break;
      case 'diff':
        await diffCommand(args[1], args[2]);
        break;
      case 'headers':
        await headersCommand(args[1]);
        break;
      case 'clear':
        await clearCommand(args[1]);
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Available commands: parse, diff, headers, clear');
    }
  } catch (error) {
    if (error.message === 'User force closed the prompt') {
      console.log('\nOperation cancelled by user.');
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

main();
