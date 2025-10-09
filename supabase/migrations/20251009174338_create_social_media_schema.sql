/*
  # Hyper Friends Zone - Social Media Platform Schema

  ## Overview
  Complete social media platform with user profiles, posts, friendships, follows, likes, and comments.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key) - matches auth.users.id
  - `username` (text, unique) - user's display name
  - `full_name` (text) - user's full name
  - `avatar_url` (text) - profile picture URL
  - `bio` (text) - user biography
  - `created_at` (timestamptz) - account creation timestamp
  - `updated_at` (timestamptz) - last profile update

  ### 2. `posts`
  User posts/updates
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - post author
  - `content` (text) - post content
  - `image_url` (text) - optional image attachment
  - `created_at` (timestamptz) - post creation time
  - `updated_at` (timestamptz) - last edit time

  ### 3. `comments`
  Comments on posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, foreign key) - parent post
  - `user_id` (uuid, foreign key) - comment author
  - `content` (text) - comment content
  - `created_at` (timestamptz) - comment creation time

  ### 4. `likes`
  Post likes
  - `id` (uuid, primary key)
  - `post_id` (uuid, foreign key) - liked post
  - `user_id` (uuid, foreign key) - user who liked
  - `created_at` (timestamptz) - like timestamp
  - Unique constraint on (post_id, user_id)

  ### 5. `follows`
  User follow relationships
  - `id` (uuid, primary key)
  - `follower_id` (uuid, foreign key) - user doing the following
  - `following_id` (uuid, foreign key) - user being followed
  - `created_at` (timestamptz) - follow timestamp
  - Unique constraint on (follower_id, following_id)

  ### 6. `friendships`
  Mutual friend relationships
  - `id` (uuid, primary key)
  - `user_id_1` (uuid, foreign key) - first user
  - `user_id_2` (uuid, foreign key) - second user
  - `status` (text) - 'pending', 'accepted', 'rejected'
  - `requested_by` (uuid, foreign key) - who initiated request
  - `created_at` (timestamptz) - request timestamp
  - `updated_at` (timestamptz) - status change timestamp

  ## Security (Row Level Security)

  ### RLS Policies Summary
  1. **Profiles**: Users can read all profiles, update only their own
  2. **Posts**: Users can read all posts, create their own, update/delete only their own
  3. **Comments**: Users can read all comments, create their own, delete only their own
  4. **Likes**: Users can read all likes, create their own, delete only their own
  5. **Follows**: Users can read all follows, create their own, delete only their own
  6. **Friendships**: Users can read friendships they're part of, create requests, update their own requests

  ## Important Notes
  - All tables have RLS enabled for security
  - Timestamps use `timestamptz` for timezone awareness
  - Foreign keys ensure referential integrity
  - Unique constraints prevent duplicate relationships
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id_2 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (user_id_1 != user_id_2)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by AND (auth.uid() = user_id_1 OR auth.uid() = user_id_2));

CREATE POLICY "Users can update friendship status"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id_1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id_2 ON friendships(user_id_2);