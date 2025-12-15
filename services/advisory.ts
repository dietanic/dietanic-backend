
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askNutritionist = async (question: string): Promise<string> => {
   if (!process.env.API_KEY) {
    return "I'm currently offline. Please try again later.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a helpful nutritionist for a salad brand called Dietanic. Answer the following customer question briefly and politely: "${question}"`;

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
