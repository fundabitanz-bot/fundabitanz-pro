
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plantel, CuadraturaRegistro, CuadraturaDocenteFila, RacRegistro, TipoCuadratura, MatriculaRegistro } from '../types';
import { 
    GEOGRAFIA_VENEZUELA, CUADRATURA_IP_CONFIG, CUADRATURA_ESPECIAL_COLUMNS, 
    ADULTOS_PERIODOS_ESTANDAR, ADULTOS_PERIODOS_BLANCO,
    SUBJECTS_31059, SUBJECTS_31060, SUBJECTS_TECNICA, SUBJECTS_TECNICA_BLANCO
} from '../utils/constants';
import { 
  Calculator, Save, Trash2, GraduationCap, History, Edit,
  RefreshCw, CheckCircle2, UserPlus, FileText, Plus, Layers, Briefcase, BookOpen, Search, AlertCircle, Settings
} from 'lucide-react';

type SubFormatoMedia = '31059' | '31060' | 'TECNICA' | 'TECNICA_BLANCO';
type SubFormatoAdultos = 'ESTANDAR' | 'BLANCO';

interface CuadraturaManagerProps {
  planteles: Plantel[];
  matricula: MatriculaRegistro[];
  rac: RacRegistro[];
  cuadraturaList: CuadraturaRegistro[];
  onSaveCuadratura: (r: CuadraturaRegistro) => void;
  onDeleteCuadratura: (id: string) => void;
}

