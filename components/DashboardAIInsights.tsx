import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, TrendingUp, AlertCircle, Clock, Terminal } from 'lucide-react';
import { getQuickAnalysis } from '../services/geminiService';

interface DashboardAIInsightsProps {
  systemContext: string;
}

const DashboardAIInsights: React.FC<DashboardAIInsightsProps> = ({ systemContext }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const isMounted = useRef(true);
  const lastAnalysis = useRef<string>("");

  // Efecto de escritura dinámica
  useEffect(() => {
    if (!analysis) return;
    setDisplayedText('');
    let i = 0;
    const speed = 10; // ms por caracter
    const interval = setInterval(() => {
        setDisplayedText(prev => analysis.substring(0, i + 1));
        i++;
        if (i >= analysis.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [analysis]);

  useEffect(() => {
    isMounted.current = true;
    
    const fetchAnalysis = async () => {
      if (lastAnalysis.current === systemContext && analysis !== "") return;
      
      setLoading(true);
      setErrorStatus(null);

      // Pequeña pausa para no saturar al cargar
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const result = await getQuickAnalysis(systemContext);
        
        if (isMounted.current) {
          if (result.includes("saturado") || result.includes("429")) {
            setErrorStatus("quota");
          } else {
            setAnalysis(result);
            lastAnalysis.current = systemContext;
          }
        }
      } catch (err) {
        if (isMounted.current) setErrorStatus("error");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchAnalysis();

    return () => {
      isMounted.current = false;
    };
  }, [systemContext]);

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,51,153,0.15)] transition-all duration-500">
      <div className="bg-gradient-to-r from-[#003399] to-blue-700 p-6 flex justify-between items-center text-white relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
            <Sparkles className="text-yellow-400 animate-pulse" size={24} />
          </div>
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest leading-none italic">SGI GEMA Intelligence</h3>
            <p className="text-[9px] font-bold text-white/60 uppercase mt-1 tracking-tighter">Análisis Territorial en Tiempo Real</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md flex items-center gap-2">
          <Terminal size={14}/> Engine v3.8 Active
        </div>
      </div>
      <div className="p-10 min-h-[180px] flex flex-col justify-center bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center gap-5 text-slate-400">
            <Loader2 className="animate-spin text-[#003399]" size={36} />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando con el motor estratégico...</p>
          </div>
        ) : errorStatus === "quota" ? (
          <div className="flex flex-col items-center gap-4 text-amber-600 text-center">
            <div className="p-4 bg-amber-50 rounded-full"><Clock size={32} className="animate-bounce" /></div>
            <p className="text-[10px] font-black uppercase max-w-sm leading-relaxed">
              Capacidad de procesamiento diaria alcanzada. El motor de análisis estratégico se refrescará automáticamente.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-[9px] bg-amber-600 text-white px-6 py-2.5 rounded-full font-black mt-2 hover:bg-amber-700 transition-all shadow-lg"
            >
              FORZAR RE-ESCÁNEO
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-1000">
            <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-inner">
                <div className="text-[11px] font-bold text-slate-600 leading-loose whitespace-pre-wrap uppercase font-mono">
                {displayedText || "Preparando informe..."}
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#003399]">
                    <TrendingUp size={18} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Escenario de Optimización Educativa</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAIInsights;