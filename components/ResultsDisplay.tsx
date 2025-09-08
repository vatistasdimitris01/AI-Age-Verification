import React from 'react';
import { AnalysisResult } from '../types';
import { LEGAL_AGE } from '../constants';

interface ResultsDisplayProps {
  analysisResult: AnalysisResult;
  onReset: () => void;
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-base text-gray-800">{value}</p>
  </div>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ analysisResult, onReset }) => {
    const isOfLegalAge = analysisResult.age !== null && analysisResult.age >= LEGAL_AGE;
    const verificationStatus = isOfLegalAge ? 'Access Granted' : 'Access Denied';
    const statusColor = isOfLegalAge ? 'bg-green-500' : 'bg-red-600';

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center animate-fade-in">
            <div className={`w-full p-8 rounded-t-2xl shadow-lg ${statusColor} flex flex-col items-center`}>
                {isOfLegalAge ? <CheckCircleIcon /> : <XCircleIcon />}
                <h2 className="text-3xl font-bold text-white mt-4">{verificationStatus}</h2>
                <p className="text-white/80 mt-1">
                    {isOfLegalAge
                        ? `Analysis indicates you meet the age requirement.`
                        : `Analysis indicates you do not meet the age requirement of ${LEGAL_AGE}.`}
                </p>
            </div>
            <div className="w-full p-8 bg-white rounded-b-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-left">Analysis Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-gray-700">
                    <DetailItem label="Estimated Age" value={<span className="font-bold text-lg">{analysisResult.age ?? 'N/A'}</span>} />
                    <DetailItem label="Gender" value={analysisResult.gender ?? 'N/A'} />
                    <DetailItem label="Hair Color" value={analysisResult.hairColor ?? 'N/A'} />
                    <DetailItem label="Face Shape" value={analysisResult.faceShape ?? 'N/A'} />
                    <DetailItem label="Wearing Glasses" value={analysisResult.wearingGlasses === null ? 'N/A' : analysisResult.wearingGlasses ? 'Yes' : 'No'} />
                    <DetailItem label="Facial Hair" value={analysisResult.facialHair ?? 'N/A'} />
                </div>
                <button
                    onClick={onReset}
                    className="mt-8 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Verify Again
                </button>
            </div>
        </div>
    );
}

export default ResultsDisplay;