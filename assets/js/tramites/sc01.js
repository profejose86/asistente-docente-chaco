// Plantilla publicada por el Centro de Documentación del MECCyT del Chaco.
(() => {
  const section = document.createElement('section');
  section.id = 'adcSC01';
  section.className = 'hide';
  section.innerHTML = `
    <button type="button" class="alt" onclick="adcBackToTramites()">← Volver a Mis trámites</button>
    <h2>Solicitud de certificación de servicios docentes · SC-01</h2>
    <p>Completá el Rubro I correspondiente al agente. El Rubro II corresponde a la Mesa de Entradas y Salidas de Recursos Humanos.</p>
    <div class="toolbar">
      <a class="adc-sc01-action" href="assets/formularios/SC-01.pdf" target="_blank" rel="noopener">Abrir formulario</a>
      <a class="adc-sc01-action" href="assets/formularios/SC-01.pdf" download="SC-01.pdf">Descargar PDF</a>
      <a href="https://dirdocumentacion.educacion.chaco.gob.ar/formularios-planillas/" target="_blank" rel="noopener">Consultar fuente oficial</a>
    </div>
    <p class="small">Solicitud para iniciar la certificación de servicios. El documento indica que carece de validez para constancias de servicio. La documentación a adjuntar figura al pie del formulario.</p>
    <iframe id="adcSC01Preview" title="Formulario oficial SC-01" loading="lazy"></iframe>
    <p class="small">Si la vista previa no aparece en tu dispositivo, usá Abrir formulario o Descargar PDF.</p>`;
  document.querySelector('.wrap').append(section);
  window.adcSC01Open = () => {
    const preview = document.getElementById('adcSC01Preview');
    if (!preview.getAttribute('src')) preview.src = 'assets/formularios/SC-01.pdf';
    tab('sc01');
    section.querySelector('h2').setAttribute('tabindex', '-1');
    section.querySelector('h2').focus();
  };
})();
