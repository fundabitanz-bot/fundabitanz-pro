
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plantel, RacRegistro, Turno, EjeConsolidacion } from '../types';
import { SITUACION_TRABAJADOR, TURNOS, TIPO_PERSONAL, FUNCIONES_PERSONAL, GEOGRAFIA_VENEZUELA, MATERIAS_COMUNES, EJES_CONSOLIDACION_OPCIONES, TALLAS_CAMISA, TALLAS_PANTALON, TIPOS_VIVIENDA, CONDICION_VIVIENDA, NIVELES_INSTRUCCION } from '../utils/constants';
import { 
  Save, AlertCircle, ClipboardList, Trash2, Edit, Eye, User as UserIcon, X, CheckCircle2, UserCheck, Briefcase, FileText, Camera, Upload, Phone, Mail, MapPin, Search as SearchIcon, Clock, Activity, Layers, RotateCcw, Home, Shirt, HeartPulse
} from 'lucide-react';

const RacPlantelesManager: React.FC<{ planteles: Plantel[], initialPlantelId?: string, racList: RacRegistro[], onSaveRac: (r: RacRegistro) => void, onDeleteRac: (id: string) => void }> = ({ planteles, initialPlantelId, racList, onSaveRac, onDeleteRac }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<RacRegistro | null>(null);
  const [draftFound, setDraftFound] = useState(false); 

  const [otroMateria, setOtroMateria] = useState('');
  const [otroEspecialidad, setOtroEspecialidad] = useState('');
  const [responsable, setResponsable] = useState({ nombre: '', ci: '', cargo: '', telefono: '' });
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: RacRegistro = {
    id: '', plantelId: '', fechaCarga: '',
    codCargo: '', clasificacion: '', tipoPersonal: 'DOCENTE', funcion: 'DOCENTE', numGoPc: '',
    cedula: '', nombreApellido: '', fechaIngreso: '', sex: 'F' as 'F' | 'M',
    cargaHorariaRecibo: 0, horasAcademicas: 0, horasAdm: 0, turno: 'Mañana' as Turno, grado: '', seccion: '',
    especialidad: '', ano: '', cantidadSecciones: 0, materia: '', periodoGrupo: '2024-2025',
    situacionTrabajador: 'ACTIVO', observacion: '', fotoUrl: '', telefono: '', correo: '',
    ejeConsolidacion: 'EJE_INICIAL_PRIMARIA' as EjeConsolidacion,
    lugarNacimiento: '', edad: 0, tlfHabitacion: '', nivelInstruccion: '', profesion: '',
    estadoRecibo: 'ANZOATEGUI', municipioRecibo: '', parroquiaRecibo: '',
    tallaCamisa: '', tallaPantalon: '', tallaZapato: '',
    actividadDeportiva: '', actividadCultural: '',
    tipoVivienda: '', condicionVivienda: '', materialVivienda: '',
    padeceEnfermedad: '', requiereMedicamento: '', discapacidad: ''
  };

  const [formData, setFormData] = useState<RacRegistro>(initialFormState);

  // Lógica Dinámica para Selectores Geográficos del Formulario
  const municipiosDisponibles = useMemo(() => {
      const edo = formData.estadoRecibo || 'ANZOATEGUI';
      return GEOGRAFIA_VENEZUELA[edo] ? Object.keys(GEOGRAFIA_VENEZUELA[edo]).sort() : [];
  }, [formData.estadoRecibo]);

  const parroquiasDisponibles = useMemo(() => {
      const edo = formData.estadoRecibo || 'ANZOATEGUI';
      const mun = formData.municipioRecibo;
      if (!mun || !GEOGRAFIA_VENEZUELA[edo]) return [];
      return GEOGRAFIA_VENEZUELA[edo][mun] || [];
  }, [formData.estadoRecibo, formData.municipioRecibo]);

  useEffect(() => {
    const saved = localStorage.getItem('cdce_last_responsable');
    if (saved) setResponsable(JSON.parse(saved));
    const savedDraft = localStorage.getItem('sgi_rac_draft');
    if (savedDraft) setDraftFound(true);

    if (initialPlantelId) {
        const p = planteles.find(pl => pl.id === initialPlantelId);
        if(p) { 
            setSelectedEstado(p.estado || 'ANZOATEGUI');
            setSelectedMunicipio(p.municipio); 
            setSelectedPlantelId(initialPlantelId); 
        }
    }
  }, [initialPlantelId, planteles]);

  useEffect(() => {
      if (!isEditing && selectedPlantelId && (formData.cedula || formData.nombreApellido)) {
          localStorage.setItem('sgi_rac_draft', JSON.stringify({ ...formData, plantelId: selectedPlantelId }));
      }
  }, [formData, selectedPlantelId, isEditing]);

  const loadDraft = () => {
      const savedDraft = localStorage.getItem('sgi_rac_draft');
      if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          if (parsed.plantelId) setSelectedPlantelId(parsed.plantelId);
          setDraftFound(false);
          setSuccessMsg("Borrador recuperado exitosamente.");
          setTimeout(() => setSuccessMsg(''), 3000);
      }
  };

  const discardDraft = () => {
      localStorage.removeItem('sgi_rac_draft');
      setDraftFound(false);
  };

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 400; 
                  const scaleSize = MAX_WIDTH / img.width;
                  canvas.width = MAX_WIDTH;
                  canvas.height = img.height * scaleSize;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
              };
              img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
      });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const compressed = await compressImage(file);
          setFormData(prev => ({ ...prev, fotoUrl: compressed }));
      } catch (err) {
          alert("Error procesando imagen.");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantelId) return;
    localStorage.setItem('cdce_last_responsable', JSON.stringify(responsable));

    const finalMateria = formData.materia === 'OTRO' ? otroMateria.toUpperCase() : formData.materia;
    const finalEspecialidad = formData.especialidad === 'OTRO' ? otroEspecialidad.toUpperCase() : formData.especialidad;

    onSaveRac({
        ...formData,
        id: formData.id || crypto.randomUUID(),
        plantelId: selectedPlantelId,
        fechaCarga: new Date().toISOString(),
        nombreApellido: formData.nombreApellido.toUpperCase(),
        materia: finalMateria,
        especialidad: finalEspecialidad,
        correo: (formData.correo || '').toUpperCase(),
        lugarNacimiento: formData.lugarNacimiento?.toUpperCase(),
        profesion: formData.profesion?.toUpperCase(),
        actividadDeportiva: formData.actividadDeportiva?.toUpperCase(),
        actividadCultural: formData.actividadCultural?.toUpperCase(),
        materialVivienda: formData.materialVivienda?.toUpperCase(),
        padeceEnfermedad: formData.padeceEnfermedad?.toUpperCase(),
        requiereMedicamento: formData.requiereMedicamento?.toUpperCase(),
        discapacidad: formData.discapacidad?.toUpperCase(),
    } as RacRegistro);

    setSuccessMsg(isEditing ? "¡REGISTRO ACTUALIZADO EXITOSAMENTE!" : "¡REGISTRO PROCESADO EXITOSAMENTE!");
    localStorage.removeItem('sgi_rac_draft');
    setFormData(initialFormState);
    setOtroMateria('');
    setOtroEspecialidad('');
    setIsEditing(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = (reg: RacRegistro) => {
      setFormData(reg);
      setIsEditing(true);
      if (!MATERIAS_COMUNES.some(m => m.toUpperCase() === (reg.materia || '').toUpperCase()) && reg.materia) {
          setFormData(prev => ({ ...prev, materia: 'OTRO' }));
          setOtroMateria(reg.materia);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPlantelRac = racList.filter(r => r.plantelId === selectedPlantelId);
  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs focus:border-blue-500 outline-none";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

  const estadosList = Object.keys(GEOGRAFIA_VENEZUELA).sort();
  const plantelesFiltrados = planteles.filter(p => 
    (!selectedEstado || p.estado === selectedEstado) && 
    (!selectedMunicipio || p.municipio === selectedMunicipio) &&
    (searchTerm === '' || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ViewField = ({ label, value }: { label: string, value: any }) => (
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase block leading-none mb-1">{label}</span>
          <span className="text-[10px] font-bold text-slate-800 uppercase block break-words">{value || '---'}</span>
      </div>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in">
      {draftFound && (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce shadow-lg mx-4 mt-4">
              <div className="flex items-center gap-3 text-yellow-800">
                  <RotateCcw size={24}/>
                  <div>
                      <h4 className="font-black uppercase text-xs">Trabajo no guardado detectado</h4>
                      <p className="text-[10px]">El sistema detectó un formulario incompleto debido a un cierre inesperado.</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={loadDraft} className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-md hover:bg-yellow-700 transition-all">Recuperar Datos</button>
                  <button onClick={discardDraft} className="bg-white text-yellow-800 border border-yellow-300 px-4 py-2 rounded-xl font-black uppercase text-[10px] hover:bg-yellow-50 transition-all">Descartar</button>
              </div>
          </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 mx-4 md:mx-0">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
          <ClipboardList className="text-[#004a99]" size={28} /> Módulo RAC / Inscripción de Personal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Estado</label>
                <select className={inputStyle} value={selectedEstado} onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}>
                    <option value="">VENEZUELA (TODOS)</option>
                    {estadosList.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
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
                <label className={labelStyle}>Buscar Plantel</label>
                <div className="relative">
                    <input className={inputStyle} placeholder="NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Plantel Específico</label>
                <select className={inputStyle} value={selectedPlantelId} onChange={e => setSelectedPlantelId(e.target.value)}>
                    <option value="">-- SELECCIONE UN PLANTEL --</option>
                    {plantelesFiltrados.map(p => <option key={p.id} value={p.id}>{p.codigoDea} - {p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
        </div>
      </div>

      {selectedPlantelId && (
        <>
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 px-4 md:px-0">
          <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-slate-200">
             
             <div className="mb-8 p-6 bg-[#003399]/5 rounded-2xl border-2 border-[#003399]/20">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-[#003399] text-white rounded-xl shadow-lg"><Layers size={20}/></div>
                    <div>
                        <h4 className="font-black text-[#003399] uppercase text-sm">Direccionamiento de Consolidación</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">¿En qué formato de cuadratura debe aparecer este docente?</p>
                    </div>
                </div>
                <select 
                    required 
                    className={`${inputStyle} border-[#003399]/30 bg-white text-indigo-900 text-sm`} 
                    value={formData.ejeConsolidacion} 
                    onChange={e => setFormData({...formData, ejeConsolidacion: e.target.value as EjeConsolidacion})}
                >
                    {EJES_CONSOLIDACION_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
                </select>
             </div>

             <div className="mb-8 flex flex-col md:flex-row items-center gap-8 p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
                <div className="relative group">
                    <div className="w-40 h-52 bg-white rounded-2xl border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-2xl">
                        {formData.fotoUrl ? <img src={formData.fotoUrl} className="w-full h-full object-cover" alt="Foto Carnet" /> : <UserIcon size={64} className="text-slate-200" />}
                    </div>
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute bottom-[-10px] right-[-10px] bg-[#003399] text-white p-3 rounded-xl shadow-xl hover:bg-blue-800 transition-all active:scale-95"><Upload size={20}/></button>
                    <input type="file" ref={photoInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handlePhotoChange} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2"><Camera size={20} className="text-[#003399]"/> Captura de Identidad Visual</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed max-w-md">La imagen será optimizada automáticamente para no saturar el servidor.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div><label className={labelStyle}>Cédula</label><input required placeholder="V-12345678" className={inputStyle} value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value.toUpperCase()})} /></div>
                <div className="md:col-span-2"><label className={labelStyle}>Nombres y Apellidos</label><input required placeholder="EJ: PEREZ MENDOZA JUAN" className={inputStyle} value={formData.nombreApellido} onChange={e => setFormData({...formData, nombreApellido: e.target.value.toUpperCase()})} /></div>
                <div><label className={labelStyle}>Sexo</label><select className={inputStyle} value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as 'F' | 'M'})}><option value="F">FEMENINO</option><option value="M">MASCULINO</option></select></div>
                <div><label className={labelStyle}>Teléfono Celular</label><input placeholder="0414-1234567" className={inputStyle} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={labelStyle}>Correo Electrónico</label><input type="email" placeholder="EMPLEADO@CORREO.COM" className={inputStyle} value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value.toUpperCase()})} /></div>
                <div><label className={labelStyle}>Fecha Ingreso</label><input type="date" required className={inputStyle} value={formData.fechaIngreso} onChange={e => setFormData({...formData, fechaIngreso: e.target.value})} /></div>
                <div><label className={labelStyle}>Cód. Cargo</label><input placeholder="EJ: 0065" className={inputStyle} value={formData.codCargo} onChange={e => setFormData({...formData, codCargo: e.target.value.toUpperCase()})} /></div>
                <div><label className={labelStyle}>Clasificación</label><input placeholder="EJ: DOCENTE IV" className={inputStyle} value={formData.clasificacion} onChange={e => setFormData({...formData, clasificacion: e.target.value.toUpperCase()})} /></div>
                <div><label className={labelStyle}>Tipo Personal</label><select className={inputStyle} value={formData.tipoPersonal} onChange={e => setFormData({...formData, tipoPersonal: e.target.value.toUpperCase()})}><option value="DOCENTE">DOCENTE</option><option value="ADMINISTRATIVO">ADMINISTRATIVO</option><option value="OBRERO">OBRERO</option></select></div>
                <div><label className={labelStyle}>Función</label><select className={inputStyle} value={formData.funcion} onChange={e => setFormData({...formData, funcion: e.target.value.toUpperCase()})}>{FUNCIONES_PERSONAL.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
             </div>

             <div className="bg-slate-100 p-6 md:p-10 rounded-[35px] border-2 border-slate-200 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><UserCheck size={180}/></div>
                <h3 className="font-black text-slate-800 uppercase text-xs mb-6 border-b-2 border-slate-300 pb-2 tracking-[0.2em] relative z-10">Ficha Socioeconómica Complementaria (2do RAC)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 mb-6">
                    <div className="md:col-span-2"><label className={labelStyle}>Lugar de Nacimiento</label><input className={inputStyle} value={formData.lugarNacimiento || ''} onChange={e => setFormData({...formData, lugarNacimiento: e.target.value})} /></div>
                    <div><label className={labelStyle}>Edad</label><input type="number" className={inputStyle} value={formData.edad || ''} onChange={e => setFormData({...formData, edad: parseInt(e.target.value) || 0})} /></div>
                    <div><label className={labelStyle}>Tlf. Habitación/Oficina</label><input className={inputStyle} value={formData.tlfHabitacion || ''} onChange={e => setFormData({...formData, tlfHabitacion: e.target.value})} /></div>
                    <div><label className={labelStyle}>Nivel Instrucción</label>
                        <select className={inputStyle} value={formData.nivelInstruccion || ''} onChange={e => setFormData({...formData, nivelInstruccion: e.target.value})}>
                            <option value="">- SELECCIONE -</option>
                            {NIVELES_INSTRUCCION.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div><label className={labelStyle}>Profesión</label><input className={inputStyle} value={formData.profesion || ''} onChange={e => setFormData({...formData, profesion: e.target.value})} /></div>
                </div>

                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={12}/> Dirección según Recibo de Pago</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                    <div>
                        <label className={labelStyle}>Estado (Recibo)</label>
                        <select 
                            className={inputStyle} 
                            value={formData.estadoRecibo || 'ANZOATEGUI'} 
                            onChange={e => setFormData({...formData, estadoRecibo: e.target.value, municipioRecibo: '', parroquiaRecibo: ''})}
                        >
                            <option value="">- SELECCIONE -</option>
                            {estadosList.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Municipio (Recibo)</label>
                        <select 
                            className={inputStyle} 
                            value={formData.municipioRecibo || ''} 
                            onChange={e => setFormData({...formData, municipioRecibo: e.target.value, parroquiaRecibo: ''})} 
                            disabled={!formData.estadoRecibo && formData.estadoRecibo !== 'ANZOATEGUI'}
                        >
                            <option value="">- SELECCIONE -</option>
                            {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Parroquia (Recibo)</label>
                        <select 
                            className={inputStyle} 
                            value={formData.parroquiaRecibo || ''} 
                            onChange={e => setFormData({...formData, parroquiaRecibo: e.target.value})} 
                            disabled={!formData.municipioRecibo}
                        >
                            <option value="">- SELECCIONE -</option>
                            {parroquiasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Shirt size={12}/> Tallas y Medidas</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className={labelStyle}>Camisa</label><select className={inputStyle} value={formData.tallaCamisa || ''} onChange={e => setFormData({...formData, tallaCamisa: e.target.value})}><option value="">-</option>{TALLAS_CAMISA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div><label className={labelStyle}>Pantalón</label><select className={inputStyle} value={formData.tallaPantalon || ''} onChange={e => setFormData({...formData, tallaPantalon: e.target.value})}><option value="">-</option>{TALLAS_PANTALON.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div><label className={labelStyle}>Calzado</label><input type="number" className={inputStyle} value={formData.tallaZapato || ''} onChange={e => setFormData({...formData, tallaZapato: e.target.value})} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Home size={12}/> Vivienda</h4>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div><label className={labelStyle}>Tipo</label><select className={inputStyle} value={formData.tipoVivienda || ''} onChange={e => setFormData({...formData, tipoVivienda: e.target.value})}><option value="">-</option>{TIPOS_VIVIENDA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div><label className={labelStyle}>Condición</label><select className={inputStyle} value={formData.condicionVivienda || ''} onChange={e => setFormData({...formData, condicionVivienda: e.target.value})}><option value="">-</option>{CONDICION_VIVIENDA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        </div>
                        <div><label className={labelStyle}>¿Requiere Reparaciones? (Especifique Material)</label><input className={inputStyle} placeholder="CEMENTO, ZINC, ETC..." value={formData.materialVivienda || ''} onChange={e => setFormData({...formData, materialVivienda: e.target.value})} /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 relative z-10">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={12}/> Actividades Extracurriculares</h4>
                        <div className="space-y-2">
                            <div><label className={labelStyle}>¿Practica Deporte? (Indique Cuál)</label><input className={inputStyle} placeholder="EJ: BEISBOL / NO" value={formData.actividadDeportiva || ''} onChange={e => setFormData({...formData, actividadDeportiva: e.target.value})} /></div>
                            <div><label className={labelStyle}>¿Actividad Cultural? (Indique Cuál)</label><input className={inputStyle} placeholder="EJ: DANZA / NO" value={formData.actividadCultural || ''} onChange={e => setFormData({...formData, actividadCultural: e.target.value})} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><HeartPulse size={12}/> Salud Integral</h4>
                        <div className="space-y-2">
                            <div><label className={labelStyle}>¿Padece Enfermedad? (Indique)</label><input className={inputStyle} placeholder="EJ: HIPERTENSIÓN / NO" value={formData.padeceEnfermedad || ''} onChange={e => setFormData({...formData, padeceEnfermedad: e.target.value})} /></div>
                            <div><label className={labelStyle}>¿Medicamento Frecuente? (Indique)</label><input className={inputStyle} placeholder="EJ: LOSARTAN / NO" value={formData.requiereMedicamento || ''} onChange={e => setFormData({...formData, requiereMedicamento: e.target.value})} /></div>
                            <div><label className={labelStyle}>¿Discapacidad Certificada? (Indique)</label><input className={inputStyle} placeholder="EJ: MOTORA / NO" value={formData.discapacidad || ''} onChange={e => setFormData({...formData, discapacidad: e.target.value})} /></div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                    <h3 className="font-black text-blue-800 uppercase text-[11px] mb-6 border-b pb-2 tracking-[0.1em]">Primaria / Inicial (Sincronización Cuadratura)</h3>
                    <div className="space-y-4">
                        <div><label className={labelStyle}>Especialidad Registrada</label>
                            <select className={inputStyle} value={formData.especialidad} onChange={e => setFormData({...formData, especialidad: e.target.value})}>
                                <option value="">- SELECCIONE -</option>
                                <option value="INTEGRAL">DOCENTE INTEGRAL (PRIMARIA)</option>
                                <option value="EDUCACIÓN INICIAL">EDUCACIÓN INICIAL</option>
                                <option value="MATERNAL">MATERNAL</option>
                                <option value="EDUCACIÓN ESPECIAL">EDUCACIÓN ESPECIAL</option>
                                <option value="AULA INTEGRADA">AULA INTEGRADA</option>
                                <option value="OTRO">OTRO (ESPECIFICAR)</option>
                            </select>
                            {formData.especialidad === 'OTRO' && <input className={`${inputStyle} mt-2`} placeholder="ESCRIBA LA ESPECIALIDAD..." value={otroEspecialidad} onChange={e => setOtroEspecialidad(e.target.value.toUpperCase())} />}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelStyle}>Grado / Grupo</label><input placeholder="EJ: 1ER GRADO" className={inputStyle} value={formData.grado} onChange={e => setFormData({...formData, grado: e.target.value.toUpperCase()})}/></div>
                            <div><label className={labelStyle}>Sección</label><input placeholder="EJ: A" className={inputStyle} value={formData.seccion} onChange={e => setFormData({...formData, seccion: e.target.value.toUpperCase()})}/></div>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-sm">
                    <h3 className="font-black text-amber-800 uppercase text-[11px] mb-6 border-b pb-2 tracking-[0.1em]">Media / Técnica (Sincronización Cuadratura)</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelStyle}>Año / Periodo</label><input placeholder="EJ: 4TO AÑO" className={inputStyle} value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value.toUpperCase()})}/></div>
                            <div><label className={labelStyle}>Cant. Secciones</label><input type="number" className={inputStyle} value={formData.cantidadSecciones} onChange={e => setFormData({...formData, cantidadSecciones: parseInt(e.target.value)||0})}/></div>
                        </div>
                        <div><label className={labelStyle}>Asignatura / Área de Formación</label>
                            <select className={inputStyle} value={formData.materia} onChange={e => setFormData({...formData, materia: e.target.value})}>
                                <option value="">- SELECCIONE -</option>
                                <option value="MEDIA GENERAL">PLAN 31059 (MEDIA GENERAL)</option>
                                <option value="MEDIA TÉCNICA">PLAN 31060 (MEDIA TÉCNICA)</option>
                                {MATERIAS_COMUNES.map(m => <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>)}
                                <option value="OTRO">OTRO (ESPECIFICAR)</option>
                            </select>
                            {formData.materia === 'OTRO' && <input className={`${inputStyle} mt-2`} placeholder="ESCRIBA LA ASIGNATURA..." value={otroMateria} onChange={e => setOtroMateria(e.target.value.toUpperCase())} />}
                        </div>
                    </div>
                </div>
             </div>

             <div className="p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm mb-8">
                <h3 className="font-black text-indigo-800 uppercase text-[11px] mb-6 border-b pb-2 tracking-[0.1em] flex items-center gap-2">
                    <Clock size={16}/> Condiciones Laborales y Carga Horaria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-200">
                        <label className={`${labelStyle} text-yellow-800`}>Carga Horaria Recibo</label>
                        <input type="number" step="0.01" min="0" className={`${inputStyle} border-yellow-300`} value={formData.cargaHorariaRecibo} onChange={e => setFormData({...formData, cargaHorariaRecibo: parseFloat(e.target.value)||0})} />
                    </div>
                    <div><label className={labelStyle}>Horas Académicas</label><input type="number" step="0.01" min="0" className={inputStyle} value={formData.horasAcademicas} onChange={e => setFormData({...formData, horasAcademicas: parseFloat(e.target.value)||0})} /></div>
                    <div><label className={labelStyle}>Horas Administrativas</label><input type="number" step="0.01" min="0" className={inputStyle} value={formData.horasAdm} onChange={e => setFormData({...formData, horasAdm: parseFloat(e.target.value)||0})} /></div>
                    <div><label className={labelStyle}>Turno Asignado</label>
                        <select className={inputStyle} value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value as any})}>
                            {TURNOS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div><label className={labelStyle}>Periodo Escolar</label><input className={inputStyle} value={formData.periodoGrupo || ''} onChange={e => setFormData({...formData, periodoGrupo: e.target.value.toUpperCase()})} placeholder="EJ: 2024-2025" /></div>
                    <div className="md:col-span-1"><label className={labelStyle}>Situación Trabajador</label>
                        <select className={inputStyle} value={formData.situacionTrabajador} onChange={e => setFormData({...formData, situacionTrabajador: e.target.value.toUpperCase()})}>
                            <option value="">- SELECCIONE -</option>
                            {SITUACION_TRABAJADOR.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2"><label className={labelStyle}>Observación del Trabajador</label><textarea rows={1} className={inputStyle} value={formData.observacion || ''} onChange={e => setFormData({...formData, observacion: e.target.value.toUpperCase()})} placeholder="Detalles adicionales..." /></div>
                </div>
             </div>

             <div className="bg-slate-900 p-10 rounded-2xl shadow-2xl">
                <h4 className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-[0.2em] border-b border-white/10 pb-4">Validación del Responsable</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div><label className="text-[9px] font-black text-white/40 uppercase ml-2 mb-1">Nombre</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.nombre} onChange={e => setResponsable({...responsable, nombre: e.target.value.toUpperCase()})} /></div>
                   <div><label className="text-[9px] font-black text-white/40 uppercase ml-2 mb-1">Cédula</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.ci} onChange={e => setResponsable({...responsable, ci: e.target.value.toUpperCase()})} /></div>
                   <div><label className="text-[9px] font-black text-white/40 uppercase ml-2 mb-1">Cargo</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.cargo} onChange={e => setResponsable({...responsable, cargo: e.target.value.toUpperCase()})} /></div>
                   <div><label className="text-[9px] font-black text-white/40 uppercase ml-2 mb-1">Teléfono</label><input required className="w-full rounded-xl border-2 border-white/10 p-3 bg-white/5 text-white font-bold uppercase text-xs outline-none focus:border-blue-500" value={responsable.telefono} onChange={e => setResponsable({...responsable, telefono: e.target.value.toUpperCase()})} /></div>
                </div>
             </div>

             <div className="flex justify-end mt-10"><button type="submit" className="bg-[#004a99] hover:bg-blue-800 text-white font-black py-5 px-16 rounded-2xl shadow-2xl uppercase text-xs tracking-widest flex items-center gap-3 transition-all active:scale-95"><Save size={20}/> {isEditing ? 'Actualizar Ficha RAC' : 'Inscribir en Plantilla RAC'}</button></div>
             {successMsg && <div className="mt-6 p-4 bg-emerald-100 text-emerald-800 font-black rounded-2xl text-center border-2 border-emerald-200 uppercase animate-bounce">{successMsg}</div>}
          </div>
        </form>

        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200 mt-12 mx-4 md:mx-0">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                <UserCheck className="text-blue-600" size={24}/> Personal Registrado en Institución
            </h3>
            
            <div className="block md:hidden space-y-4">
                {currentPlantelRac.length === 0 ? (
                    <div className="p-10 text-center text-slate-300 font-black uppercase italic tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">Sin registros activos</div>
                ) : (
                    currentPlantelRac.map(reg => (
                        <div key={reg.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 relative">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                                    {reg.fotoUrl ? <img src={reg.fotoUrl} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-200"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-black text-slate-800 uppercase text-xs leading-tight truncate">{reg.nombreApellido}</h4>
                                    <p className="text-[10px] text-blue-600 font-black tracking-widest mt-1">{reg.cedula}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{reg.tipoPersonal}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                                <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-slate-400 block font-bold">HORAS</span><span className="font-black text-slate-800">{reg.cargaHorariaRecibo} H</span></div>
                                <div className="bg-white p-2 rounded-xl border border-slate-100"><span className="text-slate-400 block font-bold">ESTATUS</span><span className={`font-black ${reg.situacionTrabajador === 'ACTIVO' ? 'text-emerald-600' : 'text-rose-600'}`}>{reg.situacionTrabajador}</span></div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <button onClick={() => setViewingRecord(reg)} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-xl"><Eye size={16}/></button>
                                <button onClick={() => handleEdit(reg)} className="p-2 text-indigo-500 bg-white border border-indigo-100 rounded-xl"><Edit size={16}/></button>
                                <button onClick={() => onDeleteRac(reg.id)} className="p-2 text-rose-500 bg-white border border-rose-100 rounded-xl"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-5">FOTO / IDENTIDAD</th>
                            <th className="px-6 py-5">ESTRUCTURA</th>
                            <th className="px-6 py-5">EJE / PERFIL</th>
                            <th className="px-6 py-5">JORNADA</th>
                            <th className="px-6 py-5">ESTATUS</th>
                            <th className="px-6 py-5 text-center">OPERACIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPlantelRac.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Sin registros activos</td></tr>
                        ) : (
                            currentPlantelRac.map(reg => (
                                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                                {reg.fotoUrl ? <img src={reg.fotoUrl} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-200"/>}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase text-sm">{reg.nombreApellido}</div>
                                                <div className="text-[10px] text-blue-600 font-black tracking-widest">{reg.cedula}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="font-black text-slate-700 uppercase">{reg.tipoPersonal}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{reg.funcion}</div></td>
                                    <td className="px-6 py-4"><div className="text-[9px] font-black text-indigo-700 uppercase bg-indigo-50 px-2 py-1 rounded-lg mb-1 inline-block">{reg.ejeConsolidacion?.replace('EJE_', '').replace('_', ' ')}</div><div className="text-[9px] text-slate-400 font-black uppercase truncate max-w-[150px]">{reg.materia || reg.especialidad}</div></td>
                                    <td className="px-6 py-4"><div className="font-black text-blue-700">{reg.cargaHorariaRecibo} H</div><div className="text-[8px] text-slate-400">ACAD: {reg.horasAcademicas}</div></td>
                                    <td className="px-6 py-4"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${reg.situacionTrabajador === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{reg.situacionTrabajador}</span></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setViewingRecord(reg)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"><Eye size={18}/></button>
                                            <button onClick={() => handleEdit(reg)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"><Edit size={18}/></button>
                                            <button onClick={() => onDeleteRac(reg.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
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

      {viewingRecord && (
          <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 overflow-hidden">
              <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
                  
                  <div className="bg-[#003399] p-4 md:p-6 text-white flex justify-between items-center shrink-0 shadow-md z-50">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-white/10 rounded-2xl"><UserIcon size={24} className="md:w-8 md:h-8" /></div>
                        <div>
                            <h3 className="font-black text-lg md:text-2xl uppercase tracking-tighter leading-none">Expediente Administrativo</h3>
                            <p className="text-blue-200 text-[9px] md:text-[10px] font-black uppercase mt-1 tracking-[0.2em]">Credencial Digital del Trabajador</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingRecord(null)} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-90 flex items-center justify-center">
                          <X size={24} className="text-white" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-slate-50 space-y-8 pb-32 md:pb-10">
                      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start mb-10 border-b border-slate-200 pb-10">
                          <div className="w-36 h-48 md:w-44 md:h-56 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden shrink-0">
                              {viewingRecord.fotoUrl ? <img src={viewingRecord.fotoUrl} className="w-full h-full object-cover" /> : <UserIcon size={64} className="text-slate-100" />}
                          </div>
                          <div className="flex-1 space-y-4 w-full text-center md:text-left">
                              <div>
                                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{viewingRecord.nombreApellido}</h2>
                                  <p className="text-blue-600 text-lg md:text-xl font-black mt-1 tracking-[0.2em]">{viewingRecord.cedula}</p>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{viewingRecord.tipoPersonal}</span>
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{viewingRecord.situacionTrabajador}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full mt-4">
                                  <ViewField label="Teléfono" value={viewingRecord.telefono} />
                                  <ViewField label="Correo" value={viewingRecord.correo} />
                                  <ViewField label="Lugar Nacimiento" value={viewingRecord.lugarNacimiento} />
                                  <ViewField label="Edad" value={viewingRecord.edad ? `${viewingRecord.edad} AÑOS` : ''} />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-8">
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                              <h4 className="text-[11px] font-black text-[#003399] uppercase tracking-[0.2em] flex items-center gap-2 border-b pb-3 mb-4"><Briefcase size={16}/> Datos Laborales</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  <ViewField label="Código Cargo" value={viewingRecord.codCargo} />
                                  <ViewField label="Clasificación" value={viewingRecord.clasificacion} />
                                  <ViewField label="Función Real" value={viewingRecord.funcion} />
                                  <ViewField label="Fecha Ingreso" value={viewingRecord.fechaIngreso} />
                                  <ViewField label="Carga Horaria" value={`${viewingRecord.cargaHorariaRecibo} H`} />
                                  <ViewField label="Resolución G.O" value={viewingRecord.numGoPc} />
                              </div>
                          </div>

                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                              <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b pb-3 mb-4"><FileText size={16}/> Perfil Curricular</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  <ViewField label="Nivel Instrucción" value={viewingRecord.nivelInstruccion} />
                                  <ViewField label="Profesión" value={viewingRecord.profesion} />
                                  <ViewField label="Especialidad" value={viewingRecord.especialidad} />
                                  <ViewField label="Área de Saber" value={viewingRecord.materia} />
                                  <ViewField label="Turno" value={viewingRecord.turno} />
                                  <ViewField label="Grado / Año" value={viewingRecord.grado || viewingRecord.ano} />
                              </div>
                          </div>

                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                              <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b pb-3 mb-4"><HeartPulse size={16}/> Ficha Socioeconómica (2do RAC)</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                      <p className="text-[9px] font-black text-slate-400 uppercase border-b pb-1">Residencia (Recibo de Pago)</p>
                                      <p className="text-[10px] font-bold text-slate-700 uppercase">{viewingRecord.estadoRecibo} / {viewingRecord.municipioRecibo} / {viewingRecord.parroquiaRecibo}</p>
                                      <ViewField label="Tlf. Habitación/Fijo" value={viewingRecord.tlfHabitacion} />
                                  </div>
                                  <div className="space-y-3">
                                      <p className="text-[9px] font-black text-slate-400 uppercase border-b pb-1">Tallas y Medidas</p>
                                      <div className="grid grid-cols-3 gap-2">
                                          <ViewField label="Camisa" value={viewingRecord.tallaCamisa} />
                                          <ViewField label="Pantalón" value={viewingRecord.tallaPantalon} />
                                          <ViewField label="Calzado" value={viewingRecord.tallaZapato} />
                                      </div>
                                  </div>
                                  <div className="space-y-3">
                                      <p className="text-[9px] font-black text-slate-400 uppercase border-b pb-1">Información de Vivienda</p>
                                      <ViewField label="Tipo Vivienda" value={viewingRecord.tipoVivienda} />
                                      <ViewField label="Condición" value={viewingRecord.condicionVivienda} />
                                      <ViewField label="Material requerido" value={viewingRecord.materialVivienda} />
                                  </div>
                                  <div className="space-y-3">
                                      <p className="text-[9px] font-black text-slate-400 uppercase border-b pb-1">Salud y Actividades</p>
                                      <ViewField label="Enfermedad" value={viewingRecord.padeceEnfermedad} />
                                      <ViewField label="Medicamento" value={viewingRecord.requiereMedicamento} />
                                      <ViewField label="Discapacidad" value={viewingRecord.discapacidad} />
                                      <ViewField label="Deporte" value={viewingRecord.actividadDeportiva} />
                                      <ViewField label="Cultura" value={viewingRecord.actividadCultural} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 bg-slate-900 p-8 rounded-[35px] border-l-8 border-l-blue-600">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Observaciones Administrativas</p>
                          <p className="text-xs font-bold text-white/80 uppercase italic leading-relaxed">"{viewingRecord.observacion || 'SIN OBSERVACIONES REGISTRADAS EN ESTE EXPEDIENTE.'}"</p>
                      </div>

                      <div className="flex md:hidden justify-center py-6">
                           <button onClick={() => setViewingRecord(null)} className="bg-slate-950 text-white font-black py-4 px-12 rounded-2xl shadow-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[0.3em] active:scale-95">Finalizar Revisión</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RacPlantelesManager;
