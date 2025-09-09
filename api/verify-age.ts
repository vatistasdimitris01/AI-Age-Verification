import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

// Helper to initialize the AI client, centralizing API key handling.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set on server");
    }
    return new GoogleGenAI({ apiKey });
};

// Internal function to perform the liveness check.
const checkLiveness = async (ai: GoogleGenAI, frames: string[]): Promise<{ livenessVerified: boolean; reason: string }> => {
    const imageParts = frames.map((frame: string) => ({
        inlineData: { data: frame, mimeType: "image/jpeg" },
    }));

    const prompt = `Perform a strict liveness check on this sequence of images. The user was instructed to look center, then perform a series of random head movements.
    Your task is to determine if this is a live, genuine person following the instructions or a spoof attempt (e.g., a static photo, a video replay).
    Analyze the consistency of the person across frames, lighting changes, and subtle non-verbal cues that indicate liveness.
    Respond ONLY with a valid JSON object.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    livenessVerified: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                },
                required: ["livenessVerified", "reason"],
            },
        },
    });

    return JSON.parse(response.text);
};

// Internal function to analyze a single image frame.
const analyzeImage = async (ai: GoogleGenAI, frame: string): Promise<AnalysisResult> => {
    const imagePart = { inlineData: { data: frame, mimeType: "image/jpeg" } };

    const prompt = `Analyze the person in this image and estimate their details.
    Respond ONLY with a valid JSON object containing the following fields: 'age', 'gender', 'emotion', 'wearingGlasses', 'facialHair', 'hairColor', 'faceShape', 'ethnicity', 'skinTone', 'eyeColor', 'distinguishingMarks'.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
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
                },
                required: ["age", "gender", "emotion", "wearingGlasses", "facialHair", "hairColor", "faceShape", "ethnicity", "skinTone", "eyeColor", "distinguishingMarks"],
            },
        },
    });
    return JSON.parse(response.text);
};

// Internal function to verify consistency between two analyses.
const verifyConsistency = async (ai: GoogleGenAI, analysisA: AnalysisResult, analysisB: AnalysisResult): Promise<{ verificationPassed: boolean; finalAnalysis: AnalysisResult | null; reason: string }> => {
    const prompt = `You are a security verification agent. You have received two independent analyses (Analysis A and Analysis B) of a person, generated from two different images of them taken seconds apart.
    Your task is to determine if these two analyses are consistent enough to belong to the same person.
    Pay close attention to key biometric identifiers: 'age', 'gender', 'hairColor', 'ethnicity', and 'facialHair'. Age should be very close (within a few years).
    If the analyses are consistent, combine them into a single, definitive 'finalAnalysis' object, using data from Analysis A as the primary source.
    
    Analysis A: ${JSON.stringify(analysisA)}
    Analysis B: ${JSON.stringify(analysisB)}

    Respond ONLY with a valid JSON object.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                   verificationPassed: { type: Type.BOOLEAN },
                   isConsistent: { type: Type.BOOLEAN },
                   finalAnalysis: {
                       type: Type.OBJECT,
                       nullable: true,
                       properties: {
                            age: { type: Type.INTEGER }, gender: { type: Type.STRING }, emotion: { type: Type.STRING },
                            wearingGlasses: { type: Type.BOOLEAN }, facialHair: { type: Type.STRING }, hairColor: { type: Type.STRING },
                            faceShape: { type: Type.STRING }, ethnicity: { type: Type.STRING }, skinTone: { type: Type.STRING },
                            eyeColor: { type: Type.STRING }, distinguishingMarks: { type: Type.STRING },
                       }
                   },
                   reason: { type: Type.STRING },
                },
                required: ["verificationPassed", "isConsistent", "finalAnalysis", "reason"],
            },
        },
    });
    return JSON.parse(response.text);
};


export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { frames } = request.body;
        if (!frames || !Array.isArray(frames) || frames.length < 2) {
            return response.status(400).json({ error: 'Bad Request: At least two image frames are required.' });
        }

        const ai = getAiClient();

        // Step 1: Liveness Check
        const livenessResult = await checkLiveness(ai, frames);
        if (!livenessResult.livenessVerified) {
            return response.status(403).json({ error: `Liveness check failed: ${livenessResult.reason}` });
        }

        // Step 2: Parallel Analysis
        const [analysisA, analysisB] = await Promise.all([
            analyzeImage(ai, frames[0]), // Center frame
            analyzeImage(ai, frames[1]), // First movement frame
        ]);

        // Step 3: Final Verification
        const verificationDecision = await verifyConsistency(ai, analysisA, analysisB);
        
        if (!verificationDecision.verificationPassed || !verificationDecision.finalAnalysis) {
            return response.status(403).json({ error: `Verification failed: ${verificationDecision.reason}` });
        }

        return response.status(200).json(verificationDecision.finalAnalysis);

    } catch (error) {
        console.error("Error in /api/verify-age:", error);
        return response.status(500).json({ error: error instanceof Error ? error.message : "An unknown internal error occurred." });
    }
}
