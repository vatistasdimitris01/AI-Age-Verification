import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onReset: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => {
  if (!error) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-4 my-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center shadow-md">
      <p><strong>Error:</strong> {error}</p>
      <button onClick={onReset} className="mt-2 font-semibold underline">Try again</button>
    </div>
  );
};

export default ErrorDisplay;
