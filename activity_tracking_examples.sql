-- Examples of how to query the user activity tracking data

-- 1. Get preview and download counts for a specific user and resource
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

-- 2. Get most popular resources (most accessed)
SELECT 
    resource_type,
    resource_title,
    resource_file_type,
    total_previews,
    total_downloads,
    unique_users,
    total_actions,
    first_accessed,
    last_accessed
FROM resource_popularity 
ORDER BY total_actions DESC 
LIMIT 10;

-- 3. Get most active users
SELECT 
    user_id,
    total_previews,
    total_downloads,
    unique_resources_accessed,
    total_actions,
    first_activity,
    last_activity
FROM user_engagement 
ORDER BY total_actions DESC 
LIMIT 10;

-- 4. Get activity for a specific user
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

-- 5. Get daily activity stats for the last 30 days
SELECT 
    DATE(action_timestamp) as activity_date,
    action_type,
    COUNT(*) as action_count
FROM user_activity
WHERE action_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(action_timestamp), action_type
ORDER BY activity_date DESC, action_type;

-- 6. Get file type usage statistics
SELECT 
    resource_file_type,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as downloads,
    COUNT(*) as total_actions
FROM user_activity
GROUP BY resource_file_type
ORDER BY total_actions DESC;

-- 7. Get hourly activity patterns
SELECT 
    EXTRACT(HOUR FROM action_timestamp) as hour_of_day,
    action_type,
    COUNT(*) as action_count
FROM user_activity
WHERE action_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM action_timestamp), action_type
ORDER BY hour_of_day, action_type;

-- 8. Get resource type comparison (outlines vs exams)
SELECT 
    resource_type,
    COUNT(CASE WHEN action_type = 'preview' THEN 1 END) as total_previews,
    COUNT(CASE WHEN action_type = 'download' THEN 1 END) as total_downloads,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_actions
FROM user_activity
GROUP BY resource_type
ORDER BY total_actions DESC;

-- 9. Get user retention data (users who have both previewed and downloaded)
SELECT 
    user_id,
    COUNT(DISTINCT resource_id) as resources_previewed,
    COUNT(DISTINCT CASE WHEN action_type = 'download' THEN resource_id END) as resources_downloaded,
    COUNT(*) as total_actions
FROM user_activity
GROUP BY user_id
HAVING COUNT(DISTINCT CASE WHEN action_type = 'preview' THEN resource_id END) > 0
   AND COUNT(DISTINCT CASE WHEN action_type = 'download' THEN resource_id END) > 0
ORDER BY total_actions DESC;

-- 10. Get recent activity (last 24 hours)
SELECT 
    user_id,
    resource_type,
    resource_title,
    action_type,
    action_timestamp
FROM user_activity
WHERE action_timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY action_timestamp DESC;

-- 11. Get file size statistics
SELECT 
    resource_file_type,
    COUNT(*) as total_files,
    AVG(resource_file_size) as avg_file_size_bytes,
    MIN(resource_file_size) as min_file_size_bytes,
    MAX(resource_file_size) as max_file_size_bytes,
    SUM(resource_file_size) as total_size_bytes,
    ROUND(AVG(resource_file_size) / 1024.0, 2) as avg_file_size_kb,
    ROUND(SUM(resource_file_size) / 1024.0 / 1024.0, 2) as total_size_mb
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY resource_file_type
ORDER BY total_files DESC;

-- 12. Get largest files accessed
SELECT 
    resource_type,
    resource_title,
    resource_file_type,
    resource_file_size,
    ROUND(resource_file_size / 1024.0, 2) as file_size_kb,
    COUNT(*) as access_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY resource_type, resource_id, resource_title, resource_file_type, resource_file_size
ORDER BY resource_file_size DESC
LIMIT 20;

-- 13. Get bandwidth usage by file type
SELECT 
    resource_file_type,
    action_type,
    COUNT(*) as action_count,
    SUM(resource_file_size) as total_bytes_transferred,
    ROUND(SUM(resource_file_size) / 1024.0 / 1024.0, 2) as total_mb_transferred,
    AVG(resource_file_size) as avg_file_size_bytes
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY resource_file_type, action_type
ORDER BY total_bytes_transferred DESC;

-- 14. Get user bandwidth consumption
SELECT 
    user_id,
    COUNT(*) as total_actions,
    SUM(resource_file_size) as total_bytes_consumed,
    ROUND(SUM(resource_file_size) / 1024.0 / 1024.0, 2) as total_mb_consumed,
    COUNT(DISTINCT resource_id) as unique_resources_accessed
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY user_id
ORDER BY total_bytes_consumed DESC
LIMIT 20;

-- 15. Get file size distribution
SELECT 
    CASE 
        WHEN resource_file_size < 1024 THEN '< 1 KB'
        WHEN resource_file_size < 1024 * 1024 THEN '1 KB - 1 MB'
        WHEN resource_file_size < 10 * 1024 * 1024 THEN '1 MB - 10 MB'
        WHEN resource_file_size < 50 * 1024 * 1024 THEN '10 MB - 50 MB'
        ELSE '> 50 MB'
    END as file_size_range,
    COUNT(*) as file_count,
    COUNT(DISTINCT user_id) as unique_users,
    ROUND(AVG(resource_file_size) / 1024.0, 2) as avg_size_kb
FROM user_activity
WHERE resource_file_size IS NOT NULL
GROUP BY 
    CASE 
        WHEN resource_file_size < 1024 THEN '< 1 KB'
        WHEN resource_file_size < 1024 * 1024 THEN '1 KB - 1 MB'
        WHEN resource_file_size < 10 * 1024 * 1024 THEN '1 MB - 10 MB'
        WHEN resource_file_size < 50 * 1024 * 1024 THEN '10 MB - 50 MB'
        ELSE '> 50 MB'
    END
ORDER BY MIN(resource_file_size);
