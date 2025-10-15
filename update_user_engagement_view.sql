-- Update user_engagement view to include total file size consumption

DROP VIEW IF EXISTS user_engagement;
CREATE VIEW user_engagement AS
SELECT 
    user_id,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as total_previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as total_downloads,
    COUNT(DISTINCT CONCAT(resource_type, ':', resource_id)) as unique_resources_accessed,
    COUNT(*) as total_actions,
    SUM(resource_file_size) as total_file_size_bytes,
    ROUND(SUM(resource_file_size) / 1024.0, 2) as total_file_size_kb,
    ROUND(SUM(resource_file_size) / 1024.0 / 1024.0, 2) as total_file_size_mb,
    MIN(action_timestamp) as first_activity,
    MAX(action_timestamp) as last_activity
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY user_id
ORDER BY total_actions DESC;
