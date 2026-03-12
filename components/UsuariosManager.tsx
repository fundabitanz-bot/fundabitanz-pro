
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Plantel } from '../types';
import { 
  Users, UserPlus, Search, Edit, Trash2, X, Building2, School, 
  Upload, FileSpreadsheet, Download, UserCheck, UserX, RefreshCw, 
  Plus, Key, Save, ShieldCheck, MapPin, Group, Check, AlertCircle, Globe, BrainCircuit, Lock 
} from 'lucide-react';
import { GEOGRAFIA_VENEZUELA, MUNICIPIOS_ANZOATEGUI } from '../utils/constants';
import * as XLSX from 'xlsx';

interface UsuariosManagerProps {
  currentUser: User;
  users: User[];
  planteles: Plantel[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UsuariosManager: React.FC<UsuariosManagerProps> = ({ currentUser, users, planteles, onSaveUser, onDeleteUser }) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para asignación de planteles
  const [tempDea, setTempDea] = useState('');
  const [filterMun, setFilterMun] = useState('');
  const [filterNer, setFilterNer] = useState('');
  const [authorizedPlanteles, setAuthorizedPlanteles] = useState<string[]>([]);
  
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if(editingUser.plantelesAsignados) setAuthorizedPlanteles(editingUser.plantelesAsignados);
      else setAuthorizedPlanteles([]);
  }, [editingUser]);

  // Lógica de NER: Autorizar grupo de escuelas
  const handleAddByNer = () => {
      if (!filterNer) return;
      const schoolsInNer = planteles
        .filter(p => p.numeroNer === filterNer)
        .map(p => p.codigoDea.toUpperCase());
      
      const combined = Array.from(new Set([...authorizedPlanteles, ...schoolsInNer]));
      setAuthorizedPlanteles(combined);
      setFilterNer('');
  };

  const handleAddPlantel = () => {
      if (!tempDea) return;
      if (!authorizedPlanteles.includes(tempDea)) setAuthorizedPlanteles([...authorizedPlanteles, tempDea.toUpperCase()]);
      setTempDea('');
  };

  const handleRemovePlantel = (dea: string) => {
      setAuthorizedPlanteles(authorizedPlanteles.filter(d => d !== dea));
  };

  const generatePassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let pass = "";
      for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      setEditingUser({ ...editingUser, password: pass });
  };

  const downloadTemplate = () => {
      const template = [
          {
              CEDULA: "V12345678",
              NOMBRE_COMPLETO: "JUAN PEREZ",
              EMAIL: "JUAN@CORREO.COM",
              CARGO: "DIRECTOR",
              TELEFONO: "04141234567",
              PASSWORD: "PASS123",
              ROLE: "PLANTEL",
              IS_ACTIVE: "TRUE",
              AI_AUTHORIZED: "FALSE",
              ESTADO_ASIGNADO: "ANZOATEGUI",
              MUNICIPIO_ASIGNADO: "SIMON BOLIVAR",
              PLANTELES_ASIGNADOS: "OD12345678,OD87654321"
          }
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Usuarios");
      XLSX.writeFile(wb, "SGI_Plantilla_Usuarios.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws) as any[];

              data.forEach(row => {
                  const newUser: User = {
                      id: crypto.randomUUID(),
                      cedula: String(row.CEDULA || '').toUpperCase().trim(),
                      nombreCompleto: String(row.NOMBRE_COMPLETO || '').toUpperCase().trim(),
                      email: String(row.EMAIL || '').toUpperCase().trim(),
                      cargo: String(row.CARGO || '').toUpperCase().trim(),
                      telefono: String(row.TELEFONO || '').toUpperCase().trim(),
                      password: String(row.PASSWORD || row.CEDULA || '123456'),
                      role: (row.ROLE || 'PLANTEL') as UserRole,
                      isActive: String(row.IS_ACTIVE).toLowerCase() === 'true',
                      aiAuthorized: String(row.AI_AUTHORIZED).toLowerCase() === 'true',
                      estadoAsignado: row.ESTADO_ASIGNADO ? String(row.ESTADO_ASIGNADO).toUpperCase().trim() : undefined,
                      municipioAsignado: row.MUNICIPIO_ASIGNADO ? String(row.MUNICIPIO_ASIGNADO).toUpperCase().trim() : undefined,
                      plantelesAsignados: row.PLANTELES_ASIGNADOS ? String(row.PLANTELES_ASIGNADOS).split(',').map(s => s.trim().toUpperCase()) : []
                  };
                  onSaveUser(newUser);
              });
              setImportStatus(`¡ÉXITO! SE CARGARON ${data.length} USUARIOS.`);
              setTimeout(() => setImportStatus(null), 4000);
          } catch (err) {
              setImportStatus("ERROR AL PROCESAR EL EXCEL.");
          }
      };
      reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser.nombreCompleto || !editingUser.cedula || !editingUser.role) return;

      let finalPassword = editingUser.password;
      
      // Lógica de seguridad:
      // Si es nuevo usuario y no puso clave, forzar cédula.
      if (!editingUser.id && !finalPassword) {
          finalPassword = editingUser.cedula.toUpperCase().trim();
          alert(`AVISO DE SEGURIDAD: Se asignó la Cédula (${finalPassword}) como contraseña inicial.`);
      }
      
      // Si es usuario existente y el campo password está vacío, enviamos undefined
      // para que el backend sepa que NO debe tocar la contraseña existente.
      if (editingUser.id && (!finalPassword || finalPassword.trim() === '')) {
          finalPassword = undefined;
      }

      const userToSave: User = {
          ...editingUser as User,
          id: editingUser.id || crypto.randomUUID(),
          cedula: editingUser.cedula.toUpperCase().trim(), 
          nombreCompleto: editingUser.nombreCompleto.toUpperCase().trim(),
          email: (editingUser.email || '').toUpperCase().trim(),
          cargo: (editingUser.cargo || '').toUpperCase().trim(),
          telefono: (editingUser.telefono || '').toUpperCase().trim(),
          password: finalPassword, 
          plantelesAsignados: editingUser.role === 'PLANTEL' ? authorizedPlanteles : undefined
      };

      onSaveUser(userToSave);
      setViewMode('list');
      setEditingUser({});
  };

  const toggleStatus = (user: User) => {
      onSaveUser({ ...user, isActive: !user.isActive });
  };

  const filteredUsers = users.filter(u => {
      const term = searchTerm.toLowerCase();
      return u.nombreCompleto.toLowerCase().includes(term) || u.cedula.includes(term);
  });

  const getRoleColor = (role: UserRole) => {
      switch(role) {
          case 'MAESTRO': return 'from-red-600 to-red-800';
          case 'ADMINISTRADOR': return 'from-indigo-600 to-indigo-800';
          case 'MUNICIPAL': return 'from-orange-500 to-orange-700';
          case 'PLANTEL': return 'from-emerald-500 to-emerald-700';
          case 'GEOLOCALIZADOR': return 'from-cyan-500 to-cyan-700';
          default: return 'from-slate-500 to-slate-700';
      }
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 shadow-sm focus:border-[#003399] focus:ring-0 bg-white text-black py-3 px-4 text-sm font-bold uppercase transition-all";
  const labelStyle = "block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest ml-1";

  const estadosDisponibles = Object.keys(GEOGRAFIA_VENEZUELA).sort();

  if (viewMode === 'list') {
      return (
          <div className="space-y-6 animate-in fade-in pb-20">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
                  <div className="flex gap-5 items-center">
                      <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
                        <Users size={40} />
                      </div>
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Gestión de Usuarios</h2>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Control de acceso y roles SGI PRO</p>
                      </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={downloadTemplate} className="bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl hover:bg-slate-200 flex items-center gap-2 text-[10px] font-black transition-all uppercase tracking-widest border border-slate-200">
                        <Download size={18}/> Plantilla Excel
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl hover:bg-emerald-100 flex items-center gap-2 text-[10px] font-black transition-all uppercase tracking-widest border border-emerald-200">
                        <FileSpreadsheet size={18}/> Carga Masiva
                    </button>
                    <button onClick={() => { setEditingUser({ role: 'PLANTEL', isActive: true, estadoAsignado: 'ANZOATEGUI' }); setViewMode('form'); }} className="bg-[#003399] text-white px-8 py-3 rounded-2xl hover:bg-blue-800 flex items-center gap-2 text-[10px] font-black transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest">
                        <UserPlus size={18}/> Nuevo Usuario
                    </button>
                  </div>
              </div>

              {importStatus && (
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl text-center font-black text-xs uppercase shadow-lg animate-bounce">
                      {importStatus}
                  </div>
              )}

              <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22}/>
                  <input className="w-full pl-14 pr-6 py-5 border-none rounded-3xl bg-white text-slate-800 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-100 uppercase" placeholder="Buscar por epónimo o documento de identidad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>

              {/* Grid de Usuarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredUsers.length === 0 ? (
                      <div className="col-span-full bg-white p-20 rounded-3xl text-center border-2 border-dashed border-slate-200">
                          <Users className="mx-auto text-slate-200 mb-4" size={64} />
                          <p className="text-slate-400 font-black uppercase tracking-widest">Sin resultados en la búsqueda</p>
                      </div>
                  ) : (
                      filteredUsers.map(user => (
                          <div key={user.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                              <div className={`h-2 bg-gradient-to-r ${getRoleColor(user.role)}`}></div>
                              <div className="p-6 flex-1">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`p-2 rounded-xl bg-gradient-to-br ${getRoleColor(user.role)} text-white shadow-md`}>
                                          <ShieldCheck size={20} />
                                      </div>
                                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                          {user.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                                      </span>
                                  </div>
                                  <h3 className="text-sm font-black text-slate-800 uppercase leading-tight mb-1">{user.nombreCompleto}</h3>
                                  <p className="text-[10px] text-blue-600 font-black tracking-widest">{user.cedula}</p>
                                  
                                  <div className="mt-4 space-y-2">
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                          <Building2 size={12}/> {user.cargo}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase">
                                          <ShieldCheck size={12}/> ROL: {user.role}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                          <MapPin size={12}/> {user.role === 'ADMINISTRADOR' || user.role === 'GEOLOCALIZADOR' ? `EDO: ${user.estadoAsignado}` : user.role === 'MUNICIPAL' ? user.municipioAsignado : `${user.plantelesAsignados?.length || 0} Planteles`}
                                      </div>
                                      {user.aiAuthorized && (
                                          <div className="flex items-center gap-2 text-[10px] font-black text-yellow-600 uppercase mt-2 bg-yellow-50 px-2 py-1 rounded-lg w-fit">
                                              <BrainCircuit size={12}/> IA Habilitada
                                          </div>
                                      )}
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center gap-2">
                                  <div className="flex gap-2">
                                      <button onClick={() => { setEditingUser(user); setViewMode('form'); }} className="p-2 text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all shadow-sm" title="Editar"><Edit size={16}/></button>
                                      <button onClick={() => toggleStatus(user)} className={`p-2 rounded-xl border border-transparent transition-all shadow-sm ${user.isActive ? 'text-rose-500 hover:bg-rose-50 hover:border-rose-100' : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100'}`} title={user.isActive ? "Suspender" : "Activar"}>
                                          {user.isActive ? <UserX size={16}/> : <UserCheck size={16}/>}
                                      </button>
                                  </div>
                                  <button onClick={() => { if(confirm('¿ELIMINAR ESTE USUARIO PERMANENTEMENTE?')) onDeleteUser(user.id); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  }

  // LISTA DE NER DISPONIBLES EN EL SISTEMA
  const nersDisponibles = Array.from(new Set(planteles.map(p => p.numeroNer).filter(n => !!n)));

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 border-2 border-white/20 flex flex-col max-h-[90vh]">
              
              <div className="bg-[#003399] p-8 flex justify-between items-center text-white relative shrink-0">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-white to-red-600"></div>
                  <div className="flex items-center gap-4">
                      <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md"><UserPlus size={28}/></div>
                      <div>
                        <h2 className="font-black text-2xl tracking-tighter uppercase leading-none">Configuración de Usuario</h2>
                        <p className="text-blue-200 text-[10px] font-black uppercase mt-1 tracking-widest">Ficha Técnica de Identidad y Permisología</p>
                      </div>
                  </div>
                  <button onClick={() => setViewMode('list')} className="hover:bg-white/20 p-3 rounded-2xl transition-all"><X size={28}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                          <label className={labelStyle}>Documento de Identidad</label>
                          <input required className={inputStyle} value={editingUser.cedula || ''} onChange={e => setEditingUser({...editingUser, cedula: e.target.value.toUpperCase()})} placeholder="V-00000000" />
                      </div>
                      <div className="md:col-span-2">
                          <label className={labelStyle}>Apellidos y Nombres Completos</label>
                          <input required className={inputStyle} value={editingUser.nombreCompleto || ''} onChange={e => setEditingUser({...editingUser, nombreCompleto: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                          <label className={labelStyle}>Correo Electrónico Institucional</label>
                          <input type="email" className={inputStyle} value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} placeholder="USUARIO@MPPE.GOB.VE" />
                      </div>
                      <div>
                          <label className={labelStyle}>Cargo Estructural</label>
                          <input className={inputStyle} value={editingUser.cargo || ''} onChange={e => setEditingUser({...editingUser, cargo: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                          <label className={labelStyle}>Número Telefónico</label>
                          <input className={inputStyle} value={editingUser.telefono || ''} onChange={e => setEditingUser({...editingUser, telefono: e.target.value})} />
                      </div>
                      
                      {/* CAMPO DE CONTRASEÑA MEJORADO */}
                      <div className="p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-sm md:col-span-2 relative group">
                          <div className="flex justify-between items-center mb-2">
                              <label className={labelStyle}>Contraseña de Acceso</label>
                              {editingUser.id && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                                      <Lock size={10} /> Contraseña Activa y Segura
                                  </span>
                              )}
                          </div>
                          <div className="flex gap-3">
                              <input 
                                  className={`${inputStyle} ${editingUser.id && (!editingUser.password) ? 'bg-slate-50 text-slate-400 italic' : ''}`} 
                                  value={editingUser.password || ''} 
                                  onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                                  placeholder={editingUser.id ? "•••••••• (ESCRIBA AQUÍ SÓLO SI DESEA CAMBIARLA)" : "SI DEJA ESTO VACÍO, LA CLAVE SERÁ LA CÉDULA"} 
                              />
                              <button type="button" onClick={generatePassword} className="bg-slate-800 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                                  <Key size={14}/> Generar
                              </button>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-2 font-black uppercase tracking-wide">
                              {editingUser.id 
                                  ? "* NOTA DE SEGURIDAD: La contraseña actual está encriptada y no se muestra. Deje el campo vacío para mantenerla." 
                                  : "* Si no asigna una contraseña manual, el sistema usará automáticamente el número de Cédula."}
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:col-span-1">
                          <div>
                              <label className={labelStyle}>Rol de Sistema</label>
                              <select required className={inputStyle} value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                                  <option value="PLANTEL">PLANTEL</option>
                                  <option value="MUNICIPAL">MUNICIPAL</option>
                                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                  <option value="MAESTRO">MAESTRO</option>
                                  <option value="GEOLOCALIZADOR">GEOLOCALIZADOR</option>
                              </select>
                          </div>
                          <div>
                              <label className={labelStyle}>Estatus Actual</label>
                              <select required className={inputStyle} value={editingUser.isActive !== false ? 'ACTIVO' : 'INACTIVO'} onChange={e => setEditingUser({...editingUser, isActive: e.target.value === 'ACTIVO'})}>
                                  <option value="ACTIVO">ACTIVO</option>
                                  <option value="INACTIVO">SUSPENDIDO</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* ASIGNACIÓN DE ESTADO PARA ADMINS Y GEOLOCALIZADORES */}
                  {(editingUser.role === 'ADMINISTRADOR' || editingUser.role === 'GEOLOCALIZADOR') && (
                       <div className="bg-white p-8 rounded-[32px] border-2 border-indigo-100 shadow-xl space-y-6">
                          <label className="block text-[11px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                            <Globe size={24} className="text-indigo-500"/> Estado bajo su Jurisdicción Regional
                          </label>
                          <select required className={inputStyle} value={editingUser.estadoAsignado || ''} onChange={e => setEditingUser({...editingUser, estadoAsignado: e.target.value.toUpperCase()})}>
                              <option value="">-- SELECCIONAR ESTADO --</option>
                              {estadosDisponibles.map(edo => <option key={edo} value={edo.toUpperCase()}>{edo.toUpperCase()}</option>)}
                          </select>
                      </div>
                  )}

                  {/* ASIGNACIÓN DE PLANTEL CON FILTROS AVANZADOS (MUNICIPIO Y NER) */}
                  {editingUser.role === 'PLANTEL' && (
                       <div className="bg-white p-8 rounded-[32px] border-2 border-emerald-100 shadow-xl space-y-6">
                          <div className="flex items-center gap-3 text-emerald-800 border-b border-emerald-50 pb-4">
                              <School className="text-emerald-500" size={24}/>
                              <h3 className="font-black uppercase text-xs tracking-widest">Autorización de Planteles Educativos</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className={labelStyle}>Filtrar por Municipio (Anzoátegui)</label>
                                  <select className={inputStyle} value={filterMun} onChange={e => setFilterMun(e.target.value)}>
                                      <option value="">-- TODOS LOS MUNICIPIOS --</option>
                                      {Object.keys(MUNICIPIOS_ANZOATEGUI).map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                  </select>
                              </div>

                              <div className="space-y-2">
                                  <label className={labelStyle}>Filtrar por NER (Carga en Bloque)</label>
                                  <div className="flex gap-2">
                                      <select className={inputStyle} value={filterNer} onChange={e => setFilterNer(e.target.value)}>
                                          <option value="">-- SELECCIONAR NER --</option>
                                          {nersDisponibles.sort().map(n => <option key={n} value={n}>NER {n}</option>)}
                                      </select>
                                      <button type="button" onClick={handleAddByNer} disabled={!filterNer} className="bg-indigo-600 text-white px-5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 font-black text-[10px] uppercase">
                                          <Group size={16}/> Aplicar
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className={labelStyle}>Añadir por Código DEA Individual</label>
                              <div className="flex gap-2">
                                  <select className={inputStyle} value={tempDea} onChange={e => setTempDea(e.target.value)}>
                                      <option value="">-- SELECCIONAR PLANTEL --</option>
                                      {planteles
                                        .filter(p => !filterMun || p.municipio === filterMun)
                                        .sort((a,b) => a.nombre.localeCompare(b.nombre))
                                        .map(p => <option key={p.id} value={p.codigoDea}>{p.codigoDea} - {p.nombre}</option>)
                                      }
                                  </select>
                                  <button type="button" onClick={handleAddPlantel} className="bg-emerald-600 text-white px-8 rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center"><Plus size={24}/></button>
                              </div>
                          </div>

                          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Planteles que este usuario podrá gestionar ({authorizedPlanteles.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                    {authorizedPlanteles.map(dea => {
                                        const p = planteles.find(pl => pl.codigoDea === dea);
                                        return (
                                            <div key={dea} className="bg-white border border-emerald-100 text-emerald-900 text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm group hover:border-emerald-500 transition-all">
                                                <div className="flex flex-col">
                                                    <span>{dea}</span>
                                                    <span className="text-[8px] text-slate-400 truncate max-w-[120px]">{p?.nombre || 'PLANEL NO ENCONTRADO'}</span>
                                                </div>
                                                <button type="button" onClick={() => handleRemovePlantel(dea)} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                        );
                                    })}
                                    {authorizedPlanteles.length === 0 && <p className="text-[10px] text-slate-300 font-bold uppercase italic py-4">Asigne al menos un plantel para este rol.</p>}
                                </div>
                          </div>
                      </div>
                  )}

                  {editingUser.role === 'MUNICIPAL' && (
                       <div className="bg-white p-8 rounded-[32px] border-2 border-orange-100 shadow-xl space-y-6">
                          <label className="block text-[11px] font-black text-orange-800 uppercase tracking-widest flex items-center gap-2"><Building2 size={24} className="text-orange-500"/> Municipio bajo su Jurisdicción</label>
                          <select required className={inputStyle} value={editingUser.municipioAsignado || ''} onChange={e => setEditingUser({...editingUser, municipioAsignado: e.target.value.toUpperCase()})}>
                              <option value="">-- SELECCIONAR MUNICIPIO --</option>
                              {Object.keys(MUNICIPIOS_ANZOATEGUI).sort().map(m => <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>)}
                          </select>
                      </div>
                  )}

                  <div className="flex justify-end gap-5 pt-8 border-t border-slate-200">
                      <button type="button" onClick={() => setViewMode('list')} className="text-slate-400 font-black hover:text-slate-600 transition-all text-xs uppercase tracking-widest px-8">Cancelar</button>
                      <button type="submit" className="bg-[#003399] text-white px-16 py-5 rounded-2xl font-black hover:bg-blue-800 shadow-2xl transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3">
                          <Save size={20}/> Guardar Credenciales
                      </button>
                  </div>
              </form>
          </div>
      </div>
  );
};

export default UsuariosManager;
