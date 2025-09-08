import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onReset: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => {
  if (!error) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-4 my-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg shadow-md flex items-start space-x-3" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="font-bold">An Error Occurred</p>
        <p className="text-sm">{error}</p>
        <button onClick={onReset} className="mt-2 text-sm font-semibold underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
          Try again
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;