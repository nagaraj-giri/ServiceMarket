
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI strictly using the environment variable as per guidelines
// Always use the process.env.API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PlaceSuggestion {
  name: string;
  coordinates?: { lat: number; lng: number };
}

export const getDubaiInsights = async (query: string): Promise<{ text: string; groundingChunks?: any[] }> => {
  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const model = 'gemini-2.5-flash';
    
    // Using Google Search and Maps Grounding to get up-to-date Dubai regulations and locations
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        systemInstruction: "You are a knowledgeable assistant for Dubai services. You help users understand visa rules, business setup costs, travel tips, and find locations in Dubai. Use Google Search to verify regulations. Use Google Maps to find locations, offices, and distances. Be concise and professional. When you use information from the search results, cite the source domain inline immediately after the relevant sentence or list item using the format [[Source: domain.com]]. Do not create a separate 'Sources' section.",
      }
    });

    const text = response.text || "I couldn't find an answer to that.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error while researching your query. Please try again." };
  }
};

export const getPlaceSuggestions = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!query || query.length < 3) return [];

  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for places in Dubai that match: "${query}". Use the Google Maps tool to find real locations and their coordinates. Return ONLY a JSON array of up to 5 objects: [{ "name": "Official Name", "lat": 12.34, "lng": 56.78 }]. Ensure coordinates are accurate from the tool.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    let text = response.text;
    if (!text) return [];
    
    // Improved JSON extraction: find the JSON array even if there is surrounding text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        text = jsonMatch[0];
    } else {
        // Fallback: simple markdown cleanup
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        // Validate structure
        return parsed.map(item => ({
          name: item.name || item.placeName || String(item),
          coordinates: (item.lat && item.lng) ? { lat: item.lat, lng: item.lng } : undefined
        }));
      }
      return [];
    } catch (e) {
      console.warn("Failed to parse JSON from place suggestions", text);
      return [];
    }
  } catch (error) {
    console.error("Gemini Place Suggestion Error:", error);
    return [];
  }
};
