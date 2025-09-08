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

        if (!response.ok) {
            let errorBody;
            try {
                // Try to parse a JSON error response from the API.
                errorBody = await response.json();
            } catch (e) {
                // If it's not JSON, it's likely a server error page.
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            // Use the error message from the API if available.
            throw new Error(errorBody.error || 'Failed to analyze the image.');
        }
        
        const resultJson = await response.json() as AnalysisResult;

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