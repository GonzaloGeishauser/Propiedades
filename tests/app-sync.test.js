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
