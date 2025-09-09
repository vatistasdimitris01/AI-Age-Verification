import React, { useState } from 'react';
import { LEGAL_AGE } from '../constants';

const IntegrationPage = () => {
    const vercelUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-deployment-url.vercel.app';

    // State
    const [integrationType, setIntegrationType] = useState<'frontend' | 'backend'>('frontend');
    const [frontendFramework, setFrontendFramework] = useState<'html' | 'react'>('html');
    const [backendLanguage, setBackendLanguage] = useState<'nodejs' | 'python' | 'java' | 'csharp' | 'reactnative' | 'curl'>('nodejs');
    const [copied, setCopied] = useState(false);

    // --- SNIPPETS ---
    const frontendSnippets = {
        html: `<!-- 1. Add the iframe to your page -->
<div id="age-verification-container" style="width: 450px; height: 750px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
  <iframe
    id="age-verification-iframe"
    src="${vercelUrl}"
    style="width: 100%; height: 100%; border: none;"
    allow="camera"
    title="AI Age Verification"
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
<\/script>`,
        react: `import React, { useEffect } from 'react';

const VERCEL_URL = '${vercelUrl}';
const LEGAL_AGE = ${LEGAL_AGE};

const AgeVerificationComponent = () => {
  useEffect(() => {
    const handleVerificationResult = (event) => {
      if (event.origin !== VERCEL_URL) {
        return; // Security: only accept messages from our domain
      }

      const { status, result, error } = event.data;

      if (status === 'SUCCESS') {
        console.log('Verification Success:', result);
        if (result.age >= LEGAL_AGE) {
          alert('Success! Access granted.');
          // TODO: Add your logic to unlock content.
        } else {
          alert(\`Verification Failed: You do not meet the age requirement of \${LEGAL_AGE}.\`);
        }
      } else if (status === 'ERROR') {
        console.error('Verification Error:', error);
        alert('Verification could not be completed. Reason: ' + error);
      }
    };

    window.addEventListener('message', handleVerificationResult);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleVerificationResult);
    };
  }, []);

  return (
    <div style={{ width: '450px', height: '750px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
      <iframe
        src={VERCEL_URL}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="camera"
        title="AI Age Verification"
      ></iframe>
    </div>
  );
};

export default AgeVerificationComponent;`
    };

    const backendSnippets = {
        nodejs: `// This is a Node.js example using fetch.
const API_URL = '${vercelUrl}/api/age';
const LEGAL_AGE = ${LEGAL_AGE};

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || \`API request failed with status \${response.status}\`);
    }

    const result = await response.json();
    console.log('Verification Success:', result);
    
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

verifyUserAge(imageFrames);`,
        python: `import requests
import json
import base64 # Helper for encoding images

API_URL = "${vercelUrl}/api/age"
LEGAL_AGE = ${LEGAL_AGE}

# Example function to encode a local image file to a base64 string
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def verify_user_age():
    # In a real app, these frames would be captured from a user's camera
    # during a liveness check on your frontend and sent to your server.
    image_frames = [
        "<base64_image_frame_1>",
        "<base64_image_frame_2>",
    ]

    headers = { "Content-Type": "application/json" }
    payload = { "frames": image_frames }

    try:
        response = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=60)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)

        result = response.json()
        print("Verification Success:", result)

        if result.get("age") >= LEGAL_AGE:
            print("Access Granted.")
            # TODO: Add your logic to grant access to content.
        else:
            print("Access Denied: User does not meet the age requirement.")
        return result

    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error: {err}")
        print("Response body:", err.response.text)
    except Exception as err:
        print(f"An error occurred: {err}")

if __name__ == "__main__":
    verify_user_age()`,
        java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

// Using Java 11's built-in HttpClient
public class AgeVerificationClient {

    private static final String API_URL = "${vercelUrl}/api/age";
    private static final int LEGAL_AGE = ${LEGAL_AGE};

    public static void main(String[] args) {
        // In a real application, you would get base64 frames from your frontend.
        String frame1 = "<base64_image_frame_1>";
        String frame2 = "<base64_image_frame_2>";

        // Construct the JSON payload
        String jsonPayload = String.format("{\\"frames\\":[\\"%s\\",\\"%s\\"]}", frame1, frame2);

        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(20))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .timeout(Duration.ofMinutes(1))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                System.out.println("Verification Success!");
                System.out.println("Response Body: " + response.body());
                
                // TODO: Parse the JSON response (using a library like Gson or Jackson)
                // and check the 'age' field against LEGAL_AGE.
            } else {
                System.err.println("Verification Failed. Status code: " + response.statusCode());
                System.err.println("Response Body: " + response.body());
            }

        } catch (Exception e) {
            System.err.println("An error occurred during the API call.");
            e.printStackTrace();
        }
    }
}`,
        csharp: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

// .NET 6+ example
public class AgeVerificationService
{
    private static readonly HttpClient client = new HttpClient();
    private const string ApiUrl = "${vercelUrl}/api/age";
    private const int LegalAge = ${LEGAL_AGE};

    public static async Task VerifyUserAge()
    {
        // In a real app, these frames would be captured from your frontend.
        var imageFrames = new[]
        {
            "<base64_image_frame_1>",
            "<base64_image_frame_2>"
        };

        var payload = new { frames = imageFrames };
        var jsonPayload = JsonSerializer.Serialize(payload);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        try
        {
            client.Timeout = TimeSpan.FromMinutes(1);
            HttpResponseMessage response = await client.PostAsync(ApiUrl, content);
            string responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Verification Success!");
                var analysisResult = JsonSerializer.Deserialize<AnalysisResult>(responseBody);
                if (analysisResult?.Age >= LegalAge) 
                {
                    Console.WriteLine("Access Granted.");
                } 
                else 
                {
                    Console.WriteLine("Access Denied: User does not meet the age requirement.");
                }
            }
            else
            {
                Console.WriteLine($"Verification Failed. Status: {response.StatusCode}, Reason: {responseBody}");
            }
        }
        catch (Exception e)
        {
            Console.WriteLine($"Request error: {e.Message}");
        }
    }

    public class AnalysisResult { public int Age { get; set; } /* ... other fields */ }
}`,
        reactnative: `import { Alert } from 'react-native';

const API_URL = '${vercelUrl}/api/age';
const LEGAL_AGE = ${LEGAL_AGE};

// In your React Native app, you would use a camera library to capture frames.
// This function assumes 'frames' is an array of base64 strings.
const verifyUserAge = async (frames: string[]) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ frames }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Verification API request failed.');
    }

    console.log('Verification Success:', result);
    
    if (result.age >= LEGAL_AGE) {
      Alert.alert('Success', 'Access Granted.');
      // TODO: Add your logic to navigate to protected content.
    } else {
      Alert.alert('Failure', 'You do not meet the age requirement.');
    }
    return result;

  } catch (error) {
    console.error('Verification Error:', error);
    Alert.alert('Error', 'Could not complete verification.');
  }
};

// Example usage:
// const capturedFrames = [ ... ];
// verifyUserAge(capturedFrames);`,
        curl: `# This cURL command can be adapted to any language (C, C++, Go, Ruby, etc.).
# Replace <base64_image_..._> with actual base64 encoded image data.

curl -X POST "${vercelUrl}/api/age" \\
     -H "Content-Type: application/json" \\
     -d '{
           "frames": [
             "<base64_image_frame_1>",
             "<base64_image_frame_2>",
             "..."
           ]
         }'

# Note for C/C++ Developers:
# We recommend using the 'libcurl' library to make HTTP requests.
# The options used in this command (-X POST, -H, -d) map directly
# to libcurl functions like curl_easy_setopt().`
    };

    // --- RENDER LOGIC ---
    const getSnippet = () => {
        if (integrationType === 'frontend') {
            return frontendSnippets[frontendFramework];
        }
        return backendSnippets[backendLanguage];
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getSnippet());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    // --- COMPONENTS ---
    const TopTabButton = ({ type, label }: { type: 'frontend' | 'backend', label: string }) => (
         <button
            onClick={() => setIntegrationType(type)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                integrationType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );
    
    const LanguageButton = ({ lang, label, type }: { lang: string, label: string, type: 'frontend' | 'backend' }) => {
        const isActive = type === 'frontend' ? frontendFramework === lang : backendLanguage === lang;
        const onClick = () => {
            if (type === 'frontend') setFrontendFramework(lang as 'html' | 'react');
            else setBackendLanguage(lang as 'nodejs' | 'python' | 'java' | 'csharp' | 'reactnative' | 'curl');
        };

       return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                isActive ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
        >
            {label}
        </button>
       );
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
                           Choose your integration method: a simple iframe for ease of use, or a powerful backend API for full control.
                        </p>
                    </div>
                     <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{integrationType === 'frontend' ? 'Frontend Integration (iframe)' : 'Backend Integration (API)'}</h2>
                                <p className="mt-1 text-gray-500">{integrationType === 'frontend' ? 'Embed the full UI on your site with an iframe.' : 'Call our API from your server for a custom UI.'}</p>
                            </div>
                            <div className="flex-shrink-0 bg-gray-100 p-1 rounded-lg flex gap-1">
                                <TopTabButton type="frontend" label="Frontend" />
                                <TopTabButton type="backend" label="Backend" />
                            </div>
                        </div>
                        <div className="bg-gray-800 text-white p-4 relative font-mono text-sm">
                            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                               <div className="bg-gray-900 p-1 rounded-lg flex-shrink-0">
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {integrationType === 'frontend' ? (
                                        <>
                                            <LanguageButton lang="html" label="HTML" type="frontend" />
                                            <LanguageButton lang="react" label="React / Vite" type="frontend" />
                                        </>
                                    ) : (
                                        <>
                                            <LanguageButton lang="nodejs" label="Node.js" type="backend" />
                                            <LanguageButton lang="python" label="Python" type="backend" />
                                            <LanguageButton lang="java" label="Java" type="backend" />
                                            <LanguageButton lang="csharp" label="C#" type="backend" />
                                            <LanguageButton lang="reactnative" label="React Native" type="backend" />
                                            <LanguageButton lang="curl" label="cURL" type="backend" />
                                        </>
                                    )}
                                </div>
                               </div>
                                <button onClick={copyToClipboard} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors self-start">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="overflow-x-auto pt-16 sm:pt-12"><code className="whitespace-pre-wrap text-xs sm:text-sm">{getSnippet()}</code></pre>
                        </div>
                    </div>
                    
                     <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
                        {integrationType === 'frontend' ? (
                             <ol className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Embed the Component</h3>
                                        <p className="text-gray-600 mt-1">Place the iframe or React component on your page. The <code>allow="camera"</code> attribute is essential for accessing the user's camera.</p>
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
                                        <p className="text-gray-600 mt-1">When the process is complete, the iframe sends an object with a <code>status</code> and a <code>result</code> or <code>error</code>. Use this data to implement your logic.</p>
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
                                        <p className="text-gray-600 mt-1">Send the array of base64 image frames from your frontend to your server. From your server, make a secure POST request to our <code>/api/age</code> endpoint.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                     <div className="bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">3</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Receive and Use Result</h3>
                                        <p className="text-gray-600 mt-1">The API performs the full liveness and verification flow and returns a final analysis object on success (200 OK) or an error on failure. Use this result on your backend to control access.</p>
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