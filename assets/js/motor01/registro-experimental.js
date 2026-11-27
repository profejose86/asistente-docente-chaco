// Registro experimental aislado para VPI Maestro (MOTOR-01 Fase 1).
// Incluye los 15 PDF reales de assets/formularios y permite sumar crudos locales sin alterar el catálogo productivo.
(() => {
  const catalogEntries = Object.freeze([
    { id: 'dp01', code: 'DP-01', title: 'Disposición de alta', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/DP-01.pdf' },
    { id: 'form-6', code: 'Formulario N°6', title: 'Datos de Familiares', orientation: 'landscape', orientationLabel: 'Horizontal', dimensionsLabel: 'Horizontal · 1008 × 612 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Formulario-6.pdf' },
    { id: 'bd02', code: 'BD-02', title: 'Disposición de baja', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 2 págs.', pagesCount: 2, sourceGroup: 'adc', pdf: 'assets/formularios/BD-02.pdf' },
    { id: 'bd07', code: 'BD-07', title: 'Opción de Seguros', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 595 × 842 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/BD-07.pdf' },
    { id: 'cf01', code: 'CF-01', title: 'Cambio de funciones', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/CF-01.pdf' },
    { id: 'seguro-descuento', code: 'Seguro Descuento', title: 'Solicitud de Descuento por Seguro', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Descuento-por-Seguro.pdf' },
    { id: 'dl02', code: 'DL-02', title: 'Interrupción de licencia', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 2 págs.', pagesCount: 2, sourceGroup: 'adc', pdf: 'assets/formularios/DL-02.pdf' },
    { id: 'form-3', code: 'Formulario N°3', title: 'Modificación de Datos de Identificación', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Formulario-3.pdf' },
    { id: 'incapacidad', code: 'Incapacidad', title: 'Solicitud de Beneficio de Incapacidad', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Incapacidad.pdf' },
    { id: 'interinos', code: 'Res. 3694/23', title: 'Inscripción de Interinos y Suplentes', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 595 × 842 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Interinos-Expectativas.pdf' },
    { id: 'md01', code: 'MD-01', title: 'Movimientos provisorios', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/MD-01.pdf' },
    { id: 'reubicacion', code: 'Reubicación', title: 'Condición de Reubicación (Res. 3694/23)', orientation: 'landscape', orientationLabel: 'Horizontal', dimensionsLabel: 'Horizontal · 1008 × 612 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/Reubicacion.pdf' },
    { id: 'sc01', code: 'SC-01', title: 'Certificación de servicios docentes', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/SC-01.pdf' },
    { id: 'sr01', code: 'SR-01', title: 'Reconocimiento médico', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 612 × 1008 pt · 1 pág.', pagesCount: 1, sourceGroup: 'adc', pdf: 'assets/formularios/SR-01.pdf' },
    { id: 'traslado-inicial', code: 'Traslado', title: 'Solicitud de Traslado Transitorio', orientation: 'portrait', orientationLabel: 'Vertical', dimensionsLabel: 'Vertical · 595 × 842 pt · 2 págs.', pagesCount: 2, sourceGroup: 'adc', pdf: 'assets/formularios/Traslado-Transitorio.pdf' }
  ].map(item => Object.freeze(item)));

  const dynamicEntries = [];
  const byIdMap = new Map(catalogEntries.map(item => [item.id, item]));

  function registerRawFiles(files) {
    dynamicEntries.length = 0;
    for (const item of files || []) {
      if (!item?.name || !item?.url) continue;
      const cleanName = item.name.replace(/\.pdf$/i, '');
      const entry = Object.freeze({
        id: 'raw:' + item.name,
        code: cleanName,
        title: item.name,
        orientationLabel: 'PDF crudo local',
        dimensionsLabel: `Crudo local · ${(Math.max(1, Math.round((item.size || 0) / 1024)))} KB`,
        sourceGroup: 'raw',
        pdf: item.url
      });
      dynamicEntries.push(entry);
      byIdMap.set(entry.id, entry);
    }
    return dynamicEntries;
  }

  window.adcMotor01Registry = Object.freeze({
    list: () => [...catalogEntries, ...dynamicEntries],
    catalog: () => catalogEntries,
    raw: () => [...dynamicEntries],
    registerRawFiles,
    byId: id => byIdMap.get(id) || null
  });
})();
