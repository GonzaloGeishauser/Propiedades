const test = require('node:test');
const assert = require('node:assert/strict');
const AppConfig = require('../app-config.js');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

test('accepts an HTTPS Apps Script exec URL', () => {
  const url = 'https://script.google.com/macros/s/abc123/exec';
  assert.equal(AppConfig.validateExecUrl(url), true);
  assert.equal(AppConfig.normalizeUrl(`  ${url}  `), url);
});

test('rejects non-HTTPS, /dev and unrelated URLs', () => {
  assert.equal(AppConfig.validateExecUrl('http://script.google.com/macros/s/x/exec'), false);
  assert.equal(AppConfig.validateExecUrl('https://script.google.com/macros/s/x/dev'), false);
  assert.equal(AppConfig.validateExecUrl('https://example.com/exec'), false);
});

test('persists, loads and clears the configured URL', () => {
  const storage = memoryStorage();
  const url = 'https://script.google.com/macros/s/abc123/exec';
  assert.equal(AppConfig.saveApiUrl(storage, url), url);
  assert.equal(AppConfig.loadApiUrl(storage), url);
  AppConfig.clearApiUrl(storage);
  assert.equal(AppConfig.loadApiUrl(storage), '');
});
