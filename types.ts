
export type Dependencia = 'Nacional' | 'Estadal' | 'Municipal' | 'Privado' | 'Subvencionada' | 'Autónoma';
export type Turno = 'Mañana' | 'Tarde' | 'Integral' | 'Nocturno' | 'Sabatino';
export type ModalidadEducativa = 'Fronterizos' | 'Especial' | 'Adultos' | 'Intercultural';
export type NivelEducativo = 'Maternal' | 'Preescolar' | 'Primaria' | 'Media General' | 'Media Técnica' | 'Especial' | 'Adultos' | 'Intercultural' | 'Fronterizos';

export type UserRole = 'MAESTRO' | 'ADMINISTRADOR' | 'MUNICIPAL' | 'PLANTEL' | 'GEOLOCALIZADOR';

export type TipoCuadratura = 'INICIAL_PRIMARIA' | 'ESPECIAL' | 'ADULTOS' | 'MEDIA_TECNICA_GENERAL';

export enum ModelType {
  FLASH = 'FLASH',
  PRO = 'PRO'
}

export enum TaskType {
  CONVERT_PHP_TO_REACT = 'CONVERT_PHP_TO_REACT',
  GENERATE_SYSTEM = 'GENERATE_SYSTEM',
  DEBUG_FIX = 'DEBUG_FIX',
  EXPLAIN_CODE = 'EXPLAIN_CODE',
  OPTIMIZE = 'OPTIMIZE'
}

export interface RedesSociales {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  x?: string;
  telegram?: string;
}

export interface EspaciosFisicos {
  oficinas: number;
  pasillos: number;
  salones: number;
  depositos: number;
  cocina: number;
  patio: number;
  plazoleta: number;
  jardines: number;
  cancha: number;
  banos: number;
  multiuso: number;
  estacionamiento: number;
  cbit: number;
  anfiteatro: number;
  biblioteca: number;
}

export interface DetalleConexion {
  proveedor: string;
  tipoConexion: string;
  status: 'Activa' | 'Averia' | 'Solicitud' | 'Suspendido' | 'OTRO' | '';
  fechaInstalacion: string;
}

export interface Conectividad {
  tieneInternet: boolean;
  conexion1: DetalleConexion;
  tieneSegundaConexion?: boolean;
  conexion2?: DetalleConexion;
}

export interface Plantel {
  id: string;
  codigoDea: string;
  codigoDependencia: string;
  codigoElectoral?: string;
  numeroNer?: string;
  codigoCnae?: string;
  codigoEstadistico: string;
  nombre: string;
  dependencia: Dependencia;
  estado: string;
  municipio: string;
  parroquia: string;
  direccion: string;
  comuna?: string;
  circuitoEducativo?: string;
  zonaUbicacion?: string;
  viaAcceso?: string;
  latitud: string;
  longitud: string;
  fechaRegistro: string;
  ciDirector: string;
  director: string;
  telefono: string;
  emailDirector: string;
  niveles: NivelEducativo[];
  modalidades: ModalidadEducativa[];
  turnos: Turno[];
  espaciosFisicos: EspaciosFisicos;
  conectividad: Conectividad;
  redesPlantel?: RedesSociales;
  redesDirector?: RedesSociales;
}

export interface PersonnelCriteria {
  docentesPorAlumno: number | Record<string, number>;
  administrativosPorAlumno: number;
  aseadoresPorEspacio: number;
  cocinerosPorAlumno: number;
  vigilantesPorEspacio: number;
}

export interface User { 
  id: string; 
  cedula: string; 
  nombreCompleto: string; 
  email?: string; 
  cargo: string; 
  telefono: string; 
  password?: string; 
  role: UserRole; 
  isActive: boolean; 
  estadoAsignado?: string; 
  municipioAsignado?: string; 
  plantelesAsignados?: string[]; 
  aiAuthorized?: boolean; 
}

export interface ViewState {
  currentView: 'dashboard' | 'planteles' | 'matricula' | 'personal' | 'rac' | 'cnae' | 'bienes' | 'reportes' | 'usuarios' | 'auditoria' | 'cuadratura' | 'mantenimiento' | 'avances' | 'fundabit' | 'fede' | 'rendimiento' | 'recursos' | 'comunicacion' | 'eventos' | 'brechas' | 'asistencia_diaria' | 'consolidacion_estatal' | 'mensajeria' | 'geo_mapa';
  selectedPlantelId?: string;
}

export interface SystemSettings {
  customLogo: string | null;
  customBanner: string | null;
  personnelCriteria: PersonnelCriteria;
  aiEnabled?: boolean;
  chatbotEnabled?: boolean;
  allowPlantelSelfRegistration?: boolean;
  stateName?: string;
}

