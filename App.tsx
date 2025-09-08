import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeImageDetails } from './services/geminiService';
import { AnalysisResult, AppState, LivenessDirection, LivenessStep } from './types';
import { FaceLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';

import IntegrationPage from './components/IntegrationPage';
import VerificationUI from './components/VerificationUI';
import ResultsDisplay from './components/ResultsDisplay';
import ErrorDisplay from './components/ErrorDisplay';

const YAW_THRESHOLD = 20; // degrees for left/right
const PITCH_THRESHOLD = 15; // degrees for up/down
const SMOOTHING_FACTOR = 0.4; // Lower value = more smoothing, more latency

const VerificationApp: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [livenessStep, setLivenessStep] = useState<LivenessStep>('CENTER');
  const [livenessSequence, setLivenessSequence] = useState<LivenessDirection[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const capturedFrames = useRef<string[]>([]);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
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
    setIsCameraReady(false);
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
            videoRef.current.oncanplay = () => {
              setIsCameraReady(true);
            };
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
                    const pitch = Math.atan2(matrix[9], matrix[10]) * (180 / Math.PI);

                    if (livenessStep === 'CENTER') {
                        if (Math.abs(yaw) < 10 && Math.abs(pitch) < 10) {
                          captureFrame();
                          setLivenessStep(livenessSequence[0]);
                        }
                    } else if (livenessStep !== 'DONE') {
                        const requiredDirection = livenessSequence[currentStepIndex];
                        let movementDetected = false;
                        if (requiredDirection === 'LEFT') {
                            movementDetected = yaw > YAW_THRESHOLD;
                        } else if (requiredDirection === 'RIGHT') {
                            movementDetected = yaw < -YAW_THRESHOLD;
                        } else if (requiredDirection === 'UP') {
                            movementDetected = pitch > PITCH_THRESHOLD;
                        } else if (requiredDirection === 'DOWN') {
                            movementDetected = pitch < -PITCH_THRESHOLD;
                        }
                        
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
    setAppState('INITIALIZING');
    setError(null);
    
    const directions: LivenessDirection[] = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
    // Fisher-Yates shuffle for a random sequence
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    
    setLivenessSequence(directions);
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
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 ${isInsideIframe ? 'bg-transparent' : 'bg-gray-50'}`}>
        <div className="w-full max-w-md mx-auto">
            {!isInsideIframe && (
                <header className="w-full mb-6 text-center">
                    <div className="inline-flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Secure Age Verification</h1>
                    </div>
                </header>
            )}

            <main className="w-full bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center min-h-[680px] p-4 sm:p-8">
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
                      isCameraReady={isCameraReady}
                      error={error}
                  />
                )}
            </main>
             {!isInsideIframe && (
                <footer className="mt-6 text-center text-sm text-gray-500">
                    <a href="/integration" className="hover:underline text-blue-600 font-medium transition-colors">
                      View Integration Guide
                    </a>
                </footer>
            )}
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