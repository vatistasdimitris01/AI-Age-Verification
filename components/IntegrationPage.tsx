import React, { useState } from 'react';
import { LEGAL_AGE } from '../constants';

const IntegrationPage = () => {
    const vercelUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-deployment-url.vercel.app';
    const [integrationType, setIntegrationType] = useState<'frontend' | 'backend'>('frontend');
    const [backendLanguage, setBackendLanguage] = useState<'nodejs' | 'curl'>('nodejs');

    const frontendSnippet = `<!-- 1. Add the iframe to your page -->
<div id="age-verification-container" style="width: 450px; height: 750px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
  <iframe
    id="age-verification-iframe"
    src="${vercelUrl}"
    style="width: 100%; height: 100%; border: none;"
    allow="camera"
  ></iframe>
</div>

<!-- 2. Add this script to listen for the result -->
<script>
  window.addEventListener('message', (event) => {
    // Security: always check the origin of the message!
    if (event.origin !== '${vercelUrl}') {
      return;
    }

    const { status, result, error } = event.data;

    if (status === 'SUCCESS') {
      console.log('Verification Success:', result);
      if (result.age >= ${LEGAL_AGE}) {
        alert('Success! Access granted.');
        // TODO: Add your logic to unlock content.
      } else {
        alert('Verification Failed: You do not meet the age requirement of ${LEGAL_AGE}.');
      }
    } else if (status === 'ERROR') {
      console.error('Verification Error:', error);
      alert('Verification could not be completed. Reason: ' + error);
    }
  });
<\/script>`;

    const nodejsSnippet = `// This is a Node.js example using fetch.
const API_URL = '${vercelUrl}/api/age';

// In a real application, you would capture these from a user's camera
// during a liveness-checking process on your frontend and send them to your server.
const imageFrames = [
  '<base64_image_frame_1>',
  '<base64_image_frame_2>',
  // ... more frames ...
];

async function verifyUserAge(frames) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ frames }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || \`API request failed with status \${response.status}\`);
    }

    const result = await response.json();
    console.log('Verification Success:', result);
    
    const LEGAL_AGE = ${LEGAL_AGE};
    if (result.age >= LEGAL_AGE) {
      console.log('Access Granted.');
      // TODO: Add your logic to grant access to content.
    } else {
      console.log('Access Denied: User does not meet the age requirement.');
    }
    
    return result;

  } catch (error) {
    console.error('Verification Error:', error.message);
  }
}

verifyUserAge(imageFrames);`;

    const curlSnippet = `# This is a cURL example.
# It can be adapted to any programming language.
# Replace <base64_image_..._> with actual base64 encoded image data.

curl -X POST "${vercelUrl}/api/age" \\
     -H "Content-Type: application/json" \\
     -d '{
           "frames": [
             "<base64_image_frame_1>",
             "<base64_image_frame_2>",
             "..."
           ]
         }'`;

    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        let snippet;
        if (integrationType === 'frontend') {
            snippet = frontendSnippet;
        } else {
            snippet = backendLanguage === 'nodejs' ? nodejsSnippet : curlSnippet;
        }
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const TabButton = ({ type, label }: { type: 'frontend' | 'backend', label: string }) => (
         <button
            onClick={() => setIntegrationType(type)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                integrationType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );
    
    const LanguageButton = ({ lang, label }: { lang: 'nodejs' | 'curl', label: string }) => (
        <button
            onClick={() => setBackendLanguage(lang)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                backendLanguage === lang ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
        >
            {label}
        </button>
    );

    const getSnippet = () => {
        if (integrationType === 'frontend') {
            return frontendSnippet;
        }
        return backendLanguage === 'nodejs' ? nodejsSnippet : curlSnippet;
    }

    return (
        <div className="min-h-screen w-full bg-gray-100 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h1 className="text-xl font-bold text-gray-800">Secure Age Verification</h1>
                    </div>
                     <a href="/" className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        &larr; Back to App
                    </a>
                </nav>
            </header>

            <main className="container mx-auto p-6 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Embed Verification Anywhere</h1>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                           Choose your integration method: a simple iframe for ease of use, or a powerful backend API for full control.
                        </p>
                    </div>
                     <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{integrationType === 'frontend' ? 'Frontend Integration' : 'Backend Integration'}</h2>
                                <p className="mt-1 text-gray-500">{integrationType === 'frontend' ? 'Embed the full UI on your site with an iframe.' : 'Call our API from your server for a custom UI.'}</p>
                            </div>
                            <div className="flex-shrink-0 bg-gray-100 p-1 rounded-lg flex gap-1">
                                <TabButton type="frontend" label="Frontend (iframe)" />
                                <TabButton type="backend" label="Backend (API)" />
                            </div>
                        </div>
                        <div className="bg-gray-800 text-white p-4 relative font-mono text-sm">
                            <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2 z-10">
                                {integrationType === 'backend' && (
                                    <div className="flex-shrink-0 bg-gray-900 p-1 rounded-lg flex gap-1">
                                        <LanguageButton lang="nodejs" label="Node.js" />
                                        <LanguageButton lang="curl" label="cURL" />
                                    </div>
                                )}
                                <button onClick={copyToClipboard} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="overflow-x-auto pt-12"><code className="whitespace-pre-wrap text-xs sm:text-sm">{getSnippet()}</code></pre>
                        </div>
                    </div>
                    
                     <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
                        {integrationType === 'frontend' ? (
                             <ol className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Embed the iframe</h3>
                                        <p className="text-gray-600 mt-1">Place the iframe on your page. The <code>allow="camera"</code> attribute is essential for the verification process to access the user's camera.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">2</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Listen for Results</h3>
                                        <p className="text-gray-600 mt-1">The script adds an event listener that securely waits for a <code>message</code> from the iframe. We check <code>event.origin</code> to ensure the message is from a trusted source.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">3</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Handle the Outcome</h3>
                                        <p className="text-gray-600 mt-1">When the process is complete, the iframe sends a message with a <code>status</code> and a <code>result</code> or <code>error</code> object. Use this data to implement your business logic.</p>
                                    </div>
                                </li>
                            </ol>
                        ) : (
                             <ol className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Capture Liveness Frames</h3>
                                        <p className="text-gray-600 mt-1">On your own frontend, guide the user through a liveness check (e.g., looking center, turning their head) and capture several image frames as base64-encoded strings.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">2</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Call API From Your Backend</h3>
                                        <p className="text-gray-600 mt-1">Send the array of base64 image frames from your frontend to your server. From your server, make a secure POST request to the <code>/api/age</code> endpoint.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">3</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Receive and Use Result</h3>
                                        <p className="text-gray-600 mt-1">The API will perform the full liveness and verification flow. It will return either a final analysis object on success (200 OK) or a detailed error on failure. Use this result on your backend to control access to your content.</p>
                                    </div>
                                </li>
                            </ol>
                        )}
                       
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IntegrationPage;