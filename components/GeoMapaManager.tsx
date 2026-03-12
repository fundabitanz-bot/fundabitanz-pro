import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Plantel, MatriculaRegistro, RacRegistro, FedeRegistro, CnaeRegistro } from '../types';
import { Map as MapIcon, X, MapPin, Layers as LayersIcon, Maximize2, Minimize2, Users, School, GraduationCap, Phone, Info, Briefcase, ChevronRight, Wifi, Hammer, ChefHat, Activity, Search, Filter, Target, Eye, Navigation2, Building2, Menu, ChevronUp, ChevronDown, Mail, ShieldCheck, UserCog, Brush, Shield } from 'lucide-react';

interface GeoMapaManagerProps {
  planteles: Plantel[];
  matricula: MatriculaRegistro[];
  rac: RacRegistro[];
  fede?: FedeRegistro[];
  cnae?: CnaeRegistro[];
  onFullScreenToggle?: (fs: boolean) => void;
  isFullScreen?: boolean;
}

type LayerType = 'POBLACION' | 'CONECTIVIDAD' | 'INFRAESTRUCTURA' | 'ALIMENTACION';

const GeoMapaManager: React.FC<GeoMapaManagerProps> = ({ planteles, matricula, rac, fede = [], cnae = [], onFullScreenToggle, isFullScreen = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [activeAnalysisLayer, setActiveAnalysisLayer] = useState<LayerType>('POBLACION');
  const [selectedPlantel, setSelectedPlantel] = useState<Plantel | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(true); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterDep, setFilterDep] = useState('');
  const [filterNivel, setFilterNivel] = useState('');

  const standardLayer = useRef<L.TileLayer>(L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap'
  }));

  const satelliteLayer = useRef<L.TileLayer>(L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri Satellite',
    maxZoom: 19
  }));

  const hybridLabelsLayer = useRef<L.TileLayer>(L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    opacity: 0.9,
    pane: 'markerPane' 
  }));

  useEffect(() => {
      if (window.innerWidth < 768) {
          setIsToolsOpen(false);
      }
  }, []);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const sTerm = searchQuery.toLowerCase();
    return planteles.filter(p => {
        const pNombre = (p.nombre || '').toLowerCase();
        const pDea = (p.codigoDea || '').toLowerCase();
        return pNombre.includes(sTerm) || pDea.includes(sTerm);
    }).slice(0, 6);
  }, [planteles, searchQuery]);

  const visiblePlanteles = useMemo(() => {
    return planteles.filter(p => {
        const matchesDep = !filterDep || p.dependencia === filterDep;
        const matchesNivel = !filterNivel || (p.niveles || []).some(n => n.includes(filterNivel));
        return matchesDep && matchesNivel;
    });
  }, [planteles, filterDep, filterNivel]);

  const hudMetrics = useMemo(() => {
    const ids = new Set(visiblePlanteles.map(p => p.id));
    const matFiltered = matricula.filter(m => ids.has(m.plantelId));
    const racFiltered = rac.filter(r => ids.has(r.plantelId));
    return {
        count: visiblePlanteles.length,
        totalMat: matFiltered.reduce((acc, m) => acc + (m.inscriptosFemenino || 0) + (m.inscriptosMasculino || 0), 0),
        totalStaff: racFiltered.length
    };
  }, [visiblePlanteles, matricula, rac]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, {
      center: [9.15, -64.3],
      zoom: 8,
      zoomControl: false,
      preferCanvas: true 
    });

    standardLayer.current.addTo(leafletMap.current);
    L.control.zoom({ position: 'bottomleft' }).addTo(leafletMap.current);
    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    setTimeout(() => {
        leafletMap.current?.invalidateSize();
    }, 500);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current) return;
    if (mapType === 'satellite') {
      standardLayer.current.remove();
      satelliteLayer.current.addTo(leafletMap.current);
      hybridLabelsLayer.current.addTo(leafletMap.current);
    } else {
      satelliteLayer.current.remove();
      hybridLabelsLayer.current.remove();
      standardLayer.current.addTo(leafletMap.current);
    }
  }, [mapType]);

  useEffect(() => {
    if (!markersLayer.current || !leafletMap.current) return;
    markersLayer.current.clearLayers();

    visiblePlanteles.forEach((p) => {
      const lat = parseFloat(p.latitud);
      const lng = parseFloat(p.longitud);

      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      let markerColor = "#64748b"; 
      if (activeAnalysisLayer === 'POBLACION') {
          const pMat = matricula.filter(m => m.plantelId === p.id);
          const totalGral = pMat.reduce((acc, m) => acc + (m.inscriptosFemenino || 0) + (m.inscriptosMasculino || 0), 0);
          if (totalGral > 500) markerColor = "#e11d48"; 
          else if (totalGral >= 150) markerColor = "#eab308"; 
          else markerColor = "#003399"; 
      } 
      else if (activeAnalysisLayer === 'CONECTIVIDAD') {
          // Lógica Mejorada: Avería cuenta como conectado pero se diferencia en color
          if (p.conectividad?.tieneInternet) {
              const status = (p.conectividad.conexion1?.status || '').toUpperCase();
              if (status === 'AVERIA' || status === 'SUSPENDIDO') {
                  markerColor = "#eab308"; // Amarillo para Avería/Suspendido
              } else {
                  markerColor = "#10b981"; // Verde para Activa
              }
          } else {
              markerColor = "#f43f5e"; // Rojo para Sin Internet
          }
      }
      else if (activeAnalysisLayer === 'INFRAESTRUCTURA') {
          const infoFede = fede.find(f => f.plantelId === p.id);
          if (!infoFede) markerColor = "#94a3b8";
          else if (infoFede.estadoGeneral === 'CRITICO' || infoFede.estadoGeneral === 'MALO') markerColor = "#e11d48";
          else if (infoFede.estadoGeneral === 'REGULAR') markerColor = "#f59e0b";
          else markerColor = "#10b981";
      }
      else if (activeAnalysisLayer === 'ALIMENTACION') {
          const infoCnae = cnae.find(c => c.plantelId === p.id);
          markerColor = infoCnae?.recibioPae ? "#10b981" : "#f97316"; 
      }

      const isSelected = selectedPlantel?.id === p.id;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex flex-col items-center group relative z-10 hover:z-50">
            <div class="p-2 rounded-full border-2 border-white shadow-xl text-white transition-all duration-300 cursor-pointer ${isSelected ? 'scale-125 ring-[4px] ring-yellow-400' : 'hover:scale-110'}" style="background-color: ${markerColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="absolute top-full mt-1 bg-white/95 backdrop-blur text-slate-800 px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex flex-col items-center">
              <span class="text-[9px] font-black uppercase tracking-tight">${p.nombre}</span>
              <div class="w-2 h-2 bg-white absolute -top-1 rotate-45 border-l border-t border-slate-200"></div>
            </div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer.current!);
      
      marker.on('click', () => {
        setSelectedPlantel(p);
        leafletMap.current?.flyTo([lat, lng], 16, { 
            duration: 1.5,
            easeLinearity: 0.25
        });
      });
    });
  }, [visiblePlanteles, matricula, activeAnalysisLayer, fede, cnae, selectedPlantel]);

  const handleSelectFromSearch = (p: Plantel) => {
    setSelectedPlantel(p);
    setSearchQuery('');
    setIsSearchFocused(false);
    const lat = parseFloat(p.latitud);
    const lng = parseFloat(p.longitud);
    if (!isNaN(lat) && !isNaN(lng)) {
        leafletMap.current?.flyTo([lat, lng], 16, { duration: 2 });
    }
  };

  const statsSelected = useMemo(() => {
    if (!selectedPlantel) return null;
    const pMat = matricula.filter(m => m.plantelId === selectedPlantel.id);
    const latestMatByNivel = new Map<string, MatriculaRegistro>();
    pMat.forEach(m => {
        const ex = latestMatByNivel.get(m.nivel);
        if (!ex || new Date(m.fechaCarga) > new Date(ex.fechaCarga)) latestMatByNivel.set(m.nivel, m);
    });
    const matList = Array.from(latestMatByNivel.values());
    const fem = matList.reduce((acc, m) => acc + (m.inscriptosFemenino || 0), 0);
    const masc = matList.reduce((acc, m) => acc + (m.inscriptosMasculino || 0), 0);
    
    const pRac = rac.filter(r => r.plantelId === selectedPlantel.id);
    
    return {
      fem, masc, total: fem + masc,
      docentes: pRac.filter(r => r.tipoPersonal === 'DOCENTE').length,
      admin: pRac.filter(r => r.tipoPersonal === 'ADMINISTRATIVO').length,
      // Corrección: Usar 'funcion' en lugar de 'cargo' (propiedad no existente)
      aseadores: pRac.filter(r => (r.funcion || '').includes('ASEADOR')).length,
      cocineros: pRac.filter(r => (r.funcion || '').includes('COCINERO') || (r.funcion || '').includes('ELABORADOR')).length,
      vigilantes: pRac.filter(r => (r.funcion || '').includes('VIGILANTE')).length
    };
  }, [selectedPlantel, matricula, rac]);

  return (
    <div className={`flex flex-col gap-6 relative transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] bg-slate-100 w-screen h-screen' : 'h-[calc(100vh-160px)]'}`}>
      
      <div className={`bg-white p-4 sm:p-5 shadow-xl border border-slate-200 flex flex-col xl:flex-row justify-between items-center shrink-0 gap-4 transition-all duration-500 z-[500] ${isFullScreen ? 'm-4 rounded-[30px]' : 'rounded-[40px]'}`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-[#003399] text-white rounded-2xl shadow-lg animate-pulse shrink-0"><MapIcon size={24} /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tighter italic leading-none truncate">Inteligencia Territorial</h2>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 truncate">SGI PRO - Centro de Comando</p>
          </div>
        </div>
        
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex flex-nowrap gap-2 bg-slate-50 p-1.5 rounded-3xl border border-slate-200 w-fit">
                {[
                    { id: 'POBLACION', label: 'Matrícula', icon: <Users size={14}/> },
                    { id: 'CONECTIVIDAD', label: 'Internet', icon: <Wifi size={14}/> },
                    { id: 'INFRAESTRUCTURA', label: 'FEDE', icon: <Hammer size={14}/> },
                    { id: 'ALIMENTACION', label: 'PAE', icon: <ChefHat size={14}/> }
                ].map(layer => (
                    <button 
                        key={layer.id}
                        onClick={() => setActiveAnalysisLayer(layer.id as LayerType)}
                        className={`px-3 sm:px-4 py-2 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeAnalysisLayer === layer.id ? 'bg-[#003399] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                    >
                        {layer.icon} {layer.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto justify-end">
           <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
              <button onClick={() => setMapType('standard')} className={`px-4 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${mapType === 'standard' ? 'bg-white text-[#003399] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Plano</button>
              <button onClick={() => setMapType('satellite')} className={`px-4 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${mapType === 'satellite' ? 'bg-white text-[#003399] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Híbrido</button>
           </div>
           <button 
                onClick={() => onFullScreenToggle?.(!isFullScreen)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-[#003399] shadow-sm hover:bg-blue-50 transition-all active:scale-90"
           >
              {isFullScreen ? <Minimize2 size={22}/> : <Maximize2 size={22}/>}
           </button>
        </div>
      </div>

      <div className={`flex-1 relative overflow-hidden transition-all duration-500 ${isFullScreen ? 'w-full h-full' : 'bg-white rounded-[40px] shadow-2xl border-4 border-white'}`}>
        <div ref={mapRef} className="h-full w-full z-0"></div>

        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[600] w-[90%] sm:w-full max-w-lg px-0 sm:px-4">
            <div className={`relative group transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
                <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-2 border-white/50 p-2 flex items-center gap-3">
                    <div className="p-2.5 bg-[#003399] text-white rounded-full"><Search size={18}/></div>
                    <input 
                        className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase placeholder:text-slate-400 min-w-0"
                        placeholder="Buscar plantel..."
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={18}/></button>
                    )}
                </div>

                {isSearchFocused && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-3 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <div className="p-2">
                            {searchResults.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => handleSelectFromSearch(p)}
                                    className="w-full p-4 hover:bg-blue-50 rounded-2xl flex items-center gap-4 text-left transition-all group"
                                >
                                    <div className="p-2 bg-blue-100 text-[#003399] rounded-xl group-hover:bg-[#003399] group-hover:text-white transition-all shrink-0"><School size={18}/></div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-tight">{p.nombre || 'SIN NOMBRE'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{p.codigoDea || '---'}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase truncate">{p.municipio}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all"/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <button 
            className="absolute bottom-6 left-6 z-[600] md:hidden bg-slate-900 text-white p-3 rounded-full shadow-xl border-2 border-white/20"
            onClick={() => setIsToolsOpen(!isToolsOpen)}
        >
            {isToolsOpen ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
        </button>

        {(isToolsOpen || window.innerWidth >= 768) && (
            <div className="absolute bottom-20 md:bottom-6 left-6 z-[400] flex flex-col gap-3 pointer-events-none origin-bottom-left animate-in slide-in-from-left-10 duration-500">
                <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[35px] border border-white/20 shadow-2xl pointer-events-auto min-w-[200px]">
                    <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
                        <Target className="text-yellow-400" size={18}/>
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">Vista Estratégica</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Instituciones:</span>
                            <span className="text-lg font-black text-white">{hudMetrics.count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Matrícula:</span>
                            <span className="text-lg font-black text-emerald-400">{hudMetrics.totalMat.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Personal:</span>
                            <span className="text-lg font-black text-blue-400">{hudMetrics.totalStaff.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {selectedPlantel && statsSelected && (
            <div className="absolute top-0 right-0 h-full w-full sm:w-[450px] z-[700] pointer-events-none p-0 sm:p-4">
                <div className="bg-white/95 backdrop-blur-2xl h-full w-full sm:rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] border-none sm:border-4 border-white pointer-events-auto overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-right-full duration-500">
                    
                    <button 
                        onClick={() => setSelectedPlantel(null)} 
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-slate-900/10 hover:bg-rose-50 hover:text-white rounded-full transition-all z-[800]"
                    >
                        <X size={24}/>
                    </button>

                    {/* HEADER AZUL REORGANIZADO */}
                    <div className="bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 p-8 pb-10 text-white shrink-0 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                         <div className="relative z-10 space-y-4 mt-6">
                             <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none italic drop-shadow-xl pr-10">{selectedPlantel.nombre || 'SIN NOMBRE'}</h3>
                             
                             <div className="flex flex-wrap gap-2">
                                <span className="text-[9px] font-black bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 uppercase tracking-widest">{selectedPlantel.dependencia}</span>
                                {(selectedPlantel.niveles || []).map(n => <span key={n} className="text-[9px] font-black bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest">{n}</span>)}
                                {(selectedPlantel.modalidades || []).map(m => <span key={m} className="text-[9px] font-black bg-purple-500/30 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest">{m}</span>)}
                             </div>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 pb-24 -mt-6 bg-white rounded-t-[40px] relative z-20">
                        
                        {/* UBICACION Y CODIGOS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <MapPin size={14}/> {selectedPlantel.municipio} / {selectedPlantel.parroquia}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Cód. DEA</p>
                                    <p className="text-xs font-black text-[#003399] uppercase">{selectedPlantel.codigoDea || '---'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Cód. Dependencia</p>
                                    <p className="text-xs font-black text-slate-700 uppercase">{selectedPlantel.codigoDependencia || '---'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Cód. Estadístico</p>
                                    <p className="text-xs font-black text-slate-700 uppercase">{selectedPlantel.codigoEstadistico || '---'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Número NER</p>
                                    <p className="text-xs font-black text-slate-700 uppercase">{selectedPlantel.numeroNer || '---'}</p>
                                </div>
                            </div>
                        </div>

                        {/* DIRECTOR */}
                        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                            <h4 className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12}/> Dirección Institucional</h4>
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase"><Users size={14} className="text-blue-400"/> {selectedPlantel.director || 'NO REGISTRADO'}</p>
                                <p className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><Phone size={14} className="text-blue-400"/> {selectedPlantel.telefono || '---'}</p>
                                <p className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><Mail size={14} className="text-blue-400"/> {selectedPlantel.emailDirector || '---'}</p>
                            </div>
                        </div>

                        {/* MATRICULA */}
                        <div className="space-y-4">
                            <h4 className="font-black text-slate-800 uppercase text-[10px] flex items-center gap-2 tracking-widest border-b pb-2"><GraduationCap size={16} className="text-[#003399]"/> Matrícula por Género</h4>
                            <div className="bg-white p-5 rounded-[30px] border-2 border-slate-100 shadow-sm">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{statsSelected.total}</span>
                                    <div className="flex gap-4 text-[9px] font-black uppercase">
                                        <span className="text-pink-600">Fem: {statsSelected.fem}</span>
                                        <span className="text-blue-600">Masc: {statsSelected.masc}</span>
                                    </div>
                                </div>
                                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 shadow-inner">
                                    <div className="bg-pink-500 h-full" style={{ width: statsSelected.total > 0 ? `${(statsSelected.fem / statsSelected.total) * 100}%` : '0%' }}></div>
                                    <div className="bg-blue-600 h-full" style={{ width: statsSelected.total > 0 ? `${(statsSelected.masc / statsSelected.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* PERSONAL */}
                        <div className="space-y-4">
                            <h4 className="font-black text-slate-800 uppercase text-[10px] flex items-center gap-2 tracking-widest border-b pb-2"><UserCog size={16} className="text-indigo-600"/> Distribución de Personal</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><School size={12}/> Docentes</span>
                                    <span className="text-sm font-black text-slate-800">{statsSelected.docentes}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><ShieldCheck size={12}/> Admin</span>
                                    <span className="text-sm font-black text-slate-800">{statsSelected.admin}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><Brush size={12}/> Aseadores</span>
                                    <span className="text-sm font-black text-slate-800">{statsSelected.aseadores}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><ChefHat size={12}/> Cocineros</span>
                                    <span className="text-sm font-black text-slate-800">{statsSelected.cocineros}</span>
                                </div>
                                <div className="col-span-2 bg-slate-50 p-3 rounded-2xl flex justify-between items-center border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><Shield size={12}/> Vigilantes</span>
                                    <span className="text-sm font-black text-slate-800">{statsSelected.vigilantes}</span>
                                </div>
                            </div>
                        </div>

                        {/* DIRECCION Y COORDENADAS */}
                        <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                             <div className="mb-4">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección Completa</p>
                                <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase italic">"{selectedPlantel.direccion || 'SIN DIRECCIÓN REGISTRADA'}"</p>
                             </div>
                             <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-blue-700 bg-white w-fit px-4 py-2 rounded-xl shadow-sm border border-blue-100">
                                <Navigation2 size={12} className="rotate-45"/> 
                                {selectedPlantel.latitud}, {selectedPlantel.longitud}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GeoMapaManager;