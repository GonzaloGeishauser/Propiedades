# Rediseño frontend de Mis Propiedades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Mis Propiedades en una interfaz patrimonial contemporánea, responsive y lista para copias independientes, conservando toda la funcionalidad y la integración actual con Google Sheets.

**Architecture:** La aplicación seguirá siendo una PWA sin compilación basada en HTML, CSS y JavaScript nativos. `index.html` conservará la interfaz y la orquestación; `app-sync.js` conservará el contrato de datos; un nuevo módulo UMD `app-config.js` encapsulará validación y persistencia local de la URL `/exec` para que pueda probarse con Node sin introducir dependencias.

**Tech Stack:** HTML5, CSS3, JavaScript ES2020, Node.js `node:test`, Google Apps Script Web App, SheetJS, jsPDF, Service Worker.

**Spec:** `docs/superpowers/specs/2026-09-18-rediseño-frontend-mis-propiedades-design.md`

## Global Constraints

- No incorporar frameworks, compiladores ni dependencias de desarrollo.
- No cambiar los encabezados ni conversiones de `app-sync.js`.
- No cambiar el contrato HTTP actual de Google Apps Script.
- Mantener una única pantalla continua y una identidad fija “Mis Propiedades”.
- No incluir datos de ejemplo ni una URL personal en la aplicación distribuible.
- Mantener exportación Excel, comprobantes PDF, filtros, ordenamiento e instalación PWA.
- La ayuda de la URL debe permanecer oculta hasta pulsar o enfocar el icono “i”.
- La aplicación puede abrirse offline, pero no debe simular escrituras offline.

---

### Task 1: Configuración local independiente y pruebas base

**Files:**
- Create: `app-config.js`
- Create: `tests/app-config.test.js`
- Create: `tests/app-sync.test.js`

**Interfaces:**
- Consumes: `localStorage` mediante un objeto compatible con `getItem`, `setItem` y `removeItem`.
- Produces: `AppConfig.STORAGE_KEY`, `normalizeUrl(value)`, `validateExecUrl(value)`, `loadApiUrl(storage)`, `saveApiUrl(storage, value)`, `clearApiUrl(storage)`.
- Preserves: `PropertySync.toSheet`, `PropertySync.fromSheet`, `PropertySync.validateManualId`.

- [ ] **Step 1: Escribir pruebas fallidas para configuración local**

```js
// tests/app-config.test.js
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
```

- [ ] **Step 2: Ejecutar las pruebas y comprobar el fallo esperado**

Run: `node --test tests/app-config.test.js`

Expected: FAIL porque `app-config.js` todavía no existe.

- [ ] **Step 3: Implementar el módulo de configuración**

```js
// app-config.js
(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AppConfig = api;
})(typeof self !== 'undefined' ? self : this, function(){
  const STORAGE_KEY = 'misPropiedades.apiUrl';

  function normalizeUrl(value){
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function validateExecUrl(value){
    try {
      const url = new URL(normalizeUrl(value));
      return url.protocol === 'https:' &&
        url.hostname === 'script.google.com' &&
        /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
    } catch (_) {
      return false;
    }
  }

  function loadApiUrl(storage){
    const value = storage.getItem(STORAGE_KEY);
    return validateExecUrl(value) ? normalizeUrl(value) : '';
  }

  function saveApiUrl(storage, value){
    const normalized = normalizeUrl(value);
    if (!validateExecUrl(normalized)) throw new Error('INVALID_EXEC_URL');
    storage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }

  function clearApiUrl(storage){
    storage.removeItem(STORAGE_KEY);
  }

  return { STORAGE_KEY, normalizeUrl, validateExecUrl, loadApiUrl, saveApiUrl, clearApiUrl };
});
```

- [ ] **Step 4: Ejecutar las pruebas de configuración**

Run: `node --test tests/app-config.test.js`

Expected: 3 tests PASS.

- [ ] **Step 5: Añadir pruebas de regresión para el contrato de Google Sheets**

