import React, { useState } from 'react';
import { LEGAL_AGE } from '../constants';

const IntegrationPage = () => {
    const vercelUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-deployment-url.vercel.app';
    
    const codeSnippet = `<!--
  How to Integrate Age Verification (iFrame Method)
  --------------------------------------------------
  Follow the two steps below for a simple, embedded verification experience.
  Note: The URL in this snippet is dynamically generated based on where this app is hosted.
-->

<!-- STEP 1: Add this iframe to your page where you want the verification to appear. -->
<!-- You may want to show this conditionally (e.g., in a modal or overlay). -->
<div id="age-verification-container" style="width: 450px; height: 750px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
  <iframe
    id="age-verification-iframe"
    src="${vercelUrl}"
    style="width: 100%; height: 100%; border: none;"
    allow="camera"
  ></iframe>
</div>

<!-- STEP 2: Add this script to your page to listen for the result from the iframe. -->
<script>
  window.addEventListener('message', (event) => {
    // Security: always check the origin of the message!
    if (event.origin !== '${vercelUrl}') {
      return;
    }

    // The 'data' property of the event will contain the object we sent from the iframe.
    const { status, result, error } = event.data;

    if (status === 'SUCCESS') {
      console.log('Verification Success:', result);
      
      // Example: Check if the user is of legal age
      if (result.age >= ${LEGAL_AGE}) {
        alert('Success! Access granted.');
        // TODO: Add your logic here to unlock content or redirect.
        // For example, you could hide the iframe:
        // document.getElementById('age-verification-container').style.display = 'none';
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
        <div className="min-h-screen w-full flex flex-col items-center bg-gray-50 p-4 sm:p-8">
            <div className="w-full max-w-4xl">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Integration Guide</h1>
                    <a href="/" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        &larr; Back to Verification
                    </a>
                </header>
                
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <p className="mb-6 text-gray-600 text-lg">
                        Easily embed the age verification process directly into your website using an iframe. This method is secure, straightforward, and provides a seamless experience for your users.
                    </p>

                    <div className="bg-gray-900 text-white rounded-lg p-4 relative font-mono text-sm">
                        <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded z-10">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <pre className="overflow-x-auto"><code className="whitespace-pre">{codeSnippet}</code></pre>
                    </div>

                    <h3 className="text-2xl font-bold mt-8 mb-4">How it Works</h3>
                    <ol className="list-decimal list-inside space-y-4 text-gray-700">
                        <li>
                            <strong>Embed the iframe:</strong> Copy the HTML from Step 1 and place it in your page's body. The <code>allow="camera"</code> attribute is essential, and the <code>src</code> URL is automatically set to this application's deployed address.
                        </li>
                        <li>
                            <strong>Listen for Results:</strong> Copy the script from Step 2. It sets up a listener that securely waits for a message from the iframe. When the verification is complete, this script will receive the result.
                        </li>
                        <li>
                            <strong>Handle the Outcome:</strong> Inside the <code>message</code> event listener, you can check the <code>status</code> and <code>result</code> (or <code>error</code>). Implement your application's logic here, such as granting access to content if the user's age is sufficient.
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPage;