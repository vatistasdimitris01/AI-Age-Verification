import React from 'react';
import { AppState, LivenessDirection, LivenessStep } from '../types';

const LIVENESS_INSTRUCTIONS: Record<LivenessStep, string> = {
  CENTER: 'Please look straight at the camera.',
  LEFT: 'Slowly turn your head to your left.',
  RIGHT: 'Now, slowly turn your head to your right.',
  DONE: 'Processing your verification...'
};

const ArrowIcon = ({ direction }: { direction: LivenessDirection }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`w-6 h-6 text-white transition-transform duration-300 ${direction === 'LEFT' ? 'transform -scale-x-100' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);


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
    const instruction = appState === 'LIVENESS_CHECK' 
      ? LIVENESS_INSTRUCTIONS[livenessStep] 
      : 'Press Start to begin the verification.';

    const totalSteps = livenessSequence.length + 1; // Center + random sequence
    let completedSteps = 0;
    if (appState === 'LIVENESS_CHECK') {
        if (livenessStep === 'CENTER') {
            completedSteps = 0;
        } else if (livenessStep !== 'DONE') {
            completedSteps = 1 + currentStepIndex;
        }
    } 
    if (livenessStep === 'DONE' || appState === 'ANALYZING' || appState === 'COMPLETE') {
       completedSteps = totalSteps;
    }

    return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="relative w-[320px] h-[480px] rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center transition-all duration-300 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full scale-x-[-1] object-cover"></video>
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full scale-x-[-1]"></canvas>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div
                    className={`w-[260px] h-[400px] rounded-[130px] transition-all duration-500 ${
                        appState === 'ANALYZING'
                        ? 'border-4 border-blue-500 animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]'
                        : `border-2 ${feedbackMessage ? 'border-orange-400' : 'border-white/50'} shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]`
                    }`}
                ></div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 p-4 text-center">
                 {appState === 'LIVENESS_CHECK' && (
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 inline-flex items-center gap-x-3 transition-opacity duration-300">
                        {livenessStep !== 'CENTER' && livenessStep !== 'DONE' && (
                            <ArrowIcon direction={livenessStep} />
                        )}
                        <p className="text-white font-medium">{instruction}</p>
                    </div>
                )}
            </div>
            
            {feedbackMessage && appState !== 'LIVENESS_CHECK' && (
                <div className="absolute top-10 left-0 right-0 p-4 text-center">
                    <p className="bg-orange-500/80 backdrop-blur-sm text-white font-medium rounded-lg p-3 inline-block">
                        {feedbackMessage}
                    </p>
                </div>
            )}
        </div>

        <div className="w-full mt-8 h-24 flex flex-col items-center justify-center space-y-4">
             {(appState === 'LIVENESS_CHECK' && livenessSequence.length > 0) && (
                <div className="w-full px-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {appState === 'IDLE' && (
                <button
                    onClick={onStartLivenessCheck}
                    aria-label="Start liveness check"
                    className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Start Verification
                </button>
            )}

            {(appState === 'INITIALIZING' || appState === 'ANALYZING') && (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-600 font-semibold">{appState === 'INITIALIZING' ? 'Initializing Camera...' : 'Analyzing...'}</p>
              </div>
            )}
        </div>
    </div>
    );
  };
  
export default VerificationUI;