```js
// tests/app-sync.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const PropertySync = require('../app-sync.js');

const property = {
  id:'PROP-001', referencia:'PROP-001', tipo:'Departamento', uso:'Residencial', estado:'alquilada',
  direccion:{calle:'Mitre',numero:'420',piso:'2 B',ciudad:'Balcarce',provincia:'Buenos Aires',pais:'Argentina',cp:'7620'},
  partidaARBA:'123', partidaMunicipal:'456', numGas:'G-1', numLuz:'L-1', numEscritura:'E-1',
  superficie:'74 m²', ambientes:'3', cochera:'Sí', valorEstimado:82500000, alquilerMensual:680000,
  gastosFijos:94000, gastosExtraordinarios:0, fechaCompra:'2019-07-15', valorCompra:20000000,
  inquilino:{nombre:'María López',dni:'27345678',tel:'2230000000',email:'maria@example.com'},
  contrato:{inicio:'2025-03-01',fin:'2027-02-28',duracionMeses:24,renovacion:'Anual'},
  deposito:{monto:680000,donde:'Banco'}, garantiaAdicional:'Seguro de caución', moraDias:0,
  ultimoAumento:'2026-06-01', proximoAumento:'2026-10-01', seguroVencimiento:'2026-12-18', documentacion:'Completa'
};

test('round-trips the persisted property fields', () => {
  const row = PropertySync.toSheet(property);
  const restored = PropertySync.fromSheet(row);
  assert.equal(row.ID, 'PROP-001');
  assert.equal(restored.id, 'PROP-001');
  assert.equal(restored.direccion.calle, 'Mitre');
  assert.equal(restored.inquilino.nombre, 'María López');
  assert.equal(restored.contrato.fin, '2027-02-28');
  assert.equal(restored.alquilerMensual, 680000);
});

test('keeps IDs unique while allowing the current record', () => {
  assert.equal(PropertySync.validateManualId('PROP-002', [property], null), true);
  assert.equal(PropertySync.validateManualId('PROP-001', [property], null), false);
  assert.equal(PropertySync.validateManualId('PROP-001', [property], 'PROP-001'), true);
});
```

- [ ] **Step 6: Ejecutar toda la base de pruebas**

Run: `node --test tests/*.test.js`

Expected: 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add app-config.js tests/app-config.test.js tests/app-sync.test.js
git commit -m "test: cover local config and sheet mapping"
```

---

### Task 2: Shell visual, navegación y tokens de diseño

**Files:**
- Modify: `index.html:1-446`
- Create: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: IDs existentes necesarios para los listeners (`kpis`, `alerts`, `alertCount`, `search`, `fEstado`, `fTipo`, `fMora`, `resultCount`, `btnInstall`, `btnReceipt`, `btnExport`, `btnAdd`, `tbody`, `overlay`, `drawer`).
- Produces: secciones `summarySection`, `alertsSection`, `propertiesSection`; navegación con `data-scroll-target`; región `appStatus` con `aria-live="polite"`.

- [ ] **Step 1: Escribir el contrato fallido del nuevo shell**

```js
// tests/index-contract.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('contains the single-page landmark structure', () => {
  for (const id of ['appSidebar','summarySection','alertsSection','propertiesSection','appStatus']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-live=["']polite["']/);
});

