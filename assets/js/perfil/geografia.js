(() => {
  // Localidades y departamentos: Georef Argentina. Códigos postales: Correo Argentino.
  const places = {
    'concepcion del bermejo':['3708','Almirante Brown'],
    'los frentones':['3712','Almirante Brown'],
    'pampa del infierno':['3708','Almirante Brown'],
    'rio muerto':['3712','Almirante Brown'],
    'taco pozo':['3714','Almirante Brown'],
    'general vedia':['3522','Bermejo'],
    'isla del cerrito':['3518','Bermejo'],
    'la leonesa':['3518','Bermejo'],
    'las palmas':['3518','Bermejo'],
    'puerto bermejo nuevo':['3524','Bermejo'],
    'puerto bermejo viejo':['3524','Bermejo'],
    'puerto eva peron':['3526','Bermejo'],
    'presidencia roque saenz pena':['3700','Comandante Fernández'],
    'charata':['3730','Chacabuco'],
    'gancedo':['3734','12 de Octubre'],
    'general capdevila':['3732','12 de Octubre'],
    'general pinedo':['3732','12 de Octubre'],
    'meson de fierro':['3731','12 de Octubre'],
    'pampa landriel':['3731','12 de Octubre'],
    'hermoso campo':['3733','2 de Abril'],
    'itin':['3733','2 de Abril'],
    'chorotis':['3733','Fray Justo Santa María de Oro'],
    'santa sylvina':['3541','Fray Justo Santa María de Oro'],
    'venados grandes':['3733','Fray Justo Santa María de Oro'],
    'corzuela':['3718','General Belgrano'],
    'la escondida':['3514','General Donovan'],
    'la verde':['3514','General Donovan'],
    'lapachito':['3514','General Donovan'],
    'makalle':['3514','General Donovan'],
    'el espinillo':['3703','General Güemes'],
    'el sauzal':['3705','General Güemes'],
    'el sauzalito':['3705','General Güemes'],
    'fortin lavalle':['3703','General Güemes'],
    'fuerte esperanza':['3705','General Güemes'],
    'juan jose castelli':['3705','General Güemes'],
    'miraflores':['3705','General Güemes'],
    'nueva pompeya':['3705','General Güemes'],
    'villa rio bermejito':['3703','General Güemes'],
    'wichi':['3705','General Güemes'],
    'zaparinqui':['3705','General Güemes'],
    'avia terai':['3706','Independencia'],
    'campo largo':['3716','Independencia'],
    'fortin las chunas':['3716','Independencia'],
    'napenay':['3706','Independencia'],
    'colonia popular':['3505','Libertad'],
    'estacion general obligado':['3513','Libertad'],
    'laguna blanca':['3514','Libertad'],
    'puerto tirol':['3505','Libertad'],
    'ciervo petiso':['3515','Libertador General San Martín'],
    'general jose de san martin':['3509','Libertador General San Martín'],
    'la eduvigis':['3507','Libertador General San Martín'],
    'laguna limpia':['3515','Libertador General San Martín'],
    'pampa almiron':['3507','Libertador General San Martín'],
    'pampa del indio':['3531','Libertador General San Martín'],
    'presidencia roca':['3511','Libertador General San Martín'],
    'selvas del rio de oro':['3507','Libertador General San Martín'],
    'tres isletas':['3703','Maipú'],
    'coronel du graty':['3541','Mayor Luis J. Fontana'],
    'enrique urien':['3543','Mayor Luis J. Fontana'],
    'villa angela':['3540','Mayor Luis J. Fontana'],
    'las brenas':['3722','9 de Julio'],
    'la clotilde':['3701',"O'Higgins"],
    'la tigra':['3701',"O'Higgins"],
    'san bernardo':['3701',"O'Higgins"],
    'presidencia de la plaza':['3536','Presidencia de la Plaza'],
    'barrio de los pescadores':['3505','1° de Mayo'],
    'colonia benitez':['3505','1° de Mayo'],
    'margarita belen':['3505','1° de Mayo'],
    'quitilipi':['3530','Quitilipi'],
    'villa el palmar':['3530','Quitilipi'],
    'barranqueras':['3503','San Fernando'],
    'basail':['3516','San Fernando'],
    'colonia baranda':['3505','San Fernando'],
    'fontana':['3514','San Fernando'],
    'puerto vilelas':['3503','San Fernando'],
    'resistencia':['3500','San Fernando'],
    'samuhu':['3543','San Lorenzo'],
    'villa berthet':['3545','San Lorenzo'],
    'capitan solari':['3515','Sargento Cabral'],
    'colonia elisa':['3515','Sargento Cabral'],
    'colonias unidas':['3515','Sargento Cabral'],
    'ingeniero barbet':['3515','Sargento Cabral'],
    'las garcitas':['3515','Sargento Cabral'],
    'charadai':['3513','Tapenagá'],
    'cote lai':['3513','Tapenagá'],
    'haumonia':['3543','Tapenagá'],
    'horquilla':['3543','Tapenagá'],
    'la sabana':['3513','Tapenagá'],
    'colonia aborigen':['3531','25 de Mayo'],
    'machagai':['3534','25 de Mayo'],
    'napalpi':['3531','25 de Mayo']
  };
  const aliases={
    'vilelas':'puerto vilelas',
    'saenz pena':'presidencia roque saenz pena',
    'roque saenz pena':'presidencia roque saenz pena',
    'pcia roque saenz pena':'presidencia roque saenz pena',
    'presidencia r saenz pena':'presidencia roque saenz pena',
    'san martin':'general jose de san martin'
  };
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const lookup=value=>{
    const place=places[aliases[normalize(value)]||normalize(value)];
    return place?{postal:place[0],department:place[1]}:null;
  };
  function applyDefault(field,property,previous,next){
    if(!field||field.readOnly)return;
    const value=field.value.trim(),auto=field.dataset.adcGeoDefault||'';
    const isPreviousDefault=Boolean(value&&(value===auto||(!auto&&previous?.[property]&&value===previous[property])));
    const nextValue=next?.[property]||'';
    if(!value||isPreviousDefault){
      field.value=nextValue;
      if(nextValue)field.dataset.adcGeoDefault=nextValue;
      else delete field.dataset.adcGeoDefault;
    }else if(nextValue&&value===nextValue)field.dataset.adcGeoDefault=nextValue;
    else delete field.dataset.adcGeoDefault;
  }
  function syncFields(postal,department,previous,next){
    applyDefault(postal,'postal',previous,next);
    applyDefault(department,'department',previous,next);
  }
  function bind(locality,postal,department){
    let previousLocality=normalize(locality.value);
    const update=()=>{
      const key=normalize(locality.value);
      syncFields(postal,department,lookup(previousLocality),lookup(key));
      previousLocality=key;
    };
    locality.addEventListener('input',update);
    locality.addEventListener('change',update);
    update();
    return update;
  }
  const locality=document.getElementById('perfilLocalidad');
  let previousLocality=normalize(locality?.value);
  function update(){
    const key=normalize(locality?.value);
    const previous=lookup(previousLocality),next=lookup(key);
    syncFields(document.getElementById('perfilCodigoPostal'),document.getElementById('perfilDepartamento'),previous,next);
    previousLocality=key;
  }
  window.adcAplicarGeografiaPerfil=update;
  window.adcVincularGeografiaChaco=bind;
  window.adcBuscarGeografiaChaco=lookup;
  document.addEventListener('input',event=>{if(event.target===locality)update()});
  document.addEventListener('change',event=>{if(event.target===locality)update()});
  window.addEventListener('DOMContentLoaded',update);
})();
