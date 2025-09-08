import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeImageDetails } from './services/geminiService';
import { AnalysisResult, AppState, LivenessDirection, LivenessStep } from './types';
// FIX: Import `NormalizedLandmark` from `@mediapipe/tasks-vision` to resolve type incompatibility.
import { FaceLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';

import IntegrationPage from './components/IntegrationPage';
import VerificationUI from './components/VerificationUI';
import ResultsDisplay from './components/ResultsDisplay';
import ErrorDisplay from './components/ErrorDisplay';

const YAW_THRESHOLD = 20; // degrees for left/right
const SMOOTHING_FACTOR = 0.4; // Lower value = more smoothing, more latency

// FIX: Removed the custom `Landmark` interface and will use `NormalizedLandmark` from the library directly.

const VerificationApp: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [livenessStep, setLivenessStep] = useState<LivenessStep>('CENTER');
  const [livenessSequence, setLivenessSequence] = useState<LivenessDirection[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const capturedFrames = useRef<string[]>([]);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  // FIX: Updated the ref type to `NormalizedLandmark[][]` to match the data structure from MediaPipe and the expectations of `drawConnectors`.
  const smoothedLandmarksRef = useRef<NormalizedLandmark[][]>([]);
  
  const isInsideIframe = window.self !== window.top;

  const resetState = () => {
    setAnalysisResult(null);
    setError(null);
    setAppState('IDLE');
    setLivenessStep('CENTER');
    setLivenessSequence([]);
    setCurrentStepIndex(0);
    setFeedbackMessage(null);
    capturedFrames.current = [];
    smoothedLandmarksRef.current = [];
    setIsTracking(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setupCamera();
  };
  
  const setupCamera = useCallback(async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Webcam not supported by this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 480, height: 640, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Could not access webcam. Please enable it in your browser settings.");
        console.error("Error setting up camera:", err);
      }
    }, []);

  useEffect(() => {
    setupCamera();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      faceLandmarkerRef.current?.close();
    };
  }, [setupCamera]);
  
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    const dataUrl = canvas.toDataURL('image/jpeg');
    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
    capturedFrames.current.push(base64Data);
  }, []);

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    const canvas = canvasRef.current;

    if (!video || !landmarker || !canvas || !video.srcObject || video.readyState < 3) {
      return;
    }
     if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
     }

    try {
        const context = canvas.getContext('2d');
        if (!context || !drawingUtilsRef.current) return;
        
        const results = landmarker.detectForVideo(video, performance.now());
        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const newLandmarks = results.faceLandmarks.map(face => face.map(landmark => ({...landmark})));
            
            if (smoothedLandmarksRef.current.length === 0) {
                smoothedLandmarksRef.current = newLandmarks;
            } else {
                newLandmarks.forEach((face, faceIndex) => {
                    if (smoothedLandmarksRef.current[faceIndex]) {
                        face.forEach((landmark, landmarkIndex) => {
                            const prevLandmark = smoothedLandmarksRef.current[faceIndex][landmarkIndex];
                            landmark.x = landmark.x * SMOOTHING_FACTOR + prevLandmark.x * (1 - SMOOTHING_FACTOR);
                            landmark.y = landmark.y * SMOOTHING_FACTOR + prevLandmark.y * (1 - SMOOTHING_FACTOR);
                            landmark.z = landmark.z * SMOOTHING_FACTOR + prevLandmark.z * (1 - SMOOTHING_FACTOR);
                        });
                    }
                });
                smoothedLandmarksRef.current = newLandmarks;
            }

            setFeedbackMessage(null);
          
            if (appState === 'LIVENESS_CHECK') {
                const matrix = results.facialTransformationMatrixes?.[0]?.data;
                if (matrix) {
                    const yaw = Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI);

                    if (livenessStep === 'CENTER') {
                        if (Math.abs(yaw) < 10) {
                          captureFrame();
                          setLivenessStep(livenessSequence[0]);
                        }
                    } else if (livenessStep !== 'DONE') {
                        const requiredDirection = livenessSequence[currentStepIndex];
                        const movementDetected =
                            (requiredDirection === 'LEFT' && yaw > YAW_THRESHOLD) ||
                            (requiredDirection === 'RIGHT' && yaw < -YAW_THRESHOLD);
                        
                        if(movementDetected) {
                            captureFrame();
                            const nextStepIndex = currentStepIndex + 1;
                            if(nextStepIndex >= livenessSequence.length) {
                                setLivenessStep('DONE');
                            } else {
                                setCurrentStepIndex(nextStepIndex);
                                setLivenessStep(livenessSequence[nextStepIndex]);
                            }
                        }
                    }
                }
            }
        } else {
            smoothedLandmarksRef.current = [];
            setFeedbackMessage("Position your face in the oval.");
        }
        context.restore();
    } catch (e) {
        console.error("Error during landmark detection loop:", e);
        setError("An unexpected error occurred during face tracking.");
        setAppState('IDLE');
        setIsTracking(false);
    }
  }, [livenessStep, captureFrame, appState, livenessSequence, currentStepIndex]);
  
  useEffect(() => {
    if (!isTracking) return;

    const loop = () => {
      predictWebcam();
      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isTracking, predictWebcam]);
  
  useEffect(() => {
    if (livenessStep === 'DONE' && appState === 'LIVENESS_CHECK') {
        setAppState('ANALYZING');
        setError(null);
        setFeedbackMessage(null);
        
        analyzeImageDetails(capturedFrames.current)
            .then(result => {
                if (result.livenessVerified === false) {
                    const livenessError = "Liveness check failed. Please try again and follow the instructions carefully.";
                    setError(livenessError);
                    setAppState('IDLE');
                    if (isInsideIframe) {
                        window.parent.postMessage({ status: 'ERROR', error: livenessError }, '*');
                    }
                    return;
                }
                setAnalysisResult(result);
                if (isInsideIframe) {
                    window.parent.postMessage({ status: 'SUCCESS', result }, '*');
                }
            })
            .catch(err => {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(errorMessage);
                 if (isInsideIframe) {
                    window.parent.postMessage({ status: 'ERROR', error: errorMessage }, '*');
                }
            })
            .finally(() => {
              setAppState('COMPLETE');
              setIsTracking(false);
            });
    }
  }, [livenessStep, appState, isInsideIframe]);


  const startLivenessCheck = async () => {
    if (!videoRef.current || videoRef.current.readyState < 3) {
      setError("Camera is not ready yet. Please wait a moment and try again.");
      return;
    };
    setAppState('INITIALIZING');
    setError(null);
    
    const directions: LivenessDirection[] = ['LEFT', 'RIGHT'];
    // Ensure the sequence isn't the same direction twice in a row for a better check
    const firstDirection = directions[Math.floor(Math.random() * directions.length)];
    const secondDirection = firstDirection === 'LEFT' ? 'RIGHT' : 'LEFT';
    const randomSequence: LivenessDirection[] = [firstDirection, secondDirection];
    
    setLivenessSequence(randomSequence);
    setCurrentStepIndex(0);
    setLivenessStep('CENTER');
  
    try {
        if (!faceLandmarkerRef.current) {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU",
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1,
            });
            const canvas = canvasRef.current;
            if(canvas) {
                const context = canvas.getContext('2d');
                if(context) drawingUtilsRef.current = new DrawingUtils(context);
            }
        }
        setIsTracking(true);
        setAppState('LIVENESS_CHECK');
    } catch (e) {
        console.error(e);
        setError("Failed to initialize the AI model.");
        setAppState('IDLE');
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 ${isInsideIframe ? 'bg-transparent' : ''}`}>
      <div className="w-full max-w-lg mx-auto">
        {!isInsideIframe && (
            <header className="w-full mb-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5.002L10 18.451l7.834-13.449A11.954 11.954 0 0110 1.944zM10 4.167L4.416 12.833h11.168L10 4.167z" clipRule="evenodd" />
                      <path d="M10 1.944A11.954 11.954 0 012.166 5.002L10 18.451l7.834-13.449A11.954 11.954 0 0110 1.944zM10 4.167L4.416 12.833h11.168L10 4.167z" opacity="0.3" />
                    </svg>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Age Verification</h1>
                </div>
                <a href="/integration" className="bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                  Integration Guide
                </a>
            </header>
        )}

        <main className="w-full flex-grow flex flex-col items-center justify-center">
            {appState === 'IDLE' && !error && (
                <p className="text-gray-600 mb-8 max-w-sm text-center">
                    This secure system uses a liveness check and AI analysis to verify your age without storing your personal data.
                </p>
            )}

            <ErrorDisplay error={error} onReset={resetState} />

            {appState === 'COMPLETE' && analysisResult ? (
              <ResultsDisplay analysisResult={analysisResult} onReset={resetState} />
            ) : (
              <VerificationUI
                  appState={appState}
                  livenessStep={livenessStep}
                  livenessSequence={livenessSequence}
                  currentStepIndex={currentStepIndex}
                  feedbackMessage={feedbackMessage}
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  onStartLivenessCheck={startLivenessCheck}
              />
            )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  if (window.location.pathname === '/integration') {
    return <IntegrationPage />;
  }
  return <VerificationApp />;
};

export default App;