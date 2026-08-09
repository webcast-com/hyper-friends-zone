import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Story as StoryType, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export interface StoryGroup {
  user: Profile;
  stories: StoryType[];
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryDeleted: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ storyGroups, initialGroupIndex, onClose, onStoryDeleted }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(Date.now());
  const { user } = useAuth();

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwnStory = user?.id === currentGroup?.user.id;

  // Record view
  useEffect(() => {
    if (!currentStory || isOwnStory) return;

    const recordView = async () => {
      await supabase
        .from('story_views')
        .upsert(
          { story_id: currentStory.id, user_id: user!.id },
          { onConflict: 'story_id,user_id' }
        );
    };
    recordView();
  }, [currentStory?.id, isOwnStory, user]);

  // Progress timer
  const startProgress = useCallback(() => {
    startTime.current = Date.now();
    setProgress(0);

    if (progressInterval.current) clearInterval(progressInterval.current);

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(progressInterval.current!);
        goNext();
      }
    }, 50);
  }, [groupIndex, storyIndex, storyGroups.length]);

  useEffect(() => {
    if (!paused && imageLoaded) {
      startProgress();
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [groupIndex, storyIndex, paused, imageLoaded, startProgress]);

  // Preload image
  useEffect(() => {
    if (!currentStory) return;
    if (!currentStory.image_url) {
      setImageLoaded(true);
      return;
    }
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = currentStory.image_url;
  }, [currentStory?.id]);

  const goNext = useCallback(() => {
    if (groupIndex < storyGroups.length - 1) {
      if (storyIndex < currentGroup.stories.length - 1) {
        setStoryIndex(storyIndex + 1);
      } else {
        setGroupIndex(groupIndex + 1);
        setStoryIndex(0);
      }
    } else if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      onClose();
    }
  }, [groupIndex, storyIndex, storyGroups.length, currentGroup, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(0);
    }
  }, [groupIndex, storyIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  const handleDelete = async () => {
    if (!currentStory || !isOwnStory) return;
    if (!confirm('Delete this story?')) return;

    await supabase.from('stories').delete().eq('id', currentStory.id);
    onStoryDeleted();

    if (currentGroup.stories.length <= 1) {
      if (storyGroups.length <= 1) {
        onClose();
      } else {
        goNext();
      }
    } else {
      goNext();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (!currentStory || !currentGroup) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white transition-colors p-2"
      >
        <X size={28} />
      </button>

      {/* Navigation arrows */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors p-2 bg-black/20 rounded-full hover:bg-black/40"
        >
          <ChevronLeft size={32} />
        </button>
      )}
      {(groupIndex < storyGroups.length - 1 || storyIndex < currentGroup.stories.length - 1) && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors p-2 bg-black/20 rounded-full hover:bg-black/40"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Story card */}
      <div
        className="relative w-full max-w-[420px] h-[calc(100vh-40px)] max-h-[800px] rounded-2xl overflow-hidden mx-4"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Background */}
        {currentStory.image_url ? (
          <img
            src={currentStory.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backgroundColor: currentStory.background_color || '#3B82F6' }}
          />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {currentGroup.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    idx < storyIndex
                      ? '100%'
                      : idx === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header (avatar + username + time + delete) */}
        <div className="absolute top-8 left-3 right-3 z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50 overflow-hidden">
            {currentGroup.user.avatar_url ? (
              <img
                src={currentGroup.user.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              currentGroup.user.username[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {currentGroup.user.username}
            </p>
            <p className="text-white/60 text-xs">
              {timeAgo(currentStory.created_at)}
            </p>
          </div>
          {isOwnStory && (
            <button
              onClick={handleDelete}
              className="text-white/60 hover:text-red-400 transition-colors p-1"
              title="Delete story"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Caption text */}
        {currentStory.caption && (
          <div className="absolute bottom-8 left-4 right-4 z-20">
            <p className="text-white text-lg font-medium text-center drop-shadow-lg leading-relaxed">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Tap zones for prev/next */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={goPrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={goNext} />
        </div>
      </div>

      {/* Story counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm">
        {groupIndex + 1} / {storyGroups.length}
      </div>
    </div>
  );
}
