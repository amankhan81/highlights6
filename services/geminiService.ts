
import { GoogleGenAI, Type } from "@google/genai";
import { EventType, DetectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeFrame(base64Image: string): Promise<DetectionResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: `Analyze this cropped section of a cricket broadcast. This specific area has been selected because it contains graphic overlays (scorecards, popups, tickers). 
              Identify if any of the following cricket events are shown in this graphic:
              - SIX: The number '6' or word 'SIX'
              - FOUR: The number '4' or word 'FOUR'
              - WICKET: Words like 'OUT', 'WICKET', 'BOWLED', 'CAUGHT', 'LBW', 'RUN OUT'
              - OVER_END_UPDATE: A summary graphic for the over, a scorecard change indicating a completed over, or a distinct "end of over" banner.
              
              Respond strictly in JSON format with:
              - event: One of ["SIX", "FOUR", "WICKET", "OVER_END_UPDATE", "NONE"]
              - confidence: a number between 0 and 1.
              
              If the area contains a score update but no specific milestone, return "NONE" unless it's a clear "Over Summary" graphic.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            event: {
              type: Type.STRING,
              description: "The detected cricket event type",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score",
            },
          },
          required: ["event", "confidence"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) return { event: EventType.NONE, confidence: 0 };
    
    const parsed = JSON.parse(resultText);
    return {
      event: parsed.event as EventType,
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { event: EventType.NONE, confidence: 0 };
  }
}
