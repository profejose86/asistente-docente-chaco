// Configuración de documentos originales y coordenadas de sus controles.
// Solo los formularios registrados aquí utilizan este modo; los demás conservan su implementación.
window.adcPreparedPdfForms = Object.freeze({
  'traslado-inicial': Object.freeze({
    sha256:'cff4245d9e29aa52141b70c95e0ee7a80e1fc42284afae99d9c7256a99afd5b4',
    pdf:'assets/formularios/Traslado-Transitorio.pdf',
    pages:[1,2].map(page=>({image:`assets/formularios/Traslado-Transitorio-pagina-${page}.png`,width:595,height:842})),
    stage:'editable',fullScreen:true,
    source:'assets/formularios/Traslado-Transitorio.pdf',sourceLabel:'Ver PDF original de Solicitud de Traslado Transitorio',
    note:'PDF aportado por el usuario, conservado en sus dos páginas. Los informes y firmas corresponden a sus responsables. Podés ampliar el documento a pantalla completa.',
    fields:{
      apellido:{x:247,top:102,width:125,height:10,fontSize:9},nombres:{x:374,top:102,width:131,height:10,fontSize:9},
      estadoCivil:{x:185,top:113,width:128,height:11,fontSize:9},dni:{x:352,top:113,width:153,height:11,fontSize:9},
      domicilio:{x:173,top:126,width:196,height:11,fontSize:9},telefono:{x:400,top:126,width:105,height:11,fontSize:9},
      localidad:{x:178,top:139,width:186,height:10,fontSize:9},codigoPostal:{x:405,top:138,width:100,height:11,fontSize:9},
      titulo:{x:247,top:151,width:258,height:11,fontSize:9},
      titularNumero:{x:223,top:251,width:163,height:11,fontSize:9},titularCategoria:{x:426,top:251,width:20,height:11,fontSize:8},titularGrupo:{x:480,top:251,width:25,height:11,fontSize:8},
      titularDireccion:{x:175,top:264,width:160,height:11,fontSize:9},titularLocalidad:{x:391,top:263,width:114,height:11,fontSize:9},
      titularCargo:{x:161,top:277,width:344,height:11,fontSize:9},titularAntiguedad:{x:236,top:290,width:111,height:11,fontSize:9},
      titularIngreso:{x:445,top:289,width:60,height:11,fontSize:8,dateFormat:'dmy'},
      actualNumero:{x:225,top:339,width:142,height:11,fontSize:9},actualCategoria:{x:409,top:339,width:29,height:11,fontSize:8},actualGrupo:{x:480,top:338,width:25,height:11,fontSize:8},
      actualDireccion:{x:178,top:352,width:127,height:11,fontSize:9},actualLocalidad:{x:364,top:351,width:141,height:11,fontSize:9},
      distancia:{x:245,top:365,width:260,height:11,fontSize:9},transporte:{x:239,top:378,width:266,height:12,fontSize:9},
      fechaTraslado:{x:218,top:391,width:287,height:11,fontSize:9,dateFormat:'dmy'},
      licenciasRecientes:{x:120,top:416,width:384,height:13,fontSize:9,multiline:true},
      otrosCargos:{x:111,top:465,width:394,height:20,fontSize:9,multiline:true},
      solicitadoNumero:{x:223,top:517,width:124,height:11,fontSize:9},solicitadoCategoria:{x:382,top:517,width:23,height:11,fontSize:8},solicitadoGrupo:{x:447,top:517,width:56,height:11,fontSize:8},
      solicitadoDireccion:{x:177,top:531,width:126,height:11,fontSize:9},solicitadoLocalidad:{x:359,top:529,width:144,height:11,fontSize:9},
      solicitadoCausa:{x:160,top:544,width:343,height:11,fontSize:9},solicitadoDistancia:{x:239,top:557,width:264,height:11,fontSize:9},solicitadoTransporte:{x:237,top:570,width:266,height:11,fontSize:9},
      trasladosAnteriores:{x:157,top:641,width:345,height:11,fontSize:9},
      tareasAdministrativas:{x:312,top:654,width:19,height:11,fontSize:7.5},
      tareasDesde:{x:368,top:654,width:51,height:11,fontSize:8,dateFormat:'dmy'},tareasHasta:{x:455,top:653,width:49,height:11,fontSize:8,dateFormat:'dmy'},
      concursoNumero:{x:183,top:721,width:174,height:11,fontSize:9},concursoResolucion:{x:438,top:720,width:65,height:11,fontSize:9},concursoEfectivizacion:{x:237,top:734,width:127,height:11,fontSize:9,dateFormat:'dmy'},
      saludSolicitante:{page:1,x:120,top:80,width:370,height:32,options:[{value:'Del agente',x:120,top:81},{value:'Del cónyuge',x:120,top:92},{value:'De familiares consanguíneos de primer grado',x:120,top:103}]},
      certificadoMedico:{page:1,x:281,top:123,width:197,height:11,fontSize:9},duracionTratamiento:{page:1,x:260,top:135,width:218,height:11,fontSize:9},antiguedadAfeccion:{page:1,x:262,top:147,width:216,height:11,fontSize:9},
      conyugeNombre:{page:1,x:284,top:192,width:195,height:11,fontSize:9},conyugeOrganismo:{page:1,x:290,top:204,width:189,height:11,fontSize:9},
      conyugeDomicilioAnterior:{page:1,x:228,top:216,width:113,height:11,fontSize:9},conyugeLocalidadAnterior:{page:1,x:399,top:214,width:80,height:11,fontSize:9},
      conyugeLocalidadDestino:{page:1,x:288,top:227,width:191,height:11,fontSize:9},conyugeCausa:{page:1,x:181,top:239,width:144,height:10,fontSize:9},conyugeFechaTraslado:{page:1,x:415,top:238,width:65,height:10,fontSize:8,dateFormat:'dmy'},
      otrasCausas:{page:1,x:132,top:273,width:350,height:22,fontSize:9,multiline:true},
      lugarFirma:{page:1,x:134,top:374,width:75,height:10,fontSize:8},fechaFirma:{page:1,x:210,top:374,width:62,height:10,fontSize:8,dateFormat:'dmy'},firma:{page:1,x:362,top:369,width:124,height:12,fontSize:9},
      directorInforme:{page:1,x:133,top:445,width:353,height:22,fontSize:9,multiline:true},directorLugar:{page:1,x:135,top:500,width:77,height:10,fontSize:8},directorFecha:{page:1,x:213,top:500,width:59,height:10,fontSize:8,dateFormat:'dmy'},firmadirector:{page:1,x:396,top:497,width:81,height:11,fontSize:9},
      supervisorInforme:{page:1,x:132,top:558,width:354,height:22,fontSize:9,multiline:true},supervisorLugar:{page:1,x:133,top:614,width:79,height:10,fontSize:8},supervisorFecha:{page:1,x:213,top:614,width:62,height:10,fontSize:8,dateFormat:'dmy'},firmasupervisor:{page:1,x:353,top:612,width:127,height:11,fontSize:9},
      regionalInforme:{page:1,x:133,top:673,width:353,height:20,fontSize:9,multiline:true},regionalLugar:{page:1,x:132,top:717,width:79,height:10,fontSize:8},regionalFecha:{page:1,x:213,top:717,width:62,height:10,fontSize:8,dateFormat:'dmy'},firmaregional:{page:1,x:351,top:714,width:129,height:12,fontSize:9}
    }
  }),
  cf01: Object.freeze({
    sha256:'43b0685c984aa8a381d243ec3a47f1867bb58a89bfa44922d0e9b8cb44600a22',
    pdf:'assets/formularios/CF-01.pdf',
    pages:[{image:'assets/formularios/CF-01-pagina-1.png',width:612,height:1008}],
    stage:'editable',source:'assets/formularios/CF-01.pdf',sourceLabel:'Ver PDF original de CF-01',
    draftDates:['fechaNotificacion'],
    note:'PDF aportado por el usuario. Tres establecimientos con tres cargos cada uno. El Anexo IV es un documento separado; las firmas corresponden a sus responsables.',
    repeats:{funciones:{slots:3,label:'Organizar establecimientos (3 bloques del PDF)',rowLabel:'Establecimiento'}},
    fields:{
      organismoSolicitante:{x:168,top:124,width:408,height:13,fontSize:11},
      apellido:{x:204,top:153,width:160,height:13,fontSize:11},
      nombres:{x:367,top:153,width:210,height:13,fontSize:11},
      genero:{x:456,top:174,width:119,height:13,fontSize:11},
      cuil:{x:78,top:195,width:233,height:13,fontSize:11},
      telefono:{x:419,top:195,width:154,height:13,fontSize:11},
      domicilio:{x:92,top:215,width:481,height:13,fontSize:11},
      ...Object.fromEntries(Array.from({length:50},(_,index)=>{
        const offset=[0,181.4,362.6][index]||0;
        const settings={
          numeroUE:{x:77,top:260,width:42,height:13},
          categoria:{x:191,top:260,width:154,height:13},
          zona:{x:393,top:260,width:71,height:13},
          jornada:{x:533,top:260,width:53,height:13},
          nivel:{x:123,top:277,width:222,height:13},
          modalidad:{x:123,top:293,width:222,height:13},
          establecimiento:{x:123,top:309,width:222,height:13},
          especialidad:{x:123,top:325,width:222,height:13},
          localidad:{x:440,top:279,width:145,height:13},
          firmaDirector:{x:375,top:312,width:194,height:14}
        };
        for(let row=0;row<3;row++){
          const suffix=row?String(row+1):'',top=[382,399.6,416.7][row];
          Object.assign(settings,{
            ['denominacionCargo'+suffix]:{x:39,top,width:121,height:14,fontSize:9},
            ['situacionRevista'+suffix]:{x:164,top,width:97,height:14,options:[{value:'Titular',x:176,top:top+2},{value:'Interino',x:210,top:top+2},{value:'Suplente',x:242,top:top+2}]},
            ['asignatura'+suffix]:{x:265,top,width:81,height:14,fontSize:9},
            ['anio'+suffix]:{x:350,top,width:63,height:14,fontSize:9},
            ['division'+suffix]:{x:418,top,width:48,height:14,fontSize:9},
            ['turno'+suffix]:{x:471,top,width:52,height:14,fontSize:9},
            ['horasCatedra'+suffix]:{x:529,top,width:57,height:14,fontSize:9}
          });
        }
        // Compatibilidad: no ocultar datos de filas antiguas ni casilleros sin equivalente.
        for(const key of ['codigoOficina','codigoAnexo','nombre'])settings[key]={overflow:true};
        return Object.entries(settings).map(([key,box],fieldIndex)=>[
          `funciones.${index}.${key}`,
          index<3&&!box.overflow?{fontSize:11,...box,top:box.top+offset,options:box.options?.map(option=>({...option,top:option.top+offset}))}:
            {x:40+(fieldIndex%2)*278,top:1040+index*650+Math.floor(fieldIndex/2)*36,width:266,height:25,fontSize:10,overflow:true,
              overflowMessage:index<3?'el borrador conserva este dato, pero el PDF no tiene un casillero equivalente. Revisalo antes de exportar.':undefined}
        ]);
      }).flat()),
      periodoDesde:{x:305,top:797,width:82,height:14,fontSize:10,dateParts:[{x:305,width:23},{x:334,width:21},{x:362,width:25}]},
      periodoHasta:{x:425,top:797,width:85,height:14,fontSize:10,dateParts:[{x:425,width:23},{x:455,width:21},{x:483,width:27}]},
      funcionesAreas:{x:165,top:842,width:414,height:35,fontSize:11,multiline:true},
      fechaNotificacion:{x:70,top:888,width:65,height:13,fontSize:9,dateParts:[{x:70,width:12},{x:87,width:13},{x:107,width:28}]},
      firmaOrganismo:{x:83,top:944,width:157,height:18,fontSize:10},
      conformidadDocente:{x:394,top:944,width:157,height:18,fontSize:10}
    }
  }),
  sr01: Object.freeze({
    pdf:'assets/formularios/SR-01.pdf',
    pages:[{image:'assets/formularios/SR-01-pagina-1.png',width:612,height:1008}],
    stage:'editable',
    sha256:'ec47028ba244717fdf2cc996c08d8fd386261ba2d929d7c320493ce1cb806f54',
    source:'assets/formularios/SR-01.pdf',
    sourceLabel:'Ver PDF original de SR-01',
    institutionField:'reparticion',
    note:'PDF aportado por el usuario. Nueve columnas de licencias; la respuesta y las firmas corresponden a sus responsables.',
    repeats:{licenciasPrevias:{slots:9}},
    fields:{
      reparticion:{x:159,top:140,width:367,height:14,fontSize:10,institution:'name'},
      lugar:{x:333,top:161,width:104,height:14,fontSize:10},
      fecha:{x:441,top:161,width:85,height:14,fontSize:10,dateFormat:'dmy'},
      establecimientoSanitario:{x:332,top:225,width:194,height:14,fontSize:10},
      apellido:{x:126,top:290,width:124,height:14,fontSize:10},
      nombres:{x:251,top:290,width:126,height:14,fontSize:10},
      dni:{x:419,top:290,width:104,height:14,fontSize:10},
      domicilio:{x:163,top:312,width:361,height:14,fontSize:10},
      zonaResidencia:{x:284,top:333,width:241,height:14,fontSize:10},
      revista:{x:211,top:348,width:209,height:18,options:[{value:'Titular',x:214,top:352},{value:'Interino',x:306,top:352},{value:'Suplente',x:406,top:351}]},
      inasistenciaDesde:{x:172,top:376,width:213,height:14,fontSize:10,dateFormat:'dmy'},
      tipoConsulta:{x:72,top:398,width:230,height:57,options:[{value:'Consultorio',x:295,top:401},{value:'Domicilio / internación',x:73,top:423},{value:'Fuera del lugar de residencia',x:73,top:444}]},
      consultorio:{x:448,top:398,width:78,height:14,fontSize:10},
      lugarConsulta:{x:230,top:419,width:296,height:14,fontSize:10},
      lugarFueraResidencia:{x:277,top:441,width:248,height:14,fontSize:10},
      familiarNombre:{x:283,top:462,width:241,height:14,fontSize:10},
      familiarParentesco:{x:323,top:484,width:201,height:14,fontSize:10},
      familiarLugar:{x:295,top:505,width:228,height:14,fontSize:10},
      ...Object.fromEntries([147.35,188.55,231.25,274.3,319.55,363.9,405.95,448.85,492.55].flatMap((x,index)=>{
        const right=[188.55,231.25,274.3,319.55,363.9,405.95,448.85,492.55,535.6][index];
        return [[`licenciasPrevias.${index}.dias`,{x:x+1,top:572,width:right-x-2,height:15,fontSize:10}],
          [`licenciasPrevias.${index}.motivo`,{x:x+1,top:590,width:right-x-2,height:21,fontSize:8.5,multiline:true}]];
      })),
      ...Object.fromEntries([9,10,11].flatMap(index=>[
        [`licenciasPrevias.${index}.dias`,{x:85,top:1040+(index-9)*52,width:65,height:18,fontSize:10,overflow:true}],
        [`licenciasPrevias.${index}.motivo`,{x:170,top:1040+(index-9)*52,width:350,height:26,fontSize:10,multiline:true,overflow:true}]
      ])),
      firmaSolicitante:{x:383,top:635,width:139,height:17,fontSize:10},
      establecimientoRespuesta:{x:252,top:685,width:274,height:14,fontSize:10},
      lugarRespuesta:{x:325,top:718,width:112,height:14,fontSize:10},
      fechaExamen:{x:441,top:718,width:85,height:14,fontSize:10},
      examenRealizado:{x:398,top:754,width:52,height:16,options:[{value:'Sí',x:401,top:757},{value:'No',x:436,top:757}]},
      examinado:{x:204,top:783,width:150,height:14,fontSize:10},
      documentoExaminado:{x:392,top:783,width:128,height:14,fontSize:10},
      licenciaJustificada:{x:93,top:802,width:54,height:12,options:[{value:'Sí',x:94,top:802,width:10,height:12,marker:'underline'},{value:'No',x:134,top:802,width:15,height:12,marker:'underline'}]},
      motivoJustificacion:{x:280,top:801,width:110,height:14,fontSize:10},
      licenciaDesde:{x:431,top:801,width:94,height:14,fontSize:10,dateFormat:'dmy'},
      licenciaHasta:{x:121,top:818,width:141,height:14,fontSize:10,dateFormat:'dmy'},
      diasCorridos:{x:279,top:818,width:180,height:14,fontSize:10},
      noJustificada:{x:196,top:835,width:330,height:14,fontSize:10},
      noJustificadaContinuacion:{x:86,top:853,width:439,height:14,fontSize:10},
      firmaMedico:{x:348,top:886,width:174,height:17,fontSize:10}
    }
  }),
  dp01: Object.freeze({
    pdf: 'assets/formularios/DP-01.pdf',
    pages: [{ image: 'assets/formularios/DP-01-pagina-1.png', width: 612, height: 1008 }],
    source: 'https://drive.google.com/drive/folders/1AZpunmuWaPrB-qXgHyaaCjGGRwAEqSy3',
    sha256: '88d14c87d6de22b1caf0dc17281f0737e5de6ebfc8dca927c48f145f894024a8',
    note: 'Se autorizó reemplazar únicamente el año 2009 impreso en Desde. El PDF original se conserva intacto; el año editable se agrega en la vista y en la copia completada.',
    stage: 'editable',
    fields: {
      situacion: {x:95,top:103,width:90,height:42,options:[{value:'Interino',x:99,top:104},{value:'Suplente',x:176,top:104},{value:'Titular',x:99,top:133}]},
      selloRegional: {x:174,top:34,width:216,height:32},
      numeroDisposicion: {x:418,top:108,width:133,height:13,fontSize:10},
      fechaAltaDesde: {x:331,top:131,width:124,height:12,fontSize:10,dateParts:[{x:332,width:21},{x:358,width:21},{x:402,width:34}],printedYear:2009,replacePrintedYear:{x:403.94,top:131.8,width:22.2,height:10.7}},
      fechaAltaHasta: {x:498,top:131,width:74,height:12,fontSize:9,dateParts:[{x:498,width:16},{x:520,width:19},{x:549,width:24}]},
      apellido: {x:279,top:163,width:304,height:14},
      nombres: {x:112,top:184,width:471,height:14},
      dni: {x:99,top:205,width:300,height:14},
      sexo: {x:459,top:205,width:47,height:13,options:[{value:'F',x:461,top:207},{value:'M',x:496,top:207}]},
      codigoOficina: {x:156,top:225,width:215,height:14,institution:'office'},
      codigoAnexo: {x:76,top:246,width:127,height:14,institution:'anexo'},
      establecimiento: {x:159,top:267,width:183,height:13,institution:'name'},
      nivel: {x:441,top:267,width:65,height:13,institution:'level'},
      modalidad: {x:510,top:267,width:70,height:13,institution:'modalidad'},
      categoria: {x:113,top:295,width:125,height:14},
      zona: {x:277,top:295,width:78,height:14},
      jornada: {x:411,top:295,width:171,height:14},
      localidad: {x:159,top:316,width:424,height:14,institution:'localidad'},
      codigoCargo: {x:158,top:347,width:99,height:14},
      descripcionCargo: {x:331,top:347,width:251,height:14},
      anio: {x:71,top:367,width:43,height:14},
      division: {x:229,top:367,width:98,height:14},
      turno: {x:376,top:367,width:74,height:14},
      horas: {x:532,top:367,width:42,height:14},
      especialidad: {x:117,top:387,width:264,height:14},
      planEstudio: {x:479,top:387,width:96,height:14},
      asignatura: {x:107,top:407,width:468,height:14},
      codigoMotivo: {x:133,top:455,width:58,height:12,digits:5,fontSize:10},
      descripcionMotivo: {x:280,top:455,width:300,height:30,fontSize:11},
      instrumento: {x:214,top:495,width:366,height:14},
      reemplazadoDni: {x:70,top:542,width:182,height:14},
      reemplazadoSexo: {x:307,top:542,width:45,height:13,options:[{value:'F',x:308,top:545},{value:'M',x:340,top:545}]},
      reemplazadoApellido: {x:92,top:562,width:224,height:14},
      reemplazadoNombres: {x:376,top:562,width:203,height:14},
      reemplazadoCodigoMotivo: {x:152,top:582,width:55,height:12,digits:5,fontSize:10},
      reemplazadoDescripcionMotivo: {x:284,top:582,width:291,height:14},
      reemplazadoInstrumento: {x:158,top:602,width:169,height:14},
      observaciones: {x:139,top:665,width:441,height:51,fontSize:11,multiline:true},
      firmaDirector: {x:341,top:752,width:211,height:24,fontSize:11},
      fechaPresentacion: {x:90,top:822,width:108,height:16,fontSize:11,dateParts:[{x:90,width:25},{x:124,width:25},{x:157,width:39}]},
      firmaAgente: {x:341,top:811,width:120,height:24,fontSize:11},
      notificacion: {x:172,top:885,width:158,height:14},
      aclaracion: {x:341,top:885,width:212,height:14}
    }
  })
});
