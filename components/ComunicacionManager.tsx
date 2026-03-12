import React, { useState, useRef } from 'react';
import { Comunicado, User } from '../types';
import { Megaphone, Save, Trash2, X, AlertCircle, Camera, Upload, ImageIcon, Maximize2, Plus, User as UserIcon } from 'lucide-react';

interface ComunicacionManagerProps {
    user: User;
    comunicados: Comunicado[];
    onSave: (c: Comunicado) => void;
    onDelete: (id: string) => void;
    simpleView?: boolean;
}

const ComunicacionManager: React.FC<ComunicacionManagerProps> = ({ user, comunicados, onSave, onDelete, simpleView = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [tempImages, setTempImages] = useState<string[]>([]);
    const [formData, setFormData] = useState<Partial<Comunicado>>({ titulo: '', mensaje: '', importancia: 'NORMAL' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Protocolo SGI: Maestro, Administrador y Municipal pueden publicar.
    const canPublish = user.role === 'MAESTRO' || user.role === 'ADMINISTRADOR' || user.role === 'MUNICIPAL';

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Calidad aceptable para cartelera
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% calidad
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setTempImages(prev => [...prev, compressed]);
        } catch (err) {
            alert("Error procesando imagen.");
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            id: crypto.randomUUID(), 
            autor: `${user.nombreCompleto} (${user.cargo})`, 
            fecha: new Date().toISOString(),
            imagenUrl: tempImages[0] || ''
        } as Comunicado);
        setIsAdding(false);
        setTempImages([]);
        setFormData({ titulo: '', mensaje: '', importancia: 'NORMAL' });
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-bold uppercase text-xs outline-none focus:border-orange-500";

    return (
        <div className="space-y-8 animate-in fade-in">
            {!simpleView && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight"><Megaphone className="text-orange-500" /> Cartelera Institucional</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Circulares y Anuncios Oficiales CDCE Anzoátegui</p>
                    </div>
                    {canPublish && (
                        <button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl transition-all active:scale-95 flex items-center gap-2">
                            <Plus size={18}/> Crear Nuevo Aviso
                        </button>
                    )}
                </div>
            )}

            {simpleView && (
                <div className="flex items-center gap-3 mb-2 px-2">
                    <Megaphone className="text-[#003399]" size={20}/>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-tighter italic">Últimos Comunicados de Interés</h3>
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-orange-50 relative animate-in zoom-in duration-300">
                    <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={24}/></button>
                    <h3 className="font-black text-orange-600 uppercase text-sm mb-8 flex items-center gap-2">Redactar Mensaje a la Red</h3>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Título del Comunicado</label><input required className={inputStyle} value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} /></div>
                            <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cuerpo del Aviso</label><textarea required rows={4} className={inputStyle} value={formData.mensaje} onChange={e => setFormData({...formData, mensaje: e.target.value})} /></div>
                            
                            <div className="md:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block">Adjunto Visual</label>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-700 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 flex items-center gap-2 hover:bg-orange-50 transition-all">
                                        <Camera size={18}/> <span className="text-[10px] font-black uppercase">Subir Foto</span>
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} />
                                    
                                    <div className="flex gap-2">
                                        {tempImages.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={img} className="h-14 w-14 object-cover rounded-xl border-2 border-orange-200 shadow-md" alt="Preview" />
                                                <button type="button" onClick={() => setTempImages(tempImages.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Prioridad de Visualización</label>
                                <select className={inputStyle} value={formData.importancia} onChange={e => setFormData({...formData, importancia: e.target.value as any})}>
                                    <option value="NORMAL">NORMAL (DORADO)</option>
                                    <option value="ALTA">CRÍTICA (ROJO)</option>
                                    <option value="BAJA">INFORMATIVA (AZUL)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-[#003399] hover:bg-blue-800 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl transition-all active:scale-95 tracking-[0.1em]">Lanzar Comunicado Oficial</button>
                    </form>
                </div>
            )}

            <div className={`grid grid-cols-1 ${simpleView ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-8`}>
                {comunicados.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 font-black uppercase text-xs tracking-widest italic">No hay anuncios registrados actualmente</div>
                ) : comunicados.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(c => (
                    <div key={c.id} className={`bg-white rounded-3xl shadow-sm border-t-8 ${c.importancia === 'ALTA' ? 'border-t-rose-600 shadow-rose-900/5' : c.importancia === 'NORMAL' ? 'border-t-orange-500' : 'border-t-blue-500'} relative group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 hover:-translate-y-1`}>
                        {c.imagenUrl && (
                            <div className="h-64 w-full overflow-hidden relative bg-slate-100 cursor-pointer" onClick={() => setExpandedImage(c.imagenUrl || null)}>
                                <img src={c.imagenUrl} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" alt="Aviso" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28}/>
                                </div>
                            </div>
                        )}
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{new Date(c.fecha).toLocaleDateString()}</span>
                                {canPublish && !simpleView && (
                                    <button onClick={() => {if(confirm('¿BORRAR ESTE COMUNICADO?')) onDelete(c.id);}} className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 size={18}/>
                                    </button>
                                )}
                            </div>
                            <h4 className="font-black text-slate-900 uppercase text-sm leading-tight mb-4 tracking-tighter border-b border-slate-50 pb-4">{c.titulo}</h4>
                            <p className="text-[11px] text-slate-600 font-bold uppercase leading-relaxed mb-6 whitespace-pre-line">{c.mensaje}</p>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-8 -mb-8 p-6">
                                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12}/> {c.autor}</span>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${c.importancia === 'ALTA' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {c.importancia}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {expandedImage && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setExpandedImage(null)}>
                    <button className="absolute top-8 right-8 text-white hover:scale-125 transition-transform"><X size={48}/></button>
                    <div className="w-full max-w-6xl h-full flex items-center justify-center p-4">
                        <img src={expandedImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl animate-in zoom-in duration-500" alt="Vista Expandida" onClick={e => e.stopPropagation()} />
                    </div>
                    <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] mt-8 bg-[#003399] px-10 py-3 rounded-full shadow-2xl border border-white/20">SGI PRO - Visor de Cartelera</p>
                </div>
            )}
        </div>
    );
};

export default ComunicacionManager;