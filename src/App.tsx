import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Friends from './components/Friends';
import { Home, Users, User, LogOut } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'profile'>('feed');
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">Hyper Friends Zone</h1>

              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'feed'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home size={20} />
                  Feed
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'friends'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users size={20} />
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User size={20} />
                  Profile
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{profile.username}</p>
                {profile.full_name && <p className="text-sm text-gray-500">{profile.full_name}</p>}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {profile.username[0].toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'friends' && <Friends />}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                  {profile.username[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{profile.username}</h2>
                  {profile.full_name && <p className="text-xl text-gray-600">{profile.full_name}</p>}
                </div>
              </div>

              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <p className="text-sm text-gray-500">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
