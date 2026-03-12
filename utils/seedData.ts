
import { Plantel, MatriculaRegistro, PersonalRegistro, RacRegistro, CnaeRegistro, BienesRegistro, CuadraturaRegistro, FundabitRegistro, FedeRegistro, User } from '../types';

// IDs FIJOS PARA RELACIONES
const ID_P1 = "plantel-001";
const ID_P2 = "plantel-002";
const ID_P3 = "plantel-003";

export const SEED_PLANTELES: Plantel[] = [
  {
    id: ID_P1,
    codigoDea: "OD01234567",
    codigoDependencia: "DEP-001",
    nombre: "U.E.N. FRANCISCO DE MIRANDA",
    dependencia: "Nacional",
    estado: "ANZOATEGUI",
    municipio: "SIMON BOLIVAR",
    parroquia: "EL CARMEN",
    direccion: "AV. FUERZAS ARMADAS, EDIF. CENTRAL",
    codigoEstadistico: "102345",
    latitud: "10.1345",
    longitud: "-64.6854",
    fechaRegistro: "2024-01-15",
    director: "MARIA RODRIGUEZ",
    ciDirector: "V-15234876",
    telefono: "0414-1234567",
    emailDirector: "MIRANDA.DIR@CORREO.COM",
    niveles: ["Media General", "Media Técnica"],
    modalidades: ["Fronterizos"],
    turnos: ["Integral"],
    espaciosFisicos: { oficinas: 2, pasillos: 4, salones: 12, depositos: 1, cocina: 1, patio: 1, plazoleta: 1, jardines: 2, cancha: 1, banos: 4, multiuso: 1, estacionamiento: 1, cbit: 1, anfiteatro: 0, biblioteca: 1 },
    conectividad: { 
      tieneInternet: true, 
      conexion1: { 
        proveedor: "CANTV", 
        tipoConexion: "FIBRA OPTICA", 
        status: "Activa", 
        fechaInstalacion: "2023-05-10" 
      } 
    }
  },
  {
    id: ID_P2,
    codigoDea: "OD09876543",
    codigoDependencia: "DEP-002",
    nombre: "E.B.B. ANZOÁTEGUI",
    dependencia: "Estadal",
    estado: "ANZOATEGUI",
    municipio: "JUAN ANTONIO SOTILLO",
    parroquia: "PUERTO LA CRUZ",
    direccion: "SECTOR SIERRA MAESTRA, CALLE 5",
    codigoEstadistico: "205678",
    latitud: "10.2134",
    longitud: "-64.6212",
    fechaRegistro: "2024-02-01",
    director: "JUAN PEREZ",
    ciDirector: "V-12345678",
    telefono: "0412-9876543",
    emailDirector: "ANZOATEGUI.SCHOOL@CORREO.COM",
    niveles: ["Primaria"],
    modalidades: ["Intercultural"],
    turnos: ["Mañana", "Tarde"],
    espaciosFisicos: { oficinas: 1, pasillos: 2, salones: 8, depositos: 2, cocina: 1, patio: 1, plazoleta: 0, jardines: 1, cancha: 0, banos: 2, multiuso: 0, estacionamiento: 0, cbit: 0, anfiteatro: 0, biblioteca: 1 },
    conectividad: { 
      tieneInternet: false, 
      conexion1: { 
        proveedor: "", 
        tipoConexion: "", 
        status: "", 
        fechaInstalacion: "" 
      } 
    }
  },
  {
    id: ID_P3,
    codigoDea: "OD11223344",
    codigoDependencia: "DEP-003",
    nombre: "I.E.E. BARCELONA",
    dependencia: "Nacional",
    estado: "ANZOATEGUI",
    municipio: "SIMON BOLIVAR",
    parroquia: "SAN CRISTOBAL",
    direccion: "URB. TRONCONAL III, SECTOR 2",
    codigoEstadistico: "301122",
    latitud: "10.1456",
    longitud: "-64.6789",
    fechaRegistro: "2024-03-10",
    director: "EDA GUERRA",
    ciDirector: "V-13258774",
    telefono: "0416-5554433",
    emailDirector: "IEE.BARCELONA@CORREO.COM",
    niveles: ["Especial"],
    modalidades: ["Especial"],
    turnos: ["Integral"],
    espaciosFisicos: { oficinas: 3, pasillos: 3, salones: 6, depositos: 1, cocina: 1, patio: 1, plazoleta: 1, jardines: 3, cancha: 1, banos: 3, multiuso: 2, estacionamiento: 1, cbit: 0, anfiteatro: 1, biblioteca: 1 },
    conectividad: { 
      tieneInternet: true, 
      conexion1: { 
        proveedor: "VNET", 
        tipoConexion: "INALAMBRICA", 
        status: "Activa", 
        fechaInstalacion: "2024-01-20" 
      } 
    }
  }
];

