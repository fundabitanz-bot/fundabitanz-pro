
import React, { useState, useEffect } from 'react';
import { Plantel, RecursoRegistro } from '../types';
import { Package, Save, History, Truck, Search, MapPin } from 'lucide-react';
import { GEOGRAFIA_VENEZUELA } from '../utils/constants';

const RecursosManager: React.FC<{ planteles: Plantel[], recursosList: RecursoRegistro[], onSave: (r: RecursoRegistro) => void }> = ({ planteles, recursosList, onSave }) => {
    const [selectedEstado, setSelectedEstado] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState('');
    const [selectedPlantelId, setSelectedPlantelId] = useState('');
    const [formData, setFormData] = useState<Partial<RecursoRegistro>>({ tipoRecurso: '', cantidadEntregada: 0, cantidadFuncional: 0, estatusDotacion: 'RECIBIDO' });

    const filteredPlanteles = planteles.filter(p => (!selectedEstado || p.estado === selectedEstado) && (!selectedMunicipio || p.municipio === selectedMunicipio));
    const selectedPlantel = planteles.find(p => p.id === selectedPlantelId);
    const history = recursosList.filter(r => r.plantelId === selectedPlantelId);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlantelId || !formData.tipoRecurso) return;
        onSave({
            ...formData,
            id: crypto.randomUUID(),
            plantelId: selectedPlantelId,
            fechaEntrega: new Date().toISOString()
        } as RecursoRegistro);
        setFormData({ ...formData, tipoRecurso: '', cantidadEntregada: 0, cantidadFuncional: 0 });
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
    const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight"><Package className="text-blue-600" size={28} /> Recursos para el Aprendizaje</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
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
                        <h3 className="font-black text-slate-700 text-[11px] uppercase border-b border-slate-100 pb-4 tracking-[0.1em]">Control de Entregas y Dotación Masiva</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className={labelStyle}>Tipo de Recurso (Textos, Canaimas, etc.)</label><input className={inputStyle} required value={formData.tipoRecurso} onChange={e => setFormData({...formData, tipoRecurso: e.target.value.toUpperCase()})} placeholder="EJ: COLECCIÓN BICENTENARIO / TABLETS" /></div>
                            <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                                <label className={labelStyle}>Cantidad Entregada</label>
                                <input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.cantidadEntregada} onChange={e => setFormData({...formData, cantidadEntregada: parseInt(e.target.value)||0})} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                                <label className={labelStyle}>Cantidad Funcional</label>
                                <input type="number" className="w-full text-center text-3xl font-black rounded-2xl border-2 border-slate-300 bg-white text-black py-4" value={formData.cantidadFuncional} onChange={e => setFormData({...formData, cantidadFuncional: parseInt(e.target.value)||0})} />
                            </div>
                            <div className="md:col-span-2"><label className={labelStyle}>Estatus de la Dotación</label><select className={inputStyle} value={formData.estatusDotacion} onChange={e => setFormData({...formData, estatusDotacion: e.target.value as any})}><option value="RECIBIDO">RECIBIDO COMPLETAMENTE</option><option value="PENDIENTE">PENDIENTE POR ENTREGA</option><option value="REQUERIDO">REQUERIDO / SOLICITUD</option></select></div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[28px] font-black uppercase text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em]"><Save size={20}/> Registrar Dotación</button>
                    </form>
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                        <h3 className="font-black text-slate-800 text-[11px] uppercase border-b border-slate-100 pb-4 flex items-center gap-3 tracking-[0.1em]"><Truck className="text-blue-600" size={18}/> Historial de Entregas</h3>
                        <div className="space-y-4 mt-6 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
                            {history.length === 0 ? <p className="text-[10px] text-slate-300 font-black uppercase italic py-20 text-center">Sin registros previos.</p> :
                                history.sort((a,b) => new Date(b.fechaEntrega).getTime() - new Date(a.fechaEntrega).getTime()).map(h => (
                                    <div key={h.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:bg-white transition-all hover:shadow-xl hover:border-blue-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(h.fechaEntrega).toLocaleDateString()}</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${h.estatusDotacion === 'RECIBIDO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{h.estatusDotacion}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 uppercase leading-tight">{h.tipoRecurso}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-2">CANT: {h.cantidadEntregada} • FUNC: {h.cantidadFuncional}</p>
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

export default RecursosManager;
