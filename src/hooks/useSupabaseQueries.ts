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
  plannerCourses: ['plannerCourses'] as const,
  savedSchedules: (userId: string) => ['savedSchedules', userId] as const,
  directoryUsers: ['directoryUsers'] as const,
  clubs: (userId: string | undefined) => ['clubs', userId] as const,
  reviews: ['reviews'] as const,
  professors: ['professors'] as const,
  professorCourses: ['professorCourses'] as const,
  barReviewEvent: ['barReviewEvent'] as const,
  barReviewAttendees: ['barReviewAttendees'] as const,
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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
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

/**
 * Hook to fetch planner courses
 * Caches courses so navigating away and back shows cached data immediately
 */
export function usePlannerCourses() {
  return useQuery({
    queryKey: queryKeys.plannerCourses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planner')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (!data) return [];

      // Transform the data to handle null values and format properly
      return data.map((course: any) => ({
        id: course.id || '',
        name: course.name || 'TBD',
        course_number: course.course_number || 'TBD',
        term: course.term || 'TBD',
        faculty: course.faculty || 'TBD',
        credits: course.credits || 0,
        type: course.type || 'TBD',
        subject_areas: course.subject_areas || 'TBD',
        delivery_mode: course.delivery_mode || 'TBD',
        days: course.days || 'TBD',
        times: course.times || 'TBD',
        location: course.location || 'TBD',
        course_description: course.course_description || 'TBD',
        requirements: course.requirements || 'TBD'
      }));
    },
    // Cache for 10 minutes (courses don't change often)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch user's saved schedules
 * Caches schedules so navigating away and back shows cached data immediately
 */
export function useSavedSchedules() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.savedSchedules(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('saved_schedules')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, no saved schedules
        return [];
      }

      if (error) throw error;

      return profileData?.saved_schedules || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch directory users
 * Caches users so navigating away and back shows cached data immediately
 */
export function useDirectoryUsers() {
  return useQuery({
    queryKey: queryKeys.directoryUsers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, class_year, section, email')
        .not('full_name', 'is', null)
        .order('full_name');

      if (error) throw error;

      if (!data) return [];

      // Exclude specific emails
      const excludedEmails = [
        '123@jd27.law.harvard.edu', 
        'master@harvard.edu',
        'sr1@harvard.edu',
        'sr2@harvard.edu',
        'sr3@harvard.edu',
        'sr4@harvard.edu',
        'sr5@harvard.edu',
        'sr6@harvard.edu',
        'sr7@harvard.edu'
      ];

      // Transform the data
      return data
        .filter((profile: any) => {
          // Exclude specific emails
          if (excludedEmails.includes(profile.email)) {
            return false;
          }
          // Ensure full_name is not null or empty
          const fullName = (profile.full_name || '').trim();
          return fullName !== '';
        })
        .map((profile: any) => {
          const fullName = (profile.full_name || '').trim();
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          return {
            id: profile.id,
            firstName,
            lastName,
            fullName,
            classYear: profile.class_year || '',
            section: profile.section || ''
          };
        });
    },
    // Cache for 10 minutes (directory doesn't change often)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch clubs with avatar URLs
 * Caches clubs so navigating away and back shows cached data immediately
 */
export function useClubs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.clubs(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_accounts')
        .select('id, name, description, avatar_url, club_tag, member_joins');

      if (error) throw error;

      if (!data) return { clubs: [], avatarUrls: {}, joinedClubs: new Set<string>() };

      const currentUserId = user?.id;
      const joinedSet = new Set<string>();
      
      // Map database data to club format
      const mappedClubs = data.map((club: any) => {
        // Map club_tag to category (case-insensitive)
        const tag = club.club_tag?.toLowerCase().trim();
        let category = 'Other';
        if (tag === 'student practice organization') {
          category = 'SPOs';
        } else if (tag === 'student organization' || tag === 'student-org') {
          category = 'Orgs';
        } else if (tag === 'journal') {
          category = 'Journals';
        }

        // Count members from member_joins array
        const members = Array.isArray(club.member_joins) ? club.member_joins.length : 0;

        // Check if current user is in member_joins array
        if (currentUserId && Array.isArray(club.member_joins) && club.member_joins.includes(currentUserId)) {
          joinedSet.add(club.id);
        }

        return {
          id: club.id,
          name: club.name || '',
          description: club.description || '',
          category: category,
          members: members,
          avatar_url: club.avatar_url,
          club_tag: club.club_tag
        };
      });

      // Fetch avatar URLs for all clubs
      const urlPromises = mappedClubs
        .filter((club: any) => club.avatar_url)
        .map(async (club: any) => {
          const url = await getStorageUrl(club.avatar_url, 'Avatar');
          return { id: club.id, url };
        });

      const urls = await Promise.all(urlPromises);
      const urlMap: Record<string, string> = {};
      urls.forEach(({ id, url }) => {
        if (url) urlMap[id] = url;
      });

      return { clubs: mappedClubs, avatarUrls: urlMap, joinedClubs: joinedSet };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch reviews data
 * Caches reviews so navigating away and back shows cached data immediately
 */
export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch professors
 */
export function useProfessors() {
  return useQuery({
    queryKey: queryKeys.professors,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch courses
 */
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch professor courses relationship
 */
export function useProfessorCourses() {
  return useQuery({
    queryKey: queryKeys.professorCourses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professor_courses')
        .select('*');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch current bar review event
 * Caches event so navigating away and back shows cached data immediately
 */
export function useBarReviewEvent() {
  return useQuery({
    queryKey: queryKeys.barReviewEvent,
    queryFn: async () => {
      // Get current week's event
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 4); // Thursday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      // Fetch current week's event
      const { data: currentEventData, error: currentError } = await supabase
        .from('bar_review_events')
        .select('*')
        .gte('event_date', startOfWeek.toISOString().split('T')[0])
        .lte('event_date', endOfWeek.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (currentError) throw currentError;

      // If no current event, get the most recent event as fallback
      if (!currentEventData) {
        const { data: recentEventData, error: recentError } = await supabase
          .from('bar_review_events')
          .select('*')
          .order('event_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentError) throw recentError;
        return recentEventData;
      }

      return currentEventData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (events can change)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch bar review attendees
 * Caches attendees so navigating away and back shows cached data immediately
 */
export function useBarReviewAttendees() {
  return useQuery({
    queryKey: queryKeys.barReviewAttendees,
    queryFn: async () => {
      // Get all user IDs who RSVPed
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('bar_count')
        .select('identity');

      if (rsvpError) throw rsvpError;

      if (!rsvpData || rsvpData.length === 0) return [];

      // Get user IDs
      const userIds = rsvpData.map((rsvp: { identity: string }) => rsvp.identity);
      
      // Fetch full names from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Extract names and IDs, filter out null/empty names, and sort alphabetically
      const attendeeData = profilesData
        ?.map((profile: { full_name: string; id: string }) => ({
          name: profile.full_name,
          id: profile.id
        }))
        .filter((attendee: { name: string; id: string }) => attendee.name && attendee.name.trim() !== '')
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)) || [];
      
      // If we have fewer names than RSVPs, show a message
      if (attendeeData.length < rsvpData.length) {
        const missingCount = rsvpData.length - attendeeData.length;
        attendeeData.push({
          name: `${missingCount} user${missingCount > 1 ? 's' : ''} (name not available)`,
          id: 'unknown'
        });
      }
      
      return attendeeData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (RSVPs change frequently)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