export interface CuadraturaDocenteFila {
  id: string;
  cedula: string;
  nombreDocente: string;
  cargaHorariaRecibo: number;
  horasEnPlantel: number;
  titularInterino: 'T' | 'I';
  turno: 'M' | 'T' | 'I';
  tipoPersonal: 'Doc' | 'Adm' | 'Obr';
  esVacante: boolean;
  matriculaAsignada: Record<string, number>;
  distribucionHoras: Record<string, number>;
}

export interface NecesidadMateria {
  horas: number;
  docentes: number;
}

export interface CuadraturaRegistro { 
  id: string; 
  plantelId: string; 
  fechaCarga: string; 
  periodoEscolar?: string;
  tipoFormato?: TipoCuadratura;
  docentes?: CuadraturaDocenteFila[]; 
  seccionesPorPeriodo?: Record<string, number>;
  horasPorMateriaPlan?: Record<string, number>;
  customSubjects?: Record<string, string>;
  necesidadInicial?: number;
  necesidadPrimaria?: number;
  necesidadEspecial?: number;
  necesidadMediaGeneral?: Record<string, NecesidadMateria>;
  necesidadMediaTecnica?: Record<string, NecesidadMateria>;
  necesidadMediaTecnicaExpansion?: Record<string, NecesidadMateria>;
  necesidadAdultos?: Record<string, NecesidadMateria>;
  necesidadAdministrativo?: number;
  necesidadAseador?: number;
  necesidadVigilante?: number;
  necesidadCocinero?: number;
  responsableNombre: string; 
  responsableCi: string; 
  responsableCargo: string; 
  responsableTelefono: string; 
}

export interface InventarioItem {
  nombre: string;
  cantidad: number;
  condicion: string;
}

export interface AlimentoItem {
  tipo: 'Seco' | 'Proteína' | 'Verduras/Hortalizas';
  rubro: string;
  cantidad: number;
  unidad: 'Kg' | 'Litros' | 'Unidades' | 'Bultos';
  condicion: 'Apto' | 'Por Vencer' | 'No Apto';
}

export interface BienItem {
  id: string;
  numeroBien: string;
  tipo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serial: string;
  color: string;
  estado: 'BUENO' | 'REGULAR' | 'MALO' | 'DESINCORPORAR' | 'FALTANTE' | 'EN REPARACION';
  ubicacionDireccion: string;
  ubicacionCoordinacion: string;
  responsableUso: string;
  responsableCi: string;
  responsableCargo: string;
  observacion: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface FirmaPerson {
  nombre: string;
  ci: string;
  cargo: string;
}

export interface TutorCbit {
  id: string;
  nombreCompleto: string;
  cedula: string;
  telefono: string;
  correo: string;
  dependencia: 'MPPE' | 'FUNDABIT';
}

export interface AsistenciaMatriculaItem {
  dependencia: string;
  nivel: string;
  modalidad: string;
  femenino: number;
  masculino: number;
}

export interface AsistenciaPersonalItem {
  cargo: string;
  nivel: string;
  modalidad: string;
  femenino: number;
  masculino: number;
}

export type CategoriaSoporte = 'GENERAL' | 'RAC' | 'CNAE' | 'FEDE' | 'URGENTE';
export type TipoDestinatario = 'SOPORTE' | 'PLANTEL' | 'MUNICIPIO' | 'ESTADO';

export type EjeConsolidacion = 'EJE_INICIAL_PRIMARIA' | 'EJE_MEDIA_31059' | 'EJE_MEDIA_31060' | 'EJE_TECNICA' | 'EJE_ADULTOS' | 'EJE_ESPECIAL';
export interface MatriculaRegistro { id: string; plantelId: string; periodo: string; nivel: string; inscriptosFemenino: number; inscriptosMasculino: number; asistentesFemenino: number; asistentesMasculino: number; cantidadSecciones: number; fechaCarga: string; responsableNombre: string; responsableCi: string; responsableCargo: string; responsableTelefono: string; }
export interface PersonalRegistro { id: string; plantelId: string; cargo: string; racFemenino: number; racMasculino: number; asistentesFemenino: number; asistentesMasculino: number; fechaCarga: string; responsableNombre: string; responsableCi: string; responsableCargo: string; responsableTelefono: string; }

// --- RAC REGISTRO EXTENDIDO (2DO RAC) ---
export interface RacRegistro { 
  id: string; 
  plantelId: string; 
  fechaCarga: string; 
  cedula: string; 
  nombreApellido: string; 
  sex: 'F' | 'M'; 
  fechaIngreso: string; 
  codCargo: string; 
  clasificacion: string; 
  tipoPersonal: string; 
  funcion: string; 
  numGoPc: string; 
  cargaHorariaRecibo: number; 
  horasAcademicas: number; 
  horasAdm: number; 
  turno: Turno; 
  grado: string; 
  seccion: string; 
  especialidad: string; 
  ano: string; 
  cantidadSecciones: number; 
  materia: string; 
  periodoGrupo: string; 
  situacionTrabajador: string; 
  observacion: string; 
  fotoUrl?: string; 
  telefono?: string; 
  correo?: string; 
  ejeConsolidacion?: EjeConsolidacion;
  
