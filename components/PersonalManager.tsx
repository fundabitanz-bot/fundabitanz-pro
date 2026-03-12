import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, PersonalRegistro } from '../types';
import { CARGOS, GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { Save, AlertCircle, Users, CheckCircle2, History, Trash2, UserCog, MapPin, Search } from 'lucide-react';

const PersonalManager: React.FC<{ planteles: Plantel[], personalList: PersonalRegistro[], onSavePersonal: (r: PersonalRegistro) => void, onDeletePersonal: (id: string) => void }> = ({ planteles, personalList, onSavePersonal, onDeletePersonal }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentCargo, setCurrentCargo] = useState<string>('');
  
  const [formData, setFormData] = useState({
    racFem: 0, racMasc: 0, asistentesFem: 0, asistentesMasc: 0,
    respNombre: '', respCi: '', respCargo: '', respTelefono: ''
  });
  
  const [successMsg, setSuccessMsg] = useState('');

  const selectedPlantel = useMemo(() => (planteles || []).find(p => p.id === selectedPlantelId), [planteles, selectedPlantelId]);
  
  const filteredPlanteles = useMemo(() => {
      let list = (planteles || []).filter(p => 
        (!selectedEstado || p.estado === selectedEstado) && 
        (!selectedMunicipio || p.municipio === selectedMunicipio)
      );
      if (searchTerm) {
          list = list.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return list;
  }, [planteles, selectedEstado, selectedMunicipio, searchTerm]);

  const history = useMemo(() => 
    (personalList || []).filter(p => p.plantelId === selectedPlantelId),
    [personalList, selectedPlantelId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantel || !currentCargo) return;

    onSavePersonal({
        id: crypto.randomUUID(),
        plantelId: selectedPlantel.id,
        cargo: currentCargo.toUpperCase(),
        racFemenino: Number(formData.racFem) || 0,
        racMasculino: Number(formData.racMasc) || 0,
        asistentesFemenino: Number(formData.asistentesFem) || 0,
        asistentesMasculino: Number(formData.asistentesMasc) || 0,
        fechaCarga: new Date().toISOString(),
        responsableNombre: (formData.respNombre || '').toUpperCase(),
        responsableCi: (formData.respCi || '').toUpperCase(),
        responsableCargo: (formData.respCargo || 'DIRECTOR').toUpperCase(),
        responsableTelefono: formData.respTelefono || ''
    });

    setSuccessMsg("FUERZA LABORAL REGISTRADA EXITOSAMENTE");
    setFormData({ ...formData, racFem: 0, racMasc: 0, asistentesFem: 0, asistentesMasc: 0 });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs focus:border-blue-600 outline-none";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

  return (
    <div className="space-y-8 animate-in fade-in pb-32">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
          <UserCog className="text-[#004a99]" size={28} /> Control de Fuerza Laboral
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
                <label className={labelStyle}>Buscar por Nombre</label>
                <div className="relative">
                    <input className={inputStyle} placeholder="NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Selección de Centro</label>
                <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}>
                    <option value="">-- SELECCIONE UN PLANTEL --</option>
                    {filteredPlanteles.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
        </div>
      </div>

      {selectedPlantel ? (
        <>
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-lg border border-slate-200 space-y-8 animate-in slide-in-from-bottom-4">
            <div>
                <label className={labelStyle}>Categoría de Personal</label>
                <select required className={inputStyle} value={currentCargo} onChange={e => setCurrentCargo(e.target.value)}>
                    <option value="">-- SELECCIONE CARGO --</option>
                    {CARGOS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-blue-50/50 p-8 rounded-[32px] border-2 border-blue-100">
                    <h3 className="font-black text-blue-900 text-center uppercase mb-8 text-[10px] tracking-[0.2em]">Carga Nominal (RAC)</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center"><label className="block text-[9px] font-black text-pink-600 mb-2 uppercase">Fem</label><input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.racFem || ''} onChange={e => setFormData({...formData, racFem: parseInt(e.target.value) || 0})} /></div>
                        <div className="text-center"><label className="block text-[9px] font-black text-blue-600 mb-2 uppercase">Masc</label><input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.racMasc || ''} onChange={e => setFormData({...formData, racMasc: parseInt(e.target.value) || 0})} /></div>
                    </div>
                </div>
                <div className="bg-emerald-50/50 p-8 rounded-[32px] border-2 border-emerald-100">
                    <h3 className="font-black text-emerald-900 text-center uppercase mb-8 text-[10px] tracking-[0.2em]">Asistencia Activa</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center"><label className="block text-[9px] font-black text-pink-500 mb-2 uppercase">Fem</label><input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.asistentesFem || ''} onChange={e => setFormData({...formData, asistentesFem: parseInt(e.target.value) || 0})} /></div>
                        <div className="text-center"><label className="block text-[9px] font-black text-emerald-500 mb-2 uppercase">Masc</label><input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.asistentesMasc || ''} onChange={e => setFormData({...formData, asistentesMasc: parseInt(e.target.value) || 0})} /></div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl">
                <h3 className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-[0.2em] border-b border-white/10 pb-4">Validador del Reporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs" value={formData.respNombre} onChange={e => setFormData({...formData, respNombre: e.target.value.toUpperCase()})} placeholder="NOMBRE COMPLETO"/>
                    <input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs" value={formData.respCi} onChange={e => setFormData({...formData, respCi: e.target.value.toUpperCase()})} placeholder="CÉDULA"/>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-[#004a99] hover:bg-blue-800 text-white font-black py-5 px-16 rounded-[28px] shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3">
                    <Save size={20} /> Consolidar Personal
                </button>
            </div>
            {successMsg && <div className="p-4 bg-emerald-600 text-white font-black rounded-2xl text-center animate-bounce uppercase shadow-lg border-2 border-emerald-400">{successMsg}</div>}
        </form>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-10">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                <History className="text-[#004a99]" size={24}/> Historial de Fuerza Laboral
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-5">FECHA</th>
                            <th className="px-6 py-5">CARGO REPORTADO</th>
                            <th className="px-6 py-5 text-center">NÓMINA (RAC)</th>
                            <th className="px-6 py-5 text-center">ASISTENCIA</th>
                            <th className="px-6 py-5 text-center">OPERACIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin registros históricos detectados</td></tr>
                        ) : (
                            history.sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime()).map(reg => (
                                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(reg.fechaCarga).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-black text-slate-800 uppercase">{reg.cargo}</td>
                                    <td className="px-6 py-4 text-center font-black">{reg.racFemenino + reg.racMasculino}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black border border-emerald-100">
                                            {reg.asistentesFemenino + reg.asistentesMasculino}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => onDeletePersonal(reg.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </>
      ) : (
        <div className="bg-white p-20 rounded-[50px] border-2 border-dashed border-slate-200 text-center">
            <UserCog className="mx-auto text-slate-100 mb-6" size={80} />
            <p className="text-slate-400 font-black uppercase tracking-widest">Seleccione una institución para gestionar su personal</p>
        </div>
      )}
    </div>
  );
};

export default PersonalManager;