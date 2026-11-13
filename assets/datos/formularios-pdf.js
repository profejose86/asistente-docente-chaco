// Primera etapa: revisar el documento preparado antes de configurar campos.
// Solo los formularios registrados aquí utilizan este modo; los demás conservan su implementación.
window.adcPreparedPdfForms = Object.freeze({
  dp01: Object.freeze({
    pdf: 'assets/formularios/DP-01.pdf',
    pages: [{ image: 'assets/formularios/DP-01-pagina-1.png', width: 612, height: 1008 }],
    source: 'https://drive.google.com/drive/folders/1AZpunmuWaPrB-qXgHyaaCjGGRwAEqSy3',
    sha256: '88d14c87d6de22b1caf0dc17281f0737e5de6ebfc8dca927c48f145f894024a8',
    note: 'El PDF preparado conserva «2009» impreso en la fecha Desde. Pendiente de revisión; ADC no modifica ese texto.',
    stage: 'revision-documento'
  })
});
