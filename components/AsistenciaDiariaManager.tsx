import React, { useState, useEffect } from 'react';
import { Plantel, AsistenciaDiariaRegistro, AsistenciaMatriculaItem, AsistenciaPersonalItem } from '../types';
import { Save, ClipboardCheck, Users, UserCog, Plus, Trash2, Calendar, MapPin, School, History, Edit, Search } from 'lucide-react';
import { GEOGRAFIA_VENEZUELA, DEPENDENCIAS, CARGOS } from '../utils/constants';

interface AsistenciaDiariaManagerProps {
  planteles: Plantel[];
  asistenciaList: AsistenciaDiariaRegistro[];
  onSaveAsistencia: (registro: AsistenciaDiariaRegistro) => void;
}

const AsistenciaDiariaManager: React.FC<AsistenciaDiariaManagerProps> = ({ planteles, asistenciaList, onSaveAsistencia }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); // Filtro
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().split('T')[0]);
  
  const [asistenciaMat, setAsistenciaMat] = useState<AsistenciaMatriculaItem[]>([]);
  const [asistenciaPers, setAsistenciaPers] = useState<AsistenciaPersonalItem[]>([]);
  
  const [responsable, setResponsable] = useState({ nombre: '', ci: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const selectedPlantel = planteles.find(p => p.id === selectedPlantelId);

  // Filtrado de planteles
  const filteredPlanteles = planteles.filter(p => 
    (!selectedEstado || p.estado === selectedEstado) && 
    (!selectedMunicipio || p.municipio === selectedMunicipio) &&
    (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categoriasPlantel = selectedPlantel 
    ? Array.from(new Set([...(selectedPlantel.niveles || []), ...(selectedPlantel.modalidades || [])]))
    : [];

  const historialPlantel = asistenciaList
    .filter(a => a.plantelId === selectedPlantelId)
    .sort((a, b) => new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime());

  useEffect(() => {
    const saved = localStorage.getItem('cdce_last_responsable');
    if (saved) {
        const d = JSON.parse(saved);
        setResponsable({ nombre: d.nombre || '', ci: d.ci || '' });
    }
  }, []);

  useEffect(() => {
    if (selectedPlantelId && fechaReporte) {
        const existing = asistenciaList.find(a => a.plantelId === selectedPlantelId && a.fechaReporte === fechaReporte);
        if (existing) {
          setAsistenciaMat(existing.asistenciaMatricula || []);
          setAsistenciaPers(existing.asistenciaPersonal || []);
        } else {
          setAsistenciaMat([]);
          setAsistenciaPers([]);
        }
    }
  }, [selectedPlantelId, fechaReporte, asistenciaList]);

  const addMatRow = () => {
    const defaultCat = categoriasPlantel[0] || 'Primaria';
    setAsistenciaMat([...asistenciaMat, { 
        dependencia: selectedPlantel?.dependencia || 'Nacional', 
        nivel: defaultCat, 
        modalidad: '', 
        femenino: 0, 
        masculino: 0 
    }]);
  };

  const addPersRow = () => {
    const defaultCat = categoriasPlantel[0] || 'Primaria';
    setAsistenciaPers([...asistenciaPers, { 
        cargo: 'Docente', 
        nivel: defaultCat, 
        modalidad: '', 
        femenino: 0, 
        masculino: 0 
    }]);
  };

  const removeMatRow = (idx: number) => setAsistenciaMat(asistenciaMat.filter((_, i) => i !== idx));
  const removePersRow = (idx: number) => setAsistenciaPers(asistenciaPers.filter((_, i) => i !== idx));

  const updateMatRow = (idx: number, field: keyof AsistenciaMatriculaItem, val: any) => {
    const copy = [...asistenciaMat];
    copy[idx] = { ...copy[idx], [field]: val };
    setAsistenciaMat(copy);
  };

  const updatePersRow = (idx: number, field: keyof AsistenciaPersonalItem, val: any) => {
    const copy = [...asistenciaPers];
    copy[idx] = { ...copy[idx], [field]: val };
    setAsistenciaPers(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantelId) return;

    onSaveAsistencia({
      id: asistenciaList.find(a => a.plantelId === selectedPlantelId && a.fechaReporte === fechaReporte)?.id || crypto.randomUUID(),
      plantelId: selectedPlantelId,
      fechaReporte,
      asistenciaMatricula: asistenciaMat,
      asistenciaPersonal: asistenciaPers,
      responsableNombre: responsable.nombre.toUpperCase(),
      responsableCi: responsable.ci
    });

    setSuccessMsg("¡REPORTE DIARIO PROCESADO CORRECTAMENTE!");
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadFromHistory = (record: AsistenciaDiariaRegistro) => {
      setFechaReporte(record.fechaReporte);
      setAsistenciaMat(record.asistenciaMatricula);
      setAsistenciaPers(record.asistenciaPersonal);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputStyle = "w-full rounded-lg border-2 border-slate-200 p-2 bg-white text-black font-bold uppercase text-[10px] focus:border-blue-500 outline-none";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-1 mb-1";

  const totalMat = asistenciaMat.reduce((a, b) => a + b.femenino + b.masculino, 0);
  const totalPers = asistenciaPers.reduce((a, b) => a + b.femenino + b.masculino, 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
          <ClipboardCheck className="text-[#004a99]" size={28} /> Reporte de Asistencia Diaria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Fecha de Reporte</label>
                <input type="date" className={inputStyle} value={fechaReporte} onChange={e => setFechaReporte(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Estado</label>
                <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}>
                    <option value="">TODOS LOS ESTADOS</option>
                    {Object.keys(GEOGRAFIA_VENEZUELA).sort().map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Municipio</label>
                <select className={inputStyle} value={selectedMunicipio} onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId('');}} disabled={!selectedEstado}>
                    <option value="">TODOS LOS MUNICIPIOS</option>
                    {selectedEstado && Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado] || {}).sort().map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
            </div>
            {/* NUEVO FILTRO DE BÚSQUEDA */}
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Buscar Plantel</label>
                <div className="relative">
                    <input className={inputStyle} placeholder="NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Institución Educativa</label>
                <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}>
                    <option value="">-- SELECCIONE UN PLANTEL --</option>
                    {filteredPlanteles.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
        </div>
      </div>

      {selectedPlantel && (
        <>
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4">
           {/* SECCION ESTUDIANTES */}
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Users className="text-emerald-600" />
                    <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-700">Asistencia de Estudiantes</h3>
                  </div>
                  <button type="button" onClick={addMatRow} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 shadow-md">
                    <Plus size={14}/> Añadir Nivel/Modalidad
                  </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-3 text-left">Dependencia</th>
                      <th className="p-3 text-left">Nivel / Modalidad</th>
                      <th className="p-3 text-center w-28">Fem. Presentes</th>
                      <th className="p-3 text-center w-28">Masc. Presentes</th>
                      <th className="p-3 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asistenciaMat.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-2">
                          <select className={inputStyle} value={row.dependencia} onChange={e => updateMatRow(i, 'dependencia', e.target.value)}>
                            {DEPENDENCIAS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className={inputStyle} value={row.nivel} onChange={e => updateMatRow(i, 'nivel', e.target.value)}>
                            {categoriasPlantel.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" className={inputStyle + " text-center text-pink-600"} value={row.femenino} onChange={e => updateMatRow(i, 'femenino', parseInt(e.target.value)||0)} />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" className={inputStyle + " text-center text-blue-600"} value={row.masculino} onChange={e => updateMatRow(i, 'masculino', parseInt(e.target.value)||0)} />
                        </td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => removeMatRow(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {asistenciaMat.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-bold uppercase text-[9px] italic">Pulse "Añadir" para registrar asistencia de alumnos</td></tr>
                    )}
                  </tbody>
                  {asistenciaMat.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-[10px] uppercase">
                        <td colSpan={2} className="p-3 text-right tracking-widest">Total Alumnos Asistentes:</td>
                        <td colSpan={2} className="p-3 text-center text-sm">{totalMat}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
           </div>

           {/* SECCION PERSONAL */}
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <UserCog className="text-blue-600" />
                    <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-700">Asistencia de Personal</h3>
                  </div>
                  <button type="button" onClick={addPersRow} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-blue-700 shadow-md">
                    <Plus size={14}/> Añadir Cargo
                  </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-3 text-left">Cargo</th>
                      <th className="p-3 text-left">Área (Nivel/Modalidad)</th>
                      <th className="p-3 text-center w-28">Fem. Presentes</th>
                      <th className="p-3 text-center w-28">Masc. Presentes</th>
                      <th className="p-3 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asistenciaPers.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-2">
                          <select className={inputStyle} value={row.cargo} onChange={e => updatePersRow(i, 'cargo', e.target.value)}>
                            {CARGOS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className={inputStyle} value={row.nivel} onChange={e => updatePersRow(i, 'nivel', e.target.value)}>
                            {categoriasPlantel.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" className={inputStyle + " text-center text-pink-600"} value={row.femenino} onChange={e => updatePersRow(i, 'femenino', parseInt(e.target.value)||0)} />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" className={inputStyle + " text-center text-blue-600"} value={row.masculino} onChange={e => updatePersRow(i, 'masculino', parseInt(e.target.value)||0)} />
                        </td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => removePersRow(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {asistenciaPers.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-bold uppercase text-[9px] italic">Pulse "Añadir" para registrar asistencia de personal</td></tr>
                    )}
                  </tbody>
                  {asistenciaPers.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black text-[10px] uppercase">
                        <td colSpan={2} className="p-3 text-right tracking-widest">Total Personal Asistente:</td>
                        <td colSpan={2} className="p-3 text-center text-sm">{totalPers}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl">
                <h3 className="text-[10px] font-black text-blue-400 uppercase mb-8 tracking-[0.3em] border-b border-white/10 pb-4 text-center">Datos del Responsable del Reporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div><label className="text-[9px] font-black text-white/30 uppercase ml-2 mb-1">Nombre y Apellido</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.nombre} onChange={e => setResponsable({...responsable, nombre: e.target.value.toUpperCase()})} /></div>
                    <div><label className="text-[9px] font-black text-white/30 uppercase ml-2 mb-1">Cédula de Identidad</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.ci} onChange={e => setResponsable({...responsable, ci: e.target.value.toUpperCase()})} /></div>
                </div>
            </div>

            <div className="flex justify-center pt-4">
              <button type="submit" className="bg-[#004a99] hover:bg-blue-800 text-white font-black py-5 px-20 rounded-[32px] shadow-2xl transition-all active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em] text-xs">
                <Save size={24}/> Procesar y Enviar Reporte
              </button>
            </div>
            {successMsg && <div className="p-5 bg-emerald-600 text-white font-black rounded-3xl text-center animate-bounce uppercase shadow-2xl border-2 border-emerald-400">{successMsg}</div>}
        </form>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-12 mb-20">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                <History className="text-emerald-600" size={24} /> Historial de Reportes por Plantel
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-5">FECHA REPORTE</th>
                            <th className="px-6 py-5 text-center">MATRÍCULA ASISTENTE</th>
                            <th className="px-6 py-5 text-center">PERSONAL ASISTENTE</th>
                            <th className="px-6 py-5 text-center">RESPONSABLE</th>
                            <th className="px-6 py-5 text-center">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historialPlantel.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin reportes registrados para este plantel</td></tr>
                        ) : (
                            historialPlantel.map(reg => {
                                const totalM = reg.asistenciaMatricula.reduce((a,b) => a + b.femenino + b.masculino, 0);
                                const totalP = reg.asistenciaPersonal.reduce((a,b) => a + b.femenino + b.masculino, 0);
                                return (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-600">{new Date(reg.fechaReporte).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest bg-blue-50 text-blue-700 border-blue-100">
                                                {totalM} ESTUDIANTES
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900 text-sm">
                                            <span className="px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest bg-purple-50 text-purple-700 border-purple-100">
                                                {totalP} FUNCIONARIOS
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-widest text-[10px]">{reg.responsableNombre}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => loadFromHistory(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="VER REPORTE"><Edit size={18}/></button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </>
      )}
    </div>
  );
};

export default AsistenciaDiariaManager;