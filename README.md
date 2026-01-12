# Contact CSV Parser

A Node.js command-line application to parse CSV files containing contact records with tags, split them by tags into separate files, compare CSV files, and manage output directories.

## Features

- **Parse Command**: Split CSV files by tags into separate output files
- **Diff Command**: Compare two CSV files and output only the differences
- **Headers Command**: Display CSV column headers sorted alphabetically
- **Clear Command**: Remove output directories or backup folders
- **Interactive Mode**: User-friendly prompts for all operations
- **Smart Backups**: Automatically backs up existing files before overwriting
- **Tag Handling**: Support for multiple tags per record (comma-separated)
- **Summary Logs**: Detailed logs for all operations with timestamps

## Installation

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

## Usage

### Interactive Mode

Simply run without arguments to see the command menu:

```bash
node index.js
```

or

```bash
npm start
```

### Parse Command

Parse CSV files and split by tags into separate output files.

**Usage:**
```bash
# Interactive mode - prompts for command, file, and tag column
node index.js

# Prompts for CSV file and tag column
node index.js parse

# Prompts for tag column only
node index.js parse sample-contacts.csv

# Full specification - no prompts
node index.js parse sample-contacts.csv Tags
```

**Behavior:**
- Prompts to select tag column (defaults to 'Tags', case-insensitive)
- Creates output directory: `output/<csv-filename>/`
- Backs up existing files to `output/<csv-filename>/backup_<timestamp>/`
- Generates one CSV file per unique tag
- Records with multiple tags appear in multiple files
- Records without tags saved to `untagged.csv`
- Creates `summary.log` with sorted list of created files and record counts

**Example Output:**
```
Parse Summary - 2026-01-12T16:45:30.123Z
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

### Diff Command

Compare two CSV files and output only the differences.

**Usage:**
```bash
# Interactive mode - prompts for both files
node index.js diff

# Prompts for updated file
node index.js diff sample-contacts.csv
```

**Behavior:**
- Prompts for base CSV file and updated CSV file
- Uses same tag column selection as parse command
- Compares files and identifies new or changed records
- Creates output directory: `output/<base-filename>/diff/`
- Backs up existing diff files
- Generates CSV files only for changed/new records, organized by tags
- Creates `summary.log` with statistics

**Example Output:**
```
Diff Summary - 2026-01-12T16:50:15.456Z
Base File: sample-contacts.csv
Updated File: sample-contacts-updated.csv
Tag Column: Tags
New Records: 2
Changed Records: 2
Total Tags: 4

Files Created:
==================================================
customer.csv                                3 records
newsletter.csv                              2 records
prospect.csv                                1 records
vip.csv                                     2 records
==================================================
Total: 8 records

Output directory: output/sample-contacts/diff/
```

### Headers Command

Display CSV column headers sorted alphabetically.

**Usage:**
```bash
# Prompts for CSV file
node index.js headers

# Direct specification
node index.js headers sample-contacts.csv
```

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

### Clear Command

Remove output directories or backup folders.

**Usage:**
```bash
# Prompts for directory to clear
node index.js clear

# Clears output for specific file
node index.js clear sample-contacts.csv
```

**Behavior:**
- Prompts to select output directory if not specified
- Prompts for deletion option:
  - Everything (entire output directory)
  - Backup folders only (recursively finds all `backup_*` folders)
- Lists backup folders found (if backup-only option selected)
- Confirms with yes/no prompt (defaults to 'no')
- Deletes selected items

## Output Structure

```
output/
  <csv-filename>/
    summary.log
    customer.csv
    newsletter.csv
    prospect.csv
    vip.csv
    untagged.csv
    backup_<timestamp>/
      <old-files>
    diff/
      summary.log
      customer.csv
      newsletter.csv
      backup_<timestamp>/
        <old-files>
```

## Tag Column Handling

- Case-insensitive matching for tag column
- Defaults to 'Tags' if found (any casing)
- Interactive selection from all available columns
- Error if multiple columns named "tags" with different casing
- Tags are split by comma, whitespace is trimmed, and empty values are filtered

## Sample Files

The project includes three sample CSV files for testing:

- `sample-contacts.csv` - Basic contacts with various tag combinations
- `sample-contacts-updated.csv` - Modified version with changes and new records for diff testing
- `test-duplicate-tags.csv` - Has both "Tags" and "tags" columns to test error handling

## Error Handling

- Validates file existence before processing
- Handles missing CSV files gracefully
- Handles user cancellation (Ctrl+C/ESC) with clean message
- Validates tag column exists in CSV
- Handles duplicate tag column names with different casing

## Technical Details

- Uses streams for CSV reading (memory efficient)
- Async/await for all async operations
- Promise.all for parallel file writing
- Relative paths in console output and logs
- ISO timestamp format for backups and logs
- Sanitizes tag names for filenames (replaces non-alphanumeric with underscore)
- Sorts all file lists alphabetically before output/logging

## License

ISC
