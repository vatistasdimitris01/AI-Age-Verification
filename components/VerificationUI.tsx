import React from 'react';
import { AppState, LivenessDirection, LivenessStep } from '../types';

const LIVENESS_INSTRUCTIONS: Record<LivenessStep, string> = {
  CENTER: 'Look straight at the camera',
  LEFT: 'Turn your head to your left',
  RIGHT: 'Turn your head to your right',
  UP: 'Tilt your head up',
  DOWN: 'Tilt your head down',
  DONE: 'Processing...'
};

const ArrowIcon = ({ direction }: { direction: LivenessDirection }) => {
    const rotationClass = {
        LEFT: 'transform -scale-x-100',
        RIGHT: '',
        UP: 'transform -rotate-90',
        DOWN: 'transform rotate-90'
    }[direction];

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-10 h-10 text-white transition-transform duration-500 animate-pulse ${rotationClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    );
};

const ProgressStep = ({ label, active }: { label: string, active: boolean }) => (
    <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {active ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            ) : (
                <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
            )}
        </div>
        <p className={`mt-2 text-xs font-semibold ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
    </div>
);


interface VerificationUIProps {
    appState: AppState;
    livenessStep: LivenessStep;
    livenessSequence: LivenessDirection[];
    currentStepIndex: number;
    feedbackMessage: string | null;
    analysisProgress: string | null;
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onStartLivenessCheck: () => void;
    isCameraReady: boolean;
    error: string | null;
}

const VerificationUI: React.FC<VerificationUIProps> = ({
    appState,
    livenessStep,
    livenessSequence,
    currentStepIndex,
    feedbackMessage,
    analysisProgress,
    videoRef,
    canvasRef,
    onStartLivenessCheck,
    isCameraReady,
    error
}) => {
    if (error) return null;

    const instruction = LIVENESS_INSTRUCTIONS[livenessStep] || '';

    const steps = ['Center', ...livenessSequence.map(d => d.charAt(0) + d.slice(1).toLowerCase())];
    let activeStepIndex = 0;
    if(livenessStep === 'CENTER') activeStepIndex = 0;
    else if (livenessStep !== 'DONE') activeStepIndex = currentStepIndex + 1;
    else activeStepIndex = steps.length;

    return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
        { appState !== 'IDLE' && (
            <div className="w-full flex justify-around items-start px-4 mb-6">
                {steps.map((step, index) => (
                    <ProgressStep key={step} label={step} active={index < activeStepIndex} />
                ))}
            </div>
        )}
        
        { appState === 'IDLE' && (
             <div className="text-center animate-fade-in mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Ready to Verify?</h2>
                <p className="text-gray-600 mb-2 max-w-xs mx-auto">
                    This secure system uses a liveness check and AI analysis to verify your age without storing your personal data.
                </p>
            </div>
        )}

        <div className="relative w-[300px] h-[450px] sm:w-[320px] sm:h-[480px] rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center transition-all duration-300 shadow-xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full scale-x-[-1] object-cover"></video>
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full scale-x-[-1]"></canvas>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div
                    className={`w-[240px] h-[360px] sm:w-[260px] sm:h-[400px] rounded-[130px] transition-all duration-500 border-4 ${
                        appState === 'ANALYZING'
                        ? 'border-blue-500 animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]'
                        : feedbackMessage ? 'border-orange-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]' : 'border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]'
                    }`}
                ></div>
            </div>

            <div className="absolute inset-0 p-8 flex flex-col items-center justify-between pointer-events-none">
                 {appState === 'LIVENESS_CHECK' && livenessStep !== 'DONE' && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center -mt-16">
                        <p className="text-white text-xl font-bold drop-shadow-md">{instruction}</p>
                        {livenessStep !== 'CENTER' && (
                            <div className="mt-6">
                                <ArrowIcon direction={livenessStep as LivenessDirection} />
                            </div>
                        )}
                    </div>
                 )}

                 {feedbackMessage && (
                    <p className="bg-orange-500/80 backdrop-blur-sm text-white font-medium rounded-lg p-3 inline-block absolute top-10">
                        {feedbackMessage}
                    </p>
                 )}
            </div>

            {(appState === 'INITIALIZING' || appState === 'ANALYZING' || (appState === 'LIVENESS_CHECK' && livenessStep === 'DONE')) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-white font-semibold">
                    {analysisProgress || (appState === 'INITIALIZING' ? 'Initializing...' : 'Analyzing...')}
                </p>
              </div>
            )}
        </div>
        
        {appState === 'IDLE' && (
            <div className="w-full mt-8 flex items-center justify-center">
                <button
                    onClick={onStartLivenessCheck}
                    disabled={!isCameraReady}
                    aria-label="Start liveness check"
                    className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isCameraReady ? 'Start Verification' : 'Initializing Camera...'}
                </button>
            </div>
        )}
    </div>
    );
  };
  
export default VerificationUI;