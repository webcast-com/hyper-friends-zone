import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn(
    '⚠️ Running in DEMO mode — Supabase env vars not set. Using mock data.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to a real backend.'
  );
}

// ─── Types ───────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes?: Like[];
  comments?: Comment[];
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Friendship = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'rejected';
  requested_by: string;
  created_at: string;
  updated_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  background_color: string;
  created_at: string;
  expires_at: string;
  profiles?: Profile;
};

// ─── Demo mock data ──────────────────────────────────────────────────

const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000001';

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  username: 'DemoUser',
  full_name: 'Demo User',
  avatar_url: '',
  bio: 'Welcome to Hyper Friends Zone! This is a demo profile.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_PROFILES: Profile[] = [
  DEMO_PROFILE,
  {
    id: 'demo-user-2',
    username: 'Alice_Dev',
    full_name: 'Alice Johnson',
    avatar_url: '',
    bio: 'Full-stack developer & coffee enthusiast ☕',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-user-3',
    username: 'BobTheBuilder',
    full_name: 'Bob Williams',
    avatar_url: '',
    bio: 'Building cool things on the web 🛠️',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'demo-user-4',
    username: 'CharlieX',
    full_name: 'Charlie Xu',
    avatar_url: '',
    bio: 'Designer & photographer',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'demo-user-5',
    username: 'DianaEco',
    full_name: 'Diana Edwards',
    avatar_url: '',
    bio: 'Nature lover 🌿',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  },
];

export let demoPosts: Post[] = [
  {
    id: 'demo-post-1',
    user_id: DEMO_USER_ID,
    content: '🚀 Welcome to Hyper Friends Zone! This is a demo post showing the feed works correctly. Connect Supabase to start using the real app!',
    image_url: '',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    profiles: DEMO_PROFILE,
  },
  {
    id: 'demo-post-2',
    user_id: 'demo-user-2',
    content: 'Hey everyone! Just joined the platform. Looking forward to connecting with you all! 🎉',
    image_url: '',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    profiles: DEMO_PROFILES[1],
  },
  {
    id: 'demo-post-3',
    user_id: 'demo-user-3',
    content: 'Just deployed my first project using this stack. The DX is amazing!',
    image_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    profiles: DEMO_PROFILES[2],
  },
  {
    id: 'demo-post-4',
    user_id: 'demo-user-4',
    content: 'Who else is excited about the new stories feature? 📸✨',
    image_url: '',
    created_at: new Date(Date.now() - 21600000).toISOString(),
    updated_at: new Date(Date.now() - 21600000).toISOString(),
    profiles: DEMO_PROFILES[3],
  },
];

export const demoStories: Story[] = [
  {
    id: 'demo-story-1',
    user_id: 'demo-user-2',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=1000&fit=crop',
    caption: 'Mountain vibes 🏔️',
    background_color: '#3B82F6',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 82800000).toISOString(),
    profiles: DEMO_PROFILES[1],
  },
  {
    id: 'demo-story-2',
    user_id: 'demo-user-3',
    image_url: '',
    caption: 'Coding all night long 💻',
    background_color: '#8B5CF6',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    expires_at: new Date(Date.now() + 79200000).toISOString(),
    profiles: DEMO_PROFILES[2],
  },
  {
    id: 'demo-story-3',
    user_id: 'demo-user-3',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=1000&fit=crop',
    caption: 'New project setup 🚀',
    background_color: '#22C55E',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    expires_at: new Date(Date.now() + 81000000).toISOString(),
    profiles: DEMO_PROFILES[2],
  },
  {
    id: 'demo-story-4',
    user_id: 'demo-user-4',
    image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1000&fit=crop',
    caption: 'Sunset views 🌅',
    background_color: '#EC4899',
    created_at: new Date(Date.now() - 10800000).toISOString(),
    expires_at: new Date(Date.now() + 75600000).toISOString(),
    profiles: DEMO_PROFILES[3],
  },
  {
    id: 'demo-story-5',
    user_id: 'demo-user-5',
    image_url: '',
    caption: 'Hello from the other side 🌍',
    background_color: '#06B6D4',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    expires_at: new Date(Date.now() + 72000000).toISOString(),
    profiles: DEMO_PROFILES[4],
  },
];

// ─── In-memory stores (mutable refs) ─────────────────────────────────

let _posts = [...demoPosts];
let _stories = [...demoStories] as any[];
let _likes: any[] = [];
let _comments: any[] = [];
let _follows: any[] = [];
let _friendships: any[] = [];
let _storyViews: any[] = [];

function getStore(table: string): any[] {
  switch (table) {
    case 'posts': return _posts;
    case 'profiles': return [...DEMO_PROFILES];
    case 'stories': return _stories;
    case 'likes': return _likes;
    case 'comments': return _comments;
    case 'follows': return _follows;
    case 'friendships': return _friendships;
    case 'story_views': return _storyViews;
    default: return [];
  }
}

