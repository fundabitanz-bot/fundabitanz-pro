
import React, { useMemo } from 'react';
import { Plantel, MatriculaRegistro, PersonalRegistro, RacRegistro, User } from '../types';
import { DEPENDENCIAS, NIVELES, MODALIDADES } from '../utils/constants';
import DashboardAIInsights from './DashboardAIInsights';
import { 
    Building2, Users, GraduationCap, 
    ShieldCheck, UserCog, ChefHat, Brush, Shield, School, 
    TrendingUp, BarChart3, MapPin, Layers, Briefcase, Wifi, Activity, FileText,
    BookOpen
} from 'lucide-react';

interface AvancesManagerProps {
  planteles: Plantel[];
  matricula: MatriculaRegistro[];
  personal: PersonalRegistro[];
  rac: RacRegistro[]; 
  currentUser: User;
  systemState: string;
  aiEnabled?: boolean;
}

const AvancesManager: React.FC<AvancesManagerProps> = ({ planteles, matricula, rac, currentUser, systemState, aiEnabled }) => {
  
  // 1. FILTRADO ESTRICTO POR ROL (SEGURIDAD DE DATOS)
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

  const plantelIds = useMemo(() => new Set(filteredPlanteles.map(p => p.id)), [filteredPlanteles]);

  // 2. PROCESAMIENTO DE DATOS MULTIDIMENSIONAL ESTRICTO
  const stats = useMemo(() => {
    const data = {
        planteles: {
            total: filteredPlanteles.length,
            byDep: {} as Record<string, number>,
            byNivel: {} as Record<string, number>,
            byMod: {} as Record<string, number>,
            byMun: {} as Record<string, number>,
            withInternet: {} as Record<string, number>
        },
        matricula: {
            total: 0,
            fem: 0,
            masc: 0,
            byDep: {} as Record<string, number>,
            byNivel: {} as Record<string, number>,
            byMod: {} as Record<string, number>
        },
        personal: {
            total: 0,
            byCargo: { DOCENTE: 0, ADMINISTRATIVO: 0, OBRERO: 0, COCINERO: 0, VIGILANTE: 0 } as Record<string, number>,
            byDep: {} as Record<string, number>,
            byStatus: {} as Record<string, number>, 
            activeVsInactiveByDep: {} as Record<string, { active: number, inactive: number }>,
            activeVsInactiveByMod: {} as Record<string, { active: number, inactive: number }>,
            byNivelPlantel: {} as Record<string, number>,
            byModalidad: {} as Record<string, number>
        }
    };

    // Inicializadores ESTRICTOS (Solo claves oficiales)
    DEPENDENCIAS.forEach(d => { 
        data.planteles.byDep[d.toUpperCase()] = 0; 
        data.matricula.byDep[d.toUpperCase()] = 0; 
        data.personal.byDep[d.toUpperCase()] = 0;
        data.personal.activeVsInactiveByDep[d.toUpperCase()] = { active: 0, inactive: 0 };
    });
    
    // Solo Niveles Oficiales
    NIVELES.forEach(n => { 
        data.planteles.byNivel[n.toUpperCase()] = 0; 
        data.matricula.byNivel[n.toUpperCase()] = 0; 
        data.personal.byNivelPlantel[n.toUpperCase()] = 0;
    });
    
    // Solo Modalidades Oficiales
    MODALIDADES.forEach(m => { 
        data.planteles.byMod[m.toUpperCase()] = 0; 
        data.matricula.byMod[m.toUpperCase()] = 0; 
        data.personal.byModalidad[m.toUpperCase()] = 0;
        data.personal.activeVsInactiveByMod[m.toUpperCase()] = { active: 0, inactive: 0 };
    });

    // Mapa auxiliar para asociar personal a las categorías detectadas del plantel
    const plantelCategories = new Map<string, { niveles: string[], modalidades: string[], dep: string }>();

    // A. PROCESAMIENTO DE PLANTELES (SINCERACIÓN DE CANTIDADES)
    filteredPlanteles.forEach(p => {
        const dep = (p.dependencia || 'NACIONAL').toUpperCase();
        const mun = (p.municipio || 'SIN ASIGNAR').toUpperCase();
        
        // Normalización de entradas del plantel
        const pNiveles = (p.niveles || []).map(n => n.toUpperCase());
        const pModalidades = (p.modalidades || []).map(m => m.toUpperCase());
        
        // Detectar categorías válidas presentes en el plantel
        const detectedNiveles: string[] = [];
        const detectedModalidades: string[] = [];

        // 1. Clasificación Estricta de Niveles
        NIVELES.forEach(nConst => {
            const key = nConst.toUpperCase();
            // Solo si está en niveles y NO es una modalidad camuflada (aunque NIVELES const ya filtra eso por definición)
            if (pNiveles.includes(key)) {
                data.planteles.byNivel[key]++;
                detectedNiveles.push(key);
            }
        });

        // 2. Clasificación Estricta de Modalidades (Búsqueda en ambos campos para corregir errores de carga)
        MODALIDADES.forEach(mConst => {
            const key = mConst.toUpperCase();
            // Si aparece en modalidades O aparece en niveles (corrección de error de usuario)
            if (pModalidades.includes(key) || pNiveles.includes(key)) {
                data.planteles.byMod[key]++;
                detectedModalidades.push(key);
            }
        });

        plantelCategories.set(p.id, { niveles: detectedNiveles, modalidades: detectedModalidades, dep });

        // Conteo Dependencia
        data.planteles.byDep[dep] = (data.planteles.byDep[dep] || 0) + 1;
        
        // Conteo Municipio
        data.planteles.byMun[mun] = (data.planteles.byMun[mun] || 0) + 1;

        // Conteo Internet
        if (p.conectividad?.tieneInternet) {
            data.planteles.withInternet[mun] = (data.planteles.withInternet[mun] || 0) + 1;
        }

        // B. PROCESAMIENTO DE MATRÍCULA
        const pMat = matricula.filter(m => m.plantelId === p.id);
        const latestMatByNivel = new Map<string, MatriculaRegistro>();
        pMat.forEach(m => {
            // Normalizar nivel de la matrícula
            const matNivelUpper = m.nivel.toUpperCase();
            const ex = latestMatByNivel.get(matNivelUpper);
            if (!ex || new Date(m.fechaCarga) > new Date(ex.fechaCarga)) latestMatByNivel.set(matNivelUpper, m);
        });

        latestMatByNivel.forEach((m, matNivelKey) => {
            const total = (m.inscriptosFemenino || 0) + (m.inscriptosMasculino || 0);
            
            data.matricula.total += total;
            data.matricula.fem += (m.inscriptosFemenino || 0);
            data.matricula.masc += (m.inscriptosMasculino || 0);
            data.matricula.byDep[dep] = (data.matricula.byDep[dep] || 0) + total;

            // Asignar matrícula a Nivel o Modalidad según corresponda estrictamente
            let assigned = false;
            
            // Chequear si es Nivel Oficial
            const nivelMatch = NIVELES.find(n => n.toUpperCase() === matNivelKey);
            if (nivelMatch) {
                data.matricula.byNivel[nivelMatch.toUpperCase()] += total;
                assigned = true;
            }

            // Chequear si es Modalidad Oficial
            const modMatch = MODALIDADES.find(mo => mo.toUpperCase() === matNivelKey);
            if (modMatch) {
                data.matricula.byMod[modMatch.toUpperCase()] += total;
                assigned = true;
            }
        });
    });

    // C. PROCESAMIENTO DE PERSONAL (DISTRIBUCIÓN PROPORCIONAL A CATEGORÍAS DEL PLANTEL)
    rac.filter(r => plantelIds.has(r.plantelId)).forEach(r => {
        data.personal.total++;
        
        // Cargo
        const funcion = (r.funcion || '').toUpperCase();
        const tipo = (r.tipoPersonal || '').toUpperCase();
        if (funcion.includes('DOCENTE') || tipo === 'DOCENTE') data.personal.byCargo.DOCENTE++;
        else if (funcion.includes('ADMINISTRATIVO') || tipo === 'ADMINISTRATIVO') data.personal.byCargo.ADMINISTRATIVO++;
        else if (funcion.includes('COCINERO') || funcion.includes('ELABORADOR')) data.personal.byCargo.COCINERO++;
        else if (funcion.includes('VIGILANTE') || funcion.includes('SEGURIDAD')) data.personal.byCargo.VIGILANTE++;
        else data.personal.byCargo.OBRERO++;

        const pCats = plantelCategories.get(r.plantelId);
        if (pCats) {
            data.personal.byDep[pCats.dep] = (data.personal.byDep[pCats.dep] || 0) + 1;
            
            const status = (r.situacionTrabajador || 'NO INDICADO').toUpperCase();
            data.personal.byStatus[status] = (data.personal.byStatus[status] || 0) + 1;
            const isActive = status === 'ACTIVO';

            // Operatividad Dep
            if (data.personal.activeVsInactiveByDep[pCats.dep]) {
                if (isActive) data.personal.activeVsInactiveByDep[pCats.dep].active++;
                else data.personal.activeVsInactiveByDep[pCats.dep].inactive++;
            }

            // Asignar personal a Niveles (Si el plantel tiene el nivel, sumamos)
            // Nota: Si un plantel tiene varios niveles, el personal cuenta en todos (aproximación visual de capacidad instalada)
            pCats.niveles.forEach(n => {
                if (data.personal.byNivelPlantel[n] !== undefined) data.personal.byNivelPlantel[n]++;
            });

            // Asignar personal a Modalidades
            pCats.modalidades.forEach(m => {
                if (data.personal.byModalidad[m] !== undefined) {
                    data.personal.byModalidad[m]++;
                    if (isActive) data.personal.activeVsInactiveByMod[m].active++;
                    else data.personal.activeVsInactiveByMod[m].inactive++;
                }
            });
        }
    });

    return data;
  }, [filteredPlanteles, matricula, rac, plantelIds]);

  const aiContextString = useMemo(() => {
      return `REPORTE SGI:
      Total Planteles: ${stats.planteles.total}.
      Total Matrícula: ${stats.matricula.total}.
      Total Personal: ${stats.personal.total}.
      Ratio Global: ${(stats.matricula.total / (stats.personal.byCargo.DOCENTE || 1)).toFixed(1)} alumnos/docente.`;
  }, [stats]);

  const PercentBar = ({ val, total, color }: { val: number, total: number, color: string }) => (
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: total > 0 ? `${(val/total)*100}%` : '0%' }}></div>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-32">
        
        {aiEnabled && <DashboardAIInsights systemContext={aiContextString} />}

        {/* HEADER DE TOTALES */}
        <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-200">
            <div className="flex flex-col xl:flex-row items-center gap-10">
                <div className="bg-[#003399] p-10 rounded-[40px] text-white shadow-2xl flex flex-col items-center justify-center min-w-[220px] border-4 border-white/20">
                    <School size={60} className="mb-3"/>
                    <span className="text-6xl font-black">{stats.planteles.total}</span>
                    <p className="text-sm font-black uppercase tracking-widest opacity-80 mt-2">Planteles Registrados</p>
                </div>
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-200 flex flex-col justify-center gap-3">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg"><Users size={28}/></div>
                            <div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Matrícula Estudiantil</p>
                                <h3 className="text-4xl font-black text-emerald-700">{stats.matricula.total.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-4 bg-white rounded-xl py-3 border border-slate-100 shadow-sm">
                            <span className="text-xs font-black text-pink-600 uppercase">Fem: {stats.matricula.fem.toLocaleString()}</span>
                            <span className="text-xs font-black text-blue-600 uppercase">Masc: {stats.matricula.masc.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-200 flex items-center gap-6">
                        <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-lg"><Briefcase size={32}/></div>
                        <div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fuerza Laboral Total</p>
                            <h3 className="text-4xl font-black text-indigo-700">{stats.personal.total.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* MONITOR DE CARGA MUNICIPAL */}
        {currentUser.role !== 'PLANTEL' && (
            <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest"><TrendingUp className="text-orange-500"/> Monitor de Carga y Conectividad Territorial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.planteles.byMun).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([mun, count]) => {
                        const internetCount = stats.planteles.withInternet[mun] || 0;
                        return (
                            <div key={mun} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl"><MapPin size={20}/></div>
                                        <span className="text-sm font-black text-slate-700 uppercase truncate">{mun}</span>
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 bg-white px-4 py-1 rounded-xl shadow-sm border border-slate-100">{count}</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 pt-2 border-t border-slate-200">
                                    <Wifi size={18} className={internetCount > 0 ? "text-emerald-500" : "text-slate-300"}/>
                                    <span className="text-xs font-black text-slate-500 uppercase">{internetCount} con Internet</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* DESGLOSE PLANTELES, MATRÍCULA Y PERSONAL */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* CARD PLANTELES */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest"><Building2 className="text-[#003399]"/> Distribución de Planteles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-[30px] md:col-span-2">
                        <p className="text-sm font-black text-slate-500 uppercase mb-4 ml-2">Por Dependencia</p>
                        <div className="space-y-3">
                            {Object.entries(stats.planteles.byDep).map(([key, val]: [string, number]) => (
                                val > 0 && <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24">{key}</span> <PercentBar val={val} total={stats.planteles.total} color="bg-[#003399]" /> <span className="ml-3 font-black text-slate-900 w-8 text-right">{val}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[30px]">
                        <p className="text-sm font-black text-slate-500 uppercase mb-4 ml-2">Por Nivel Educativo</p>
                        <div className="space-y-3">
                            {Object.entries(stats.planteles.byNivel).map(([key, val]: [string, number]) => (
                                <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.planteles.total} color="bg-indigo-500" /> <span className="ml-3 font-black text-slate-900 w-8 text-right">{val}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[30px]">
                        <p className="text-sm font-black text-slate-500 uppercase mb-4 ml-2">Por Modalidad</p>
                        <div className="space-y-3">
                            {Object.entries(stats.planteles.byMod).map(([key, val]: [string, number]) => (
                                <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.planteles.total} color="bg-cyan-600" /> <span className="ml-3 font-black text-slate-900 w-8 text-right">{val}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD MATRÍCULA */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest"><GraduationCap className="text-emerald-600"/> Distribución de Matrícula</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-emerald-50/50 rounded-[30px] border border-emerald-100 md:col-span-2">
                        <p className="text-sm font-black text-emerald-800 uppercase mb-4 ml-2">Por Dependencia</p>
                        <div className="space-y-3">
                            {Object.entries(stats.matricula.byDep).map(([key, val]: [string, number]) => (
                                val > 0 && <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24">{key}</span> <PercentBar val={val} total={stats.matricula.total} color="bg-emerald-500" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-emerald-50/50 rounded-[30px] border border-emerald-100">
                        <p className="text-sm font-black text-emerald-800 uppercase mb-4 ml-2">Por Nivel Educativo</p>
                        <div className="space-y-3">
                            {Object.entries(stats.matricula.byNivel).map(([key, val]: [string, number]) => (
                                <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.matricula.total} color="bg-emerald-600" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-emerald-50/50 rounded-[30px] border border-emerald-100">
                        <p className="text-sm font-black text-emerald-800 uppercase mb-4 ml-2">Por Modalidad</p>
                        <div className="space-y-3">
                            {Object.entries(stats.matricula.byMod).map(([key, val]: [string, number]) => (
                                <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.matricula.total} color="bg-teal-600" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD PERSONAL: ESTRUCTURA */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-200 xl:col-span-2">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest"><UserCog className="text-indigo-600"/> Estructura de Fuerza Laboral</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-indigo-50/50 rounded-[30px] border border-indigo-100">
                        <p className="text-sm font-black text-indigo-800 uppercase mb-4 ml-2">Por Dependencia Administrativa</p>
                        <div className="space-y-3">
                            {Object.entries(stats.personal.byDep).map(([key, val]: [string, number]) => (
                                val > 0 && <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24">{key}</span> <PercentBar val={val} total={stats.personal.total} color="bg-indigo-600" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-indigo-50/50 rounded-[30px] border border-indigo-100">
                        <p className="text-sm font-black text-indigo-800 uppercase mb-4 ml-2">Por Categoría / Función</p>
                        <div className="space-y-3">
                            {Object.entries(stats.personal.byCargo).map(([key, val]: [string, number]) => (
                                val > 0 && <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.personal.total} color="bg-purple-600" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-indigo-50/50 rounded-[30px] border border-indigo-100">
                        <p className="text-sm font-black text-indigo-800 uppercase mb-4 ml-2">Por Modalidad</p>
                        <div className="space-y-3">
                            {Object.entries(stats.personal.byModalidad).map(([key, val]: [string, number]) => (
                                <div key={key} className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-slate-600 w-24 truncate">{key}</span> <PercentBar val={val} total={stats.personal.total} color="bg-violet-600" /> <span className="ml-3 font-black text-slate-900 w-12 text-right">{val.toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* NUEVA SECCIÓN: CARACTERIZACIÓN DE CONDICIONES LABORALES */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-200 xl:col-span-2">
                <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest">
                    <Activity className="text-rose-600"/> Caracterización de Condiciones Laborales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* ESTATUS GLOBAL */}
                    <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><FileText size={14}/> Estatus General (Top 5)</h4>
                        <div className="space-y-4">
                            {Object.entries(stats.personal.byStatus)
                                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([status, count]: [string, number]) => (
                                    <div key={status} className="relative">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1 z-10 relative">
                                            <span className="text-slate-700">{status}</span>
                                            <span className="text-slate-900 bg-white px-2 rounded-md shadow-sm border border-slate-100">{count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className={`h-full ${status === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'} transition-all duration-1000`} style={{ width: `${(count / stats.personal.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* ACTIVOS VS INACTIVOS POR DEPENDENCIA */}
                    <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Briefcase size={14}/> Operatividad por Dependencia</h4>
                        <div className="space-y-3">
                            {Object.entries(stats.personal.activeVsInactiveByDep).map(([dep, counts]: [string, { active: number, inactive: number }]) => (
                                counts.active + counts.inactive > 0 && (
                                    <div key={dep} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{dep}</p>
                                        <div className="flex h-4 w-full rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${(counts.active / (counts.active + counts.inactive)) * 100}%` }}>
                                                {counts.active}
                                            </div>
                                            <div className="bg-rose-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${(counts.inactive / (counts.active + counts.inactive)) * 100}%` }}>
                                                {counts.inactive > 0 ? counts.inactive : ''}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[8px] font-black uppercase">
                                            <span className="text-emerald-600">Activos</span>
                                            <span className="text-rose-600">Inactivos / Reposo</span>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* ACTIVOS VS INACTIVOS POR MODALIDAD (NUEVO REQUERIMIENTO) */}
                    <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={14}/> Operatividad por Modalidad</h4>
                        <div className="space-y-3">
                            {Object.entries(stats.personal.activeVsInactiveByMod).map(([mod, counts]: [string, { active: number, inactive: number }]) => (
                                counts.active + counts.inactive > 0 && (
                                    <div key={mod} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{mod}</p>
                                        <div className="flex h-4 w-full rounded-full overflow-hidden">
                                            <div className="bg-cyan-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${(counts.active / (counts.active + counts.inactive)) * 100}%` }}>
                                                {counts.active}
                                            </div>
                                            <div className="bg-slate-400 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${(counts.inactive / (counts.active + counts.inactive)) * 100}%` }}>
                                                {counts.inactive > 0 ? counts.inactive : ''}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[8px] font-black uppercase">
                                            <span className="text-cyan-600">Activos</span>
                                            <span className="text-slate-500">Inactivos</span>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* POR NIVELES (APROXIMACIÓN) */}
                    <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={14}/> Distribución por Nivel</h4>
                        <div className="space-y-4">
                            {Object.entries(stats.personal.byNivelPlantel)
                                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                                .map(([nivel, count]: [string, number]) => (
                                    count > 0 && (
                                        <div key={nivel} className="flex justify-between items-center group hover:bg-white p-2 rounded-xl transition-all">
                                            <span className="text-[9px] font-black text-slate-600 uppercase truncate max-w-[120px]">{nivel}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${(count / stats.personal.total) * 100}%` }}></div>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-900 w-8 text-right">{count}</span>
                                            </div>
                                        </div>
                                    )
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* RESUMEN DE PERSONAL (MONITOS) */}
        <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 border-b pb-4 uppercase text-xl tracking-widest"><UserCog className="text-purple-600"/> Resumen Global de Cargos</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { l: 'Docentes', v: stats.personal.byCargo.DOCENTE, i: <GraduationCap/>, c: 'bg-blue-600' },
                    { l: 'Admin', v: stats.personal.byCargo.ADMINISTRATIVO, i: <ShieldCheck/>, c: 'bg-indigo-600' },
                    { l: 'Obreros', v: stats.personal.byCargo.OBRERO, i: <Brush/>, c: 'bg-orange-500' },
                    { l: 'Cocineros', v: stats.personal.byCargo.COCINERO, i: <ChefHat/>, c: 'bg-rose-500' },
                    { l: 'Vigilantes', v: stats.personal.byCargo.VIGILANTE, i: <Shield/>, c: 'bg-slate-700' },
                ].map(item => (
                    <div key={item.l} className="p-6 bg-slate-50 rounded-[35px] border border-slate-200 flex flex-col items-center justify-center gap-3 text-center group hover:-translate-y-1 transition-transform">
                        <div className={`p-4 rounded-2xl text-white shadow-lg mb-1 ${item.c}`}>{item.i}</div>
                        <span className="text-4xl font-black text-slate-800">{item.v.toLocaleString()}</span>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.l}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default AvancesManager;
