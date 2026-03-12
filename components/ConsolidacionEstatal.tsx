
import React, { useMemo } from 'react';
import { Plantel, MatriculaRegistro, RacRegistro, FedeRegistro, CnaeRegistro, User } from '../types';
import { MODALIDADES, NIVELES } from '../utils/constants';
import { 
    TrendingUp, Users, Building2, 
    GraduationCap, ChefHat, Brush, ShieldCheck, 
    Briefcase, Shield, Wifi, LayoutGrid, Layers, Award, Hammer, AlertTriangle, CheckCircle, Package, Activity
} from 'lucide-react';

interface ConsolidacionEstatalProps {
    planteles: Plantel[];
    matricula: MatriculaRegistro[];
    rac: RacRegistro[];
    fede?: FedeRegistro[];
    cnae?: CnaeRegistro[];
    currentUser: User;
    systemState: string;
}

const ConsolidacionEstatal: React.FC<ConsolidacionEstatalProps> = ({ planteles, matricula, rac, fede = [], cnae = [], currentUser, systemState }) => {
    
    // 1. FILTRADO ESTRICTO
    const filteredPlanteles = useMemo(() => {
        let list = planteles;
        if (currentUser.role === 'MUNICIPAL') {
            list = list.filter(p => p.municipio === currentUser.municipioAsignado);
        } else if (currentUser.role === 'PLANTEL') {
            const asignados = new Set(currentUser.plantelesAsignados || []);
            list = list.filter(p => asignados.has(p.codigoDea));
        } else if (currentUser.role === 'ADMINISTRADOR') {
            list = list.filter(p => p.estado === currentUser.estadoAsignado);
        }
        return list;
    }, [planteles, currentUser]);

    const stats = useMemo(() => {
        const schoolIds = new Set(filteredPlanteles.map(p => p.id));
        
        const byDep: Record<string, number> = {};
        const byNivel: Record<string, number> = {};
        const byModalidad: Record<string, number> = {};

        // Inicializar contadores oficiales
        NIVELES.forEach(n => byNivel[n.toUpperCase()] = 0);
        MODALIDADES.forEach(m => byModalidad[m.toUpperCase()] = 0);

        // A. Matrícula
        let matTotal = 0;
        let matFem = 0;
        let matMasc = 0;
        
        filteredPlanteles.forEach(p => {
            const dep = (p.dependencia || 'SIN DEFINIR').toUpperCase();
            byDep[dep] = (byDep[dep] || 0) + 1;

            const pNiveles = (p.niveles || []).map(n => n.toUpperCase());
            const pModalidades = (p.modalidades || []).map(m => m.toUpperCase());

            // 1. Conteo de Niveles Oficiales
            NIVELES.forEach(nConst => {
                const key = nConst.toUpperCase();
                if (pNiveles.includes(key)) {
                    byNivel[key]++;
                }
            });

            // 2. Conteo de Modalidades Oficiales (Búsqueda combinada para corrección de datos)
            MODALIDADES.forEach(mConst => {
                const key = mConst.toUpperCase();
                if (pModalidades.includes(key) || pNiveles.includes(key)) {
                    byModalidad[key]++;
                }
            });

            const pMat = matricula.filter(m => m.plantelId === p.id);
            const latestByNivel = new Map();
            pMat.forEach(m => {
                const ex = latestByNivel.get(m.nivel);
                if (!ex || new Date(m.fechaCarga) > new Date(ex.fechaCarga)) latestByNivel.set(m.nivel, m);
            });
            latestByNivel.forEach((m: MatriculaRegistro) => {
                matTotal += (m.inscriptosFemenino || 0) + (m.inscriptosMasculino || 0);
                matFem += (m.inscriptosFemenino || 0);
                matMasc += (m.inscriptosMasculino || 0);
            });
        });

        // B. Personal
        const cat = { doc: 0, adm: 0, ase: 0, coc: 0, vig: 0, total: 0 };
        const staffList = rac.filter(r => schoolIds.has(r.plantelId));
        
        staffList.forEach(r => {
            cat.total++;
            const func = (r.funcion || '').toUpperCase();
            const tipo = (r.tipoPersonal || '').toUpperCase();

            if (func.includes('DOCENTE') || tipo === 'DOCENTE') cat.doc++;
            else if (func.includes('ADMINISTRATIVO') || tipo === 'ADMINISTRATIVO') cat.adm++;
            else if (func.includes('COCINERO') || func.includes('ELABORADOR')) cat.coc++;
            else if (func.includes('VIGILANTE')) cat.vig++;
            else cat.ase++;
        });

        // C. Conectividad
        const internetCount = filteredPlanteles.filter(p => p.conectividad?.tieneInternet).length;

        // D. INFRAESTRUCTURA Y SERVICIOS (NUEVO)
        const infra = { bueno: 0, regular: 0, malo: 0, critico: 0, mesasSillasNec: 0 };
        const pae = { recibe: 0, noRecibe: 0 };

        fede.filter(f => schoolIds.has(f.plantelId)).forEach(f => {
            if (f.estadoGeneral === 'BUENO') infra.bueno++;
            else if (f.estadoGeneral === 'REGULAR') infra.regular++;
            else if (f.estadoGeneral === 'MALO') infra.malo++;
            else infra.critico++;
            
            infra.mesasSillasNec += (f.necMesasillas || 0) + (f.necPupitres || 0);
        });

        cnae.filter(c => schoolIds.has(c.plantelId)).forEach(c => {
            if (c.recibioPae) pae.recibe++; else pae.noRecibe++;
        });

        return { 
            cat, matTotal, matFem, matMasc, 
            plantelesTotal: filteredPlanteles.length, 
            internetCount,
            byDep, byNivel, byModalidad,
            infra, pae
        };
    }, [filteredPlanteles, matricula, rac, fede, cnae]);

    const StatItem = ({ label, value, icon: Icon, color }: any) => (
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}><Icon size={20} /></div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <span className="text-xl font-black text-slate-800">{value.toLocaleString()}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in pb-24">
            <div className="bg-slate-900 rounded-[55px] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-white">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 transition-transform duration-1000"><TrendingUp size={220} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">En Tiempo Real</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">Monitor <span className="text-yellow-400">Jurisdiccional</span></h2>
                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em] mt-4 flex items-center gap-2">
                            <Building2 size={16} className="text-blue-500"/> 
                            {currentUser.role === 'MUNICIPAL' ? currentUser.municipioAsignado : systemState}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[35px] border border-white/10 text-center min-w-[140px]">
                            <p className="text-[9px] font-black text-blue-300 uppercase mb-1 tracking-widest">Planteles</p>
                            <p className="text-4xl font-black">{stats.plantelesTotal}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[35px] border border-white/10 text-center min-w-[140px]">
                            <p className="text-[9px] font-black text-emerald-300 uppercase mb-1 tracking-widest">Internet</p>
                            <p className="text-4xl font-black flex items-center justify-center gap-2"><Wifi size={24}/> {stats.internetCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[45px] shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-800 uppercase text-sm mb-8 border-b pb-4 flex items-center gap-3"><Users size={24} className="text-[#003399]"/> Resumen Estudiantil Consolidado</h3>
                    <div className="flex flex-col items-center justify-center p-14 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 relative overflow-hidden mb-6">
                         <div className="text-center z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Matrícula General Activa</p>
                            <h4 className="text-8xl font-black text-slate-900 tracking-tighter">{stats.matTotal.toLocaleString()}</h4>
                            <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase bg-white px-4 py-1 rounded-full w-fit mx-auto border shadow-sm">Estudiantes Registrados en Sistema</p>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-pink-50 p-4 rounded-3xl border border-pink-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-pink-700 uppercase">Femenino</span>
                            <span className="text-xl font-black text-pink-900">{stats.matFem.toLocaleString()}</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-blue-700 uppercase">Masculino</span>
                            <span className="text-xl font-black text-blue-900">{stats.matMasc.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-800 uppercase text-sm mb-8 border-b pb-4"><Briefcase size={24} className="text-emerald-600 inline mr-2"/> Audit: Función Real</h3>
                    <div className="space-y-4">
                        <StatItem label="Docentes Aula" value={stats.cat.doc} icon={GraduationCap} color="bg-blue-600" />
                        <StatItem label="Administrativo" value={stats.cat.adm} icon={ShieldCheck} color="bg-indigo-600" />
                        <StatItem label="Aseador/Manten." value={stats.cat.ase} icon={Brush} color="bg-orange-500" />
                        <StatItem label="Cocinero Escolar" value={stats.cat.coc} icon={ChefHat} color="bg-rose-500" />
                        <StatItem label="Vigilancia" value={stats.cat.vig} icon={Shield} color="bg-slate-700" />
                    </div>
                </div>
            </div>

            {/* SECCION NUEVA: SEMÁFORO DE INFRAESTRUCTURA Y SERVICIOS */}
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 uppercase text-sm mb-10 border-b pb-4 flex items-center gap-3">
                    <Activity size={24} className="text-rose-600"/> Semáforo de Infraestructura y Servicios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    
                    {/* INFRAESTRUCTURA ESTADO */}
                    <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-200 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 text-slate-600 font-black uppercase text-[10px] tracking-widest"><Hammer size={16}/> Condición Física</div>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center text-xs font-black uppercase"><span className="text-emerald-600">Bueno</span> <span>{stats.infra.bueno}</span></div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${(stats.infra.bueno / (stats.plantelesTotal || 1)) * 100}%`}}></div></div>
                            
                            <div className="flex justify-between items-center text-xs font-black uppercase"><span className="text-yellow-600">Regular</span> <span>{stats.infra.regular}</span></div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{width: `${(stats.infra.regular / (stats.plantelesTotal || 1)) * 100}%`}}></div></div>

                            <div className="flex justify-between items-center text-xs font-black uppercase"><span className="text-rose-600">Crítico/Malo</span> <span>{stats.infra.malo + stats.infra.critico}</span></div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500" style={{width: `${((stats.infra.malo + stats.infra.critico) / (stats.plantelesTotal || 1)) * 100}%`}}></div></div>
                        </div>
                    </div>

                    {/* ALIMENTACION PAE */}
                    <div className="bg-orange-50/50 p-6 rounded-[35px] border border-orange-100">
                        <div className="flex items-center gap-3 mb-6 text-orange-800 font-black uppercase text-[10px] tracking-widest"><ChefHat size={16}/> Programa Alimentario</div>
                        <div className="flex flex-col items-center justify-center h-32">
                            <div className="text-4xl font-black text-orange-600 mb-1">
                                {stats.pae.recibe + stats.pae.noRecibe > 0 ? Math.round((stats.pae.recibe / (stats.pae.recibe + stats.pae.noRecibe)) * 100) : 0}%
                            </div>
                            <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Cobertura Efectiva</p>
                        </div>
                    </div>

                    {/* DEFICIT MOBILIARIO */}
                    <div className="bg-blue-50/50 p-6 rounded-[35px] border border-blue-100">
                        <div className="flex items-center gap-3 mb-6 text-blue-800 font-black uppercase text-[10px] tracking-widest"><Package size={16}/> Déficit Mobiliario</div>
                        <div className="flex flex-col items-center justify-center h-32">
                            <div className="text-4xl font-black text-blue-600 mb-1">{stats.infra.mesasSillasNec.toLocaleString()}</div>
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Mesas/Sillas Requeridas</p>
                        </div>
                    </div>

                    {/* ALERTA CRITICA */}
                    <div className="bg-rose-600 p-6 rounded-[35px] text-white flex flex-col justify-center items-center text-center shadow-lg shadow-rose-200">
                        <AlertTriangle size={32} className="mb-4 animate-bounce"/>
                        <span className="text-3xl font-black">{stats.infra.critico}</span>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-80">Planteles en Estado Crítico</p>
                    </div>

                </div>
            </div>

            {/* DESGLOSE ESTRATEGICO DETALLADO */}
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 uppercase text-sm mb-10 border-b pb-4 flex items-center gap-3">
                    <LayoutGrid size={24} className="text-indigo-600"/> Desglose Estratégico de Planteles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* POR DEPENDENCIA */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Award size={14}/> Por Dependencia</h4>
                        {Object.entries(stats.byDep).map(([key, val]: [string, number]) => (
                            <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 transition-colors">
                                <span className="text-[9px] font-black text-slate-700 uppercase">{key}</span>
                                <span className="bg-white px-3 py-1 rounded-lg text-[9px] font-black shadow-sm text-indigo-700">{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* POR NIVEL */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Layers size={14}/> Por Niveles</h4>
                        {Object.entries(stats.byNivel).map(([key, val]: [string, number]) => (
                            val > 0 && <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 transition-colors">
                                <span className="text-[9px] font-black text-slate-700 uppercase truncate max-w-[150px]">{key}</span>
                                <span className="bg-white px-3 py-1 rounded-lg text-[9px] font-black shadow-sm text-emerald-700">{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* POR MODALIDAD */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Briefcase size={14}/> Por Modalidad</h4>
                        {Object.entries(stats.byModalidad).map(([key, val]: [string, number]) => (
                            val > 0 && <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-orange-50 transition-colors">
                                <span className="text-[9px] font-black text-slate-700 uppercase truncate max-w-[150px]">{key}</span>
                                <span className="bg-white px-3 py-1 rounded-lg text-[9px] font-black shadow-sm text-orange-700">{val}</span>
                            </div>
                        ))}
                        {Object.values(stats.byModalidad).every(v => v === 0) && (
                            <p className="text-[9px] font-bold text-slate-300 uppercase italic">Sin modalidades específicas registradas.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidacionEstatal;
