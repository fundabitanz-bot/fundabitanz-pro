
import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, LogIn, AlertCircle, Wifi, WifiOff, Loader2, XCircle, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLogin: (cedula: string, pass: string) => Promise<void>; 
  error?: string;
  customLogo?: string | null;
  customBanner?: string | null;
  isOnline?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, customLogo, customBanner, isOnline }) => {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRescue, setShowRescue] = useState(false);

  // Temporizador de seguridad: Si tarda más de 8 segundos, mostrar botón de rescate
  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (isSubmitting) {
          timer = setTimeout(() => {
              setShowRescue(true);
          }, 5000); // 5 segundos umbral de paciencia
      } else {
          setShowRescue(false);
      }
      return () => clearTimeout(timer);
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setShowRescue(false);
    
    try {
        await onLogin(cedula, password);
    } catch (err) {
        console.error("Login Error Catch:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const forceReset = () => {
      setIsSubmitting(false);
      setShowRescue(false);
      alert("Proceso detenido manualmente. Por favor verifique que el servidor (server.js) esté ejecutándose.");
  };

  const activeLogo = customLogo || "logotipo.jpg";
  const activeBanner = customBanner || "bandera.jpg";
  
  const FALLBACK_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ministerio_del_Poder_Popular_para_Educaci%C3%B3n.svg/640px-Ministerio_del_Poder_Popular_para_Educaci%C3%B3n.svg.png";
  const FALLBACK_FLAG = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Flag_of_Venezuela.svg/1920px-Flag_of_Venezuela.svg.png";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden text-center">
      <div className="absolute inset-0 z-0">
          <img 
            src={activeBanner} 
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_FLAG; }}
            className="w-full h-full object-cover opacity-20 blur-lg scale-110 transition-all duration-1000"
            alt="Fondo Institucional"
          />
          <div className="absolute inset-0 bg-slate-900/60"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-[35px] sm:rounded-[50px] shadow-2xl overflow-hidden z-10 relative border border-white/20 animate-in fade-in zoom-in duration-500">
        
        <div className="relative h-48 sm:h-72 flex flex-col items-center justify-center overflow-hidden bg-slate-900">
          <img 
            src={activeBanner} 
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_FLAG; }}
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all duration-1000" 
            alt="Banner Institucional"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#003399]/95 via-[#003399]/80 to-transparent flex flex-col justify-center px-6 sm:px-12 text-left">
              <div className="w-16 sm:w-24 h-10 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl p-2 mb-3 sm:mb-4 border border-white/30">
                 <img 
                    src={activeLogo} 
                    alt="Logo" 
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_LOGO; }}
                    className="w-full h-full object-contain drop-shadow-md" 
                 />
              </div>

              <h2 className="text-base sm:text-2xl font-black text-white drop-shadow-xl tracking-tighter uppercase leading-tight italic">
                SISTEMA DE GESTIÓN EDUCATIVA
              </h2>
              <div className="mt-1 sm:mt-2 flex flex-col gap-1">
                <p className="text-[8px] sm:text-[10px] font-black text-blue-100 uppercase tracking-tight">CENTRO DE DESARROLLO DE LA CALIDAD EDUCATIVA</p>
                <div className="h-0.5 sm:h-1 w-12 bg-yellow-400 my-0.5 sm:my-1"></div>
                <p className="text-[6px] sm:text-[8px] font-black text-white/50 uppercase tracking-[0.2em] sm:tracking-[0.3em]">ANZOÁTEGUI V10.0</p>
              </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-10 pb-6 sm:pb-8 space-y-4 sm:space-y-6 pt-8 sm:pt-10">
          <div className="flex justify-center -mt-12 sm:-mt-14 mb-2 sm:mb-4 relative z-20">
             <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 shadow-xl backdrop-blur-xl transition-all ${isOnline ? 'bg-white/95 border-emerald-200 text-emerald-700' : 'bg-white/95 border-rose-200 text-rose-700 animate-pulse'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Conectado' : 'Modo Offline'}</span>
             </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula del Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon size={14} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                required 
                disabled={isSubmitting}
                className="pl-10 sm:pl-12 w-full rounded-xl sm:rounded-2xl border-2 border-slate-100 focus:border-[#003399] py-3 sm:py-4 bg-slate-50 text-black font-bold outline-none text-xs sm:text-sm disabled:opacity-50 uppercase" 
                placeholder="V-CEDULA" 
                value={cedula} 
                onChange={(e) => setCedula(e.target.value.toUpperCase())} 
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={14} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                required 
                disabled={isSubmitting}
                className="pl-10 sm:pl-12 w-full rounded-xl sm:rounded-2xl border-2 border-slate-100 focus:border-[#003399] py-3 sm:py-4 bg-slate-50 text-black font-bold outline-none text-xs sm:text-sm disabled:opacity-50" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-[8px] sm:text-[11px] font-black flex items-center gap-2 border-2 border-red-100 animate-bounce uppercase">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-[#003399] hover:bg-blue-800 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 group uppercase tracking-widest text-[9px] sm:text-xs disabled:bg-slate-400"
              >
                {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                )}
                {isSubmitting ? 'ACCEDIENDO...' : 'INICIAR SESIÓN'}
              </button>
              
              {/* BOTÓN DE EMERGENCIA SI SE QUEDA PEGADO */}
              {showRescue && (
                  <button 
                    type="button" 
                    onClick={forceReset}
                    className="px-4 bg-rose-100 text-rose-600 rounded-xl sm:rounded-2xl hover:bg-rose-200 transition-colors animate-in fade-in flex items-center justify-center shadow-lg border-2 border-rose-200"
                    title="El sistema tarda demasiado. Cancelar."
                  >
                      <XCircle size={24}/>
                  </button>
              )}
          </div>
          
          {showRescue && (
              <div className="text-[9px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg animate-in slide-in-from-top-2 border border-rose-100">
                  <ShieldAlert size={12} className="inline mr-1"/>
                  El servidor tarda en responder. Puede intentar cancelar y probar de nuevo.
              </div>
          )}
        </form>
        
        <div className="bg-slate-50 p-4 sm:p-6 text-center border-t border-slate-100 space-y-1">
            <p className="text-[9px] sm:text-[11px] text-slate-900 font-black uppercase tracking-tight">SISTEMA DE GESTIÓN EDUCATIVA</p>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Desarrollado por José Coronado</p>
            <p className="text-[7px] sm:text-[8px] text-[#003399] font-black uppercase tracking-widest">Coordinación Fundabit Anzoátegui</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