test('keeps all existing action hooks', () => {
  for (const id of ['btnInstall','btnReceipt','btnExport','btnAdd','search','fEstado','fTipo','fMora','tbody','drawer']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});
```

- [ ] **Step 2: Ejecutar el contrato y confirmar el fallo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL por ausencia de `appSidebar` y las nuevas secciones.

- [ ] **Step 3: Reemplazar la estructura superior por el shell aprobado**

Usar esta jerarquía exacta y conservar los IDs funcionales existentes dentro de ella:

```html
<div class="app-shell" id="appShell">
  <aside class="sidebar" id="appSidebar" aria-label="Navegación principal">
    <a class="brand" href="#summarySection" aria-label="Mis Propiedades, inicio">...</a>
    <nav>
      <button class="nav-item active" data-scroll-target="summarySection">Resumen</button>
      <button class="nav-item" data-scroll-target="propertiesSection">Propiedades</button>
      <button class="nav-item" data-scroll-target="alertsSection">Alertas</button>
      <button class="nav-item" id="btnReceipt">Comprobante</button>
      <button class="nav-item" id="btnExport">Exportar Excel</button>
      <button class="nav-item" id="btnSettings">Configuración</button>
    </nav>
    <div class="connection-state" id="connectionState"></div>
  </aside>
  <main class="main-content">
    <div id="appStatus" class="sr-only" aria-live="polite"></div>
    <section id="summarySection">...</section>
    <section id="alertsSection">...</section>
    <section id="propertiesSection">...</section>
  </main>
</div>
<div class="overlay" id="overlay"></div>
<aside class="drawer" id="drawer" aria-modal="true" aria-hidden="true"></aside>
```

- [ ] **Step 4: Sustituir los estilos por tokens y componentes responsive**

Definir como mínimo estos tokens y reglas estructurales; aplicar los colores, radios y espaciados a botones, tarjetas, campos, tabla y drawer:

```css
:root{
  --forest-950:#173c36; --forest-800:#285b52; --forest-600:#3f756a;
  --gold-500:#d6aa64; --ivory-50:#f6f4ef; --surface:#ffffff;
  --ink-900:#203a34; --ink-600:#66766f; --line:#e1e5df;
  --success:#24705c; --warning:#9b6a21; --danger:#a34c3c;
  --radius-sm:9px; --radius-md:14px; --radius-lg:20px;
  --shadow-card:0 6px 20px rgba(23,60,54,.06);
  --font-ui:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --font-display:"Source Serif 4",Georgia,serif;
}
.app-shell{min-height:100vh;display:grid;grid-template-columns:220px minmax(0,1fr);background:var(--ivory-50)}
.sidebar{position:sticky;top:0;height:100vh;background:var(--forest-950);padding:24px 18px;color:#fff}
.main-content{min-width:0;padding:28px clamp(18px,3vw,40px) 48px}
.card{min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-md);box-shadow:var(--shadow-card)}
:focus-visible{outline:3px solid color-mix(in srgb,var(--gold-500) 75%,white);outline-offset:2px}
@media(max-width:760px){
  .app-shell{display:block;padding-bottom:72px}
  .sidebar{position:fixed;z-index:30;inset:auto 0 0;height:64px;padding:8px 12px;display:flex}
  .sidebar .brand,.sidebar .nav-secondary,.connection-state{display:none}
  .main-content{padding:18px 14px 32px}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important}}
