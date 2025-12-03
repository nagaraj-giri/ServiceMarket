
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getDubaiInsights = async (query: string): Promise<{ text: string; groundingChunks?: any[] }> => {
  if (!apiKey) {
    return { text: "API Key is missing. Please check your environment configuration." };
  }

  try {
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

export const getPlaceSuggestions = async (query: string): Promise<string[]> => {
  if (!apiKey) return [];
  if (!query || query.length < 3) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 5 distinct real places, districts, or landmarks in Dubai that match the search term "${query}". Return ONLY a raw JSON array of strings (e.g. ["Business Bay", "Downtown Dubai"]). Do not include markdown formatting or explanations.`,
      config: {
        tools: [{ googleMaps: {} }],
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse JSON from place suggestions", text);
      return [];
    }
  } catch (error) {
    console.error("Gemini Place Suggestion Error:", error);
    return [];
  }
};
