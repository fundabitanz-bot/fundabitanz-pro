
import { SGI_KNOWLEDGE_BASE, FAQItem } from '../utils/faqData';

export interface BotResponse {
    text: string;
    source: 'LOCAL' | 'AI';
    actionLabel?: string;
    actionView?: string;
    suggestions?: string[];
}

const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const findLocalResponse = (query: string, currentView: string): BotResponse | null => {
    const normalizedQuery = normalizeText(query);
    // const words = normalizedQuery.split(/\s+/).filter(w => w.length > 3); 

    let bestMatch: FAQItem | null = null;
    let maxScore = 0;

    // 1. Buscar primero en el contexto actual (Prioridad Alta)
    const contextFAQs = SGI_KNOWLEDGE_BASE[currentView] || [];
    for (const item of contextFAQs) {
        let score = 0;
        for (const kw of item.keywords) {
            if (normalizedQuery.includes(normalizeText(kw))) score += 2;
        }
        if (score > maxScore) {
            maxScore = score;
            bestMatch = item;
        }
    }

    // 2. Si no hay buena coincidencia, buscar en GLOBAL y otros módulos
    if (maxScore < 2) {
        const sections = Object.keys(SGI_KNOWLEDGE_BASE);
        for (const key of sections) {
            if (key === currentView) continue; // Ya buscamos aquí
            
            const items = SGI_KNOWLEDGE_BASE[key];
            for (const item of items) {
                let score = 0;
                for (const kw of item.keywords) {
                    if (normalizedQuery.includes(normalizeText(kw))) score += 1;
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                }
            }
        }
    }

    if (bestMatch && maxScore > 0) {
        return {
            text: bestMatch.answer,
            source: 'LOCAL',
            actionLabel: bestMatch.actionLabel,
            actionView: bestMatch.actionView
        };
    }

    return null;
};

export const getSuggestionsForView = (view: string): string[] => {
    const faqs = SGI_KNOWLEDGE_BASE[view] || [];
    return faqs.slice(0, 3).map(f => f.question);
};