```

- [ ] **Step 5: Conectar la navegación interna**

```js
document.querySelectorAll('[data-scroll-target]').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({behavior:'smooth'});
  });
});
```

- [ ] **Step 6: Ejecutar contrato y regresión**

Run: `node --test tests/*.test.js`

Expected: 7 tests PASS.

- [ ] **Step 7: Verificar visualmente el shell**

Run: `python -m http.server 4173`

Expected: sidebar fija en 1440 px, contenido sin desbordes en 1024 px y navegación inferior en 390 px.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/index-contract.test.js
git commit -m "feat: add patrimonial application shell"
```

---

### Task 3: KPIs, gráficos y alertas accionables

**Files:**
- Modify: `index.html:448-523`
- Modify: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: `PROPIEDADES`, `fmtMoneda`, `fmtFecha`, `diasEntre`, `openDrawer(index)`.
- Produces: `getDashboardMetrics(properties)`, `getPortfolioComposition(properties)`, `buildAlerts(properties, today)`, `renderKPIs()`, `renderComposition()`, `renderAlertas()`.

- [ ] **Step 1: Añadir pruebas estáticas fallidas de las regiones del dashboard**

```js
test('contains dashboard and chart regions with accessible names', () => {
  for (const id of ['kpis','portfolioComposition','alerts','alertCount']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-label=["']Composición de la cartera["']/);
});
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL por ausencia de `portfolioComposition`.

- [ ] **Step 3: Implementar métricas y composición usando solo datos actuales**

```js
function getDashboardMetrics(properties){
  const total = properties.length;
  const occupied = properties.filter(p => p.estado === 'alquilada').length;
  const estimatedValue = properties.reduce((sum,p) => sum + (Number(p.valorEstimado)||0), 0);
  const monthlyIncome = properties.reduce((sum,p) => sum + (Number(p.alquilerMensual)||0), 0);
  return {
    total, estimatedValue, monthlyIncome,
    occupancy: total ? Math.round(occupied / total * 100) : 0,
    averageYield: Number(calcRentPromedio()),
    attention: properties.filter(p => (p.moraDias||0) > 0).length
  };
}

function getPortfolioComposition(properties){
  return ['alquilada','venta','vacia','reforma'].map(key => ({
    key, label:labelEstado(key), count:properties.filter(p => p.estado === key).length
  }));
}
```

- [ ] **Step 4: Renderizar cinco KPIs con contenido flexible**

Renderizar Propiedades, Valor estimado, Ingreso mensual, Ocupación y Rentabilidad promedio. Cada tarjeta debe usar `min-width:0`, valores con `overflow-wrap:anywhere` y `title` con el valor sin abreviar.

- [ ] **Step 5: Renderizar el gráfico como SVG accesible**

Crear un donut SVG con segmentos derivados de `getPortfolioComposition`, `role="img"` y `aria-label="Composición de la cartera"`. Si no hay propiedades, mostrar un círculo neutral y “Sin datos”. No añadir una biblioteca gráfica.

- [ ] **Step 6: Convertir alertas en controles accionables**

`buildAlerts` debe devolver `{type, category, ref, description, propertyIndex}`. Cada alerta se renderiza como `<button class="alert-card">` y llama `openDrawer(propertyIndex)`; mora y vencimientos conservan los umbrales actuales.

- [ ] **Step 7: Ejecutar pruebas y revisión visual**

Run: `node --test tests/*.test.js`

Expected: todos los tests PASS. En 1024 px ningún valor debe salir de una tarjeta; en 390 px los KPIs deben ocupar dos columnas.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/index-contract.test.js
git commit -m "feat: redesign dashboard metrics and alerts"
```

---

### Task 4: Tabla desktop y tarjetas móviles

**Files:**
- Modify: `index.html:394-436`
- Modify: `index.html:524-590`
- Modify: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: `getFiltered()`, `sortData(data)`, `openDrawer(index)`.
- Produces: `renderTabla()` con vista de tabla y tarjetas desde el mismo conjunto ordenado.

- [ ] **Step 1: Añadir pruebas fallidas para ambas vistas**

```js
test('contains desktop table and mobile property list', () => {
  assert.match(html, /id=["']propertyTable["']/);
  assert.match(html, /id=["']propertyCards["']/);
  assert.match(html, /class=["'][^"']*filters-toolbar/);
});
```

- [ ] **Step 2: Ejecutar el test y confirmar el fallo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL por ausencia de `propertyTable` y `propertyCards`.

- [ ] **Step 3: Reestructurar los filtros y la tabla**

Conservar los cuatro controles actuales, agruparlos en `.filters-toolbar` y usar estas columnas: Propiedad, Tipo, Estado, Inquilino, Contrato, Mora y Alquiler. Dirección, ID y ciudad se combinan en la primera columna.

- [ ] **Step 4: Renderizar tabla y tarjetas desde los mismos datos**

```js
function propertyAddress(p){
  return `${p.direccion.calle || ''} ${p.direccion.numero || ''}`.trim() || 'Sin dirección';
}

function renderTabla(){
  const data = sortData(getFiltered());
  resultCount.textContent = `${data.length} de ${PROPIEDADES.length} propiedades`;
  tbody.innerHTML = data.map(propertyRowTemplate).join('');
  propertyCards.innerHTML = data.map(propertyCardTemplate).join('');
  document.querySelectorAll('[data-property-index]').forEach(item => {
    item.addEventListener('click', () => openDrawer(Number(item.dataset.propertyIndex)));
  });
  emptyResults.hidden = data.length !== 0;
}
```

Ambas plantillas deben usar `data-property-index`, etiquetas de estado textuales y `title` en campos truncados.

- [ ] **Step 5: Añadir estados vacío y sin resultados**

Mostrar “Todavía no hay propiedades” con botón Nueva propiedad cuando `PROPIEDADES` esté vacío. Mostrar “No encontramos resultados” con botón Limpiar filtros cuando existan propiedades pero el filtro devuelva cero.

- [ ] **Step 6: Implementar responsive sin scroll horizontal**

```css
.property-cards{display:none}
@media(max-width:760px){
  .table-scroll{display:none}
  .property-cards{display:grid;gap:10px}
  .property-card{display:grid;gap:10px;padding:14px;border-radius:var(--radius-md)}
  .filters-toolbar{grid-template-columns:1fr 1fr}
  .filters-toolbar .search-field{grid-column:1/-1}
}
```

- [ ] **Step 7: Ejecutar pruebas y comprobar interacción**

Run: `node --test tests/*.test.js`

Expected: todos los tests PASS; búsqueda, filtros, ordenamiento y apertura de ficha funcionan tanto desde fila como desde tarjeta.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/index-contract.test.js
git commit -m "feat: add responsive property collection"
```

---

### Task 5: Ficha, formularios y estados de operación

**Files:**
- Modify: `index.html:591-874`
- Modify: `index.html:934-1092`
- Modify: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: modelos actuales de propiedad, `apiSave`, `apiDelete`, `crearPDFRecibo`.
- Produces: `openDrawer`, `openForm`, `openReceiptForm`, `setDrawerState(message,type)`, `openPanel()`, `closeDrawer()` accesibles y responsive.

- [ ] **Step 1: Añadir contrato fallido de accesibilidad del panel**

```js
test('declares accessible dialog and inline operation status', () => {
  assert.match(html, /id=["']drawer["'][^>]*aria-modal=["']true["']/);
  assert.match(html, /id=["']drawerStatus["']/);
});
```

- [ ] **Step 2: Ejecutar el contrato y confirmar el fallo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL por ausencia de `drawerStatus`.

- [ ] **Step 3: Reorganizar la ficha sin cambiar datos**

Renderizar resumen económico y las secciones Información principal, Contrato e inquilino, y Documentación y servicios. Mantener Editar y Comprobante en el encabezado. Usar `textContent` para mensajes y la función de escape existente o una nueva `escapeHtml` para cualquier valor procedente de Sheets.

- [ ] **Step 4: Reorganizar el formulario por secciones**

Conservar cada ID `f_*` actual para evitar regresiones en `collectFormData`. Añadir `autocomplete` apropiado, asociar cada `<label for="...">` y mantener ID, Calle como obligatorios. En móvil, `.form-grid` pasa a una columna.

- [ ] **Step 5: Implementar estado inline y foco del panel**

```js
let drawerReturnFocus = null;
function openPanel(){
  drawerReturnFocus = document.activeElement;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  overlay.classList.add('open');
  drawer.querySelector('button,input,select')?.focus();
}
function closeDrawer(){
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  overlay.classList.remove('open');
  drawerReturnFocus?.focus();
}
function setDrawerState(message,type='info'){
  const status = document.getElementById('drawerStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
  status.hidden = !message;
}
```

Cerrar con Escape y mantener el panel abierto cuando falle una operación.

- [ ] **Step 6: Sustituir alertas de operación por mensajes accionables**

En `saveForm`, `deleteProperty` y `generarComprobante`, deshabilitar solo la acción en curso, anunciar el progreso en `drawerStatus`, restaurar el control ante error y conservar los datos del formulario. Mantener confirmación explícita antes de eliminar.

- [ ] **Step 7: Proteger Excel y PDF ausentes o listas vacías**

Antes de exportar, verificar `PROPIEDADES.length` y `window.XLSX`. Antes de generar, verificar `window.jspdf?.jsPDF`. Mostrar mensajes específicos en lugar de producir excepciones genéricas.

- [ ] **Step 8: Ejecutar pruebas y smoke test manual**

Run: `node --test tests/*.test.js`

Expected: todos los tests PASS. Verificar alta, edición, error simulado, cancelación, eliminación cancelada y PDF con controles que recuperan su estado.

- [ ] **Step 9: Commit**

```bash
git add index.html tests/index-contract.test.js
git commit -m "feat: redesign property workflows"
```

---

### Task 6: Asistente inicial y configuración de conexión

**Files:**
- Modify: `index.html:438-447`
- Modify: `index.html:875-904`
- Modify: `index.html:1094-1161`
- Modify: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: `AppConfig`, `apiRequest`, `localStorage`.
- Produces: `getApiUrl()`, `testApiConnection(url)`, `openSetup()`, `openSettings()`, `saveConnection()`, `resetConnection()`.

- [ ] **Step 1: Añadir pruebas fallidas del asistente**

```js
test('loads AppConfig and contains setup dialog hooks', () => {
  assert.match(html, /src=["']app-config\.js["']/);
  for (const id of ['setupView','setupApiUrl','setupInfoToggle','setupConnect','btnSettings']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});
```

- [ ] **Step 2: Ejecutar el contrato y confirmar el fallo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL porque el asistente todavía no está en `index.html`.

- [ ] **Step 3: Eliminar la URL fija y cargar `app-config.js`**

Reemplazar `const API_URL = '...'` por:

```js
let API_URL = AppConfig.loadApiUrl(localStorage);
function getApiUrl(){
  if (!API_URL) throw new Error('API_URL_NOT_CONFIGURED');
  return API_URL;
}
```

Todas las solicitudes deben obtener la URL mediante `getApiUrl()`.

- [ ] **Step 4: Crear el asistente de una pantalla**

Incluir campo `setupApiUrl`, botón `setupConnect`, enlace de instrucciones y un botón `setupInfoToggle` con `aria-expanded="false"` y `aria-controls="setupInfoPanel"`. El panel de ayuda comienza con `hidden`.

- [ ] **Step 5: Implementar ayuda solo bajo demanda**

```js
function setSetupHelp(open){
  setupInfoPanel.hidden = !open;
  setupInfoToggle.setAttribute('aria-expanded', String(open));
}
setupInfoToggle.addEventListener('click', event => {
  event.stopPropagation();
  setSetupHelp(setupInfoToggle.getAttribute('aria-expanded') !== 'true');
});
document.addEventListener('click', event => {
  if (!event.target.closest('.setup-help')) setSetupHelp(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSetupHelp(false);
});
```

- [ ] **Step 6: Probar la API antes de persistir**

```js
async function testApiConnection(url){
  if (!AppConfig.validateExecUrl(url)) throw new Error('INVALID_EXEC_URL');
  return apiRequest(`${AppConfig.normalizeUrl(url)}?action=list&_=${Date.now()}`);
}

async function saveConnection(){
  const candidate = setupApiUrl.value;
  setSetupState('Probando conexión…','loading');
  try {
    await testApiConnection(candidate);
    API_URL = AppConfig.saveApiUrl(localStorage,candidate);
    setSetupState('Conexión realizada correctamente.','success');
    await startApplication();
  } catch (error) {
    setSetupState(connectionErrorMessage(error),'error');
  }
}
```

- [ ] **Step 7: Crear Configuración con cambio y borrado seguro**

Mostrar URL enmascarada, estado, última sincronización y botones Probar, Cambiar URL y Desconectar. `resetConnection()` debe pedir confirmación, ejecutar `AppConfig.clearApiUrl(localStorage)`, vaciar `API_URL` y volver al asistente sin enviar ninguna solicitud de borrado a Sheets.

- [ ] **Step 8: Adaptar el inicio a configurado/no configurado**

```js
async function init(){
  initFilters();
  initNavigation();
  initInstallPrompt();
  registerServiceWorker();
  if (!API_URL) {
    openSetup();
    renderEmptyDashboard();
    return;
  }
  await startApplication();
}
```

- [ ] **Step 9: Ejecutar pruebas y escenarios manuales**

Run: `node --test tests/*.test.js`

Expected: todos los tests PASS. Verificar primera apertura, URL inválida, URL válida, recarga con URL persistida, cambio de URL y desconexión.

- [ ] **Step 10: Commit**

```bash
git add index.html app-config.js tests/index-contract.test.js
git commit -m "feat: add independent Sheets setup"
```

---

### Task 7: PWA, textos, estados finales y verificación completa

**Files:**
- Modify: `manifest.webmanifest`
- Modify: `sw.js`
- Modify: `index.html`
- Modify: `tests/index-contract.test.js`

**Interfaces:**
- Consumes: `app-config.js`, `app-sync.js`, recursos PWA existentes.
- Produces: caché `mis-propiedades-v3`, mensajes finales coherentes y PWA actualizable.

- [ ] **Step 1: Añadir pruebas fallidas de recursos PWA y texto correcto**

```js
test('does not claim that sheet data is stored on device', () => {
  assert.doesNotMatch(html, /Datos guardados en este dispositivo/);
});

test('references the local configuration module', () => {
  assert.match(html, /<script src=["']app-config\.js["']><\/script>/);
});
```

- [ ] **Step 2: Ejecutar pruebas y confirmar el fallo del texto antiguo**

Run: `node --test tests/index-contract.test.js`

Expected: FAIL mientras permanezca el texto engañoso.

- [ ] **Step 3: Actualizar copia visible y estados**

Reemplazar el pie por “Datos sincronizados con Google Sheets”. Añadir última sincronización real solo tras una carga exitosa. En error de red, mostrar “No se pudo conectar” con Reintentar y Configuración; no mostrar “guardado” ni dejar la interfaz bloqueada.

- [ ] **Step 4: Actualizar manifest y caché**

Mantener nombre, iconos, `display: standalone` y colores alineados a `#173C36` y `#F6F4EF`. Cambiar el caché y recursos:

```js
const CACHE = 'mis-propiedades-v3';
const CORE = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./app-sync.js','./app-config.js'];
```

- [ ] **Step 5: Confirmar comportamiento offline explícito**

Con DevTools en modo offline, recargar después de una visita online. La interfaz debe abrir; cargar, guardar y eliminar deben mostrar error de conexión y no afirmar que la operación quedó pendiente.

- [ ] **Step 6: Ejecutar la suite completa**

Run: `node --test tests/*.test.js`

Expected: todos los tests PASS sin warnings ni tests omitidos.

- [ ] **Step 7: Ejecutar comprobaciones estáticas**

Run: `git diff --check`

Expected: salida vacía.

- [ ] **Step 8: Ejecutar matriz visual y funcional**

Run: `python -m http.server 4173`

Verificar manualmente en 1440×900, 1024×768, 768×1024 y 390×844:

- Sin desbordes en KPIs, alertas, filtros, tabla, ficha ni formularios.
- Sidebar desktop y navegación móvil correctas.
- Tabla desktop y tarjetas móviles correctas.
- Alta, edición, baja, búsqueda, filtros y ordenamiento.
- Alertas abren la propiedad correcta.
- Excel descarga un archivo con encabezados actuales.
- PDF se genera con importe y propiedad correctos.
- URL local persiste y puede borrarse.
- Instalar app aparece solo cuando el navegador dispara `beforeinstallprompt`.
- Teclado, Escape, foco y ayuda “i” funcionan.

- [ ] **Step 9: Revisar que no haya datos personales o URL fija**

Run: `rg -n "AKfy|Gonzalo|Gonza|script\.google\.com/macros/s/.+/exec" index.html app-config.js app-sync.js sw.js manifest.webmanifest`

Expected: salida vacía.

- [ ] **Step 10: Commit**

```bash
git add index.html manifest.webmanifest sw.js tests/index-contract.test.js
git commit -m "feat: complete responsive PWA redesign"
```

---

## Final acceptance

- [ ] Ejecutar `node --test tests/*.test.js` y confirmar que toda la suite pasa.
- [ ] Ejecutar `git diff --check` y confirmar salida vacía.
- [ ] Confirmar `git status --short` sin cambios de implementación sin versionar.
- [ ] Comparar la implementación con cada sección de la especificación vinculada.
- [ ] No subir a GitHub ni publicar la PWA sin una solicitud explícita del usuario.
