import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

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

        const prompt = `Perform a strict liveness check on this sequence of images. The user was instructed to look center, then perform a series of random head movements.
        Your task is to determine if this is a live, genuine person following the instructions or a spoof attempt (e.g., a static photo, a video replay).
        Analyze the consistency of the person across frames, lighting changes, and subtle non-verbal cues that indicate liveness.
        Respond ONLY with a valid JSON object.`;

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        livenessVerified: { type: Type.BOOLEAN, description: "True if you are highly confident this is a live person, otherwise false." },
                        reason: { type: Type.STRING, description: "A brief explanation for your decision (e.g., 'Consistent head movement detected', 'Static image detected')." },
                    },
                    required: ["livenessVerified", "reason"],
                },
            },
        });

        const resultJson = JSON.parse(geminiResponse.text);
        return response.status(200).json(resultJson);

    } catch (error) {
        console.error("Error in /api/liveness:", error);
        return response.status(500).json({ error: "An error occurred during the liveness check." });
    }
}
