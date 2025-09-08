import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey });

export const analyzeImageDetails = async (frames: string[]): Promise<AnalysisResult> => {
    try {
        const imageParts = frames.map(frame => ({
            inlineData: {
                data: frame,
                mimeType: "image/jpeg",
            },
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    ...imageParts,
                    {
                        text: `Perform a strict, two-step analysis on the person in this sequence of images.
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
                        - 'faceShape' (string): Estimated face shape (e.g., 'Oval', 'Round', 'Square'). Null if liveness check failed.`,
                    },
                ],
            },
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

        const resultText = response.text;
        const resultJson = JSON.parse(resultText) as AnalysisResult;
        
        if (resultJson.livenessVerified === false) {
            throw new Error("Liveness check failed. Please follow the instructions carefully and ensure you are in a well-lit environment.");
        }
        
        return resultJson;

    } catch (error)
    {
        console.error("Error analyzing image with Gemini:", error);
        if (error instanceof Error) {
             if (error.message.includes('SAFETY')) {
                throw new Error("The image could not be processed due to safety policies. Please try again.");
             }
             throw error; // Re-throw custom or API errors
        }
        throw new Error("Failed to analyze the image. The AI model might be busy or unable to process it.");
    }
};