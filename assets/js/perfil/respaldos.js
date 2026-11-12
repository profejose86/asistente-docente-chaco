function data(){adcUpdateFullName();adcActualizarAntiguedad(false);return {adcTransferDraft,inicioActividad:$("perfilInicioActividad").value,antiguedadModo:adcAntiguedadModo,djHistory, nombre:$('nombre').value,apellidos:$('perfilApellidos').value,nombres:$('perfilNombres').value,dni:$('dni').value,correo:$('correo').value,sexo:$('sexo').value,perfilDJ:Object.fromEntries([['clase','perfilClase'],['domicilio','perfilDomicilio'],['localidad','perfilLocalidad'],['titulo','perfilTitulo'],['otorgado','perfilOtorgado'],['registro','perfilRegistro'],['antiguedad','perfilAntiguedad'],['numeroCalle', 'perfilNumeroCalle'],['unidad', 'perfilUnidad'],['manzana', 'perfilManzana'],['barrio', 'perfilBarrio'],['codigoPostal', 'perfilCodigoPostal'],['departamento', 'perfilDepartamento'],['telefonoFijo', 'perfilTelefonoFijo']].map(([k,id])=>[k,$(id)?.value||''])),inst}}
function save(){let d=data();localStorage.setItem('adc_v08',JSON.stringify(d));alert('Perfil guardado en este navegador')}
function load(){try{let d=JSON.parse(localStorage.getItem('adc_v08'));if(!d)throw Error();applyData(d);alert('Perfil recuperado')}catch(e){alert('No hay perfil guardado')}}
function applyData(d){adcTransferDraft=d.adcTransferDraft||{};for(let k of ['nombre','dni','correo','sexo'])$(k).value=k==='dni'?adcPersonalFormat(d[k],k):d[k]||'';adcSplitSavedName(d);
const perfilCampos={clase:'perfilClase',domicilio:'perfilDomicilio',localidad:'perfilLocalidad',titulo:'perfilTitulo',otorgado:'perfilOtorgado',registro:'perfilRegistro',antiguedad:'perfilAntiguedad',numeroCalle:'perfilNumeroCalle',unidad:'perfilUnidad',manzana:'perfilManzana',barrio:'perfilBarrio',codigoPostal:'perfilCodigoPostal',departamento:'perfilDepartamento',telefonoFijo:'perfilTelefonoFijo'};
for(const [k,id] of Object.entries(perfilCampos))if($(id))$(id).value=['clase','registro'].includes(k)?adcPersonalFormat(d.perfilDJ?.[k],id):(d.perfilDJ?.[k]||''); $('perfilInicioActividad').value=d.inicioActividad||d.perfilDJ?.inicioActividad||'';$('perfilAntiguedadVista').value=$('perfilAntiguedad').value;adcAntiguedadModo=d.antiguedadModo||(d.inicioActividad?'auto':'manual');adcActualizarAntiguedad(false);
const instAbiertasPrevias=new Set(perfilInstitucionesAbiertas),cargosAbiertosPrevios=new Set(perfilCargosAbiertos),horariosAbiertosPrevios=new Set(perfilHorariosAbiertos);perfilInstitucionesAbiertas.clear();perfilCargosAbiertos.clear();perfilHorariosAbiertos.clear();inst=[];nextId=1;djHistory=Array.isArray(d.djHistory)?d.djHistory:[];(d.inst||[]).forEach(addInst);
perfilInstitucionesAbiertas.clear();perfilCargosAbiertos.clear();perfilHorariosAbiertos.clear();
const ids=new Set(inst.map(i=>i.id));const uids=new Set(inst.flatMap(i=>i.entries.map(e=>e.djUid)));
for(const id of instAbiertasPrevias)if(ids.has(id))perfilInstitucionesAbiertas.add(id);
for(const uid of cargosAbiertosPrevios)if(uids.has(uid))perfilCargosAbiertos.add(uid);
for(const uid of horariosAbiertosPrevios)if(uids.has(uid))perfilHorariosAbiertos.add(uid);
render();if(typeof window.adcAplicarGeografiaPerfil==='function')window.adcAplicarGeografiaPerfil()}
const PERFIL_PRUEBA_V07={nombre:'',dni:'',correo:'',sexo:'',inst:[]};
function restoreTestProfile(){if(!confirm('¿Restaurar el perfil vacío? Se reemplazarán los datos visibles (no el respaldo original).'))return;applyData(JSON.parse(JSON.stringify(PERFIL_PRUEBA_V07)));alert('Perfil vacío restaurado. Completá tus datos y guardalos en este navegador.')}
function exportJSON(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)],{type:'application/json'}));a.download='respaldo_asistente_docente_chaco_v0915.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function validateProfileBackup(d){
 const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 const records=(value,check=record)=>Array.isArray(value)&&value.every(check);
 const scalar=value=>value==null||['string','number','boolean'].includes(typeof value);
 const plain=value=>record(value)&&Object.values(value).every(scalar);
 const optionalRecords=(value,check)=>value==null||records(value,check);
 const entry=e=>record(e)&&optionalRecords(e.djIntervals,plain)&&optionalRecords(e.djPeriods,plain)
  &&(e.schedule==null||(Array.isArray(e.schedule)&&e.schedule.every(scalar)))
  &&Object.entries(e).every(([key,value])=>['djIntervals','djPeriods','schedule'].includes(key)||scalar(value));
 const institution=i=>record(i)&&optionalRecords(i.entries,entry)
  &&Object.entries(i).every(([key,value])=>key==='entries'||scalar(value));
 if(!record(d)||!records(d.inst,institution)||!optionalRecords(d.djHistory,item=>record(item)&&record(item.snapshot)&&records(item.snapshot.rows))
  ||(d.perfilDJ!=null&&!plain(d.perfilDJ))
  ||(d.adcTransferDraft!=null&&(!record(d.adcTransferDraft)||!Object.entries(d.adcTransferDraft).every(([key,value])=>['destinations','origins'].includes(key)?Array.isArray(value)&&value.every(scalar):scalar(value))))
  ||!['nombre','dni','correo','sexo','apellidos','nombres','inicioActividad','antiguedadModo'].every(key=>scalar(d[key])))
  throw new Error('Estructura de respaldo inválida');
}
function importJSONFile(ev){let f=ev.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);validateProfileBackup(d);applyData(d);alert('Respaldo importado; guardalo si querés conservarlo')}catch(e){alert('Archivo JSON no válido')}};r.readAsText(f)}
