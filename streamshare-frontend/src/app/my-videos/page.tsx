'use client';

import { useAuth } from '../../hooks/useAuth';
import VideoList from '../../components/VideoList';
import Link from 'next/link';

export default function MyVideosPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your videos</h1>
          <Link href="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Same header as home page */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">My Videos</h2>
        <VideoList showAllVideos={false} />
      </div>
    </div>
  );
}