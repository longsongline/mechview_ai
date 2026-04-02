import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface OrthographicAnalysis {
  frontView: string;
  topView: string;
  sideView: string;
  technicalDetails: string;
}

export async function analyzeAndGenerateViews(base64Image: string, mimeType: string): Promise<{ analysis: OrthographicAnalysis; generatedImageUrl: string | null }> {
  // 1. Analyze the 3D structure using gemini-3-flash-preview
  const analysisResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: "You are an expert mechanical engineer. Analyze this 3D perspective image and describe its three orthographic views (front, top, and right side). Provide technical details about the geometry, dimensions (if estimable), and features. Return the result in JSON format.",
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          frontView: { type: Type.STRING, description: "Description of the front orthographic view." },
          topView: { type: Type.STRING, description: "Description of the top orthographic view." },
          sideView: { type: Type.STRING, description: "Description of the right side orthographic view." },
          technicalDetails: { type: Type.STRING, description: "Detailed technical analysis of the object's geometry and features." },
        },
        required: ["frontView", "topView", "sideView", "technicalDetails"],
      },
    },
  });

  const analysis: OrthographicAnalysis = JSON.parse(analysisResponse.text || "{}");

  // 2. Generate the orthographic views image using gemini-2.5-flash-image
  let generatedImageUrl: string | null = null;
  try {
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Generate a professional technical drawing (orthographic projection) showing the front, top, and right side views of this object. 
          Style: Clean engineering blueprint, white background, crisp black lines, labeled 'FRONT', 'TOP', 'SIDE'. 
          The three views should be arranged correctly (First-angle or Third-angle projection). 
          Ensure all geometric features described are accurate: ${analysis.technicalDetails}`,
        },
      ],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }

  return { analysis, generatedImageUrl };
}