function mutateStore(table: string): any[] {
  switch (table) {
    case 'posts': return _posts;
    case 'stories': return _stories;
    case 'likes': return _likes;
    case 'comments': return _comments;
    case 'follows': return _follows;
    case 'friendships': return _friendships;
    case 'story_views': return _storyViews;
    default: return [];
  }
}

// ─── Demo Supabase shim ──────────────────────────────────────────────

function createDemoShim(): SupabaseClient {
  const authShim = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
  };

  function buildQuery(table: string) {
    return (_cols?: string) => {
      const chain: any = {
        _table: table,
        _filters: [] as any[],
        _order: null as any,
        _limit: null as number | null,
        _single: false,
        _maybeSingle: false,
        eq(col: string, val: any) { chain._filters.push({ type: 'eq', col, val }); return chain; },
        neq(col: string, val: any) { chain._filters.push({ type: 'neq', col, val }); return chain; },
        gt(col: string, val: any) { chain._filters.push({ type: 'gt', col, val }); return chain; },
        gte(col: string, val: any) { chain._filters.push({ type: 'gte', col, val }); return chain; },
        in(col: string, vals: any[]) { chain._filters.push({ type: 'in', col, vals }); return chain; },
        or(expr: string) { chain._filters.push({ type: 'or', expr }); return chain; },
        order(col: string, opts?: any) { chain._order = { col, ...opts }; return chain; },
        limit(n: number) { chain._limit = n; return chain; },
        maybeSingle() { chain._maybeSingle = true; return chain; },
        single() { chain._single = true; return chain; },
        then(resolve: any, reject?: any) {
          try {
            let data = [...getStore(table)];

            for (const f of chain._filters) {
              switch (f.type) {
                case 'eq': data = data.filter(r => r[f.col] === f.val); break;
                case 'neq': data = data.filter(r => r[f.col] !== f.val); break;
                case 'gt': data = data.filter(r => String(r[f.col]) > String(f.val)); break;
                case 'gte': data = data.filter(r => String(r[f.col]) >= String(f.val)); break;
                case 'in': data = data.filter(r => f.vals.includes(r[f.col])); break;
              }
            }

            if (chain._order) {
              const asc = chain._order.ascending !== false;
              const col = chain._order.col;
              data.sort((a, b) => {
                if (a[col] < b[col]) return asc ? -1 : 1;
                if (a[col] > b[col]) return asc ? 1 : -1;
                return 0;
              });
            }

            if (chain._limit) data = data.slice(0, chain._limit);
            if (chain._single || chain._maybeSingle) {
              resolve({ data: data[0] || null, error: null });
            } else {
              resolve({ data, error: null });
            }
          } catch (err) {
            if (reject) reject(err);
            else resolve({ data: null, error: err });
          }
        },
        [Symbol.toStringTag]: 'Promise',
      };
      return chain;
    };
  }

  return {
    auth: authShim,
    from: (table: string) => ({
      select: buildQuery(table),
      insert: (rows: any) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        const store = mutateStore(table);
        for (const row of arr) {
          if (!row.id) row.id = `demo-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          if (!row.created_at) row.created_at = new Date().toISOString();
          store.push(row);
        }
        return Promise.resolve({ data: arr, error: null });
      },
      update: (updates: any) => {
        const chain: any = {
          _filters: [] as any[],
          eq(col: string, val: any) { chain._filters.push({ col, val }); return chain; },
          then(resolve: any) {
            const store = mutateStore(table);
            for (const row of store) {
              if (chain._filters.every((f: any) => row[f.col] === f.val)) {
                Object.assign(row, updates);
              }
            }
            resolve({ data: null, error: null });
          },
          [Symbol.toStringTag]: 'Promise',
        };
        return chain;
      },
      delete: () => {
        const chain: any = {
          _filters: [] as any[],
          eq(col: string, val: any) { chain._filters.push({ col, val }); return chain; },
          then(resolve: any) {
            const store = mutateStore(table);
            const remaining = store.filter(row =>
              !chain._filters.every((f: any) => row[f.col] === f.val)
            );
            if (table === 'posts') _posts = remaining;
            else if (table === 'stories') _stories = remaining;
            resolve({ data: null, error: null });
          },
          [Symbol.toStringTag]: 'Promise',
        };
        return chain;
      },
      upsert: (rows: any) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        const store = mutateStore(table);
        for (const row of arr) {
          const idx = store.findIndex((r: any) =>
            r.id === row.id || (r.story_id === row.story_id && r.user_id === row.user_id)
          );
          if (idx >= 0) Object.assign(store[idx], row);
          else { if (!row.id) row.id = `demo-${table}-${Date.now()}`; store.push(row); }
        }
        return Promise.resolve({ data: arr, error: null });
      },
    }),
  } as unknown as SupabaseClient;
}

// ─── Export the client ────────────────────────────────────────────────

const realClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const supabase: SupabaseClient = isDemoMode ? createDemoShim() : realClient;
