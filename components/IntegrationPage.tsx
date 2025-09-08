import React, { useState } from 'react';
import { LEGAL_AGE } from '../constants';

const IntegrationPage = () => {
    const vercelUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-deployment-url.vercel.app';
    
    const codeSnippet = `<!-- 1. Add the iframe to your page -->
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
        // e.g., document.getElementById('age-verification-container').style.display = 'none';
      } else {
        alert('Verification Failed: You do not meet the age requirement of ${LEGAL_AGE}.');
      }
    } else if (status === 'ERROR') {
      console.error('Verification Error:', error);
      alert('Verification could not be completed. Reason: ' + error);
    }
  });
</script>`;

    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                            Integrate our secure, AI-powered age verification flow into your website in just two steps using a simple iframe.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Get The Code</h2>
                                <p className="mt-1 text-gray-500">Copy and paste this snippet into your HTML file.</p>
                            </div>
                            <div className="bg-gray-800 text-white p-4 relative font-mono text-sm">
                                <button onClick={copyToClipboard} className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md z-10 transition-colors">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <pre className="overflow-x-auto"><code className="whitespace-pre-wrap text-xs sm:text-sm">{codeSnippet}</code></pre>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
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
                                        <p className="text-gray-600 mt-1">When the process is complete, the iframe sends a message with a <code>status</code> and a <code>result</code> or <code>error</code> object. Use this data to implement your business logic, such as granting access to age-restricted content.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IntegrationPage;