export const SEED_MATRICULA: MatriculaRegistro[] = [
  { id: "m-001", plantelId: ID_P1, periodo: "2024-2025", nivel: "Media General", inscriptosFemenino: 120, inscriptosMasculino: 110, asistentesFemenino: 115, asistentesMasculino: 105, cantidadSecciones: 8, fechaCarga: "2024-10-01", responsableNombre: "ADMIN", responsableCi: "0", responsableCargo: "ROOT", responsableTelefono: "0" },
  { id: "m-002", plantelId: ID_P2, periodo: "2024-2025", nivel: "Primaria", inscriptosFemenino: 85, inscriptosMasculino: 90, asistentesFemenino: 80, asistentesMasculino: 88, cantidadSecciones: 6, fechaCarga: "2024-10-02", responsableNombre: "ADMIN", responsableCi: "0", responsableCargo: "ROOT", responsableTelefono: "0" },
  { id: "m-003", plantelId: ID_P3, periodo: "2024-2025", nivel: "Especial", inscriptosFemenino: 45, inscriptosMasculino: 38, asistentesFemenino: 40, asistentesMasculino: 35, cantidadSecciones: 4, fechaCarga: "2024-10-03", responsableNombre: "ADMIN", responsableCi: "0", responsableCargo: "ROOT", responsableTelefono: "0" }
];

export const SEED_RAC: RacRegistro[] = [
  {
    id: "rac-001",
    plantelId: ID_P1,
    fechaCarga: "2024-10-01",
    cedula: "V-13284772",
    nombreApellido: "YRLENG VEGA",
    sex: "M",
    fechaIngreso: "2010-09-16",
    codCargo: "0065",
    clasificacion: "DOCENTE IV",
    tipoPersonal: "DOCENTE",
    funcion: "DOCENTE",
    numGoPc: "G.O. 40.000",
    cargaHorariaRecibo: 36,
    horasAcademicas: 36,
    horasAdm: 0,
    turno: "Integral",
    especialidad: "MATEMÁTICAS",
    grado: "",
    seccion: "",
    ano: "4TO AÑO",
    cantidadSecciones: 3,
    materia: "MATEMÁTICAS",
    periodoGrupo: "2024-2025",
    situacionTrabajador: "ACTIVO",
    observacion: "PERSONAL FIJO"
  },
  {
    id: "rac-002",
    plantelId: ID_P2,
    fechaCarga: "2024-10-02",
    cedula: "V-20444555",
    nombreApellido: "ANA MARIN",
    sex: "F",
    fechaIngreso: "2015-01-01",
    codCargo: "0065",
    clasificacion: "DOCENTE II",
    tipoPersonal: "DOCENTE",
    funcion: "DOCENTE",
    numGoPc: "G.O. 41.000",
    cargaHorariaRecibo: 36,
    horasAcademicas: 36,
    horasAdm: 0,
    turno: "Mañana",
    especialidad: "PRIMARIA",
    grado: "3ER GRADO",
    seccion: "A",
    ano: "",
    cantidadSecciones: 1,
    materia: "INTEGRAL",
    periodoGrupo: "2024-2025",
    situacionTrabajador: "ACTIVO",
    observacion: ""
  }
];

