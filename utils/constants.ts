
export const DEPENDENCIAS = ['Nacional', 'Estadal', 'Municipal', 'Privado', 'Subvencionada', 'Autónoma'];
export const NIVELES = ['Maternal', 'Preescolar', 'Primaria', 'Media General', 'Media Técnica'];
export const MODALIDADES = ['Fronterizos', 'Especial', 'Adultos', 'Intercultural'];
export const TURNOS = ['Mañana', 'Tarde', 'Integral', 'Nocturno', 'Sabatino'];
export const CARGOS = ['Administrativo', 'Docente', 'Tutor FUNDABIT', 'Cocinera', 'Aseador', 'Vigilante'];
export const TIPO_PERSONAL = ['ADMINISTRATIVO', 'DOCENTE', 'OBRERO'];
export const FUNCIONES_PERSONAL = ['ADMINISTRATIVO', 'DOCENTE', 'ASEADOR', 'COCINERO', 'VIGILANTE', 'DIRECTOR', 'SUBDIRECTOR', 'COORDINADOR', 'SUPERVISOR', 'CHOFER', 'DIRECTOR CDCEM', 'COORDINADOR CDCEM', 'SUPERVISOR CDCEM'];
export const SITUACION_TRABAJADOR = ['ACTIVO', 'ABANDONO DE CARGO', 'CAMBIO DE ACTIVIDAD', 'CLAUSULA', 'COMISION DE SERVICIO', 'DEFUNCION', 'INCAPACIDAD', 'INCAPACIDAD PARCIAL', 'JUBILACION', 'RENUNCIA', 'REPOSO CONTINUO', 'REPOSO PARCIAL', 'SANCION ADMINISTRATIVA', 'SUSPENSION', 'TRAM. INCAPACIDAD', 'TRAM. JUBILACION', 'TRASLADO'];

export const TALLAS_CAMISA = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const TALLAS_PANTALON = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
export const TIPOS_VIVIENDA = ['CASA', 'APARTAMENTO', 'QUINTA', 'RANCHO', 'ANEXO', 'HABITACIÓN'];
export const CONDICION_VIVIENDA = ['PROPIA', 'ALQUILADA', 'DE UN FAMILIAR', 'OTRO'];
export const NIVELES_INSTRUCCION = ['PRIMARIA', 'BACHILLER', 'TSU', 'LICENCIADO', 'MAGISTER', 'DOCTORADO'];

export const SUBJECTS_31059 = [
    'CASTELLANO', 'INGLES', 'MATEMATICA', 'ED. FISICA', 'ARTE Y PATRIMONIO', 
    'CIENCIAS NATURALES', 'BIOLOGIA', 'FISICA', 'QUIMICA', 'GEOGRAFIA, HISTORIA', 
    'ORIENTACION', 'G.C.R.P.'
];

export const SUBJECTS_31060 = [
    'LENGUA Y LITERATURA', 'IDIOMAS', 'MATEMATICA', 'ED. FISICA', 'BIOLOGIA/AMBIENTE', 
    'FISICA', 'QUIMICA', 'GEOGRAFIA/HISTORIA', 'ORIENTACION VOC.', 'INNOVACION TECN.', 
    'PROYECTO CIENTIFICO'
];

export const SUBJECTS_TECNICA = [
    'LENGUA Y LIT.', 'IDIOMAS', 'MATEMATICA', 'ED. FISICA', 'BIOLOGIA/AMBIENTE', 
    'FISICA', 'QUIMICA', 'GEO. HISTORIA', 'DIBUJO TECNICO', 'TALLER ESPECIFICO', 
    'TECNOLOGIA', 'PRACTICA PROF.'
];

export const SUBJECTS_TECNICA_BLANCO = [
    'ASIGNATURA 1', 'ASIGNATURA 2', 'ASIGNATURA 3', 'ASIGNATURA 4', 
    'COMPONENTE TEC. 1', 'COMPONENTE TEC. 2', 'COMPONENTE TEC. 3', 
    'TALLER / LAB', 'PROYECTO', 'PASANTIAS'
];

export const MATERIAS_COMUNES = ['Matemática', 'Física', 'Química', 'Biología', 'Castellano', 'Inglés', 'Geografía, Historia y Ciudadanía', 'Educación Física', 'Arte y Patrimonio', 'Ciencias Naturales', 'Orientación y Convivencia', 'Grupos de Creación', 'Integral (Primaria)'];

