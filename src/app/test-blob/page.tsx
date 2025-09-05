'use client';

import { useState } from 'react';

export default function TestBlobPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-blob');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch('/api/test-blob', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setUploadResult(data);
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Vercel Blob Test Page</h1>
      
      <div className="space-y-8">
        {/* Connection Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Vercel Blob Connection'}
          </button>
          
          {testResult && (
            <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h3 className="font-medium">{testResult.message}</h3>
              {testResult.blobCount !== undefined && (
                <p className="text-sm text-gray-600 mt-2">Found {testResult.blobCount} blobs in store</p>
              )}
              {testResult.error && (
                <p className="text-sm text-red-600 mt-2">Error: {testResult.error}</p>
              )}
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Upload Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Test</h2>
          <form onSubmit={testUpload} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Choose a file to test upload:
              </label>
              <input
                type="file"
                name="file"
                id="file"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Test Upload'}
            </button>
          </form>
          
          {uploadResult && (
            <div className={`mt-4 p-4 rounded ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h3 className="font-medium">{uploadResult.message}</h3>
              {uploadResult.url && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">File uploaded successfully!</p>
                  <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                    View uploaded file →
                  </a>
                </div>
              )}
              {uploadResult.error && (
                <p className="text-sm text-red-600 mt-2">Error: {uploadResult.error}</p>
              )}
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="border rounded-lg p-6 bg-yellow-50">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>If you see connection errors:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to <a href="https://vercel.com/dashboard" target="_blank" className="text-blue-500 hover:underline">vercel.com/dashboard</a></li>
              <li>Navigate to "Storage" tab</li>
              <li>Click "Create Store" → "Blob"</li>
              <li>Name it "souq-storage"</li>
              <li>Copy the <code className="bg-gray-200 px-1 rounded">BLOB_READ_WRITE_TOKEN</code></li>
              <li>Update your <code className="bg-gray-200 px-1 rounded">.env</code> file</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}