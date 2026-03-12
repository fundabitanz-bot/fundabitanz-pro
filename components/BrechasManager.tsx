import React, { useState, useMemo } from 'react';
import { Plantel, MatriculaRegistro, RacRegistro, PersonnelCriteria, User } from '../types';
import { UserSearch, AlertTriangle, CheckCircle2, ShieldAlert, MapPin, Calculator } from 'lucide-react';
import { GEOGRAFIA_VENEZUELA } from '../utils/constants';

interface BrechasManagerProps {
  planteles: Plantel[];
  matricula: MatriculaRegistro[];
  rac: RacRegistro[];
  criteria?: PersonnelCriteria;
  currentUser: User;
}

const BrechasManager: React.FC<BrechasManagerProps> = ({ planteles, matricula, rac, criteria, currentUser }) => {
  const [selectedEstado, setSelectedEstado] = useState<string>(
    currentUser.role === 'ADMINISTRADOR' ? currentUser.estadoAsignado || '' : ''
  );
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedPlantelId, setSelectedPlantelId] = useState<string>('');

  const activeCriteria = useMemo(() => criteria || {
    docentesPorAlumno: { "Primaria": 35, "Media General": 40, "Preescolar": 25, "Maternal": 15 },
    administrativosPorAlumno: 250,
    aseadoresPorEspacio: 8,
    cocinerosPorAlumno: 150,
    vigilantesPorEspacio: 6
  }, [criteria]);

  const estadosList = useMemo(() => Object.keys(GEOGRAFIA_VENEZUELA).sort(), []);
  
  const municipiosList = useMemo(() => {
    if (!selectedEstado) return [];
    return Object.keys(GEOGRAFIA_VENEZUELA[selectedEstado] || {}).sort();
  }, [selectedEstado]);

  const plantelesList = useMemo(() => {
    return planteles.filter(p => 
      (!selectedEstado || p.estado === selectedEstado) && 
      (!selectedMunicipio || p.municipio === selectedMunicipio)
    ).sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [planteles, selectedEstado, selectedMunicipio]);

  const analysis = useMemo(() => {
    const plantelesToAnalyze = planteles.filter(p => {
      const matchesEstado = !selectedEstado || p.estado === selectedEstado;
      const matchesMunicipio = !selectedMunicipio || p.municipio === selectedMunicipio;
      const matchesPlantel = !selectedPlantelId || p.id === selectedPlantelId;
      return matchesEstado && matchesMunicipio && matchesPlantel;
    });

    return plantelesToAnalyze.map(p => {
      const pMat = matricula.filter(m => m.plantelId === p.id);
      const latestMatByNivel = new Map<string, MatriculaRegistro>();
      pMat.forEach(m => {
        const ex = latestMatByNivel.get(m.nivel);
        if (!ex || new Date(m.fechaCarga) > new Date(ex.fechaCarga)) latestMatByNivel.set(m.nivel, m);
      });
      const matItems = Array.from(latestMatByNivel.values());
      const totalMatricula = matItems.reduce((a, b) => a + (Number(b.inscriptosFemenino) + Number(b.inscriptosMasculino)), 0);

      const pRac = rac.filter(r => r.plantelId === p.id);
      const latestRacDate = pRac.length > 0 ? [...pRac].sort((a,b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime())[0].fechaCarga : null;
      const currentStaff = pRac.filter(r => r.fechaCarga === latestRacDate);

      let docentesReq = 0;
      matItems.forEach(mi => {
        const dpa = activeCriteria.docentesPorAlumno;
        const ratio = typeof dpa === 'object' ? ((dpa as any)[mi.nivel] || 35) : (dpa || 35);
        docentesReq += Math.ceil((mi.inscriptosFemenino + mi.inscriptosMasculino) / ratio);
      });
      const docentesReal = currentStaff.filter(s => s.tipoPersonal === 'DOCENTE').length;

      const adminReq = Math.ceil(totalMatricula / activeCriteria.administrativosPorAlumno);
      const adminReal = currentStaff.filter(s => s.tipoPersonal === 'ADMINISTRATIVO').length;

      const totalEspacios: number = Object.values(p.espaciosFisicos || {}).reduce<number>((acc, val) => acc + (Number(val) || 0), 0);
      
      const aseadoresReq = Math.ceil(totalEspacios / (activeCriteria.aseadoresPorEspacio || 8));
      const aseadoresReal = currentStaff.filter(s => s.tipoPersonal === 'OBRERO' && (s.funcion || '').includes('ASEADOR')).length;

      const cocinerosReq = Math.ceil(totalMatricula / activeCriteria.cocinerosPorAlumno);
      const cocinerosReal = currentStaff.filter(s => (s.funcion || '').includes('COCINERO')).length;

      const vigilantesReq = Math.ceil(totalEspacios / (activeCriteria.vigilantesPorEspacio || 6));
      const vigilantesReal = currentStaff.filter(s => (s.funcion || '').includes('VIGILANTE')).length;

      return {
        plantel: p,
        totalMatricula,
        totalEspacios,
        stats: {
          docentes: { req: docentesReq, real: docentesReal, gap: docentesReal - docentesReq },
          admin: { req: adminReq, real: adminReal, gap: adminReal - adminReq },
          aseadores: { req: aseadoresReq, real: aseadoresReal, gap: aseadoresReal - aseadoresReq },
          cocineros: { req: cocinerosReq, real: cocinerosReal, gap: cocinerosReal - cocinerosReq },
          vigilantes: { req: vigilantesReq, real: vigilantesReal, gap: vigilantesReal - vigilantesReq }
        }
      };
    });
  }, [planteles, matricula, rac, activeCriteria, selectedEstado, selectedMunicipio, selectedPlantelId]);

  const getGapColor = (gap: number) => {
    if (gap < 0) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (gap === 0) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  const inputStyle = "w-full rounded-xl border-2 border-slate-300 p-3 bg-white text-black font-black uppercase text-xs";
  const labelStyle = "block text-[9px] font-black text-slate-400 uppercase ml-2 mb-1";

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200">
                    <UserSearch size={32}/>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Analítica de Brechas</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Déficit y Superávit según Matrícula y Espacios</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Estado</label>
                <select 
                    className={inputStyle} 
                    value={selectedEstado} 
                    onChange={e => {setSelectedEstado(e.target.value); setSelectedMunicipio(''); setSelectedPlantelId('');}}
                    disabled={currentUser.role === 'ADMINISTRADOR'}
                >
                    <option value="">VENEZUELA (TODOS)</option>
                    {estadosList.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Municipio</label>
                <select 
                    className={inputStyle} 
                    value={selectedMunicipio} 
                    onChange={e => {setSelectedMunicipio(e.target.value); setSelectedPlantelId('');}} 
                    disabled={!selectedEstado}
                >
                    <option value="">TODOS LOS MUNICIPIOS</option>
                    {municipiosList.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className={labelStyle}>Plantel Específico</label>
                <select 
                    className={inputStyle} 
                    value={selectedPlantelId} 
                    onChange={e => setSelectedPlantelId(e.target.value)}
                    disabled={!selectedMunicipio}
                >
                    <option value="">-- ANALIZAR TODO EL MUNICIPIO --</option>
                    {plantelesList.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Identificación del Plantel</th>
                <th className="px-6 py-5 text-center">Matrícula</th>
                <th className="px-6 py-5 text-center">Docentes (Gap)</th>
                <th className="px-6 py-5 text-center">Admin (Gap)</th>
                <th className="px-6 py-5 text-center">Cocin. (Gap)</th>
                <th className="px-6 py-5 text-center">Obrero (Gap)</th>
                <th className="px-6 py-5 text-center">Vig. (Gap)</th>
              </tr>
            </thead>
            <tbody className="text-xs font-black uppercase">
              {analysis.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors text-sm">{item.plantel.nombre}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-black text-[11px]">{item.plantel.codigoDea}</span>
                        <span className="flex items-center gap-1"><MapPin size={10}/> {item.plantel.municipio}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 font-black text-sm">
                        {item.totalMatricula}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 ${getGapColor(item.stats.docentes.gap)}`}>
                        <span className="text-sm">{item.stats.docentes.real} / {item.stats.docentes.req}</span>
                        <span className="text-[10px] font-black opacity-60">{item.stats.docentes.gap > 0 ? `+${item.stats.docentes.gap}` : item.stats.docentes.gap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 ${getGapColor(item.stats.admin.gap)}`}>
                        <span className="text-sm">{item.stats.admin.real} / {item.stats.admin.req}</span>
                        <span className="text-[10px] font-black opacity-60">{item.stats.admin.gap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 ${getGapColor(item.stats.cocineros.gap)}`}>
                        <span className="text-sm">{item.stats.cocineros.real} / {item.stats.cocineros.req}</span>
                        <span className="text-[10px] font-black opacity-60">{item.stats.cocineros.gap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 ${getGapColor(item.stats.aseadores.gap)}`}>
                        <span className="text-sm">{item.stats.aseadores.real} / {item.stats.aseadores.req}</span>
                        <span className="text-[10px] font-black opacity-60">{item.stats.aseadores.gap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-1 ${getGapColor(item.stats.vigilantes.gap)}`}>
                        <span className="text-sm">{item.stats.vigilantes.real} / {item.stats.vigilantes.req}</span>
                        <span className="text-[10px] font-black opacity-60">{item.stats.vigilantes.gap}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analysis.length === 0 && (
              <div className="p-20 text-center bg-slate-50">
                  <ShieldAlert size={64} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest">Sin resultados para analizar con los filtros aplicados</p>
              </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50 p-6 rounded-[32px] border-2 border-rose-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200"><AlertTriangle size={24}/></div>
            <div><p className="text-xs font-black text-rose-800 uppercase leading-tight">Brecha Crítica (Déficit)</p><p className="text-[10px] text-rose-600 font-bold uppercase mt-1 leading-tight">Indica falta de personal respecto a la matrícula real.</p></div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200"><CheckCircle2 size={24}/></div>
            <div><p className="text-xs font-black text-emerald-800 uppercase leading-tight">Balance Óptimo</p><p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 leading-tight">El plantel cumple exactamente con la norma ministerial.</p></div>
        </div>
        <div className="bg-blue-50 p-6 rounded-[32px] border-2 border-blue-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200"><Calculator size={24}/></div>
            <div><p className="text-xs font-black text-blue-800 uppercase leading-tight">Superávit Local</p><p className="text-[10px] text-blue-600 font-bold uppercase mt-1 leading-tight">Personal excede el ratio teórico. Evaluar traslados.</p></div>
        </div>
      </div>
    </div>
  );
};

export default BrechasManager;