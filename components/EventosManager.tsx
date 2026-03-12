
import React, { useState } from 'react';
import { EventoEscolar, User } from '../types';
import { Calendar, Save, Trash2, X, Plus, CheckCircle, Clock, AlertTriangle, PlayCircle } from 'lucide-react';

const EventosManager: React.FC<{ user: User, eventos: EventoEscolar[], onSave: (e: EventoEscolar) => void, onDelete: (id: string) => void }> = ({ user, eventos, onSave, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<EventoEscolar>>({ 
        titulo: '', 
        fecha: '', 
        tipo: 'SUPERVISION', 
        tipoOtro: '',
        descripcion: '',
        estatusEjecucion: 'PENDIENTE'
    });

    const isAdmin = user.role === 'MAESTRO' || user.role === 'ADMINISTRADOR';

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            id: formData.id || crypto.randomUUID(),
            estatusEjecucion: formData.estatusEjecucion || 'PENDIENTE'
        } as EventoEscolar);
        setIsAdding(false);
        setFormData({ titulo: '', fecha: '', tipo: 'SUPERVISION', tipoOtro: '', descripcion: '', estatusEjecucion: 'PENDIENTE' });
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-bold uppercase text-xs";

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'CUMPLIDO': return <CheckCircle size={14} className="text-emerald-500" />;
            case 'SUSPENDIDO': return <X size={14} className="text-rose-500" />;
            case 'PENDIENTE': return <Clock size={14} className="text-blue-500" />;
            default: return <AlertTriangle size={14} className="text-amber-500" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight"><Calendar className="text-blue-600" /> Agenda de Supervisión</h2>
                {isAdmin && <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus size={18}/> Agendar Evento</button>}
            </div>

            {isAdding && (
                <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-200 relative animate-in zoom-in">
                    <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Título de Actividad</label><input required className={inputStyle} value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} /></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha</label><input type="date" required className={inputStyle} value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} /></div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo de Evento</label>
                                <select className={inputStyle} value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as any})}>
                                    <option value="EFEMERIDE">EFEMÉRIDE</option>
                                    <option value="SUPERVISION">VISITA / SUPERVISIÓN</option>
                                    <option value="REUNION">REUNIÓN DE TRABAJO</option>
                                    <option value="SUSPENSION">SUSPENSIÓN DE ACTIVIDADES</option>
                                    <option value="OTRO">OTRO (ESPECIFICAR)</option>
                                </select>
                                {formData.tipo === 'OTRO' && (
                                    <input className={`${inputStyle} mt-2`} placeholder="Especifique el tipo..." value={formData.tipoOtro} onChange={e => setFormData({...formData, tipoOtro: e.target.value})} />
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Estatus de Ejecución</label>
                                <select className={inputStyle} value={formData.estatusEjecucion} onChange={e => setFormData({...formData, estatusEjecucion: e.target.value as any})}>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="CUMPLIDO">CUMPLIDO / EJECUTADO</option>
                                    <option value="POSTERGADO">POSTERGADO</option>
                                    <option value="APLAZADO">APLAZADO</option>
                                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                                    <option value="REPROGRAMADO">REPROGRAMADO</option>
                                    <option value="NO EJECUTADO">NO EJECUTADO</option>
                                </select>
                            </div>

                            <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción</label><textarea rows={3} className={inputStyle} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} /></div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Guardar en Agenda</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {eventos.length === 0 ? (
                        <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">
                            No hay actividades registradas en la agenda.
                        </div>
                    ) : (
                        eventos.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(e => (
                            <div key={e.id} className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-slate-50 transition-colors group">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-700 shadow-inner shrink-0">
                                    <span className="text-[10px] font-black uppercase leading-none">{new Date(e.fecha).toLocaleDateString('es', {month:'short'})}</span>
                                    <span className="text-2xl font-black">{new Date(e.fecha).getDate()}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-black text-slate-900 uppercase text-sm leading-none">{e.titulo}</h4>
                                        <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded-full border text-slate-400 uppercase">
                                            {e.tipo === 'OTRO' ? (e.tipoOtro || 'OTRO') : e.tipo}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full border border-slate-200">
                                            {getStatusIcon(e.estatusEjecucion)}
                                            <span className="text-[9px] font-black text-slate-600 uppercase">{e.estatusEjecucion}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase line-clamp-1">{e.descripcion}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAdmin && (
                                        <>
                                            <button 
                                                onClick={() => { setFormData(e); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                                className="p-3 text-blue-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100"
                                            >
                                                <Clock size={18}/>
                                            </button>
                                            <button 
                                                onClick={() => { if(confirm('¿ELIMINAR ESTE EVENTO?')) onDelete(e.id); }} 
                                                className="p-3 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventosManager;
