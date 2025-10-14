-- Feed Database Setup Script
-- Creates all tables, policies, and indexes for the feed system

-- ==============================================
-- TABLE CREATIONS
-- ==============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS feedcourses CASCADE;

-- 1. feedcourses table (you'll populate this)
CREATE TABLE feedcourses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID REFERENCES feedcourses(id), -- NULL for campus posts
  post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('text', 'poll')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0
);

-- 3. polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. poll_options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text VARCHAR(255) NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. poll_votes table
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- 6. comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id), -- NULL for top-level comments
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

-- 7. likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  likeable_type VARCHAR(20) NOT NULL CHECK (likeable_type IN ('post', 'comment')),
  likeable_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, likeable_type, likeable_id) -- One like per user per item
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedcourses ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
-- No UPDATE or DELETE policies = no editing allowed

-- Comments policies
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
-- No UPDATE or DELETE policies = no editing allowed

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Poll votes policies
CREATE POLICY "Users can view all poll votes" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own poll votes" ON poll_votes FOR ALL USING (auth.uid() = user_id);

-- Read-only policies for other tables
CREATE POLICY "Users can view polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can view poll options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Users can view feedcourses" ON feedcourses FOR SELECT USING (true);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Posts indexes
CREATE INDEX idx_posts_course_id ON posts(course_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- Likes indexes
CREATE INDEX idx_likes_likeable ON likes(likeable_type, likeable_id);

-- Poll votes indexes
CREATE INDEX idx_poll_votes_poll_user ON poll_votes(poll_id, user_id);

-- ==============================================
-- FUNCTIONS FOR COUNT UPDATES
-- ==============================================

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.likeable_type = 'post' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.likeable_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.likeable_type = 'post' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.likeable_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.likeable_type = 'comment' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.likeable_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.likeable_type = 'comment' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.likeable_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update poll votes count
CREATE OR REPLACE FUNCTION update_poll_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options SET votes = votes + 1 WHERE id = NEW.option_id;
    UPDATE polls SET total_votes = total_votes + 1 WHERE id = NEW.poll_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options SET votes = votes - 1 WHERE id = OLD.option_id;
    UPDATE polls SET total_votes = total_votes - 1 WHERE id = OLD.poll_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote switching
    UPDATE poll_options SET votes = votes - 1 WHERE id = OLD.option_id;
    UPDATE poll_options SET votes = votes + 1 WHERE id = NEW.option_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Triggers for post likes count
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Triggers for comment likes count
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Triggers for post comments count
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Triggers for poll votes count
CREATE TRIGGER trigger_update_poll_votes_count
  AFTER INSERT OR DELETE OR UPDATE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_votes_count();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- This script creates:
-- ✅ 7 tables (feedcourses, posts, polls, poll_options, poll_votes, comments, likes)
-- ✅ Row Level Security policies (no edit functionality)
-- ✅ Performance indexes
-- ✅ Auto-updating count functions and triggers
-- ✅ Proper foreign key relationships and constraints
--
-- Next steps:
-- 1. Populate the feedcourses table with your course data
-- 2. The feed system is ready to use!