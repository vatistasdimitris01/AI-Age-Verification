import React from 'react';
import { AnalysisResult } from '../types';
import { LEGAL_AGE } from '../constants';

interface ResultsDisplayProps {
  analysisResult: AnalysisResult;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ analysisResult, onReset }) => {
    const isOfLegalAge = analysisResult.age !== null && analysisResult.age >= LEGAL_AGE;
    const verificationStatus = isOfLegalAge ? 'Access Granted' : 'Access Denied';
    const statusColor = isOfLegalAge ? 'text-green-600' : 'text-red-600';

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center text-center">
            <h2 className={`text-3xl font-bold mb-6 ${statusColor}`}>{verificationStatus}</h2>
            <div className="w-full text-left space-y-4 text-gray-700">
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Estimated Age:</span>
                  <span className="font-bold text-lg">{analysisResult.age ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Gender:</span>
                  <span>{analysisResult.gender ?? 'N/A'}</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Hair Color:</span>
                  <span>{analysisResult.hairColor ?? 'N/A'}</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Face Shape:</span>
                  <span>{analysisResult.faceShape ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Wearing Glasses:</span>
                  <span>{analysisResult.wearingGlasses === null ? 'N/A' : analysisResult.wearingGlasses ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold">Facial Hair:</span>
                  <span>{analysisResult.facialHair ?? 'N/A'}</span>
                </div>
            </div>
            <button
                onClick={onReset}
                className="mt-8 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
                Verify Again
            </button>
        </div>
    );
}

export default ResultsDisplay;
