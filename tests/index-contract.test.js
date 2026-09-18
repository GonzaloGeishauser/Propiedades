const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('contains the single-page landmark structure', () => {
  for(const id of ['appSidebar','summarySection','alertsSection','propertiesSection','appStatus']){
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-live=["']polite["']/);
});

test('keeps all existing action hooks', () => {
  for(const id of ['btnInstall','btnReceipt','btnExport','btnAdd','search','fEstado','fTipo','fMora','tbody','drawer']){
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('contains dashboard and chart regions with accessible names', () => {
  for(const id of ['kpis','portfolioComposition','alerts','alertCount']){
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-label=["']Composición de la cartera["']/);
});

test('contains desktop table and mobile property list', () => {
  assert.match(html, /id=["']propertyTable["']/);
  assert.match(html, /id=["']propertyCards["']/);
  assert.match(html, /class=["'][^"']*filters-toolbar/);
});

test('declares accessible dialog and inline operation status', () => {
  assert.match(html, /id=["']drawer["'][^>]*aria-modal=["']true["']/);
  assert.match(html, /id=["']drawerStatus["']/);
});

test('loads AppConfig and contains setup hooks', () => {
  assert.match(html, /src=["']app-config\.js["']/);
  for(const id of ['setupView','setupApiUrl','setupInfoToggle','setupConnect','btnSettings']){
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('keeps Settings in mobile navigation and hides only Export', () => {
  assert.match(html, /class=["'][^"']*nav-export[^"']*["'][^>]*id=["']btnExport["']/);
  assert.doesNotMatch(html, /class=["'][^"']*nav-secondary[^"']*["'][^>]*id=["']btnSettings["']/);
});

test('does not claim that sheet data is stored on device', () => {
  assert.doesNotMatch(html, /Datos guardados en este dispositivo/);
});

test('does not contain a deployed personal Apps Script URL', () => {
  assert.doesNotMatch(html, /script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
});
