# Test Suite Documentation

## Testing Framework: Node.js Built-in Test Runner

This project uses **Node.js native test runner** (`node:test`) introduced in Node.js v18+.

### Why Node.js Test Runner?

- ✅ **Zero dependencies** - No external packages needed
- ✅ **Native performance** - Built into Node.js core
- ✅ **Modern features** - Async/await, mocking, parallel execution
- ✅ **Built-in coverage** - Code coverage without additional tools
- ✅ **Long-term support** - Maintained by Node.js team

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
node --test test/index.test.js

# Run tests matching a pattern
node --test --test-name-pattern="parse"
```

## Test Structure

```text
test/
├── fixtures/                    # Test data files
│   ├── test-basic.csv          # Basic test data
│   ├── test-basic-updated.csv  # For diff testing
│   ├── test-case-sensitive.csv # Case sensitivity tests
│   └── test-duplicate-columns.csv # Error handling tests
├── helpers.js                   # Test utility functions
├── index.test.js               # Main test suite (parse, diff, headers)
└── clear.test.js               # Clear command and file management tests
```

## Test Coverage

### Parse Command Tests

- ✅ Basic CSV parsing and file creation
- ✅ Multiple tags per record
- ✅ Untagged records handling
- ✅ Summary log generation
- ✅ Tag name sanitization
- ✅ File backup functionality
- ✅ Case-insensitive tag columns
- ✅ Duplicate column detection
- ✅ Error handling for missing files

### Diff Command Tests

- ✅ Identifying new records
- ✅ Identifying changed records
- ✅ Diff file organization by tags
- ✅ No differences scenario
- ✅ Backup creation for diff directory

### Headers Command Tests

- ✅ Sorted header display
- ✅ Sequential numbering
- ✅ Error handling for missing files

### Clear Command Tests

- ✅ Listing backup folders
- ✅ Recursive backup folder search
- ✅ Directory structure verification
- ✅ Backup timestamp format validation

### Integration Tests

- ✅ Full workflow: parse → diff → verify
- ✅ Column preservation in output
- ✅ Sample file processing
- ✅ Nested directory structure
- ✅ Separate backups for parse/diff

### Edge Cases & Error Handling

- ✅ Empty CSV files
- ✅ CSV with only headers
- ✅ Special characters in tags
- ✅ Non-existent files
- ✅ Directory creation

## Test Utilities

The `test/helpers.js` module provides reusable functions:

- `cleanTestOutput()` - Remove test output directories
- `readCSV(filePath)` - Read CSV records
- `readCSVHeaders(filePath)` - Extract CSV headers
- `fileExists(filePath)` - Check file existence
- `countFiles(dirPath)` - Count files in directory
- `findBackupFolders(dirPath)` - Find all backup folders recursively

## Test Fixtures

Test fixtures are stored in `test/fixtures/` and include:

### test-basic.csv

Basic contact data with various tag combinations:

- Single tag records
- Multiple tag records
- Untagged records

### test-basic-updated.csv

Modified version of basic file for diff testing:

- Changed records (email updates)
- New records
- Tag changes

### test-case-sensitive.csv

Tests case-insensitive tag column detection with lowercase "tags"

### test-duplicate-columns.csv

Tests error handling when both "Tags" and "tags" columns exist

## Writing New Tests

Example test structure:

```javascript
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { cleanTestOutput, fileExists } = require('./helpers');

describe('My Test Suite', () => {
  beforeEach(async () => {
    await cleanTestOutput();
  });

  test('should do something', async () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    assert.strictEqual(result, 'expected');
  });
});
```

## Continuous Integration

The test suite is designed to run in CI/CD environments:

```yaml
# Example GitHub Actions configuration
- name: Run tests
  run: npm test

- name: Run tests with coverage
  run: npm run test:coverage
```

## Coverage Goals

Current coverage targets:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Troubleshooting

### Tests fail with "ENOENT" errors

- Ensure you're running from the project root directory
- Check that test fixtures exist in `test/fixtures/`

### Tests timeout

- Increase timeout in test configuration
- Check for hanging promises or file handles

### Output directory conflicts

- Tests clean up automatically with `beforeEach`
- Manually run `rm -rf output` if needed

## Performance

The test suite is optimized for speed:

- Parallel test execution by default
- Minimal file I/O operations
- Cleanup only when necessary
- No external API calls

Average test execution time: **< 5 seconds** for full suite

## Future Improvements

Potential additions:

- Performance benchmarks
- Memory usage tests
- Concurrent operation tests
- Large file handling tests
- Mock testing for interactive prompts