export const EJES_CONSOLIDACION_OPCIONES = [
    { value: 'EJE_INICIAL_PRIMARIA', label: 'Hoja 1: Maternal, Inicial, Primaria' }, 
    { value: 'EJE_ESPECIAL', label: 'Hoja 2: Educación Especial (Formato Único)' }, 
    { value: 'EJE_MEDIA_31059', label: 'Hoja 4: Plan 31059 (Media General)' }, 
    { value: 'EJE_MEDIA_31060', label: 'Hoja 3: Plan 31060 (Ciencia y Tecnología)' }, 
    { value: 'EJE_TECNICA', label: 'Plan de Estudio Técnica Profesional' }, 
    { value: 'EJE_ADULTOS', label: 'Hoja 5: Adultos' }
];

export const CUADRATURA_IP_CONFIG = [
    { label: 'MATERNAL', key: 'MAT', subs: ['G1', 'G2', 'G3', 'G4'] },
    { label: 'INICIAL', key: 'INI', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '1ER GRADO', key: '1G', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '2DO GRADO', key: '2G', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '3ER GRADO', key: '3G', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '4TO GRADO', key: '4G', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '5TO GRADO', key: '5G', subs: ['A', 'B', 'C', 'D', 'E'] },
    { label: '6TO GRADO', key: '6G', subs: ['A', 'B', 'C', 'D', 'E'] }
];

export const CUADRATURA_ESPECIAL_COLUMNS = [
    'GRUPO 1', 'GRUPO 2', 'GRUPO 3', 'GRUPO 4', 'GRUPO 5', 'GRUPO 6',
    'GRUPO 7', 'GRUPO 8', 'GRUPO 9', 'GRUPO 10', 'GRUPO 11', 'GRUPO 12'
];

