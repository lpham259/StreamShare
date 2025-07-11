'use client';

import { useAuth } from '@/hooks/useAuth';
import VideoUpload from '@/components/VideoUpload';
import VideoList from '@/components/VideoList';

export default function Home() {
  const { user, loading, signIn, signOutUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">StreamShare</h1>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-700">
                  Welcome, {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={signOutUser}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {user ? (
          <>
            {/* Upload Section */}
            <VideoUpload />
            
            {/* Videos Section */}
            <VideoList />
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to StreamShare
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Upload, process, and share your videos with ease
            </p>
            <div className="max-w-2xl mx-auto text-gray-600">
              <p className="mb-4">
                StreamShare automatically processes your videos into multiple formats,
                making them ready for streaming on any device.
              </p>
              <p>
                Sign in with Google to get started!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}