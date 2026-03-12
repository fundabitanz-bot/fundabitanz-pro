
import React, { useState, useMemo } from 'react';
import { 
    Plantel, MatriculaRegistro, PersonalRegistro, RacRegistro, 
    CnaeRegistro, BienesRegistro, FundabitRegistro, FedeRegistro, 
    CuadraturaRegistro, User, RecursoRegistro, AsistenciaDiariaRegistro, 
    RendimientoRegistro
} from '../types';
import { 
    GEOGRAFIA_VENEZUELA, SUBJECTS_31059, SUBJECTS_31060, SUBJECTS_TECNICA, 
    DEPENDENCIAS, NIVELES, MODALIDADES, CARGOS, SITUACION_TRABAJADOR, CUADRATURA_IP_CONFIG, CUADRATURA_ESPECIAL_COLUMNS, ADULTOS_PERIODOS_ESTANDAR 
} from '../utils/constants';
import { 
    Calculator, Users, ClipboardList, MapPin, Download, 
    FileSpreadsheet, RefreshCw, Layers, Briefcase, BookOpen, FileText,
    ChefHat, Hammer, Monitor, Package, TrendingUp, CalendarCheck, UserCog, Search, Filter, LayoutGrid, Activity, ClipboardCheck, Building2, School, HeartPulse, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportesManagerProps {
    planteles: Plantel[];
    matricula: MatriculaRegistro[];
    personal: PersonalRegistro[];
    rac: RacRegistro[];
    cnae: CnaeRegistro[];
    bienes: BienesRegistro[];
    fundabit: FundabitRegistro[];
    fede: FedeRegistro[];
    cuadratura: CuadraturaRegistro[];
    recursos: RecursoRegistro[];
    asistenciaDiaria: AsistenciaDiariaRegistro[];
    currentUser: User;
    eventos: any[];
    rendimiento: RendimientoRegistro[];
}

const ReportesManager: React.FC<ReportesManagerProps> = ({ 
    planteles = [], matricula = [], personal = [], rac = [], cnae = [], bienes = [], 
    fundabit = [], fede = [], cuadratura = [], recursos = [], asistenciaDiaria = [], 
    rendimiento = [], currentUser 
}) => {
  const [selectedEstado, setSelectedEstado] = useState<string>(currentUser.estadoAsignado || 'ANZOATEGUI');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>(currentUser.role === 'MUNICIPAL' ? currentUser.municipioAsignado || '' : '');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>(currentUser.role === 'PLANTEL' ? (currentUser.plantelesAsignados?.[0] || '') : '');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const isStateLocked = currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'MAESTRO' && currentUser.role !== 'GEOLOCALIZADOR';
  const isMunLocked = currentUser.role === 'MUNICIPAL' || currentUser.role === 'PLANTEL';
  const isPlantelLocked = currentUser.role === 'PLANTEL';

  const dropdownPlanteles = useMemo(() => {
      let list = planteles;
      if (selectedEstado) list = list.filter(p => p.estado === selectedEstado);
      if (selectedMunicipio) list = list.filter(p => p.municipio === selectedMunicipio);
      
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          list = list.filter(p => p.nombre.toLowerCase().includes(lowerTerm) || p.codigoDea.toLowerCase().includes(lowerTerm));
      }
      return list.sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [planteles, selectedEstado, selectedMunicipio, searchTerm]);

  const targetPlanteles = useMemo(() => {
      if (selectedPlantelId) {
          return planteles.filter(p => p.id === selectedPlantelId);
      }
      if (selectedMunicipio) {
          return planteles.filter(p => p.municipio === selectedMunicipio && (!selectedEstado || p.estado === selectedEstado));
      }
      if (selectedEstado) {
          return planteles.filter(p => p.estado === selectedEstado);
      }
      return planteles;
  }, [planteles, selectedEstado, selectedMunicipio, selectedPlantelId]);

  const contextLabel = useMemo(() => {
      if (selectedPlantelId) {
          const p = planteles.find(p => p.id === selectedPlantelId);
          const cleanName = p ? p.nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25) : 'PLANTEL';
          return `PLANTEL_${cleanName}`;
      }
      if (selectedMunicipio) {
          return `MUNICIPIO_${selectedMunicipio.replace(/ /g, '_')}`;
      }
      if (selectedEstado) {
          return `ESTADO_${selectedEstado.replace(/ /g, '_')}`;
      }
      return 'CONSOLIDADO_NACIONAL';
  }, [selectedPlantelId, selectedMunicipio, selectedEstado, planteles]);

  const getStandardHeader = (p: Plantel) => ({
      "ESTADO": p.estado,
      "MUNICIPIO": p.municipio,
      "PARROQUIA": p.parroquia,
      "CODIGO DEA": p.codigoDea,
      "CODIGO DEPENDENCIA": p.codigoDependencia || p.dependencia || 'N/A',
      "CODIGO ESTADISTICO": p.codigoEstadistico || 'N/A',
      "NOMBRE DEL PLANTEL": p.nombre,
      "DEPENDENCIA": p.dependencia,
      "NIVELES": (p.niveles || []).join(', '),
      "MODALIDAD": (p.modalidades || []).join(', '),
      "DIRECCION": p.direccion,
      "COORDENADAS": `${p.latitud}, ${p.longitud}`
  });

  // --- 1. LOGICA DE MATRICES (INTACTA) ---
  const handleExportMatriz = (tipo: 'MATRICULA' | 'PERSONAL' | 'CONDICIONES') => {
      setIsExporting(tipo);
      setTimeout(() => {
          const wb = XLSX.utils.book_new();
          const mapDep = new Map<string, string>(targetPlanteles.map(p => [p.id, (p.dependencia || 'NACIONAL').toUpperCase()]));
          const depsCols = ['AUTÓNOMA', 'ESTADAL', 'MUNICIPAL', 'NACIONAL', 'PRIVADO', 'SUBVENCIONADA'];

          if (tipo === 'MATRICULA') {
              const targetIds = new Set(targetPlanteles.map(p => p.id));
              const matrixData: any = {};
              const rowsToExport = [...NIVELES, 'ESPECIAL', 'ADULTOS'];

              rowsToExport.forEach(n => {
                  const nivelUpper = n.toUpperCase();
                  matrixData[nivelUpper] = {};
                  depsCols.forEach(d => matrixData[nivelUpper][d] = { inscF: 0, inscM: 0, asisF: 0, asisM: 0 });
              });

              matricula.filter(m => targetIds.has(m.plantelId)).forEach(m => {
                  const dep = mapDep.get(m.plantelId) || 'NACIONAL';
                  const nivel = m.nivel.toUpperCase();
                  const depKey = depsCols.find(d => d.startsWith(dep.substring(0, 4))) || 'NACIONAL'; 
                  if (matrixData[nivel]) {
                      matrixData[nivel][depKey].inscF += (m.inscriptosFemenino || 0);
                      matrixData[nivel][depKey].inscM += (m.inscriptosMasculino || 0);
                      matrixData[nivel][depKey].asisF += (m.asistentesFemenino || 0);
                      matrixData[nivel][depKey].asisM += (m.asistentesMasculino || 0);
                  }
              });

              const wsData: any[][] = [];
              const row0 = ["NIVELES"];
              depsCols.forEach(d => { row0.push(d); row0.push(""); row0.push(""); row0.push(""); });
              wsData.push(row0);
              const row1 = [""];
              depsCols.forEach(() => { row1.push("INSCRITOS"); row1.push(""); row1.push("ASISTENCIA"); row1.push(""); });
              wsData.push(row1);
              const row2 = [""];
              depsCols.forEach(() => { row2.push("F"); row2.push("M"); row2.push("F"); row2.push("M"); });
              wsData.push(row2);

              rowsToExport.forEach(n => {
                  const r: any[] = [n.toUpperCase()];
                  depsCols.forEach(d => {
                      const data = matrixData[n.toUpperCase()]?.[d] || { inscF: 0, inscM: 0, asisF: 0, asisM: 0 };
                      r.push(data.inscF); r.push(data.inscM); r.push(data.asisF); r.push(data.asisM);
                  });
                  wsData.push(r);
              });

              const ws = XLSX.utils.aoa_to_sheet(wsData);
              const merges = [];
              for (let i = 0; i < depsCols.length; i++) {
                  const startCol = 1 + (i * 4);
                  merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 3 } });
                  merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 1 } });
                  merges.push({ s: { r: 1, c: startCol + 2 }, e: { r: 1, c: startCol + 3 } });
              }
              ws['!merges'] = merges;
              XLSX.utils.book_append_sheet(wb, ws, "MATRIZ_MATRICULA");
          } 
          
          XLSX.writeFile(wb, `MATRIZ_${tipo}_${contextLabel}.xlsx`);
          setIsExporting(null);
      }, 500);
  };

  // --- 2. REPORTE DE NOMINA RAC (ESTÁNDAR) ---
  const handleExportRacNomina = () => {
      setIsExporting('RAC_NOMINA');
      setTimeout(() => {
          const exportData: any[] = [];
          const sortedPlanteles = [...targetPlanteles].sort((a, b) => a.nombre.localeCompare(b.nombre));

          sortedPlanteles.forEach(p => {
              const plantelStaff = rac.filter(r => r.plantelId === p.id);
              if (plantelStaff.length > 0) {
                  plantelStaff.forEach(staff => {
                      exportData.push({
                          ...getStandardHeader(p),
                          "COD. CARGO": staff.codCargo,
                          "CLASIFICACION": staff.clasificacion,
                          "TIPO DE PERSONAL": staff.tipoPersonal,
                          "FUNCION": staff.funcion,
                          "CEDULA": staff.cedula,
                          "NOMBRE Y APELLIDO": staff.nombreApellido,
                          "FECHA DE INGRESO": staff.fechaIngreso,
                          "SEXO": staff.sex,
                          "HORAS ACADEMICAS": staff.horasAcademicas,
                          "HORAS ADM": staff.horasAdm,
                          "TURNO QUE ATIENDE": staff.turno,
                          "GRADO": staff.grado,
                          "SECCIÓN": staff.seccion,
                          "ESPECIALIDAD": staff.especialidad,
                          "AÑO": staff.ano,
                          "SECCIONES": staff.cantidadSecciones,
                          "MATERIA": staff.materia,
                          "PERIODO O GRUPO": staff.periodoGrupo,
                          "SITUACIÓN DEL TRABAJADOR": staff.situacionTrabajador,
                          "OBSERVACIÓN": staff.observacion
                      });
                  });
              }
          });

          if (exportData.length > 0) {
              const ws = XLSX.utils.json_to_sheet(exportData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "NOMINA_RAC_ESTANDAR");
              XLSX.writeFile(wb, `NOMINA_RAC_${contextLabel}.xlsx`);
          } else {
              alert("No se encontraron registros de personal RAC.");
          }
          setIsExporting(null);
      }, 500);
  };

  // --- 3. REPORTE DE 2DO RAC (SOCIOECONÓMICO) ---
  const handleExportRacSocioeconomico = () => {
      setIsExporting('RAC_2DO');
      setTimeout(() => {
          const exportData: any[] = [];
          const sortedPlanteles = [...targetPlanteles].sort((a, b) => a.nombre.localeCompare(b.nombre));

          sortedPlanteles.forEach(p => {
              const plantelStaff = rac.filter(r => r.plantelId === p.id);
              if (plantelStaff.length > 0) {
                  plantelStaff.forEach(staff => {
                      exportData.push({
                          ...getStandardHeader(p),
                          "CEDULA": staff.cedula,
                          "NOMBRE Y APELLIDO": staff.nombreApellido,
                          "TIPO PERSONAL": staff.tipoPersonal,
                          // CAMPOS 2DO RAC
                          "LUGAR NACIMIENTO": staff.lugarNacimiento || '',
                          "EDAD": staff.edad || '',
                          "TLF HABITACION": staff.tlfHabitacion || '',
                          "NIVEL INSTRUCCION": staff.nivelInstruccion || '',
                          "PROFESION": staff.profesion || '',
                          "TALLA CAMISA": staff.tallaCamisa || '',
                          "TALLA PANTALON": staff.tallaPantalon || '',
                          "TALLA ZAPATO": staff.tallaZapato || '',
                          "TIPO VIVIENDA": staff.tipoVivienda || '',
                          "CONDICION VIVIENDA": staff.condicionVivienda || '',
                          "MATERIAL VIVIENDA": staff.materialVivienda || '',
                          "ACTIVIDAD DEPORTIVA": staff.actividadDeportiva || '',
                          "ACTIVIDAD CULTURAL": staff.actividadCultural || '',
                          "PADECE ENFERMEDAD": staff.padeceEnfermedad || '',
                          "REQUIERE MEDICAMENTO": staff.requiereMedicamento || '',
                          "DISCAPACIDAD": staff.discapacidad || ''
                      });
                  });
              }
          });

          if (exportData.length > 0) {
              const ws = XLSX.utils.json_to_sheet(exportData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "2DO_RAC_SOCIOECONOMICO");
              XLSX.writeFile(wb, `2DO_RAC_SOCIOECONOMICO_${contextLabel}.xlsx`);
          } else {
              alert("No se encontraron registros para generar el 2do RAC.");
          }
          setIsExporting(null);
      }, 500);
  };

  // --- 4. REPORTES MODULARES (INCLUYE ESPACIOS FÍSICOS Y DIRECTORES) ---
  const generateModuleReport = (moduleName: string) => {
      setIsExporting(moduleName);
      setTimeout(() => {
          const exportData: any[] = [];
          
          targetPlanteles.forEach(p => {
              const header = getStandardHeader(p);
              
              if (moduleName === 'DIRECTORES') {
                  const redes = p.redesDirector || {};
                  exportData.push({
                      ...header,
                      "NOMBRE DIRECTOR": p.director,
                      "CEDULA DIRECTOR": p.ciDirector,
                      "TELEFONO MOVIL": p.telefono,
                      "CORREO ELECTRONICO": p.emailDirector,
                      "FACEBOOK": redes.facebook || 'N/A',
                      "INSTAGRAM": redes.instagram || 'N/A',
                      "X (TWITTER)": redes.x || 'N/A',
                      "TIKTOK": redes.tiktok || 'N/A',
                      "TELEGRAM": redes.telegram || 'N/A'
                  });
              }
              else if (moduleName === 'INFRAESTRUCTURA_ESPACIOS') {
                  const e: any = p.espaciosFisicos || {};
                  exportData.push({
                      ...header,
                      "OFICINAS": e.oficinas || 0,
                      "PASILLOS": e.pasillos || 0,
                      "SALONES": e.salones || 0,
                      "DEPOSITOS": e.depositos || 0,
                      "COCINA": e.cocina || 0,
                      "PATIO": e.patio || 0,
                      "PLAZOLETA": e.plazoleta || 0,
                      "JARDINES": e.jardines || 0,
                      "CANCHA": e.cancha || 0,
                      "BAÑOS": e.banos || 0,
                      "MULTIUSO": e.multiuso || 0,
                      "ESTACIONAMIENTO": e.estacionamiento || 0,
                      "CBIT": e.cbit || 0,
                      "ANFITEATRO": e.anfiteatro || 0,
                      "BIBLIOTECA": e.biblioteca || 0
                  });
              }
              else if (moduleName === 'ESTATUS_CARGA') {
                  const checks = [
                      { key: 'MATRICULA', val: matricula.some(m => m.plantelId === p.id) },
                      { key: 'RAC', val: rac.some(r => r.plantelId === p.id) },
                      { key: 'CNAE', val: cnae.some(c => c.plantelId === p.id) },
                      { key: 'FEDE', val: fede.some(f => f.plantelId === p.id) },
                      { key: 'BIENES', val: bienes.some(b => b.plantelId === p.id) },
                      { key: 'FUNDABIT', val: fundabit.some(f => f.plantelId === p.id) },
                      { key: 'CUADRATURA', val: cuadratura.some(c => c.plantelId === p.id) }
                  ];
                  const loadedCount = checks.filter(c => c.val).length;
                  const missing = checks.filter(c => !c.val).map(c => c.key).join(', ');
                  exportData.push({
                      ...header,
                      "TIENE MATRICULA": checks[0].val ? 'SI' : 'NO',
                      "TIENE PERSONAL RAC": checks[1].val ? 'SI' : 'NO',
                      "TIENE CNAE": checks[2].val ? 'SI' : 'NO',
                      "TIENE FEDE": checks[3].val ? 'SI' : 'NO',
                      "TIENE BIENES": checks[4].val ? 'SI' : 'NO',
                      "TIENE FUNDABIT": checks[5].val ? 'SI' : 'NO',
                      "TIENE CUADRATURA": checks[6].val ? 'SI' : 'NO',
                      "TOTAL MODULOS": loadedCount,
                      "MODULOS FALTANTES": missing || 'NINGUNO'
                  });
              }
              else if (moduleName === 'MATRICULA') {
                  const regs = matricula.filter(m => m.plantelId === p.id);
                  regs.forEach(r => exportData.push({
                      ...header,
                      "PERIODO": r.periodo, "NIVEL": r.nivel, "SECCIONES": r.cantidadSecciones,
                      "INSCRITOS FEM": r.inscriptosFemenino, "INSCRITOS MASC": r.inscriptosMasculino, "TOTAL": r.inscriptosFemenino + r.inscriptosMasculino,
                      "ASIST. FEM": r.asistentesFemenino, "ASIST. MASC": r.asistentesMasculino,
                      "RESPONSABLE": r.responsableNombre, "FECHA": r.fechaCarga
                  }));
              }
              else if (moduleName === 'CNAE') {
                  const reg = cnae.find(c => c.plantelId === p.id);
                  if (reg) exportData.push({
                      ...header,
                      "RECIBIÓ PAE": reg.recibioPae ? 'SI' : 'NO',
                      "RECIBIÓ DOTACIÓN": reg.recibioDotacion ? 'SI' : 'NO',
                      "EQUIPOS DOTACIÓN": reg.equiposDotacion,
                      "OBSERVACIÓN": reg.observacionGeneral,
                      "RESPONSABLE": reg.responsableNombre,
                      "FECHA": reg.fechaCarga
                  });
              }
              else if (moduleName === 'FEDE') {
                  const reg = fede.find(f => f.plantelId === p.id);
                  if (reg) exportData.push({
                      ...header,
                      "TIPO ESTRUCTURA": reg.tipoEstructura, "AÑO CONST.": reg.anoConstruccion, "ESTADO GRAL": reg.estadoGeneral,
                      "AGUA": reg.agua, "ELECTRICIDAD": reg.electricidad, "AGUAS SERVIDAS": reg.aguasServidas, "GAS": reg.gas,
                      "NEC. PINTURA": reg.necesidadPintura ? 'SI' : 'NO', "NEC. IMPERM.": reg.necesidadImpermeabilizacion ? 'SI' : 'NO',
                      "PROYECTO ACTIVO": reg.proyectoActivo ? 'SI' : 'NO', "NOMBRE PROYECTO": reg.nombreProyecto, "AVANCE": reg.porcentajeAvance + '%',
                      "BRICOMILES": reg.atendidoBricomiles ? 'SI' : 'NO', "FECHA BRICOMILES": reg.fechaBricomiles
                  });
              }
              else if (moduleName === 'FUNDABIT') {
                  const reg = fundabit.find(f => f.plantelId === p.id);
                  if (reg) exportData.push({
                      ...header,
                      "POSEE CBIT": reg.poseeCbit ? 'SI' : 'NO', "ACTIVO": reg.estaActivo ? 'SI' : 'NO',
                      "EQUIPOS OPERATIVOS": reg.equiposOperativos, "INTERNET": reg.tieneInternet ? 'SI' : 'NO',
                      "TUTORES": (reg.tutores || []).map(t => t.nombreCompleto).join('; ')
                  });
              }
              else if (moduleName === 'BIENES') {
                  const reg = bienes.find(b => b.plantelId === p.id);
                  if (reg) (reg.bienes || []).forEach(b => exportData.push({
                      ...header,
                      "TIPO": b.tipo, "DESCRIPCION": b.descripcion, "MARCA": b.marca, "SERIAL": b.serial,
                      "ESTADO": b.estado, "UBICACION": b.ubicacionDireccion, "RESPONSABLE": b.responsableUso
                  }));
              }
              else if (moduleName === 'PLANTELES_CARGA') {
                  exportData.push({
                      ...header,
                      "DIRECTOR": p.director, "CI": p.ciDirector, "TELEFONO": p.telefono, "EMAIL": p.emailDirector
                  });
              }
          });

          if (exportData.length > 0) {
              const ws = XLSX.utils.json_to_sheet(exportData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, `REPORTE_${moduleName}`);
              XLSX.writeFile(wb, `SGI_${moduleName}_${contextLabel}.xlsx`);
          } else {
              alert(`No hay datos registrados en el módulo ${moduleName} para exportar.`);
          }
          setIsExporting(null);
      }, 500);
  };

  // --- 5. LOGICA DE CUADRATURA EXACTA (CONSERVADA INTACTA) ---
  const handleExportCuadratura = (formatoEspecifico: 'IP' | 'ESPECIAL' | '31059' | '31060' | 'TECNICA' | 'ADULTOS') => {
      setIsExporting(formatoEspecifico);
      setTimeout(() => {
          const wb = XLSX.utils.book_new();
          let sheetsAdded = 0;

          targetPlanteles.forEach(plantel => {
              let tipoBusqueda = '';
              if (formatoEspecifico === 'IP') tipoBusqueda = 'INICIAL_PRIMARIA';
              else if (formatoEspecifico === 'ESPECIAL') tipoBusqueda = 'ESPECIAL';
              else if (formatoEspecifico === 'ADULTOS') tipoBusqueda = 'ADULTOS';
              else tipoBusqueda = 'MEDIA_TECNICA_GENERAL';

              const data = cuadratura.find(c => c.plantelId === plantel.id && c.tipoFormato === tipoBusqueda);
              if (!data || !data.docentes || data.docentes.length === 0) return;

              let ws: XLSX.WorkSheet | null = null;
              if (formatoEspecifico === 'IP') ws = generateSheetInicialPrimaria(plantel, data);
              else if (formatoEspecifico === 'ESPECIAL') ws = generateSheetEspecial(plantel, data);
              else if (formatoEspecifico === 'ADULTOS') ws = generateSheetAdultos(plantel, data);
              else ws = generateSheetMedia(plantel, data, formatoEspecifico);

              if (ws) {
                  let sheetName = plantel.nombre.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
                  if (wb.SheetNames.includes(sheetName)) sheetName += `_${Math.floor(Math.random()*100)}`;
                  XLSX.utils.book_append_sheet(wb, ws, sheetName);
                  sheetsAdded++;
              }
          });

          if (sheetsAdded > 0) {
              XLSX.writeFile(wb, `CUADRATURA_${formatoEspecifico}_${contextLabel}.xlsx`);
          } else {
              alert(`No se encontraron registros de cuadratura tipo ${formatoEspecifico} en la selección actual.`);
          }
          setIsExporting(null);
      }, 500);
  };

  // GENERADORES DE HOJAS ESPECÍFICOS (CUADRATURA EXACTA - INTACTOS)
  const generateSheetInicialPrimaria = (p: Plantel, data: CuadraturaRegistro) => {
      const rows = [];
      rows.push(["CUADRATURA DE INICIAL Y PRIMARIA"]);
      rows.push([`CODIGO DEA: ${p.codigoDea}`, "", "", `NOMBRE DEL PLANTEL: ${p.nombre}`]);
      rows.push([]); 
      const header1 = ["C.I.", "NOMBRE Y APELLIDO", "CARGA HORARIA", "T / I", "TURNO"];
      const header2 = ["", "", "", "", ""];
      CUADRATURA_IP_CONFIG.forEach(col => {
          header1.push(col.label);
          for(let i=1; i<col.subs.length; i++) header1.push(""); 
          col.subs.forEach(s => header2.push(s));
      });
      rows.push(header1); rows.push(header2);
      data.docentes?.forEach(d => {
          const r = [d.cedula, d.nombreDocente, d.cargaHorariaRecibo, d.titularInterino, d.turno];
          CUADRATURA_IP_CONFIG.forEach(col => {
              col.subs.forEach(s => { r.push(d.matriculaAsignada?.[`${col.key}-${s}`] || ""); });
          });
          rows.push(r);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const merges = [{ s: {r:0, c:0}, e: {r:0, c:header2.length-1} }, { s: {r:3, c:0}, e: {r:4, c:0} }, { s: {r:3, c:1}, e: {r:4, c:1} }, { s: {r:3, c:2}, e: {r:4, c:2} }, { s: {r:3, c:3}, e: {r:4, c:3} }, { s: {r:3, c:4}, e: {r:4, c:4} }];
      let currentC = 5;
      CUADRATURA_IP_CONFIG.forEach(col => { merges.push({ s: {r:3, c:currentC}, e: {r:3, c:currentC + col.subs.length - 1} }); currentC += col.subs.length; });
      ws['!merges'] = merges;
      return ws;
  };

  const generateSheetEspecial = (p: Plantel, data: CuadraturaRegistro) => {
      const rows = [];
      rows.push(["CUADRATURA ESPECIAL"]);
      rows.push([`CODIGO: ${p.codigoDea}`, "", "", "", "", "", `PLANTEL: ${p.nombre}`]);
      rows.push([]);
      const header1 = ["C.I.", "NOMBRE DEL DOCENTE", "CARGA HORARIA", "CONDICION", "TURNO", "TIPO PERSONAL", "MATRICULA (GRUPOS)"];
      for(let i=0; i<11; i++) header1.push("");
      const header2 = ["", "", "", "", "", ""];
      CUADRATURA_ESPECIAL_COLUMNS.forEach(g => header2.push(g));
      rows.push(header1); rows.push(header2);
      data.docentes?.forEach(d => {
          const r = [d.cedula, d.nombreDocente, d.cargaHorariaRecibo, d.titularInterino, d.turno, d.tipoPersonal];
          CUADRATURA_ESPECIAL_COLUMNS.forEach(grp => { r.push(d.matriculaAsignada?.[grp] || ""); });
          rows.push(r);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const merges = [{ s: {r:0, c:0}, e: {r:0, c:17} }, { s: {r:3, c:0}, e: {r:4, c:0} }, { s: {r:3, c:1}, e: {r:4, c:1} }, { s: {r:3, c:2}, e: {r:4, c:2} }, { s: {r:3, c:3}, e: {r:4, c:3} }, { s: {r:3, c:4}, e: {r:4, c:4} }, { s: {r:3, c:5}, e: {r:4, c:5} }, { s: {r:3, c:6}, e: {r:3, c:17} }];
      ws['!merges'] = merges;
      return ws;
  };

  const generateSheetMedia = (p: Plantel, data: CuadraturaRegistro, tipo: '31059' | '31060' | 'TECNICA') => {
      let subjects: string[] = []; let labelPlan = ""; let years = ['1ER AÑO', '2DO AÑO', '3ER AÑO', '4TO AÑO', '5TO AÑO'];
      if (tipo === '31059') { subjects = SUBJECTS_31059; labelPlan = "PLAN DE ESTUDIO 31059 GENERAL"; } 
      else if (tipo === '31060') { subjects = SUBJECTS_31060; labelPlan = "PLAN DE ESTUDIO 31060 CIENCIA Y TECNOLOGIA"; } 
      else { subjects = SUBJECTS_TECNICA; labelPlan = "PLAN DE ESTUDIO EDUCACION MEDIA TECNICA"; years.push('6TO AÑO'); }
      const rows = [];
      rows.push([labelPlan]);
      rows.push([`CODIGO DEA: ${p.codigoDea}`, "", "", "", `NOMBRE: ${p.nombre}`]);
      rows.push([]);
      const headerRowYears = ["C.I.", "NOMBRE DEL DOCENTE", "CARGA HORARIA", "H. PLANTEL", "TITULAR", "TIPO"];
      const headerRowSubjects = ["", "", "", "", "", ""];
      const headerRowPlanHours: (string | number)[] = ["", "", "", "", "", ""]; 
      const yearKeys = years.map((_, i) => `Y${i+1}`);
      yearKeys.forEach((yKey, idx) => {
          const yLabel = years[idx];
          const secciones = data.seccionesPorPeriodo?.[yKey] || 0;
          headerRowYears.push(`${yLabel} (${secciones} SECC)`);
          for(let i=1; i<subjects.length; i++) headerRowYears.push("");
          subjects.forEach(sub => {
              const customKey = `${yKey}-${sub}`;
              const finalSubName = data.customSubjects?.[customKey] || sub;
              headerRowSubjects.push(finalSubName);
              const planHr = data.horasPorMateriaPlan?.[customKey] || 0;
              headerRowPlanHours.push(planHr > 0 ? planHr : "");
          });
      });
      headerRowYears.push("HORAS CERTIFICADAS"); headerRowYears.push("HORAS X REPROGRAMAR");
      headerRowSubjects.push(""); headerRowSubjects.push("");
      headerRowPlanHours.push(""); headerRowPlanHours.push("");
      rows.push(headerRowYears); rows.push(headerRowSubjects); rows.push(headerRowPlanHours);
      data.docentes?.forEach(d => {
          const r = [d.cedula, d.nombreDocente, d.cargaHorariaRecibo, d.horasEnPlantel, d.titularInterino, d.tipoPersonal];
          let totalCert = 0;
          yearKeys.forEach(yKey => {
              subjects.forEach(sub => {
                  const key = `${yKey}-${sub}`;
                  const val = d.distribucionHoras?.[key] || 0;
                  r.push(val > 0 ? val : "");
                  totalCert += val;
              });
          });
          r.push(totalCert); r.push((d.cargaHorariaRecibo || 0) - totalCert);
          rows.push(r);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const merges = [{ s: {r:0, c:0}, e: {r:0, c:20} }, { s: {r:3, c:0}, e: {r:5, c:0} }, { s: {r:3, c:1}, e: {r:5, c:1} }, { s: {r:3, c:2}, e: {r:5, c:2} }, { s: {r:3, c:3}, e: {r:5, c:3} }, { s: {r:3, c:4}, e: {r:5, c:4} }, { s: {r:3, c:5}, e: {r:5, c:5} }];
      let currentC = 6;
      yearKeys.forEach(() => { merges.push({ s: {r:3, c:currentC}, e: {r:3, c:currentC + subjects.length - 1} }); currentC += subjects.length; });
      merges.push({ s: {r:3, c:currentC}, e: {r:5, c:currentC} }); merges.push({ s: {r:3, c:currentC+1}, e: {r:5, c:currentC+1} });
      ws['!merges'] = merges;
      return ws;
  };

  const generateSheetAdultos = (p: Plantel, data: CuadraturaRegistro) => {
      const periods = ADULTOS_PERIODOS_ESTANDAR;
      const rows = [];
      rows.push(["PLAN DE ESTUDIO ADULTO"]);
      rows.push([`CODIGO: ${p.codigoDea}`, "", "", "", `NOMBRE: ${p.nombre}`]);
      rows.push([]);
      const header1 = ["C.I.", "NOMBRE DEL DOCENTE", "CARGA HORARIA", "H. PLANTEL", "TITULAR", "TIPO"];
      const header2 = ["", "", "", "", "", ""];
      const header3: (string | number)[] = ["", "", "", "", "", ""]; 
      periods.forEach(per => {
          const secciones = data.seccionesPorPeriodo?.[per.key] || 0;
          header1.push(`${per.label} (${secciones} SECC)`);
          for(let i=1; i<per.subjects.length; i++) header1.push("");
          per.subjects.forEach(sub => {
              const customKey = `${per.key}-${sub}`;
              header2.push(data.customSubjects?.[customKey] || sub);
              header3.push(data.horasPorMateriaPlan?.[customKey] || "");
          });
      });
      header1.push("H. CERTIFICADAS"); header1.push("H. REPROGRAMAR");
      header2.push(""); header2.push("");
      header3.push(""); header3.push("");
      rows.push(header1); rows.push(header2); rows.push(header3);
      data.docentes?.forEach(d => {
          const r = [d.cedula, d.nombreDocente, d.cargaHorariaRecibo, d.horasEnPlantel, d.titularInterino, d.tipoPersonal];
          let totalCert = 0;
          periods.forEach(per => {
              per.subjects.forEach(sub => {
                  const key = `${per.key}-${sub}`;
                  const val = d.distribucionHoras?.[key] || 0;
                  r.push(val > 0 ? val : "");
                  totalCert += val;
              });
          });
          r.push(totalCert); r.push((d.cargaHorariaRecibo || 0) - totalCert);
          rows.push(r);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const merges = [{ s: {r:0, c:0}, e: {r:0, c:15} }, { s: {r:3, c:0}, e: {r:5, c:0} }, { s: {r:3, c:1}, e: {r:5, c:1} }, { s: {r:3, c:2}, e: {r:5, c:2} }, { s: {r:3, c:3}, e: {r:5, c:3} }, { s: {r:3, c:4}, e: {r:5, c:4} }, { s: {r:3, c:5}, e: {r:5, c:5} }];
      let currentC = 6;
      periods.forEach(per => { merges.push({ s: {r:3, c:currentC}, e: {r:3, c:currentC + per.subjects.length - 1} }); currentC += per.subjects.length; });
      merges.push({ s: {r:3, c:currentC}, e: {r:5, c:currentC} }); merges.push({ s: {r:3, c:currentC+1}, e: {r:5, c:currentC+1} });
      ws['!merges'] = merges;
      return ws;
  };

  const inputStyle = "w-full rounded-2xl border-2 border-slate-200 p-4 bg-white text-xs font-black uppercase disabled:bg-slate-100 disabled:text-slate-400 shadow-sm";

  return (
    <div className="space-y-8 animate-in fade-in pb-24 px-4 md:px-0">
      <div className="bg-white p-6 md:p-10 rounded-[50px] shadow-sm border border-slate-200">
        <div className="flex items-center gap-5 mb-10 border-b border-slate-100 pb-8">
            <div className="p-4 bg-[#003399] text-white rounded-3xl shadow-xl"><FileSpreadsheet size={32}/></div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Consolidación Territorial SGI</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Generación masiva de reportes oficiales estandarizados</p>
            </div>
        </div>

        {/* ÁREA DE FILTROS SEGURIZADA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 bg-slate-50/50 p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-inner">
            <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Estado</label>
                <select className={inputStyle} value={selectedEstado} onChange={e => { setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId(''); }} disabled={isStateLocked}>
                    <option value="">VENEZUELA</option>
                    {Object.keys(GEOGRAFIA_VENEZUELA).map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Municipio</label>
                <select className={inputStyle} value={selectedMunicipio} onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId('');}} disabled={!selectedEstado || isMunLocked}>
                    <option value="">-- TODO EL ESTADO --</option>
                    {selectedEstado && Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado] || {}).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Buscar Plantel</label>
                <div className="relative">
                    <input className={inputStyle} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ESCRIBA NOMBRE..." />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                </div>
            </div>
            <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Institución</label>
                <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)} disabled={isPlantelLocked}>
                    <option value="">-- TODO EL MUNICIPIO --</option>
                    {dropdownPlanteles.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
        </div>

        {/* INDICADOR DE ALCANCE DEL REPORTE */}
        <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase shadow-sm ${selectedPlantelId ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : selectedMunicipio ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-[#003399]'}`}>
                <Filter size={16}/>
                <span>Nivel de Reporte: {selectedPlantelId ? 'PLANTEL INDIVIDUAL' : selectedMunicipio ? 'CONSOLIDADO MUNICIPAL' : 'CONSOLIDADO ESTADAL'}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
                {targetPlanteles.length} Instituciones Seleccionadas
            </span>
        </div>

        {/* REPORTES ESPECIALES: MATRICES */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => handleExportMatriz('MATRICULA')} disabled={!!isExporting} className="bg-slate-900 text-white p-6 rounded-[35px] shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><LayoutGrid size={80}/></div>
                <Users size={28} className="text-yellow-400 group-hover:scale-110 transition-transform"/>
                <span className="font-black uppercase text-xs tracking-widest text-center">Matriz de Matrícula</span>
                <span className="text-[8px] opacity-70 uppercase font-bold">Por Nivel y Dependencia</span>
            </button>
            <button onClick={() => handleExportMatriz('PERSONAL')} disabled={!!isExporting} className="bg-[#003399] text-white p-6 rounded-[35px] shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardList size={80}/></div>
                <UserCog size={28} className="text-white group-hover:scale-110 transition-transform"/>
                <span className="font-black uppercase text-xs tracking-widest text-center">Matriz de Personal</span>
                <span className="text-[8px] opacity-70 uppercase font-bold">Por Cargo y Dependencia</span>
            </button>
            <button onClick={() => handleExportMatriz('CONDICIONES')} disabled={!!isExporting} className="bg-emerald-700 text-white p-6 rounded-[35px] shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Briefcase size={80}/></div>
                <Briefcase size={28} className="text-white group-hover:scale-110 transition-transform"/>
                <span className="font-black uppercase text-xs tracking-widest text-center">Condiciones Laborales</span>
                <span className="text-[8px] opacity-70 uppercase font-bold">3 Hojas: Dep / Nivel / Mod</span>
            </button>
        </div>

        {/* SECCIÓN DE REPORTES RAC (SEPARADOS) */}
        <div className="p-10 bg-indigo-900 rounded-[45px] text-white mb-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><ClipboardList size={180}/></div>
            <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nómina RAC / Fuerza Laboral</h3>
                <p className="text-indigo-200 text-xs mt-2 uppercase font-bold max-w-xl">Gestión de expedientes y reportes oficiales de personal.</p>
                <div className="flex gap-4 mt-8 flex-wrap">
                    <button onClick={handleExportRacNomina} disabled={isExporting === 'RAC_NOMINA'} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-3 active:scale-95 transition-all hover:bg-yellow-400">
                        {isExporting === 'RAC_NOMINA' ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
                        {isExporting === 'RAC_NOMINA' ? 'GENERANDO...' : `Nómina RAC (Estándar)`}
                    </button>
                    <button onClick={handleExportRacSocioeconomico} disabled={isExporting === 'RAC_2DO'} className="bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-3 active:scale-95 transition-all hover:bg-indigo-600 border border-white/20">
                        {isExporting === 'RAC_2DO' ? <RefreshCw className="animate-spin" size={20}/> : <HeartPulse size={20}/>}
                        {isExporting === 'RAC_2DO' ? 'GENERANDO...' : `2do RAC (Socioeconómico)`}
                    </button>
                </div>
            </div>
        </div>

        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] mb-6 ml-4">Formatos Oficiales de Cuadratura (Excel Idéntico)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {[
                { id: 'IP', label: 'INICIAL / PRIMARIA', icon: <Calculator size={36}/>, color: 'bg-[#003399]', desc: 'Formato Matriz A-E' },
                { id: 'ESPECIAL', label: 'EDUCACIÓN ESPECIAL', icon: <Layers size={36}/>, color: 'bg-indigo-600', desc: 'Formato 12 Grupos' },
                { id: '31059', label: 'MEDIA GENERAL (31059)', icon: <BookOpen size={36}/>, color: 'bg-emerald-600', desc: 'Plan General 1ero a 5to' },
                { id: '31060', label: 'MEDIA CIENCIAS (31060)', icon: <BookOpen size={36}/>, color: 'bg-teal-600', desc: 'Plan Ciencia y Tecnología' },
                { id: 'TECNICA', label: 'MEDIA TÉCNICA', icon: <Briefcase size={36}/>, color: 'bg-cyan-700', desc: 'Plan Técnico 6 Años' },
                { id: 'ADULTOS', label: 'EDUCACIÓN ADULTOS', icon: <UserCog size={36}/>, color: 'bg-orange-600', desc: 'Plan Modular 6 Periodos' }
            ].map(card => (
                <div key={card.id} onClick={() => handleExportCuadratura(card.id as any)} className={`p-8 rounded-[45px] border-2 border-slate-100 hover:shadow-2xl transition-all group cursor-pointer flex flex-col items-center text-center gap-6 bg-slate-50/20 ${isExporting === card.id ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-2 hover:border-blue-200'}`}>
                    <div className={`p-6 rounded-[25px] ${card.color} text-white shadow-xl transition-transform group-hover:scale-110`}>
                        {isExporting === card.id ? <RefreshCw className="animate-spin" size={36}/> : card.icon}
                    </div>
                    <div>
                        <h3 className="font-black text-[11px] uppercase tracking-tight text-slate-800 mb-2">{card.label}</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{card.desc}</p>
                    </div>
                    <button className="mt-auto bg-slate-900 text-white px-8 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg font-black text-[9px] uppercase tracking-widest active:scale-95">
                        <Download size={14}/> {isExporting === card.id ? 'Generando...' : 'Descargar'}
                    </button>
                </div>
            ))}
        </div>

        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] mb-6 ml-4">Reportes de Gestión Modulares</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
                { id: 'ESTATUS_CARGA', label: 'Estatus Carga', icon: <Activity size={18}/>, color: 'bg-cyan-700' },
                { id: 'DIRECTORES', label: 'Directores', icon: <UserCheck size={18}/>, color: 'bg-indigo-700' }, // NUEVO REPORTE
                { id: 'PLANTELES_CARGA', label: 'Planteles', icon: <School size={18}/>, color: 'bg-slate-800' },
                { id: 'MATRICULA', label: 'Matrícula', icon: <Users size={18}/>, color: 'bg-blue-600' },
                { id: 'INFRAESTRUCTURA_ESPACIOS', label: 'Infraestructura (Espacios)', icon: <Building2 size={18}/>, color: 'bg-purple-700' }, 
                { id: 'CNAE', label: 'CNAE / PAE', icon: <ChefHat size={18}/>, color: 'bg-orange-600' },
                { id: 'FEDE', label: 'Infraestructura FEDE', icon: <Hammer size={18}/>, color: 'bg-red-600' },
                { id: 'FUNDABIT', label: 'Tecnología', icon: <Monitor size={18}/>, color: 'bg-emerald-600' },
                { id: 'BIENES', label: 'Bienes Nac.', icon: <Briefcase size={18}/>, color: 'bg-slate-700' },
            ].map(mod => (
                <button 
                    key={mod.id}
                    onClick={() => generateModuleReport(mod.id)}
                    disabled={isExporting !== null}
                    className={`group bg-white p-4 rounded-3xl border-2 border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col items-center gap-3 ${isExporting === mod.id ? 'opacity-50 cursor-wait' : ''}`}
                >
                    <div className={`p-3 rounded-2xl text-white ${mod.color} shadow-md group-hover:scale-110 transition-transform`}>
                        {isExporting === mod.id ? <RefreshCw size={18} className="animate-spin"/> : mod.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-700 tracking-wide text-center">{mod.label}</span>
                </button>
            ))}
        </div>
        
      </div>
    </div>
  );
};

export default ReportesManager;
