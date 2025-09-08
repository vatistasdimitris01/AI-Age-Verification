export interface AnalysisResult {
  age: number | null;
  gender: string | null;
  emotion: string | null;
  wearingGlasses: boolean | null;
  facialHair: string | null;
  hairColor: string | null;
  faceShape: string | null;
  livenessVerified: boolean | null;
  ethnicity: string | null;
  skinTone: string | null;
  eyeColor: string | null;
  distinguishingMarks: string | null;
}

export type AppState = 'IDLE' | 'INITIALIZING' | 'LIVENESS_CHECK' | 'ANALYZING' | 'COMPLETE';
export type LivenessDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
export type LivenessStep = 'CENTER' | LivenessDirection | 'DONE';