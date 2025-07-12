'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface VideoMetadata {
  title: string;
  description: string;
  visibility: 'public' | 'unlisted' | 'private';
  tags: string[];
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    visibility: 'public',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Auto-generate title from filename if not set
    if (!metadata.title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setMetadata(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpload = async () => {
    if (!file || !metadata.title.trim()) {
      setUploadStatus('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    setUploadStatus('Getting upload URL...');
    
    try {
      // Get signed URL with metadata
      const result = await generateUploadUrl({
        fileName: file.name,
        contentType: file.type,
        metadata: {
          ...metadata,
          originalFileName: file.name,
          fileSize: file.size
        }
      });

      const data = result.data as { uploadUrl: string; filePath: string };
      setUploadStatus('Uploading video...');

      // Upload file directly to Cloud Storage
      const response = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file
      });

      if (response.ok) {
        setUploadStatus('Upload successful! Video is being processed...');
        
        // Reset form
        setFile(null);
        setMetadata({
          title: '',
          description: '',
          visibility: 'public',
          tags: []
        });
        
        // Redirect to home or my videos after delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadStatus(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to upload videos</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Upload Video</h1>
        
        <div className="bg-dark-surface rounded-lg p-8 border border-dark-border">
          {/* File Upload Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-4">Select Video File</label>
            <div className="border-2 border-dashed border-dark-border hover:border-primary transition-colors rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xl font-medium mb-2">
                  {file ? file.name : 'Choose video file'}
                </p>
                <p className="text-dark-text-secondary">
                  {file 
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : 'MP4, MOV, AVI, or other video formats'
                  }
                </p>
              </label>
            </div>
          </div>

          {/* Metadata Form */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="title">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title..."
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                maxLength={100}
              />
              <p className="text-sm text-dark-text-secondary mt-1">
                {metadata.title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell viewers about your video..."
                rows={4}
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                maxLength={1000}
              />
              <p className="text-sm text-dark-text-secondary mt-1">
                {metadata.description.length}/1000 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-lg font-semibold mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-primary hover:text-primary-light"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={addTag}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-lg font-semibold mb-2">Visibility</label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Public', desc: 'Anyone can search for and view' },
                  { value: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link can view' },
                  { value: 'private', label: 'Private', desc: 'Only you can view' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={metadata.visibility === option.value}
                      onChange={(e) => setMetadata(prev => ({ 
                        ...prev, 
                        visibility: e.target.value as 'public' | 'unlisted' | 'private'
                      }))}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-dark-text-secondary">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className="mt-6 p-4 bg-dark-card border border-dark-border rounded-lg">
              <p className="text-center text-primary">{uploadStatus}</p>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-dark-card hover:bg-dark-border text-dark-text border border-dark-border py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || !metadata.title.trim() || uploading}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}