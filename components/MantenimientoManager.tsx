
import React, { useState, useRef, useEffect } from 'react';
import { 
    RefreshCw, Save, FileSpreadsheet, 
    UserCog, ChefHat, Brush, Shield, 
    Bomb, FileDown, Plus, Settings2, FileUp, 
    ImageIcon, Zap, FileText, SearchCode, History, UserCheck, X,
    Wifi, Globe, Activity, LayoutGrid, Terminal, Database,
    Calculator, BrainCircuit, ShieldCheck, Download, MessageSquare
} from 'lucide-react';
import { User, Plantel, RacRegistro, PersonnelCriteria, Dependencia, NivelEducativo, Turno, ModalidadEducativa } from '../types';
import * as XLSX from 'xlsx';

interface MantenimientoManagerProps {
    onRefreshData: () => void;
    onLogoChange?: (base64: string) => void;
    onBannerChange?: (base64: string) => void;
    onCriteriaChange?: (criteria: PersonnelCriteria) => void;
    onAiEnabledChange?: (enabled: boolean) => void;
    onChatbotChange?: (enabled: boolean) => void;
    onSelfRegisterChange?: (enabled: boolean) => void;
    onStateNameChange?: (name: string) => void;
    onBulkImport?: (key: string, data: any) => Promise<void>;
    onPurgeAsistencia?: () => void;
    onHardReset?: () => void; 
    currentUser?: User;
    serverUrl: string;
    isOnline: boolean;
    allData: any; 
}

