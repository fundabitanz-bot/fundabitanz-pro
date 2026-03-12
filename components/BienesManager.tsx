import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, BienesRegistro, BienItem, FirmaPerson } from '../types';
import { CONDICION_BIEN, GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { Monitor, Save, AlertCircle, Plus, Trash2, PackageOpen, FileSignature, Search, History, Edit, X, MapPin } from 'lucide-react';

interface BienesManagerProps {
  planteles: Plantel[];
  initialPlantelId?: string;
  bienesList: BienesRegistro[];
  onSaveBienes: (registro: BienesRegistro) => void;
  onDeleteBienes: (id: string) => void;
}

const BienesManager: React.FC<BienesManagerProps> = ({ planteles, initialPlantelId, bienesList, onSaveBienes, onDeleteBienes }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [bienes, setBienes] = useState<BienItem[]>([]);
  
  const [headerData, setHeaderData] = useState({ codigoOrganismo: '', codigoUnidadAdmin: '', codigoDependencia: '', directorNombre: '', directorCi: '', directorCargo: 'DIRECTOR(A)' });
  const [signatures, setSignatures] = useState<{ preparado: FirmaPerson; revisado: FirmaPerson; aprobado: FirmaPerson; recibido: FirmaPerson; }>({
      preparado: { nombre: '', ci: '', cargo: '' }, revisado: { nombre: '', ci: '', cargo: '' }, aprobado: { nombre: '', ci: '', cargo: '' }, recibido: { nombre: '', ci: '', cargo: '' }
  });

  const [newItem, setNewItem] = useState<Partial<BienItem>>({ estado: 'BUENO', tipo: '', descripcion: '', cantidad: 1, precioUnitario: 0 });

  useEffect(() => {
    const savedResponsable = localStorage.getItem('cdce_last_responsable');
    if (savedResponsable) {
        const respData = JSON.parse(savedResponsable);
        setSignatures(prev => ({ ...prev, preparado: { nombre: respData.nombre?.toUpperCase() || '', ci: respData.ci?.toUpperCase() || '', cargo: respData.cargo?.toUpperCase() || '' } }));
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
  const plantelHistory = bienesList.filter(b => b.plantelId === selectedPlantelId).sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());

  useEffect(() => {
      if(selectedPlantel && !isEditing) {
          setHeaderData(prev => ({ ...prev, codigoDependencia: selectedPlantel.codigoDependencia || '', directorNombre: selectedPlantel.director?.toUpperCase() || '', directorCi: selectedPlantel.ciDirector || '' }));
          setSignatures(prev => ({ ...prev, revisado: { nombre: selectedPlantel.director?.toUpperCase() || '', ci: selectedPlantel.ciDirector || '', cargo: 'DIRECTOR(A)' } }));
      }
  }, [selectedPlantelId, selectedPlantel, isEditing]);

  const addItem = () => {
      if(!newItem.descripcion || !newItem.tipo) return;
      const cant = newItem.cantidad || 1;
      const pu = newItem.precioUnitario || 0;
      setBienes([...bienes, { id: crypto.randomUUID(), numeroBien: newItem.numeroBien?.toUpperCase() || '', tipo: newItem.tipo.toUpperCase(), descripcion: newItem.descripcion.toUpperCase(), marca: newItem.marca?.toUpperCase() || '', modelo: newItem.modelo?.toUpperCase() || '', serial: newItem.serial?.toUpperCase() || '', color: newItem.color?.toUpperCase() || '', estado: newItem.estado || 'BUENO', ubicacionDireccion: newItem.ubicacionDireccion?.toUpperCase() || '', ubicacionCoordinacion: newItem.ubicacionCoordinacion?.toUpperCase() || '', responsableUso: newItem.responsableUso?.toUpperCase() || '', responsableCi: newItem.responsableCi?.toUpperCase() || '', responsableCargo: newItem.responsableCargo?.toUpperCase() || '', observacion: newItem.observacion?.toUpperCase() || '', cantidad: cant, precioUnitario: pu, precioTotal: cant * pu } as BienItem]);
      setNewItem({ estado: 'BUENO', tipo: '', descripcion: '', numeroBien: '', marca: '', modelo: '', serial: '', color: '', ubicacionDireccion: '', ubicacionCoordinacion: '', responsableUso: '', responsableCi: '', responsableCargo: '', observacion: '', cantidad: 1, precioUnitario: 0 });
  };

  const removeItem = (id: string) => setBienes(bienes.filter(b => b.id !== id));

  const handleEditRecord = (reg: BienesRegistro) => {
      setEditingId(reg.id);
      setIsEditing(true);
      setHeaderData({
          codigoOrganismo: reg.codigoOrganismo,
          codigoUnidadAdmin: reg.codigoUnidadAdmin,
          codigoDependencia: reg.codigoDependencia,
          directorNombre: reg.directorNombre,
          directorCi: reg.directorCi,
          directorCargo: 'DIRECTOR(A)'
      });
      setBienes(reg.bienes || []);
      setSignatures({
          preparado: reg.preparadoPor,
          revisado: reg.revisadoPor,
          aprobado: reg.aprobadoPor,
          recibido: reg.recibidoPor
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setIsEditing(false);
      setEditingId(null);
      setBienes([]);
      setNewItem({ estado: 'BUENO', tipo: '', descripcion: '', cantidad: 1, precioUnitario: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantel) return;
    onSaveBienes({ 
        id: editingId || crypto.randomUUID(), 
        plantelId: selectedPlantel.id, 
        fechaCarga: new Date().toISOString(), 
        ...headerData, 
        bienes, 
        preparadoPor: signatures.preparado, 
        revisadoPor: signatures.revisado, 
        aprobadoPor: signatures.aprobado, 
        recibidoPor: signatures.recibido 
    });
    setSuccessMsg(isEditing ? "¡INVENTARIO ACTUALIZADO EXITOSAMENTE!" : "¡INVENTARIO DE BIENES GUARDADO EXITOSAMENTE!");
    if(!isEditing) setBienes([]);
    else cancelEdit();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totalGeneral = bienes.reduce((acc, b) => acc + b.precioTotal, 0);
  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";
  const sectionTitleStyle = "bg-slate-800 p-6 font-black text-white text-[11px] flex items-center justify-between uppercase tracking-[0.2em]";
  const rowCellStyle = "p-4 text-slate-900 font-black uppercase text-[10px]";

  if (planteles.length === 0) return (
      <div className="bg-indigo-50 p-10 rounded-[40px] border-2 border-dashed border-indigo-200 flex flex-col items-center gap-4 text-indigo-700 uppercase font-black text-center animate-in zoom-in"><AlertCircle size={48} /><p>Debe registrar planteles institucionales antes de acceder al módulo de Bienes Nacionales.</p></div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tight">
            <Monitor className="text-indigo-600" size={28} /> Bienes Nacionales
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
        <form onSubmit={handleSubmit} className="animate-in slide-in-from-bottom-4 space-y-8">
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
                <div className={sectionTitleStyle}>
                    <div className="flex items-center gap-3"><FileSignature size={24}/> {isEditing ? 'Actualizando Inventario Local' : 'Cabecera de Inventario Oficial'}</div>
                    {isEditing && <button onClick={cancelEdit} className="text-rose-400 font-black flex items-center gap-2 text-[9px] uppercase border border-white/20 px-4 py-1.5 rounded-2xl hover:bg-white/10 transition-all"><X size={16}/> Cancelar</button>}
                </div>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <div><label className={labelStyle}>Ministerio / Organismo Rector</label><input className={`${inputStyle} opacity-50`} value="MPPE - NIVEL CENTRAL" readOnly /></div>
                         <div className="grid grid-cols-2 gap-4">
                             <div><label className={labelStyle}>Cód. Organismo</label><input className={inputStyle} value={headerData.codigoOrganismo} onChange={e => setHeaderData({...headerData, codigoOrganismo: e.target.value.toUpperCase()})} placeholder="EJ: 001" /></div>
                             <div><label className={labelStyle}>Unidad Admin.</label><input className={inputStyle} value={headerData.codigoUnidadAdmin} onChange={e => setHeaderData({...headerData, codigoUnidadAdmin: e.target.value.toUpperCase()})} placeholder="EJ: CDCE-AZ" /></div>
                         </div>
                    </div>
                    <div className="space-y-6">
                         <div><label className={labelStyle}>Dependencia Usuaria (Plantel)</label><input className={`${inputStyle} opacity-50`} value={selectedPlantel.nombre.toUpperCase()} readOnly /></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className={labelStyle}>Cód. Dependencia</label><input className={inputStyle} value={headerData.codigoDependencia} onChange={e => setHeaderData({...headerData, codigoDependencia: e.target.value.toUpperCase()})} placeholder="EJ: DEA..." /></div>
                             <div><label className={labelStyle}>Responsable Primario</label><input className={inputStyle} value={headerData.directorNombre} onChange={e => setHeaderData({...headerData, directorNombre: e.target.value.toUpperCase()})} /></div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className={sectionTitleStyle}><div className="flex items-center gap-3"><PackageOpen size={24}/> Relación Detallada de Activos</div></div>
                <div className="p-8 bg-slate-50 border-b border-slate-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-indigo-700 mb-4 uppercase tracking-[0.2em] ml-2">Incorporación de Nuevo Bien</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                        <div className="col-span-1"><label className={labelStyle}>Nº Bien</label><input className={inputStyle} value={newItem.numeroBien || ''} onChange={e => setNewItem({...newItem, numeroBien: e.target.value.toUpperCase()})} /></div>
                        <div className="col-span-1"><label className={labelStyle}>Tipo</label><input className={inputStyle} value={newItem.tipo || ''} onChange={e => setNewItem({...newItem, tipo: e.target.value.toUpperCase()})} /></div>
                        <div className="col-span-2"><label className={labelStyle}>Descripción Técnica</label><input className={inputStyle} value={newItem.descripcion || ''} onChange={e => setNewItem({...newItem, descripcion: e.target.value.toUpperCase()})} /></div>
                        <div className="col-span-1"><label className={labelStyle}>Cantidad</label><input type="number" min="1" className="w-full text-center text-xl font-black rounded-xl border-2 border-slate-300 bg-white text-slate-800 py-2.5" value={newItem.cantidad} onChange={e => setNewItem({...newItem, cantidad: parseInt(e.target.value) || 1})} /></div>
                        <div className="col-span-1"><label className={labelStyle}>Unit. (Bs)</label><input type="number" step="0.01" className={inputStyle} value={newItem.precioUnitario} onChange={e => setNewItem({...newItem, precioUnitario: parseFloat(e.target.value) || 0})} /></div>
                        <div className="col-span-1"><label className={labelStyle}>Estado Físico</label><select className={inputStyle} value={newItem.estado} onChange={e => setNewItem({...newItem, estado: e.target.value as any})}>
                            <option value="BUENO">BUENO</option>
                            <option value="REGULAR">REGULAR</option>
                            <option value="MALO">MALO</option>
                            <option value="DESINCORPORAR">PARA DESINCORPORAR</option>
                        </select></div>
                        <div className="col-span-1"><button type="button" onClick={addItem} className="bg-indigo-600 text-white p-4 w-full rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"><Plus size={18}/> Incluir</button></div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-black uppercase border-collapse">
                        <thead className="bg-slate-800 text-white">
                            <tr><th className="p-4 text-left tracking-widest">IDENTIFICADOR</th><th className="p-4 text-left tracking-widest">DESCRIPCIÓN ACTIVO</th><th className="p-4 text-center tracking-widest">CANT</th><th className="p-4 text-right tracking-widest">UNITARIO</th><th className="p-4 text-right tracking-widest">TOTAL VALOR</th><th className="p-4 tracking-widest">ESTADO</th><th className="p-4"></th></tr>
                        </thead>
                        <tbody>
                            {bienes.map(item => (<tr key={item.id} className="border-b border-slate-50 hover:bg-indigo-50/20 transition-all group">
                                    <td className={rowCellStyle}>{item.numeroBien || 'S/N'}</td>
                                    <td className={rowCellStyle}>{item.tipo} - {item.descripcion}</td>
                                    <td className={`${rowCellStyle} text-center font-black text-slate-400`}>{item.cantidad}</td>
                                    <td className={`${rowCellStyle} text-right`}>{item.precioUnitario.toFixed(2)}</td>
                                    <td className={`${rowCellStyle} text-right text-indigo-900 font-black`}>{item.precioTotal.toFixed(2)}</td>
                                    <td className={`${rowCellStyle} text-center`}><span className="bg-white px-3 py-1 rounded-lg border shadow-sm">{item.estado}</span></td>
                                    <td className="p-4 text-right"><button type="button" onClick={() => removeItem(item.id)} className="text-rose-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button></td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-slate-900 text-white flex justify-between items-center rounded-b-[40px]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Valor Total del Inventario</span>
                        <span className="text-4xl font-black tracking-tighter">Bs. {totalGeneral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                <h3 className={sectionTitleStyle}><div className="flex items-center gap-3"><FileSignature size={24}/> Validación de Firmas Autorizadas</div></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    {['preparado', 'revisado', 'aprobado', 'recibido'].map((type) => (
                        <div key={type} className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-[#003399] uppercase tracking-widest text-center border-b pb-2 mb-4">{type.toUpperCase()} POR</p>
                            <input className={inputStyle} value={signatures[type as keyof typeof signatures].nombre} onChange={e => setSignatures({...signatures, [type]: {...signatures[type as keyof typeof signatures], nombre: e.target.value.toUpperCase()}})} placeholder="NOMBRE" />
                            <input className={inputStyle} value={signatures[type as keyof typeof signatures].ci} onChange={e => setSignatures({...signatures, [type]: {...signatures[type as keyof typeof signatures], ci: e.target.value.toUpperCase()}})} placeholder="CÉDULA" />
                            <input className={inputStyle} value={signatures[type as keyof typeof signatures].cargo} onChange={e => setSignatures({...signatures, [type]: {...signatures[type as keyof typeof signatures], cargo: e.target.value.toUpperCase()}})} placeholder="CARGO" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4"><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-20 rounded-[32px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest text-xs"><Save size={24}/> {isEditing ? 'Actualizar Relación de Bienes' : 'Guardar Inventario Consolidado'}</button></div>
            {successMsg && <div className="fixed bottom-10 right-10 bg-emerald-600 text-white p-5 rounded-2xl text-center font-black uppercase shadow-2xl animate-in fade-in z-50">{successMsg}</div>}
        </form>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-12 mb-20">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                <History className="text-indigo-600" size={24} /> Historial de Movimientos de Bienes
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-5">FECHA REPORTE</th>
                            <th className="px-6 py-5">CÓD. DEPENDENCIA</th>
                            <th className="px-6 py-5">NRO BIENES</th>
                            <th className="px-6 py-5 text-right">VALOR TOTAL</th>
                            <th className="px-6 py-5 text-center">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plantelHistory.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin registros de inventario</td></tr>
                        ) : (
                            plantelHistory.map(reg => (
                                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-black text-slate-600">{new Date(reg.fechaCarga).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-black text-slate-800 uppercase">{reg.codigoDependencia}</td>
                                    <td className="px-6 py-4 font-black text-slate-500 uppercase">{reg.bienes?.length || 0} ITEMS</td>
                                    <td className="px-6 py-4 text-right font-black text-indigo-700">Bs. {reg.bienes?.reduce((a,b)=>a+b.precioTotal, 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEditRecord(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="EDITAR"><Edit size={18}/></button>
                                            <button onClick={() => { if(confirm('¿ELIMINAR ESTE REGISTRO?')) onDeleteBienes(reg.id); }} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="BORRAR"><Trash2 size={18}/></button>
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

export default BienesManager;