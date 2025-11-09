import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface ActivityData {
  user_id: string;
  resource_type: 'outline' | 'exam';
  resource_id: string;
  resource_title: string;
  resource_file_type: string;
  resource_file_size?: number; // File size in bytes
  action_type: 'preview' | 'download';
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Track user activity (preview or download) for outlines and exams
 */
export const trackUserActivity = async (activityData: ActivityData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: activityData.user_id,
        resource_type: activityData.resource_type,
        resource_id: activityData.resource_id,
        resource_title: activityData.resource_title,
        resource_file_type: activityData.resource_file_type,
        resource_file_size: activityData.resource_file_size,
        action_type: activityData.action_type,
        session_id: activityData.session_id || getSessionId(),
        ip_address: activityData.ip_address,
        user_agent: activityData.user_agent || navigator.userAgent,
      });

    if (error) {
      console.error('Error tracking user activity:', error?.message || "Unknown error");
    }
  } catch (error) {
    console.error('Failed to track user activity:', error?.message || "Unknown error");
  }
};

/**
 * Track preview activity
 */
export const trackPreview = async (
  user: User,
  resourceType: 'outline' | 'exam',
  resourceId: string,
  resourceTitle: string,
  resourceFileType: string,
  resourceFileSize?: number
): Promise<void> => {
  await trackUserActivity({
    user_id: user.id,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_title: resourceTitle,
    resource_file_type: resourceFileType,
    resource_file_size: resourceFileSize,
    action_type: 'preview',
  });
};

/**
 * Track download activity
 */
export const trackDownload = async (
  user: User,
  resourceType: 'outline' | 'exam',
  resourceId: string,
  resourceTitle: string,
  resourceFileType: string,
  resourceFileSize?: number
): Promise<void> => {
  await trackUserActivity({
    user_id: user.id,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_title: resourceTitle,
    resource_file_type: resourceFileType,
    resource_file_size: resourceFileSize,
    action_type: 'download',
  });
};

/**
 * Get or create a session ID for tracking
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('activity_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('activity_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Get user activity summary for a specific user and resource
 */
export const getUserActivitySummary = async (
  userId: string,
  resourceType: 'outline' | 'exam',
  resourceId: string
) => {
  try {
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user activity summary:', error?.message || "Unknown error");
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch user activity summary:', error?.message || "Unknown error");
    return null;
  }
};

/**
 * Get resource popularity data
 */
export const getResourcePopularity = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('resource_popularity')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching resource popularity:', error?.message || "Unknown error");
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch resource popularity:', error?.message || "Unknown error");
    return [];
  }
};

/**
 * Check if user has exceeded monthly file size limit
 * Limit: 0.375 GB = 402,653,184 bytes (using binary calculation)
 */
export const checkUserMonthlyLimit = async (userId: string, additionalFileSize: number = 0): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  message?: string;
}> => {
  const MONTHLY_LIMIT_BYTES = 0.375 * 1024 * 1024 * 1024; // 402,653,184 bytes
  
  try {
    const { data, error } = await supabase
      .from('user_engagement')
      .select('total_file_size_bytes')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user monthly limit:', error?.message || "Unknown error");
      return {
        allowed: true, // Allow access on error
        currentUsage: 0,
        limit: MONTHLY_LIMIT_BYTES,
        remaining: MONTHLY_LIMIT_BYTES,
        message: 'Unable to check usage limit'
      };
    }

    // If user doesn't exist in view, they haven't used any data this month
    const currentUsage = data?.total_file_size_bytes || 0;
    const projectedUsage = currentUsage + additionalFileSize;
    
    if (projectedUsage > MONTHLY_LIMIT_BYTES) {
      const remaining = Math.max(0, MONTHLY_LIMIT_BYTES - currentUsage);
      return {
        allowed: false,
        currentUsage,
        limit: MONTHLY_LIMIT_BYTES,
        remaining,
        message: `Monthly limit exceeded. You have ${Math.round(remaining / (1024 * 1024))} MB remaining.`
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit: MONTHLY_LIMIT_BYTES,
      remaining: MONTHLY_LIMIT_BYTES - projectedUsage
    };

  } catch (error) {
    console.error('Failed to check user monthly limit:', error?.message || "Unknown error");
    return {
      allowed: true, // Allow access on error
      currentUsage: 0,
      limit: MONTHLY_LIMIT_BYTES,
      remaining: MONTHLY_LIMIT_BYTES,
      message: 'Unable to check usage limit'
    };
  }
};
