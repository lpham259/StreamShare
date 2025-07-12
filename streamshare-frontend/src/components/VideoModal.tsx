'use client';

import { useEffect } from 'react';

interface ProcessedVideo {
  resolution: string;
  url: string;
  fileName: string;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: any;
  processedVideos?: ProcessedVideo[];
  userId: string;
  userName?: string;
  userAvatar?: string;
  visibility?: string;
  tags?: string[];
  views?: number;
  likes?: number;
  duration?: number;
  thumbnailUrl?: string;
}

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatViews = (views: number = 0): string => {
    if (views < 1000) return `${views} views`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
    return `${(views / 1000000).toFixed(1)}M views`;
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-6xl mx-4 max-h-[90vh] bg-dark-surface rounded-lg overflow-hidden border border-dark-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Video Player Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {video.status === 'processed' && video.processedVideos && video.processedVideos.length > 0 ? (
              <video
                controls
                autoPlay
                className="w-full h-full max-h-[70vh] object-contain"
                src={video.processedVideos[0].url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center py-20">
                {video.status === 'processing' ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-white">Video is still processing...</p>
                    <p className="text-gray-400 text-sm mt-2">Please check back in a few minutes</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white">Video not available</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Video Info Sidebar */}
          <div className="w-full lg:w-96 bg-dark-surface p-6 overflow-y-auto">
            {/* Video Title */}
            <h1 className="text-xl font-bold text-dark-text mb-4 leading-tight">
              {video.title || 'Untitled Video'}
            </h1>

            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-4">
              {video.userAvatar ? (
                <img 
                  src={video.userAvatar} 
                  alt={video.userName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {(video.userName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-dark-text">{video.userName || 'Unknown User'}</p>
                <p className="text-sm text-dark-text-secondary">
                  {formatViews(video.views)} • {formatTimeAgo(video.createdAt)}
                </p>
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-dark-text mb-2">Description</h3>
                <p className="text-dark-text-secondary whitespace-pre-wrap text-sm leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-dark-text mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Video Quality Options */}
            {video.processedVideos && video.processedVideos.length > 1 && (
              <div className="mb-6">
                <h3 className="font-semibold text-dark-text mb-2">Available Qualities</h3>
                <div className="space-y-2">
                  {video.processedVideos.map((processed, index) => (
                    <a
                      key={index}
                      href={processed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-dark-card hover:bg-dark-border p-3 rounded-lg transition-colors"
                    >
                      <span className="text-primary font-medium">{processed.resolution}</span>
                      <span className="text-dark-text-secondary text-sm ml-2">
                        • {processed.fileName}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="mb-4">
              <h3 className="font-semibold text-dark-text mb-2">Status</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                video.status === 'processed' 
                  ? 'bg-green-500/20 text-green-400' 
                  : video.status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {video.status === 'processed' && '✓ '}
                {video.status}
              </span>
              
              {video.visibility && video.visibility !== 'public' && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
                  {video.visibility}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}