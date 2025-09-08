import type { AnalysisResult } from '../types';

export const analyzeImageDetails = async (frames: string[]): Promise<AnalysisResult> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ frames }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Use the error message from the API if available, otherwise a generic one.
            throw new Error(result.error || 'Failed to analyze the image.');
        }
        
        const resultJson = result as AnalysisResult;

        if (resultJson.livenessVerified === false) {
            throw new Error("Liveness check failed. Please follow the instructions carefully and ensure you are in a well-lit environment.");
        }

        return resultJson;

    } catch (error) {
        console.error("Error analyzing image details:", error);
        if (error instanceof Error) {
            // Re-throw the error to be caught by the UI, which will display it.
            throw error;
        }
        throw new Error("An unknown error occurred during analysis.");
    }
};
