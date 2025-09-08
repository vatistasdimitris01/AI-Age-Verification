import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { frames } = request.body;
        if (!frames || !Array.isArray(frames) || frames.length === 0) {
            return response.status(400).json({ error: 'Bad Request: Missing or invalid frames' });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on server");
            return response.status(500).json({ error: 'Internal Server Error: Missing API configuration' });
        }
        const ai = new GoogleGenAI({ apiKey });

        const imageParts = frames.map((frame: string) => ({
            inlineData: {
                data: frame,
                mimeType: "image/jpeg",
            },
        }));

        const prompt = `Perform a strict, two-step analysis on the person in this sequence of images.
        Step 1: Liveness & Consistency Check. First, verify these images show the same, real-life person performing a specific, guided, and random sequence of head movements (looking center, then following on-screen prompts like left or right). Are you confident this is a live, genuine, and dynamic check and not a spoof or static image?
        Step 2: Detailed Analysis. If and only if the liveness check passes, analyze the clearest, front-facing image to estimate their details.
        Respond ONLY with a valid JSON object. The object must contain:
        - 'livenessVerified' (boolean): True if the Step 1 check passed, otherwise false.
        - 'age' (number): Estimated age. Null if liveness check failed.
        - 'gender' (string): Estimated gender. Null if liveness check failed.
        - 'emotion' (string): Estimated emotion. Null if liveness check failed.
        - 'wearingGlasses' (boolean): True if wearing glasses. Null if liveness check failed.
        - 'facialHair' (string): Description of facial hair. Null if liveness check failed.
        - 'hairColor' (string): Estimated hair color. Null if liveness check failed.
        - 'faceShape' (string): Estimated face shape (e.g., 'Oval', 'Round', 'Square'). Null if liveness check failed.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        livenessVerified: { type: Type.BOOLEAN, description: "Whether the liveness check was successful." },
                        age: { type: Type.INTEGER, description: "Estimated age of the person." },
                        gender: { type: Type.STRING, description: "Estimated gender of the person." },
                        emotion: { type: Type.STRING, description: "Estimated dominant emotion of the person." },
                        wearingGlasses: { type: Type.BOOLEAN, description: "Whether the person is wearing glasses." },
                        facialHair: { type: Type.STRING, description: "Description of the person's facial hair." },
                        hairColor: { type: Type.STRING, description: "Estimated hair color of the person." },
                        faceShape: { type: Type.STRING, description: "Estimated face shape of the person." },
                    },
                    required: ["livenessVerified", "age", "gender", "emotion", "wearingGlasses", "facialHair", "hairColor", "faceShape"],
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
