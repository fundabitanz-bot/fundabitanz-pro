import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, MatriculaRegistro, CuadraturaRegistro, RacRegistro, NecesidadMateria, PersonnelCriteria } from '../types';
import { MATERIAS_NECESIDAD_MG, MATERIAS_NECESIDAD_MT_BASICA, MATERIAS_NECESIDAD_CT_31060, GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { Calculator, Save, Building2, UserSquare, BookOpen, GraduationCap, Users, UserCog, ChefHat, ShieldAlert, Brush, LayoutGrid, Clock, Baby, School, Microscope, Briefcase, FileSpreadsheet, Search, BrainCircuit, RefreshCw } from 'lucide-react';

interface NecesidadesManagerProps {
    planteles: Plantel[];
    matricula: MatriculaRegistro[];
    rac: RacRegistro[];
    cuadraturaList: CuadraturaRegistro[];
    onSaveNecesidades: (r: CuadraturaRegistro) => void;
    criteria?: PersonnelCriteria;
}

const NecesidadesManager: React.FC<NecesidadesManagerProps> = ({ planteles, matricula, rac, cuadraturaList, onSaveNecesidades, criteria }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CuadraturaRegistro>>({});
  const [successMsg, setSuccessMsg] = useState('');
  
  const [generalData, setGeneralData] = useState({ 
    turnos: '', espacios: 0,
    matInicial: 0, matPrimaria: 0, matEspecial: 0, matMediaGen: 0, matMediaTec: 0, matAdultos: 0, 
    secInicial: 0, secPrimaria: 0, secEspecial: 0, secMediaGen: 0, secMediaTec: 0, secAdultos: 0 
  });

  const activeCriteria = criteria || {
    docentesPorAlumno: { "Primaria": 35, "Media General": 40, "Preescolar": 25, "Maternal": 15 },
    administrativosPorAlumno: 250,
    aseadoresPorEspacio: 8,
    cocinerosPorAlumno: 150,
    vigilantesPorEspacio: 6
  };

  const filteredPlanteles = useMemo(() => {
    return planteles.filter(p => 
      (!selectedEstado || p.estado === selectedEstado) && 
      (!selectedMunicipio || p.municipio === selectedMunicipio) &&
      (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigoDea.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [planteles, selectedEstado, selectedMunicipio, searchTerm]);

  const selectedPlantel = planteles.find(p => p.id === selectedPlantelId);

  // Added Fix: Define the missing updateSubjectNeed function to handle updates of nested subject needs
  const updateSubjectNeed = (
    section: 'necesidadMediaGeneral' | 'necesidadMediaTecnica' | 'necesidadMediaTecnicaExpansion' | 'necesidadAdultos',
    subject: string,
    field: keyof NecesidadMateria,
    value: number
  ) => {
    setFormData(prev => {
        const currentSection = (prev[section] as Record<string, NecesidadMateria>) || {};
        return {
            ...prev,
            [section]: {
                ...currentSection,
                [subject]: {
                    ...(currentSection[subject] || { horas: 0, docentes: 0 }),
                    [field]: value
                }
            }
        };
    });
  };

  useEffect(() => {
    if (selectedPlantelId && selectedPlantel) {
        const totalEspacios = Object.values(selectedPlantel.espaciosFisicos || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        const turnosStr = (selectedPlantel.turnos || []).join(' / ').toUpperCase();

        const getMatAndSec = (n: string[]) => {
            const recs = matricula.filter(m => m.plantelId === selectedPlantelId && n.some(lvl => m.nivel.toUpperCase().includes(lvl.toUpperCase())));
            if(recs.length === 0) return { mat: 0, sec: 0 };
            const latestByNivel = new Map<string, MatriculaRegistro>();
            recs.sort((a,b) => new Date(a.fechaCarga).getTime() - new Date(a.fechaCarga).getTime()).forEach(r => latestByNivel.set(r.nivel, r));
            const uniqueRecs = Array.from(latestByNivel.values());
            return { mat: uniqueRecs.reduce((a,b) => a + (b.inscriptosFemenino + b.inscriptosMasculino), 0), sec: uniqueRecs.reduce((a,b) => a + (b.cantidadSecciones || 0), 0) };
        };

        setGeneralData({ 
            turnos: turnosStr,
            espacios: totalEspacios,
            matInicial: getMatAndSec(['Maternal', 'Preescolar']).mat, secInicial: getMatAndSec(['Maternal', 'Preescolar']).sec, 
            matPrimaria: getMatAndSec(['Primaria']).mat, secPrimaria: getMatAndSec(['Primaria']).sec, 
            matEspecial: getMatAndSec(['Especial']).mat, secEspecial: getMatAndSec(['Especial']).sec, 
            matMediaGen: getMatAndSec(['Media General']).mat, secMediaGen: getMatAndSec(['Media General']).sec, 
            matMediaTec: getMatAndSec(['Media Técnica']).mat, secMediaTec: getMatAndSec(['Media Técnica']).sec, 
            matAdultos: getMatAndSec(['Adultos']).mat, secAdultos: getMatAndSec(['Adultos']).sec 
        });

        const existing = cuadraturaList.find(c => c.plantelId === selectedPlantelId);
        if (existing) {
            setFormData({ ...existing });
        } else {
            setFormData({ 
                plantelId: selectedPlantelId, 
                necesidadInicial: 0, necesidadPrimaria: 0, necesidadEspecial: 0, 
                necesidadMediaGeneral: {}, necesidadMediaTecnica: {}, necesidadMediaTecnicaExpansion: {}, necesidadAdultos: {}, 
                necesidadAdministrativo: 0, necesidadAseador: 0, necesidadVigilante: 0, necesidadCocinero: 0,
                responsableNombre: selectedPlantel.director || '',
                responsableCi: selectedPlantel.ciDirector || '',
                responsableCargo: 'DIRECTOR',
                responsableTelefono: selectedPlantel.telefono || ''
            });
        }
    }
  }, [selectedPlantelId, selectedPlantel, matricula, cuadraturaList]);

  // LOGICA DE CALCULO AUTOMATICO DE BRECHA
  const handleAutoCalculate = () => {
      if (!selectedPlantel) return;
      const pRac = rac.filter(r => r.plantelId === selectedPlantelId && r.situacionTrabajador === 'ACTIVO');
      
      const calcGap = (req: number, real: number) => Math.max(0, req - real);

      const dRealIni = pRac.filter(r => r.especialidad?.includes('INICIAL') || r.grado?.includes('GRUPO')).length;
      const dRealPri = pRac.filter(r => r.especialidad?.includes('PRIMARIA') || r.grado?.includes('GRADO')).length;
      const dRealEsp = pRac.filter(r => r.tipoPersonal === 'DOCENTE' && r.especialidad?.includes('ESPECIAL')).length;
      const admReal = pRac.filter(r => r.tipoPersonal === 'ADMINISTRATIVO').length;
      const cocReal = pRac.filter(r => (r.funcion || '').includes('COCINERO')).length;
      const aseReal = pRac.filter(r => (r.funcion || '').includes('ASEADOR')).length;
      const vigReal = pRac.filter(r => (r.funcion || '').includes('VIGILANTE')).length;

      const totalMat = generalData.matInicial + generalData.matPrimaria + generalData.matMediaGen + generalData.matMediaTec + generalData.matAdultos + generalData.matEspecial;

      setFormData(prev => ({
          ...prev,
          necesidadInicial: calcGap(Math.ceil(generalData.matInicial / 25), dRealIni),
          necesidadPrimaria: calcGap(Math.ceil(generalData.matPrimaria / 35), dRealPri),
          necesidadEspecial: calcGap(generalData.secEspecial, dRealEsp),
          necesidadAdministrativo: calcGap(Math.ceil(totalMat / activeCriteria.administrativosPorAlumno), admReal),
          necesidadCocinero: calcGap(Math.ceil(totalMat / activeCriteria.cocinerosPorAlumno), cocReal),
          necesidadAseador: calcGap(Math.ceil(generalData.espacios / activeCriteria.aseadoresPorEspacio), aseReal),
          necesidadVigilante: calcGap(Math.ceil(generalData.espacios / activeCriteria.vigilantesPorEspacio), vigReal),
      }));

      setSuccessMsg("¡BRECHAS CALCULADAS POR INTELIGENCIA DE DATOS!");
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";
  const statBoxStyle = "bg-white p-3 rounded-2xl border-2 border-slate-100 text-center font-black text-xs text-slate-800 shadow-inner";

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tight"><Calculator className="text-orange-600" size={28} /> Módulo de Necesidades Institucionales</h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div><label className={labelStyle}>Estado</label>
                    <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}><option value="">VENEZUELA</option>{Object.keys(GEOGRAFIA_VENEZUELA).map(e => <option key={e} value={e}>{e}</option>)}</select>
                </div>
                <div><label className={labelStyle}>Municipio</label>
                    <select className={inputStyle} value={selectedMunicipio} onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId('');}} disabled={!selectedEstado}><option value="">TODOS</option>{selectedEstado && Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado]||{}).map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
                <div>
                    <label className={labelStyle}>Buscar por Nombre o DEA</label>
                    <div className="relative">
                        <input className={inputStyle} placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    </div>
                </div>
                <div><label className={labelStyle}>Plantel</label>
                    <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}><option value="">-- SELECCIONE --</option>{filteredPlanteles.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}</select>
                </div>
           </div>
       </div>

       {selectedPlantelId && (
           <form onSubmit={(e) => { e.preventDefault(); onSaveNecesidades(formData as CuadraturaRegistro); setSuccessMsg("¡DATOS DE NECESIDAD GUARDADOS!"); setTimeout(() => setSuccessMsg(''), 2000); }} className="space-y-8 animate-in slide-in-from-bottom-4">
               
               <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row justify-between items-center text-white gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-orange-600 rounded-3xl animate-pulse"><BrainCircuit size={32}/></div>
                        <div>
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">Asistente de Necesidades</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase">Calcula automáticamente el déficit según Matrícula y Espacios.</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleAutoCalculate} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-xs hover:bg-orange-400 transition-all flex items-center gap-3">
                        <RefreshCw size={20}/> Ejecutar Cálculo de Brechas
                    </button>
               </div>

               {/* 1. DATOS GENERALES SINCRONIZADOS */}
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-[#003399] border-b border-yellow-400 pb-2 mb-8 uppercase tracking-tighter flex items-center gap-3"><Building2 size={24}/> 1. Datos Generales (Sincronizado con Plantel)</h3>
                   <div className="grid grid-cols-7 gap-3 text-[10px] font-black text-center uppercase tracking-tighter">
                       <div className="bg-slate-100 py-4 flex items-center justify-center rounded-2xl">CONCEPTO</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">INICIAL</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">PRIMARIA</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">ESPECIAL</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">MEDIA GEN.</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">MEDIA TEC.</div>
                       <div className="bg-slate-50 py-4 rounded-2xl">ADULTOS</div>
                       
                       <div className="bg-purple-100 py-4 text-purple-800 flex items-center justify-center gap-1 rounded-2xl"><Clock size={12}/> TURNOS</div>
                       <div className="col-span-6 bg-white p-4 rounded-2xl border-2 border-slate-100 text-center font-black text-xs text-purple-700 uppercase tracking-widest">{generalData.turnos || 'SIN TURNOS ASIGNADOS'}</div>

                       <div className="bg-orange-100 py-4 text-orange-800 flex items-center justify-center gap-1 rounded-2xl"><LayoutGrid size={12}/> ESPACIOS</div>
                       <div className="col-span-6 bg-white p-4 rounded-2xl border-2 border-slate-100 text-center font-black text-xs text-orange-700 uppercase">{generalData.espacios} ESPACIOS FÍSICOS TOTALES</div>

                       <div className="bg-blue-100 py-4 text-blue-800 flex items-center justify-center rounded-2xl">MATRÍCULA</div>
                       <div className={statBoxStyle}>{generalData.matInicial}</div>
                       <div className={statBoxStyle}>{generalData.matPrimaria}</div>
                       <div className={statBoxStyle}>{generalData.matEspecial}</div>
                       <div className={statBoxStyle}>{generalData.matMediaGen}</div>
                       <div className={statBoxStyle}>{generalData.matMediaTec}</div>
                       <div className={statBoxStyle}>{generalData.matAdultos}</div>
                       
                       <div className="bg-emerald-100 py-4 text-emerald-800 flex items-center justify-center rounded-2xl">SECCIONES</div>
                       <div className={statBoxStyle}>{generalData.secInicial}</div>
                       <div className={statBoxStyle}>{generalData.secPrimaria}</div>
                       <div className={statBoxStyle}>{generalData.secEspecial}</div>
                       <div className={statBoxStyle}>{generalData.secMediaGen}</div>
                       <div className={statBoxStyle}>{generalData.secMediaTec}</div>
                       <div className={statBoxStyle}>{generalData.secAdultos}</div>
                   </div>
               </div>

               {/* 2. ANALISIS DOCENTE AULA */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-[#003399] border-b border-yellow-400 pb-2 mb-10 uppercase tracking-tighter flex items-center gap-3"><UserSquare size={24}/> 2. Necesidad Docente Aula (Integral)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <label className={labelStyle}><Baby size={14} className="inline mr-1 text-pink-500"/> Docentes Inicial</label>
                            <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadInicial || 0} onChange={e => setFormData({...formData, necesidadInicial: parseInt(e.target.value)||0})} />
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <label className={labelStyle}><School size={14} className="inline mr-1 text-blue-500"/> Docentes Primaria</label>
                            <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadPrimaria || 0} onChange={e => setFormData({...formData, necesidadPrimaria: parseInt(e.target.value)||0})} />
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center group hover:bg-white hover:shadow-xl transition-all">
                            <label className={labelStyle}><Users size={14} className="inline mr-1 text-emerald-500"/> Docentes Especial</label>
                            <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadEspecial || 0} onChange={e => setFormData({...formData, necesidadEspecial: parseInt(e.target.value)||0})} />
                        </div>
                   </div>
               </div>

               {/* 3. MALLA CURRICULAR EXTENDIDA */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-[#003399] border-b border-yellow-400 pb-2 mb-8 uppercase tracking-tighter flex items-center gap-3"><BookOpen size={24}/> 3. Análisis de Malla Curricular (Media General / Técnica / Expansión)</h3>
                   <div className="space-y-8">
                       <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 shadow-inner">
                            <h4 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2"><FileSpreadsheet size={16}/> Media General (Plan 31059)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                {MATERIAS_NECESIDAD_MG.map(m => (
                                    <div key={m} className="grid grid-cols-12 gap-2 items-center border-b border-slate-200 pb-2">
                                        <div className="col-span-6 font-black text-[9px] uppercase text-slate-600">{m}</div>
                                        <div className="col-span-3">
                                            <input type="number" placeholder="HRS" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={formData.necesidadMediaGeneral?.[m]?.horas || ''} onChange={e => updateSubjectNeed('necesidadMediaGeneral', m, 'horas', parseInt(e.target.value)||0)} />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="number" placeholder="DOC" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={formData.necesidadMediaGeneral?.[m]?.docentes || ''} onChange={e => updateSubjectNeed('necesidadMediaGeneral', m, 'docentes', parseInt(e.target.value)||0)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="p-8 bg-emerald-50/50 rounded-[40px] border-2 border-emerald-100 shadow-sm">
                                <h4 className="font-black text-emerald-800 mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2"><Microscope size={16}/> Media Técnica (Básica)</h4>
                                <div className="space-y-2">
                                    {MATERIAS_NECESIDAD_MT_BASICA.map(m => (
                                        <div key={m} className="grid grid-cols-12 gap-2 items-center border-b border-emerald-200 pb-2">
                                            <div className="col-span-6 font-black text-[9px] uppercase text-emerald-900">{m}</div>
                                            <div className="col-span-3"><input type="number" placeholder="HRS" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={formData.necesidadMediaTecnica?.[m]?.horas || ''} onChange={e => updateSubjectNeed('necesidadMediaTecnica', m, 'horas', parseInt(e.target.value)||0)} /></div>
                                            <div className="col-span-3"><input type="number" placeholder="DOC" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={formData.necesidadMediaTecnica?.[m]?.docentes || ''} onChange={e => updateSubjectNeed('necesidadMediaTecnica', m, 'docentes', parseInt(e.target.value)||0)} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 bg-orange-50/50 rounded-[40px] border-2 border-orange-100 shadow-sm">
                                <h4 className="font-black text-orange-800 mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2"><Briefcase size={16}/> Expansión / Técnica Profesional</h4>
                                <div className="space-y-2">
                                    {["INFORMÁTICA", "COMERCIO", "MECANIZACIÓN", "AGROPECUARIA", "CONTABILIDAD", "ELECTRICIDAD", "ALIMENTOS"].map(m => (
                                        <div key={m} className="grid grid-cols-12 gap-2 items-center border-b border-orange-200 pb-2">
                                            <div className="col-span-6 font-black text-[9px] uppercase text-orange-900">{m}</div>
                                            <div className="col-span-3"><input type="number" placeholder="HRS" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={(formData as any).necesidadMediaTecnicaExpansion?.[m]?.horas || ''} onChange={e => updateSubjectNeed('necesidadMediaTecnicaExpansion', m, 'horas', parseInt(e.target.value)||0)} /></div>
                                            <div className="col-span-3"><input type="number" placeholder="DOC" className="w-full text-center rounded-lg border-2 border-slate-200 py-1 font-black text-xs" value={(formData as any).necesidadMediaTecnicaExpansion?.[m]?.docentes || ''} onChange={e => updateSubjectNeed('necesidadMediaTecnicaExpansion', m, 'docentes', parseInt(e.target.value)||0)} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                       </div>
                   </div>
               </div>

               {/* 4. PERSONAL DE APOYO */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-[#003399] border-b border-yellow-400 pb-2 mb-8 uppercase tracking-tighter flex items-center gap-3"><UserCog size={24}/> 4. Personal de Apoyo y Servicios</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center">
                           <label className={labelStyle}><UserCog size={14} className="inline mr-1"/> Administrativo</label>
                           <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadAdministrativo || 0} onChange={e => setFormData({...formData, necesidadAdministrativo: parseInt(e.target.value)||0})} />
                       </div>
                       <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center">
                           <label className={labelStyle}><Brush size={14} className="inline mr-1"/> Obrero / Aseador</label>
                           <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadAseador || 0} onChange={e => setFormData({...formData, necesidadAseador: parseInt(e.target.value)||0})} />
                       </div>
                       <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center">
                           <label className={labelStyle}><ChefHat size={14} className="inline mr-1"/> Cocinero(a)</label>
                           <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadCocinero || 0} onChange={e => setFormData({...formData, necesidadCocinero: parseInt(e.target.value)||0})} />
                       </div>
                       <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 text-center">
                           <label className={labelStyle}><ShieldAlert size={14} className="inline mr-1"/> Vigilante</label>
                           <input type="number" className="w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0" value={formData.necesidadVigilante || 0} onChange={e => setFormData({...formData, necesidadVigilante: parseInt(e.target.value)||0})} />
                       </div>
                   </div>
               </div>

               <div className="flex justify-end pt-4"><button type="submit" className="bg-[#003399] text-white font-black py-5 px-16 rounded-[28px] shadow-2xl uppercase tracking-widest flex items-center gap-4 transition-all active:scale-95 text-xs"><Save size={24}/> Guardar Malla de Necesidades</button></div>
               {successMsg && <div className="fixed bottom-10 right-10 bg-emerald-600 text-white p-5 rounded-2xl text-center font-black uppercase shadow-2xl animate-in fade-in z-50">{successMsg}</div>}
           </form>
       )}
    </div>
  );
};

export default NecesidadesManager;