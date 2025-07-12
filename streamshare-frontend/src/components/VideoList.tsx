'use client';

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

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

interface VideoListProps {
  showAllVideos?: boolean; // true = show all videos, false = show current user's videos only
}

export default function VideoList({ showAllVideos = true }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const getVideos = httpsCallable(functions, 'getVideos');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await getVideos();
        let fetchedVideos = result.data as Video[];
        
        // Filter videos based on showAllVideos prop
        if (!showAllVideos && user) {
          fetchedVideos = fetchedVideos.filter(video => video.userId === user.uid);
        }
        
        // Filter out private videos if not the owner
        if (showAllVideos) {
          fetchedVideos = fetchedVideos.filter(video => {
            if (video.visibility === 'private') {
              return user && video.userId === user.uid;
            }
            return true; // Show public and unlisted videos
          });
        }
        
        setVideos(fetchedVideos);
        setError('');
      } catch (error) {
        console.error('Error fetching videos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    
    // Refresh videos every 10 seconds to check for processed videos
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, [showAllVideos, user]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatViews = (views: number = 0) => {
    if (views < 1000) return `${views} views`;
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
    return `${(views / 1000000).toFixed(1)}M views`;
  };

  if (loading) return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <div className="text-dark-text-secondary">Loading videos...</div>
    </div>
  );

  if (error) return (
    <div className="text-center py-8">
      <div className="text-red-400 mb-4">Error: {error}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="btn-primary"
      >
        Retry
      </button>
    </div>
  );

  const emptyMessage = showAllVideos 
    ? "No videos have been uploaded yet. Be the first to share something amazing!"
    : "You haven't uploaded any videos yet. Create your first video to get started!";

  const emptyActionText = showAllVideos
    ? "Explore"
    : "Upload Your First Video";

  return (
    <div className="w-full">
      {!showAllVideos && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-text">
            My Videos ({videos.length})
          </h2>
        </div>
      )}
      
      {videos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-text mb-2">{emptyMessage}</h3>
          <p className="text-dark-text-secondary mb-6">
            {showAllVideos 
              ? "Videos will appear here once users start uploading content."
              : "Share your creativity with the world and start building your collection."
            }
          </p>
          {(!showAllVideos || user) && (
            <a href={showAllVideos ? "/upload" : "/upload"} className="btn-primary">
              {emptyActionText}
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-dark-surface rounded-lg overflow-hidden border border-dark-border hover:border-primary/50 transition-all duration-200 group">
              {/* Video Thumbnail/Player */}
              <div className="relative aspect-video bg-dark-card">
                {video.status === 'processed' && video.processedVideos && video.processedVideos.length > 0 ? (
                  <>
                    <video
                      className="w-full h-full object-cover rounded-t-lg"
                      src={video.processedVideos[0].url}
                      poster={video.thumbnailUrl}
                      preload="metadata"
                      onMouseEnter={(e) => {
                        const videoEl = e.target as HTMLVideoElement;
                        videoEl.currentTime = 10; // Jump to 10 seconds for preview
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      {video.status === 'processing' ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-dark-text-secondary text-sm">Processing...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-dark-border rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-dark-text-secondary text-sm">Video not ready</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <div className="flex gap-3">
                  {/* User Avatar */}
                  {showAllVideos && (
                    <div className="flex-shrink-0">
                      {video.userAvatar ? (
                        <img 
                          src={video.userAvatar} 
                          alt={video.userName}
                          className="w-9 h-9 rounded-full"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary text-sm font-medium">
                            {(video.userName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-text line-clamp-2 mb-1">
                      {video.title || 'Untitled Video'}
                    </h3>
                    
                    {showAllVideos && (
                      <p className="text-sm text-dark-text-secondary mb-1">
                        {video.userName || 'Unknown User'}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-dark-text-secondary">
                      <span>{formatViews(video.views)}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(video.createdAt)}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                          {video.visibility}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {video.tags.slice(0, 2).map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-dark-card text-dark-text-secondary text-xs px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {video.tags.length > 2 && (
                          <span className="text-xs text-dark-text-secondary">
                            +{video.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}