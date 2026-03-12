import { GoogleGenAI } from "@google/genai";
import { ModelType, TaskType } from "../types";

const SYSTEM_INSTRUCTION = `
Eres el Analista Estratégico Senior del CDCE (SGI Pro). 
Tu misión es procesar datos educativos, infraestructura y PERSONAL para generar reportes ejecutivos precisos.

REGLAS DE IDIOMA:
1. RESPONDE SIEMPRE EN ESPAÑOL.
2. NO traduzcas términos técnicos venezolanos (ej. CNAE, FEDE, RAC).

REGLAS DE ANÁLISIS:
1. Sé extremadamente analítico con los datos proporcionados.
2. Si detectas brechas críticas (más alumnos que docentes), indícalo claramente.
3. El tono debe ser profesional, institucional y propositivo.
`;

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const getQuickAnalysis = async (context: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza estratégicamente el siguiente contexto educativo y genera 3 hallazgos clave de gestión:\n${context}`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        temperature: 0.3 // Menor temperatura para mayor precisión técnica
      }
    });
    return response.text || "Análisis no disponible.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("429")) return "Límite de cuota alcanzado. El motor se reiniciará en breve.";
    return "Error de conexión con el motor de inteligencia.";
  }
};

export const analyzeSystemData = async (context: string, userQuery: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `CONTEXTO SGI:\n${context}\n\nCONSULTA: ${userQuery}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });
    return response.text || "No se pudo procesar la consulta.";
  } catch (error: any) {
    return "El servidor de inteligencia no responde. Intente en unos segundos.";
  }
};

export const processCodeTask = async (inputCode: string, task: TaskType, model: ModelType): Promise<string> => {
  try {
    const ai = getAiClient();
    let prompt = `Acción: ${task}\n\n${inputCode}`;
    if (task === TaskType.CONVERT_PHP_TO_REACT) prompt = `Migra este código PHP a React Moderno:\n${inputCode}`;

    const response = await ai.models.generateContent({
      model: model === ModelType.PRO ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Arquitecto de Software Senior. Genera código limpio, tipado y optimizado en español.",
      }
    });
    return response.text || "Respuesta técnica vacía.";
  } catch (error: any) {
    throw new Error("Fallo en arquitectura de código IA.");
  }
};