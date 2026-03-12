import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, MessageSquare, Zap, Cloud, Globe } from 'lucide-react';
import { analyzeSystemData } from '../services/geminiService';
import { findLocalResponse, getSuggestionsForView } from '../services/localBotService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: 'LOCAL' | 'AI';
  action?: { label: string, view: string };
}

interface AIAssistantProps {
  systemContext: string;
  currentView: string;
  aiEnabled: boolean;
  isOpen: boolean;           // Nuevo prop
  onToggle: (v: boolean) => void; // Nuevo prop
}

const AIAssistant: React.FC<AIAssistantProps> = ({ systemContext, currentView, aiEnabled, isOpen, onToggle }) => {
  // Eliminado el estado local isOpen para usar el del padre (App.tsx)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente SGI. Estoy aquí para guiarte en el uso del sistema o analizar datos. ¿En qué puedo ayudarte hoy?', source: 'LOCAL' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false); // Toggle manual para forzar IA
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const suggestions = getSuggestionsForView(currentView);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    // 1. INTENTO DE RESPUESTA LOCAL (PRIORIDAD)
    if (!useAI) {
        // Simular pequeño delay para naturalidad
        await new Promise(r => setTimeout(r, 400));
        
        const localMatch = findLocalResponse(textToSend, currentView);
        
        if (localMatch) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: localMatch.text, 
                source: 'LOCAL',
                action: localMatch.actionLabel ? { label: localMatch.actionLabel, view: localMatch.actionView || '' } : undefined
            }]);
            setIsLoading(false);
            return;
        }
    }

    // 2. FALLBACK A INTELIGENCIA ARTIFICIAL (SI ESTÁ HABILITADA)
    if (aiEnabled) {
        try {
            const response = await analyzeSystemData(systemContext, textToSend);
            setMessages(prev => [...prev, { role: 'assistant', content: response, source: 'AI' }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "No pude conectar con el servidor de IA. Verifica tu conexión.", source: 'LOCAL' }]);
        }
    } else {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "No encontré una respuesta en mi base de conocimientos local y el módulo de IA está desactivado. Intenta reformular tu pregunta o contacta a soporte.", 
            source: 'LOCAL' 
        }]);
    }
    
    setIsLoading(false);
  };

  const handleAction = (view: string) => {
      setMessages(prev => [...prev, { role: 'assistant', content: `Para ir a ${view}, usa el menú lateral.`, source: 'LOCAL' }]);
  };

  return (
    <div className={`fixed z-[9999] transition-all duration-500 flex flex-col ${isOpen ? 'inset-0 bg-slate-900/50 backdrop-blur-sm' : ''} md:bg-transparent md:backdrop-blur-none pointer-events-none`}>
      
      {/* 
          POSICIONAMIENTO RESPONSIVO DEL CONTENEDOR PRINCIPAL
      */}
      <div className={`absolute pointer-events-auto transition-all duration-500
          ${isOpen 
            ? 'top-[80px] left-1/2 -translate-x-1/2 w-full max-w-sm px-4 md:top-auto md:left-auto md:translate-x-0 md:bottom-24 md:right-6 md:w-[400px] md:px-0' 
            : 'top-[18px] left-1/2 -translate-x-1/2 md:top-auto md:left-auto md:translate-x-0 md:bottom-6 md:right-6'
          }
      `}>
          
          {isOpen ? (
            <div className="w-full bg-white rounded-[30px] md:rounded-[40px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-top-10 md:slide-in-from-bottom-10 duration-300 ring-4 ring-slate-100 max-h-[70vh] md:max-h-[600px]">
              
              {/* HEADER */}
              <div className="bg-slate-900 p-4 md:p-6 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${useAI ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                    {useAI ? <Sparkles size={18} className="text-white animate-pulse" /> : <Zap size={18} className="text-white"/>}
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest leading-none">Asistente SGI</h3>
                    <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                        {useAI ? <><Cloud size={8}/> GEMA CLOUD AI</> : <><Bot size={8}/> PROTOCOLO LOCAL</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {aiEnabled && (
                        <button 
                            onClick={() => setUseAI(!useAI)} 
                            className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border transition-all ${useAI ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            title={useAI ? "Usar IA Avanzada" : "Usar Bot Rápido"}
                        >
                            {useAI ? 'MODO IA' : 'MODO LOCAL'}
                        </button>
                    )}
                    <button onClick={() => onToggle(false)} className="hover:bg-white/10 p-2 rounded-full transition-all">
                    <X size={20} />
                    </button>
                </div>
              </div>

              {/* CHAT AREA */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-slate-50 relative">
                
                {/* SUGGESTIONS PILLS */}
                {messages.length < 3 && suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end mb-4 animate-in slide-in-from-right-4">
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSend(s)} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-bold uppercase hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 md:p-4 rounded-[24px] md:rounded-[28px] text-[10px] md:text-[11px] font-bold leading-relaxed shadow-sm relative ${
                      msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-tr-none' 
                        : msg.source === 'AI' 
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tl-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      <div className={`flex items-center gap-2 mb-2 opacity-50 text-[8px] md:text-[9px] uppercase font-black ${msg.role === 'user' ? 'text-slate-300' : msg.source === 'AI' ? 'text-indigo-400' : 'text-emerald-600'}`}>
                        {msg.role === 'user' ? <UserIcon size={10}/> : msg.source === 'AI' ? <Sparkles size={10}/> : <Zap size={10}/>}
                        {msg.role === 'user' ? 'Tú' : msg.source === 'AI' ? 'Gema AI' : 'SGI Bot'}
                      </div>
                      <p className="whitespace-pre-wrap uppercase">{msg.content}</p>
                      
                      {msg.action && (
                          <button onClick={() => handleAction(msg.action!.view)} className="mt-3 w-full bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
                              <Globe size={12}/> {msg.action.label}
                          </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
                      <Loader2 className="animate-spin text-emerald-600" size={14} />
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {useAI ? 'Consultando Nodo IA...' : 'Buscando respuesta...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT AREA */}
              <div className="p-3 md:p-4 bg-white border-t flex gap-2 md:gap-3">
                <input 
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 text-[10px] md:text-[11px] font-bold focus:border-slate-300 focus:ring-0 uppercase transition-all outline-none"
                  placeholder={useAI ? "Pregunta compleja a la IA..." : "Ayuda rápida..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className={`text-white p-3 md:p-4 rounded-xl md:rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-lg ${useAI ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* BOTÓN FLOTANTE (Se mantiene como respaldo visual en la esquina) */
            <button 
              onClick={() => onToggle(true)}
              className={`text-white p-3 md:p-5 rounded-full shadow-2xl transition-all active:scale-90 animate-float group ring-4 ring-white bg-gradient-to-r from-emerald-500 to-emerald-700 hover:scale-110 flex items-center justify-center`}
            >
              <div className="relative">
                  <MessageSquare size={24} className="md:w-6 md:h-6 w-5 h-5"/>
                  {aiEnabled && <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-indigo-500 rounded-full border-2 border-white"></div>}
              </div>
            </button>
          )}
      </div>
    </div>
  );
};

export default AIAssistant;