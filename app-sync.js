(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PropertySync = api;
})(typeof self !== 'undefined' ? self : this, function(){
  const num = v => v === '' || v === null || v === undefined ? 0 : Number(v) || 0;
  const text = v => v === null || v === undefined ? '' : String(v);
  const emptyToDash = v => text(v).trim() || '—';

  function toSheet(p){
    const d = p.direccion || {}, i = p.inquilino || {}, c = p.contrato || {}, dep = p.deposito || {};
    return {
      'ID': text(p.id || p.ID || p.referencia).trim(),
      'Referencia': text(p.referencia || p.id || p.ID).trim(),
      'Calle': text(d.calle), 'Número': text(d.numero), 'Piso': text(d.piso), 'Ciudad': text(d.ciudad),
      'Provincia': text(d.provincia), 'País': text(d.pais || 'Argentina'), 'Código Postal': text(d.cp),
      'Tipo': text(p.tipo), 'Uso': text(p.uso), 'Estado': text(p.estado),
      'Partida ARBA': text(p.partidaARBA), 'Partida Municipal': text(p.partidaMunicipal),
      'Nº Gas': text(p.numGas), 'Nº Luz': text(p.numLuz), 'Nº Escritura': text(p.numEscritura),
      'Superficie': text(p.superficie), 'Ambientes': text(p.ambientes), 'Cochera': text(p.cochera),
      'Valor Estimado': num(p.valorEstimado), 'Alquiler Mensual': num(p.alquilerMensual),
      'Gastos Fijos': num(p.gastosFijos), 'Gastos Extraordinarios': num(p.gastosExtraordinarios),
      'Fecha de Compra': p.fechaCompra && p.fechaCompra !== '—' ? p.fechaCompra : '', 'Valor de Compra': num(p.valorCompra),
      'Inquilino': text(i.nombre), 'DNI/CUIT': text(i.dni), 'Teléfono': text(i.tel), 'Email': text(i.email),
      'Inicio Contrato': text(c.inicio), 'Fin Contrato': text(c.fin), 'Duración Meses': num(c.duracionMeses),
      'Renovación': text(c.renovacion), 'Depósito Monto': num(dep.monto), 'Depósito Dónde': text(dep.donde),
      'Garantía Adicional': text(p.garantiaAdicional), 'Días de Mora': p.moraDias === null || p.moraDias === undefined ? '' : num(p.moraDias),
      'Último Aumento': p.ultimoAumento && p.ultimoAumento !== '—' ? p.ultimoAumento : '',
      'Próximo Aumento': p.proximoAumento && p.proximoAumento !== '—' ? p.proximoAumento : '',
      'Vencimiento Seguro': p.seguroVencimiento || '', 'Documentación': text(p.documentacion)
    };
  }

  function fromSheet(r){
    const inqNombre = text(r['Inquilino']).trim();
    const contratoFin = text(r['Fin Contrato']).trim();
    const depMonto = r['Depósito Monto'];
    return {
      id: text(r['ID']).trim(),
      referencia: text(r['Referencia'] || r['ID']).trim(),
      tipo: text(r['Tipo']), uso: text(r['Uso']), estado: text(r['Estado']),
      direccion:{calle:text(r['Calle']), numero:text(r['Número']), piso:text(r['Piso']), ciudad:text(r['Ciudad']), provincia:text(r['Provincia']), pais:text(r['País'] || 'Argentina'), cp:text(r['Código Postal'])},
      partidaARBA: emptyToDash(r['Partida ARBA']), partidaMunicipal: emptyToDash(r['Partida Municipal']),
      numGas: emptyToDash(r['Nº Gas']), numLuz: emptyToDash(r['Nº Luz']), numEscritura: emptyToDash(r['Nº Escritura']),
      superficie: emptyToDash(r['Superficie']), ambientes: emptyToDash(r['Ambientes']), cochera: emptyToDash(r['Cochera']),
      valorEstimado:num(r['Valor Estimado']), alquilerMensual:num(r['Alquiler Mensual']), gastosFijos:num(r['Gastos Fijos']), gastosExtraordinarios:num(r['Gastos Extraordinarios']),
      fechaCompra:text(r['Fecha de Compra']) || '—', valorCompra:num(r['Valor de Compra']),
      inquilino: inqNombre ? {nombre:inqNombre, dni:text(r['DNI/CUIT']), tel:text(r['Teléfono']), email:text(r['Email'])} : null,
      contrato: contratoFin ? {inicio:text(r['Inicio Contrato']), fin:contratoFin, duracionMeses:num(r['Duración Meses']), renovacion:text(r['Renovación']) || '—'} : null,
      deposito: depMonto !== '' && depMonto !== null && depMonto !== undefined && Number(depMonto) !== 0 ? {monto:num(depMonto), donde:text(r['Depósito Dónde']) || '—'} : null,
      garantiaAdicional: emptyToDash(r['Garantía Adicional']),
      moraDias: r['Días de Mora'] === '' || r['Días de Mora'] === null || r['Días de Mora'] === undefined ? (inqNombre ? 0 : null) : num(r['Días de Mora']),
      ultimoAumento:text(r['Último Aumento']) || '—', proximoAumento:text(r['Próximo Aumento']) || '—',
      seguroVencimiento:text(r['Vencimiento Seguro']) || null, documentacion:emptyToDash(r['Documentación'])
    };
  }

  function validateManualId(id, propiedades, currentId){
    const clean = text(id).trim();
    if (!clean) return false;
    return !(propiedades || []).some(p => text(p.id).trim() === clean && text(p.id).trim() !== text(currentId).trim());
  }

  return { toSheet, fromSheet, validateManualId };
});