export const SEED_CNAE: CnaeRegistro[] = [
  {
    id: "cnae-001",
    plantelId: ID_P1,
    fechaCarga: "2024-10-01",
    recibioPae: true,
    fechaRecepcionPae: "2024-09-28",
    recibioDotacion: true,
    fechaRecepcionDotacion: "2024-05-15",
    equiposDotacion: "COCINA INDUSTRIAL Y CONGELADOR",
    utensilios: [
      { nombre: "OLLAS GRANDES", cantidad: 3, condicion: "Bueno" },
      { nombre: "CUCHILLOS", cantidad: 5, condicion: "Bueno" }
    ],
    artefactos: [
      { nombre: "NEVERA", cantidad: 1, condicion: "Operativo" },
      { nombre: "COCINA INDUSTRIAL", cantidad: 1, condicion: "Operativo" }
    ],
    alimentos: [
      { tipo: "Proteína", rubro: "POLLO", cantidad: 50, unidad: "Kg", condicion: "Apto" },
      { tipo: "Seco", rubro: "ARROZ", cantidad: 100, unidad: "Kg", condicion: "Apto" }
    ],
    observacionGeneral: "PAE ACTIVO SIN NOVEDAD",
    responsableNombre: "YRLENG VEGA",
    responsableCi: "13284772",
    responsableCargo: "DOCENTE",
    responsableTelefono: "0424-8887766"
  }
];

export const SEED_BIENES: BienesRegistro[] = [
  {
    id: "bien-001",
    plantelId: ID_P1,
    fechaCarga: "2024-10-01",
    codigoOrganismo: "001",
    codigoUnidadAdmin: "ADMIN-01",
    codigoDependencia: "OD01234567",
    directorNombre: "MARIA RODRIGUEZ",
    directorCi: "15234876",
    bienes: [
      { 
        id: "b1", 
        numeroBien: "564654564", 
        tipo: "MUEBLE", 
        descripcion: "MESA - ESCRITORIO", 
        marca: "S/M",
        modelo: "S/M",
        serial: "S/S",
        color: "GRIS",
        estado: "BUENO",
        ubicacionDireccion: "DIRECCIÓN",
        ubicacionCoordinacion: "ADMINISTRACIÓN",
        responsableUso: "SECRETARIA",
        responsableCi: "15234876",
        responsableCargo: "SECRETARIA",
        observacion: "EN BUEN ESTADO",
        cantidad: 2, 
        precioUnitario: 5000, 
        precioTotal: 10000 
      }
    ],
    preparadoPor: { nombre: "YRLENG VEGA", ci: "13284772", cargo: "DOCENTE" },
    revisadoPor: { nombre: "MARIA RODRIGUEZ", ci: "15234876", cargo: "DIRECTOR(A)" },
    aprobadoPor: { nombre: "", ci: "", cargo: "" },
    recibidoPor: { nombre: "", ci: "", cargo: "" }
  }
];

export const SEED_FEDE: FedeRegistro[] = [
  {
    id: "fede-001",
    plantelId: ID_P1,
    fechaCarga: "2024-10-01",
    tipoEstructura: "EDIFICACIÓN VERTICAL",
    anoConstruccion: "1985",
    estadoGeneral: "REGULAR",
    agua: "DIRECTA (TUBERÍA)",
    electricidad: "ESTABLE",
    aguasServidas: "RED DE CLOACAS",
    gas: "BOMBONA (CILINDRO)",
    aseoUrbano: true,
    necesidadPintura: true,
    necesidadImpermeabilizacion: true,
    necesidadSanitarios: false,
    necesidadElectrico: false,
    necesidadCercado: false,
    necMesasillas: 50,
    necPupitres: 100,
    necPizarrones: 4,
    necEscritorios: 2,
    atendidoBricomiles: true,
    fechaBricomiles: "2024-06-20",
    descripcionBricomiles: "PINTURA GENERAL DE FACHADA",
    solicitudFede: true,
    estatusSolicitud: "Aprobado",
    proyectoActivo: false,
    porcentajeAvance: 0
  }
];
