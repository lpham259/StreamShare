'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export default function VideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');

  const handleUpload = async () => {
    if (!file) return;
  
    setUploading(true);
    setUploadStatus('Getting upload URL...');
    
    try {
      // Get signed URL from Firebase Function
      const result = await generateUploadUrl({
        fileName: file.name,
        contentType: file.type
      });
  
      const data = result.data as { uploadUrl: string; filePath: string };
      
      // Log the URL to debug
      console.log('Upload URL:', data.uploadUrl);
      console.log('File type:', file.type);
      
      setUploadStatus('Uploading video...');
  
      // Upload file directly to Cloud Storage
      const response = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
      });
  
      console.log('Upload response status:', response.status);
      console.log('Upload response:', response);
  
      if (response.ok) {
        setUploadStatus('Upload successful! Video is being processed...');
        setFile(null);
        
        setTimeout(() => {
          setUploadStatus('');
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Fix TypeScript error by checking error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadStatus(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Video</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      {file && (
        <div className="mb-4 text-sm text-gray-600">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
      
      {uploadStatus && (
        <div className="mt-4 text-sm text-gray-600">
          {uploadStatus}
        </div>
      )}
    </div>
  );
}