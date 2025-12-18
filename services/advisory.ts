import { GoogleGenAI } from "@google/genai";
import { KnowledgeService } from './knowledge';

// Fix: Standardized initialization with direct environment key access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askNutritionist = async (question: string): Promise<string> => {
   if (!process.env.API_KEY) {
    return "I'm currently offline. Please try again later.";
  }

  try {
    const context = await KnowledgeService.getApprovedContent();

    // Fix: Upgraded to gemini-3-flash-preview for text-based advisory tasks
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

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "I couldn't process that request right now.";
  } catch (error) {
    console.error("Error asking nutritionist:", error);
    return "I couldn't process that request right now.";
  }
};
