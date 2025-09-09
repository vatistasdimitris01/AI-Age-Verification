import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { frame } = request.body;
        if (!frame || typeof frame !== 'string') {
            return response.status(400).json({ error: 'Bad Request: Missing or invalid frame' });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on server");
            return response.status(500).json({ error: 'Internal Server Error: Missing API configuration' });
        }
        const ai = new GoogleGenAI({ apiKey });

        const imagePart = {
            inlineData: {
                data: frame,
                mimeType: "image/jpeg",
            },
        };

        const prompt = `Analyze the person in this image and estimate their details.
        Respond ONLY with a valid JSON object containing the following fields: 'age', 'gender', 'emotion', 'wearingGlasses', 'facialHair', 'hairColor', 'faceShape', 'ethnicity', 'skinTone', 'eyeColor', 'distinguishingMarks'.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        age: { type: Type.INTEGER, description: "Estimated age of the person." },
                        gender: { type: Type.STRING, description: "Estimated gender of the person." },
                        emotion: { type: Type.STRING, description: "Estimated dominant emotion of the person." },
                        wearingGlasses: { type: Type.BOOLEAN, description: "Whether the person is wearing glasses." },
                        facialHair: { type: Type.STRING, description: "Description of the person's facial hair." },
                        hairColor: { type: Type.STRING, description: "Estimated hair color of the person." },
                        faceShape: { type: Type.STRING, description: "Estimated face shape of the person." },
                        ethnicity: { type: Type.STRING, description: "Estimated ethnicity of the person." },
                        skinTone: { type: Type.STRING, description: "Estimated skin tone of the person." },
                        eyeColor: { type: Type.STRING, description: "Estimated eye color of the person." },
                        distinguishingMarks: { type: Type.STRING, description: "Description of any distinguishing marks." },
                    },
                    required: ["age", "gender", "emotion", "wearingGlasses", "facialHair", "hairColor", "faceShape", "ethnicity", "skinTone", "eyeColor", "distinguishingMarks"],
                },
            },
        });

        const resultText = geminiResponse.text;
        const resultJson = JSON.parse(resultText) as AnalysisResult;
        
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error("Error in /api/analyze:", error);
        const isSafetyError = error instanceof Error && error.message.includes('SAFETY');
        const clientErrorMessage = isSafetyError 
            ? "The image could not be processed due to safety policies. Please try again."
            : "An error occurred while analyzing the image.";
            
        return response.status(500).json({ error: clientErrorMessage });
    }
}