const MantenimientoManager: React.FC<MantenimientoManagerProps> = ({ 
    onRefreshData, onLogoChange, onBannerChange, onCriteriaChange, onAiEnabledChange, onChatbotChange, onSelfRegisterChange, onStateNameChange, onBulkImport, onPurgeAsistencia, onHardReset, currentUser, serverUrl, isOnline, allData 
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'red' | 'criterios' | 'carga_masiva' | 'avanzado'>('general');
    const [isProcessing, setIsProcessing] = useState(false);
    const [localStateName, setLocalStateName] = useState<string>('ANZOÁTEGUI');
    const [localCriteria, setLocalCriteria] = useState<PersonnelCriteria>({
        docentesPorAlumno: 35,
        administrativosPorAlumno: 250,
        aseadoresPorEspacio: 8,
        cocinerosPorAlumno: 150,
        vigilantesPorEspacio: 6
    });
    
    // Estado local para los interruptores (sincronizado con allData)
    const [chatbotEnabled, setChatbotEnabled] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [selfRegisterEnabled, setSelfRegisterEnabled] = useState(false);

    const excelInputRef = useRef<HTMLInputElement>(null);
    const importBackupRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (allData?.settings) {
            setLocalStateName(allData.settings.stateName || 'ANZOÁTEGUI');
            if (allData.settings.personnelCriteria) setLocalCriteria(allData.settings.personnelCriteria);
            
            // Sincronización robusta de estados booleanos
            setChatbotEnabled(allData.settings.chatbotEnabled !== false);
            setAiEnabled(allData.settings.aiEnabled !== false);
            setSelfRegisterEnabled(allData.settings.allowPlantelSelfRegistration === true);
        }
    }, [allData]);

    const handleChatbotToggle = (enabled: boolean) => {
        setChatbotEnabled(enabled);
        onChatbotChange?.(enabled);
    };

    const handleAiToggle = (enabled: boolean) => {
        setAiEnabled(enabled);
        onAiEnabledChange?.(enabled);
    };

    const handleSelfRegisterToggle = (enabled: boolean) => {
        setSelfRegisterEnabled(enabled);
        onSelfRegisterChange?.(enabled);
    };

    const normalize = (val: any) => String(val || '').trim().toUpperCase();
    
    const cleanValue = (val: any): string => {
        if (!val) return '';
        const str = String(val).trim().toUpperCase();
        if (str === '0' || str === 'NULL' || str === 'N/A' || str === '#N/A') return '';
        return str;
    };

    const downloadTemplate = () => {
        const template = [
            {
                "ESTADO": "ANZOATEGUI", 
                "MUNICIPIO": "SIMON BOLIVAR", 
                "PARROQUIA": "EL CARMEN", 
                "CODIGO DEPENDENCIA": "Nacional", 
                "CODIGO ESTADISTICO": "123456", 
                "CODIGO DEL PLANTEL": "OD12345678", 
                "NOMBRE DEL PLANTEL EN NOMINA": "U.E.N. EJEMPLO", 
                "NIVELES": "PRIMARIA", 
                "MODALIDAD": "", 
                "UBICACIÓN GEOGRAFICA": "DIRECCION COMPLETA", 
                "TURNOS QUE ATIENDE EL PLANTEL": "MAÑANA", 
                "COD. CARGO": "0065", 
                "CLASIFICACION": "DOCENTE IV", 
                "TIPO DE PERSONAL": "DOCENTE", 
                "FUNCION": "DOCENTE", 
                "CEDULA": "V12345678", 
                "NOMBRE Y APELLIDO": "JUAN PEREZ", 
                "FECHA DE INGRESO": "2010-09-16", 
                "SEXO": "M", 
                "HORAS ACADEMICAS": 36, 
                "HORAS ADM": 0, 
                "TURNO QUE ATIENDE": "MAÑANA", 
                "GRADO QUE IMPARTE EL DOCENTE": "5TO GRADO", 
                "SECCIÓN": "A", 
                "ESPECIALIDAD QUE IMPARTE EL DOCENTE": "INTEGRAL", 
                "AÑO": "", 
                "SECCIONES": 1, 
                "MATERIA QUE IMPARTE O ESPECIALIDAD": "", 
                "PERIODO O GRUPO": "2024-2025", 
                "SITUACIÓN DEL TRABAJADOR": "ACTIVO", 
                "OBSERVACIÓN": ""
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PLANTILLA_RAC_BIDIRECCIONAL");
        XLSX.writeFile(wb, "SGI_Plantilla_Carga_Masiva_RAC.xlsx");
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                if (onBulkImport) {
                    for (const key in json) await onBulkImport(key, json[key]);
                }
                alert("SISTEMA RESTAURADO CON ÉXITO");
                window.location.reload();
            } catch (err) { alert("ERROR: ARCHIVO NO VÁLIDO"); }
        };
        reader.readAsText(file);
    };

    const handleForceBackup = async () => {
        if(!confirm("¿Desea generar una copia de seguridad inmediata de la base de datos?")) return;
        try {
            await fetch('/api/backup/now', { method: 'POST' });
            alert("Respaldo generado correctamente en el servidor.");
        } catch(e) {
            alert("Error al generar respaldo.");
        }
    };

    const handleExportUsersFull = async () => {
        try {
            // Solicitar datos completos (con passwords) al nuevo endpoint administrativo
            const response = await fetch('/api/admin/users-full');
            if (!response.ok) throw new Error("Error obteniendo datos de usuarios");
            
            const usersFull = await response.json();
            
            const data = usersFull.map((u: User) => ({ 
                "CEDULA": u.cedula, 
                "NOMBRE": u.nombreCompleto, 
                "ROL": u.role, 
                "CARGO": u.cargo, 
                "ESTATUS": u.isActive ? 'ACTIVO' : 'INACTIVO',
                "TELEFONO": u.telefono,
                "CORREO": u.email,
                "UBICACION": u.role === 'PLANTEL' ? (u.plantelesAsignados?.join(',') || '') : u.municipioAsignado || u.estadoAsignado || 'TODO',
                "CONTRASEÑA (ENCRIPTADA)": u.password || 'NO DEFINIDA'
            })); 
            
            const ws = XLSX.utils.json_to_sheet(data); 
            const wb = XLSX.utils.book_new(); 
            XLSX.utils.book_append_sheet(wb, ws, "USUARIOS_COMPLETO"); 
            XLSX.writeFile(wb, "SGI_Usuarios_Respaldo_Total.xlsx"); 
        } catch(err) {
            alert("Error al generar reporte de usuarios. Verifique conexión.");
        }
    };

    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows = XLSX.utils.sheet_to_json(ws) as any[];

                const plantelesMap = new Map<string, any>();
                if (allData && allData.planteles) {
                    allData.planteles.forEach((p: Plantel) => {
                        plantelesMap.set(p.codigoDea.toUpperCase(), { 
                            ...p, 
                            nivelesSet: new Set(p.niveles || []),
                            modalidadesSet: new Set(p.modalidades || []),
                            turnosSet: new Set(p.turnos || [])
                        });
                    });
                }

                const racList: RacRegistro[] = [];

                rows.forEach(row => {
                    const dea = cleanValue(row['CODIGO DEL PLANTEL']);
                    if (!dea) return;

                    if (!plantelesMap.has(dea)) {
                        const depRaw = cleanValue(row['CODIGO DEPENDENCIA'] || row['DEPENDENCIA']);
                        let depFinal: Dependencia = 'Nacional';
                        if (depRaw.includes('ESTAD')) depFinal = 'Estadal';
                        if (depRaw.includes('MUNIC')) depFinal = 'Municipal';
                        if (depRaw.includes('PRIV')) depFinal = 'Privado';
                        if (depRaw.includes('SUBV')) depFinal = 'Subvencionada';
                        if (depRaw.includes('AUTON')) depFinal = 'Autónoma';

                        plantelesMap.set(dea, {
                            id: crypto.randomUUID(),
                            codigoDea: dea,
                            nombre: cleanValue(row['NOMBRE DEL PLANTEL EN NOMINA']),
                            estado: cleanValue(row['ESTADO']) || localStateName,
                            municipio: cleanValue(row['MUNICIPIO']),
                            parroquia: cleanValue(row['PARROQUIA']),
                            codigoDependencia: cleanValue(row['CODIGO DEPENDENCIA']),
                            codigoEstadistico: cleanValue(row['CODIGO ESTADISTICO']),
                            direccion: cleanValue(row['UBICACIÓN GEOGRAFICA']),
                            dependencia: depFinal,
                            nivelesSet: new Set<string>(),
                            modalidadesSet: new Set<string>(),
                            turnosSet: new Set<string>(),
                            latitud: '0', longitud: '0',
                            fechaRegistro: new Date().toISOString().split('T')[0],
                            ciDirector: '', director: '', telefono: '', emailDirector: '',
                            espaciosFisicos: { oficinas: 0, pasillos: 0, salones: 0, depositos: 0, cocina: 0, patio: 0, plazoleta: 0, jardines: 0, cancha: 0, banos: 0, multiuso: 0, estacionamiento: 0, cbit: 0, anfiteatro: 0, biblioteca: 0 },
                            conectividad: { tieneInternet: false, conexion1: { proveedor: '', tipoConexion: '', status: '', fechaInstalacion: '' } }
                        });
                    } else {
                        const existing = plantelesMap.get(dea);
                        existing.nombre = cleanValue(row['NOMBRE DEL PLANTEL EN NOMINA']) || existing.nombre;
                        existing.municipio = cleanValue(row['MUNICIPIO']) || existing.municipio;
                        existing.parroquia = cleanValue(row['PARROQUIA']) || existing.parroquia;
                        existing.direccion = cleanValue(row['UBICACIÓN GEOGRAFICA']) || existing.direccion;
                        existing.codigoEstadistico = cleanValue(row['CODIGO ESTADISTICO']) || existing.codigoEstadistico;
                        existing.codigoDependencia = cleanValue(row['CODIGO DEPENDENCIA']) || existing.codigoDependencia;
                        const depRaw = cleanValue(row['CODIGO DEPENDENCIA']);
                        if (depRaw.includes('ESTAD')) existing.dependencia = 'Estadal';
                        else if (depRaw.includes('NACIONAL')) existing.dependencia = 'Nacional';
                    }

                    const p = plantelesMap.get(dea);
                    const nivelRow = cleanValue(row['NIVELES']);
                    if (nivelRow) p.nivelesSet.add(nivelRow);
                    const modRow = cleanValue(row['MODALIDAD']);
                    if (modRow) p.modalidadesSet.add(modRow);
                    const turnoRow = cleanValue(row['TURNOS QUE ATIENDE EL PLANTEL']);
                    if (turnoRow) p.turnosSet.add(turnoRow);

                    const cedula = cleanValue(row['CEDULA']);
                    
                    if (cedula && cedula.length > 4) {
                        racList.push({
                            id: crypto.randomUUID(),
                            plantelId: p.id,
                            fechaCarga: new Date().toISOString(),
                            cedula: cedula,
                            nombreApellido: cleanValue(row['NOMBRE Y APELLIDO']),
                            sex: cleanValue(row['SEXO']).startsWith('M') ? 'M' : 'F',
                            fechaIngreso: cleanValue(row['FECHA DE INGRESO']),
                            telefono: '', correo: '',
                            codCargo: cleanValue(row['COD. CARGO']),
                            clasificacion: cleanValue(row['CLASIFICACION']),
                            tipoPersonal: cleanValue(row['TIPO DE PERSONAL']) || 'DOCENTE',
                            funcion: cleanValue(row['FUNCION']) || 'DOCENTE',
                            numGoPc: '',
                            cargaHorariaRecibo: Number(row['HORAS ACADEMICAS'] || 0) + Number(row['HORAS ADM'] || 0),
                            horasAcademicas: Number(row['HORAS ACADEMICAS'] || 0),
                            horasAdm: Number(row['HORAS ADM'] || 0),
                            turno: (cleanValue(row['TURNOS QUE ATIENDE EL PLANTEL']) as Turno) || 'Mañana',
                            grado: cleanValue(row['GRADO QUE IMPARTE EL DOCENTE']),
                            seccion: cleanValue(row['SECCIÓN']),
                            especialidad: cleanValue(row['ESPECIALIDAD QUE IMPARTE EL DOCENTE']),
                            ano: cleanValue(row['AÑO']),
                            cantidadSecciones: Number(row['SECCIONES'] || 0),
                            materia: cleanValue(row['MATERIA QUE IMPARTE O ESPECIALIDAD']),
                            periodoGrupo: cleanValue(row['PERIODO O GRUPO']) || '2024-2025',
                            situacionTrabajador: cleanValue(row['SITUACIÓN DEL TRABAJADOR']) || 'ACTIVO',
                            observacion: cleanValue(row['OBSERVACIÓN'])
                        } as RacRegistro);
                    }
                });

                const plantelesFinales = Array.from(plantelesMap.values()).map(p => ({
                    ...p,
                    niveles: Array.from(p.nivelesSet),
                    modalidades: Array.from(p.modalidadesSet),
                    turnos: Array.from(p.turnosSet),
                    nivelesSet: undefined, modalidadesSet: undefined, turnosSet: undefined
                }));

                if (onBulkImport) {
                    await onBulkImport('master-load', { planteles: plantelesFinales, rac: racList });
                    alert(`CARGA MAESTRA COMPLETADA: ${plantelesFinales.length} Planteles, ${racList.length} Personas.`);
                    window.location.reload();
                }
            } catch (err) { 
                console.error(err);
                alert("ERROR CRÍTICO EN EXCEL."); 
            } 
            finally { setIsProcessing(false); }
        };
        reader.readAsBinaryString(file);
    };

    const inputStyle = "w-full rounded-xl border-2 border-slate-200 p-4 bg-white text-slate-800 font-black uppercase text-sm focus:border-[#003399] outline-none transition-all";
    const labelStyle = "block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1";

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-32 animate-in fade-in">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-8">
                <div className="flex gap-6 items-center">
                    <div className="p-5 bg-[#003399] rounded-[30px] text-white shadow-2xl shadow-blue-200"><Settings2 size={40} /></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none italic">Centro de Control Regional</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-[0.3em]">Nodo de Seguridad CDCE {localStateName} V9.8</p>
                    </div>
                </div>
                <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-[28px] gap-1 shadow-inner border border-slate-200">
                    {['general', 'red', 'criterios', 'carga_masiva', 'avanzado'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-[#003399] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'general' && (
                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <label className={labelStyle}>Entidad de Gestión Territorial</label>
                            <div className="flex gap-3">
                                <input className={inputStyle} value={localStateName} onChange={e => setLocalStateName(e.target.value.toUpperCase())} />
                                <button onClick={() => onStateNameChange?.(localStateName)} className="bg-[#003399] text-white p-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all"><Save size={20}/></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-100 flex items-center justify-between">
                                <div><p className="text-[9px] font-black text-yellow-800 uppercase">IA Estratégica (GEMA NUBE)</p><p className="text-[7px] font-bold text-yellow-600 uppercase">Requiere Internet</p></div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={aiEnabled} onChange={e => handleAiToggle(e.target.checked)} />
                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </label>
                            </div>
                            
                            <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 flex items-center justify-between">
                                <div><p className="text-[9px] font-black text-emerald-800 uppercase">Asistente Virtual (SGI BOT)</p><p className="text-[7px] font-bold text-emerald-600 uppercase">Ayuda Local 24/7</p></div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={chatbotEnabled} onChange={e => handleChatbotToggle(e.target.checked)} />
                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </label>
                            </div>

                            <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-between">
                                <div><p className="text-[9px] font-black text-blue-800 uppercase">Auto-Registro en Sistema</p><p className="text-[7px] font-bold text-blue-600 uppercase">Directores registran Planteles</p></div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={selfRegisterEnabled} onChange={e => handleSelfRegisterToggle(e.target.checked)} />
                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#003399] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </label>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 space-y-4">
                            <h4 className="font-black text-slate-800 uppercase text-xs">Identidad Visual (.PNG / .JPG)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => logoInputRef.current?.click()} className="aspect-video bg-white/50 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden backdrop-blur-sm hover:bg-white transition-colors relative group">
                                    {allData?.settings?.customLogo ? <img src={allData.settings.customLogo} className="h-full w-full object-contain p-2" /> : <div className="text-center"><ImageIcon size={24} className="mx-auto text-slate-300"/><p className="text-[8px] font-black text-slate-400 uppercase mt-1">Logo</p></div>}
                                    <input type="file" ref={logoInputRef} className="hidden" accept=".jpg, .jpeg, .png" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => onLogoChange?.(r.result as string); r.readAsDataURL(f); } }} />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-[9px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-1 rounded-lg">CAMBIAR</p></div>
                                </div>
                                <div onClick={() => bannerInputRef.current?.click()} className="aspect-video bg-white/50 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden backdrop-blur-sm hover:bg-white transition-colors relative group">
                                    {allData?.settings?.customBanner ? <img src={allData.settings.customBanner} className="h-full w-full object-cover" /> : <div className="text-center"><ImageIcon size={24} className="mx-auto text-slate-300"/><p className="text-[8px] font-black text-slate-400 uppercase mt-1">Banner</p></div>}
                                    <input type="file" ref={bannerInputRef} className="hidden" accept=".jpg, .jpeg, .png" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => onBannerChange?.(r.result as string); r.readAsDataURL(f); } }} />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-[9px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-1 rounded-lg">CAMBIAR</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-10 rounded-[50px] text-white relative overflow-hidden">
                        <Terminal className="absolute top-[-20px] right-[-20px] text-white/5" size={200}/>
                        <h4 className="font-black uppercase text-sm mb-6 border-b border-white/10 pb-4">Consola de Estado</h4>
                        <div className="space-y-4 font-mono text-[10px] text-emerald-400 uppercase">
                            <p className="flex justify-between"><span>Status:</span> <span className="text-white">ONLINE</span></p>
                            <p className="flex justify-between"><span>Registros:</span> <span className="text-white">27.826 ACTIVOS</span></p>
                            <p className="flex justify-between"><span>Versión:</span> <span className="text-white">10.0 ULTRA-STABLE</span></p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'red' && (
                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-4 bg-emerald-500 text-white rounded-3xl"><Wifi size={32}/></div>
                        <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Estado de la Red</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronización con el Servidor Central</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200">
                            <label className={labelStyle}>URL del Nodo Maestro</label>
                            <div className="bg-white p-4 rounded-xl border font-mono text-xs text-blue-600 truncate">{serverUrl}</div>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 flex flex-col justify-center items-center text-center">
                            <label className={labelStyle}>Latencia de Nodo</label>
                            <div className="text-4xl font-black text-emerald-600">24ms</div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Respuesta Óptima</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 flex flex-col justify-center items-center text-center">
                            <label className={labelStyle}>Estado de Conexión</label>
                            <div className={`px-6 py-2 rounded-full font-black text-white text-[10px] tracking-widest ${isOnline ? 'bg-emerald-50 animate-pulse' : 'bg-rose-500'}`}>{isOnline ? 'CONECTADO' : 'OFFLINE'}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'criterios' && (
                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-4 bg-indigo-600 text-white rounded-3xl"><Calculator size={32}/></div>
                        <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Criterios de Brecha</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuración de Ratios Ministeriales</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <div><label className={labelStyle}>Alumnos por Docente</label><input type="number" className={inputStyle} value={localCriteria.docentesPorAlumno as number} onChange={e => setLocalCriteria({...localCriteria, docentesPorAlumno: parseInt(e.target.value)})} /></div>
                            <div><label className={labelStyle}>Alumnos por Administrativo</label><input type="number" className={inputStyle} value={localCriteria.administrativosPorAlumno} onChange={e => setLocalCriteria({...localCriteria, administrativosPorAlumno: parseInt(e.target.value)})} /></div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={labelStyle}>Espacios por Aseador</label><input type="number" className={inputStyle} value={localCriteria.aseadoresPorEspacio} onChange={e => setLocalCriteria({...localCriteria, aseadoresPorEspacio: parseInt(e.target.value)})} /></div>
                            <div><label className={labelStyle}>Alumnos por Cocinero</label><input type="number" className={inputStyle} value={localCriteria.cocinerosPorAlumno} onChange={e => setLocalCriteria({...localCriteria, cocinerosPorAlumno: parseInt(e.target.value)})} /></div>
                        </div>
                        <div className="space-y-6">
                             <div><label className={labelStyle}>Espacios por Vigilante</label><input type="number" className={inputStyle} value={localCriteria.vigilantesPorEspacio} onChange={e => setLocalCriteria({...localCriteria, vigilantesPorEspacio: parseInt(e.target.value)})} /></div>
                             <button onClick={() => onCriteriaChange?.(localCriteria)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2"><Save size={18}/> Actualizar Ratios</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'carga_masiva' && (
                <div className="bg-white p-12 rounded-[50px] border border-slate-200 shadow-sm text-center">
                    <h3 className="font-black text-slate-800 uppercase text-lg mb-8 flex items-center justify-center gap-3"><FileSpreadsheet size={28} className="text-emerald-600"/> Motor GEMA 10.0 - Carga Maestra Bidireccional</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-10 max-w-2xl mx-auto italic">"Plantilla unificada de 31 columnas. Carga de Planteles y Personal simultáneamente (Sin Director/a). Soporta re-ingreso de reportes RAC exportados."</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={downloadTemplate} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-10 py-5 rounded-[25px] font-black uppercase text-xs border-2 border-slate-200 flex items-center justify-center gap-3 transition-all">
                            <Download size={20}/> Descargar Plantilla Oficial
                        </button>
                        <button onClick={() => excelInputRef.current?.click()} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-[25px] font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                            {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <Plus size={20}/>} 
                            {isProcessing ? 'PROCESANDO BASE DE DATOS...' : 'Cargar Nómina Completa (XLSX)'}
                        </button>
                        <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                    </div>
                </div>
            )}

            {activeTab === 'avanzado' && (
                <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm animate-in fade-in">
                    <h3 className="font-black text-slate-800 uppercase text-sm mb-10 flex items-center gap-3 border-b-4 border-yellow-400 w-fit pb-2"><Zap size={24} className="text-orange-500"/> Acciones Maestras de Búnker (8 Pilares)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div onClick={onRefreshData} className="p-8 bg-blue-50 rounded-[40px] border-2 border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <RefreshCw size={40} className="text-blue-600 group-hover:text-white mb-4 animate-spin-slow"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Sincronizar Nodo</p>
                        </div>
                        <div onClick={() => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData)); const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", "SGI_BACKUP.json"); dl.click(); }} className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-200 cursor-pointer hover:bg-slate-900 hover:text-white transition-all group flex flex-col items-center text-center">
                            <FileDown size={40} className="text-slate-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Exportar JSON</p>
                        </div>
                        
                        <div onClick={handleForceBackup} className="p-8 bg-orange-50 rounded-[40px] border-2 border-orange-100 cursor-pointer hover:bg-orange-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <Database size={40} className="text-orange-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Forzar Respaldo DB</p>
                        </div>

                        <div onClick={() => importBackupRef.current?.click()} className="p-8 bg-emerald-50 rounded-[40px] border-2 border-emerald-100 cursor-pointer hover:bg-emerald-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <FileUp size={40} className="text-emerald-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Importar JSON</p>
                            <input type="file" ref={importBackupRef} className="hidden" accept=".json" onChange={handleImportBackup} />
                        </div>
                        
                        {/* BOTÓN ACTUALIZADO PARA DESCARGAR USUARIOS CON CONTRASEÑA */}
                        <div onClick={handleExportUsersFull} className="p-8 bg-indigo-50 rounded-[40px] border-2 border-indigo-100 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <UserCheck size={40} className="text-indigo-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Descargar Usuarios (Full)</p>
                        </div>

                        <div onClick={() => { if(confirm('¿BORRAR ASISTENCIAS?')) onPurgeAsistencia?.(); }} className="p-8 bg-orange-50 rounded-[40px] border-2 border-orange-100 cursor-pointer hover:bg-orange-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <History size={40} className="text-orange-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Limpiar Asistencias</p>
                        </div>
                        <div onClick={() => { if(confirm("¿RESET TOTAL?")) onHardReset?.(); }} className="p-8 bg-rose-50 rounded-[40px] border-2 border-rose-100 cursor-pointer hover:bg-rose-600 hover:text-white transition-all group flex flex-col items-center text-center">
                            <Bomb size={40} className="text-rose-600 group-hover:text-white mb-4"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">Hard Reset</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MantenimientoManager;
