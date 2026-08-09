import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Image, Type, Send } from 'lucide-react';

const BG_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#1E1E1E', '#6B7280',
];

interface CreateStoryProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStory({ onClose, onCreated }: CreateStoryProps) {
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;
    if (mode === 'image' && !imageUrl.trim()) {
      setError('Please provide an image URL');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('stories').insert({
        user_id: user.id,
        image_url: mode === 'image' ? imageUrl.trim() : '',
        caption: caption.trim(),
        background_color: bgColor,
      });

      if (insertError) throw insertError;
      onCreated();
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(err.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Create Story</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 px-5 pt-4">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
              mode === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Image size={18} />
            Photo
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
              mode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Type size={18} />
            Text
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="relative w-full aspect-[9/16] max-h-[280px] rounded-xl overflow-hidden">
            {mode === 'image' && imageUrl ? (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                {caption ? (
                  <p className="text-white text-lg font-medium text-center px-4 drop-shadow-lg">
                    {caption}
                  </p>
                ) : (
                  <p className="text-white/50 text-sm">Preview</p>
                )}
              </div>
            )}
            {/* Caption overlay on image */}
            {mode === 'image' && caption && imageUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <p className="text-white font-medium text-center w-full drop-shadow-lg">
                  {caption}
                </p>
              </div>
            )}
          </div>

          {/* Image URL input */}
          {mode === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          )}

          {/* Background color picker for text mode */}
          {mode === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      bgColor === color
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{caption.length}/200</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (mode === 'image' && !imageUrl.trim())}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {loading ? 'Posting...' : 'Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
