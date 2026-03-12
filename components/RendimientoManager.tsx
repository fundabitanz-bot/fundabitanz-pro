import React, { useState, useEffect } from 'react';
import { Plantel, RendimientoRegistro } from '../types';
import { GraduationCap, Save, History, TrendingUp, AlertCircle, MapPin, Search } from 'lucide-react';
import { GEOGRAFIA_VENEZUELA, NIVELES } from '../utils/constants';

const RendimientoManager: React.FC<{ planteles: Plantel[], rendimientoList: RendimientoRegistro[], onSave: (r: RendimientoRegistro) => void }> = ({ planteles, rendimientoList, onSave }) => {
    const [selectedEstado, setSelectedEstado] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState('');
    const [selectedPlantelId, setSelectedPlantelId] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Filtro
    const [formData, setFormData] = useState<Partial<RendimientoRegistro>>({ momento: '1ER MOMENTO', nivel: '', aprobados: 0, reprobados: 0, promedioGeneral: 0 });

    const filteredPlanteles = planteles.filter(p => 
        (!selectedEstado || p.estado === selectedEstado) && 
        (!selectedMunicipio || p.municipio === selectedMunicipio) &&
        (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const selectedPlantel = planteles.find(p => p.id === selectedPlantelId);
    const history = rendimientoList.filter(r => r.plantelId === selectedPlantelId);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlantelId || !formData.nivel) return;
        onSave({
            ...formData,
            id: crypto.randomUUID(),
            plantelId: selectedPlantelId,
            periodo: '2024-2025',
            fechaCarga: new Date().toISOString()
        } as RendimientoRegistro);
        setFormData({ ...formData, aprobados: 0, reprobados: 0, promedioGeneral: 0 });
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
    const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight"><GraduationCap className="text-emerald-600" size={28} /> Rendimiento Académico</h2>
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
                    {/* NUEVO FILTRO DE BÚSQUEDA */}
                    <div className="flex flex-col gap-1">
                        <label className={labelStyle}>Buscar Plantel</label>
                        <div className="relative">
                            <input className={inputStyle} placeholder="NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelStyle}>Plantel Específico</label>
                        <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}>
                            <option value="">-- SELECCIONE UN PLANTEL --</option>
                            {filteredPlanteles.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedPlantel && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
                    <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-lg border border-slate-200 space-y-8">
                        <h3 className="font-black text-slate-700 text-[11px] uppercase border-b border-slate-100 pb-4 tracking-[0.2em]">Carga de Calificaciones por Momento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelStyle}>Nivel / Grado</label><select className={inputStyle} required value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})}><option value="">-- SELECCIONE --</option>{NIVELES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                            <div><label className={labelStyle}>Momento Evaluativo</label><select className={inputStyle} value={formData.momento} onChange={e => setFormData({...formData, momento: e.target.value as any})}><option value="1ER MOMENTO">1ER MOMENTO</option><option value="2DO MOMENTO">2DO MOMENTO</option><option value="3ER MOMENTO">3ER MOMENTO</option></select></div>
                            <div className="bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100 shadow-sm">
                                <label className="text-[10px] font-black text-emerald-700 uppercase ml-2 mb-2 block">Cant. Aprobados</label>
                                <input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.aprobados} onChange={e => setFormData({...formData, aprobados: parseInt(e.target.value)||0})} />
                            </div>
                            <div className="bg-rose-50 p-6 rounded-[32px] border-2 border-rose-100 shadow-sm">
                                <label className="text-[10px] font-black text-rose-700 uppercase ml-2 mb-2 block">Cant. Reprobados</label>
                                <input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.reprobados} onChange={e => setFormData({...formData, reprobados: parseInt(e.target.value)||0})} />
                            </div>
                            <div className="md:col-span-2 bg-blue-50/50 p-8 rounded-[40px] border-2 border-blue-100 shadow-inner">
                                <label className="text-[10px] font-black text-blue-700 uppercase ml-2 mb-3 block text-center">Promedio General de la Sección / Cohorte</label>
                                <input type="number" step="0.01" className="w-full text-center text-5xl font-black rounded-[32px] border-4 border-white bg-white text-blue-900 py-6 shadow-2xl" value={formData.promedioGeneral} onChange={e => setFormData({...formData, promedioGeneral: parseFloat(e.target.value)||0})} />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[28px] font-black uppercase text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em]"><Save size={20}/> Procesar Rendimiento</button>
                    </form>
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                        <h3 className="font-black text-slate-800 text-[11px] uppercase border-b border-slate-100 pb-4 flex items-center gap-3 tracking-[0.1em]"><History className="text-blue-600" size={18}/> Registros Previos</h3>
                        <div className="space-y-4 mt-6 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
                            {history.length === 0 ? <p className="text-[10px] text-slate-300 font-black uppercase italic py-20 text-center">Esperando carga de datos...</p> :
                                history.sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime()).map(h => (
                                    <div key={h.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:bg-white transition-all hover:shadow-xl hover:border-blue-100 group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{h.nivel}</p>
                                            <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded-full border text-slate-400">{h.momento}</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-900 leading-none">NOTA: {h.promedioGeneral}</p>
                                        <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                                            <div className="flex flex-col"><span className="text-[8px] font-black text-emerald-600 uppercase">APROB</span><span className="font-black text-xs">{h.aprobados}</span></div>
                                            <div className="flex flex-col"><span className="text-[8px] font-black text-rose-600 uppercase">REPROB</span><span className="font-black text-xs">{h.reprobados}</span></div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RendimientoManager;