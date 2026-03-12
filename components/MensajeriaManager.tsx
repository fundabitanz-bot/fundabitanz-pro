import React, { useState, useMemo } from 'react';
import { User, MensajeSoporte, CategoriaSoporte, Plantel, TipoDestinatario } from '../types';
import { GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { Send, MessageSquare, User as UserIcon, Plus, MessageCircle, X, Search, Trash2, Eraser } from 'lucide-react';

interface MensajeriaManagerProps {
    currentUser: User;
    planteles: Plantel[];
    mensajes: MensajeSoporte[];
    onSaveMensaje: (m: MensajeSoporte) => void;
    onDeleteMensaje?: (id: string) => void; 
}

const MensajeriaManager: React.FC<MensajeriaManagerProps> = ({ currentUser, planteles, mensajes, onSaveMensaje, onDeleteMensaje }) => {
    const [activeTab, setActiveTab] = useState<'recibidos' | 'enviados'>('recibidos');
    const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
    const [isNewMsgModal, setIsNewMsgModal] = useState(false);
    const [respuestaText, setRespuestaText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [newMsg, setNewMsg] = useState<Partial<MensajeSoporte>>({
        categoria: 'GENERAL',
        destinatarioTipo: 'SOPORTE',
        destinatarioId: 'SOPORTE_TECNICO',
        asunto: '',
        mensaje: ''
    });

    const [targetEstado, setTargetEstado] = useState(currentUser.estadoAsignado || 'ANZOATEGUI');
    const [targetMunicipio, setTargetMunicipio] = useState('');
    const [targetPlantel, setTargetPlantel] = useState('');

    const canRedact = currentUser.role !== 'PLANTEL';
    const isAdmin = currentUser.role === 'MAESTRO' || currentUser.role === 'ADMINISTRADOR';

    const filteredMessages = useMemo(() => {
        let base = mensajes;
        if (activeTab === 'enviados') return base.filter(m => m.remitenteId === currentUser.id);

        return base.filter(m => {
            if (m.remitenteId === currentUser.id) return false;

            if (currentUser.role === 'PLANTEL' && m.destinatarioTipo === 'PLANTEL') {
                return (currentUser.plantelesAsignados || []).includes(m.destinatarioId);
            }
            if (currentUser.role === 'MUNICIPAL' && m.destinatarioTipo === 'MUNICIPIO') {
                return m.destinatarioId === currentUser.municipioAsignado;
            }
            if (currentUser.role === 'ADMINISTRADOR' && m.destinatarioTipo === 'ESTADO') {
                return m.destinatarioId === currentUser.estadoAsignado;
            }
            if (m.destinatarioTipo === 'SOPORTE') {
                if (currentUser.role === 'MAESTRO') return true;
                if (currentUser.role === 'ADMINISTRADOR') {
                    const cargo = currentUser.cargo.toUpperCase();
                    if (cargo.includes(m.categoria)) return true;
                }
            }
            return false;
        });
    }, [mensajes, currentUser, activeTab]);

    const finalFiltered = filteredMessages.filter(m => 
        m.asunto.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.remitenteNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedMsg = mensajes.find(m => m.id === selectedMsgId);

    const handleSendNew = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canRedact) return;

        let dId = newMsg.destinatarioId || '';
        if (newMsg.destinatarioTipo === 'PLANTEL') dId = targetPlantel;
        if (newMsg.destinatarioTipo === 'MUNICIPIO') dId = targetMunicipio;
        if (newMsg.destinatarioTipo === 'ESTADO') dId = targetEstado;

        const msg: MensajeSoporte = {
            id: crypto.randomUUID(),
            remitenteId: currentUser.id,
            remitenteNombre: currentUser.nombreCompleto,
            remitenteCargo: currentUser.cargo,
            destinatarioTipo: newMsg.destinatarioTipo as TipoDestinatario,
            destinatarioId: dId,
            categoria: newMsg.categoria as CategoriaSoporte,
            asunto: newMsg.asunto?.toUpperCase() || '',
            mensaje: newMsg.mensaje?.toUpperCase() || '',
            fecha: new Date().toISOString(),
            leido: false,
            respuestas: []
        };
        onSaveMensaje(msg);
        setIsNewMsgModal(false);
        setNewMsg({ categoria: 'GENERAL', destinatarioTipo: 'SOPORTE', asunto: '', mensaje: '' });
    };

    const handleRespuesta = () => {
        if (!selectedMsg || !respuestaText.trim()) return;
        const updated = {
            ...selectedMsg,
            leido: true,
            respuestas: [...selectedMsg.respuestas, {
                autorId: currentUser.id,
                autorNombre: currentUser.nombreCompleto,
                mensaje: respuestaText.toUpperCase(),
                fecha: new Date().toISOString()
            }]
        };
        onSaveMensaje(updated);
        setRespuestaText('');
    };

    const deleteMessage = (id: string) => {
        if (!confirm('¿Desea eliminar este hilo de conversación permanentemente?')) return;
        if (onDeleteMensaje) {
            onDeleteMensaje(id);
            setSelectedMsgId(null);
        } else {
            // Fallback legacy (si no se pasa la prop, forzamos recarga, pero ya no debería ocurrir)
            const remaining = mensajes.filter(m => m.id !== id);
            fetch(`/api/save/mensajes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(remaining)
            }).then(() => {
                setSelectedMsgId(null);
                window.location.reload(); 
            });
        }
    };

    const purgeOldMessages = () => {
        if (!confirm('¿Desea limpiar todos los mensajes antiguos del sistema?')) return;
        const activeOnes = mensajes.filter(m => {
            const days = (new Date().getTime() - new Date(m.fecha).getTime()) / (1000 * 3600 * 24);
            return days < 30; // Mantener solo últimos 30 días
        });
        
        // Operación masiva usa fetch directo ya que afecta a todos
        fetch(`/api/save/mensajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activeOnes)
        }).then(() => window.location.reload());
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs focus:border-blue-500 outline-none";
    const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 tracking-widest";

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col gap-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#003399] text-white rounded-2xl shadow-lg shadow-blue-200"><MessageSquare size={24}/></div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Buzón de Comunicaciones SGI</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {currentUser.role === 'PLANTEL' ? 'Centro de Recepción de Instrucciones' : 'Gestión de Direccionamiento Institucional'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                        <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase" placeholder="Filtrar mensajes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    {isAdmin && (
                        <button onClick={purgeOldMessages} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200" title="Purgar mensajes antiguos">
                            <Eraser size={20}/>
                        </button>
                    )}
                    {canRedact && (
                        <button onClick={() => setIsNewMsgModal(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all shrink-0">
                            <Plus size={18}/> Redactar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-80 lg:w-96 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2">
                        <button onClick={() => setActiveTab('recibidos')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'recibidos' ? 'bg-[#003399] text-white shadow-lg' : 'bg-white text-slate-400'}`}>Bandeja Entrda</button>
                        <button onClick={() => setActiveTab('enviados')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'enviados' ? 'bg-[#003399] text-white shadow-lg' : 'bg-white text-slate-400'}`}>Enviados</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/30">
                        {finalFiltered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50"><MessageCircle size={48}/><p className="font-black uppercase text-[10px]">No hay mensajes</p></div>
                        ) : finalFiltered.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(m => (
                            <div key={m.id} onClick={() => setSelectedMsgId(m.id)} className={`p-5 rounded-[32px] border-2 transition-all cursor-pointer group relative ${selectedMsgId === m.id ? 'bg-white border-blue-500 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-lg text-white uppercase ${m.categoria === 'URGENTE' ? 'bg-rose-500' : 'bg-blue-600'}`}>{m.categoria}</span>
                                    <span className="text-[8px] text-slate-300 font-bold">{new Date(m.fecha).toLocaleDateString()}</span>
                                </div>
                                <h4 className={`text-[11px] font-black uppercase truncate ${!m.leido && m.remitenteId !== currentUser.id ? 'text-[#003399] flex items-center gap-2' : 'text-slate-800'}`}>
                                    {!m.leido && m.remitenteId !== currentUser.id && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>}
                                    {m.asunto}
                                </h4>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate">{m.remitenteNombre}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    {selectedMsg ? (
                        <>
                            <div className="p-8 bg-[#003399] text-white flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-white to-red-600"></div>
                                <div className="z-10">
                                    <h3 className="font-black text-lg uppercase tracking-tight leading-none">{selectedMsg.asunto}</h3>
                                    <p className="text-blue-200 text-[9px] font-black uppercase mt-1 italic">Origen: {selectedMsg.remitenteNombre} ({selectedMsg.remitenteCargo})</p>
                                </div>
                                <div className="flex items-center gap-4 z-10">
                                    {isAdmin && (
                                        <button onClick={() => deleteMessage(selectedMsg.id)} className="p-2 bg-rose-500/20 text-rose-200 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                            <Trash2 size={20}/>
                                        </button>
                                    )}
                                    <span className="bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/20">#{selectedMsg.id.substring(0,6)}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 custom-scrollbar">
                                <div className="flex justify-start">
                                    <div className="bg-white p-6 rounded-[32px] rounded-tl-none border border-slate-200 shadow-sm max-w-[80%] border-l-4 border-l-blue-600">
                                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase">{selectedMsg.mensaje}</p>
                                        <p className="text-[8px] text-slate-300 font-black mt-4 uppercase tracking-widest">{new Date(selectedMsg.fecha).toLocaleString()}</p>
                                    </div>
                                </div>
                                {selectedMsg.respuestas.map((r, i) => (
                                    <div key={i} className={`flex ${r.autorId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-6 rounded-[32px] max-w-[80%] shadow-md border-2 ${r.autorId === currentUser.id ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white border-slate-200 text-slate-900 rounded-tl-none'}`}>
                                            <p className="text-[7px] opacity-70 font-black uppercase mb-2">{r.autorNombre}</p>
                                            <p className="text-[11px] font-bold leading-relaxed uppercase">{r.mensaje}</p>
                                            <p className={`text-[8px] font-black mt-3 uppercase text-right ${r.autorId === currentUser.id ? 'text-indigo-200' : 'text-slate-300'}`}>{new Date(r.fecha).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                                <input className={inputStyle + " flex-1"} placeholder="Escriba su respuesta institucional..." value={respuestaText} onChange={e => setRespuestaText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRespuesta()} />
                                <button onClick={handleRespuesta} className="bg-[#003399] text-white p-5 rounded-[24px] shadow-2xl active:scale-90 transition-all hover:bg-blue-800"><Send size={24}/></button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-5">
                            <div className="bg-slate-50 p-10 rounded-[60px] border-2 border-dashed border-slate-100">
                                <MessageSquare size={80} className="text-slate-200 animate-pulse"/>
                            </div>
                            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Seleccione una conversación para leer</p>
                        </div>
                    )}
                </div>
            </div>

            {isNewMsgModal && canRedact && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in border-4 border-white/20">
                        <div className="bg-[#003399] p-8 text-white flex justify-between items-center relative">
                            <div className="flex items-center gap-3">
                                <Plus className="text-emerald-400"/>
                                <h3 className="font-black text-xl uppercase italic">Nuevo Despacho Oficial</h3>
                            </div>
                            <button onClick={() => setIsNewMsgModal(false)} className="hover:bg-white/10 p-3 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <form onSubmit={handleSendNew} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Jurisdicción de Destino</label>
                                    <select required className={inputStyle} value={newMsg.destinatarioTipo} onChange={e => setNewMsg({...newMsg, destinatarioTipo: e.target.value as any})}>
                                        <option value="SOPORTE">SOPORTE TÉCNICO</option>
                                        <option value="PLANTEL">PLANTEL INDIVIDUAL</option>
                                        <option value="MUNICIPIO">TODA LA RED MUNICIPAL</option>
                                        <option value="ESTADO">COORDINACIÓN ESTADAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Naturaleza del Mensaje</label>
                                    <select className={inputStyle} value={newMsg.categoria} onChange={e => setNewMsg({...newMsg, categoria: e.target.value as any})}>
                                        <option value="GENERAL">CIRCULAR GENERAL</option>
                                        <option value="RAC">ASUNTOS DE NÓMINA (RAC)</option>
                                        <option value="CNAE">ALIMENTACIÓN (PAE)</option>
                                        <option value="FEDE">INFRAESTRUCTURA</option>
                                        <option value="URGENTE">ATENCIÓN INMEDIATA</option>
                                    </select>
                                </div>
                            </div>
                            
                            {newMsg.destinatarioTipo === 'PLANTEL' && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className={labelStyle}>Municipio</label>
                                        <select className={inputStyle} value={targetMunicipio} onChange={e => setTargetMunicipio(e.target.value)}>
                                            <option value="">TODOS</option>
                                            {Object.keys(GEOGRAFIA_VENEZUELA['ANZOATEGUI']).map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Plantel</label>
                                        <select required className={inputStyle} value={targetPlantel} onChange={e => setTargetPlantel(e.target.value)}>
                                            <option value="">-- SELECCIONE --</option>
                                            {planteles.filter(p => !targetMunicipio || p.municipio === targetMunicipio).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {newMsg.destinatarioTipo === 'MUNICIPIO' && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className={labelStyle}>Seleccionar Municipio Destino</label>
                                    <select required className={inputStyle} value={targetMunicipio} onChange={e => setTargetMunicipio(e.target.value)}>
                                        <option value="">-- SELECCIONE MUNICIPIO --</option>
                                        {Object.keys(GEOGRAFIA_VENEZUELA['ANZOATEGUI']).map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div><label className={labelStyle}>Asunto Institucional</label><input required className={inputStyle} value={newMsg.asunto} onChange={e => setNewMsg({...newMsg, asunto: e.target.value})} placeholder="Ej: Instrucción sobre RAC..." /></div>
                                <div><label className={labelStyle}>Contenido del Mensaje</label><textarea required rows={5} className={inputStyle + " h-32 leading-relaxed"} value={newMsg.mensaje} onChange={e => setNewMsg({...newMsg, mensaje: e.target.value})} placeholder="Escriba el cuerpo del mensaje..." /></div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="w-full bg-[#003399] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    <Send size={18}/> Transmitir Comunicación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MensajeriaManager;