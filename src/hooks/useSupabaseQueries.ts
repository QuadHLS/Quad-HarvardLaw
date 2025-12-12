import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStorageUrl } from '../utils/storage';

/**
 * Example TanStack Query hooks for Supabase queries
 * 
 * These hooks demonstrate how to:
 * - Cache Supabase queries
 * - Deduplicate simultaneous requests
 * - Enable background revalidation
 * - Invalidate cache on mutations
 * 
 * Usage in components:
 * const { data: outlines, isLoading, error } = useOutlines();
 */

// Query Keys - Centralized for consistency
export const queryKeys = {
  outlines: ['outlines'] as const,
  outline: (id: string) => ['outlines', id] as const,
  exams: ['exams'] as const,
  exam: (id: string) => ['exams', id] as const,
  courses: ['courses'] as const,
  userProfile: (userId: string) => ['profiles', userId] as const,
  savedOutlines: (userId: string) => ['savedOutlines', userId] as const,
  savedExams: (userId: string) => ['savedExams', userId] as const,
  feedPosts: (userId: string, feedMode: 'campus' | 'my-courses', limit?: number) => 
    ['feedPosts', userId, feedMode, limit] as const,
};

/**
 * Hook to fetch all outlines
 * Caches results and deduplicates requests
 */
export function useOutlines() {
  return useQuery({
    queryKey: queryKeys.outlines,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    // Data is considered fresh for 5 minutes (set in queryClient)
    // Stale data is kept for 10 minutes
  });
}

/**
 * Hook to fetch all exams
 */
export function useExams() {
  return useQuery({
    queryKey: queryKeys.exams,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch user's saved outlines
 */
export function useSavedOutlines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.savedOutlines(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile?.saved_outlines || profile.saved_outlines.length === 0) {
        return [];
      }

      const { data: outlines, error: outlinesError } = await supabase
        .from('outlines')
        .select('*')
        .in('id', profile.saved_outlines);

      if (outlinesError) throw outlinesError;
      return outlines || [];
    },
    enabled: !!user?.id, // Only run query if user is logged in
  });
}

/**
 * Hook to fetch user profile
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.userProfile(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

/**
 * Example mutation hook for saving an outline
 * Automatically invalidates and refetches saved outlines
 */
export function useSaveOutline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outlineId: string) => {
      if (!user?.id) throw new Error('User not logged in');

      // Get current saved outlines
      const { data: profile } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      const currentSaved = profile?.saved_outlines || [];
      const newSaved = currentSaved.includes(outlineId)
        ? currentSaved.filter((id: string) => id !== outlineId) // Remove if already saved
        : [...currentSaved, outlineId]; // Add if not saved

      const { error } = await supabase
        .from('profiles')
        .update({ saved_outlines: newSaved })
        .eq('id', user.id);

      if (error) throw error;
      return { outlineId, saved: !currentSaved.includes(outlineId) };
    },
    // Invalidate and refetch saved outlines after mutation
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedOutlines(user.id) });
      }
    },
  });
}

/**
 * Example mutation with optimistic update
 * Updates UI immediately, then syncs with server
 */
export function useToggleSaveOutline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outlineId: string) => {
      if (!user?.id) throw new Error('User not logged in');

      const { data: profile } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      const currentSaved = profile?.saved_outlines || [];
      const isCurrentlySaved = currentSaved.includes(outlineId);
      const newSaved = isCurrentlySaved
        ? currentSaved.filter((id: string) => id !== outlineId)
        : [...currentSaved, outlineId];

      const { error } = await supabase
        .from('profiles')
        .update({ saved_outlines: newSaved })
        .eq('id', user.id);

      if (error) throw error;
      return { outlineId, saved: !isCurrentlySaved };
    },
    // Optimistic update - update cache immediately
    onMutate: async (outlineId: string) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.savedOutlines(user.id) });

      // Snapshot the previous value
      const previousSaved = queryClient.getQueryData(queryKeys.savedOutlines(user.id));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.savedOutlines(user.id), (old: any) => {
        const currentSaved = (old || []).map((o: any) => o.id);
        const isSaved = currentSaved.includes(outlineId);
        // Return optimistic data (simplified - in real app, fetch the outline)
        return old; // Keep old data, actual update happens on success
      });

      return { previousSaved };
    },
    // If mutation fails, roll back to previous value
    onError: (err, outlineId, context) => {
      if (context?.previousSaved && user?.id) {
        queryClient.setQueryData(queryKeys.savedOutlines(user.id), context.previousSaved);
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedOutlines(user.id) });
      }
    },
  });
}

