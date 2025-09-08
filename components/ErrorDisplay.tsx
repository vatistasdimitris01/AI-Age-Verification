import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onReset: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => {
  if (!error) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-6 my-4 bg-red-50 border-2 border-red-200 text-red-900 rounded-xl shadow-sm flex flex-col items-center text-center animate-fade-in" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h3 className="mt-3 text-lg font-semibold">An Error Occurred</h3>
      <p className="mt-1 text-sm">{error}</p>
      <button onClick={onReset} className="mt-4 text-sm font-semibold text-red-700 underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
        Try again
      </button>
    </div>
  );
};

export default ErrorDisplay;
