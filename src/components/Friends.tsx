import { useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, UserMinus, Users, UserCheck, X, Check } from 'lucide-react';

export default function Friends() {
  const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'following' | 'requests'>('discover');
  const [users, setUsers] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadFollowing(),
      loadFriends(),
      loadFriendRequests(),
    ]);

    if (activeTab === 'discover') {
      await loadUsers();
    } else if (activeTab === 'following') {
      await loadFollowingList();
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setUsers(data || []);
  };

  const loadFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowingIds(new Set(data?.map(f => f.following_id) || []));
  };

  const loadFollowingList = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(*)')
      .eq('follower_id', user.id);

    setFollowing(data?.map(f => f.profiles).filter(Boolean) as Profile[] || []);
  };

  const loadFriends = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('*, profiles!friendships_user_id_1_fkey(*)')
      .eq('status', 'accepted')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (data) {
      const friendProfiles: Profile[] = [];
      const ids = new Set<string>();

      data.forEach(friendship => {
        const friendId = friendship.user_id_1 === user.id ? friendship.user_id_2 : friendship.user_id_1;
        ids.add(friendId);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(ids));

      setFriends(profiles || []);
      setFriendIds(ids);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    const { data: received } = await supabase
      .from('friendships')
      .select('*, profiles!friendships_requested_by_fkey(*)')
      .eq('status', 'pending')
      .eq('user_id_2', user.id);

    const { data: sent } = await supabase
      .from('friendships')
      .select('user_id_2')
      .eq('status', 'pending')
      .eq('requested_by', user.id);

    setFriendRequests(received || []);
    setPendingRequestIds(new Set(sent?.map(r => r.user_id_2) || []));
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    if (followingIds.has(userId)) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: userId });

      setFollowingIds(prev => new Set(prev).add(userId));
    }

    if (activeTab === 'following') {
      await loadFollowingList();
    }
  };

  const handleFriendRequest = async (userId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id_1: user.id,
        user_id_2: userId,
        requested_by: user.id,
        status: 'pending',
      });

    if (!error) {
      setPendingRequestIds(prev => new Set(prev).add(userId));
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    await loadData();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    await loadData();
  };

  const renderUser = (profile: Profile) => {
    const isFollowing = followingIds.has(profile.id);
    const isFriend = friendIds.has(profile.id);
    const isPending = pendingRequestIds.has(profile.id);

    return (
      <div key={profile.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.username}</p>
            {profile.full_name && <p className="text-sm text-gray-500">{profile.full_name}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleFollow(profile.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          {!isFriend && !isPending && (
            <button
              onClick={() => handleFriendRequest(profile.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Users size={18} />
              Add Friend
            </button>
          )}

          {isPending && (
            <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center gap-2">
              <UserCheck size={18} />
              Pending
            </div>
          )}

          {isFriend && (
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
              <UserCheck size={18} />
              Friends
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-2 border-b pb-4">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'following'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Following ({followingIds.size})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Requests
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'discover' && users.map(renderUser)}

          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No friends yet. Start adding friends!</p>
              </div>
            ) : friends.map(renderUser)
          )}

          {activeTab === 'following' && (
            following.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">Not following anyone yet.</p>
              </div>
            ) : following.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile.username}</p>
                    {profile.full_name && <p className="text-sm text-gray-500">{profile.full_name}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(profile.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <UserMinus size={18} />
                  Unfollow
                </button>
              </div>
            ))
          )}

          {activeTab === 'requests' && (
            friendRequests.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No pending friend requests.</p>
              </div>
            ) : friendRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {request.profiles.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{request.profiles.username}</p>
                    {request.profiles.full_name && <p className="text-sm text-gray-500">{request.profiles.full_name}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check size={18} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
