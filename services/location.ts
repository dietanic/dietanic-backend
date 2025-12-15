import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const locateOrderDestination = async (address: string): Promise<{title: string, uri: string} | null> => {
  if (!process.env.API_KEY) {
      console.warn("API Key missing for Maps");
      return null;
  }
  try {
    const response = await ai.models.generateContent({
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