/**
 * Hook to fetch feed posts with caching
 * Caches posts so navigating away and back shows cached data immediately
 * while fetching fresh data in the background
 */
export function useFeedPosts(feedMode: 'campus' | 'my-courses', limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.feedPosts(user?.id || '', feedMode, limit),
    queryFn: async () => {
      if (!user?.id) return { posts: [], photoUrls: new Map() };

      // Build query based on feed mode
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedMode === 'my-courses') {
        // Get user's courses from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('classes')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.classes && profile.classes.length > 0) {
          const courseIds = profile.classes.map((course: any) => course.course_id).filter(Boolean);
          if (courseIds.length > 0) {
            query = query.in('course_id', courseIds);
          } else {
            return { posts: [], photoUrls: new Map() };
          }
        } else {
          return { posts: [], photoUrls: new Map() };
        }
      } else {
        // Campus feed - only posts without course_id
        query = query.is('course_id', null);
      }

      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get all unique author IDs and course IDs for batch fetching
      const authorIds = [...new Set((data || []).map((post: any) => post.author_id))];
      const courseIds = [...new Set((data || []).map((post: any) => post.course_id).filter(Boolean))];
      const postIds = (data || []).map((post: any) => post.id);

      // Batch fetch all related data
      const [authorsResult, clubAccountsResult, coursesResult, userLikesResult, likesCountsResult, commentsCountsResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, class_year').in('id', authorIds),
        supabase.from('club_accounts').select('id, name').in('id', authorIds),
        supabase.from('Courses').select('id, course_name').in('id', courseIds),
        supabase.from('likes').select('likeable_id').eq('user_id', user.id).eq('likeable_type', 'post').in('likeable_id', postIds),
        supabase.from('likes').select('likeable_id').eq('likeable_type', 'post').in('likeable_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
      ]);

      const authors = authorsResult.data || [];
      const clubAccounts = clubAccountsResult.data || [];
      const courses = coursesResult.data || [];
      const userLikes = userLikesResult.data || [];
      const likesCounts = likesCountsResult.data || [];
      const commentsCounts = commentsCountsResult.data || [];

      // Create lookup maps
      const authorsMap = new Map(authors.map((a: any) => [a.id, a]));
      const clubAccountsMap = new Map(clubAccounts.map((ca: any) => [ca.id, ca]));
      const coursesMap = new Map(courses.map((c: any) => [c.id, c]));
      const userLikesSet = new Set(userLikes.map((l: any) => l.likeable_id));
      
      const likesCountMap = new Map();
      const commentsCountMap = new Map();
      
      likesCounts.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });
      
      commentsCounts.forEach((comment: any) => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Get poll data for poll posts
      const pollPostIds = (data || []).filter((post: any) => post.post_type === 'poll').map((post: any) => post.id);
      let pollsMap = new Map();
      let pollOptionsMap = new Map();
      let pollVotesMap = new Map();

      if (pollPostIds.length > 0) {
        const { data: polls } = await supabase
          .from('polls')
          .select('*')
          .in('post_id', pollPostIds);

        if (polls && polls.length > 0) {
          const pollIds = polls.map((p: any) => p.id);
          pollsMap = new Map(polls.map((p: any) => [p.post_id, p]));

          const [pollOptionsResult, userPollVotesResult, allPollVotesResult] = await Promise.all([
            supabase.from('poll_options').select('*').in('poll_id', pollIds),
            supabase.from('poll_votes').select('poll_id, option_id').eq('user_id', user.id).in('poll_id', pollIds),
            supabase.from('poll_votes').select('option_id').in('poll_id', pollIds),
          ]);

          const pollOptions = pollOptionsResult.data || [];
          pollOptionsMap = new Map();
          pollOptions.forEach((option: any) => {
            if (!pollOptionsMap.has(option.poll_id)) {
              pollOptionsMap.set(option.poll_id, []);
            }
            pollOptionsMap.get(option.poll_id).push(option);
          });

          const userPollVotes = userPollVotesResult.data || [];
          pollVotesMap = new Map(userPollVotes.map((v: any) => [v.poll_id, v.option_id]));

          const allPollVotes = allPollVotesResult.data || [];
          const voteCounts = new Map();
          allPollVotes.forEach((vote: any) => {
            voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
          });

          pollOptionsMap.forEach((options) => {
            options.forEach((option: any) => {
              option.votes = voteCounts.get(option.id) || 0;
            });
          });
        }
      }

      // Transform posts
      const transformedPosts = (data || []).map((post: any) => {
        const author = authorsMap.get(post.author_id);
        const clubAccount = clubAccountsMap.get(post.author_id);
        const course = post.course_id ? coursesMap.get(post.course_id) : undefined;
        const isLiked = userLikesSet.has(post.id);
        const likesCount = likesCountMap.get(post.id) || 0;
        const commentsCount = commentsCountMap.get(post.id) || 0;
        const isClubAccount = !!clubAccount;

        // Build poll data if exists
        let poll = undefined;
        if (post.post_type === 'poll' && pollsMap.has(post.id)) {
          const pollData = pollsMap.get(post.id);
          const options = pollOptionsMap.get(pollData.id) || [];
          const userVotedOptionId = pollVotesMap.get(pollData.id);
          const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes, 0);

          poll = {
            id: pollData.id,
            question: pollData.question,
            options: options.map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              votes: opt.votes,
            })),
            totalVotes,
            userVotedOptionId,
            expiresAt: pollData.expires_at,
          };
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author_id: post.author_id,
          course_id: post.course_id,
          post_type: post.post_type,
          is_anonymous: post.is_anonymous,
          created_at: post.created_at,
          edited_at: post.edited_at,
          is_edited: !!post.edited_at,
          likes_count: likesCount,
          comments_count: commentsCount,
          photo_url: post.photo_url,
          vid_link: post.vid_link,
          author: isClubAccount
            ? { name: clubAccount.name, year: '' }
            : (author ? { name: author.full_name, year: author.class_year || '' } : undefined),
          course: course && (course as any).course_name ? { name: (course as any).course_name } : undefined,
          isLiked,
          poll,
          isClubAccount,
        };
      });

      // Generate signed URLs for post photos
      const postsWithPhotos = transformedPosts.filter((p: any) => p.photo_url);
      const photoUrlMap = new Map<string, string>();
      
      if (postsWithPhotos.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < postsWithPhotos.length; i += batchSize) {
          const batch = postsWithPhotos.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (post: any) => {
              if (post.photo_url) {
                const signedUrl = await getStorageUrl(post.photo_url, 'post_picture');
                if (signedUrl) {
                  photoUrlMap.set(post.id, signedUrl);
                }
              }
            })
          );
          if (i + batchSize < postsWithPhotos.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }

      return { posts: transformedPosts, photoUrls: photoUrlMap };
    },
    enabled: !!user?.id,
    // Cache for 5 minutes (staleTime from queryClient)
    // Keep in cache for 10 minutes (gcTime from queryClient)
    // This means:
    // - Data is fresh for 5 min (no refetch)
    // - After 5 min, shows cached data but fetches fresh in background
    // - After 10 min, removes from cache
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
}

