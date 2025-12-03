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
    
    // Using Google Search Grounding to get up-to-date Dubai regulations
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a knowledgeable assistant for Dubai services. You help users understand visa rules, business setup costs, and travel tips in Dubai. Always use the search tool to verify the latest regulations from 2024/2025. Be concise and professional. When you use information from the search results, cite the source domain inline immediately after the relevant sentence or list item using the format [[Source: domain.com]]. Do not create a separate 'Sources' section.",
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