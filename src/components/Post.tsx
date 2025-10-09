import { useState, useEffect } from 'react';
import { supabase, Post as PostType, Comment as CommentType, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';

interface PostProps {
  post: PostType;
  onDelete: () => void;
}

export default function Post({ post, onDelete }: PostProps) {
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<(CommentType & { profiles: Profile })[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadLikes();
    loadComments();
  }, [post.id]);

  const loadLikes = async () => {
    const { data } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', post.id);

    if (data) {
      setLikes(data.map(like => like.user_id));
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as any);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    const isLiked = likes.includes(user.id);

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      setLikes(likes.filter(id => id !== user.id));
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: user.id });

      setLikes([...likes, user.id]);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
        });

      if (error) throw error;

      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this post?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);

    if (!error) {
      onDelete();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      await loadComments();
    }
  };

  const isLiked = user ? likes.includes(user.id) : false;
  const isOwnPost = user?.id === post.user_id;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.profiles?.username || 'Unknown'}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {isOwnPost && (
            <button
              onClick={handleDeletePost}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-lg mb-4 max-h-96 object-cover"
          />
        )}

        <div className="flex items-center gap-6 pt-4 border-t">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="font-medium">{likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="font-medium">{comments.length}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t bg-gray-50 p-6">
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {comment.profiles?.username || 'Unknown'}
                  </p>
                  <p className="text-gray-700 text-sm break-words">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
