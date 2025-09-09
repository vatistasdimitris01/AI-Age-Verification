import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { analysisA, analysisB } = request.body;
        if (!analysisA || !analysisB) {
            return response.status(400).json({ error: 'Bad Request: Missing analysis objects' });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on server");
            return response.status(500).json({ error: 'Internal Server Error: Missing API configuration' });
        }
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are a security verification agent. You have received two independent analyses (Analysis A and Analysis B) of a person, generated from two different images of them taken seconds apart during a verification process.
        Your task is to determine if these two analyses are consistent enough to belong to the same person.
        Pay close attention to key biometric identifiers: 'age', 'gender', 'hairColor', 'ethnicity', and 'facialHair'. Minor variations in 'emotion' are acceptable. Age should be very close (within a few years). Other features should match.
        If the analyses are consistent, combine them into a single, definitive 'finalAnalysis' object, using the data from Analysis A as the primary source.
        
        Analysis A: ${JSON.stringify(analysisA)}
        Analysis B: ${JSON.stringify(analysisB)}

        Respond ONLY with a valid JSON object.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                       verificationPassed: { type: Type.BOOLEAN, description: "True if the analyses are consistent and describe the same person." },
                       isConsistent: { type: Type.BOOLEAN, description: "A specific boolean indicating if the two inputs were consistent." },
                       finalAnalysis: {
                           type: Type.OBJECT,
                           nullable: true,
                           properties: {
                                age: { type: Type.INTEGER },
                                gender: { type: Type.STRING },
                                emotion: { type: Type.STRING },
                                wearingGlasses: { type: Type.BOOLEAN },
                                facialHair: { type: Type.STRING },
                                hairColor: { type: Type.STRING },
                                faceShape: { type: Type.STRING },
                                ethnicity: { type: Type.STRING },
                                skinTone: { type: Type.STRING },
                                eyeColor: { type: Type.STRING },
                                distinguishingMarks: { type: Type.STRING },
                           }
                       },
                       reason: { type: Type.STRING, description: "A brief explanation, especially if verification fails (e.g., 'Analyses are consistent', 'Age estimates differ significantly')." },
                    },
                    required: ["verificationPassed", "isConsistent", "finalAnalysis", "reason"],
                },
            },
        });

        const resultJson = JSON.parse(geminiResponse.text);
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error("Error in /api/verify:", error);
        return response.status(500).json({ error: "An error occurred during the final verification step." });
    }
}
