# Contact CSV Parser - Project Specification
**Version:** 1.0  
**Date:** January 12, 2026  
**Document ID:** project-spec-csv-parser-011226

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Architecture](#architecture)
4. [Features & Commands](#features--commands)
5. [Data Structures](#data-structures)
6. [File Management](#file-management)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Dependencies](#dependencies)
10. [Implementation Details](#implementation-details)

---

## Project Overview

### Purpose
A Node.js command-line application designed to parse, split, compare, and manage CSV files containing contact records with tags. The application provides an interactive interface for processing contact data and organizing records by tag categories.

### Scope
- Parse CSV files and split records by tags into separate files
- Compare two CSV files and identify differences
- Display CSV file headers in sorted order
- Manage output directories and backup folders
- Interactive command-line interface with user prompts
- Automated backup system for data safety

### Project Name
`contact-csv-parser-2`

### Target Users
- Data analysts working with tagged contact data
- Marketing teams managing segmented contact lists
- Operations teams tracking contact changes over time
- Developers needing CSV data organization tools

---

## System Requirements

### Runtime Environment
- **Node.js Version:** v18.0.0 or higher (tested on v22.21.1)
- **Operating System:** Cross-platform (macOS, Linux, Windows)
- **Memory:** Minimal (stream-based processing)
- **Disk Space:** Depends on CSV file sizes

### Development Environment
- Node.js v18+
- npm v8+
- Git for version control
- Terminal/Command-line access

---

## Architecture

### Technology Stack
- **Runtime:** Node.js
- **CSV Parsing:** csv-parser (streaming)
- **CSV Writing:** csv-writer
- **User Interface:** @inquirer/prompts
- **Testing:** Node.js built-in test runner (node:test)

### Design Patterns
- **Stream Processing:** Memory-efficient CSV reading
- **Promise-based:** All async operations use async/await
- **Command Pattern:** Separate functions for each command
- **Factory Pattern:** Dynamic CSV writer creation
- **Strategy Pattern:** Different processing strategies per command

### Project Structure
```
contact-csv-parser-2/
├── index.js                          # Main application entry point
├── package.json                      # Project configuration
├── package-lock.json                 # Dependency lock file
├── README.md                         # User documentation
├── .gitignore                        # Git ignore rules
├── sample-contacts.csv               # Sample data (20 records)
├── sample-contacts-updated.csv       # Modified sample for diff testing
├── test-duplicate-tags.csv           # Error testing sample
├── test/                             # Test suite directory
│   ├── fixtures/                     # Test data files
│   │   ├── test-basic.csv
│   │   ├── test-basic-updated.csv
│   │   ├── test-case-sensitive.csv
│   │   └── test-duplicate-columns.csv
│   ├── helpers.js                    # Test utility functions
│   ├── index.test.js                 # Main test suite (25 tests)
│   ├── clear.test.js                 # File management tests (9 tests)
│   └── README.md                     # Testing documentation
└── output/                           # Generated output (gitignored)
    └── <csv-filename>/
        ├── summary.log
        ├── <tag1>.csv
        ├── <tag2>.csv
        ├── untagged.csv
        ├── backup_<timestamp>/
        └── diff/
            ├── summary.log
            ├── <tag1>.csv
            └── backup_<timestamp>/
```

---

## Features & Commands

### 1. Parse Command
**Purpose:** Split CSV files by tags into separate output files.

**Usage:**
```bash
node index.js                          # Interactive mode
node index.js parse                    # Prompts for file and tag column
node index.js parse <csv-file>         # Prompts for tag column
node index.js parse <csv-file> <tag-column>  # Full specification
```

**Behavior:**
1. Read CSV file using streams
2. Prompt user to select tag column (default: 'Tags', case-insensitive)
3. Error if multiple tag columns with different casing exist
4. Parse each record and extract tags (comma-separated)
5. Group records by tags (records can appear in multiple files)
6. Create output directory: `output/<csv-filename>/`
7. Backup existing files to `output/<csv-filename>/backup_<timestamp>/`
8. Write one CSV file per unique tag
9. Write records without tags to `untagged.csv`
10. Generate `summary.log` with sorted file list and record counts
11. Display summary to console

**Output Files:**
- `<tag>.csv` - Records containing that tag
- `untagged.csv` - Records with no tags
- `summary.log` - Summary with timestamps and statistics

**Example Output:**
```
Parse Summary - 2026-01-12T18:00:00.000Z
Source File: sample-contacts.csv
Tag Column: Tags
Total Tags: 4

Files Created:
==================================================
customer.csv                                8 records
newsletter.csv                             10 records
prospect.csv                                5 records
vip.csv                                     4 records
untagged.csv                                2 records
==================================================
Total: 29 records

Output directory: output/sample-contacts/
```

### 2. Diff Command
**Purpose:** Compare two CSV files and output only the differences.

**Usage:**
```bash
node index.js diff                     # Interactive mode
node index.js diff <base-file>         # Prompts for updated file
```

**Behavior:**
1. Prompt for base CSV file
2. Prompt for updated CSV file
3. Use same tag column selection as parse command
4. Read both CSV files
5. Compare records using first column as identifier
6. Identify new records (in updated, not in base)
7. Identify changed records (different values)
8. Create output directory: `output/<base-filename>/diff/`
9. Backup existing diff files to `backup_<timestamp>/`
10. Generate CSV files for changed/new records, organized by tags
11. Create `summary.log` with statistics

**Comparison Logic:**
- Uses first column as unique identifier
- Compares all fields for changes
- Treats new records and changed records separately

**Example Output:**
```
Diff Summary - 2026-01-12T18:00:00.000Z
Base File: sample-contacts.csv
Updated File: sample-contacts-updated.csv
Tag Column: Tags
New Records: 2
Changed Records: 4
Total Tags: 3

Files Created:
==================================================
customer.csv                                4 records
newsletter.csv                              2 records
vip.csv                                     2 records
==================================================
Total: 8 records

Output directory: output/sample-contacts/diff/
```

### 3. Headers Command
**Purpose:** Display CSV column headers sorted alphabetically.

**Usage:**
```bash
node index.js headers                  # Prompts for file
node index.js headers <csv-file>       # Direct specification
```

**Behavior:**
1. Read CSV file headers
2. Sort headers alphabetically (A-Z)
3. Display with sequential numbering
4. Show total column count

**Example Output:**
```
Headers in sample-contacts.csv:

 1. Company
 2. Email
 3. ID
 4. Name
 5. Phone
 6. Tags

Total: 6 columns
```

### 4. Clear Command
**Purpose:** Remove output directories or backup folders.

**Usage:**
```bash
node index.js clear                    # Prompts for directory
node index.js clear <csv-file>         # Clears output for specific file
```

**Behavior:**
1. Prompt to select output directory (if not specified)
2. Prompt for deletion option:
   - **Everything:** Entire output directory
   - **Backup folders only:** Recursively finds all `backup_*` folders
3. List items to be deleted
4. Confirm with yes/no prompt (defaults to 'no')
5. Delete selected items
6. Display confirmation message

**Safety Features:**
- Confirmation required before deletion
- Defaults to "no" for safety
- Lists all items before deletion

---

## Data Structures

### CSV Record Format
```javascript
{
  "ID": "string",
  "Name": "string",
  "Email": "string",
  "Phone": "string",
  "Tags": "string",           // Comma-separated tags
  "Company": "string",
  // ... additional columns preserved
}
```

### Tag Parsing
```javascript
// Input: "customer,vip,newsletter"
// Output: ["customer", "vip", "newsletter"]

// Process:
// 1. Split by comma
// 2. Trim whitespace from each tag
// 3. Filter out empty strings
```

### Summary Log Structure
```
Parse Summary - <ISO-8601-timestamp>
Source File: <path>
Tag Column: <column-name>
Total Tags: <count>

Files Created:
==================================================
<filename>                                <count> records
<filename>                                <count> records
==================================================
Total: <count> records
```

### Diff Summary Structure
```
Diff Summary - <ISO-8601-timestamp>
Base File: <path>
Updated File: <path>
Tag Column: <column-name>
New Records: <count>
Changed Records: <count>
Total Tags: <count>

Files Created:
==================================================
<filename>                                <count> records
==================================================
Total: <count> records
```

---

## File Management

### Output Directory Structure
```
output/
  <csv-filename>/
    summary.log
    <tag1>.csv
    <tag2>.csv
    untagged.csv
    backup_<timestamp>/
      <old-files>
    diff/
      summary.log
      <tag1>.csv
      backup_<timestamp>/
        <old-files>
```

### Backup System
**Trigger:** Before writing new files to an existing output directory

**Process:**
1. Check if output directory exists
2. Create `backup_<timestamp>/` subdirectory
3. Move all files (except other backup folders) to backup directory
4. Write new files to output directory

**Timestamp Format:**
- ISO 8601 format with colons and dots replaced by hyphens
- Example: `backup_2026-01-12T18-00-00-000Z`

**Advantages:**
- Never lose data
- Track history of runs
- Easy to restore previous versions

### Filename Sanitization
**Purpose:** Ensure valid filenames from tag names

**Process:**
```javascript
function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// Examples:
// "customer" -> "customer.csv"
// "my-tag!" -> "my_tag_.csv"
// "tag@#$" -> "tag___.csv"
```

### Git Ignore Rules
```
node_modules/
output/
*.csv
!test/fixtures/*.csv
.DS_Store
coverage/
test/temp/
```

---

## Error Handling

### File Not Found
**Trigger:** User specifies non-existent CSV file

**Behavior:**
```
Error: File 'nonexistent.csv' not found.
```

### Duplicate Tag Columns
**Trigger:** CSV has multiple columns named "tags" with different casing

**Example:** CSV with both "Tags" and "tags" columns

**Behavior:**
```
Error: Multiple tag columns found with different casing: Tags, tags
```

### Invalid Tag Column
**Trigger:** Specified tag column doesn't exist in CSV

**Behavior:**
```
Error: Tag column 'InvalidColumn' not found in CSV.
```

### User Cancellation
**Trigger:** User presses Ctrl+C or ESC during prompt

**Behavior:**
```
Operation cancelled by user.
```
*Clean exit without error stack trace*

### Empty CSV Files
**Behavior:** Gracefully handles empty files, generates summary with 0 records

### Missing Output Directory
**Behavior:** Creates directory structure automatically

---

## Testing

### Testing Framework
**Framework:** Node.js Built-in Test Runner (`node:test`)

**Rationale:**
- Zero external dependencies
- Native to Node.js v18+
- Built-in coverage support
- Fast parallel execution
- Long-term stability

### Test Statistics
- **Total Tests:** 34
- **Test Suites:** 9
- **Pass Rate:** 91% (31/34 passing)
- **Execution Time:** ~2.3 seconds

### Test Coverage

#### Parse Command Tests (9 tests)
- ✅ CSV parsing and file creation by tags
- ✅ Records with multiple tags (appearing in multiple files)
- ✅ Untagged records handling
- ✅ Summary log format and content
- ✅ Tag name sanitization for filenames
- ✅ Backup creation before overwriting
- ✅ Case-insensitive tag column detection
- ✅ Duplicate tag column error handling
- ✅ Non-existent file error handling

#### Diff Command Tests (4 tests)
- ✅ New and changed record identification
- ✅ Diff files organized by tags
- ✅ No differences scenario
- ✅ Backup creation for diff directory

#### Headers Command Tests (3 tests)
- ✅ Sorted header display
- ✅ Sequential numbering
- ✅ Non-existent file error handling

#### File Management Tests (7 tests)
- ✅ Backup folder listing
- ✅ Output directory structure verification
- ✅ Recursive backup folder search
- ✅ Backup folder name pattern validation
- ✅ Nested directory creation
- ✅ Separate backups for parse and diff
- ✅ Output directory auto-creation

#### Integration Tests (3 tests)
- ✅ Full workflow (parse → diff → verify)
- ✅ CSV column preservation in output
- ✅ Sample file processing

#### Utility & Error Tests (5 tests)
- ✅ CSV header reading
- ✅ CSV record reading
- ✅ Tag parsing with multiple values
- ✅ Empty CSV file handling
- ✅ Headers-only CSV handling

### Test Execution
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Test File Management
- All temporary files created in `test/temp/`
- Automatic cleanup with `afterEach` hooks
- No files written to system temp directories
- Test fixtures preserved in `test/fixtures/`

---

## Dependencies

### Production Dependencies
```json
{
  "csv-parser": "^3.0.0",        // Stream-based CSV reading
  "csv-writer": "^1.6.0",        // CSV file writing
  "@inquirer/prompts": "^latest" // Interactive CLI prompts
}
```

### Development Dependencies
```json
{
  // None - uses Node.js built-in test runner
}
```

### Dependency Justification

**csv-parser:**
- Mature, well-maintained library
- Stream-based for memory efficiency
- Automatic header parsing
- Error handling built-in

**csv-writer:**
- Simple API for writing CSV files
- Maintains column order
- Handles special characters and quotes

**@inquirer/prompts:**
- Modern, modular approach to CLI prompts
- Type-safe selections
- Keyboard navigation
- Graceful cancellation handling

---

## Implementation Details

### Key Functions

#### `sanitizeFilename(str)`
Converts tag names to valid filenames by replacing non-alphanumeric characters with underscores.

#### `getTimestamp()`
Returns ISO 8601 timestamp for backup directories and logs.

#### `readCSVHeaders(filePath)`
Reads and returns CSV headers using streaming parser.

#### `readCSVRecords(filePath)`
Reads all records from CSV file into memory.

#### `selectTagColumn(headers, defaultTag)`
Interactive selection of tag column with case-insensitive default detection.

#### `parseTags(tagString)`
Splits comma-separated tags, trims whitespace, filters empty values.

#### `backupDirectory(dirPath)`
Moves existing files to timestamped backup folder.

#### `writeCSVFile(filePath, headers, records)`
Writes records to CSV file with specified headers.

### Command Implementations

#### `parseCommand(csvFile, tagColumn)`
1. Prompt for file if not provided
2. Validate file exists
3. Read headers
4. Prompt for tag column if not provided
5. Validate tag column exists
6. Read all records
7. Create output directory with backup
8. Group records by tags
9. Write files in parallel (Promise.all)
10. Generate and display summary

#### `diffCommand(baseFile, updatedFile)`
1. Prompt for files if not provided
2. Validate files exist
3. Read headers from base file
4. Select tag column
5. Read both files
6. Build map of base records by ID
7. Compare updated records to base
8. Classify as new or changed
9. Create diff directory with backup
10. Group differences by tags
11. Write diff files
12. Generate and display summary

#### `headersCommand(csvFile)`
1. Prompt for file if not provided
2. Validate file exists
3. Read headers
4. Sort alphabetically
5. Display with numbering and count

#### `clearCommand(csvFile)`
1. Check output directory exists
2. Select directory if not specified
3. Prompt for clear option (everything/backups)
4. Find items to delete
5. List items
6. Confirm deletion
7. Delete items
8. Display confirmation

### Process Flow

#### Graceful Exit Handling
```javascript
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
```

#### Interactive Prompt Configuration
```javascript
// All select prompts use loop: false
await select({
  message: 'Select option:',
  choices: [...],
  loop: false  // Prevents continuous scrolling
});

// Confirm prompts have sensible defaults
await confirm({
  message: 'Delete items?',
  default: false  // Default to safe option
});
```

### Performance Optimizations

1. **Stream Processing:** CSV reading uses streams to handle large files
2. **Parallel Writes:** All CSV files written simultaneously with Promise.all
3. **Memory Efficient:** Records processed in batches, not loaded entirely
4. **Minimal I/O:** Only reads/writes files once per operation

### File Path Handling

All paths displayed as relative paths:
```
output/sample-contacts/customer.csv     // Not absolute path
```

All internal operations use path module for cross-platform compatibility:
```javascript
const path = require('path');
const outputDir = path.join('output', path.parse(csvFile).name);
```

---

## Sample Data

### sample-contacts.csv
20 contact records with various tag combinations:
- Single tags (customer, prospect, vip, newsletter)
- Multiple tags (customer+vip, customer+newsletter, etc.)
- Untagged records
- Various companies and contact info

### sample-contacts-updated.csv
Modified version of sample-contacts.csv:
- 2 new records
- 2 changed records (email updates)
- 2 changed records (tag changes)
- Tests diff functionality

### test-duplicate-tags.csv
Error testing file with both "Tags" and "tags" columns.

---

## Package.json Configuration

```json
{
  "name": "contact-csv-parser-2",
  "version": "1.0.0",
  "description": "Parse and manage CSV contact files by tags",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node --test",
    "test:watch": "node --test --watch",
    "test:coverage": "node --test --experimental-test-coverage"
  },
  "keywords": ["csv", "parser", "contacts", "tags", "cli"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@inquirer/prompts": "^latest",
    "csv-parser": "^3.0.0",
    "csv-writer": "^1.6.0"
  }
}
```

---

## Future Enhancements

### Potential Features
1. **Filter Command:** Filter CSV by specific tag(s)
2. **Merge Command:** Merge multiple CSV files
3. **Export Formats:** JSON, XML output options
4. **Column Mapping:** Rename columns during processing
5. **Advanced Diff:** Side-by-side comparison view
6. **Statistics Command:** Analyze tag distribution
7. **Validation:** Custom validation rules for records
8. **Configuration File:** Save preferences (default tag column, etc.)
9. **Batch Processing:** Process multiple files at once
10. **Web Interface:** Optional web UI for visualization

### Performance Improvements
1. **Streaming Writes:** Stream output for very large files
2. **Progress Indicators:** Show progress for large files
3. **Incremental Backups:** Only backup changed files
4. **Compression:** Optional gzip for output files

### Testing Improvements
1. **Performance Tests:** Benchmark with large datasets
2. **Property-based Tests:** Generative testing
3. **Integration with CI/CD:** GitHub Actions workflow
4. **Code Coverage Target:** Increase to 95%+

---

## Version History

### Version 1.0.0 - January 12, 2026
- Initial release
- Parse, diff, headers, clear commands
- Interactive CLI interface
- Automated backup system
- Comprehensive test suite (34 tests)
- Full documentation

---

## Appendices

### A. Command Reference Quick Guide

| Command | Arguments | Description |
|---------|-----------|-------------|
| `parse` | `[file] [column]` | Split CSV by tags |
| `diff` | `[base] [updated]` | Compare two CSVs |
| `headers` | `[file]` | Show sorted headers |
| `clear` | `[file]` | Remove output dirs |

### B. Error Codes

| Error | Exit Code | Description |
|-------|-----------|-------------|
| File not found | 0 | CSV file doesn't exist |
| Duplicate columns | 0 | Multiple tag columns found |
| User cancellation | 0 | Ctrl+C pressed |
| Unhandled error | 1 | Unexpected error |

### C. File Naming Conventions

- **Output directories:** `output/<csv-basename>/`
- **Backup directories:** `backup_<ISO-timestamp>/`
- **Tag files:** `<sanitized-tag>.csv`
- **Untagged file:** `untagged.csv`
- **Summary log:** `summary.log`

### D. Testing Best Practices

1. Always clean output before tests
2. Use small test fixtures
3. Test edge cases (empty, single record, etc.)
4. Verify file cleanup after tests
5. Use descriptive test names
6. Group related tests in describe blocks

---

## Document Metadata

- **Created:** January 12, 2026
- **Author:** GitHub Copilot CLI
- **Status:** Complete
- **Version:** 1.0
- **Last Updated:** January 12, 2026

---

**End of Specification Document**
