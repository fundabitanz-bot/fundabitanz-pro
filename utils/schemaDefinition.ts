
export interface TableColumn {
  name: string;
  type: string;
  constraints?: string;
}

export interface TableDefinition {
  name: string;
  columns: TableColumn[];
}

export const DATABASE_SCHEMA: TableDefinition[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'cedula', type: 'TEXT', constraints: 'UNIQUE NOT NULL' },
      { name: 'nombre_completo', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'cargo', type: 'TEXT' },
      { name: 'telefono', type: 'TEXT' },
      { name: 'password', type: 'TEXT' },
      { name: 'role', type: 'TEXT' },
      { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT TRUE' },
      { name: 'municipio_asignado', type: 'TEXT' },
      { name: 'planteles_asignados', type: 'TEXT[]' },
      { name: 'failed_attempts', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'lockout_until', type: 'TEXT' }
    ]
  },
  {
    name: 'planteles',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'codigoDea', type: 'TEXT', constraints: 'UNIQUE NOT NULL' },
      { name: 'codigoDependencia', type: 'TEXT' },
      { name: 'codigoElectoral', type: 'TEXT' },
      { name: 'numeroNer', type: 'TEXT' },
      { name: 'codigoCnae', type: 'TEXT' },
      { name: 'codigoEstadistico', type: 'TEXT' },
      { name: 'nombre', type: 'TEXT', constraints: 'NOT NULL' },
      { name: 'dependencia', type: 'TEXT' },
      { name: 'municipio', type: 'TEXT' },
      { name: 'parroquia', type: 'TEXT' },
      { name: 'direccion', type: 'TEXT' },
      { name: 'comuna', type: 'TEXT' },
      { name: 'circuitoEducativo', type: 'TEXT' },
      { name: 'zonaUbicacion', type: 'TEXT' },
      { name: 'viaAcceso', type: 'TEXT' },
      { name: 'latitud', type: 'TEXT' },
      { name: 'longitud', type: 'TEXT' },
      { name: 'fechaRegistro', type: 'TEXT' },
      { name: 'ciDirector', type: 'TEXT' },
      { name: 'director', type: 'TEXT' },
      { name: 'telefono', type: 'TEXT' },
      { name: 'emailDirector', type: 'TEXT' },
      { name: 'niveles', type: 'TEXT[]' },
      { name: 'modalidades', type: 'TEXT[]' },
      { name: 'turnos', type: 'TEXT[]' },
      { name: 'espaciosFisicos', type: 'JSONB' },
      { name: 'conectividad', type: 'JSONB' },
      { name: 'redesPlantel', type: 'JSONB' },
      { name: 'redesDirector', type: 'JSONB' }
    ]
  },
  {
    name: 'matricula',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'periodo', type: 'TEXT' },
      { name: 'nivel', type: 'TEXT' },
      { name: 'inscriptosFemenino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'inscriptosMasculino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'asistentesFemenino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'asistentesMasculino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'responsableNombre', type: 'TEXT' },
      { name: 'responsableCi', type: 'TEXT' },
      { name: 'responsableCargo', type: 'TEXT' },
      { name: 'responsableTelefono', type: 'TEXT' }
    ]
  },
  {
    name: 'personal',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'cargo', type: 'TEXT' },
      { name: 'racFemenino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'racMasculino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'asistentesFemenino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'asistentesMasculino', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'responsableNombre', type: 'TEXT' },
      { name: 'responsableCi', type: 'TEXT' },
      { name: 'responsableCargo', type: 'TEXT' },
      { name: 'responsableTelefono', type: 'TEXT' }
    ]
  },
  {
    name: 'rac',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'cedula', type: 'TEXT' },
      { name: 'nombreApellido', type: 'TEXT' },
      { name: 'sexo', type: 'TEXT' },
      { name: 'fechaIngreso', type: 'TEXT' },
      { name: 'codCargo', type: 'TEXT' },
      { name: 'clasificacion', type: 'TEXT' },
      { name: 'tipoPersonal', type: 'TEXT' },
      { name: 'funcion', type: 'TEXT' },
      { name: 'numGoPc', type: 'TEXT' },
      { name: 'horasAcademicas', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'horasAdm', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'turno', type: 'TEXT' },
      { name: 'grado', type: 'TEXT' },
      { name: 'seccion', type: 'TEXT' },
      { name: 'especialidad', type: 'TEXT' },
      { name: 'ano', type: 'TEXT' },
      { name: 'cantidadSecciones', type: 'INTEGER', constraints: 'DEFAULT 0' },
      { name: 'materia', type: 'TEXT' },
      { name: 'periodoGrupo', type: 'TEXT' },
      { name: 'situacionTrabajador', type: 'TEXT' },
      { name: 'observacion', type: 'TEXT' }
    ]
  },
  {
    name: 'cnae',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'UNIQUE REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'recibioPae', type: 'BOOLEAN' },
      { name: 'fechaRecepcionPae', type: 'TEXT' },
      { name: 'recibioDotacion', type: 'BOOLEAN' },
      { name: 'fechaRecepcionDotacion', type: 'TEXT' },
      { name: 'equiposDotacion', type: 'TEXT' },
      { name: 'utensilios', type: 'JSONB', constraints: "DEFAULT '[]'" },
      { name: 'artefactos', type: 'JSONB', constraints: "DEFAULT '[]'" },
      { name: 'alimentos', type: 'JSONB', constraints: "DEFAULT '[]'" },
      { name: 'observacionGeneral', type: 'TEXT' },
      { name: 'responsableNombre', type: 'TEXT' },
      { name: 'responsableCi', type: 'TEXT' },
      { name: 'responsableCargo', type: 'TEXT' },
      { name: 'responsableTelefono', type: 'TEXT' }
    ]
  },
  {
    name: 'bienes',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'UNIQUE REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'codigoOrganismo', type: 'TEXT' },
      { name: 'codigoUnidadAdmin', type: 'TEXT' },
      { name: 'codigoDependencia', type: 'TEXT' },
      { name: 'directorNombre', type: 'TEXT' },
      { name: 'directorCi', type: 'TEXT' },
      { name: 'bienes', type: 'JSONB', constraints: "DEFAULT '[]'" },
      { name: 'preparadoPor', type: 'JSONB' },
      { name: 'revisadoPor', type: 'JSONB' },
      { name: 'aprobadoPor', type: 'JSONB' },
      { name: 'recibidoPor', type: 'JSONB' }
    ]
  },
  {
    name: 'cuadratura',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'UNIQUE REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'necesidadInicial', type: 'INTEGER' },
      { name: 'necesidadPrimaria', type: 'INTEGER' },
      { name: 'necesidadEspecial', type: 'INTEGER' },
      { name: 'necesidadMediaGeneral', type: 'JSONB' },
      { name: 'necesidadMediaTecnica', type: 'JSONB' },
      { name: 'necesidadMediaTecnicaExpansion', type: 'JSONB' },
      { name: 'necesidadAdultos', type: 'JSONB' },
      { name: 'necesidadAdministrativo', type: 'INTEGER' },
      { name: 'necesidadAseador', type: 'INTEGER' },
      { name: 'necesidadVigilante', type: 'INTEGER' },
      { name: 'necesidadCocinero', type: 'INTEGER' },
      { name: 'responsableNombre', type: 'TEXT' },
      { name: 'responsableCi', type: 'TEXT' },
      { name: 'responsableCargo', type: 'TEXT' },
      { name: 'responsableTelefono', type: 'TEXT' }
    ]
  },
  {
    name: 'fundabit',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'UNIQUE REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'poseeCbit', type: 'BOOLEAN' },
      { name: 'estaActivo', type: 'BOOLEAN' },
      { name: 'equiposOperativos', type: 'INTEGER' },
      { name: 'tieneInternet', type: 'BOOLEAN' },
      { name: 'tutores', type: 'JSONB', constraints: "DEFAULT '[]'" }
    ]
  },
  {
    name: 'fede',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'plantelId', type: 'UUID', constraints: 'UNIQUE REFERENCES planteles(id) ON DELETE CASCADE' },
      { name: 'fechaCarga', type: 'TEXT' },
      { name: 'tipoEstructura', type: 'TEXT' },
      { name: 'anoConstruccion', type: 'TEXT' },
      { name: 'estadoGeneral', type: 'TEXT' },
      { name: 'agua', type: 'TEXT' },
      { name: 'electricidad', type: 'TEXT' },
      { name: 'aguasServidas', type: 'TEXT' },
      { name: 'gas', type: 'TEXT' },
      { name: 'aseoUrbano', type: 'BOOLEAN' },
      { name: 'necesidadPintura', type: 'BOOLEAN' },
      { name: 'necesidadImpermeabilizacion', type: 'BOOLEAN' },
      { name: 'necesidadSanitarios', type: 'BOOLEAN' },
      { name: 'necesidadElectrico', type: 'BOOLEAN' },
      { name: 'necesidadCercado', type: 'BOOLEAN' },
      { name: 'necMesasillas', type: 'INTEGER' },
      { name: 'necPupitres', type: 'INTEGER' },
      { name: 'necPizarrones', type: 'INTEGER' },
      { name: 'necEscritorios', type: 'INTEGER' },
      { name: 'atendidoBricomiles', type: 'BOOLEAN' },
      { name: 'fechaBricomiles', type: 'TEXT' },
      { name: 'descripcionBricomiles', type: 'TEXT' },
      { name: 'solicitudFede', type: 'BOOLEAN' },
      { name: 'estatusSolicitud', type: 'TEXT' },
      { name: 'proyectoActivo', type: 'BOOLEAN' },
      { name: 'nombreProyecto', type: 'TEXT' },
      { name: 'fechaInicioProyecto', type: 'TEXT' },
      { name: 'fechaFinProyecto', type: 'TEXT' },
      { name: 'estatusObra', type: 'TEXT' },
      { name: 'porcentajeAvance', type: 'INTEGER' }
    ]
  },
  {
    name: 'audit_logs',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
      { name: 'fecha', type: 'TEXT' },
      { name: 'usuarioId', type: 'TEXT' },
      { name: 'usuarioNombre', type: 'TEXT' },
      { name: 'accion', type: 'TEXT' },
      { name: 'modulo', type: 'TEXT' },
      { name: 'detalles', type: 'TEXT' }
    ]
  }
];