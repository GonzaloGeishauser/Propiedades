const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

test('caches every local runtime module', () => {
  assert.match(sw, /mis-propiedades-v3/);
  assert.match(sw, /app-config\.js/);
  assert.match(sw, /app-sync\.js/);
});

test('uses the approved patrimonial PWA colors', () => {
  assert.equal(manifest.theme_color, '#173C36');
  assert.equal(manifest.background_color, '#F6F4EF');
  assert.equal(manifest.display, 'standalone');
});