  // DATOS 2DO RAC
  lugarNacimiento?: string;
  edad?: number;
  tlfHabitacion?: string;
  nivelInstruccion?: string;
  profesion?: string;
  estadoRecibo?: string;
  municipioRecibo?: string;
  parroquiaRecibo?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaZapato?: string;
  actividadDeportiva?: string;
  actividadCultural?: string;
  tipoVivienda?: string;
  condicionVivienda?: string;
  materialVivienda?: string;
  padeceEnfermedad?: string;
  requiereMedicamento?: string;
  discapacidad?: string;
}

export interface CnaeRegistro { id: string; plantelId: string; fechaCarga: string; recibioPae: boolean; fechaRecepcionPae?: string; recibioDotacion: boolean; fechaRecepcionDotacion?: string; equiposDotacion?: string; utensilios: InventarioItem[]; artefactos: InventarioItem[]; alimentos: AlimentoItem[]; observacionGeneral: string; responsableNombre: string; responsableCi: string; responsableCargo: string; responsableTelefono: string; }
export interface BienesRegistro { id: string; plantelId: string; fechaCarga: string; codigoOrganismo: string; codigoUnidadAdmin: string; codigoDependencia: string; directorNombre: string; directorCi: string; bienes: BienItem[]; preparadoPor: FirmaPerson; revisadoPor: FirmaPerson; aprobadoPor: FirmaPerson; recibidoPor: FirmaPerson; }
export interface FundabitRegistro { id: string; plantelId: string; fechaCarga: string; poseeCbit: boolean; estaActivo?: boolean; equiposOperativos?: number; tieneInternet?: boolean; tutores: TutorCbit[]; }
export interface FedeRegistro { id: string; plantelId: string; fechaCarga: string; tipoEstructura: string; anoConstruccion: string; estadoGeneral: 'BUENO' | 'REGULAR' | 'MALO' | 'CRITICO'; agua: string; electricidad: string; aguasServidas: string; gas: string; aseoUrbano: boolean; necesidadPintura: boolean; necesidadImpermeabilizacion: boolean; necesidadSanitarios: boolean; necesidadElectrico: boolean; necesidadCercado: boolean; necMesasillas: number; necPupitres: number; necPizarrones: number; necEscritorios: number; atendidoBricomiles: boolean; fechaBricomiles?: string; descripcionBricomiles?: string; solicitudFede: boolean; estatusSolicitud: string; proyectoActivo: boolean; nombreProyecto?: string; fechaInicioProyecto?: string; fechaFinProyecto?: string; estatusObra?: string; porcentajeAvance?: number; }
export interface RendimientoRegistro { id: string; plantelId: string; periodo: string; nivel: string; momento: string; aprobados: number; reprobados: number; promedioGeneral: number; fechaCarga: string; }
export interface RecursoRegistro { id: string; plantelId: string; tipoRecurso: string; cantidadEntregada: number; cantidadFuncional: number; estatusDotacion: string; fechaEntrega: string; }
export interface Comunicado { id: string; titulo: string; mensaje: string; importancia: 'ALTA' | 'NORMAL' | 'BAJA'; autor: string; fecha: string; imagenUrl?: string; }
export interface EventoEscolar { id: string; titulo: string; fecha: string; tipo: string; tipoOtro?: string; descripcion: string; estatusEjecucion: string; }
export interface AuditLog { id: string; fecha: string; usuario: string; accion: string; modulo: string; detalles: string; }
export interface AsistenciaDiariaRegistro { id: string; plantelId: string; fechaReporte: string; asistenciaMatricula: AsistenciaMatriculaItem[]; asistenciaPersonal: AsistenciaPersonalItem[]; responsableNombre: string; responsableCi: string; }
export interface MensajeSoporte { id: string; remitenteId: string; remitenteNombre: string; remitenteCargo: string; destinatarioTipo: TipoDestinatario; destinatarioId: string; categoria: CategoriaSoporte; asunto: string; mensaje: string; fecha: string; leido: boolean; respuestas: any[]; }
