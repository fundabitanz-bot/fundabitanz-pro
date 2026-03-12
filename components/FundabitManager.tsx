import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, FundabitRegistro, TutorCbit } from '../types';
import { PcCase, Save, AlertCircle, Monitor, Users, History, Edit, Trash2, X, MapPin, Search } from 'lucide-react';
import { GEOGRAFIA_VENEZUELA } from '../utils/constants';

interface FundabitManagerProps {
  planteles: Plantel[];
  initialPlantelId?: string;
  fundabitList: FundabitRegistro[];
  onSaveFundabit: (registro: FundabitRegistro) => void;
  onDeleteFundabit: (id: string) => void;
}

const FundabitManager: React.FC<FundabitManagerProps> = ({ planteles, initialPlantelId, fundabitList, onSaveFundabit, onDeleteFundabit }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<FundabitRegistro>>({ poseeCbit: false, estaActivo: false, equiposOperativos: 0, tieneInternet: false, tutores: [] });
  
  useEffect(() => {
    if (initialPlantelId) {
      const p = planteles.find(pl => pl.id === initialPlantelId);
      if(p) { 
          setSelectedEstado(p.estado || 'ANZOATEGUI');
          setSelectedMunicipio(p.municipio); 
          setSelectedPlantelId(initialPlantelId); 
      }
    }
  }, [initialPlantelId, planteles]);

  const filteredPlantelesList = useMemo(() => {
    return planteles.filter(p => 
      (!selectedEstado || p.estado === selectedEstado) && 
      (!selectedMunicipio || p.municipio === selectedMunicipio) &&
      (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigoDea.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [planteles, selectedEstado, selectedMunicipio, searchTerm]);

  const selectedPlantel = planteles.find(p => p.id === selectedPlantelId);
  const plantelHistory = fundabitList.filter(f => f.plantelId === selectedPlantelId).sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());

  const handleUpdateTutorsCount = (count: number) => {
      const current = formData.tutores || [];
      if (count > current.length) {
          const newTutors = [...current];
          for(let i=0; i < count - current.length; i++) newTutors.push({ id: crypto.randomUUID(), nombreCompleto: '', cedula: '', telefono: '', correo: '', dependencia: 'MPPE' });
          setFormData({...formData, tutores: newTutors});
      } else if (count < current.length) setFormData({...formData, tutores: current.slice(0, count)});
  };

  const updateTutor = (idx: number, field: keyof TutorCbit, value: string) => {
      const newTutors = [...(formData.tutores || [])];
      newTutors[idx] = { ...newTutors[idx], [field]: value.toUpperCase() };
      setFormData({...formData, tutores: newTutors});
  };

  const handleEditRecord = (reg: FundabitRegistro) => {
      setEditingId(reg.id);
      setIsEditing(true);
      setFormData(reg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setIsEditing(false);
      setEditingId(null);
      setFormData({ poseeCbit: false, estaActivo: false, equiposOperativos: 0, tieneInternet: false, tutores: [] });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPlantelId) return;
      onSaveFundabit({ 
          id: editingId || crypto.randomUUID(), 
          plantelId: selectedPlantelId, 
          fechaCarga: new Date().toISOString(), 
          poseeCbit: formData.poseeCbit || false, 
          estaActivo: formData.estaActivo, 
          equiposOperativos: formData.equiposOperativos, 
          tieneInternet: formData.tieneInternet, 
          tutores: formData.tutores || [] 
      } as FundabitRegistro);
      
      setSuccessMsg(isEditing ? "¡REGISTRO ACTUALIZADO EXITOSAMENTE!" : "¡DATOS DE FUNDABIT GUARDADOS!");
      if(isEditing) cancelEdit();
      else setFormData({ poseeCbit: false, estaActivo: false, equiposOperativos: 0, tieneInternet: false, tutores: [] });
      
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

  if (planteles.length === 0) return (
      <div className="bg-red-50 p-10 rounded-[40px] border-2 border-dashed border-red-200 flex flex-col items-center gap-4 text-red-700 uppercase font-black text-center animate-in zoom-in"><AlertCircle size={48} /><p>Debe registrar planteles para acceder al módulo de gestión tecnológica Fundabit.</p></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tight">
                <PcCase className="text-red-600" size={28} /> Gestión Fundabit / CBIT
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex flex-col gap-1">
                    <label className={labelStyle}>Estado</label>
                    <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}>
                        <option value="">VENEZUELA (TODOS)</option>
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
                <div className="flex flex-col gap-1">
                    <label className={labelStyle}>Buscar por Nombre o DEA</label>
                    <div className="relative">
                        <input className={inputStyle} placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className={labelStyle}>Plantel Específico</label>
                    <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}>
                        <option value="">-- SELECCIONE UN PLANTEL --</option>
                        {filteredPlantelesList.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                    </select>
                </div>
           </div>
       </div>

       {selectedPlantel && (
           <>
           <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4">
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
                       <h3 className="font-black text-slate-700 flex items-center gap-3 uppercase text-[11px] tracking-widest"><Monitor size={20} className="text-red-600"/> Caracterización del Centro Tecnológico</h3>
                       {isEditing && <button type="button" onClick={cancelEdit} className="text-red-500 font-black flex items-center gap-2 text-[10px] uppercase border-2 border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-50 transition-all"><X size={16}/> Cancelar</button>}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-slate-400/20 flex items-center justify-between shadow-inner">
                           <span className="font-black text-slate-800 uppercase text-xs tracking-widest">¿Cuenta con CBIT activo?</span>
                           <div className="flex gap-3">
                               <button type="button" onClick={() => setFormData({...formData, poseeCbit: true})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${formData.poseeCbit ? 'bg-red-600 text-white border-red-700 shadow-lg' : 'bg-white text-slate-300 border-slate-100'}`}>SI</button>
                               <button type="button" onClick={() => setFormData({...formData, poseeCbit: false, estaActivo: false, equiposOperativos: 0, tieneInternet: false, tutores: []})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${!formData.poseeCbit ? 'bg-slate-700 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-300 border-slate-100'}`}>NO</button>
                           </div>
                       </div>
                       {formData.poseeCbit && (
                           <div className="bg-emerald-50/50 p-8 rounded-[32px] border-2 border-emerald-100 flex items-center justify-between shadow-sm">
                               <span className="font-black text-emerald-800 uppercase text-xs tracking-widest">Estatus de Operatividad</span>
                               <div className="flex gap-3">
                                   <button type="button" onClick={() => setFormData({...formData, estaActivo: true})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${formData.estaActivo ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg' : 'bg-white text-slate-300 border-slate-100'}`}>ACTIVO</button>
                                   <button type="button" onClick={() => setFormData({...formData, estaActivo: false})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${!formData.estaActivo ? 'bg-rose-600 text-white border-rose-700 shadow-lg' : 'bg-white text-slate-300 border-slate-100'}`}>INACTIVO</button>
                               </div>
                           </div>
                       )}
                   </div>
                   {formData.poseeCbit && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                           <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200">
                                <label className={labelStyle}>Nro de Equipos Operativos</label>
                                <input type="number" min="0" className="w-full text-center text-4xl font-black rounded-2xl border-2 border-slate-300 bg-white text-slate-900 py-4" value={formData.equiposOperativos} onChange={e => setFormData({...formData, equiposOperativos: parseInt(e.target.value) || 0})}/>
                           </div>
                           <div className="bg-blue-50/50 p-8 rounded-[32px] border-2 border-blue-100 flex items-center justify-between">
                               <span className="font-black text-blue-900 uppercase text-xs tracking-widest">Conexión a Red</span>
                               <div className="flex gap-3">
                                   <button type="button" onClick={() => setFormData({...formData, tieneInternet: true})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${formData.tieneInternet ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-300'}`}>TIENE</button>
                                   <button type="button" onClick={() => setFormData({...formData, tieneInternet: false})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${!formData.tieneInternet ? 'bg-slate-600 text-white shadow-lg' : 'bg-white text-slate-300'}`}>NO TIENE</button>
                               </div>
                           </div>
                       </div>
                   )}
               </div>

               {formData.poseeCbit && (
                   <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                       <div className="flex justify-between items-center mb-8 border-b pb-4">
                           <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-[11px] tracking-widest"><Users size={20} className="text-red-600"/> Tutores Fundabit Asignados</h3>
                           <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Cantidad de Tutores:</label>
                               <input type="number" min="0" className="w-16 text-center border-2 border-red-200 rounded-xl p-2 font-black bg-white text-red-600" value={formData.tutores?.length || 0} onChange={(e) => handleUpdateTutorsCount(parseInt(e.target.value) || 0)}/>
                           </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {formData.tutores?.map((tutor, idx) => (
                               <div key={tutor.id} className="bg-slate-50 p-8 rounded-[40px] border-2 border-slate-200 shadow-inner grid grid-cols-1 gap-4">
                                   <div className="grid grid-cols-2 gap-4">
                                       <div><label className={labelStyle}>Cédula</label><input className={inputStyle} value={tutor.cedula} onChange={e => updateTutor(idx, 'cedula', e.target.value)} /></div>
                                       <div><label className={labelStyle}>Dependencia</label><select className={inputStyle} value={tutor.dependencia} onChange={e => updateTutor(idx, 'dependencia', e.target.value as any)}><option value="MPPE">MPPE</option><option value="FUNDABIT">FUNDABIT</option></select></div>
                                   </div>
                                   <div><label className={labelStyle}>Nombre Completo</label><input className={inputStyle} value={tutor.nombreCompleto} onChange={e => updateTutor(idx, 'nombreCompleto', e.target.value)} /></div>
                                   <div className="grid grid-cols-2 gap-4">
                                       <div><label className={labelStyle}>Teléfono</label><input className={inputStyle} value={tutor.telefono} onChange={e => updateTutor(idx, 'telefono', e.target.value)} /></div>
                                       <div><label className={labelStyle}>Correo</label><input className={inputStyle} value={tutor.correo} onChange={e => updateTutor(idx, 'correo', e.target.value)} /></div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               <div className="flex flex-col gap-4">
                    {successMsg && <div className="bg-emerald-600 text-white p-5 rounded-2xl text-center font-black shadow-2xl uppercase animate-in">{successMsg}</div>}
                    <div className="flex justify-end"><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-20 rounded-[32px] shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-[0.2em] text-xs"><Save size={24}/> {isEditing ? 'Actualizar Ficha Técnica' : 'Guardar Información CBIT'}</button></div>
               </div>
           </form>

           <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-12 mb-20">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <History className="text-red-600" size={24} /> Historial Institucional Fundabit
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5">FECHA REPORTE</th>
                                <th className="px-6 py-5 text-center">INFRAESTRUCTURA</th>
                                <th className="px-6 py-5 text-center">EQUIPOS OP.</th>
                                <th className="px-6 py-5 text-center">TUTORES</th>
                                <th className="px-6 py-5 text-center">OPERACIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plantelHistory.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin antecedentes de carga</td></tr>
                            ) : (
                                plantelHistory.map(reg => (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-600">{new Date(reg.fechaCarga).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${reg.poseeCbit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                {reg.poseeCbit ? 'POSEE CBIT' : 'NO POSEE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900 text-sm">{reg.equiposOperativos || 0}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-widest">{reg.tutores?.length || 0} PERSONAL</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditRecord(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="EDITAR"><Edit size={18}/></button>
                                                <button onClick={() => { if(confirm('¿ELIMINAR ESTE REGISTRO?')) onDeleteFundabit(reg.id); }} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="BORRAR"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

export default FundabitManager;