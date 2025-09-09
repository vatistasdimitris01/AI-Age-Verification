import type { AnalysisResult, VerificationDecision } from '../types';

export const performSecureVerification = async (
    frames: string[],
    onProgress: (message: string) => void
): Promise<AnalysisResult> => {
    try {
        // Step 1: Liveness Check
        onProgress('Verifying liveness...');
        const livenessResponse = await fetch('/api/liveness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frames }),
        });
        if (!livenessResponse.ok) {
             const errorBody = await livenessResponse.json();
             throw new Error(errorBody.error || 'Liveness check request failed.');
        }
        const livenessResult = await livenessResponse.json();
        if (!livenessResult.livenessVerified) {
            throw new Error(`Liveness check failed: ${livenessResult.reason || 'Please try again.'}`);
        }

        // Step 2: First Analysis (center frame)
        onProgress('Analyzing facial details...');
        const analysisAResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame: frames[0] }),
        });
        if (!analysisAResponse.ok) {
            const errorBody = await analysisAResponse.json();
            throw new Error(errorBody.error || 'First analysis step failed.');
        }
        const analysisA: AnalysisResult = await analysisAResponse.json();

        // Step 3: Second Analysis for consistency (first movement frame)
        onProgress('Performing consistency check...');
        const analysisBResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame: frames[1] }),
        });
        if (!analysisBResponse.ok) {
            const errorBody = await analysisBResponse.json();
            throw new Error(errorBody.error || 'Second analysis step failed.');
        }
        const analysisB: AnalysisResult = await analysisBResponse.json();

        // Step 4: Final Verification
        onProgress('Finalizing verification...');
        const verificationResponse = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysisA, analysisB }),
        });
        if (!verificationResponse.ok) {
            const errorBody = await verificationResponse.json();
            throw new Error(errorBody.error || 'Final verification step failed.');
        }
        const verificationDecision: VerificationDecision = await verificationResponse.json();
        
        if (!verificationDecision.verificationPassed || !verificationDecision.finalAnalysis) {
            throw new Error(`Verification failed: ${verificationDecision.reason || 'Inconsistent results.'}`);
        }

        // Add livenessVerified back into the final result for UI consistency
        verificationDecision.finalAnalysis.livenessVerified = true;
        return verificationDecision.finalAnalysis;

    } catch (error) {
        console.error("Error during secure verification:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred during the verification process.");
    }
};
