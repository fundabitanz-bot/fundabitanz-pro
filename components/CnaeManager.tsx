import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, CnaeRegistro, InventarioItem, AlimentoItem } from '../types';
import { UTENSILIOS_COCINA, ARTEFACTOS_ELECTRICOS, TIPOS_ALIMENTO, CONDICION_USO, GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { ChefHat, Save, AlertCircle, UtensilsCrossed, Refrigerator, Beef, Truck, Plus, Trash2, ClipboardList, History, Edit, X, MapPin, Search } from 'lucide-react';

const CnaeManager: React.FC<{ planteles: Plantel[], initialPlantelId?: string, cnaeList: CnaeRegistro[], onSaveCnae: (r: CnaeRegistro) => void, onDeleteCnae: (id: string) => void }> = ({ planteles, initialPlantelId, cnaeList, onSaveCnae, onDeleteCnae }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [utensilios, setUtensilios] = useState<InventarioItem[]>([]);
  const [artefactos, setArtefactos] = useState<InventarioItem[]>([]);
  const [alimentos, setAlimentos] = useState<AlimentoItem[]>([]);

  const [newUtensilio, setNewUtensilio] = useState<Partial<InventarioItem>>({});
  const [newArtefacto, setNewArtefacto] = useState<Partial<InventarioItem>>({});
  const [newAlimento, setNewAlimento] = useState<Partial<AlimentoItem>>({});

  const [formData, setFormData] = useState({
    recibioPae: false, fechaRecepcionPae: '', recibioDotacion: false, fechaRecepcionDotacion: '', equiposDotacion: '',
    observacionGeneral: '', respNombre: '', respCi: '', respCargo: '', respTelefono: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('cdce_last_responsable');
    if (saved) {
        const respData = JSON.parse(saved);
        setFormData(prev => ({ ...prev, respNombre: respData.nombre?.toUpperCase() || '', respCi: respData.ci?.toUpperCase() || '', respCargo: respData.cargo?.toUpperCase() || '', respTelefono: respData.telefono?.toUpperCase() || '' }));
    }
  }, []);

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
  const plantelHistory = cnaeList.filter(c => c.plantelId === selectedPlantelId).sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());

  const addUtensilio = () => {
    if(!newUtensilio.nombre || !newUtensilio.cantidad || !newUtensilio.condicion) return;
    setUtensilios([...utensilios, { ...newUtensilio, nombre: newUtensilio.nombre.toUpperCase() } as InventarioItem]);
    setNewUtensilio({});
  };

  const addArtefacto = () => {
    if(!newArtefacto.nombre || !newArtefacto.cantidad || !newArtefacto.condicion) return;
    setArtefactos([...artefactos, { ...newArtefacto, nombre: newArtefacto.nombre.toUpperCase() } as InventarioItem]);
    setNewArtefacto({});
  };

  const addAlimento = () => {
    if(!newAlimento.tipo || !newAlimento.rubro || !newAlimento.cantidad || !newAlimento.unidad || !newAlimento.condicion) return;
    setAlimentos([...alimentos, { ...newAlimento, rubro: newAlimento.rubro.toUpperCase() } as AlimentoItem]);
    setNewAlimento({});
  };

  const removeUtensilio = (idx: number) => setUtensilios(utensilios.filter((_, i) => i !== idx));
  const removeArtefacto = (idx: number) => setArtefactos(artefactos.filter((_, i) => i !== idx));
  const removeAlimento = (idx: number) => setAlimentos(alimentos.filter((_, i) => i !== idx));

  const handleEditRecord = (reg: CnaeRegistro) => {
      setEditingId(reg.id);
      setIsEditing(true);
      setFormData({
          recibioPae: reg.recibioPae,
          fechaRecepcionPae: reg.fechaRecepcionPae || '',
          recibioDotacion: reg.recibioDotacion,
          fechaRecepcionDotacion: reg.fechaRecepcionDotacion || '',
          equiposDotacion: reg.equiposDotacion || '',
          observacionGeneral: reg.observacionGeneral || '',
          respNombre: reg.responsableNombre,
          respCi: reg.responsableCi,
          respCargo: reg.responsableCargo,
          respTelefono: reg.responsableTelefono
      });
      setUtensilios(reg.utensilios || []);
      setArtefactos(reg.artefactos || []);
      setAlimentos(reg.alimentos || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setIsEditing(false);
      setEditingId(null);
      setUtensilios([]); setArtefactos([]); setAlimentos([]);
      setFormData(prev => ({...prev, recibioPae: false, fechaRecepcionPae: '', recibioDotacion: false, fechaRecepcionDotacion: '', equiposDotacion: '', observacionGeneral: ''}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantel) return;
    const responsableData = { nombre: formData.respNombre.toUpperCase(), ci: formData.respCi.toUpperCase(), cargo: formData.respCargo.toUpperCase(), telefono: formData.respTelefono.toUpperCase() };
    localStorage.setItem('cdce_last_responsable', JSON.stringify(responsableData));
    
    onSaveCnae({ 
        id: editingId || crypto.randomUUID(), 
        plantelId: selectedPlantel.id, 
        fechaCarga: new Date().toISOString(), 
        recibioPae: formData.recibioPae, 
        fechaRecepcionPae: formData.fechaRecepcionPae, 
        recibioDotacion: formData.recibioDotacion, 
        fechaRecepcionDotacion: formData.fechaRecepcionDotacion, 
        equiposDotacion: formData.equiposDotacion.toUpperCase(), 
        utensilios, 
        artefactos, 
        alimentos, 
        observacionGeneral: formData.observacionGeneral.toUpperCase(), 
        responsableNombre: formData.respNombre.toUpperCase(), 
        responsableCi: formData.respCi.toUpperCase(), 
        responsableCargo: formData.respCargo.toUpperCase(), 
        responsableTelefono: formData.respTelefono.toUpperCase() 
    });
    
    setSuccessMsg(isEditing ? "¡REGISTRO ACTUALIZADO EXITOSAMENTE!" : "¡REPORTE CNAE GUARDADO EXITOSAMENTE!");
    if(!isEditing) {
        setUtensilios([]); setArtefactos([]); setAlimentos([]);
        setFormData(prev => ({...prev, recibioPae: false, fechaRecepcionPae: '', recibioDotacion: false, fechaRecepcionDotacion: '', equiposDotacion: '', observacionGeneral: ''}));
    } else {
        cancelEdit();
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";
  const tableHeaderStyle = "bg-slate-800 text-white p-3 text-center text-[10px] font-black uppercase tracking-widest";
  const rowCellStyle = "p-3 text-slate-900 font-bold uppercase text-[11px]";

  if (planteles.length === 0) return (
      <div className="bg-orange-50 p-10 rounded-[40px] border-2 border-dashed border-orange-200 flex flex-col items-center gap-4 text-orange-700 uppercase font-black text-center animate-in zoom-in"><AlertCircle size={48} /><p>Debe registrar planteles institucionales antes de acceder al módulo CNAE/PAE.</p></div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tight">
            <ChefHat className="text-orange-600" size={28} /> Gestión CNAE / PAE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Estado</label>
                <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId(''); cancelEdit();}}>
                    <option value="">VENEZUELA (TODOS)</option>
                    {Object.keys(GEOGRAFIA_VENEZUELA).sort().map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Municipio</label>
                <select className={inputStyle} value={selectedMunicipio} onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId(''); cancelEdit();}} disabled={!selectedEstado}>
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
                <select className={inputStyle} value={selectedPlantelId} onChange={(e) => { setSelectedPlantelId(e.target.value); cancelEdit(); }}>
                    <option value="">-- SELECCIONE UN PLANTEL --</option>
                    {filteredPlantelesList.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
          </div>
       </div>

       {selectedPlantel && (
        <>
        <form onSubmit={handleSubmit} className="animate-in slide-in-from-bottom-4 space-y-6">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                <div className="p-4 border-b border-orange-100 bg-orange-50/50 rounded-2xl flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3 text-orange-800 font-black uppercase text-xs"><Truck size={20}/> {isEditing ? 'Actualizando Reporte' : 'Control de Recepción de Insumos'}</div>
                    {isEditing && <button onClick={cancelEdit} className="text-red-500 font-black flex items-center gap-2 text-[10px] uppercase border-2 border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-50 transition-all"><X size={16}/> Cancelar</button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-8 bg-orange-100/50 rounded-[32px] border-2 border-orange-200 shadow-inner">
                            <label className="font-black text-slate-800 uppercase text-xs flex-1 tracking-widest">¿Se recibió el despacho PAE?</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setFormData({...formData, recibioPae: true})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${formData.recibioPae ? 'bg-orange-600 text-white border-orange-700 shadow-lg' : 'bg-white text-slate-400'}`}>SI</button>
                                <button type="button" onClick={() => setFormData({...formData, recibioPae: false, fechaRecepcionPae: ''})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${!formData.recibioPae ? 'bg-slate-700 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-400'}`}>NO</button>
                            </div>
                        </div>
                        {formData.recibioPae && (
                             <div className="animate-in slide-in-from-top-4">
                                <label className={labelStyle}>Fecha de Recepción del Despacho</label>
                                <input type="date" className={inputStyle} required value={formData.fechaRecepcionPae} onChange={e => setFormData({...formData, fechaRecepcionPae: e.target.value})} />
                             </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-8 bg-blue-100/50 rounded-[32px] border-2 border-blue-200 shadow-inner">
                            <label className="font-black text-slate-800 uppercase text-xs flex-1 tracking-widest">¿Recibió dotación de equipos?</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setFormData({...formData, recibioDotacion: true})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${formData.recibioDotacion ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-white text-slate-400'}`}>SI</button>
                                <button type="button" onClick={() => setFormData({...formData, recibioDotacion: false, fechaRecepcionDotacion: '', equiposDotacion: ''})} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${!formData.recibioDotacion ? 'bg-slate-700 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-400'}`}>NO</button>
                            </div>
                        </div>
                        {formData.recibioDotacion && (
                            <div className="space-y-4 animate-in slide-in-from-top-4">
                                <div><label className={labelStyle}>Fecha de Dotación</label><input type="date" className={inputStyle} required value={formData.fechaRecepcionDotacion} onChange={e => setFormData({...formData, fechaRecepcionDotacion: e.target.value})} /></div>
                                <div><label className={labelStyle}>Detalle de los Equipos Recibidos</label><textarea rows={2} className={`${inputStyle} h-24 text-[11px] leading-relaxed`} required value={formData.equiposDotacion} onChange={e => setFormData({...formData, equiposDotacion: e.target.value.toUpperCase()})} placeholder="EJ: 1 COCINA INDUSTRIAL, 2 CONGELADORES..." /></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3 text-orange-800 font-black uppercase text-xs mb-6"><UtensilsCrossed size={18}/> Inventario de Utensilios</div>
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 grid grid-cols-1 gap-4 items-end mb-6 shadow-inner">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><label className={labelStyle}>Nombre del Utensilio</label><select className={inputStyle} value={newUtensilio.nombre || ''} onChange={e => setNewUtensilio({...newUtensilio, nombre: e.target.value.toUpperCase()})}><option value="">- SELECCIONE -</option>{UTENSILIOS_COCINA.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                            <div><label className={labelStyle}>Cantidad</label><input type="number" className={inputStyle} placeholder="0" value={newUtensilio.cantidad || ''} onChange={e => setNewUtensilio({...newUtensilio, cantidad: parseInt(e.target.value)})} /></div>
                            <div><label className={labelStyle}>Estado</label><select className={inputStyle} value={newUtensilio.condicion || ''} onChange={e => setNewUtensilio({...newUtensilio, condicion: e.target.value as any})}><option value="">- SELECCIONE -</option>{CONDICION_USO.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></div>
                        </div>
                        <button type="button" onClick={addUtensilio} className="bg-orange-600 text-white py-3 w-full rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 tracking-widest"><Plus size={16}/> Añadir al Listado</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        <table className="w-full text-[10px] font-black uppercase border-collapse">
                            <thead><tr className="border-b-2 border-slate-100"><th className={tableHeaderStyle}>DESCRIPCIÓN</th><th className={tableHeaderStyle}>CANT</th><th className={tableHeaderStyle}>ESTADO</th><th className={tableHeaderStyle}>OPC</th></tr></thead>
                            <tbody>{utensilios.map((item, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-orange-50/30 transition-all"><td className={rowCellStyle}>{item.nombre}</td><td className={`${rowCellStyle} text-center font-black text-slate-400`}>{item.cantidad}</td><td className={rowCellStyle}><span className="bg-white px-2 py-0.5 rounded-lg border shadow-sm">{item.condicion}</span></td><td className="p-3 text-right"><button type="button" onClick={() => removeUtensilio(i)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 text-blue-800 font-black uppercase text-xs mb-6"><Refrigerator size={18}/> Equipos Electromecánicos</div>
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 grid grid-cols-1 gap-4 items-end mb-6 shadow-inner">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><label className={labelStyle}>Artefacto / Equipo</label><select className={inputStyle} value={newArtefacto.nombre || ''} onChange={e => setNewArtefacto({...newArtefacto, nombre: e.target.value.toUpperCase()})}><option value="">- SELECCIONE -</option>{ARTEFACTOS_ELECTRICOS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                            <div><label className={labelStyle}>Cantidad</label><input type="number" className={inputStyle} placeholder="0" value={newArtefacto.cantidad || ''} onChange={e => setNewArtefacto({...newArtefacto, cantidad: parseInt(e.target.value)})} /></div>
                            <div><label className={labelStyle}>Condición</label><select className={inputStyle} value={newArtefacto.condicion || ''} onChange={e => setNewArtefacto({...newArtefacto, condicion: e.target.value as any})}><option value="">- SELECCIONE -</option>{CONDICION_USO.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></div>
                        </div>
                        <button type="button" onClick={addArtefacto} className="bg-blue-600 text-white py-3 w-full rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 tracking-widest"><Plus size={16}/> Añadir al Listado</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                         <table className="w-full text-[10px] font-black uppercase border-collapse">
                            <thead><tr className="border-b-2 border-slate-100"><th className={tableHeaderStyle}>DESCRIPCIÓN</th><th className={tableHeaderStyle}>CANT</th><th className={tableHeaderStyle}>ESTADO</th><th className={tableHeaderStyle}>OPC</th></tr></thead>
                            <tbody>{artefactos.map((item, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-all"><td className={rowCellStyle}>{item.nombre}</td><td className={`${rowCellStyle} text-center font-black text-slate-400`}>{item.cantidad}</td><td className={rowCellStyle}><span className="bg-white px-2 py-0.5 rounded-lg border shadow-sm">{item.condicion}</span></td><td className="p-3 text-right"><button type="button" onClick={() => removeArtefacto(i)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 text-orange-800 font-black uppercase text-xs mb-8 border-b pb-4"><Beef size={24}/> Inventario de Despensa (Alimentos Disponibles)</div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end p-8 bg-slate-50 rounded-[40px] mb-8 border border-slate-100 shadow-inner">
                    <div className="md:col-span-3"><label className={labelStyle}>Tipo Rubro</label><select className={inputStyle} value={newAlimento.tipo || ''} onChange={e => setNewAlimento({...newAlimento, tipo: e.target.value as any})}><option value="">- SELECCIONE -</option>{TIPOS_ALIMENTO.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
                    <div className="md:col-span-3"><label className={labelStyle}>Rubro / Alimento</label><input className={inputStyle} placeholder="EJ: ARROZ" value={newAlimento.rubro || ''} onChange={e => setNewAlimento({...newAlimento, rubro: e.target.value.toUpperCase()})} /></div>
                    <div className="md:col-span-2"><label className={labelStyle}>Cantidad</label><input type="number" step="0.01" className={inputStyle} placeholder="0.00" value={newAlimento.cantidad || ''} onChange={e => setNewAlimento({...newAlimento, cantidad: parseFloat(e.target.value)})} /></div>
                    <div className="md:col-span-2"><label className={labelStyle}>U.M.</label><select className={inputStyle} value={newAlimento.unidad || ''} onChange={e => setNewAlimento({...newAlimento, unidad: e.target.value as any})}><option value="">UNIDAD</option><option value="Kg">KG</option><option value="Litros">LITROS</option><option value="Unidades">UNIDADES</option><option value="Bultos">BULTOS</option></select></div>
                    <div className="md:col-span-2"><label className={labelStyle}>Condición</label><select className={inputStyle} value={newAlimento.condicion || ''} onChange={e => setNewAlimento({...newAlimento, condicion: e.target.value as any})}><option value="">ESTADO</option><option value="Apto">APTO</option><option value="Por Vencer">POR VENCER</option><option value="No Apto">NO APTO</option></select></div>
                    <div className="md:col-span-12 flex justify-end mt-2"><button type="button" onClick={addAlimento} className="bg-orange-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-orange-700 transition-all flex items-center gap-2"><Plus size={18}/> Registrar Rubro</button></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-black uppercase border-collapse">
                        <thead><tr className="bg-slate-800 text-white"><th className="p-4 text-left">TIPO</th><th className="p-4 text-left">RUBRO</th><th className="p-4 text-center">CANTIDAD</th><th className="p-4 text-center">ESTADO</th><th className="p-4"></th></tr></thead>
                        <tbody>{alimentos.map((item, i) => (<tr key={i} className="border-b border-slate-100 hover:bg-orange-50/20 transition-all"><td className={rowCellStyle}>{item.tipo}</td><td className={rowCellStyle}>{item.rubro}</td><td className={`${rowCellStyle} text-center font-black text-slate-500`}>{item.cantidad} {item.unidad}</td><td className={`${rowCellStyle} text-center`}><span className={`px-3 py-1 rounded-lg border shadow-sm ${item.condicion === 'Apto' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{item.condicion}</span></td><td className="p-4 text-right"><button type="button" onClick={() => removeAlimento(i)} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody>
                    </table>
                    {alimentos.length === 0 && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay alimentos registrados en el inventario actual</p>}
                </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[50px] shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Observaciones Generales de la Auditoría</label>
                        <textarea rows={5} className="w-full rounded-2xl border-2 border-white/10 p-4 bg-white/5 text-white font-bold uppercase text-[11px] outline-none focus:border-blue-500 leading-relaxed" value={formData.observacionGeneral} onChange={e => setFormData({...formData, observacionGeneral: e.target.value.toUpperCase()})} placeholder="INDIQUE CUALQUIER NOVEDAD RELEVANTE..." />
                    </div>
                    <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                         <h4 className="text-white font-black mb-6 text-[10px] uppercase tracking-[0.3em] flex items-center gap-3"><ClipboardList size={20} className="text-blue-500"/> Personal de Validación CNAE</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[8px] font-black text-white/30 uppercase ml-2 mb-1">Nombre</label><input required className="w-full rounded-xl border-2 border-white/5 p-2 bg-white/5 text-white font-bold uppercase text-[10px] outline-none" value={formData.respNombre} onChange={e => setFormData({...formData, respNombre: e.target.value.toUpperCase()})} /></div>
                            <div><label className="text-[8px] font-black text-white/30 uppercase ml-2 mb-1">Cédula</label><input required className="w-full rounded-xl border-2 border-white/5 p-2 bg-white/5 text-white font-bold uppercase text-[10px] outline-none" value={formData.respCi} onChange={e => setFormData({...formData, respCi: e.target.value.toUpperCase()})} /></div>
                            <div><label className="text-[8px] font-black text-white/30 uppercase ml-2 mb-1">Cargo</label><input required className="w-full rounded-xl border-2 border-white/5 p-2 bg-white/5 text-white font-bold uppercase text-[10px] outline-none" value={formData.respCargo} onChange={e => setFormData({...formData, respCargo: e.target.value.toUpperCase()})} /></div>
                            <div><label className="text-[8px] font-black text-white/30 uppercase ml-2 mb-1">Teléfono</label><input required className="w-full rounded-xl border-2 border-white/5 p-2 bg-white/5 text-white font-bold uppercase text-[10px] outline-none" value={formData.respTelefono} onChange={e => setFormData({...formData, respTelefono: e.target.value.toUpperCase()})} /></div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4"><button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-black py-5 px-20 rounded-[32px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest text-xs"><Save size={24} /> {isEditing ? 'Actualizar Expediente CNAE' : 'Finalizar Reporte CNAE/PAE'}</button></div>
             {successMsg && <div className="fixed bottom-10 right-10 bg-emerald-600 text-white p-5 rounded-2xl text-center font-black animate-in shadow-2xl uppercase z-[200]">{successMsg}</div>}
        </form>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-12 mb-20">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                <History className="text-orange-600" size={24} /> Historial de Auditorías CNAE / PAE
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-5">FECHA REPORTE</th>
                            <th className="px-6 py-5">ESTATUS PAE</th>
                            <th className="px-6 py-5">EQUIPAMIENTO</th>
                            <th className="px-6 py-5">RESPONSABLE</th>
                            <th className="px-6 py-5 text-center">OPERACIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plantelHistory.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin registros institucionales</td></tr>
                        ) : (
                            plantelHistory.map(reg => (
                                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-black text-slate-600">{new Date(reg.fechaCarga).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${reg.recibioPae ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                            {reg.recibioPae ? 'DESPACHADO' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${reg.recibioDotacion ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {reg.recibioDotacion ? 'DOTACIÓN RECIBIDA' : 'SIN NOVEDAD'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-800 uppercase text-[11px]">{reg.responsableNombre}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">{reg.responsableCargo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEditRecord(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="EDITAR"><Edit size={18}/></button>
                                            <button onClick={() => { if(confirm('¿ELIMINAR ESTE REGISTRO?')) onDeleteCnae(reg.id); }} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="BORRAR"><Trash2 size={18}/></button>
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

export default CnaeManager;