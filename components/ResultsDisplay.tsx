import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { LEGAL_AGE } from '../constants';

interface ResultsDisplayProps {
  analysisResult: AnalysisResult;
  onReset: () => void;
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-base text-gray-900">{value}</p>
  </div>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ analysisResult, onReset }) => {
    const [showMore, setShowMore] = useState(false);
    const isOfLegalAge = analysisResult.age !== null && analysisResult.age >= LEGAL_AGE;
    
    const statusConfig = isOfLegalAge
    ? {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: <CheckCircleIcon />,
        title: 'Verification Successful',
        message: `Analysis indicates you meet the age requirement of ${LEGAL_AGE}.`
      }
    : {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: <XCircleIcon />,
        title: 'Verification Not Successful',
        message: `Analysis indicates you do not meet the age requirement of ${LEGAL_AGE}.`
      };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center animate-fade-in">
            <div className={`w-full p-6 rounded-2xl ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                <div className="flex flex-col items-center gap-3">
                    {statusConfig.icon}
                    <h2 className="text-2xl font-bold">{statusConfig.title}</h2>
                    <p className="text-sm font-medium opacity-90 max-w-xs">{statusConfig.message}</p>
                </div>
            </div>

            <div className="w-full mt-6 text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Analysis Details</h3>
                <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Estimated Age" value={<span className="font-bold text-lg">{analysisResult.age ?? 'N/A'}</span>} />
                    <DetailItem label="Gender" value={analysisResult.gender ?? 'N/A'} />
                    <DetailItem label="Hair Color" value={analysisResult.hairColor ?? 'N/A'} />
                    <DetailItem label="Face Shape" value={analysisResult.faceShape ?? 'N/A'} />
                    <DetailItem label="Wearing Glasses" value={analysisResult.wearingGlasses === null ? 'N/A' : analysisResult.wearingGlasses ? 'Yes' : 'No'} />
                    <DetailItem label="Facial Hair" value={analysisResult.facialHair ?? 'N/A'} />
                </div>
            </div>
            
            <div className="w-full mt-4">
                <button
                    onClick={() => setShowMore(!showMore)}
                    className="w-full text-sm font-semibold text-blue-600 hover:text-blue-800 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {showMore ? 'Hide Advanced Details' : 'Show Advanced Details'}
                </button>

                {showMore && (
                    <div className="mt-4 text-left animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <DetailItem label="Dominant Emotion" value={analysisResult.emotion ?? 'N/A'} />
                            <DetailItem label="Estimated Ethnicity" value={analysisResult.ethnicity ?? 'N/A'} />
                            <DetailItem label="Skin Tone" value={analysisResult.skinTone ?? 'N/A'} />
                            <DetailItem label="Eye Color" value={analysisResult.eyeColor ?? 'N/A'} />
                            <DetailItem label="Distinguishing Marks" value={analysisResult.distinguishingMarks ?? 'N/A'} />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={onReset}
                className="mt-8 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Verify Again
            </button>
        </div>
    );
}

export default ResultsDisplay;