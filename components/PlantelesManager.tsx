
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plantel, NivelEducativo, Turno, Dependencia, EspaciosFisicos, ModalidadEducativa, Conectividad, User, RedesSociales } from '../types';
import { GEOGRAFIA_VENEZUELA, DEPENDENCIAS, NIVELES, TURNOS, MODALIDADES, PROVEEDORES_INTERNET, TIPOS_CONEXION, TIPOS_ESPACIOS } from '../utils/constants';
import { 
    MapPin, School, Plus, Search, Edit, Save, Trash2, Wifi, 
    UserCheck, ArrowLeft, Layers, Landmark, 
    Hash, Phone, Globe, Share2, Facebook, Instagram, Twitter, MessageSquare, Compass, ChevronRight,
    Laptop, GraduationCap, Building2, MousePointer2, Filter, Map, X, Calendar, Crosshair
} from 'lucide-react';
import L from 'leaflet';

interface PlantelesManagerProps {
  onSelectPlantel: (plantel: Plantel) => void;
  forcedPlanteles: Plantel[]; 
  onSavePlantel: (plantel: Plantel) => void;
  onDeletePlantel: (id: string) => void;
  currentUser: User;
  allowSelfRegister?: boolean;
}

const PlantelesManager: React.FC<PlantelesManagerProps> = ({ onSelectPlantel, forcedPlanteles, onSavePlantel, onDeletePlantel, currentUser, allowSelfRegister }) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [currentPlantel, setCurrentPlantel] = useState<Partial<Plantel>>({});
  
  // ESTADOS DE FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMun, setFilterMun] = useState('');
  const [filterPar, setFilterPar] = useState('');
  const [filterDep, setFilterDep] = useState('');   // Nuevo filtro Dependencia
  const [filterNivel, setFilterNivel] = useState(''); // Nuevo filtro Nivel
  const [filterMod, setFilterMod] = useState('');     // Nuevo filtro Modalidad
  
  // Estado del Modal de Mapa
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: string, lng: string} | null>(null);
  const [mapLayerType, setMapLayerType] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  const activeState = currentUser.estadoAsignado || 'ANZOATEGUI';

  // LOGICA DE RESTRICCION DE REGISTRO
  const canRegister = 
    currentUser.role === 'MAESTRO' || 
    currentUser.role === 'ADMINISTRADOR' || 
    currentUser.role === 'MUNICIPAL' || 
    (currentUser.role === 'PLANTEL' && allowSelfRegister);

  const filteredList = useMemo(() => {
    return (forcedPlanteles || [])
      .filter(p => {
        const name = (p.nombre || '').toLowerCase();
        const dea = (p.codigoDea || '').toLowerCase();
        const mun = (p.municipio || '').toUpperCase();
        const par = (p.parroquia || '').toUpperCase();
        const ner = (p.numeroNer || '').toLowerCase(); 
        
        const search = searchTerm.toLowerCase();
        const matchesSearch = name.includes(search) || dea.includes(search) || ner.includes(search);
        
        const matchesMun = !filterMun || mun === filterMun.toUpperCase();
        const matchesPar = !filterPar || par === filterPar.toUpperCase();
        
        // Lógica de nuevos filtros
        const matchesDep = !filterDep || p.dependencia === filterDep;
        const matchesNivel = !filterNivel || (p.niveles || []).includes(filterNivel as any);
        const matchesMod = !filterMod || (p.modalidades || []).includes(filterMod as any);

        return matchesSearch && matchesMun && matchesPar && matchesDep && matchesNivel && matchesMod;
      })
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [forcedPlanteles, searchTerm, filterMun, filterPar, filterDep, filterNivel, filterMod]);

  const contextLabel = useMemo(() => {
      if (filterPar) return "EN PARROQUIA";
      if (filterMun) return "EN MUNICIPIO";
      if (filterDep) return `PLANTELES ${filterDep.toUpperCase()}`;
      if (filterNivel) return `NIVEL ${filterNivel.toUpperCase()}`;
      if (searchTerm) return "RESULTADOS";
      return "TOTAL REGISTRADO";
  }, [filterPar, filterMun, searchTerm, filterDep, filterNivel]);

  // EFECTO: Inicialización del Mapa Ligero (Solo cuando se abre el modal)
  useEffect(() => {
      if (showMapPicker && mapRef.current && !mapInstance.current) {
          // Helper para parsear coordenadas seguras
          const parseCoord = (val: any, def: number) => {
              const n = parseFloat(val);
              return (isNaN(n) || n === 0) ? def : n;
          };

          const initialLat = parseCoord(currentPlantel.latitud, 9.15);
          const initialLng = parseCoord(currentPlantel.longitud, -64.3);
          
          setTempCoords({ lat: initialLat.toString(), lng: initialLng.toString() });

          // Crear mapa
          mapInstance.current = L.map(mapRef.current, {
              center: [initialLat, initialLng],
              zoom: currentPlantel.latitud && parseFloat(currentPlantel.latitud) !== 0 ? 15 : 9,
              zoomControl: false,
              preferCanvas: true 
          });

          L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

          // Marker Inicial
          if (currentPlantel.latitud && parseFloat(currentPlantel.latitud) !== 0) {
             markerInstance.current = L.marker([initialLat, initialLng]).addTo(mapInstance.current);
          }

          // Evento Click en Mapa
          mapInstance.current.on('click', (e) => {
              const lat = e.latlng.lat.toFixed(6);
              const lng = e.latlng.lng.toFixed(6);
              setTempCoords({ lat, lng });

              if (markerInstance.current) {
                  markerInstance.current.setLatLng(e.latlng);
              } else {
                  markerInstance.current = L.marker(e.latlng).addTo(mapInstance.current!);
              }
          });

          // CRITICO: Forzar recálculo del mapa después de que el Modal sea visible
          setTimeout(() => {
              if (mapInstance.current) {
                  mapInstance.current.invalidateSize();
              }
          }, 500);
      }

      // Gestión de Capas (Tile Layers)
      if (mapInstance.current) {
          mapInstance.current.eachLayer((layer) => {
              if (layer instanceof L.TileLayer) mapInstance.current?.removeLayer(layer);
          });

          if (mapLayerType === 'satellite') {
              L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                  attribution: 'Esri Satellite',
                  maxZoom: 18
              }).addTo(mapInstance.current);
              L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                  maxZoom: 18,
                  opacity: 0.8
              }).addTo(mapInstance.current);
          } else {
              // OpenStreetMap Standard - El más confiable
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; OpenStreetMap',
                  maxZoom: 19
              }).addTo(mapInstance.current);
          }
      }

      // Cleanup
      return () => {
          if (!showMapPicker && mapInstance.current) {
              mapInstance.current.off();
              mapInstance.current.remove();
              mapInstance.current = null;
              markerInstance.current = null;
          }
      };
  }, [showMapPicker, mapLayerType, currentPlantel.latitud, currentPlantel.longitud]);

  const confirmCoordinates = () => {
      if (tempCoords) {
          setCurrentPlantel(prev => ({
              ...prev,
              latitud: tempCoords.lat,
              longitud: tempCoords.lng
          }));
      }
      setShowMapPicker(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlantel = {
      ...currentPlantel,
      id: currentPlantel.id || crypto.randomUUID(),
      fechaRegistro: currentPlantel.fechaRegistro || new Date().toISOString().split('T')[0],
      niveles: currentPlantel.niveles || [],
      modalidades: currentPlantel.modalidades || [],
      turnos: currentPlantel.turnos || [],
      espaciosFisicos: currentPlantel.espaciosFisicos || { oficinas: 0, pasillos: 0, salones: 0, depositos: 0, cocina: 0, patio: 0, plazoleta: 0, jardines: 0, cancha: 0, banos: 0, multiuso: 0, estacionamiento: 0, cbit: 0, anfiteatro: 0, biblioteca: 0 },
      conectividad: currentPlantel.conectividad || { tieneInternet: false, conexion1: { proveedor: '', tipoConexion: '', status: '', fechaInstalacion: '' } },
      redesPlantel: currentPlantel.redesPlantel || {},
      redesDirector: currentPlantel.redesDirector || {}
    } as Plantel;
    onSavePlantel(finalPlantel);
    setViewMode('list');
    setCurrentPlantel({});
  };

  const toggleSelection = (list: string[], item: string) => {
      return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const updateEspacio = (key: string, val: number) => {
      setCurrentPlantel(prev => ({
          ...prev,
          espaciosFisicos: { ...(prev.espaciosFisicos as EspaciosFisicos), [key]: val }
      }));
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-200 p-3 bg-white text-slate-800 font-bold uppercase text-[11px] focus:border-[#003399] outline-none transition-all";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1";
  const sectionTitle = "text-sm font-black text-[#003399] mb-8 border-b-4 border-yellow-400 w-fit pb-2 uppercase italic tracking-tighter flex items-center gap-2";

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in h-full flex flex-col">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter italic"><School className="text-[#003399]" size={32} /> Directorio Territorial</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión Regional CDCE Anzoátegui</p>
            </div>
            {canRegister && (
              <button onClick={() => { 
                  setCurrentPlantel({ 
                      estado: activeState, 
                      dependencia: 'Nacional',
                      espaciosFisicos: { oficinas: 0, pasillos: 0, salones: 0, depositos: 0, cocina: 0, patio: 0, plazoleta: 0, jardines: 0, cancha: 0, banos: 0, multiuso: 0, estacionamiento: 0, cbit: 0, anfiteatro: 0, biblioteca: 0 },
                      conectividad: { tieneInternet: false, conexion1: { proveedor: '', tipoConexion: '', status: '', fechaInstalacion: '' } },
                      redesPlantel: {},
                      redesDirector: {}
                  }); 
                  setViewMode('form'); 
              }} className="bg-[#003399] text-white px-10 py-4 rounded-2xl hover:bg-blue-800 flex items-center gap-2 shadow-2xl transition-all font-black uppercase text-xs tracking-widest active:scale-95">
                  <Plus size={20}/> Registrar Plantel
              </button>
            )}
        </div>

        {/* BARRA DE FILTROS AVANZADA */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 bg-white p-6 rounded-[35px] border border-slate-200 shadow-sm items-center">
            {/* Buscador General */}
            <div className="xl:col-span-3 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none focus:ring-2 focus:ring-blue-100" placeholder="Nombre / DEA / NER..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            {/* Filtros Geográficos */}
            <div className="xl:col-span-2">
                <select className="w-full px-4 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none cursor-pointer" value={filterMun} onChange={e => { setFilterMun(e.target.value); setFilterPar(''); }}>
                    <option value="">MUNICIPIO (TODOS)</option>
                    {Object.keys(GEOGRAFIA_VENEZUELA[activeState] || {}).sort().map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="xl:col-span-2">
                <select className="w-full px-4 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none cursor-pointer" value={filterPar} onChange={e => setFilterPar(e.target.value)} disabled={!filterMun}>
                    <option value="">PARROQUIA (TODAS)</option>
                    {filterMun && GEOGRAFIA_VENEZUELA[activeState][filterMun]?.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {/* Nuevos Filtros Específicos */}
            <div className="xl:col-span-2">
                <select className="w-full px-4 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none cursor-pointer" value={filterDep} onChange={e => setFilterDep(e.target.value)}>
                    <option value="">DEPENDENCIA</option>
                    {DEPENDENCIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="xl:col-span-1">
                <select className="w-full px-2 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none cursor-pointer" value={filterNivel} onChange={e => setFilterNivel(e.target.value)}>
                    <option value="">NIVEL</option>
                    {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <div className="xl:col-span-1">
                <select className="w-full px-2 py-3 rounded-xl bg-slate-50 text-black font-bold uppercase text-[10px] outline-none cursor-pointer" value={filterMod} onChange={e => setFilterMod(e.target.value)}>
                    <option value="">MODALIDAD</option>
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Contador Totalizador Dinámico */}
            <div className="xl:col-span-1 flex justify-end">
                <div className="bg-[#003399] text-white px-2 py-2 rounded-xl font-black text-xs min-w-[90px] text-center shadow-lg flex flex-col items-center justify-center leading-none h-[46px] w-full">
                    <span className="text-[16px]">{filteredList.length}</span>
                    <span className="text-[6px] opacity-70 uppercase truncate w-full px-1">{contextLabel}</span>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredList.length === 0 ? (
                <div className="col-span-full py-40 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
                    <Search size={64} className="mx-auto text-slate-100 mb-4"/>
                    <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Sin resultados bajo estos filtros</p>
                </div>
            ) : filteredList.map(p => (
                <div key={p.id} className="bg-white rounded-[45px] border border-slate-200 p-8 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#003399]"></div>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-slate-800 uppercase text-sm leading-tight flex-1 mr-4 italic">{p.nombre}</h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCurrentPlantel(p); setViewMode('form'); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={16}/></button>
                                <button onClick={() => { if(confirm('¿BORRAR PLANTEL?')) onDeletePlantel(p.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            <span className="bg-blue-50 text-[#003399] font-black text-[10px] px-3 py-1 rounded-lg border border-blue-100">{p.codigoDea}</span>
                            <span className="bg-yellow-50 text-yellow-700 font-bold text-[9px] px-2 py-1 rounded-lg uppercase border border-yellow-100">{p.dependencia}</span>
                            {/* Visualización del NER en tarjeta */}
                            {p.numeroNer && <span className="bg-purple-50 text-purple-700 font-bold text-[9px] px-2 py-1 rounded-lg uppercase border border-purple-100">NER {p.numeroNer}</span>}
                        </div>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <p className="text-[10px] text-slate-600 flex items-center gap-2 font-black uppercase truncate"><MapPin size={14} className="text-rose-500 shrink-0"/> {p.municipio}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate pl-5">{p.parroquia}</p>
                        </div>
                    </div>
                    <button onClick={() => onSelectPlantel(p)} className="mt-8 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg">Ver Ficha Técnica <ChevronRight size={14}/></button>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 w-full h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
        <div className="bg-white p-8 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('list')} className="hover:bg-slate-100 p-3 rounded-2xl text-slate-400 transition-all"><ArrowLeft size={24}/></button>
                <div>
                    <h2 className="font-black text-xl text-slate-800 uppercase italic tracking-tighter leading-none">{currentPlantel.id ? 'Actualizar Institución' : 'Registro de Nueva Institución'}</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Protocolo CDCE v9.8 - 7 Secciones</p>
                </div>
            </div>
            <button type="submit" form="plantelForm" className="bg-[#003399] text-white px-12 py-4 rounded-2xl hover:bg-blue-800 flex items-center gap-3 shadow-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">
                <Save size={20}/> Guardar Cambios
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="plantelForm" onSubmit={handleSave} className="max-w-7xl mx-auto space-y-10 pb-40">
                
                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className={sectionTitle}><Landmark size={20}/> 1. Identificación y Ubicación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-9"><label className={labelStyle}>Epónimo Oficial</label><input required className={inputStyle} value={currentPlantel.nombre || ''} onChange={e => setCurrentPlantel({...currentPlantel, nombre: e.target.value.toUpperCase()})} /></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Código DEA</label><input required className={inputStyle} value={currentPlantel.codigoDea || ''} onChange={e => setCurrentPlantel({...currentPlantel, codigoDea: e.target.value.toUpperCase()})} /></div>
                        
                        <div className="md:col-span-3"><label className={labelStyle}>Cód. Estadístico</label><input className={inputStyle} value={currentPlantel.codigoEstadistico || ''} onChange={e => setCurrentPlantel({...currentPlantel, codigoEstadistico: e.target.value})} /></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Cód. Dependencia</label><input className={inputStyle} value={currentPlantel.codigoDependencia || ''} onChange={e => setCurrentPlantel({...currentPlantel, codigoDependencia: e.target.value})} /></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Cód. Electoral</label><input className={inputStyle} value={currentPlantel.codigoElectoral || ''} onChange={e => setCurrentPlantel({...currentPlantel, codigoElectoral: e.target.value})} /></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Dependencia</label><select className={inputStyle} value={currentPlantel.dependencia} onChange={e => setCurrentPlantel({...currentPlantel, dependencia: e.target.value as any})}>{DEPENDENCIAS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>

                        {/* CAMPO NER AGREGADO */}
                        <div className="md:col-span-3"><label className={labelStyle}>Número NER</label><input className={inputStyle} value={currentPlantel.numeroNer || ''} onChange={e => setCurrentPlantel({...currentPlantel, numeroNer: e.target.value.toUpperCase()})} placeholder="EJ: 556" /></div>
                        
                        <div className="md:col-span-3"><label className={labelStyle}>Municipio</label><select className={inputStyle} value={currentPlantel.municipio} onChange={e => setCurrentPlantel({...currentPlantel, municipio: e.target.value, parroquia: ''})}><option value="">SELECCIONE...</option>{Object.keys(GEOGRAFIA_VENEZUELA[activeState]).sort().map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Parroquia</label><select className={inputStyle} value={currentPlantel.parroquia} onChange={e => setCurrentPlantel({...currentPlantel, parroquia: e.target.value})} disabled={!currentPlantel.municipio}><option value="">SELECCIONE...</option>{currentPlantel.municipio && (GEOGRAFIA_VENEZUELA[activeState][currentPlantel.municipio] || []).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                        <div className="md:col-span-3"><label className={labelStyle}>Comuna / Circuito</label><input className={inputStyle} value={currentPlantel.circuitoEducativo || ''} onChange={e => setCurrentPlantel({...currentPlantel, circuitoEducativo: e.target.value.toUpperCase()})} placeholder="CIRCUITO / COMUNA" /></div>

                        <div className="md:col-span-9"><label className={labelStyle}>Dirección Exacta</label><input className={inputStyle} value={currentPlantel.direccion || ''} onChange={e => setCurrentPlantel({...currentPlantel, direccion: e.target.value.toUpperCase()})} /></div>
                        
                        <div className="md:col-span-3 flex gap-2 items-end">
                            <div className="flex-1"><label className={labelStyle}>Lat</label><input className={inputStyle} value={currentPlantel.latitud || ''} readOnly /></div>
                            <div className="flex-1"><label className={labelStyle}>Lng</label><input className={inputStyle} value={currentPlantel.longitud || ''} readOnly /></div>
                            <button type="button" onClick={() => setShowMapPicker(true)} className="bg-[#003399] text-white p-3 rounded-xl shadow-lg hover:bg-blue-800 transition-all mb-[1px] flex items-center justify-center gap-2 group w-12" title="Abrir Mapa Satelital">
                                <Map size={20} className="group-hover:scale-110 transition-transform"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className={sectionTitle}><UserCheck size={20}/> 2. Datos Directivos y Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2"><label className={labelStyle}>Nombre Director(a)</label><input className={inputStyle} value={currentPlantel.director || ''} onChange={e => setCurrentPlantel({...currentPlantel, director: e.target.value.toUpperCase()})} /></div>
                        <div><label className={labelStyle}>Cédula</label><input className={inputStyle} value={currentPlantel.ciDirector || ''} onChange={e => setCurrentPlantel({...currentPlantel, ciDirector: e.target.value.toUpperCase()})} /></div>
                        <div><label className={labelStyle}>Teléfono</label><input className={inputStyle} value={currentPlantel.telefono || ''} onChange={e => setCurrentPlantel({...currentPlantel, telefono: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelStyle}>Correo Institucional</label><input className={inputStyle} type="email" value={currentPlantel.emailDirector || ''} onChange={e => setCurrentPlantel({...currentPlantel, emailDirector: e.target.value.toUpperCase()})} /></div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className={sectionTitle}><GraduationCap size={20}/> 3. Caracterización Educativa</h3>
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Niveles que Atiende</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {NIVELES.map(lvl => (
                                    <button type="button" key={lvl} onClick={() => setCurrentPlantel({...currentPlantel, niveles: toggleSelection(currentPlantel.niveles || [], lvl) as NivelEducativo[]})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentPlantel.niveles?.includes(lvl as any) ? 'bg-[#003399] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>Modalidades</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {MODALIDADES.map(mod => (
                                    <button type="button" key={mod} onClick={() => setCurrentPlantel({...currentPlantel, modalidades: toggleSelection(currentPlantel.modalidades || [], mod) as ModalidadEducativa[]})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentPlantel.modalidades?.includes(mod as any) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                        {mod}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>Turnos</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {TURNOS.map(t => (
                                    <button type="button" key={t} onClick={() => setCurrentPlantel({...currentPlantel, turnos: toggleSelection(currentPlantel.turnos || [], t) as Turno[]})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentPlantel.turnos?.includes(t as any) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className={sectionTitle}><Building2 size={20}/> 4. Infraestructura y Espacios Físicos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {TIPOS_ESPACIOS.map(esp => (
                            <div key={esp.key} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-lg transition-all">
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 h-auto min-h-[24px]">{esp.label}</label>
                                <div className="flex items-center justify-center gap-3">
                                    <button type="button" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 font-bold" onClick={() => updateEspacio(esp.key, Math.max(0, (currentPlantel.espaciosFisicos as any)[esp.key] - 1))}>-</button>
                                    <span className="text-xl font-black text-slate-800 w-8">{(currentPlantel.espaciosFisicos as any)[esp.key]}</span>
                                    <button type="button" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 font-bold" onClick={() => updateEspacio(esp.key, (currentPlantel.espaciosFisicos as any)[esp.key] + 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className={sectionTitle}><Wifi size={20}/> 5. Conectividad y Tecnología</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        <div className="md:col-span-12 bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-900 uppercase">¿Posee Internet?</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, tieneInternet: true}})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${currentPlantel.conectividad?.tieneInternet ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'}`}>SI</button>
                                <button type="button" onClick={() => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, tieneInternet: false}})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!currentPlantel.conectividad?.tieneInternet ? 'bg-slate-600 text-white' : 'bg-white text-slate-300'}`}>NO</button>
                            </div>
                        </div>
                        
                        {currentPlantel.conectividad?.tieneInternet && (
                            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                                <div className="md:col-span-4 text-[10px] font-black text-[#003399] uppercase border-b pb-1">Conexión Principal</div>
                                <div><label className={labelStyle}>Proveedor</label><select className={inputStyle} value={currentPlantel.conectividad.conexion1.proveedor} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion1: {...currentPlantel.conectividad!.conexion1, proveedor: e.target.value}}})}><option value="">SELECCIONE...</option>{PROVEEDORES_INTERNET.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                <div><label className={labelStyle}>Tipo Conexión</label><select className={inputStyle} value={currentPlantel.conectividad.conexion1.tipoConexion} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion1: {...currentPlantel.conectividad!.conexion1, tipoConexion: e.target.value}}})}><option value="">SELECCIONE...</option>{TIPOS_CONEXION.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label className={labelStyle}>Estatus Actual</label><select className={inputStyle} value={currentPlantel.conectividad.conexion1.status} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion1: {...currentPlantel.conectividad!.conexion1, status: e.target.value as any}}})}><option value="Activa">ACTIVA</option><option value="Averia">AVERÍA</option><option value="Suspendido">SUSPENDIDO</option></select></div>
                                <div><label className={labelStyle}>Fecha Instalación</label><input type="date" className={inputStyle} value={currentPlantel.conectividad.conexion1.fechaInstalacion || ''} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion1: {...currentPlantel.conectividad!.conexion1, fechaInstalacion: e.target.value}}})} /></div>
                                
                                <div className="md:col-span-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={currentPlantel.conectividad.tieneSegundaConexion || false} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, tieneSegundaConexion: e.target.checked, conexion2: e.target.checked ? { proveedor: '', tipoConexion: '', status: '', fechaInstalacion: '' } : undefined }})} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase">¿Posee un segundo proveedor de respaldo?</span>
                                    </label>
                                </div>

                                {currentPlantel.conectividad.tieneSegundaConexion && currentPlantel.conectividad.conexion2 && (
                                    <>
                                        <div className="md:col-span-4 text-[10px] font-black text-slate-500 uppercase border-b pb-1 mt-2">Conexión Secundaria / Respaldo</div>
                                        <div><label className={labelStyle}>Proveedor 2</label><select className={inputStyle} value={currentPlantel.conectividad.conexion2.proveedor} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion2: {...currentPlantel.conectividad!.conexion2!, proveedor: e.target.value}}})}><option value="">SELECCIONE...</option>{PROVEEDORES_INTERNET.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                        <div><label className={labelStyle}>Tipo Conexión 2</label><select className={inputStyle} value={currentPlantel.conectividad.conexion2.tipoConexion} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion2: {...currentPlantel.conectividad!.conexion2!, tipoConexion: e.target.value}}})}><option value="">SELECCIONE...</option>{TIPOS_CONEXION.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label className={labelStyle}>Estatus 2</label><select className={inputStyle} value={currentPlantel.conectividad.conexion2.status} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion2: {...currentPlantel.conectividad!.conexion2!, status: e.target.value as any}}})}><option value="Activa">ACTIVA</option><option value="Averia">AVERÍA</option><option value="Suspendido">SUSPENDIDO</option></select></div>
                                        <div><label className={labelStyle}>Fecha Instalación 2</label><input type="date" className={inputStyle} value={currentPlantel.conectividad.conexion2.fechaInstalacion || ''} onChange={e => setCurrentPlantel({...currentPlantel, conectividad: {...currentPlantel.conectividad!, conexion2: {...currentPlantel.conectividad!.conexion2!, fechaInstalacion: e.target.value}}})} /></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-indigo-700 mb-8 border-b-4 border-indigo-200 w-fit pb-2 uppercase italic tracking-tighter flex items-center gap-2"><Globe size={20}/> 6. Redes Sociales Institucionales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative"><Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Usuario Facebook" value={currentPlantel.redesPlantel?.facebook || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesPlantel: {...currentPlantel.redesPlantel, facebook: e.target.value}})} /></div>
                        <div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Usuario Instagram" value={currentPlantel.redesPlantel?.instagram || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesPlantel: {...currentPlantel.redesPlantel, instagram: e.target.value}})} /></div>
                        <div className="relative"><Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Usuario X (Twitter)" value={currentPlantel.redesPlantel?.x || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesPlantel: {...currentPlantel.redesPlantel, x: e.target.value}})} /></div>
                        <div className="relative"><MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Usuario TikTok" value={currentPlantel.redesPlantel?.tiktok || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesPlantel: {...currentPlantel.redesPlantel, tiktok: e.target.value}})} /></div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-purple-700 mb-8 border-b-4 border-purple-200 w-fit pb-2 uppercase italic tracking-tighter flex items-center gap-2"><Share2 size={20}/> 7. Redes Sociales del Director</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative"><Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600/50" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Facebook Director" value={currentPlantel.redesDirector?.facebook || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesDirector: {...currentPlantel.redesDirector, facebook: e.target.value}})} /></div>
                        <div className="relative"><Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600/50" size={18}/><input className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold uppercase" placeholder="Instagram Director" value={currentPlantel.redesDirector?.instagram || ''} onChange={e => setCurrentPlantel({...currentPlantel, redesDirector: {...currentPlantel.redesDirector, instagram: e.target.value}})} /></div>
                    </div>
                </div>

            </form>
        </div>

        {showMapPicker && (
            <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in border-4 border-white/20">
                    <div className="bg-[#003399] p-6 flex justify-between items-center text-white shrink-0 relative">
                        <div className="flex items-center gap-4">
                            <MapPin size={24} className="text-yellow-400"/>
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter">Geolocalización Satelital</h3>
                                <p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest">Haga clic en el mapa para fijar el punto exacto</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setMapLayerType('standard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mapLayerType === 'standard' ? 'bg-white text-[#003399]' : 'bg-white/10 text-white hover:bg-white/20'}`}>Plano</button>
                            <button onClick={() => setMapLayerType('satellite')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mapLayerType === 'satellite' ? 'bg-white text-[#003399]' : 'bg-white/10 text-white hover:bg-white/20'}`}>Satélite</button>
                        </div>
                        <button onClick={() => setShowMapPicker(false)} className="p-2 hover:bg-white/10 rounded-full transition-all ml-4"><X size={24}/></button>
                    </div>
                    
                    <div className="flex-1 relative">
                        <div ref={mapRef} className="w-full h-full z-0"></div>
                        
                        {tempCoords && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-10">
                                <button 
                                    onClick={confirmCoordinates}
                                    className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-3 border-4 border-white"
                                >
                                    <Crosshair size={20}/> Confirmar Ubicación
                                </button>
                            </div>
                        )}

                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-white z-[1000] text-center">
                            <p className="text-[10px] font-black text-[#003399] uppercase tracking-widest">
                                {tempCoords ? `${tempCoords.lat}, ${tempCoords.lng}` : 'SELECCIONE UN PUNTO'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PlantelesManager;
