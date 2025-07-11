'use client';

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface ProcessedVideo {
  resolution: string;
  url: string;
  fileName: string;
}

interface Video {
  id: string;
  title: string;
  status: string;
  createdAt: any;
  processedVideos?: ProcessedVideo[];
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const getVideos = httpsCallable(functions, 'getVideos');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const result = await getVideos();
        setVideos(result.data as Video[]);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    
    // Refresh videos every 10 seconds to check for processed videos
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="text-center py-8">
      <div className="text-gray-600">Loading videos...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Videos</h2>
      
      {videos.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No videos uploaded yet. Upload your first video above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {video.status === 'processed' && video.processedVideos && video.processedVideos.length > 0 ? (
                <video
                  controls
                  className="w-full h-48 object-cover"
                  src={video.processedVideos[0].url}
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    {video.status === 'processing' ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Video not ready'
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {video.title || 'Untitled Video'}
                </h3>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded text-xs ${
                    video.status === 'processed' 
                      ? 'bg-green-100 text-green-700' 
                      : video.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {video.status}
                  </span>
                  {video.processedVideos && video.processedVideos.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {video.processedVideos.length} formats
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}