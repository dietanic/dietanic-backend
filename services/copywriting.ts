import { GoogleGenAI } from "@google/genai";

// Fix: Direct initialization using the configured environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, ingredients: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return "Fresh and delicious ingredients prepared daily.";
  }

  try {
    // Fix: Model upgrade to gemini-3-flash-preview for marketing copy generation
    const model = 'gemini-3-flash-preview';
    const prompt = `Write a mouth-watering, short marketing description (max 2 sentences) for a salad or meal named "${name}" containing the following ingredients: ${ingredients}. Focus on health benefits and freshness.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "Fresh and delicious ingredients prepared daily.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "A delicious blend of fresh ingredients.";
  }
};