export const ADULTOS_PERIODOS_ESTANDAR = [
    { label: '1ER PERIODO', key: 'P1', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
    { label: '2DO PERIODO', key: 'P2', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
    { label: '3ER PERIODO', key: 'P3', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'QUIMICA', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
    { label: '4TO PERIODO', key: 'P4', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'QUIMICA', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
    { label: '5TO PERIODO', key: 'P5', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'QUIMICA', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
    { label: '6TO PERIODO', key: 'P6', subjects: ['LENGUA Y COMUNICACION', 'IDIOMAS', 'MATEMATICA', 'CIENCIAS BIOLOGICAS', 'QUIMICA', 'GEO-HIST-CIUD.', 'ORIENTACION Y CONVIVENCI.'] },
];

export const ADULTOS_PERIODOS_BLANCO = [
    { label: '1ER PERIODO', key: 'P1', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
    { label: '2DO PERIODO', key: 'P2', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
    { label: '3ER PERIODO', key: 'P3', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
    { label: '4TO PERIODO', key: 'P4', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
    { label: '5TO PERIODO', key: 'P5', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
    { label: '6TO PERIODO', key: 'P6', subjects: Array.from({length: 8}, (_, i) => `OPCION ${i+1}`) },
];

export const TIPOS_ESPACIOS = [{ key: 'oficinas', label: 'Oficinas Administrativas' }, { key: 'pasillos', label: 'Pasillos' }, { key: 'salones', label: 'Salones de Clase' }, { key: 'depositos', label: 'Depósitos' }, { key: 'cocina', label: 'Cocina / Comedor' }, { key: 'patio', label: 'Patio Central' }, { key: 'plazoleta', label: 'Plazoleta' }, { key: 'jardines', label: 'Jardines / Áreas Verdes' }, { key: 'cancha', label: 'Cancha Deportiva' }, { key: 'banos', label: 'Baños' }, { key: 'multiuso', label: 'Espacio de Usos Múltiples' }, { key: 'estacionamiento', label: 'Estacionamiento' }, { key: 'cbit', label: 'CBIT / Sala Telemática' }, { key: 'anfiteatro', label: 'Anfiteatro / Auditorio' }, { key: 'biblioteca', label: 'Biblioteca' }];
export const PROVEEDORES_INTERNET = ['CANTV', 'ON-LINK', 'FIBEX', 'TECNO NET', 'UP LINK', 'MAS PLANET', 'MULTICANAL', 'VNET', 'SATELCA', 'LG TELECOM', 'OTRO'];
export const TIPOS_CONEXION = ['ABA CANTV', 'FIBRA CANTV', 'FIBRA OPTICA', 'SATELITAL', 'INALAMBRICA', 'OTRO'];
export const STATUS_CONEXION = ['Activa', 'Averia', 'Solicitud', 'OTRO'];
export const ZONAS_UBICACION = ['URBANA', 'RURAL', 'DIFICIL ACCESO', 'INSULAR', 'INDIGENA', 'FRONTERA'];
export const VIAS_ACCESO = ['Terrestre', 'Fluvial', 'Aereo', 'Maritimo'];

export const UTENSILIOS_COCINA = ['Ollas Grandes', 'Sartenes', 'Cubiertos', 'Platos', 'Vasos', 'Bandejas', 'Cuchillos', 'Otras herramientas'];
export const ARTEFACTOS_ELECTRICOS = ['Nevera', 'Congelador', 'Cocina Industrial', 'Licuadora Industrial', 'Reverbero', 'Microondas', 'Horno'];
export const TIPOS_ALIMENTO = ['Seco', 'Proteína', 'Verduras/Hortalizas'];
export const CONDICION_USO = ['Apto', 'Por Vencer', 'No Apto', 'Bueno', 'Regular', 'Malo', 'Operativo', 'No Operativo'];
export const CONDICION_BIEN = ['BUENO', 'REGULAR', 'MALO', 'DESINCORPORAR', 'FALTANTE', 'EN REPARACION'];

export const TIPOS_ESTRUCTURA = ['EDIFICACIÓN VERTICAL', 'EDIFICACIÓN HORIZONTAL', 'RURAL', 'MÓDULO'];
export const ESTADO_INFRAESTRUCTURA = ['BUENO', 'REGULAR', 'MALO', 'CRITICO'];
export const SERVICIOS_AGUA = ['DIRECTA (TUBERÍA)', 'CISTERNA', 'POZO PROFUNDO', 'NO POSEE'];
export const SERVICIOS_ELECTRICIDAD = ['ESTABLE', 'INESTABLE', 'SIN SERVICIO', 'PLANTA ELÉCTRICA'];
export const SERVICIOS_AGUAS_SERVIDAS = ['RED DE CLOACAS', 'POZO SÉPTICO', 'SIN SERVICIO'];
export const SERVICIOS_GAS = ['BOMBONA (CILINDRO)', 'GAS DIRECTO', 'BOMBONA INDUSTRIAL'];
export const ESTATUS_SOLICITUD = ['Sin Solicitud', 'Enviada', 'Aprobada', 'En Ejecución', 'Culminada'];
export const ESTATUS_OBRA = ['No Iniciada', 'En Ejecución', 'Paralizada', 'Culminada'];

export const MATERIAS_NECESIDAD_MG = SUBJECTS_31059;
export const MATERIAS_NECESIDAD_MT_BASICA = SUBJECTS_31060;
export const MATERIAS_NECESIDAD_CT_31060 = SUBJECTS_TECNICA;

export const GEOGRAFIA_VENEZUELA: Record<string, Record<string, string[]>> = {
  "ANZOATEGUI": {
    "ANACO": ["ANACO", "SAN JOAQUIN"],
    "ARAGUA": ["ARAGUA DE BARCELONA", "CACHIPO"],
    "FERNANDO DE PEÑALVER": ["PUERTO PIRITU", "SAN MIGUEL", "SUCRE"],
    "FRANCISCO DE MIRANDA": ["ATAPIRIRE", "BOCA DE PAO", "EL PAO DE BARCELONA", "PARIAGUAN"],
    "FRANCISCO DEL CARMEN CARVAJAL": ["SANTA BARBARA", "VALLE DE GUANAPE"],
    "GUANIPA": ["SAN JOSE DE GUANIPA"],
    "GUANTA": ["GUANTA", "CHORRERON"],
    "INDEPENDENCIA": ["MAMO", "SOLEDAD"],
    "JOSE GREGORIO MONAGAS": ["MAPIRE", "PIAR", "SAN DIEGO DE CABRUTICA", "SANTA CLARA", "UVERITO", "ZUATA"],
    "JUAN ANTONIO SOTILLO": ["POZUELOS", "PUERTO LA CRUZ"],
    "JUAN MANUEL CAJIGAL": ["ONOTO", "SAN PABLO"],
    "LIBERTAD": ["EL CARITO", "SAN MATEO", "SANTA INES"],
    "MANUEL EZEQUIEL BRUZUAL": ["CLARINES", "GUANAPE", "SABANA DE UCHIRE"],
    "PEDRO MARIA FREITES": ["CANTAURA", "SAN TOME", "LIBERTADOR", "SANTA ROSA", "URICA"],
    "PIRITU": ["SAN FRANCISCO", "PIRITU"],
    "SAN JUAN DE CAPISTRANO": ["BOCA DE CHAVEZ", "BOCA DE UCHIRE"],
    "SANTA ANA": ["PUEBLO NUEVO", "SANTA ANA"],
    "SIMON BOLIVAR": ["BERGANTIN", "CAIGUA", "EL CARMEN", "EL PILAR", "NARICUAL", "SAN CRISTOBAL"],
    "SIMON RODRIGUEZ": ["EDMUNDO BARRIOS", "MIGUEL OTERO SILVA"],
    "SIR ARTHUR MAC GREGOR": ["EL CHAPARRO", "TOMAS ALFARO CALATRAVA"],
    "URBANEJA": ["LECHERIA"]
  }
};

export const MUNICIPIOS_ANZOATEGUI = GEOGRAFIA_VENEZUELA["ANZOATEGUI"];
