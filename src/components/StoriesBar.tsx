import { useState, useEffect, useCallback } from 'react';
import { supabase, Story as StoryType, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';
import StoryViewer, { StoryGroup } from './StoryViewer';
import CreateStory from './CreateStory';

export default function StoriesBar() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();

  const loadStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch non-expired stories with profiles, ordered by newest first
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*, profiles(*)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!stories || stories.length === 0) {
        setStoryGroups([]);
        setLoading(false);
        return;
      }

      // Fetch which stories the current user has viewed
      const storyIds = stories.map((s: StoryType) => s.id);
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id)
        .in('story_id', storyIds);

      const viewedSet = new Set(views?.map((v: any) => v.story_id) || []);

      // Group stories by user
      const groupMap = new Map<string, StoryGroup>();
      for (const story of stories) {
        const profile = story.profiles as unknown as Profile;
        if (!profile) continue;

        const existing = groupMap.get(story.user_id);
        if (existing) {
          existing.stories.push(story);
          if (!viewedSet.has(story.id)) existing.hasUnviewed = true;
        } else {
          groupMap.set(story.user_id, {
            user: profile,
            stories: [story],
            hasUnviewed: !viewedSet.has(story.id),
          });
        }
      }

      // Sort: current user first (if they have stories), then unviewed, then viewed
      const groups = Array.from(groupMap.values());
      groups.sort((a, b) => {
        if (a.user.id === user.id) return -1;
        if (b.user.id === user.id) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setStoryGroups(groups);
    } catch (err) {
      console.error('Error loading stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Refresh stories every 60 seconds to expire old ones
  useEffect(() => {
    const interval = setInterval(loadStories, 60000);
    return () => clearInterval(interval);
  }, [loadStories]);

  const openViewer = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const myGroupIndex = storyGroups.findIndex((g) => g.user.id === user?.id);
  const hasMyStories = myGroupIndex >= 0;

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
            {/* Your Story / Add Story button */}
            <button
              onClick={() => {
                if (hasMyStories) {
                  openViewer(myGroupIndex);
                } else {
                  setCreateOpen(true);
                }
              }}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden ${
                    hasMyStories
                      ? 'ring-[3px] ring-offset-2 ring-offset-white ring-blue-500'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}
                >
                  {hasMyStories && storyGroups[myGroupIndex].user.avatar_url ? (
                    <img
                      src={storyGroups[myGroupIndex].user.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.email?.[0].toUpperCase() || 'U'
                  )}
                </div>
                {!hasMyStories && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white group-hover:bg-blue-700 transition-colors">
                    <Plus size={14} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 font-medium w-16 text-center truncate">
                {hasMyStories ? 'Your Story' : 'Add Story'}
              </span>
            </button>

            {/* Other users' stories */}
            {storyGroups
              .filter((g) => g.user.id !== user?.id)
              .map((group) => {
                const originalIndex = storyGroups.indexOf(group);
                return (
                  <button
                    key={group.user.id}
                    onClick={() => openViewer(originalIndex)}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    <div
                      className={`w-16 h-16 rounded-full p-[3px] ${
                        group.hasUnviewed
                          ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {group.user.avatar_url ? (
                            <img
                              src={group.user.avatar_url}
                              alt=""
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            group.user.username[0].toUpperCase()
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium w-16 text-center truncate">
                      {group.user.username}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Story Viewer Overlay */}
      {viewerOpen && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerOpen(false)}
          onStoryDeleted={() => {
            loadStories();
          }}
        />
      )}

      {/* Create Story Modal */}
      {createOpen && (
        <CreateStory
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadStories();
          }}
        />
      )}
    </>
  );
}
