-- Migration script to add resource_file_size column to existing user_activity table

-- Add the resource_file_size column
ALTER TABLE user_activity 
ADD COLUMN IF NOT EXISTS resource_file_size BIGINT;

-- Drop and recreate views to include the new column
DROP VIEW IF EXISTS user_activity_summary;
CREATE VIEW user_activity_summary AS
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
DROP VIEW IF EXISTS resource_popularity;
CREATE VIEW resource_popularity AS
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
DROP VIEW IF EXISTS user_engagement;
CREATE VIEW user_engagement AS
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
