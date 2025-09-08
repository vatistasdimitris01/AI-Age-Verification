import React from 'react';
import { AppState, LivenessDirection, LivenessStep } from '../types';

const LIVENESS_INSTRUCTIONS: Record<LivenessDirection, string> = {
  LEFT: 'Slowly turn your head to your left.',
  RIGHT: 'Now, slowly turn your head to your right.',
};

interface VerificationUIProps {
    appState: AppState;
    livenessStep: LivenessStep;
    livenessSequence: LivenessDirection[];
    currentStepIndex: number;
    feedbackMessage: string | null;
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onStartLivenessCheck: () => void;
}

const VerificationUI: React.FC<VerificationUIProps> = ({
    appState,
    livenessStep,
    livenessSequence,
    currentStepIndex,
    feedbackMessage,
    videoRef,
    canvasRef,
    onStartLivenessCheck
}) => {
    let instruction = 'Press Start to begin the liveness check.';
    if (appState === 'LIVENESS_CHECK') {
        if(livenessStep === 'CENTER') {
            instruction = 'Please look straight into the camera.';
        } else if (livenessStep !== 'DONE') {
            instruction = LIVENESS_INSTRUCTIONS[livenessStep as LivenessDirection];
        }
    }
    const totalSteps = livenessSequence.length + 1; // Center + random sequence
    let completedSteps = 0;
    if (livenessStep !== 'CENTER') {
        completedSteps = currentStepIndex + 1;
    }
     if (livenessStep === 'DONE') {
        completedSteps = totalSteps;
     }

    return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="text-xl h-12 mb-4 text-center flex items-center justify-center font-medium text-gray-600">
            <p className={feedbackMessage ? 'text-orange-500' : ''}>{feedbackMessage || instruction}</p>
        </div>
        <div className="relative w-[320px] h-[480px] rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center transition-all duration-300">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full scale-x-[-1] object-cover"></video>
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full scale-x-[-1]"></canvas>
        </div>
        <div className="flex justify-center items-center mt-8 h-24">
            {appState === 'IDLE' && (
                <button
                    onClick={onStartLivenessCheck}
                    aria-label="Start liveness check"
                    className="bg-white text-black font-bold w-24 h-24 rounded-full border-2 border-black flex items-center justify-center text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                    Start
                </button>
            )}
            {(appState === 'INITIALIZING' || appState === 'ANALYZING') && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-600">{appState === 'INITIALIZING' ? 'Initializing...' : 'Analyzing...'}</p>
              </div>
            )}
            {appState === 'LIVENESS_CHECK' && livenessSequence.length > 0 && (
               <div className="flex space-x-4 items-center">
                    {[...Array(totalSteps)].map((_, index) => (
                      <div key={index} className={`w-4 h-4 rounded-full transition-colors ${completedSteps > index ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    ))}
                </div>
            )}
        </div>
    </div>
    );
  };
  
export default VerificationUI;