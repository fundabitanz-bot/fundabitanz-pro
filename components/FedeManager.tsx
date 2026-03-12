import React, { useState, useEffect, useMemo } from 'react';
import { Plantel, FedeRegistro } from '../types';
import { TIPOS_ESTRUCTURA, ESTADO_INFRAESTRUCTURA, SERVICIOS_AGUA, SERVICIOS_ELECTRICIDAD, SERVICIOS_AGUAS_SERVIDAS, SERVICIOS_GAS, ESTATUS_SOLICITUD, ESTATUS_OBRA, GEOGRAFIA_VENEZUELA } from '../utils/constants';
import { Hammer, Save, AlertCircle, HardHat, Droplets, PaintRoller, Armchair, ClipboardCheck, Search, Construction, FileText, History, Edit, Trash2, X, MapPin } from 'lucide-react';

const FedeManager: React.FC<{ planteles: Plantel[], fedeList: FedeRegistro[], onSaveFede: (r: FedeRegistro) => void, onDeleteFede: (id: string) => void, initialPlantelId?: string }> = ({ planteles, initialPlantelId, fedeList, onSaveFede, onDeleteFede }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<FedeRegistro>>({
    tipoEstructura: '', anoConstruccion: '', estadoGeneral: 'REGULAR', agua: '', electricidad: '', aguasServidas: '', gas: '', 
    aseoUrbano: false, necesidadPintura: false, necesidadImpermeabilizacion: false, necesidadSanitarios: false, necesidadElectrico: false, necesidadCercado: false, 
    necMesasillas: 0, necPupitres: 0, necPizarrones: 0, necEscritorios: 0, 
    atendidoBricomiles: false, fechaBricomiles: '', descripcionBricomiles: '',
    solicitudFede: false, estatusSolicitud: 'Sin Solicitud', 
    proyectoActivo: false, nombreProyecto: '', fechaInicioProyecto: '', fechaFinProyecto: '', estatusObra: 'No Iniciada', porcentajeAvance: 0
  });

  const [responsable, setResponsable] = useState({ nombre: '', ci: '', cargo: '', telefono: '' });

  useEffect(() => {
    const saved = localStorage.getItem('cdce_last_responsable');
    if (saved) setResponsable(JSON.parse(saved));
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
  const plantelHistory = fedeList.filter(f => f.plantelId === selectedPlantelId).sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());

  const handleEditRecord = (reg: FedeRegistro) => {
      setEditingId(reg.id);
      setIsEditing(true);
      setFormData(reg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setIsEditing(false);
      setEditingId(null);
      setFormData({ 
          estadoGeneral: 'REGULAR', estatusSolicitud: 'Sin Solicitud', atendidoBricomiles: false, proyectoActivo: false,
          aseoUrbano: false, necesidadPintura: false, necesidadImpermeabilizacion: false, necesidadSanitarios: false, 
          necesidadElectrico: false, necesidadCercado: false, porcentajeAvance: 0
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPlantelId) return;
      localStorage.setItem('cdce_last_responsable', JSON.stringify(responsable));

      onSaveFede({ 
          ...formData,
          id: editingId || crypto.randomUUID(), 
          plantelId: selectedPlantelId, 
          fechaCarga: new Date().toISOString(),
          descripcionBricomiles: formData.descripcionBricomiles?.toUpperCase() || '', 
          nombreProyecto: formData.nombreProyecto?.toUpperCase() || ''
      } as FedeRegistro);

      setSuccessMsg(isEditing ? "¡REGISTRO ACTUALIZADO EXITOSAMENTE!" : "¡REPORTE DE INFRAESTRUCTURA GUARDADO EXITOSAMENTE!");
      if(isEditing) cancelEdit();
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";
  const sectionStyle = "bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mb-8";
  const headerStyle = "font-black text-slate-800 text-[11px] border-b-2 border-yellow-400 pb-3 mb-8 flex justify-between items-center uppercase tracking-widest";

  if (planteles.length === 0) return (
      <div className="bg-orange-50 p-10 rounded-[40px] border-2 border-dashed border-orange-200 flex flex-col items-center gap-4 text-orange-700 uppercase font-black text-center animate-in zoom-in"><AlertCircle size={48} /><p>Debe registrar planteles para acceder al módulo de infraestructura FEDE.</p></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
       <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tight">
                <Hammer className="text-red-600" size={28} /> FEDE / Infraestructura Escolar
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                    <label className={labelStyle}>Estado</label>
                    <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}>
                        <option value="">VENEZUELA (TODOS)</option>
                        {Object.keys(GEOGRAFIA_VENEZUELA).sort().map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelStyle}>Municipio</label>
                    <select className={inputStyle} value={selectedMunicipio} onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId('');}} disabled={!selectedEstado}>
                        <option value="">TODOS LOS MUNICIPIOS</option>
                        {selectedEstado && Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado] || {}).sort().map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelStyle}>Buscar por Nombre o DEA</label>
                    <div className="relative">
                        <input className={inputStyle} placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Plantel Específico</label>
                    <select className={inputStyle} value={selectedPlantelId} onChange={(e) => { setSelectedPlantelId(e.target.value); cancelEdit(); }}>
                        <option value="">-- SELECCIONE UN PLANTEL --</option>
                        {filteredPlantelesList.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                    </select>
                </div>
           </div>
       </div>

       {selectedPlantelId && (
           <>
           <form onSubmit={handleSubmit} className="animate-in slide-in-from-bottom-4">
               <div className={sectionStyle}>
                   <h3 className={headerStyle}>
                       <div className="flex items-center gap-3"><HardHat size={24} className="text-red-600"/> 1. Caracterización Técnica {isEditing && '- MODO EDICIÓN'}</div>
                       {isEditing && <button type="button" onClick={cancelEdit} className="text-red-500 font-black flex items-center gap-2 text-[10px] uppercase border-2 border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-50 transition-all"><X size={16}/> Cancelar</button>}
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div><label className={labelStyle}>Tipo de Estructura</label><select className={inputStyle} value={formData.tipoEstructura || ''} onChange={e => setFormData({...formData, tipoEstructura: e.target.value.toUpperCase()})}><option value="">SELECCIONE...</option>{TIPOS_ESTRUCTURA.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}</select></div>
                       <div><label className={labelStyle}>Año de Construcción</label><input type="text" placeholder="EJ: 1995" className={inputStyle} value={formData.anoConstruccion || ''} onChange={e => setFormData({...formData, anoConstruccion: e.target.value})} /></div>
                       <div><label className={labelStyle}>Estado General</label><select className={inputStyle} value={formData.estadoGeneral} onChange={e => setFormData({...formData, estadoGeneral: e.target.value as any})}>{ESTADO_INFRAESTRUCTURA.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
                   </div>
               </div>
               
               <div className={sectionStyle}><h3 className={headerStyle}><Droplets size={24} className="text-blue-600"/> 2. Servicios Básicos e Higiene</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                       <div><label className={labelStyle}>Suministro Agua</label><select className={inputStyle} value={formData.agua || ''} onChange={e => setFormData({...formData, agua: e.target.value.toUpperCase()})}><option value="">SELECCIONE...</option>{SERVICIOS_AGUA.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}</select></div>
                       <div><label className={labelStyle}>Electricidad</label><select className={inputStyle} value={formData.electricidad || ''} onChange={e => setFormData({...formData, electricidad: e.target.value.toUpperCase()})}><option value="">SELECCIONE...</option>{SERVICIOS_ELECTRICIDAD.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}</select></div>
                       <div><label className={labelStyle}>Aguas Servidas</label><select className={inputStyle} value={formData.aguasServidas || ''} onChange={e => setFormData({...formData, aguasServidas: e.target.value.toUpperCase()})}><option value="">SELECCIONE...</option>{SERVICIOS_AGUAS_SERVIDAS.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}</select></div>
                       <div><label className={labelStyle}>Sist. Gas</label><select className={inputStyle} value={formData.gas || ''} onChange={e => setFormData({...formData, gas: e.target.value.toUpperCase()})}><option value="">SELECCIONE...</option>{SERVICIOS_GAS.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}</select></div>
                       <div className="flex items-end pb-1.5">
                           <label className="flex items-center gap-3 cursor-pointer bg-blue-50 p-3 rounded-xl border-2 border-blue-100 font-black text-blue-900 text-[10px] uppercase w-full shadow-sm hover:bg-blue-100 transition-all">
                               <input type="checkbox" className="h-5 w-5 rounded border-blue-300" checked={formData.aseoUrbano || false} onChange={e => setFormData({...formData, aseoUrbano: e.target.checked})} /> Aseo Urbano
                           </label>
                       </div>
                   </div>
               </div>

               <div className={sectionStyle}><h3 className={headerStyle}><PaintRoller size={24} className="text-orange-600"/> 3. Necesidades de Rehabilitación</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                       {[
                           { key: 'necesidadPintura', label: 'Pintura' },
                           { key: 'necesidadImpermeabilizacion', label: 'Impermeabilización' },
                           { key: 'necesidadSanitarios', label: 'Baños/Sanitarios' },
                           { key: 'necesidadElectrico', label: 'Sist. Eléctrico' },
                           { key: 'necesidadCercado', label: 'Cercado/Pared' }
                       ].map((nec) => (
                           <label key={nec.key} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-700 text-[10px] uppercase shadow-sm cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all">
                               <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-red-600" checked={(formData as any)[nec.key] || false} onChange={e => setFormData({...formData, [nec.key]: e.target.checked})} /> {nec.label}
                           </label>
                       ))}
                   </div>
               </div>

               <div className={sectionStyle}><h3 className={headerStyle}><Construction size={24} className="text-slate-900"/> 4. Bricomiles y Proyectos de Inversión</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6 p-8 border-2 border-red-100 rounded-[40px] bg-red-50/20">
                            <label className="flex items-center gap-4 font-black text-red-900 uppercase text-xs cursor-pointer group">
                                <input type="checkbox" className="h-8 w-8 rounded-xl border-red-300 text-red-600 shadow-sm" checked={formData.atendidoBricomiles || false} onChange={e => setFormData({...formData, atendidoBricomiles: e.target.checked})} /> ¿Abordaje por Bricomiles?
                            </label>
                            {formData.atendidoBricomiles && (
                                <div className="space-y-4 mt-6 p-6 bg-white rounded-3xl border border-red-100 shadow-xl animate-in slide-in-from-top-4">
                                    <div><label className={labelStyle}>Fecha de Abordaje</label><input type="date" className={inputStyle} value={formData.fechaBricomiles || ''} onChange={e => setFormData({...formData, fechaBricomiles: e.target.value})}/></div>
                                    <div><label className={labelStyle}>Descripción de Trabajos</label><textarea placeholder="DETALLE LAS OBRAS..." className={`${inputStyle} h-32 text-[11px] leading-relaxed`} value={formData.descripcionBricomiles || ''} onChange={e => setFormData({...formData, descripcionBricomiles: e.target.value.toUpperCase()})}/></div>
                                </div>
                            )}
                       </div>
                       
                       <div className="space-y-6 p-8 border-2 border-blue-100 rounded-[40px] bg-blue-50/20">
                            <label className="flex items-center gap-4 font-black text-blue-900 uppercase text-xs cursor-pointer group">
                                <input type="checkbox" className="h-8 w-8 rounded-xl border-blue-300 text-blue-600 shadow-sm" checked={formData.proyectoActivo || false} onChange={e => setFormData({...formData, proyectoActivo: e.target.checked})} /> ¿Proyecto Activo de Infraestructura?
                            </label>
                            {formData.proyectoActivo && (
                                <div className="space-y-4 mt-6 p-6 bg-white rounded-3xl border border-blue-100 shadow-xl animate-in slide-in-from-top-4">
                                    <div><label className={labelStyle}>Nombre del Proyecto</label><input placeholder="EJ: REHABILITACIÓN TECHO" className={inputStyle} value={formData.nombreProyecto || ''} onChange={e => setFormData({...formData, nombreProyecto: e.target.value.toUpperCase()})}/></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelStyle}>Fecha Inicio</label><input type="date" className={inputStyle} value={formData.fechaInicioProyecto || ''} onChange={e => setFormData({...formData, fechaInicioProyecto: e.target.value})}/></div>
                                        <div><label className={labelStyle}>% de Avance</label><input type="number" min="0" max="100" placeholder="0-100" className="w-full text-center text-3xl font-black rounded-xl border-2 border-slate-300 bg-white text-blue-600 py-3" value={formData.porcentajeAvance || 0} onChange={e => setFormData({...formData, porcentajeAvance: parseInt(e.target.value) || 0})}/></div>
                                    </div>
                                </div>
                            )}
                       </div>
                   </div>
               </div>

               <div className={sectionStyle}><h3 className={headerStyle}><ClipboardCheck size={24} className="text-emerald-600"/> 5. Responsable de Auditoría de Planta</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div><label className={labelStyle}>Nombre</label><input required className={inputStyle} value={responsable.nombre} onChange={e => setResponsable({...responsable, nombre: e.target.value.toUpperCase()})} /></div>
                       <div><label className={labelStyle}>Cédula</label><input required className={inputStyle} value={responsable.ci} onChange={e => setResponsable({...responsable, ci: e.target.value.toUpperCase()})} /></div>
                       <div><label className={labelStyle}>Cargo</label><input required className={inputStyle} value={responsable.cargo} onChange={e => setResponsable({...responsable, cargo: e.target.value.toUpperCase()})} /></div>
                       <div><label className={labelStyle}>Teléfono</label><input required className={inputStyle} value={responsable.telefono} onChange={e => setResponsable({...responsable, telefono: e.target.value.toUpperCase()})} /></div>
                   </div>
               </div>

               <div className="flex justify-end pt-4 mb-10">
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-16 rounded-[28px] shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-[0.2em] text-xs">
                        <Save size={24}/> {isEditing ? 'Actualizar Reporte FEDE' : 'Finalizar Carga FEDE'}
                    </button>
               </div>
               {successMsg && <div className="fixed bottom-10 right-10 bg-emerald-600 text-white p-5 rounded-2xl text-center font-black animate-in shadow-2xl uppercase z-[200]">{successMsg}</div>}
           </form>

           <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 mt-12 mb-20">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <History className="text-red-600" size={24} /> Historial de Auditorías de Infraestructura
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5">FECHA REPORTE</th>
                                <th className="px-6 py-5">ESTADO GRAL.</th>
                                <th className="px-6 py-5">PROYECTO ACTIVO</th>
                                <th className="px-6 py-5 text-center">AVANCE</th>
                                <th className="px-6 py-5 text-center">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plantelHistory.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin registros de planta</td></tr>
                            ) : (
                                plantelHistory.map(reg => (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-600">{new Date(reg.fechaCarga).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${reg.estadoGeneral === 'BUENO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : reg.estadoGeneral === 'CRITICO' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {reg.estadoGeneral}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 uppercase font-black text-slate-800 text-[10px] truncate max-w-xs">{reg.nombreProyecto || 'SIN PROYECTO'}</td>
                                        <td className="px-6 py-4 text-center font-black text-blue-600">{reg.porcentajeAvance || 0}%</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditRecord(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100" title="EDITAR"><Edit size={18}/></button>
                                                <button onClick={() => { if(confirm('¿ELIMINAR ESTE REPORTE?')) onDeleteFede(reg.id); }} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="BORRAR"><Trash2 size={18}/></button>
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

export default FedeManager;