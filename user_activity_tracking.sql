-- User Activity Tracking Table
-- This table stores user interactions with outlines and exams including preview and download counts

CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References the user who performed the action
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('outline', 'exam')), -- Type of resource
    resource_id UUID NOT NULL, -- ID of the outline or exam
    resource_title VARCHAR(500), -- Title of the resource for easier querying
    resource_file_type VARCHAR(10), -- File type (pdf, docx, doc)
    resource_file_size BIGINT, -- File size in bytes
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('preview', 'download')), -- Type of action
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the action occurred
    session_id VARCHAR(100), -- Optional session tracking
    ip_address INET, -- Optional IP tracking for analytics
    user_agent TEXT, -- Optional browser/device info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_resource ON user_activity(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(action_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_resource ON user_activity(user_id, resource_type, resource_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_resource_action ON user_activity(user_id, resource_type, resource_id, action_type);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_activity_updated_at ON user_activity;
CREATE TRIGGER update_user_activity_updated_at 
    BEFORE UPDATE ON user_activity 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for user activity summary (preview and download counts per user per resource)
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    resource_type,
    resource_id,
    resource_title,
    resource_file_type,
    resource_file_size,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as preview_count,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as download_count,
    COUNT(*) as total_actions,
    MIN(action_timestamp) as first_action,
    MAX(action_timestamp) as last_action
FROM user_activity
GROUP BY user_id, resource_type, resource_id, resource_title, resource_file_type, resource_file_size;

-- View for resource popularity (most accessed resources)
CREATE OR REPLACE VIEW resource_popularity AS
SELECT 
    resource_type,
    resource_id,
    resource_title,
    resource_file_type,
    resource_file_size,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as total_previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as total_downloads,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_actions,
    MIN(action_timestamp) as first_accessed,
    MAX(action_timestamp) as last_accessed
FROM user_activity
GROUP BY resource_type, resource_id, resource_title, resource_file_type, resource_file_size
ORDER BY total_actions DESC;

-- View for user engagement (most active users)
CREATE OR REPLACE VIEW user_engagement AS
SELECT 
    user_id,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as total_previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as total_downloads,
    COUNT(DISTINCT CONCAT(resource_type, ':', resource_id)) as unique_resources_accessed,
    COUNT(*) as total_actions,
    MIN(action_timestamp) as first_activity,
    MAX(action_timestamp) as last_activity
FROM user_activity
GROUP BY user_id
ORDER BY total_actions DESC;

-- Sample queries for common use cases:

-- 1. Get preview and download counts for a specific user and resource
/*
SELECT 
    preview_count,
    download_count,
    total_actions,
    first_action,
    last_action
FROM user_activity_summary 
WHERE user_id = 'user-uuid-here' 
    AND resource_type = 'outline' 
    AND resource_id = 'resource-uuid-here';
*/

-- 2. Get most popular resources
/*
SELECT * FROM resource_popularity LIMIT 10;
*/

-- 3. Get most active users
/*
SELECT * FROM user_engagement LIMIT 10;
*/

-- 4. Get activity for a specific user
/*
SELECT 
    resource_type,
    resource_title,
    preview_count,
    download_count,
    total_actions,
    last_action
FROM user_activity_summary 
WHERE user_id = 'user-uuid-here'
ORDER BY last_action DESC;
*/

-- 5. Get daily activity stats
/*
SELECT 
    DATE(action_timestamp) as activity_date,
    action_type,
    COUNT(*) as action_count
FROM user_activity
WHERE action_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(action_timestamp), action_type
ORDER BY activity_date DESC, action_type;
*/

-- 6. Get file type usage statistics
/*
SELECT 
    resource_file_type,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as downloads,
    COUNT(*) as total_actions
FROM user_activity
GROUP BY resource_file_type
ORDER BY total_actions DESC;
*/

-- Comments explaining the table structure:
-- 
-- user_id: Links to your user authentication system
-- resource_type: 'outline' or 'exam' to distinguish between the two types
-- resource_id: The UUID of the specific outline or exam
-- resource_title: Cached title for easier querying (optional but recommended)
-- resource_file_type: File type (pdf, docx, doc) for analytics
-- action_type: 'preview' or 'download' to track different user actions
-- action_timestamp: When the action occurred
-- session_id: Optional for session-based analytics
-- ip_address: Optional for security/analytics
-- user_agent: Optional for device/browser analytics
--
-- The views provide pre-aggregated data for common queries:
-- - user_activity_summary: Per-user, per-resource activity counts
-- - resource_popularity: Most accessed resources across all users
-- - user_engagement: Most active users
