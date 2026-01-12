const { test, describe } = require('node:test');
const assert = require('node:assert');
const { readCSV, readCSVHeaders } = require('./helpers');

describe('Helper Utilities', () => {
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
