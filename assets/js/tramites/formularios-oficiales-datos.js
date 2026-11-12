(() => {
  const text = (key,label,options={}) => ({key,label,type:'text',...options});
  const date = (key,label,options={}) => ({key,label,type:'date',...options});
  const area = (key,label,options={}) => ({key,label,type:'textarea',wide:true,...options});
  const select = (key,label,options,settings={}) => ({key,label,type:'select',options,...settings});
  const choices = (key,label,options,settings={}) => ({key,label,type:'choices',options,...settings});
  const checks = (key,label,options,settings={}) => ({key,label,type:'checks',options,...settings});
  const repeat = (key,label,fields,settings={}) => ({key,label,type:'repeat',fields,...settings});
  const forms = [
    {
      id:"sr01",
      code:"SR-01",
      title:"Reconocimiento médico",
      catalogTitle:"Reconocimiento médico",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/17-FORMULARIO-SR-01-Solicitud-de-Reconocimiento-Medicos.docx",
      sensitive:true,
      notices:["Ley N.º 647-E (antes Ley N.º 3529). La solicitud y la respuesta de Reconocimientos Médicos son intervenciones independientes."],
      sections:[
        {title:"Solicitud",fields:[
          text("reparticion","Repartición solicitante",{"required":true}),
          text("lugar","Lugar"),
          date("fecha","Fecha",{"required":true}),
          text("establecimientoSanitario","Establecimiento sanitario"),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("zonaResidencia","Residencia por la que percibe bonificación de zona"),
          select("revista","Situación de revista",["Titular","Interino","Suplente"]),
          date("inasistenciaDesde","Inasistencia desde"),
          select("tipoConsulta","Tipo de reconocimiento",["Consultorio","Domicilio / internación","Fuera del lugar de residencia"],{"required":true}),
          text("lugarConsulta","Lugar de consulta / internación",{"requiredWhen":{"key":"tipoConsulta","values":["Domicilio / internación"]},"mnc":false}),
          text("lugarFueraResidencia","Lugar fuera de residencia",{"requiredWhen":{"key":"tipoConsulta","values":["Fuera del lugar de residencia"]},"mnc":false})
        ]},
        {title:"Familiar enfermo (si corresponde)",fields:[
          text("familiarNombre","Apellido y nombres"),
          text("familiarParentesco","Parentesco"),
          text("familiarLugar","Domicilio / lugar de internación")
        ]},
        {title:"Licencias usufructuadas hasta la fecha",fields:[
          repeat("licenciasPrevias","Licencias previas",[
            text("dias","Días"),
            text("motivo","Motivo")
          ],{"minRows":0,"maxRows":12,"addLabel":"Agregar licencia"})
        ]},
        {title:"A completar por Reconocimientos Médicos",notice:"Para completar por Reconocimientos Médicos, con firma y sello del profesional.",fields:[
          text("fechaExamen","Fecha del examen"),
          choices("examenRealizado","¿Se practicó el reconocimiento?",["Sí","No"]),
          text("examinado","Nombre de la persona examinada"),
          text("documentoExaminado","Documento"),
          choices("licenciaJustificada","¿Se justifica la licencia?",["Sí","No"]),
          text("motivoJustificacion","Motivo / diagnóstico informado"),
          date("licenciaDesde","Licencia desde"),
          date("licenciaHasta","Licencia hasta",{"after":"licenciaDesde"}),
          text("diasCorridos","Días corridos"),
          area("noJustificada","Si no se justifica, indicar motivo",{"wide":true}),
          text("firmaSolicitante","Firma y sello de quien solicita",{"signature":true,"mnc":false}),
          text("firmaMedico","Firma y sello médico",{"signature":true,"mnc":false}),
          text("establecimientoRespuesta","Establecimiento sanitario que realiza el reconocimiento"),
          text("lugarRespuesta","Lugar del reconocimiento")
        ]},
      ]
    },
    {
      id:"cf01",
      code:"CF-01",
      title:"Cambio de funciones",
      catalogTitle:"Cambio de funciones",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2026/10/09-Formulario-CF-01.docx",
      sensitive:true,
      notices:["Notificación docente: la firma de la solicitud implica aceptación de los términos del artículo 349 de la Ley 647-E, Estatuto del Docente.","En el Anexo IV, agrupar las horas cátedra por mismo establecimiento, misma situación de revista y mismo nivel de horas cátedra."],
      extraSources:[{"label":"Consultar planilla anexa oficial · Anexo IV","url":"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2024/01/PLANILLA-DE-CAMBIO-DE-FUNCIONES.docx"}],
      sections:[
        {title:"Persona solicitante",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("genero","Género",["F","M","Otro"]),
          text("cuil","CUIL",{"inputmode":"numeric"}),
          text("telefono","Teléfono",{"profileId":"perfilTelefonoFijo"}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("organismoSolicitante","Organismo solicitante",{"required":true})
        ]},
        {title:"Funciones / cargos involucrados",notice:"Agregá una fila por cargo o asignatura. Repetí la unidad educativa cuando tenga varios cargos; conservá juntos los del mismo establecimiento.",fields:[
          repeat("funciones","Establecimiento y cargo / función",[
            text("codigoOficina","Código de oficina"),
            text("codigoAnexo","Código de anexo"),
            text("establecimiento","Unidad educativa / establecimiento"),
            text("nivel","Nivel"),
            text("modalidad","Modalidad"),
            text("categoria","Categoría"),
            text("zona","Zona"),
            text("jornada","Jornada"),
            text("localidad","Localidad o paraje"),
            text("nombre","Nombre"),
            text("especialidad","Especialidad"),
            text("denominacionCargo","Denominación del cargo"),
            select("situacionRevista","Situación de revista",["Titular","Interino","Suplente"]),
            text("asignatura","Asignatura"),
            text("anio","Año",{academicPart:"year"}),
            text("division","División",{academicPart:"division"}),
            text("turno","Turno"),
            text("horasCatedra","Horas cátedra"),
            text("firmaDirector","Firma y sello del director de la unidad educativa",{"signature":true,"mnc":false})
          ],{"minRows":1,"maxRows":50,"initialRows":3,"addLabel":"Agregar función"})
        ]},
        {title:"Período y conformidades",fields:[
          date("periodoDesde","Período desde"),
          date("periodoHasta","Período hasta",{"after":"periodoDesde"}),
          area("funcionesAreas","Funciones y áreas a afectar",{"wide":true}),
          text("fechaNotificacion","Fecha de notificación"),
          text("firmaOrganismo","Firma y sello del organismo solicitante",{"signature":true,"mnc":false}),
          text("conformidadDocente","Conformidad / firma del docente",{"signature":true,"mnc":false})
        ]},
        {title:"Planilla anexa · Anexo IV",fields:[
          text("anexoCuil","CEIC"),
          text("anexoDenominacion","Denominación del cargo y/o cantidad de horas cátedra"),
          text("anexoSituacion","Situación de revista"),
          text("oficinaOrigen","Oficina o establecimiento de origen"),
          text("cuofOrigen","CUOF de origen"),
          text("oficinaDestino","Oficina o institución de destino"),
          text("cuofDestino","CUOF de destino"),
          text("tipoCambio","Tipo de cambio de función")
        ]},
      ]
    },
    {
      id:"traslado-inicial",
      code:"TRASLADO",
      title:"Solicitud de traslado transitorio · Nivel Inicial",
      catalogTitle:"Solicitud de traslado transitorio",
      sourceUrl:"https://drive.google.com/file/d/1YZdAd1WqyyjuRSHMwAxpMuIA0vlTXPIq/view?usp=drive_link",
      sensitive:true,
      notices:["Declaro bajo juramento que los datos consignados son veraces y exactos. Me notifico que cualquier falsedad dejará sin efecto el traslado otorgado, sin perjuicio de las sanciones disciplinarias que correspondieren."],
      sections:[
        {title:"Datos personales y laborales",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("estadoCivil","Estado civil",["Soltero/a","Casado/a","Divorciado/a","Viudo/a","Otro"]),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("telefono","Teléfono",{"profileId":"perfilTelefonoFijo"}),
          text("localidad","Localidad",{"profileId":"perfilLocalidad"}),
          text("codigoPostal","Código postal",{"profileId":"perfilCodigoPostal"}),
          text("titulo","Título docente",{"profileId":"perfilTitulo"}),
          text("situacionRevista","Situación de revista"),
          text("cargoActual","Cargo / horas actuales"),
          text("establecimientoActual","Establecimiento actual"),
          text("distancia","Distancia al establecimiento"),
          text("transporte","Medio de transporte"),
          date("fechaTraslado","Fecha del traslado"),
          area("licenciasRecientes","Licencias o inasistencias recientes",{"wide":true})
        ]},
        {title:"Destino y antecedentes",fields:[
          area("otrosCargos","Otros cargos / establecimientos",{"wide":true}),
          text("destinoSolicitado","Destino solicitado"),
          area("trasladosAnteriores","Traslados transitorios anteriores",{"wide":true}),
          area("concursosTraslado","Participación en concursos de traslado permanente",{"wide":true})
        ]},
        {title:"Fundamento y documentación",fields:[
          area("fundamentoSalud","Fundamentos relacionados con la salud del agente o familiar",{"wide":true}),
          text("familiarVinculo","Vínculo del familiar, si corresponde"),
          text("certificadoMedico","Certificado médico / constancias presentadas"),
          text("duracionTratamiento","Duración del tratamiento"),
          area("antecedentesSalud","Antecedentes pertinentes para la solicitud",{"wide":true}),
          area("integracionFamiliar","Integración familiar / causas del traslado",{"wide":true}),
          date("fechaSolicitada","Fecha solicitada"),
          area("otrasCausas","Otras causas",{"wide":true}),
          text("firma","Firma del solicitante",{"signature":true,"mnc":false}),
          checks("declaracion","Declaración jurada",["Declaro que los datos consignados son correctos"],{"required":true})
        ]},
        {title:"Establecimiento donde revista como titular",fields:[
          text("titularNumero","Jardín / biblioteca N.º"),
          text("titularCategoria","Categoría"),
          text("titularGrupo","Grupo"),
          text("titularDireccion","Dirección"),
          text("titularLocalidad","Localidad"),
          text("titularCargo","Cargo"),
          text("titularAntiguedad","Antigüedad como titular"),
          date("titularIngreso","Fecha de ingreso")
        ]},
        {title:"Establecimiento donde presta servicio actualmente",fields:[
          text("actualNumero","Jardín / biblioteca N.º"),
          text("actualCategoria","Categoría"),
          text("actualGrupo","Grupo"),
          text("actualDireccion","Dirección"),
          text("actualLocalidad","Localidad")
        ]},
        {title:"Establecimiento al que solicita traslado",fields:[
          text("solicitadoNumero","Jardín / biblioteca N.º"),
          text("solicitadoCategoria","Categoría"),
          text("solicitadoGrupo","Grupo"),
          text("solicitadoDireccion","Dirección"),
          text("solicitadoLocalidad","Localidad"),
          text("solicitadoCausa","Causa"),
          text("solicitadoDistancia","Distancia al domicilio"),
          text("solicitadoTransporte","Medios de transporte")
        ]},
        {title:"Antecedentes específicos",fields:[
          text("tareasAdministrativas","¿Se desempeñó en tareas administrativas?"),
          text("concursoNumero","Concurso N.º"),
          text("concursoResolucion","Resolución N.º"),
          text("antiguedadAfeccion","Antigüedad de la afección"),
          text("conyugeNombre","Apellido y nombres del cónyuge"),
          text("conyugeOrganismo","Organismo donde presta servicios"),
          text("conyugeDomicilioAnterior","Domicilio anterior"),
          text("conyugeLocalidadAnterior","Localidad anterior"),
          text("conyugeLocalidadDestino","Localidad a la que es trasladado"),
          text("conyugeCausa","Causa del traslado"),
          date("tareasDesde","Tareas administrativas desde"),
          date("tareasHasta","Tareas administrativas hasta",{"after":"tareasDesde"}),
          date("concursoEfectivizacion","Fecha de efectivización"),
          date("conyugeFechaTraslado","Fecha del traslado del cónyuge"),
          text("lugarFirma","Lugar de presentación"),
          date("fechaFirma","Fecha de presentación")
        ]},
        {title:"Dirección del establecimiento — apartado IV, punto 1.2 de las normas",notice:"Para completar por la autoridad interviniente.",fields:[
          area("directorInforme","Informe / dictamen",{"wide":true}),
          text("directorLugar","Lugar"),
          date("directorFecha","Fecha"),
          text("firmadirector","Firma y sello",{"signature":true,"mnc":false})
        ]},
        {title:"Supervisor de zona",notice:"Para completar por la autoridad interviniente.",fields:[
          area("supervisorInforme","Informe / dictamen",{"wide":true}),
          text("supervisorLugar","Lugar"),
          date("supervisorFecha","Fecha"),
          text("firmasupervisor","Firma y sello",{"signature":true,"mnc":false})
        ]},
        {title:"Dirección regional",notice:"Para completar por la autoridad interviniente.",fields:[
          area("regionalInforme","Informe / dictamen",{"wide":true}),
          text("regionalLugar","Lugar"),
          date("regionalFecha","Fecha"),
          text("firmaregional","Firma y sello",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"interinos",
      code:"INTERINOS",
      title:"Inscripción de interinos y suplentes con expectativas",
      catalogTitle:"Inscripción de interinos y suplentes",
      sourceUrl:"https://docs.google.com/document/d/1RybFBibYS_cfbUHvtGzmmtAf7yrzhEh6/edit?usp=drive_link&ouid=110226675107462379636&rtpof=true&sd=true",
      notices:["Plan de Estabilidad y Garantías Laborales del Personal Docente del Sistema Educativo Provincial: Ley 3895/2023 y Decreto Reglamentario 3060/2023.","Comprende Inicial, Primario y Secundario en todas sus orientaciones y modalidades, Superior, Maestro Especial de Técnica Agropecuaria, Centros de Educación Física, materias especiales de Educación Especial y docentes indígenas de Inicial, Primario, Secundario y Superior. Los docentes cuentan con diez días para reclamar si no se encuentran en la resolución del Plan, conforme a los Decretos Reglamentarios 3060/2023 y 3061/2023. Verificá la convocatoria vigente."],
      sections:[
        {title:"Inscripción",fields:[
          text("lugar","Lugar"),
          date("fecha","Fecha",{"required":true}),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          date("fechaNacimiento","Fecha de nacimiento"),
          text("lugarNacimiento","Lugar de nacimiento"),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("telefono","Teléfono",{"profileId":"perfilTelefonoFijo"}),
          text("correo","Correo electrónico",{"profileId":"correo","type":"email"}),
          text("celular","Teléfono celular"),
          text("localidad","Localidad",{"profileId":"perfilLocalidad"}),
          text("codigoPostal","Código postal",{"profileId":"perfilCodigoPostal"}),
          text("titulo","Título",{"profileId":"perfilTitulo"}),
          text("registroTitulo","Número de registro del título",{"profileId":"perfilRegistro"}),
          choices("titular","¿Es titular actualmente?",["Sí","No"],{"required":true}),
          text("cargoHoras","Cargo / horas actuales")
        ]},
        {title:"Documentación adjunta",fields:[
          repeat("documentacion","Documentación",[
            text("documento","Documento presentado"),
            text("observacion","Observación")
          ],{"minRows":1,"maxRows":5,"initialRows":1,"addLabel":"Agregar documento"})
        ]},
        {title:"Firma",fields:[
          area("declaracion","Declaración",{"wide":true,"legacyOnly":true,"required":false,"mnc":false}),
          text("firma","Firma del solicitante",{"signature":true,"mnc":false,"legacyOnly":true,"required":false})
        ]},
      ]
    },
    {
      id:"reubicacion",
      code:"REUBICACION",
      title:"Condición de reubicación",
      catalogTitle:"Condición de reubicación",
      sourceUrl:"https://docs.google.com/document/d/1uVSxe2JqkcTX-ONvNMVUQq--p5gbPpvd/edit?usp=drive_link&ouid=110226675107462379636&rtpof=true&sd=true",
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      sections:[
        {title:"Datos complementarios del borrador anterior",fields:[
          text("apellido","Apellido",{"required":false,"profileId":"perfilApellidos","legacyOnly":true,"mnc":false}),
          text("nombres","Nombres",{"required":false,"profileId":"perfilNombres","legacyOnly":true,"mnc":false}),
          text("dni","DNI",{"required":false,"profileId":"dni","inputmode":"numeric","document":true,"legacyOnly":true,"mnc":false})
        ]},
        {title:"Establecimientos y cargos",fields:[
          repeat("destinos","Cargos para reubicación",[
            text("establecimiento","Establecimiento / instituto",{"required":true}),
            text("categoria","Categoría"),
            text("zona","Zona"),
            text("cargoAsignatura","Cargo / asignatura / unidad curricular",{"required":true}),
            text("horas","Horas cátedra"),
            text("instrumento","Instrumento legal"),
            text("localidad","Localidad"),
            text("region","Región")
          ],{"minRows":1,"maxRows":12,"addLabel":"Agregar cargo"})
        ]},
        {title:"Conformidad",fields:[
          text("firmaDocente","Firma del docente",{"signature":true,"mnc":false}),
          date("fecha","Fecha",{"legacyOnly":true,"required":false,"mnc":false})
        ]},
      ]
    },
    {
      id:"form-3",
      code:"N° 3",
      title:"Datos de identificación del agente",
      catalogTitle:"Datos de identificación",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/08-FORMULARIO-N%C2%B03-Modificacion-de-Datos-de-Identificacion-del-Agente.doc",
      notices:["Antes de completar, consultá el instructivo correspondiente. Declaro bajo juramento que la información consignada es correcta y responde a las normas legales vigentes."],
      sections:[
        {title:"Datos actuales",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true,"documentTypeKey":"tipoDocumentoActual"}),
          select("tipoDocumentoActual","Tipo de documento actual",["DNI","LC","LE","CUIL"]),
          select("sexoActual","Sexo actual",["F","M","Otro"],{"profileId":"sexo"})
        ]},
        {title:"Datos solicitados",fields:[
          text("apellidoNuevo","Apellido solicitado"),
          text("nombresNuevos","Nombres solicitados"),
          select("tipoDocumentoNuevo","Tipo de documento solicitado",["DNI","LC","LE","CUIL"]),
          text("numeroDocumentoNuevo","Número de documento solicitado"),
          select("sexoNuevo","Sexo solicitado",["F","M","Otro"]),
          area("cambioSolicitado","Modificación solicitada",{"wide":true}),
          area("documentacion","Documentación respaldatoria",{"wide":true}),
          text("firma","Firma del agente",{"signature":true,"mnc":false}),
          date("fecha","Fecha"),
          text("lugarPresentacion","Lugar de presentación")
        ]},
        {title:"Uso administrativo",notice:"Constancias de recepción, control y archivo de la documentación respaldatoria por la unidad administrativa.",fields:[
          text("verificacion","Verificación administrativa",{"legacyOnly":true,"required":false,"mnc":false}),
          text("cargaSistema","Constancia de carga en sistema",{"legacyOnly":true,"required":false,"mnc":false})
        ]},
        {title:"Recepción y control administrativo",notice:"Para completar por las oficinas intervinientes. Las firmas y sellos se realizan sobre el documento impreso.",fields:[
          text("lugarRecepcion","Lugar de recepción"),
          text("fechaRecepcion","Fecha de recepción"),
          text("firmaRecepcion","Firma y sello del responsable de la unidad administrativa",{"signature":true,"mnc":false}),
          text("jurisdiccion","Jurisdicción"),
          text("escalafon","Escalafón"),
          text("itemNivel","Ítem / nivel"),
          text("modalidadAdministrativa","Modalidad"),
          text("oficinaAdministrativa","Oficina"),
          text("operadorCarga","Responsable de carga"),
          text("fechaCarga","Fecha de ingreso a base de datos"),
          text("fechaEnvioDgp","Fecha de envío / recepción en DGP"),
          text("fechaEnvioRemuneraciones","Fecha de envío / recepción en Remuneraciones")
        ]},
      ]
    },
    {
      id:"form-6",
      code:"N° 6",
      title:"Datos de familiares",
      catalogTitle:"Datos de familiares",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/11-FORMULARIO-N%C2%B06-de-Alta-Baja-Modificacion-datos-del-familiares.doc",
      sensitive:true,
      notices:["Declaración jurada: la información de familiares o personas a cargo es correcta, está comprendida en las normas vigentes y no existe duplicidad en la percepción de asignaciones familiares por el suscripto o terceros en otra actividad pública o privada."],
      sections:[
        {title:"Agente",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true,"documentTypeKey":"tipoDocumentoAgente"}),
          select("tipoDocumentoAgente","Tipo de documento",["DNI","LC","LE"]),
          select("sexoAgente","Sexo",["F","M"],{"profileId":"sexo"})
        ]},
        {title:"Familiares y acción",fields:[
          repeat("familiares","Familiar",[
            select("accion","Acción",["Alta","Baja","Modificación"]),
            text("parentesco","Parentesco"),
            text("dni","DNI",{"inputmode":"numeric","document":true}),
            select("sexo","Sexo",["F","M","Otro"]),
            text("apellidoNombres","Apellido y nombres"),
            date("fechaNacimiento","Fecha de nacimiento"),
            text("nivelEscolar","Nivel escolar / curso"),
            choices("incapacidad","Incapacidad declarada",["Sí","No"]),
            choices("dobleAsignacion","Doble asignación",["Sí","No"]),
            choices("ayudaEscolar","Ayuda escolar",["Sí","No"]),
            text("hecho","Nacimiento / adopción / matrimonio y fecha"),
            area("documentacion","Documentación adjunta",{"wide":true}),
            select("tipoDocumento","Tipo de documento",["DNI","LC","LE"]),
            choices("correspondeAsignaciones","Corresponde asignaciones familiares",["Sí","No"]),
            text("curso","Curso"),
            text("asignacionSolicitada","Asignación cuya alta, modificación o baja solicita"),
            text("hechoGenerador","Hecho generador"),
            date("fechaHecho","Fecha del hecho generador")
          ],{"minRows":1,"maxRows":10,"addLabel":"Agregar familiar"})
        ]},
        {title:"Declaración",fields:[
          area("observaciones","Observaciones",{"wide":true}),
          text("firma","Firma del agente",{"signature":true,"mnc":false}),
          date("fecha","Fecha")
        ]},
        {title:"Recepción y control administrativo",notice:"Para completar por las oficinas intervinientes. Las firmas y sellos se realizan sobre el documento impreso.",fields:[
          text("lugarRecepcion","Lugar de recepción"),
          text("fechaRecepcion","Fecha de recepción"),
          text("firmaRecepcion","Firma y sello del responsable de la unidad administrativa",{"signature":true,"mnc":false}),
          text("jurisdiccion","Jurisdicción"),
          text("escalafon","Escalafón"),
          text("itemNivel","Nivel"),
          text("modalidadAdministrativa","Modalidad"),
          text("oficinaAdministrativa","Oficina"),
          text("operadorCarga","Responsable de carga"),
          text("fechaCarga","Fecha de ingreso a base de datos"),
          text("fechaEnvioRemuneraciones","Fecha de recepción en Remuneraciones"),
          text("recibioRemuneraciones","Responsable de recepción en Remuneraciones")
        ]},
        {title:"Certificación de personal",notice:"Para completar por el encargado de personal de la unidad administrativa.",fields:[
          area("certificacionPersonal","Certificación de recepción, control y archivo de documentación",{"wide":true}),
          select("accionCertificada","Acción certificada",["Alta","Modificación","Baja"]),
          date("vigenciaCertificada","A partir de"),
          area("datosCertificados","Datos que se computan",{"wide":true})
        ]},
      ]
    },
    {
      id:"form-7",
      code:"N° 7",
      title:"Baja de asignaciones familiares",
      catalogTitle:"Baja de asignaciones familiares",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/12-FORMULARIO-N%C2%B07-Baja-de-asignaciones-familiares.doc",
      sensitive:true,
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      sections:[
        {title:"Agente",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true,"documentTypeKey":"tipoDocumentoAgente"}),
          select("tipoDocumentoAgente","Tipo de documento",["DNI","LC","LE"]),
          select("sexoAgente","Sexo",["F","M"],{"profileId":"sexo"})
        ]},
        {title:"Familiares y asignaciones",fields:[
          repeat("familiares","Familiar",[
            text("parentesco","Parentesco"),
            text("dni","DNI",{"inputmode":"numeric","document":true}),
            text("apellidoNombres","Apellido y nombres"),
            date("fechaNacimiento","Fecha de nacimiento"),
            checks("asignaciones","Asignaciones",["Incapacidad","Escolaridad","Doble asignación","Ayuda escolar","Nacimiento","Adopción","Matrimonio"]),
            text("motivoBaja","Motivo de la baja"),
            date("fechaHecho","Fecha del hecho"),
            area("observaciones","Observaciones",{"wide":true}),
            select("tipoDocumento","Tipo de documento",["DNI","LC","LE"]),
            select("sexo","Sexo",["F","M"]),
            choices("correspondeAsignacion","Corresponde asignación familiar",["Sí","No"])
          ],{"minRows":1,"maxRows":10,"addLabel":"Agregar familiar"})
        ]},
        {title:"Firma y uso administrativo",fields:[
          text("firmaAgente","Firma y sello del encargado de personal de la unidad administrativa",{"signature":true,"mnc":false}),
          date("fecha","Fecha"),
          text("verificacion","Verificación administrativa"),
          text("destinatario","Encargado de verificación y control del SAGP de la jurisdicción"),
          text("hechoGenerador","Hecho generador"),
          text("lugarFirma","Lugar")
        ]},
        {title:"Recepción y control administrativo",notice:"Para completar por las oficinas intervinientes. Las firmas y sellos se realizan sobre el documento impreso.",fields:[
          text("jurisdiccion","Jurisdicción"),
          text("escalafon","Escalafón"),
          text("itemNivel","Ítem / nivel"),
          text("modalidadAdministrativa","Modalidad"),
          text("oficinaAdministrativa","Oficina"),
          text("operadorCarga","Responsable de carga"),
          text("fechaCarga","Fecha de ingreso a base de datos")
        ]},
      ]
    },
    {
      id:"bd07",
      code:"BD-07",
      title:"Opción de seguros",
      catalogTitle:"Opción de seguros",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/28-FORMULARIO-BD-07-Opcion-de-seguros.doc",
      sensitive:true,
      notices:["Sólo para trámite jubilatorio. Manifestar si desea continuar el seguro de vida no obligatorio con el capital que tenía asegurado en actividad."],
      sections:[
        {title:"Solicitud",fields:[
          text("lugar","Lugar"),
          date("fecha","Fecha"),
          text("actuacion","Actuación / expediente"),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          text("establecimiento","Escuela",{"legacyOnly":true,"required":false,"mnc":false}),
          text("nivel","Nivel"),
          choices("continuarSeguro","¿Solicita continuar con el seguro de vida no obligatorio durante el trámite jubilatorio?",["Sí","No"],{"required":true}),
          text("firma","Firma del agente",{"signature":true,"mnc":false}),
          text("numeroEscuela","Número de unidad educativa"),
          text("nombreEscuela","Nombre de la unidad educativa"),
          text("aclaracionFirma","Aclaración de firma")
        ]},
      ]
    },
    {
      id:"beneficiarios",
      code:"BENEFICIARIOS",
      title:"Designación de beneficiarios",
      catalogTitle:"Designación de beneficiarios",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/29-NOTA-de-Designacion-de-Beneficiarios.doc",
      sensitive:true,
      notices:["Se informa la designación y/o modificación de beneficiarios de los seguros de vida deducidos de los haberes: obligatorio, colectivo y familiar.","El empleador certifica que el firmante integra el personal del organismo. Firma o impresión digital de la persona asegurada."],
      sections:[
        {title:"Persona asegurada",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          date("fechaNacimiento","Fecha de nacimiento"),
          checks("tipoSeguro","Seguro",["Seguro obligatorio","Seguro colectivo","Seguro familiar"]),
          select("tipoDocumento","Tipo de documento",["DNI","LC","LE"]),
          text("destinatario","Director/a de Personal"),
          text("legacy_tipoSeguro","Opciones de seguro del borrador anterior",{"legacyOnly":true,"mnc":false,"required":false})
        ]},
        {title:"Beneficiarios",fields:[
          repeat("beneficiarios","Beneficiario",[
            text("nombre","Apellido y nombres"),
            text("dni","DNI",{"document":true}),
            text("parentesco","Parentesco"),
            text("domicilio","Domicilio"),
            select("tipoDocumento","Tipo de documento",["DNI","LC","LE"])
          ],{"minRows":1,"maxRows":10,"addLabel":"Agregar beneficiario"})
        ]},
        {title:"Certificación",fields:[
          text("firmaAsegurado","Firma de la persona asegurada",{"signature":true,"mnc":false}),
          text("certificacionEmpleador","Certificación del empleador"),
          date("fecha","Fecha"),
          text("lugarFirma","Lugar"),
          text("impresionDigital","Impresión digital del asegurado",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"incapacidad",
      code:"INCAPACIDAD",
      title:"Beneficio por incapacidad total y permanente",
      catalogTitle:"Beneficio por incapacidad",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/33-SOLICITUD-del-Beneficio-de-Incapacidad-Total-y-Permanente.docx",
      sensitive:true,
      notices:["Solicitud del beneficio de incapacidad total y permanente conforme al Seguro de Vida Obligatorio, Decreto-Ley 26/1, por impedimento para ejercer otra ocupación remunerada.","Si la persona no sabe firmar o se encuentra impedida, estampará su impresión digital.","Certificación oficial: la repartición certifica la exactitud de los datos, que el recurrente agotó la licencia con goce íntegro o parcial de haberes por salud según la reglamentación y que integra el personal asegurado."],
      sections:[
        {title:"Persona asegurada",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          date("fechaNacimiento","Fecha de nacimiento"),
          text("ministerio","Ministerio"),
          text("reparticion","Repartición"),
          text("dependencia","Dependencia"),
          text("lugarServicios","Lugar donde presta servicios"),
          text("provincia","Provincia"),
          text("ocupacion","Ocupación"),
          text("funcion","Función que desempeñaba"),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"})
        ]},
        {title:"Capital asegurado",fields:[
          text("seguroObligatorio","Seguro obligatorio ($)",{"inputmode":"decimal"}),
          text("seguroColectivo","Seguro colectivo ($)",{"inputmode":"decimal"}),
          text("seguroAdicional","Seguro adicional ($)",{"inputmode":"decimal"}),
          text("total","Total ($)",{"inputmode":"decimal"})
        ]},
        {title:"Solicitud y certificación",fields:[
          area("solicitud","Solicitud / manifestación",{"wide":true,"legacyOnly":true,"required":false,"mnc":false}),
          text("lugar","Lugar"),
          date("fecha","Fecha"),
          text("firmaAsegurado","Firma / impresión digital de la persona asegurada",{"signature":true,"mnc":false}),
          date("fechaCese","Fecha de cese"),
          area("certificacion","Certificación oficial de la repartición",{"wide":true,"legacyOnly":true,"required":false,"mnc":false}),
          text("firmaJefatura","Firma y sello de la jefatura",{"signature":true,"mnc":false}),
          text("lugarCertificacion","Lugar de certificación"),
          date("fechaCertificacion","Fecha de certificación"),
          text("selloReparticion","Sello de la repartición",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"seguro-descuento",
      code:"SEGURO",
      title:"Descuento por seguro",
      catalogTitle:"Descuento por seguro",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/34-SOLICITUD-Descuento-por-Seguro.docx",
      sensitive:true,
      notices:["Solicitud a la Dirección de Administración para que se practiquen los descuentos por el seguro de vida familiar y/o colectivo seleccionado. Firma y sello del director."],
      sections:[
        {title:"Solicitud",fields:[
          text("lugar","Lugar"),
          date("fecha","Fecha"),
          text("destinatario","Destinatario / oficina"),
          checks("seguros","Descuentos solicitados",["Seguro de vida familiar","Seguro de vida colectivo"],{"required":true}),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          text("escuela","Número de escuela"),
          text("firma","Firma del solicitante",{"signature":true,"mnc":false,"legacyOnly":true,"required":false}),
          text("firmaDirector","Firma y sello del director",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"dp01",
      code:"DP-01",
      title:"Disposición de alta",
      catalogTitle:"Disposición de alta",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/01-FORMULARIO-DP-01-Disposicion-de-Alta.doc",
      notices:["Para ingreso definitivo de titulares no se consigna número de disposición. El bloque de motivo e instrumento de titulares/interinos y el del reemplazado para suplentes se completan según corresponda."],
      sections:[
        {title:"Tipo de alta",fields:[
          select("situacion","Situación",["Interino","Suplente","Titular"],{"required":true}),
          text("selloRegional","Sello regional / actuación",{"signature":true,"mnc":false}),
          text("numeroDisposicion","Número de disposición",{"when":{"key":"situacion","values":["Interino","Suplente"]}}),
          date("fechaAltaDesde","Fecha de alta desde"),
          date("fechaAltaHasta","Fecha de alta hasta"),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M","Otro"],{"profileId":"sexo"})
        ]},
        {title:"Establecimiento y cargo",fields:[
          text("codigoOficina","Código de oficina"),
          text("codigoAnexo","Código de anexo"),
          text("establecimiento","Unidad educativa / establecimiento"),
          text("nivel","Nivel"),
          text("modalidad","Modalidad"),
          text("categoria","Categoría"),
          text("zona","Zona"),
          text("jornada","Jornada"),
          text("localidad","Localidad o paraje"),
          text("codigoCargo","Código de cargo / horas"),
          text("descripcionCargo","Descripción"),
          text("anio","Año",{academicPart:"year"}),
          text("division","División / sección",{academicPart:"division"}),
          text("turno","Turno"),
          text("horas","Horas cátedra"),
          text("especialidad","Especialidad"),
          text("planEstudio","Plan de estudio"),
          text("asignatura","Asignatura")
        ]},
        {title:"Motivo e instrumento legal",fields:[
          text("codigoMotivo","Código de motivo",{"when":{"key":"situacion","values":["Titular","Interino"]}}),
          area("descripcionMotivo","Descripción del motivo",{"wide":true,"when":{"key":"situacion","values":["Titular","Interino"]}}),
          text("instrumento","Instrumento legal / resolución",{"when":{"key":"situacion","values":["Titular","Interino"]}}),
          text("observaciones","Observaciones")
        ]},
        {title:"Datos del reemplazado · solo suplencias",fields:[
          text("reemplazadoDni","DNI",{"when":{"key":"situacion","values":["Suplente"]}}),
          select("reemplazadoSexo","Sexo",["F","M","Otro"],{"when":{"key":"situacion","values":["Suplente"]}}),
          text("reemplazadoApellido","Apellido",{"when":{"key":"situacion","values":["Suplente"]}}),
          text("reemplazadoNombres","Nombres",{"when":{"key":"situacion","values":["Suplente"]}}),
          text("reemplazadoMotivo","Código / descripción del motivo",{"when":{"key":"situacion","values":["Suplente"]}}),
          text("reemplazadoInstrumento","Instrumento legal",{"when":{"key":"situacion","values":["Suplente"]}})
        ]},
        {title:"Firmas y notificación",fields:[
          date("fechaPresentacion","Fecha"),
          text("notificacion","Notificación del docente"),
          text("firmaDirector","Firma y sello del director",{"signature":true,"mnc":false}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"bd02",
      code:"BD-02",
      title:"Disposición de baja",
      catalogTitle:"Disposición de baja",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/02-FORMULARIO-BD-02-Disposicion-de-Baja.doc",
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      sections:[
        {title:"Agente",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M"],{"profileId":"sexo"}),
          text("numeroDisposicion","Número de disposición de baja"),
          text("selloRegional","Sello regional / actuación simple",{"signature":true,"mnc":false})
        ]},
        {title:"Establecimientos y cargos",fields:[
          repeat("cargos","Cargo / establecimiento",[
            text("codigoOficina","Código de oficina"),
            text("codigoAnexo","Código de anexo"),
            text("establecimiento","Unidad educativa / establecimiento"),
            text("nivel","Nivel"),
            text("modalidad","Modalidad"),
            text("categoria","Categoría"),
            text("zona","Zona"),
            text("jornada","Jornada"),
            text("localidad","Localidad o paraje"),
            text("cargo","Cargo / horas"),
            text("asignatura","Asignatura"),
            text("situacionRevista","Situación de revista"),
            date("fechaAlta","Fecha de alta"),
            date("fechaBaja","Fecha de baja"),
            text("codigoMotivo","Código de motivo"),
            text("descripcionMotivo","Descripción del motivo"),
            text("instrumento","Instrumento legal"),
            text("codigoCargo","Código de cargo / horas"),
            text("descripcionCargo","Descripción del cargo"),
            text("instrumentoAlta","Resolución / disposición de alta"),
            text("anio","Año",{academicPart:"year"}),
            text("division","División / sección",{academicPart:"division"}),
            text("turno","Turno"),
            text("horas","Horas cátedra"),
            text("especialidad","Especialidad"),
            text("planEstudio","Plan de estudio")
          ],{"minRows":1,"maxRows":5,"addLabel":"Agregar cargo"})
        ]},
        {title:"Observaciones y conformidad",fields:[
          area("observaciones","Observaciones",{"wide":true}),
          text("firmaDirector","Firma y sello del director",{"signature":true,"mnc":false}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false}),
          date("fecha","Fecha")
        ]},
      ]
    },
    {
      id:"md01",
      code:"MD-01",
      title:"Movimientos provisorios de docentes",
      catalogTitle:"Movimientos provisorios",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/03-FORMULARIO-MD-01-Movimientos-provisorios-de-docentes-Ingreso-Egreso.docx",
      notices:["La planilla no tiene efectos para originar nuevas liquidaciones de sueldos ni para dejar de liquidarlos. Administración la recibe al solo efecto de cambiar la boca de pago adecuándola al nuevo destino. Tachar la alternativa ingreso/egreso que no corresponda."],
      sections:[
        {title:"Agente y establecimiento",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M","Otro"],{"profileId":"sexo"}),
          text("codigoOficina","Código de oficina"),
          text("codigoAnexo","Código de anexo"),
          text("establecimiento","Unidad educativa / establecimiento"),
          text("nivel","Nivel"),
          text("modalidad","Modalidad"),
          text("categoria","Categoría"),
          text("zona","Zona"),
          text("jornada","Jornada"),
          text("localidad","Localidad o paraje"),
          text("selloRegional","Sello regional / actuación simple",{"signature":true,"mnc":false})
        ]},
        {title:"Movimientos de cargos / horas",fields:[
          repeat("movimientos","Cargo / asignatura",[
            text("codigoCargo","Código de cargo / horas"),
            text("descripcionCargo","Descripción del cargo / horas"),
            text("asignatura","Asignatura"),
            text("horas","Horas cátedra"),
            text("curso","Año / curso",{academicPart:"year"}),
            text("division","División",{academicPart:"division"}),
            text("turno","Turno"),
            select("situacionRevista","Situación de revista",["Titular","Interino","Suplente"]),
            text("codigoMotivo","Código de motivo")
          ],{"minRows":1,"maxRows":8,"addLabel":"Agregar movimiento"})
        ]},
        {title:"Ingreso / egreso",fields:[
          area("descripcionMotivo","Descripción del motivo",{"wide":true}),
          text("instrumento","Resolución / disposición"),
          date("fechaIngreso","Fecha de ingreso"),
          date("fechaEgreso","Fecha de egreso"),
          area("observaciones","Observaciones",{"wide":true}),
          text("notificacion","Notificación del docente"),
          text("firmaDirector","Firma y sello del director",{"signature":true,"mnc":false}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false}),
          date("fecha","Fecha"),
          choices("tipoMovimiento","Tipo de movimiento",["Ingreso","Egreso"],{"required":true})
        ]},
      ]
    },
    {
      id:"dl02",
      code:"DL-02",
      title:"Interrupción de licencia",
      catalogTitle:"Interrupción de licencia",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/22-FORMULARIO-DL-02-Disposicion-Interrupcion-Licencia.doc",
      notices:["Disposición de interrupción de licencia o permiso para personal interino, suplente y titular. Completar el código, artículo y descripción de la licencia o del permiso que se interrumpe."],
      sensitive:true,
      sections:[
        {title:"Agente",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M"],{"profileId":"sexo"}),
          text("numeroDisposicion","Número de disposición de interrupción"),
          text("selloRegional","Sello regional / actuación simple",{"signature":true,"mnc":false})
        ]},
        {title:"Licencias y cargos",fields:[
          repeat("interrupciones","Interrupción",[
            text("codigoOficina","Código de oficina"),
            text("codigoAnexo","Código de anexo"),
            text("establecimiento","Unidad educativa / establecimiento"),
            text("nivel","Nivel"),
            text("modalidad","Modalidad"),
            text("categoria","Categoría"),
            text("zona","Zona"),
            text("jornada","Jornada"),
            text("localidad","Localidad o paraje"),
            text("cargo","Cargo / horas"),
            text("situacionRevista","Situación de revista"),
            text("codigoLicencia","Código de licencia"),
            text("articulo","Artículo"),
            text("descripcion","Descripción"),
            date("fechaInterrupcion","Fecha de interrupción"),
            text("instrumento","Instrumento legal"),
            text("codigoCargo","Código de cargo / horas"),
            text("descripcionCargo","Descripción del cargo"),
            text("anio","Año",{academicPart:"year"}),
            text("division","División / sección",{academicPart:"division"}),
            text("turno","Turno"),
            text("horas","Horas cátedra"),
            text("asignatura","Asignatura"),
            text("codigoPermiso","Código de permiso"),
            text("articuloPermiso","Artículo del permiso"),
            text("descripcionPermiso","Descripción del permiso")
          ],{"minRows":1,"maxRows":5,"addLabel":"Agregar interrupción"})
        ]},
        {title:"Observaciones y firmas",fields:[
          area("observaciones","Observaciones",{"wide":true}),
          text("firmaResponsable","Firma del responsable",{"signature":true,"mnc":false}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false}),
          date("fecha","Fecha")
        ]},
      ]
    },
    {
      id:"il01",
      code:"IL-01",
      title:"Informe mensual por enfermedad",
      catalogTitle:"Informe mensual por enfermedad",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/19-INFORME-e-INSTRUCTIVO-Mensual-de-Licencias-por-Enfermedad-IL-01.docx",
      sensitive:true,
      notices:["Los datos requeridos por IL-01 son obligatorios. Mes y año corresponden al inicio de las licencias. Numerar los folios cuando se eleve más de una planilla.","Usar los códigos oficiales de oficina/anexo, cargo y licencia. Para personal administrativo o de servicios se omite el código de cargo/horas.","Situación de revista: T titular, I interino, S suplente. Instrumento legal: D disposición, R resolución. Consignar período otorgado por Reconocimientos Médicos y fecha hasta otorgada por el establecimiento, aunque coincidan.","Referencias del instructivo: oficina/anexo, Resoluciones 3368/01, 3559/01 y 3137/02; cargo/horas docente, Resolución 872/02; licencia, Resolución 942/02 para docentes y 28/02 y 37/02 para escalafón general. Encuadre legal de ejemplo: 312 B-1."],
      sections:[
        {title:"Período e institución",fields:[
          text("mes","Mes",{"required":true,"mnc":false}),
          text("anio","Año",{"required":true,"mnc":false}),
          text("codigoOficina","Código de oficina",{"required":true,"mnc":false}),
          text("codigoAnexo","Código de anexo",{"required":true,"mnc":false}),
          text("establecimiento","Unidad educativa / establecimiento",{"required":true,"mnc":false}),
          text("nivel","Nivel"),
          text("modalidad","Modalidad"),
          text("categoria","Categoría"),
          text("zona","Zona"),
          text("jornada","Jornada"),
          text("localidad","Localidad o paraje"),
          text("folio","Folio",{"required":true,"mnc":false}),
          text("actuacionSimple","Actuación simple N.º"),
          text("selloRegional","Sello regional",{"signature":true,"mnc":false})
        ]},
        {title:"Licencias informadas",fields:[
          repeat("licencias","Agente / licencia",[
            text("dni","Documento",{"document":true,"required":true,"mnc":false}),
            select("sexo","Sexo",["F","M","Otro"],{"required":true,"mnc":false}),
            text("apellidoNombre","Apellido y nombre",{"required":true,"mnc":false}),
            text("codigoCargo","Código de cargo / horas"),
            text("descripcionCargo","Descripción del cargo / horas",{"required":true,"mnc":false}),
            select("situacionRevista","Situación de revista",["Titular","Interino","Suplente"],{"required":true,"mnc":false}),
            text("codigoLicencia","Código de licencia",{"required":true,"mnc":false}),
            text("articulo","Artículo",{"required":true,"mnc":false}),
            select("tipoInstrumento","Tipo de instrumento",["Disposición","Resolución"],{"required":true,"mnc":false}),
            text("numeroInstrumento","Número de instrumento",{"required":true,"mnc":false}),
            date("desde","Período desde",{"required":true,"mnc":false}),
            date("hasta","Período hasta",{"required":true,"mnc":false,"after":"desde"}),
            date("hastaEstablecimiento","Hasta según establecimiento",{"required":true,"mnc":false})
          ],{"minRows":1,"maxRows":20,"addLabel":"Agregar licencia"})
        ]},
        {title:"Observaciones y aprobación",fields:[
          area("observaciones","Observaciones",{"wide":true}),
          text("firmaSuperior","Firma y sello del superior jerárquico",{"signature":true,"mnc":false}),
          date("fechaFirma","Fecha")
        ]},
      ]
    },
    {
      id:"tp01",
      code:"TP-01",
      title:"Tareas pasivas",
      catalogTitle:"Tareas pasivas",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/18-FORMULARIO-TP-01-Tareas-Pasivas.doc",
      sensitive:true,
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      migrations:[["cargo","cargos.0.cargo"],["horas","cargos.0.horas"],["antiguedad","cargos.0.antiguedad"]],
      sections:[
        {title:"Agente y destino",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M","Otro"],{"profileId":"sexo"}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("localidad","Localidad",{"profileId":"perfilLocalidad"}),
          text("organismo","Presentada ante (repartición o establecimiento donde se entrega)"),
          date("desde","Período desde"),
          date("hasta","Período hasta",{"after":"desde"}),
          repeat("cargos","Unidad educativa y cargo",[
            text("unidadEducativa","Unidad educativa"),
            text("cargo","Cargo / horas cátedra"),
            text("horas","Horas"),
            text("antiguedad","Antigüedad")
          ],{"minRows":1,"maxRows":50})
        ]},
        {title:"Fundamento y actuación médica",fields:[
          area("fundamento","Fundamento de la solicitud",{"wide":true}),
          text("derivacion","Solicitud de junta / actuación médica"),
          area("documentacion","Documentación acompañada",{"wide":true}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false}),
          text("firmaDirector","Firma y sello del director",{"signature":true,"mnc":false}),
          date("fecha","Fecha")
        ]},
        {title:"A completar por el director de la unidad educativa",notice:"Solicitud de conformación de una Junta Médica para dictaminar sobre el pedido de tareas pasivas del docente.",fields:[
          text("reconocimientosMedicos","Reconocimientos Médicos de"),
          text("lugarDirector","Lugar"),
          date("fechaDirector","Fecha"),
          text("firmaDirectorJunta","Firma del solicitante / director",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"df01",
      code:"DF-01",
      title:"Documentación faltante",
      catalogTitle:"Documentación faltante",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/14-FORMULARIO-DF-01-Documentacion-Faltante.doc",
      sensitive:true,
      notices:["Ningún trámite de licencia puede iniciarse sin toda la documentación solicitada. Marcar con X cada documento que falta para la causal seleccionada."],
      sections:[
        {title:"Trámite",fields:[
          select("tipoTramite","Tipo de trámite",["Accidente en acto de servicio","Accidente de trayecto","Enfermedad ocupacional","Estudio o perfeccionamiento mayor a un año","Representación gremial, mutual o docente","Cargo electivo dentro del Ministerio","Cargo electivo fuera del Ministerio","Prórroga de licencia de salud","Tareas pasivas"],{"required":true}),
          text("agente","Agente"),
          text("dni","DNI",{"document":true}),
          text("establecimiento","Establecimiento"),
          date("fecha","Fecha")
        ]},
        {title:"Documentación requerida",notice:"En estudio o perfeccionamiento, DJ-02 debe consignar licencias por estudio, fuerza mayor, grave asunto de familia y asuntos particulares. Las casillas indican documentos faltantes.",fields:[
          checks("documentacion","Documentación del borrador anterior (revisar contra la causal)",["Informe médico","Historia clínica","Denuncia policial","Acta escolar","Acta de junta médica","Certificado","Instrumento legal","Otro"],{"legacyOnly":true,"required":false,"mnc":false}),
          area("detalle","Detalle de documentación faltante",{"wide":true}),
          area("observaciones","Observaciones",{"wide":true}),
          text("firma","Firma / recepción",{"signature":true,"mnc":false}),
          checks("faltantes0","Documentación faltante — Accidente en acto de servicio — Art. 312 b) 3), 334 b) y 343 b)",["DJ-01 — Declaración jurada de cargos","DJ-02 — Declaración jurada de licencias","Acta de la unidad educativa","Disposición de instrucción de información sumaria","Conclusión de información sumaria","Disposición de cierre de información sumaria","Parte médico"],{"when":{"key":"tipoTramite","values":["Accidente en acto de servicio"]}}),
          checks("faltantes1","Documentación faltante — Accidente de trayecto — Art. 312 b) 3), 334 b) y 343 b)",["Solicitud por escrito","DJ-01 — Declaración jurada de cargos","DJ-02 — Declaración jurada de licencias","Acta de la unidad educativa","Disposición de instrucción de información sumaria","Conclusión de información sumaria","Disposición de cierre de información sumaria","Parte médico","Actuación policial"],{"when":{"key":"tipoTramite","values":["Accidente de trayecto"]}}),
          checks("faltantes2","Documentación faltante — Enfermedad ocupacional — Art. 312 b) 3), 334 b) y 343 b)",["Solicitud por escrito","DJ-01 — Declaración jurada de cargos","DJ-02 — Declaración jurada de licencias","Acta de la unidad educativa","Disposición de instrucción de información sumaria","Conclusión de información sumaria","Disposición de cierre de información sumaria","Antecedentes médicos de la enfermedad","Acta de junta médica","Actuación policial"],{"when":{"key":"tipoTramite","values":["Enfermedad ocupacional"]}}),
          checks("faltantes3","Documentación faltante — Estudio o perfeccionamiento mayor a un año — Art. 321 c)",["OL-01 — Solicitud de licencia","DJ-01 — Declaración jurada de cargos","DJ-02 — Declaración jurada de licencias","Invitación, beca, programa o constancia de inscripción"],{"when":{"key":"tipoTramite","values":["Estudio o perfeccionamiento mayor a un año"]}}),
          checks("faltantes4","Documentación faltante — Representación gremial, mutual o docente — Art. 321 d)",["OL-01 — Solicitud de licencia","DJ-01 — Declaración jurada de cargos","Instrumento legal de designación certificado"],{"when":{"key":"tipoTramite","values":["Representación gremial, mutual o docente"]}}),
          checks("faltantes5","Documentación faltante — Cargo electivo dentro del Ministerio — Art. 321 e), 336 f) y 345 d)",["OL-01 — Solicitud de licencia","DJ-01 — Declaración jurada de cargos"],{"when":{"key":"tipoTramite","values":["Cargo electivo dentro del Ministerio"]}}),
          checks("faltantes6","Documentación faltante — Cargo electivo fuera del Ministerio — Art. 321 e), 336 f) y 345 d)",["OL-01 — Solicitud de licencia","DJ-01 — Declaración jurada de cargos","Instrumento legal de designación certificado"],{"when":{"key":"tipoTramite","values":["Cargo electivo fuera del Ministerio"]}}),
          checks("faltantes7","Documentación faltante — Prórroga de licencia de salud — Art. 350",["OL-01 — Solicitud de licencia","DJ-01 — Declaración jurada de cargos","DJ-02 — Declaración jurada de licencias","Acta de junta médica"],{"when":{"key":"tipoTramite","values":["Prórroga de licencia de salud"]}}),
          checks("faltantes8","Documentación faltante — Tareas pasivas — Art. 7 d)",["TP-01 — Solicitud de tareas pasivas","DJ-01 — Declaración jurada de cargos","Acta de junta médica"],{"when":{"key":"tipoTramite","values":["Tareas pasivas"]}}),
          text("area","Área interviniente")
        ]},
      ]
    },
    {
      id:"si01",
      code:"SI-01",
      title:"Solicitud de informes",
      catalogTitle:"Solicitud de informes",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/25-FORMULARIO-SI-01-Solicitud-de-Informes-para-Cert.de-Serv.docx",
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      sections:[
        {title:"Rubro I · Solicitud",fields:[
          date("fechaEmision","Fecha de emisión"),
          text("actuacionSimple","Actuación simple N.º"),
          text("actuacionReferida","Referida a actuación N.º"),
          text("unidadSolicitada","Unidad educativa / administrativa solicitada"),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":false,"profileId":"dni","inputmode":"numeric","document":true,"legacyOnly":true,"mnc":false}),
          select("sexo","Sexo",["M","F","Otro"],{"profileId":"sexo"}),
          select("tipoDocumento","Tipo de documento",["DNI","LC","LE","CUIL"]),
          text("numeroDocumento","Número de documento",{"profileId":"dni","required":true,"document":true}),
          checks("documentacion","Si no existe la documentación requerida, enviar",["Hojas de concepto","Planilla de presentismo","Registro de firma","Otros"],{"when":{"key":"documentacionExiste","values":["No"]}}),
          checks("destino","Enviar al destino",["Director de nivel","Secretaría general","Otro"]),
          area("documentacionSolicitada","Documentación requerida",{"wide":true,"required":true}),
          choices("documentacionExiste","¿Existe la documentación requerida?",["Sí","No"]),
          area("otraDocumentacion","Otra documentación alternativa",{"wide":true,"when":{"key":"documentacionExiste","values":["No"]}}),
          text("otroDestino","Otro destino")
        ]},
        {title:"Rubro II · Respuesta de la unidad",fields:[
          area("documentacionEnviada","Documentación que se envía a Cómputos de Servicios",{"wide":true}),
          text("categoria","Categoría"),
          text("zona","Zona"),
          text("jornada","Jornada"),
          text("firmaUnidad","Firma / sello de la unidad",{"signature":true,"mnc":false}),
          date("fechaRespuesta","Fecha de respuesta")
        ]},
      ]
    },
    {
      id:"ba01",
      code:"BA-01",
      title:"Baja del escalafón general",
      catalogTitle:"Baja del escalafón general",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/26-FORMULARIO-BA-01-Baja-Agente-del-Escalafon-Gral..doc",
      sensitive:true,
      notices:["Los datos consignados tienen carácter de declaración jurada. Todos los campos del formulario oficial deben estar completos por los responsables correspondientes.","Si el trámite es rechazado por un motivo fundado, se debe completar un nuevo formulario para reiniciarlo.","El control de sumarios pendientes no es aplicable en caso de fallecimiento. Adjuntar acta de defunción autenticada cuando corresponda."],
      sections:[
        {title:"Solicitud",fields:[
          text("actuacion","Actuación / expediente",{"required":true,"mnc":false}),
          date("fecha","Fecha",{"required":true,"mnc":false}),
          text("oficina","Oficina / escuela",{"required":true,"mnc":false}),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("sexo","Sexo",["F","M","Otro"],{"required":true,"mnc":false,"profileId":"sexo"}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio","required":false,"mnc":false,"legacyOnly":true}),
          text("categoria","Categoría",{"required":true,"mnc":false}),
          date("fechaBaja","Fecha de baja",{"required":true,"mnc":false}),
          select("motivo","Motivo de baja",["Renuncia","Fallecimiento","Jubilación","Otro"],{"required":true,"mnc":false}),
          checks("controles","Controles administrativos",["Formulario correcto y completo","Control de situación en el uso de licencias"],{"required":true,"requiredOptions":["Formulario correcto y completo","Control de situación en el uso de licencias"]}),
          text("codigoOficina","Código de oficina",{"required":true,"mnc":false}),
          text("denominacionOficina","Denominación de la unidad educativa o administrativa",{"required":true,"mnc":false}),
          text("localidadOficina","Localidad de la oficina",{"required":true,"mnc":false}),
          text("calle","Calle",{"required":true,"mnc":false,"profileId":"perfilDomicilio"}),
          text("numero","Número",{"required":true,"mnc":false,"profileId":"perfilNumeroCalle"}),
          text("casa","Departamento / casa / UF",{"required":true,"mnc":false,"profileId":"perfilUnidad"}),
          text("manzana","Manzana / torre",{"required":true,"mnc":false,"profileId":"perfilManzana"}),
          text("barrio","Barrio",{"required":true,"mnc":false,"profileId":"perfilBarrio"}),
          text("localidad","Localidad",{"required":true,"mnc":false}),
          text("codigoPostal","Código postal",{"required":true,"mnc":false,"profileId":"perfilCodigoPostal"}),
          text("departamento","Departamento",{"required":true,"mnc":false,"profileId":"perfilDepartamento"}),
          choices("revista","Situación de revista",["Administrativo o técnico","Servicio","Obrero o maestranza"],{"required":true}),
          choices("controlSumarios","Control de sumarios pendientes",["Sin sumarios pendientes","Con sumarios pendientes"],{"when":{"key":"motivo","values":["Renuncia","Jubilación","Otro"]},"requiredWhen":{"key":"motivo","values":["Renuncia","Jubilación","Otro"]},"mnc":false}),
          text("legacy_controles","Controles del borrador anterior",{"legacyOnly":true,"mnc":false,"required":false})
        ]},
        {title:"Documentación y datos administrativos",fields:[
          checks("documentacion","Documentación adjunta",["Libre deuda de la Dirección de Administración","Acta de defunción autenticada","Libre deuda y devolución de carnet del InSSSeP y grupo familiar si corresponde"],{"required":true,"requiredOptions":["Libre deuda de la Dirección de Administración","Libre deuda y devolución de carnet del InSSSeP y grupo familiar si corresponde"],"conditionalOption":{"when":{"key":"motivo","values":["Fallecimiento"]},"option":"Acta de defunción autenticada"}}),
          area("observaciones","Observaciones",{"wide":true}),
          text("cargoPresupuesto","Cargo / presupuesto"),
          text("instrumentoAlta","Instrumento de designación"),
          text("firmaAgente","Firma del agente / solicitante",{"signature":true,"mnc":false}),
          text("firmaAdministracion","Firma de administración",{"signature":true,"mnc":false}),
          text("legacy_documentacion","Documentación del borrador anterior",{"legacyOnly":true,"mnc":false,"required":false})
        ]},
        {title:"Datos del cargo — Departamento Registro y Control",notice:"Para completar por Registro y Control. Los campos administrativos y las firmas se completan por la oficina responsable.",fields:[
          text("categoriaCargo","Categoría"),
          text("codigoCargo","Código"),
          text("apartado","Apartado"),
          text("grupo","Grupo"),
          text("puntaje","Puntaje"),
          text("denominacionCargo","Denominación"),
          text("itemPresupuestario","Ítem presupuestario"),
          text("tipoInstrumentoAlta","Tipo de instrumento legal de alta"),
          text("numeroInstrumentoAlta","Número de instrumento legal de alta"),
          date("fechaInstrumentoAlta","Fecha de instrumento legal de alta"),
          text("firmaRegistro","Firma responsable del área",{"signature":true,"mnc":false}),
          area("observacionesRechazo","Observaciones de rechazo",{"wide":true}),
          text("firmaRechazo","Firma responsable del rechazo",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"bd01",
      code:"BD-01",
      title:"Causal de baja",
      catalogTitle:"Causal de baja",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/27-FORMULARIO-BD-01-Causal-de-Baja.doc",
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      sections:[
        {title:"Agente y establecimiento",fields:[
          text("localidad","Localidad",{"profileId":"perfilLocalidad"}),
          date("fecha","Fecha"),
          text("establecimiento","Escuela"),
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          date("fechaRenuncia","Fecha de renuncia",{"legacyOnly":true,"required":false,"mnc":false}),
          select("sexo","Sexo",["F","M"],{"profileId":"sexo"}),
          text("nivel","Nivel"),
          text("nombreEscuela","Nombre de la unidad educativa"),
          text("categoria","Categoría"),
          text("zona","Zona"),
          text("jornada","Jornada"),
          text("localidadEstablecimiento","Localidad o paraje")
        ]},
        {title:"Cargos y situación",fields:[
          repeat("cargos","Cargo",[
            text("cargo","Cargo / horas"),
            date("fechaDesignacion","Fecha de designación"),
            text("instrumento","Instrumento"),
            select("situacionRevista","Situación de revista",["Titular","Interino","Suplente"]),
            text("turno","Turno"),
            text("asignatura","Asignatura"),
            text("codigoCargo","Código de cargo"),
            text("descripcionCargo","Descripción"),
            text("regimen","Régimen"),
            text("anio","Año",{academicPart:"year"}),
            text("division","División / sección",{academicPart:"division"}),
            text("horas","Horas cátedra"),
            text("especialidad","Especialidad"),
            text("planEstudio","Plan de estudio"),
            select("periodo","Período",["Diferenciado","Común"]),
            date("fechaBaja","Fecha de baja"),
            area("causal","Causal de la baja",{"wide":true,"legacyOnly":true,"required":false,"mnc":false})
          ],{"minRows":1,"maxRows":5,"addLabel":"Agregar cargo"})
        ]},
        {title:"Causal y firmas",fields:[
          area("causal","Causal de baja",{"wide":true}),
          text("firma","Firma del agente",{"signature":true,"mnc":false}),
          text("firmaAutoridad","Firma de autoridad",{"signature":true,"mnc":false})
        ]},
      ]
    },
    {
      id:"form-1",
      code:"N° 1",
      title:"Ingreso de datos del agente",
      catalogTitle:"Ingreso de datos del agente",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/06-FORMULARIO-N%C2%B01-Ingreso-de-Datos-del-Agente.doc",
      sensitive:true,
      notices:["Antes de completar, consultá el instructivo correspondiente. Declaro bajo juramento que la información consignada es correcta y responde a las normas legales vigentes."],
      sections:[
        {title:"Identificación y datos personales",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          date("fechaNacimiento","Fecha de nacimiento"),
          text("lugarNacimiento","Lugar de nacimiento",{"legacyOnly":true,"required":false,"mnc":false}),
          select("estadoCivil","Estado civil",["Soltero/a","Casado/a","Divorciado/a","Viudo/a","Otro"]),
          text("nacionalidad","Nacionalidad"),
          text("cuil","CUIL",{"legacyOnly":true,"required":false,"mnc":false}),
          text("cuit","CUIT",{"legacyOnly":true,"required":false,"mnc":false}),
          text("domicilio","Domicilio",{"profileId":"perfilDomicilio"}),
          text("localidad","Localidad",{"profileId":"perfilLocalidad"}),
          text("telefono","Teléfono",{"profileId":"perfilTelefonoFijo"}),
          text("correo","Correo electrónico",{"profileId":"correo","legacyOnly":true,"required":false,"mnc":false,"type":"email"}),
          select("sexo","Sexo",["F","M"],{"profileId":"sexo"}),
          select("tipoDocumento","Tipo de documento",["DNI","LC","LE"]),
          text("inscripcionDgi","Número de inscripción DGI"),
          text("inscripcionDgr","Número de inscripción DGR"),
          text("barrio","Nombre del barrio",{"profileId":"perfilBarrio"}),
          text("codigoPostal","Código postal",{"profileId":"perfilCodigoPostal"}),
          text("provincia","Provincia"),
          text("lugarPresentacion","Lugar de presentación"),
          date("fechaPresentacion","Fecha de presentación")
        ]},
        {title:"Documentación y declaración",notice:"Personal certifica la recepción, control y archivo de la documentación adjunta.",fields:[
          repeat("documentos","Documentación",[
            text("documento","Documento adjunto"),
            text("observacion","Observación")
          ],{"minRows":1,"maxRows":12,"addLabel":"Agregar documento"}),
          area("declaracion","Declaración jurada",{"wide":true,"legacyOnly":true,"required":false,"mnc":false}),
          text("firmaAgente","Firma del agente",{"signature":true,"mnc":false}),
          text("recepcion","Recepción / uso administrativo",{"legacyOnly":true,"required":false,"mnc":false})
        ]},
        {title:"Recepción y control administrativo",notice:"Para completar por las oficinas intervinientes. Las firmas y sellos se realizan sobre el documento impreso.",fields:[
          text("lugarRecepcion","Lugar de recepción"),
          text("fechaRecepcion","Fecha de recepción"),
          text("firmaRecepcion","Firma y sello del responsable de la unidad administrativa",{"signature":true,"mnc":false}),
          text("jurisdiccion","Jurisdicción"),
          text("escalafon","Escalafón"),
          text("itemNivel","Ítem / nivel"),
          text("modalidadAdministrativa","Modalidad"),
          text("oficinaAdministrativa","Oficina"),
          text("operadorCarga","Responsable de carga"),
          text("fechaCarga","Fecha de ingreso a base de datos"),
          text("fechaEnvioDgp","Fecha de recepción en DGP"),
          text("recibioDgp","Responsable de recepción en DGP")
        ]},
      ]
    },
    {
      id:"form-4",
      code:"N° 4",
      title:"Cambio de jurisdicción",
      catalogTitle:"Cambio de jurisdicción",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/09-FORMULARIO-N%C2%B04-Cambio-de-Jurisdiccion-o-habilitacion-de-alternativa.doc",
      notices:["Completá los campos identificados como obligatorios. Las firmas y sellos se realizan en el documento impreso."],
      migrations:[["apellido","agentes.0.apellido"],["nombres","agentes.0.nombres"],["dni","agentes.0.dni"],["sexo","agentes.0.sexo"],["jurisdiccionActual","agentes.0.jurisdiccionActual"],["jurisdiccionNueva","agentes.0.jurisdiccionNueva"],["jurisdiccionAlternativa","agentes.0.jurisdiccionAlternativa"]],
      sections:[
        {title:"Agentes y jurisdicciones",fields:[
          repeat("agentes","Agente",[
            text("apellido","Apellido",{"profileId":"perfilApellidos","required":true}),
            text("nombres","Nombres",{"profileId":"perfilNombres","required":true}),
            text("dni","DNI",{"profileId":"dni","required":true,"inputmode":"numeric","document":true}),
            select("sexo","Sexo",["F","M","Otro"],{"required":true}),
            text("jurisdiccionActual","Jurisdicción actual",{"required":true,"requireOneOf":["jurisdiccionNueva","jurisdiccionAlternativa"]}),
            text("jurisdiccionNueva","Nueva jurisdicción"),
            text("jurisdiccionAlternativa","Jurisdicción alternativa",{"required":false})
          ],{"minRows":1,"maxRows":50})
        ]},
        {title:"Responsable del SIP jurisdiccional",fields:[
          text("lugar","Lugar"),
          date("fecha","Fecha"),
          text("firmaResponsable","Firma y sello del responsable SIP",{"signature":true,"mnc":false}),
          text("operadorCarga","Responsable de carga en DGP"),
          date("fechaCarga","Fecha de ingreso a base de datos"),
          area("observaciones","Observaciones del borrador anterior",{"wide":true,"legacyOnly":true,"mnc":false,"required":false}),
          text("cargaSistema","Constancia del borrador anterior",{"legacyOnly":true,"mnc":false,"required":false})
        ]},
      ]
    },
    {
      id:"form-5",
      code:"N° 5",
      title:"Cambio de situación del agente",
      catalogTitle:"Cambio de situación del agente",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/10-FORMULARIO-N%C2%B05-Baja-o-Cambio-de-Situacion-del-Agente.doc",
      sensitive:true,
      notices:["A completar por personal de la unidad administrativa. Marcar una sola opción del conjunto de cambios de situación y motivos de baja."],
      sections:[
        {title:"Agente",fields:[
          text("apellido","Apellido",{"required":true,"profileId":"perfilApellidos"}),
          text("nombres","Nombres",{"required":true,"profileId":"perfilNombres"}),
          text("dni","DNI",{"required":true,"profileId":"dni","inputmode":"numeric","document":true}),
          select("situacionActual","Situación actual",["Activo/a","Jubilado/a","Pensionado/a","Otro"],{"legacyOnly":true,"required":false,"mnc":false}),
          select("causal","Causal",["Renuncia","Fallecimiento","Cesantía","Exoneración","Salud","Otra"],{"legacyOnly":true,"required":false,"mnc":false}),
          date("fechaEfectiva","Fecha efectiva",{"legacyOnly":true,"required":false,"mnc":false}),
          text("instrumento","Instrumento legal",{"legacyOnly":true,"required":false,"mnc":false}),
          select("sexo","Sexo",["F","M"],{"profileId":"sexo"}),
          select("tipoDocumento","Tipo de documento",["DNI","LC","LE"]),
          choices("opcion","Cambio de situación o motivo de baja",["Activo","Activo / jubilado","Activo / pensionado","Jubilado","Pensionado","Retirado","Otra situación","Renuncia","Fallecimiento","Cesantía","Exoneración","Prescindibilidad","Por razones de salud","Otro motivo"],{"required":true}),
          text("tipoInstrumento","Tipo de instrumento legal"),
          text("numeroInstrumento","Número de instrumento legal"),
          text("anioInstrumento","Año del instrumento legal")
        ]},
        {title:"Trámite administrativo",fields:[
          area("observaciones","Observaciones",{"wide":true,"legacyOnly":true,"required":false,"mnc":false}),
          text("firmaAgente","Firma del agente / representante",{"signature":true,"mnc":false,"legacyOnly":true,"required":false}),
          text("firmaAutoridad","Firma y sello del encargado de personal de la unidad administrativa",{"signature":true,"mnc":false}),
          text("cargaSistema","Constancia de carga en sistema",{"legacyOnly":true,"required":false,"mnc":false})
        ]},
        {title:"Recepción y control administrativo",notice:"Para completar por las oficinas intervinientes. Las firmas y sellos se realizan sobre el documento impreso.",fields:[
          text("lugarRecepcion","Lugar de presentación"),
          text("fechaRecepcion","Fecha de presentación"),
          text("jurisdiccion","Jurisdicción"),
          text("escalafon","Escalafón"),
          text("itemNivel","Ítem / nivel"),
          text("modalidadAdministrativa","Modalidad"),
          text("oficinaAdministrativa","Oficina"),
          text("operadorCarga","Responsable de carga"),
          text("fechaCarga","Fecha de ingreso a base de datos"),
          text("fechaEnvioDgp","Fecha de envío / recepción en DGP")
        ]},
      ]
    },
    {
      id:"acta-designacion",
      code:"ACTA",
      title:"Acta de designación",
      catalogTitle:"Acta de designación",
      sourceUrl:"https://dirdocumentacion.educacion.chaco.gob.ar/wp-content/uploads/2023/03/38-ACTA-DE-DESIGNACION.docx",
      notices:["Provincia del Chaco. Designación de maestros con presencia de aspirantes con o sin cargo, inscriptos o no, para suplencias o interinatos de la región durante el período lectivo, conforme a las normas vigentes. La asistencia se registra en el libro habilitado.","La planilla de cargos disponibles exhibe la totalidad de los pedidos de los establecimientos hasta la fecha y está a la vista de los aspirantes.","Se da lectura, mediante la planilla de designaciones, a todas las efectuadas en la fecha. El acto finaliza en el lugar y fecha indicados, a la hora de cierre consignada."],
      sections:[
        {title:"Acto",fields:[
          text("numero","Número de acta",{"required":true}),
          text("local","Localidad del borrador anterior",{"legacyOnly":true,"mnc":false}),
          text("localActo","Local / establecimiento donde se realiza el acto",{"required":true}),
          text("domicilio","Domicilio del acto"),
          text("departamento","Departamento"),
          date("fecha","Fecha",{"required":true}),
          text("horaInicio","Hora de inicio"),
          text("tipoDesignacion","Tipo de designación / cargos"),
          text("region","Región"),
          text("ordenInicio","Número de orden de inicio"),
          text("lista","Lista"),
          area("aclaraciones","Aclaraciones",{"wide":true})
        ]},
        {title:"Asistencia y designaciones",fields:[
          repeat("ausentes","Aspirante ausente",[
            text("numeroOrden","Número de orden"),
            text("lista","Lista")
          ],{"minRows":0,"maxRows":50,"addLabel":"Agregar aspirante ausente"}),
          area("designaciones","Designaciones realizadas / cargos",{"wide":true}),
          area("otrasAclaraciones","Aclaraciones adicionales",{"wide":true}),
          text("horaCierre","Hora de cierre")
        ]},
        {title:"Firmas",fields:[
          text("firmaAutoridad","Firma de autoridad",{"signature":true,"mnc":false}),
          text("firmaAsistentes","Firmas / constancia de asistencia",{"signature":true,"mnc":false})
        ]},
      ]
    },
  ];
  window.adcOfficialFormsData = forms;
})();
