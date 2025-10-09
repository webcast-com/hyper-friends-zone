import { useState, useEffect } from 'react';
import { supabase, Post as PostType } from '../lib/supabase';
import Post from './Post';
import CreatePost from './CreatePost';

export default function Feed() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={loadPosts} />

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <Post key={post.id} post={post} onDelete={loadPosts} />
        ))
      )}
    </div>
  );
}
