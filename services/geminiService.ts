import { GoogleGenAI } from "@google/genai";
import { KnowledgeService } from './knowledge';

// Lazy initialization to avoid errors when API key is not set
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const locateOrderDestination = async (address: string): Promise<{title: string, uri: string} | null> => {
  if (!process.env.API_KEY) {
      console.warn("API Key missing for Maps");
      return null;
  }
  try {
    const aiClient = getAI();
    if (!aiClient) return null;
    const response = await aiClient.models.generateContent({
      // Maps grounding is specifically supported in the 2.5 series
      model: 'gemini-2.5-flash',
      contents: `Find this precise location on Google Maps: ${address}`,
      config: {
        tools: [{googleMaps: {}}],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && chunks.length > 0) {
        for (const chunk of chunks) {
            // @ts-ignore - Dynamic access to maps property as per documentation
            if (chunk.maps?.uri) {
                // @ts-ignore
                return { title: chunk.maps.title || 'Location Found', uri: chunk.maps.uri };
            }
             // @ts-ignore
            if (chunk.web?.uri && chunk.web.uri.includes('google.com/maps')) {
                 // @ts-ignore
                 return { title: chunk.web.title || 'Location Found', uri: chunk.web.uri };
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Error locating address:", error);
    return null;
  }
};

export const askNutritionist = async (question: string): Promise<string> => {
   if (!process.env.API_KEY) {
    return "I'm currently offline. Please try again later.";
  }

  try {
    const context = await KnowledgeService.getApprovedContent();

    // Fix: Upgrading to gemini-3-flash-preview for optimized Q&A performance
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
    You are 'Dietanic AI', a customer support agent for a salad subscription brand.
    
    BUSINESS KNOWLEDGE BASE:
    ${context}
    
    INSTRUCTIONS:
    1. Answer the user's question using ONLY the information provided in the KNOWLEDGE BASE above.
    2. If the answer is found in the KNOWLEDGE BASE, provide a concise and helpful response.
    3. If the answer is NOT found in the KNOWLEDGE BASE, apologize and say: "I don't have the information for that specific query. I have notified a human agent to assist you shortly."
    4. Do not make up information. Do not hallucinate policies.
    5. Be polite and professional.
    6. Always reply in the same language the user asked the question in.

    USER QUESTION: "${question}"
    `;

    const aiClient = getAI();
    if (!aiClient) return "I'm currently offline. Please try again later.";
    const response = await aiClient.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "I couldn't process that request right now.";
  } catch (error) {
    console.error("Error asking nutritionist:", error);
    return "I couldn't process that request right now.";
  }
};

export const generateProductDescription = async (name: string, ingredients: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return "Fresh and delicious ingredients prepared daily.";
  }

  try {
    // Fix: Upgrading to gemini-3-flash-preview for creative text generation
    const model = 'gemini-3-flash-preview';
    const prompt = `Write a mouth-watering, short marketing description (max 2 sentences) for a salad or meal named "${name}" containing the following ingredients: ${ingredients}. Focus on health benefits and freshness.`;

    const aiClient = getAI();
    if (!aiClient) return "Fresh and delicious ingredients prepared daily.";
    const response = await aiClient.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "Fresh and delicious ingredients prepared daily.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "A delicious blend of fresh ingredients.";
  }
};

export interface AgentAction {
    intent: 'NAVIGATION' | 'ANALYSIS' | 'ACTION' | 'GENERAL';
    target?: string;
    message: string;
    dataRequired?: string[];
}

export const evaluateAdminQuery = async (query: string, availableContext: string): Promise<AgentAction> => {
    if (!process.env.API_KEY) {
        return { intent: 'GENERAL', message: 'Agent Offline (Missing API Key)' };
    }

    try {
        // Fix: Upgrading to gemini-3-pro-preview for complex reasoning and JSON routing tasks
        const model = 'gemini-3-pro-preview';
        const prompt = `
        You are the 'Dietanic Admin Agent', an operational assistant.
        
        AVAILABLE NAVIGATION TARGETS (IDs): 
        ['overview', 'commerce', 'finance', 'operations', 'experience', 'security', 'identity']

        USER QUERY: "${query}"

        CONTEXT: ${availableContext}

        INSTRUCTIONS:
        Analyze the query and output a JSON object (ONLY JSON) with the following structure:
        {
            "intent": "NAVIGATION" | "ANALYSIS" | "ACTION" | "GENERAL",
            "target": "target_id_if_navigation", 
            "message": "A natural language response to the user explaining what you are doing or the answer",
            "dataRequired": ["orders" | "users" | "revenue"] (if analysis is needed)
        }

        Examples:
        - "Go to finance" -> {"intent": "NAVIGATION", "target": "finance", "message": "Navigating to Finance Dashboard."}
        - "How are sales?" -> {"intent": "ANALYSIS", "dataRequired": ["revenue"], "message": "Let me analyze the sales data for you."}
        - "Draft a discount email" -> {"intent": "ACTION", "message": "Here is a draft: ..."}
        - "Hello" -> {"intent": "GENERAL", "message": "Hello! I'm ready to help with store operations."}
        `;

        const aiClient = getAI();
        if (!aiClient) return { intent: 'GENERAL', message: 'Agent Offline (Missing API Key)' };
        const response = await aiClient.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || "{}";
        return JSON.parse(text) as AgentAction;
    } catch (error) {
        console.error("Agent Error:", error);
        return { intent: 'GENERAL', message: "I encountered a processing error." };
    }
};