const CuadraturaManager: React.FC<CuadraturaManagerProps> = ({ planteles, matricula, rac, cuadraturaList, onSaveCuadratura, onDeleteCuadratura }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  const [activeFormat, setActiveFormat] = useState<TipoCuadratura>('INICIAL_PRIMARIA');
  const [mediaSubFormat, setMediaSubFormat] = useState<SubFormatoMedia>('31059');
  const [adultoSubFormat, setAdultoSubFormat] = useState<SubFormatoAdultos>('ESTANDAR');
  const [successMsg, setSuccessMsg] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<CuadraturaRegistro>>({ 
    docentes: [],
    seccionesPorPeriodo: {},
    horasPorMateriaPlan: {}
  });

  const selectedPlantel = useMemo(() => planteles.find(p => p.id === selectedPlantelId), [planteles, selectedPlantelId]);

  const filteredPlanteles = useMemo(() => planteles.filter(p => 
    (!selectedEstado || p.estado === selectedEstado) && 
    (!selectedMunicipio || p.municipio === selectedMunicipio) &&
    (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [planteles, selectedEstado, selectedMunicipio, searchTerm]);

  const currentMediaPeriods = useMemo(() => {
    let subjects: string[] = [];
    let isSixYears = false;
    // Asignación de materias base según el subformato
    switch (mediaSubFormat) {
        case '31059': subjects = SUBJECTS_31059; break;
        case '31060': subjects = SUBJECTS_31060; break;
        case 'TECNICA': subjects = SUBJECTS_TECNICA; isSixYears = true; break;
        case 'TECNICA_BLANCO': subjects = SUBJECTS_TECNICA_BLANCO; isSixYears = true; break;
        default: subjects = SUBJECTS_31059;
    }
    const years = isSixYears 
        ? ['1ER AÑO', '2DO AÑO', '3ER AÑO', '4TO AÑO', '5TO AÑO', '6TO AÑO'] 
        : ['1ER AÑO', '2DO AÑO', '3ER AÑO', '4TO AÑO', '5TO AÑO'];
    
    return years.map((y, idx) => ({ label: y, key: `Y${idx+1}`, subjects }));
  }, [mediaSubFormat]);

  const currentAdultosPeriods = useMemo(() => {
      return adultoSubFormat === 'ESTANDAR' ? ADULTOS_PERIODOS_ESTANDAR : ADULTOS_PERIODOS_BLANCO;
  }, [adultoSubFormat]);

  // Determina si el formato actual permite edición de encabezados (Técnica Blanco o Adultos Blanco)
  const isEditableFormat = useMemo(() => {
      return (activeFormat === 'MEDIA_TECNICA_GENERAL' && mediaSubFormat === 'TECNICA_BLANCO') || 
             (activeFormat === 'ADULTOS' && adultoSubFormat === 'BLANCO');
  }, [activeFormat, mediaSubFormat, adultoSubFormat]);

  useEffect(() => {
    if (selectedPlantelId) {
        const existing = [...cuadraturaList]
            .filter(c => c.plantelId === selectedPlantelId && c.tipoFormato === activeFormat)
            .sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime())[0];
            
        if (existing) {
            setFormData({ ...existing });
            setCustomHeaders(existing.customSubjects || {});
            
            // Detectar subformato guardado si es posible (basado en customHeaders para blanco)
            if (activeFormat === 'MEDIA_TECNICA_GENERAL') {
                 // Si tiene custom headers, probablemente sea BLANCO, si tiene materias de 31060, etc.
                 // Por defecto mantenemos el estado local si no hay info explicita, 
                 // o podríamos guardar el subformato en la DB en una futura versión.
            }
        } else {
            setFormData({ 
                id: crypto.randomUUID(), 
                plantelId: selectedPlantelId, 
                periodoEscolar: '2024-2025', 
                tipoFormato: activeFormat,
                docentes: [],
                seccionesPorPeriodo: {},
                horasPorMateriaPlan: {}
            });
            setCustomHeaders({});
        }
    }
  }, [selectedPlantelId, activeFormat, cuadraturaList]);

  // --- LÓGICA QUIRÚRGICA DE SINCRONIZACIÓN ---
  const syncFromRac = () => {
    if (!selectedPlantelId) return;
    
    const ejeMap: Record<TipoCuadratura, string> = {
        'INICIAL_PRIMARIA': 'EJE_INICIAL_PRIMARIA',
        'ESPECIAL': 'EJE_ESPECIAL',
        'ADULTOS': 'EJE_ADULTOS',
        'MEDIA_TECNICA_GENERAL': 'EJE_MEDIA'
    };
    
    let ejeTarget = ejeMap[activeFormat];
    // Refinamiento del Eje para Media
    if (activeFormat === 'MEDIA_TECNICA_GENERAL') {
        if (mediaSubFormat === '31059') ejeTarget = 'EJE_MEDIA_31059';
        else if (mediaSubFormat === '31060') ejeTarget = 'EJE_MEDIA_31060';
        else ejeTarget = 'EJE_TECNICA'; // Cubre tanto Técnica Estandar como Blanco
    }

    const plantelRac = rac.filter(r => r.plantelId === selectedPlantelId && (r.ejeConsolidacion === ejeTarget || (activeFormat === 'MEDIA_TECNICA_GENERAL' && (r.ejeConsolidacion as string)?.startsWith('EJE_MEDIA'))));
    
    if (plantelRac.length === 0) {
        alert(`AVISO: No se encontró personal en la nómina RAC marcado bajo el eje de consolidación: ${ejeTarget.replace('EJE_', '')}. Verifique las fichas de personal.`);
        return;
    }

    const currentCis = new Set(formData.docentes?.map(d => d.cedula));
    
    const newEntries: CuadraturaDocenteFila[] = plantelRac
        .filter(r => !currentCis.has(r.cedula))
        .map(r => {
            const distHoras: Record<string, number> = {};
            const matAsig: Record<string, number> = {};
            
            // Lógica Formato 1: Inicial/Primaria
            if (activeFormat === 'INICIAL_PRIMARIA') {
                const racGrado = (r.grado || '').toUpperCase();
                const racSeccion = (r.seccion || '').toUpperCase();
                let targetKey = '';
                if (racGrado.includes('MATERNAL') || racGrado.includes('LACTANTE')) targetKey = 'MAT';
                else if (racGrado.includes('INICIAL') || racGrado.includes('PREESCOLAR') || racGrado.includes('GRUPO')) targetKey = 'INI';
                else if (racGrado.includes('1') || racGrado.includes('PRIMER')) targetKey = '1G';
                else if (racGrado.includes('2') || racGrado.includes('SEGUNDO')) targetKey = '2G';
                else if (racGrado.includes('3') || racGrado.includes('TERCER')) targetKey = '3G';
                else if (racGrado.includes('4') || racGrado.includes('CUARTO')) targetKey = '4G';
                else if (racGrado.includes('5') || racGrado.includes('QUINTO')) targetKey = '5G';
                else if (racGrado.includes('6') || racGrado.includes('SEXTO')) targetKey = '6G';

                if (targetKey && racSeccion) {
                    const cleanSec = racSeccion.replace(/[^A-E]/g, '').charAt(0) || racSeccion.charAt(0); 
                    matAsig[`${targetKey}-${cleanSec}`] = 0; 
                }
            }

            // Lógica Formato 3/4/5: Media y Adultos
            if (activeFormat === 'MEDIA_TECNICA_GENERAL' || activeFormat === 'ADULTOS') {
                const searchSubject = (r.materia || '').toUpperCase();
                const searchYear = (r.ano || '').toUpperCase();
                const periods = activeFormat === 'ADULTOS' ? currentAdultosPeriods : currentMediaPeriods;
                periods.forEach(p => {
                    // Coincidencia laxa para el año/periodo
                    if (searchYear.includes(p.label.substring(0,3)) || searchYear === '') {
                        p.subjects.forEach(s => { 
                            // Si es editable, buscamos en el nombre personalizado (si existe) O en la clave original
                            const key = `${p.key}-${s}`;
                            const customName = customHeaders[key] ? customHeaders[key].toUpperCase() : '';
                            
                            // Coincidencia de Materia (Nombre estándar o Personalizado)
                            if (s.includes(searchSubject) || searchSubject.includes(s) || (customName && customName.includes(searchSubject))) {
                                distHoras[key] = Number(r.horasAcademicas) || 0; 
                            }
                        });
                    }
                });
            }

            // Lógica Formato 2: Especial
            if (activeFormat === 'ESPECIAL') {
                const searchGrupo = (r.grado || '').toUpperCase(); 
                CUADRATURA_ESPECIAL_COLUMNS.forEach(grp => { 
                    if (searchGrupo.includes(grp)) matAsig[grp] = 0; 
                });
            }

            return {
                id: crypto.randomUUID(),
                cedula: r.cedula,
                nombreDocente: r.nombreApellido,
                cargaHorariaRecibo: Number(r.cargaHorariaRecibo || 0),
                horasEnPlantel: Number(r.horasAcademicas || r.cargaHorariaRecibo || 0), 
                titularInterino: (r.clasificacion || '').toUpperCase().includes('INTERINO') ? 'I' : 'T',
                turno: r.turno === 'Mañana' ? 'M' : r.turno === 'Tarde' ? 'T' : 'I',
                tipoPersonal: r.tipoPersonal === 'OBRERO' ? 'Obr' : r.tipoPersonal === 'ADMINISTRATIVO' ? 'Adm' : 'Doc',
                esVacante: false,
                matriculaAsignada: matAsig,
                distribucionHoras: distHoras
            };
        });

    setFormData(prev => ({ ...prev, docentes: [...(prev.docentes || []), ...newEntries] }));
    setSuccessMsg(`Sincronización Exitosa: ${newEntries.length} docentes importados del RAC.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateDocenteField = useCallback((docId: string, field: keyof CuadraturaDocenteFila, val: any) => {
      setFormData(prev => ({
          ...prev,
          docentes: prev.docentes?.map(d => d.id === docId ? { ...d, [field]: val } : d)
      }));
  }, []);

  const updateCell = useCallback((docId: string, field: 'matriculaAsignada' | 'distribucionHoras', key: string, val: string) => {
      const numVal = val === '' ? 0 : parseInt(val);
      if (isNaN(numVal)) return;
      
      setFormData(prev => ({
          ...prev,
          docentes: prev.docentes?.map(d => {
              if (d.id !== docId) return d;
              const nestedObj = { ...(d[field] || {}) };
              if (val === '') delete nestedObj[key];
              else nestedObj[key] = numVal;
              return { ...d, [field]: nestedObj };
          })
      }));
  }, []);

  const updateHeader = (key: string, value: string) => {
      setCustomHeaders(prev => ({ ...prev, [key]: value.toUpperCase() }));
  };

  const updatePlanHours = (key: string, val: string) => {
      const numVal = val === '' ? 0 : parseInt(val);
      setFormData(prev => ({
          ...prev,
          horasPorMateriaPlan: {
              ...(prev.horasPorMateriaPlan || {}),
              [key]: numVal
          }
      }));
  };

  const updateSections = (periodoKey: string, val: string) => {
      const numVal = val === '' ? 0 : parseInt(val);
      setFormData(prev => ({
          ...prev,
          seccionesPorPeriodo: {
              ...(prev.seccionesPorPeriodo || {}),
              [periodoKey]: numVal
          }
      }));
  };

  const handleSaveData = () => {
      if (!selectedPlantelId) return;
      const recordToSave: CuadraturaRegistro = {
          ...formData,
          id: formData.id || crypto.randomUUID(), 
          plantelId: selectedPlantelId,
          tipoFormato: activeFormat,
          customSubjects: customHeaders,
          fechaCarga: new Date().toISOString(),
          docentes: formData.docentes || [],
          seccionesPorPeriodo: formData.seccionesPorPeriodo || {},
          horasPorMateriaPlan: formData.horasPorMateriaPlan || {},
          responsableNombre: formData.responsableNombre || 'DIRECTOR',
          responsableCi: formData.responsableCi || '0',
          responsableCargo: formData.responsableCargo || 'DIRECTOR',
          responsableTelefono: formData.responsableTelefono || '0'
      } as CuadraturaRegistro;
      onSaveCuadratura(recordToSave);
      setSuccessMsg(`CUADRATURA GUARDADA EXITOSAMENTE`);
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs focus:border-blue-600 shadow-sm";
  const labelStyle = "block text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 tracking-widest";
  const cellInput = "w-full h-full text-center font-black text-[10px] bg-transparent border-none outline-none focus:bg-yellow-200 transition-all p-0 m-0 placeholder-slate-200";
  const safeVal = (val: number | undefined) => (val === undefined || val === 0) ? '' : val;

  const calculateRowStats = (doc: CuadraturaDocenteFila) => {
      const horasCert = Object.values(doc.distribucionHoras || {}).reduce((acc, curr) => acc + (curr || 0), 0);
      const horasRep = (doc.cargaHorariaRecibo || 0) - horasCert;
      return { horasCert, horasRep };
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-32">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
           <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#003399] rounded-3xl text-white shadow-xl shadow-blue-100"><Calculator size={32} /></div>
                  <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Consolidador de Cuadraturas v9.8</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocolo GEMA - Mapeo Automático</p>
                  </div>
              </div>
              <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-[24px] gap-1 shadow-inner border border-slate-200">
                  <button onClick={() => setActiveFormat('INICIAL_PRIMARIA')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeFormat === 'INICIAL_PRIMARIA' ? 'bg-[#003399] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><GraduationCap size={14}/> Hoja 1: Primaria</button>
                  <button onClick={() => setActiveFormat('ESPECIAL')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeFormat === 'ESPECIAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><Layers size={14}/> Hoja 2: Especial</button>
                  <button onClick={() => setActiveFormat('MEDIA_TECNICA_GENERAL')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeFormat === 'MEDIA_TECNICA_GENERAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><BookOpen size={14}/> Hoja 3/4: Media</button>
                  <button onClick={() => setActiveFormat('ADULTOS')} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeFormat === 'ADULTOS' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}><Briefcase size={14}/> Hoja 5: Adultos</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div><label className={labelStyle}>Estado</label><select className={inputStyle} value={selectedEstado} onChange={e => setSelectedEstado(e.target.value)}><option value="">VENEZUELA</option>{Object.keys(GEOGRAFIA_VENEZUELA).map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                <div><label className={labelStyle}>Municipio</label><select className={inputStyle} value={selectedMunicipio} onChange={e => setSelectedMunicipio(e.target.value)} disabled={!selectedEstado}><option value="">TODOS</option>{selectedEstado && Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado]||{}).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className={labelStyle}>Buscar Plantel</label><input className={inputStyle} placeholder="NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div><label className={labelStyle}>Plantel Específico</label><select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}><option value="">-- SELECCIONE --</option>{filteredPlanteles.map(p => <option key={p.id} value={p.id}>{p.codigoDea} - {p.nombre.toUpperCase()}</option>)}</select></div>
           </div>
       </div>

       {selectedPlantelId && (
           <div className="space-y-6 animate-in slide-in-from-bottom-4">
               {/* BARRA DE HERRAMIENTAS DE CUADRATURA */}
               <div className="bg-white p-6 rounded-[35px] border-2 border-dashed border-slate-200 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-full"><AlertCircle size={20}/></div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-md leading-relaxed">
                                INSTRUCTIVO: {activeFormat === 'INICIAL_PRIMARIA' || activeFormat === 'ESPECIAL' ? 'Coloque la MATRÍCULA en la casilla correspondiente (NO MARQUE CON X). Si la casilla está en azul, significa que no hay docente asignado (VACANTE).' : 'Indique las HORAS ACADÉMICAS por materia.'}
                            </p>
                            
                            {/* SELECTOR DE SUB-FORMATO ADULTOS */}
                            {activeFormat === 'ADULTOS' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-orange-600">Modalidad de Carga:</span>
                                    <div className="flex bg-orange-50 rounded-lg p-1 border border-orange-100">
                                        <button onClick={() => setAdultoSubFormat('ESTANDAR')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${adultoSubFormat === 'ESTANDAR' ? 'bg-orange-500 text-white' : 'text-orange-400 hover:text-orange-600'}`}>Plan Estándar</button>
                                        <button onClick={() => setAdultoSubFormat('BLANCO')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${adultoSubFormat === 'BLANCO' ? 'bg-orange-500 text-white' : 'text-orange-400 hover:text-orange-600'}`}>Plan Alternativo (Editable)</button>
                                    </div>
                                </div>
                            )}

                            {/* SELECTOR DE SUB-FORMATO MEDIA GENERAL Y TECNICA */}
                            {activeFormat === 'MEDIA_TECNICA_GENERAL' && (
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-black uppercase text-emerald-600">Plan de Estudio:</span>
                                    <div className="flex flex-wrap bg-emerald-50 rounded-lg p-1 border border-emerald-100 gap-1">
                                        <button onClick={() => setMediaSubFormat('31059')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaSubFormat === '31059' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-100'}`}>31059 (General)</button>
                                        <button onClick={() => setMediaSubFormat('31060')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaSubFormat === '31060' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-100'}`}>31060 (Ciencia y Tec)</button>
                                        <button onClick={() => setMediaSubFormat('TECNICA')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaSubFormat === 'TECNICA' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-100'}`}>Técnica Estándar</button>
                                        <button onClick={() => setMediaSubFormat('TECNICA_BLANCO')} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${mediaSubFormat === 'TECNICA_BLANCO' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-100'}`}>Técnica Especializada (Editable)</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={syncFromRac} className="bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2 transition-all active:scale-95"><RefreshCw size={18}/> Sincronizar RAC</button>
                        <button onClick={() => setFormData(prev => ({...prev, docentes: [...(prev.docentes || []), { id: crypto.randomUUID(), cedula: 'VACANTE', nombreDocente: 'VACANTE', cargaHorariaRecibo: 0, horasEnPlantel: 0, titularInterino: 'I', turno: 'I', tipoPersonal: 'Doc', esVacante: true, matriculaAsignada: {}, distribucionHoras: {} }]}))} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2 active:scale-95"><Plus size={18}/> Añadir Vacante</button>
                    </div>
               </div>

               {/* TABLA PRINCIPAL DE CUADRATURA */}
               <div className="bg-white p-2 rounded-[40px] shadow-2xl border-4 border-slate-100 overflow-x-auto relative min-h-[500px]">
                  <table className="w-full border-collapse border-spacing-0">
                    <thead className="sticky top-0 z-[60]">
                        {activeFormat === 'ESPECIAL' ? (
                            // --- ENCABEZADO FORMATO 2: EDUCACIÓN ESPECIAL ---
                            <>
                                <tr className="bg-white text-slate-800 border-b border-slate-300">
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-[10px] font-black uppercase bg-white min-w-[90px] sticky left-0 z-50 shadow-sm">C.I.</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-[10px] font-black uppercase bg-white min-w-[200px] sticky left-[90px] z-50 shadow-sm">Nombre del Docente</th>
                                    <th rowSpan={2} className="border border-slate-300 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-white">CARGA HORARIA (RECIBO)</th>
                                    <th rowSpan={2} className="border border-slate-300 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-white">CONDICION DEL CARGO</th>
                                    <th rowSpan={2} className="border border-slate-300 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-white">TURNO (M, T, I)</th>
                                    <th rowSpan={2} className="border border-slate-300 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-white">TIPO PERSONAL (D,A,O)</th>
                                    <th colSpan={CUADRATURA_ESPECIAL_COLUMNS.length} className="border border-slate-300 p-2 text-[10px] font-black uppercase text-center bg-white">MATRICULA</th>
                                    <th rowSpan={2} className="border border-slate-300 p-4 sticky right-0 bg-white z-50"></th>
                                </tr>
                                <tr className="bg-white text-slate-800">
                                    {CUADRATURA_ESPECIAL_COLUMNS.map(grupo => <th key={grupo} className="border border-slate-300 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-32 w-8 bg-white hover:bg-yellow-50">{grupo}</th>)}
                                </tr>
                            </>
                        ) : (activeFormat === 'MEDIA_TECNICA_GENERAL' || activeFormat === 'ADULTOS') ? (
                            // --- ENCABEZADO MEDIA Y ADULTOS (CON SOPORTE PARA BLANCO/FLEXIBLE) ---
                            <>
                                <tr className={`${activeFormat === 'ADULTOS' ? 'bg-orange-600' : 'bg-emerald-600'} text-white`}>
                                    <th rowSpan={3} className="border border-white/20 p-4 text-[10px] font-black uppercase sticky left-0 z-50 min-w-[100px] bg-inherit">C.I.</th>
                                    <th rowSpan={3} className="border border-white/20 p-4 text-[10px] font-black uppercase sticky left-[100px] z-50 min-w-[200px] bg-inherit">Docente</th>
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">CARGA HORARIA</th>
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">HORAS EN PLANTEL</th>
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">TITULAR / INTERINO</th>
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">TIPO PERSONAL</th>
                                    
                                    {(activeFormat === 'ADULTOS' ? currentAdultosPeriods : currentMediaPeriods).map(p => (
                                        <th key={p.key} colSpan={p.subjects.length} className="border border-white/20 p-1 text-[10px] font-black uppercase bg-black/10 text-center">
                                            <div className="flex items-center justify-between px-2">
                                                <span>{p.label}</span>
                                                <div className="flex items-center gap-1 bg-white/20 px-2 rounded">
                                                    <span className="text-[8px]">SECC:</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-8 bg-transparent text-white font-black text-center text-[9px] border-b border-white/50 focus:outline-none"
                                                        value={safeVal(formData.seccionesPorPeriodo?.[p.key])}
                                                        onChange={e => updateSections(p.key, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                    
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">H. CERTIFICADAS</th>
                                    <th rowSpan={3} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-40 w-10 bg-inherit">H. REPROGRAMAR</th>
                                    <th rowSpan={3} className="border border-white/20 p-4 sticky right-0 bg-black/40 z-50"></th>
                                </tr>
                                <tr className={`${activeFormat === 'ADULTOS' ? 'bg-orange-700' : 'bg-emerald-700'} text-white`}>
                                    {(activeFormat === 'ADULTOS' ? currentAdultosPeriods : currentMediaPeriods).map(p => p.subjects.map(s => {
                                        const key = `${p.key}-${s}`;
                                        return (
                                            <th key={key} className="border border-white/20 p-1 text-[8px] font-black uppercase text-center h-32 w-8 [writing-mode:vertical-lr]">
                                                {isEditableFormat ? (
                                                    <input 
                                                        className="bg-transparent text-white font-black text-[8px] uppercase text-center border-none outline-none w-full h-full placeholder-white/50"
                                                        placeholder={s}
                                                        value={customHeaders[key] || ''}
                                                        onChange={e => updateHeader(key, e.target.value)}
                                                    />
                                                ) : s}
                                            </th>
                                        );
                                    }))}
                                </tr>
                                <tr className="bg-yellow-400 text-slate-900">
                                    {(activeFormat === 'ADULTOS' ? currentAdultosPeriods : currentMediaPeriods).map(p => p.subjects.map(s => {
                                        const key = `${p.key}-${s}`;
                                        return (
                                            <th key={key} className="border border-black/10 p-0 text-center h-6">
                                                <input 
                                                    type="number" 
                                                    className="w-full h-full bg-yellow-400 text-center font-black text-[9px] border-none outline-none focus:bg-white"
                                                    value={safeVal(formData.horasPorMateriaPlan?.[key])}
                                                    onChange={e => updatePlanHours(key, e.target.value)}
                                                />
                                            </th>
                                        );
                                    }))}
                                </tr>
                            </>
                        ) : (
                            // --- ENCABEZADO FORMATO 1: INICIAL Y PRIMARIA ---
                            <>
                                <tr className="bg-[#003399] text-white">
                                    <th rowSpan={2} className="border border-white/20 p-2 text-[10px] font-black uppercase bg-[#002266] min-w-[90px] sticky left-0 z-50">C.I.</th>
                                    <th rowSpan={2} className="border border-white/20 p-2 text-[10px] font-black uppercase bg-[#002266] min-w-[200px] sticky left-[90px] z-50">Nombre y Apellido</th>
                                    <th rowSpan={2} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-32 bg-[#002266] w-10">Carga Horaria</th>
                                    <th rowSpan={2} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-32 bg-[#002266] w-8">T / I</th>
                                    <th rowSpan={2} className="border border-white/20 p-1 text-[8px] font-black uppercase [writing-mode:vertical-lr] h-32 bg-[#002266] w-8">Turno</th>
                                    {CUADRATURA_IP_CONFIG.map(col => (
                                        <th key={col.key} colSpan={col.subs.length} className="border border-white/20 p-2 text-[9px] font-black uppercase text-center bg-[#004a99]">{col.label}</th>
                                    ))}
                                    <th rowSpan={2} className="border border-white/20 p-4 sticky right-0 bg-black/40 z-50 w-10"></th>
                                </tr>
                                <tr className="bg-[#003399] text-white">
                                    {CUADRATURA_IP_CONFIG.map(col => col.subs.map(s => (
                                        <th key={`${col.key}-${s}`} className="border border-white/20 text-[8px] font-black text-center w-8 bg-white text-slate-900 border-b-4 border-b-yellow-400 p-1">{s}</th>
                                    )))}
                                </tr>
                            </>
                        )}
                    </thead>
                    <tbody>
                        {(formData.docentes || []).map(doc => {
                            const { horasCert, horasRep } = calculateRowStats(doc);
                            return (
                                <tr key={doc.id} className={`hover:bg-slate-50 transition-colors border-b border-slate-200 group ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}>
                                    <td className={`border border-slate-200 p-0 sticky left-0 z-40 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}>
                                        {doc.esVacante ? <span className="block text-center text-[9px] font-black text-cyan-800">VACANTE</span> : <input className={`${cellInput} text-left px-2 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`} value={doc.cedula} readOnly />}
                                    </td>
                                    <td className={`border border-slate-200 p-0 sticky left-[90px] z-40 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}>
                                        <input className={`${cellInput} text-left px-2 uppercase font-bold ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`} value={doc.nombreDocente} onChange={e => updateDocenteField(doc.id, 'nombreDocente', e.target.value.toUpperCase())} />
                                    </td>
                                    
                                    {activeFormat === 'ESPECIAL' ? (
                                        <>
                                            <td className={`border border-slate-200 p-0 w-10 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}><input className={cellInput} value={safeVal(doc.cargaHorariaRecibo)} onChange={e => updateDocenteField(doc.id, 'cargaHorariaRecibo', parseInt(e.target.value) || 0)} /></td>
                                            <td className={`border border-slate-200 p-0 w-10 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}><input className={cellInput} value={doc.titularInterino} onChange={e => updateDocenteField(doc.id, 'titularInterino', e.target.value.toUpperCase())} /></td>
                                            <td className={`border border-slate-200 p-0 w-10 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}><input className={cellInput} value={doc.turno} onChange={e => updateDocenteField(doc.id, 'turno', e.target.value.toUpperCase())} /></td>
                                            <td className={`border border-slate-200 p-0 w-10 ${doc.esVacante ? 'bg-cyan-50' : 'bg-white'}`}><input className={cellInput} value={doc.tipoPersonal.charAt(0)} onChange={e => updateDocenteField(doc.id, 'tipoPersonal', e.target.value)} /></td>
                                            
                                            {CUADRATURA_ESPECIAL_COLUMNS.map(grp => {
                                                const hasValue = doc.matriculaAsignada[grp] !== undefined;
                                                return (
                                                    <td key={grp} className={`border border-slate-200 p-0 ${hasValue ? 'bg-yellow-100' : doc.esVacante ? 'bg-cyan-50' : ''}`}>
                                                        <input 
                                                            type="number" 
                                                            className={`${cellInput} ${hasValue ? 'bg-yellow-100 font-black' : doc.esVacante ? 'bg-cyan-50' : ''}`} 
                                                            placeholder={hasValue ? "MAT" : ""} 
                                                            value={safeVal(doc.matriculaAsignada[grp])} 
                                                            onChange={e => updateCell(doc.id, 'matriculaAsignada', grp, e.target.value)}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </>
                                    ) : (activeFormat === 'MEDIA_TECNICA_GENERAL' || activeFormat === 'ADULTOS') ? (
                                        <>
                                            <td className="border border-slate-200 p-0 w-10"><input className={cellInput} value={safeVal(doc.cargaHorariaRecibo)} onChange={e => updateDocenteField(doc.id, 'cargaHorariaRecibo', parseInt(e.target.value) || 0)} /></td>
                                            <td className="border border-slate-200 p-0 w-10"><input className={cellInput} value={safeVal(doc.horasEnPlantel)} onChange={e => updateDocenteField(doc.id, 'horasEnPlantel', parseInt(e.target.value) || 0)} /></td>
                                            <td className="border border-slate-200 p-0 w-10"><input className={cellInput} value={doc.titularInterino} onChange={e => updateDocenteField(doc.id, 'titularInterino', e.target.value.toUpperCase())} /></td>
                                            <td className="border border-slate-200 p-0 w-10"><input className={cellInput} value={doc.tipoPersonal.charAt(0)} onChange={e => updateDocenteField(doc.id, 'tipoPersonal', e.target.value.toUpperCase())} /></td>
                                            
                                            {(activeFormat === 'ADULTOS' ? currentAdultosPeriods : currentMediaPeriods).map(p => p.subjects.map(s => {
                                                const key = `${p.key}-${s}`;
                                                return <td key={key} className="border border-slate-100 p-0"><input type="number" className={cellInput} value={safeVal(doc.distribucionHoras[key])} onChange={e => updateCell(doc.id, 'distribucionHoras', key, e.target.value)}/></td>;
                                            }))}

                                            <td className="border border-slate-200 p-0 w-10 bg-gray-50"><span className="flex items-center justify-center w-full h-full text-[10px] font-black">{horasCert}</span></td>
                                            <td className={`border border-slate-200 p-0 w-10 ${horasRep < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}><span className="flex items-center justify-center w-full h-full text-[10px] font-black">{horasRep}</span></td>
                                        </>
                                    ) : (
                                        // --- FILAS FORMATO 1: INICIAL Y PRIMARIA ---
                                        <>
                                            <td className={`border border-slate-200 p-0 ${doc.esVacante ? 'bg-cyan-50' : ''}`}><input className={cellInput} value={safeVal(doc.cargaHorariaRecibo)} onChange={e => updateDocenteField(doc.id, 'cargaHorariaRecibo', parseInt(e.target.value) || 0)} /></td>
                                            <td className={`border border-slate-200 p-0 ${doc.esVacante ? 'bg-cyan-50' : ''}`}><input className={cellInput} value={doc.titularInterino} onChange={e => updateDocenteField(doc.id, 'titularInterino', e.target.value.toUpperCase())} /></td>
                                            <td className={`border border-slate-200 p-0 ${doc.esVacante ? 'bg-cyan-50' : ''}`}><input className={cellInput} value={doc.turno} onChange={e => updateDocenteField(doc.id, 'turno', e.target.value.toUpperCase())} /></td>
                                            {CUADRATURA_IP_CONFIG.map(col => col.subs.map(s => {
                                                const key = `${col.key}-${s}`;
                                                const hasValue = doc.matriculaAsignada[key] !== undefined;
                                                return (
                                                    <td key={key} className={`border border-slate-100 p-0 ${hasValue ? 'bg-yellow-50' : doc.esVacante ? 'bg-cyan-50' : ''}`}>
                                                        <input 
                                                            type="number" 
                                                            className={`${cellInput} ${hasValue ? 'font-black text-blue-800 bg-yellow-50' : doc.esVacante ? 'bg-cyan-50' : 'text-slate-300'}`} 
                                                            placeholder={hasValue ? "MAT" : "."} 
                                                            value={safeVal(doc.matriculaAsignada[key])} 
                                                            onChange={e => updateCell(doc.id, 'matriculaAsignada', key, e.target.value)}
                                                        />
                                                    </td>
                                                );
                                            }))}
                                        </>
                                    )}
                                    <td className="border border-slate-200 p-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-40"><button onClick={() => setFormData({...formData, docentes: formData.docentes?.filter(d => d.id !== doc.id)})} className="text-rose-300 hover:text-rose-600"><Trash2 size={14}/></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                  </table>
               </div>

               <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row justify-between items-center text-white gap-6">
                   <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-3xl"><FileText size={24}/></div>
                        <div>
                            <p className="text-xs font-black uppercase italic tracking-widest text-blue-200">Consolidación Hoja {activeFormat}</p>
                            <h4 className="text-sm font-bold uppercase mt-1">Guardar estado actual para auditoría regional.</h4>
                        </div>
                   </div>
                   <button onClick={handleSaveData} className="bg-white text-slate-900 py-5 px-16 rounded-2xl font-black uppercase text-[11px] shadow-xl active:scale-95 transition-all hover:bg-blue-50 tracking-widest flex items-center gap-2">
                       <Save size={24}/> Guardar Cuadratura
                   </button>
               </div>
           </div>
       )}
       {successMsg && <div className="fixed bottom-10 right-10 bg-emerald-600 text-white p-8 rounded-[35px] font-black uppercase z-[200] shadow-2xl border-4 border-emerald-400 animate-in slide-in-from-right-10 flex items-center gap-6"><CheckCircle2 size={48}/> <div>{successMsg}</div></div>}
    </div>
  );
};

export default CuadraturaManager;
