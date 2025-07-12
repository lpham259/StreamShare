'use client';

import { useAuth } from '../hooks/useAuth';
import VideoList from '../components/VideoList';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading, signIn, signOutUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Navigation Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Stream</span>Share
          </h1>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-primary font-medium">
              Home
            </Link>
            {user && (
              <>
                <Link href="/my-videos" className="text-dark-text-secondary hover:text-dark-text">
                  My Videos
                </Link>
                <Link href="/upload" className="text-dark-text-secondary hover:text-dark-text">
                  Upload
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  href="/upload"
                  className="btn-primary"
                >
                  Upload Video
                </Link>
                <div className="flex items-center space-x-2">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-dark-text hidden sm:block">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button onClick={signOutUser} className="btn-secondary">
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={signIn} className="btn-primary">
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Discover Videos</h2>
          <p className="text-dark-text-secondary">
            Explore the latest uploads from our community
          </p>
        </div>
        
        <VideoList showAllVideos={true} />
      </main>
    </div>
  );
}