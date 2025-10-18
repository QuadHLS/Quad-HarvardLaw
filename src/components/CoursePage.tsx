import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, MessageSquare, ChevronUp, ChevronDown, GraduationCap, Clock, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';

interface CoursePageOverviewProps {
  courseName: string;
  onBack: () => void;
  onNavigateToOutlines?: (courseName: string, outlineName: string) => void;
  onNavigateToOutlinesPage?: (courseName: string) => void;
  onNavigateToStudentProfile?: (studentName: string) => void;
}

interface UserCourse {
  class: string;
  professor: string;
  schedule?: {
    days: string;
    times: string;
    credits: string;
    location: string;
    semester: string;
    instructor: string;
    course_name: string;
  };
}

interface CoursePost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  course_id?: string;
  post_type: 'text' | 'poll';
  is_anonymous: boolean;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author?: {
    name: string;
    year: string;
    initials?: string;
  };
  isLiked?: boolean;
  poll?: Poll;
  tag?: string;
  timestamp?: string;
  userLiked?: boolean;
  likes?: number;
  replies?: any[];
  comments?: any[];
}


interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}


interface FeedReply {
  id: string;
  author: {
    name: string;
    initials: string;
    year: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  userLiked: boolean;
}

export function CoursePage({ courseName, onNavigateToStudentProfile }: CoursePageOverviewProps) {
  const { user } = useAuth();
  const [userCourse, setUserCourse] = useState<UserCourse | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursePosts, setCoursePosts] = useState<CoursePost[]>([]);
  const [, setPostsLoading] = useState(true);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  
  // Real-time connection status
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Channel references for cleanup - use refs instead of state
  const channelsRef = useRef<{
    postsChannel?: any;
    likesChannel?: any;
    commentsChannel?: any;
    pollVotesChannel?: any;
  }>({});

  const [fetchPostsTimeout, setFetchPostsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Unread tracking state
  const [lastReadTime] = useState<string>('now');
  
  // Post creation state
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<CoursePost | null>(null);
  const [newReplyContent, setNewReplyContent] = useState('');
  
  // Update poll option
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const debouncedFetchPosts = useCallback(() => {
    if (fetchPostsTimeout) {
      clearTimeout(fetchPostsTimeout);
    }
    
    const timeout = setTimeout(async () => {
      await fetchCoursePosts(false); // Background refresh, don't show loading screen
    }, 150); // 150ms debounce
    
    setFetchPostsTimeout(timeout);
  }, [fetchPostsTimeout]);

  // Fetch user's course data from profiles table
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('classes')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile?.classes && Array.isArray(profile.classes)) {
          setUserCourses(profile.classes);
          
          // Find the course that matches the courseName
          const matchingCourse = profile.classes.find((course: UserCourse) => {
            // Handle different course name formats (with/without section numbers)
            const courseClass = course.class || '';
            return courseClass === courseName || 
                   courseClass.startsWith(courseName + ' ') ||
                   courseName.startsWith(courseClass + ' ');
          });

          if (matchingCourse) {
            setUserCourse(matchingCourse);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [user, courseName]);

  // Helper function to clean course names (matches HomePage feed logic exactly)
  const cleanCourseName = (className: string): string => {
    // Clean 1L course names (remove section numbers 1-7)
    const required1LPatterns = [
      'Civil Procedure',
      'Contracts',
      'Criminal Law',
      'Torts',
      'Constitutional Law',
      'Property',
      'Legislation and Regulation'
    ];
    
    for (const pattern of required1LPatterns) {
      if (className.startsWith(pattern + ' ')) {
        return pattern; // Return base name without section number
      }
    }
    
    // Clean "First Year Legal Research and Writing" (remove section numbers/letters)
    if (className.startsWith('First Year Legal Research and Writing ')) {
      return 'First Year Legal Research and Writing';
    }
    
    // Return original name if no cleaning needed
    return className;
  };

  // Fetch posts for this specific course
  const fetchCoursePosts = async (isInitialLoad: boolean = true) => {
    try {
      if (isInitialLoad) {
        setPostsLoading(true);
      }
      
      // Get current user (matches HomePage feed logic exactly)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping fetchCoursePosts');
        setPostsLoading(false);
        return;
      }
      
      const actualCourseName = userCourse?.class || courseName;
      if (!actualCourseName) {
        setPostsLoading(false);
        return;
      }
      

      // Clean the course name to match feedcourses table (same logic as HomePage feed)
      const cleanedCourseName = cleanCourseName(actualCourseName);

      // Get course ID from feedcourses table
      const { data: course } = await supabase
        .from('feedcourses')
        .select('id')
        .eq('name', cleanedCourseName)
        .maybeSingle();

      if (!course) {
        setCoursePosts([]);
        setPostsLoading(false);
        return;
      }

      // Fetch posts for this course
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('course_id', course.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching course posts:', postsError);
        console.error('Error details:', {
          message: postsError.message,
          details: postsError.details,
          hint: postsError.hint,
          code: postsError.code
        });
        setPostsLoading(false);
        return;
      }

      // Fetch authors for posts
      const authorIds = [...new Set(posts?.map((p: any) => p.author_id) || [])];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all user likes for posts (matches HomePage feed logic)
      const postIds = posts?.map((p: any) => p.id) || [];
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all likes counts (matches HomePage feed logic)
      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all comments counts (matches HomePage feed logic)
      const { data: commentsCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      // Create lookup maps for faster access (matches HomePage feed logic)
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      
      // Count likes and comments (matches HomePage feed logic)
      const likesCountMap = new Map();
      const commentsCountMap = new Map();
      
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });
      
      commentsCounts?.forEach((comment: any) => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Get poll data for poll posts
      const pollPostIds = (posts || []).filter((p: any) => p.post_type === 'poll').map((p: any) => p.id);
      let pollsMap = new Map();
      let pollOptionsMap = new Map();
      let pollVotesMap = new Map();

      if (pollPostIds.length > 0) {
        // Batch fetch polls
        const { data: polls } = await supabase
          .from('polls')
          .select('*')
          .in('post_id', pollPostIds);

        if (polls && polls.length > 0) {
          const pollIds = polls.map((p: any) => p.id);
          pollsMap = new Map(polls.map((p: any) => [p.post_id, p]));

          // Batch fetch poll options
          const { data: pollOptions } = await supabase
            .from('poll_options')
            .select('*')
            .in('poll_id', pollIds);

          pollOptionsMap = new Map();
          pollOptions?.forEach((option: any) => {
            if (!pollOptionsMap.has(option.poll_id)) {
              pollOptionsMap.set(option.poll_id, []);
            }
            pollOptionsMap.get(option.poll_id).push(option);
          });

          // Batch fetch user poll votes
          const { data: userPollVotes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id')
            .eq('user_id', user.id)
            .in('poll_id', pollIds);

          pollVotesMap = new Map(userPollVotes?.map((v: any) => [v.poll_id, v.option_id]) || []);

          // Batch fetch all poll votes for counts
          const { data: allPollVotes } = await supabase
            .from('poll_votes')
            .select('option_id')
            .in('poll_id', pollIds);

          // Count votes per option
          const voteCounts = new Map();
          allPollVotes?.forEach((vote: any) => {
            voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
          });

          // Update poll options with vote counts
          pollOptionsMap.forEach((options, _pollId) => {
            options.forEach((option: any) => {
              option.votes = voteCounts.get(option.id) || 0;
            });
          });
        }
      }

      // Transform posts (matches HomePage feed logic)
      const transformedPosts: CoursePost[] = (posts || []).map((post: any) => {
        const author = authorsMap.get(post.author_id);
        const isLiked = userLikesSet.has(post.id);
        const likesCount = likesCountMap.get(post.id) || 0;
        const commentsCount = commentsCountMap.get(post.id) || 0;

        // Handle poll data
        let poll = undefined;
        if (post.post_type === 'poll') {
          const pollData = pollsMap.get(post.id);
          if (pollData) {
            const options = pollOptionsMap.get(pollData.id) || [];
            const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
            const userVotedOptionId = pollVotesMap.get(pollData.id);

            poll = {
              id: pollData.id,
              question: pollData.question,
              options: options,
              totalVotes: totalVotes,
              userVotedOptionId: userVotedOptionId
            };
          }
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
          likes_count: likesCount,
          comments_count: commentsCount,
          author: author ? {
            name: post.is_anonymous ? `Anonymous User` : (author as any).full_name,
            year: (author as any).class_year,
            initials: post.is_anonymous ? 'AN' : (author as any).full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'
          } : undefined,
          isLiked: isLiked,
          poll
        };
      });

      setCoursePosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching course posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch posts when course data is loaded
  useEffect(() => {
    if (userCourse && !loading) {
      fetchCoursePosts();
    }
  }, [userCourse, loading, user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !userCourse) return;

    console.log('Setting up real-time subscriptions for course:', userCourse.class);
    
    // Set a timeout to mark as disconnected if connection takes too long
    const connectionTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        console.log('Real-time connection timeout - marking as disconnected');
        setRealtimeStatus('disconnected');
      }
    }, 15000); // 15 second timeout (increased from 10)

    // Set up realtime channels
    const setupChannels = async () => {
      try {
        console.log('Setting up realtime channels...');
        
        // Clean up any existing channels first
      if (channelsRef.current.postsChannel) {
        console.log('Removing existing posts channel');
        supabase.removeChannel(channelsRef.current.postsChannel);
      }
      if (channelsRef.current.likesChannel) {
        console.log('Removing existing likes channel');
        supabase.removeChannel(channelsRef.current.likesChannel);
      }
      if (channelsRef.current.commentsChannel) {
        console.log('Removing existing comments channel');
        supabase.removeChannel(channelsRef.current.commentsChannel);
      }
      if (channelsRef.current.pollVotesChannel) {
        console.log('Removing existing poll votes channel');
        supabase.removeChannel(channelsRef.current.pollVotesChannel);
      }
      
      // Clear the refs
      channelsRef.current = {};
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Subscribe to posts changes using postgres_changes
      const postsChannel = supabase
        .channel('course-posts-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts'
          },
          async (payload: any) => {
            // Only refresh if the post is for this course
            if (payload.new.course_id) {
              const actualCourseName = userCourse?.class || courseName;
              const cleanedCourseName = cleanCourseName(actualCourseName);
              const { data: course } = await supabase
                .from('feedcourses')
                .select('id')
                .eq('name', cleanedCourseName)
                .maybeSingle();
              
              if (course && payload.new.course_id === course.id) {
                debouncedFetchPosts();
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'posts'
          },
          (payload: any) => {
            console.log('Post deleted:', payload);
            setCoursePosts(prev => prev.filter(post => post.id !== payload.old.id));
          }
        )
        .subscribe((status: any, err: any) => {
          console.log('Posts channel status:', status, err);
          if (err) {
            console.error('Posts channel error:', err);
            // Don't immediately set disconnected - let it retry
            console.log('Posts channel will retry connection...');
          } else if (status === 'SUBSCRIBED') {
            console.log('Posts channel successfully subscribed!');
            clearTimeout(connectionTimeout);
            setRealtimeStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.log('Posts channel failed:', status, '- will retry...');
            // Don't set disconnected immediately - let it retry
          } else {
            console.log('Posts channel connecting...', status);
            setRealtimeStatus('connecting');
          }
        });

      // Small delay between channel setups
      await new Promise(resolve => setTimeout(resolve, 100));

      // Subscribe to likes changes using postgres_changes
      const likesChannel = supabase
        .channel('course-likes-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'likes'
          },
          async (payload: any) => {
            console.log('Like added:', payload);
            // Refresh posts to get updated like counts (debounced)
            debouncedFetchPosts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'likes'
          },
          async (payload: any) => {
            console.log('Like removed:', payload);
            // Refresh posts to get updated like counts (debounced)
            debouncedFetchPosts();
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Likes channel error:', err);
            // Don't set disconnected status for likes channel errors - they're not critical
          }
        });

      // Small delay between channel setups
      await new Promise(resolve => setTimeout(resolve, 100));

      // Subscribe to comments changes
      const commentsChannel = supabase
        .channel('course-comments-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments'
          },
          async (payload: any) => {
            console.log('Comment added:', payload);
            // Refresh posts to get updated comment counts (debounced)
            debouncedFetchPosts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments'
          },
          async (payload: any) => {
            console.log('Comment removed:', payload);
            // Refresh posts to get updated comment counts (debounced)
            debouncedFetchPosts();
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Comments channel error:', err);
            // Don't set disconnected status for comments channel errors - they're not critical
          }
        });

      // Small delay between channel setups
      await new Promise(resolve => setTimeout(resolve, 100));

      // Subscribe to poll votes changes
      const pollVotesChannel = supabase
        .channel('course-poll-votes-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'poll_votes'
          },
          async (payload: any) => {
            console.log('Poll vote added:', payload);
            // Refresh posts to get updated poll results (debounced)
            debouncedFetchPosts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'poll_votes'
          },
          async (payload: any) => {
            console.log('Poll vote removed:', payload);
            // Refresh posts to get updated poll results (debounced)
            debouncedFetchPosts();
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Poll votes channel error:', err);
            // Don't set disconnected status for poll votes channel errors - they're not critical
          }
        });

        // Store channel references
        channelsRef.current = {
          postsChannel,
          likesChannel,
          commentsChannel,
          pollVotesChannel
        };
        
        console.log('All realtime channels set up successfully');
      } catch (error) {
        console.error('Error setting up realtime channels:', error);
        setRealtimeStatus('disconnected');
      }
    };

    setupChannels();

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      if (channelsRef.current.postsChannel) {
        supabase.removeChannel(channelsRef.current.postsChannel);
      }
      if (channelsRef.current.likesChannel) {
        supabase.removeChannel(channelsRef.current.likesChannel);
      }
      if (channelsRef.current.commentsChannel) {
        supabase.removeChannel(channelsRef.current.commentsChannel);
      }
      if (channelsRef.current.pollVotesChannel) {
        supabase.removeChannel(channelsRef.current.pollVotesChannel);
      }
      channelsRef.current = {};
      clearTimeout(connectionTimeout);
    };
  }, [user, userCourse, courseName, debouncedFetchPosts, realtimeStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchPostsTimeout) {
        clearTimeout(fetchPostsTimeout);
      }
    };
  }, [fetchPostsTimeout]);

  // Create post for this course (matches HomePage feed logic exactly)
  const handleCreateCoursePost = async () => {
    // Validate title is required
    if (!newPostTitle.trim()) return;
    
    // Validate content based on post type
    if (newPostType === 'text' && !newPostContent.trim()) return;
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;

    try {
      // Get current user (matches HomePage feed logic exactly)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const actualCourseName = userCourse?.class || courseName;
      
      // Clean the course name to match feedcourses table (same logic as HomePage feed)
      const cleanedCourseName = cleanCourseName(actualCourseName);
      
      // Get course ID from feedcourses table
      const { data: course } = await supabase
        .from('feedcourses')
        .select('id')
        .eq('name', cleanedCourseName)
        .maybeSingle();

      if (!course) {
        console.error('Course not found in feedcourses:', cleanedCourseName);
        return;
      }

      // Create the post (matches HomePage feed logic exactly)
      const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          author_id: user.id,
          course_id: course.id,
          post_type: newPostType,
          is_anonymous: postAnonymously
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating course post:', postError);
        return;
      }

      // Create poll if it's a poll post
      if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: createdPost.id,
            question: newPostContent.trim()
          })
          .select()
          .single();

        if (pollError) {
          console.error('Error creating poll:', pollError);
          return;
        }

        // Create poll options
        const validOptions = pollOptions.filter(opt => opt.trim());
        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(
            validOptions.map(option => ({
              poll_id: poll.id,
              text: option.trim()
            }))
          );

        if (optionsError) {
          console.error('Error creating poll options:', optionsError);
          return;
        }
      }

      // Clear form and close dialog
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostType('text');
      setPollOptions(['', '']);
      setPostAnonymously(false);
      setShowCreatePostDialog(false);

      // Refresh posts
      await fetchCoursePosts();
    } catch (error) {
      console.error('Error creating course post:', error);
    }
  };

  // Toggle like for a post (matches HomePage feed logic exactly)
  const togglePostLike = async (postId: string) => {
    // Prevent multiple simultaneous like operations on the same post (matches HomePage feed logic)
    if (likingPosts.has(postId)) return;
    
    try {
      setLikingPosts(prev => new Set(prev).add(postId));
      
      // Get current user (matches HomePage feed logic exactly)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = coursePosts.find(p => p.id === postId);
      if (!post) return;

      // Double-check the current like state from database (matches HomePage feed logic exactly)
      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'post')
        .eq('likeable_id', postId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('likeable_type', 'post')
          .eq('likeable_id', postId);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            likeable_type: 'post',
            likeable_id: postId
          });

        if (error) {
          console.error('Error liking post:', error);
          return;
        }
      }

      // Update local state immediately for better UX (matches HomePage feed logic exactly)
      setCoursePosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                isLiked: !isCurrentlyLiked, 
                likes_count: isCurrentlyLiked 
                  ? Math.max(0, p.likes_count - 1) 
                  : p.likes_count + 1 
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling post like:', error);
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Helper function to get course-specific color (matches HomePage color system exactly)
  const getCourseColor = (courseName: string) => {
    // Use the same color cycle as HomePage
    const colorCycle = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
    
    // Find the course's index in the user's course list to match HomePage color assignment
    const courseIndex = userCourses.findIndex((course: UserCourse) => {
      const courseClass = course.class || '';
      return courseClass === courseName || 
             courseClass.startsWith(courseName + ' ') ||
             courseName.startsWith(courseClass + ' ');
    });
    
    // If course found, use its index; otherwise use 0 as fallback
    const index = courseIndex >= 0 ? courseIndex : 0;
    return colorCycle[index % 4];
  };

  // Helper function to get a darker shade for gradient
  const getDarkerShade = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#0080BD': '#005A8B', // Darker blue
      '#04913A': '#036629', // Darker green
      '#FFBB06': '#CC9500', // Darker yellow
      '#F22F21': '#B81A17'  // Darker red
    };
    return colorMap[color] || '#5a1a26'; // Default darker burgundy
  };

  const handleCreateReply = () => {
    if (!newReplyContent.trim() || !selectedPostForDetail) return;

    const newReply: FeedReply = {
      id: `reply_${Date.now()}`,
      author: { 
        name: postAnonymously ? 'Anonymous' : 'You', 
        initials: postAnonymously ? 'AN' : 'YO', 
        year: '2L' 
      },
      content: newReplyContent.trim(),
      timestamp: 'now',
      likes: 0,
      userLiked: false
    };

    // Update the selected post
    const updatedPost = {
      ...selectedPostForDetail,
      replies: [...(selectedPostForDetail.replies || []), newReply],
      comments_count: (selectedPostForDetail.comments_count || 0) + 1
    };

    setSelectedPostForDetail(updatedPost);

    // Update the course posts
    setCoursePosts(prev => prev.map(post => 
      post.id === selectedPostForDetail.id ? updatedPost : post
    ));

    // Reset form
    setNewReplyContent('');
    setPostAnonymously(false);
  };

  const toggleReplyLike = (replyId: string) => {
    if (!selectedPostForDetail) return;

    const updatedPost = {
      ...selectedPostForDetail,
      replies: (selectedPostForDetail.replies || []).map(reply => 
        reply.id === replyId 
          ? { 
              ...reply, 
              userLiked: !reply.userLiked,
              likes: reply.userLiked ? reply.likes - 1 : reply.likes + 1
            }
          : reply
      )
    };

    setSelectedPostForDetail(updatedPost);

    // Update the course posts as well
    setCoursePosts(prev => prev.map(post => 
      post.id === selectedPostForDetail.id ? updatedPost : post
    ));
  };

  // Calculate unread posts count
  const getUnreadPostsCount = () => {
    const timeToMinutes = (timeStr: string) => {
      if (timeStr === 'now') return 0;
      if (timeStr.includes('minutes ago')) return parseInt(timeStr);
      if (timeStr.includes('hour ago')) return parseInt(timeStr) * 60;
      if (timeStr.includes('hours ago')) return parseInt(timeStr) * 60;
      if (timeStr.includes('day ago')) return parseInt(timeStr) * 24 * 60;
      if (timeStr.includes('days ago')) return parseInt(timeStr) * 24 * 60;
      return 999;
    };

    const lastReadMinutes = timeToMinutes(lastReadTime);
    
    return coursePosts.filter(post => {
      // Convert created_at to minutes ago format for comparison
      const postDate = new Date(post.created_at);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
      
      return diffInMinutes < lastReadMinutes;
    }).length;
  };

  // Mock course data based on courseName
  const getCourseData = (name: string) => {
    const courseMap: { [key: string]: any } = {
      'Contract Law': {
        instructor: 'Prof. Chen',
        semester: 'Fall 2025',
        schedule: 'M,W,F 9:00-10:00 AM',
        location: 'Austin Hall 101',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L' }
        ]
      },
      'Torts': {
        instructor: 'Prof. Johnson',
        semester: 'Fall 2025', 
        schedule: 'Tu,Th 10:30-12:00 PM',
        location: 'Langdell Library North',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L' }
        ]
      },
      'Property Law': {
        instructor: 'Prof. Chen',
        semester: 'Fall 2025',
        schedule: 'M,W,F 11:30-12:30 PM',
        location: 'Austin Hall 200',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L' }
        ]
      },
      'Civil Procedure': {
        instructor: 'Prof. Martinez',
        semester: 'Fall 2025',
        schedule: 'Tu,Th 2:00-3:30 PM',
        location: 'Hauser Hall 104',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L' }
        ]
      }
    };

    return courseMap[name] || {
      instructor: 'Prof. Smith',
      semester: 'Fall 2025',
      schedule: 'TBD',
      location: 'TBD',
      students: [
        { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L' }
      ]
    };
  };

  const courseData = getCourseData(courseName);
  
  // Get the actual course name for color matching
  const actualCourseName = userCourse?.class || courseName;
  const courseColor = getCourseColor(actualCourseName);
  const darkerCourseColor = getDarkerShade(courseColor);

  // Show loading state
  if (loading) {
  return (
      <div className="h-full overflow-auto" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#752432] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get last names from professor string (matches HomePage logic)
  const getLastNames = (professorStr: string): string => {
    if (!professorStr || professorStr === 'TBD') return 'TBD';
    
    // Split professors only by semicolons (not commas which separate last/first)
    const entries = professorStr
      .split(';')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    const lastNames = entries
      .map(entry => {
        // If formatted as "Last, First", take the part before the comma
        const commaIndex = entry.indexOf(',');
        if (commaIndex !== -1) {
          const lastName = entry.slice(0, commaIndex).trim();
          if (lastName) return lastName;
        }
        
        // Otherwise assume "First Last"; take the last token
        const parts = entry.split(/\s+/).filter(part => part.length > 0);
        return parts.length > 0 ? parts[parts.length - 1] : entry.trim();
      })
      .filter(name => name.length > 0);
    
    return lastNames.join('; ');
  };

  // Helper function to format schedule display
  const formatScheduleDisplay = (schedule: any): string => {
    if (!schedule) return 'TBD';
    if (schedule.days && schedule.times) {
      return `${schedule.days} • ${schedule.times}`;
    }
    return 'TBD';
  };

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: '#FAF5EF' }}>
      <style>{`
        .quad-ping {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: quad-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes quad-ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div 
            className="text-white rounded-lg p-8 mb-6"
            style={{ 
              background: `linear-gradient(to right, ${courseColor}, ${darkerCourseColor})`
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{cleanCourseName(userCourse?.class || courseName)}</h1>
                <p className="text-white/90 text-lg mb-4">
                  {getLastNames(userCourse?.professor || 'TBD')}
                </p>
                <div className="flex items-center gap-6 text-sm text-white/80">
                  {userCourse?.schedule?.credits && userCourse.schedule.credits !== 'TBD' && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                      {userCourse.schedule.credits} Credits
                  </div>
                  )}
                  {userCourse?.schedule?.days && userCourse?.schedule?.times && 
                   userCourse.schedule.days !== 'TBD' && userCourse.schedule.times !== 'TBD' && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                      {formatScheduleDisplay(userCourse.schedule)}
                  </div>
                  )}
                  {userCourse?.schedule?.location && userCourse.schedule.location !== 'TBD' && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                      {userCourse.schedule.location}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Content */}
        <div className="flex gap-6 w-full">
          {/* Students List - Fixed height - LEFT SIDE */}
          <div style={{ width: '30%', minWidth: '300px', flexShrink: 0 }}>
            <Card className="h-[600px] flex flex-col overflow-hidden w-full">
              <div className="text-white p-4 pb-3" style={{ backgroundColor: courseColor }}>
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                    Students ({courseData.students.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-3 pt-3">
                <div className="space-y-2">
                    {courseData.students.map((student: any, index: number) => (
                      <div 
                        key={index} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onNavigateToStudentProfile?.(student.name)}
                      >
                      <div className="w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: courseColor }}>
                          {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1">
                        <div className="font-medium text-gray-900 transition-colors text-sm" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = courseColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                            {student.name}
                          </div>
                        <div className="text-xs text-gray-600">{student.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
              </Card>
            </div>

          {/* Course Feed - Reddit-style with create post functionality - RIGHT SIDE */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Card className="h-[600px] flex flex-col overflow-hidden w-full">
              <div className="text-white p-4 pb-3" style={{ backgroundColor: courseColor }}>
                <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-white" />
                          Course Discussion
                        </h3>
                        {/* Real-time connection indicator */}
                        <div className="relative flex items-center justify-center w-2 h-2 overflow-visible">
                          {realtimeStatus === 'connected' && (
                            <div 
                              className="quad-ping"
                              style={{ backgroundColor: '#22c55e' }}
                            />
                          )}
                          <div
                            className="w-2 h-2 rounded-full transition-colors duration-300 shadow-sm relative z-10"
                            style={{
                              backgroundColor: realtimeStatus === 'connected' 
                                ? '#22c55e' 
                                : realtimeStatus === 'connecting'
                                ? '#eab308'
                                : '#ef4444'
                            }}
                            title={
                              realtimeStatus === 'connected' 
                                ? 'Real-time connected' 
                                : realtimeStatus === 'connecting'
                                ? 'Real-time connecting...'
                                : 'Real-time disconnected'
                            }
                          />
                          </div>
                        {getUnreadPostsCount() > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="bg-white/20 text-white hover:bg-white/30 px-2 py-0.5 text-xs font-medium min-w-6 h-6 flex items-center justify-center rounded-full leading-none"
                          >
                            {getUnreadPostsCount()}
                          </Badge>
                        )}
                        </div>
                  <Button 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 leading-none h-8 py-0 px-3 text-sm flex items-center"
                    onClick={() => setShowCreatePostDialog(true)}
                    variant="ghost"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="leading-none">Create Post</span>
                  </Button>
                      </div>
                    </div>
              <div className="flex-1 p-0 overflow-hidden bg-white">
                <div className="h-full overflow-y-auto">
                  <div className="space-y-0">
                    {coursePosts.map((post) => (
                      <Dialog key={post.id}>
                        <DialogTrigger asChild>
                          <div 
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedPostForDetail(post)}
                          >
                            <div className="p-4">
                              <div className="flex gap-3">
                                {/* Vote buttons - Reddit style */}
                                <div className="flex flex-col items-center gap-1 pt-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-6 px-1 hover:bg-[#752432]/10 ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePostLike(post.id);
                                    }}
                                    disabled={likingPosts.has(post.id)}
                                  >
                                    <ChevronUp className={`w-4 h-4 ${post.isLiked ? '' : 'text-gray-400'}`} style={post.isLiked ? { color: courseColor } : {}} />
                                  </Button>
                                  <span className={`text-sm font-medium ${post.isLiked ? '' : 'text-gray-700'}`} style={post.isLiked ? { color: courseColor } : {}}>
                                    {post.likes_count}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-1 hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  </Button>
                </div>

                                {/* Post content */}
                                <div className="flex-1 min-w-0">
                                  {/* Author info */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      Posted by {post.author?.name || 'Unknown'} • {post.author?.year || ''} • {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  </div>
                          
                                  {/* Post content */}
                                  <div className="mb-3">
                                    <p className="text-gray-800 leading-relaxed line-clamp-2">{post.content}</p>
                            </div>
                          
                                  {/* Action buttons */}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="w-4 h-4" />
                                      <span>{post.comments_count} comments</span>
                          </div>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-[#752432]/10" onClick={(e) => e.stopPropagation()}>
                                      Share
                                    </Button>
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                        </DialogTrigger>
                        
                        {/* Post Detail Modal */}
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className="bg-[#752432]/10 text-[#752432] text-xs"
                              >
                                {selectedPostForDetail?.tag}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {selectedPostForDetail?.author?.name} • {selectedPostForDetail?.author?.year} • {new Date(selectedPostForDetail?.created_at || '').toLocaleDateString()}
                              </span>
                            </div>
                            <DialogTitle className="sr-only">Post Discussion</DialogTitle>
                            <DialogDescription className="sr-only">
                              View and participate in the course discussion
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedPostForDetail && (
                            <div className="space-y-6">
                              {/* Original Post */}
                              <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1">
                    <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-8 px-2 hover:bg-[#752432]/10 ${likingPosts.has(selectedPostForDetail.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => togglePostLike(selectedPostForDetail.id)}
                                    disabled={likingPosts.has(selectedPostForDetail.id)}
                                  >
                                    <ChevronUp className={`w-5 h-5 ${selectedPostForDetail.isLiked ? 'text-[#752432]' : 'text-gray-400'}`} />
                                  </Button>
                                  <span className={`text-lg font-medium ${selectedPostForDetail.isLiked ? 'text-[#752432]' : 'text-gray-700'}`}>
                                    {selectedPostForDetail.likes_count}
                                  </span>
                    <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 hover:bg-gray-100"
                    >
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                    </Button>
                  </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-[#752432] text-white rounded-full flex items-center justify-center font-medium">
                                      {selectedPostForDetail.author?.initials || 'U'}
                    </div>
                              <div>
                                      <div className="font-medium">{selectedPostForDetail.author?.name || 'Unknown'}</div>
                                      <div className="text-sm text-gray-500">{selectedPostForDetail.author?.year || ''}</div>
                              </div>
                          </div>
                                  <p className="text-gray-800 leading-relaxed mb-4">{selectedPostForDetail.content}</p>
                        </div>
                      </div>
                              
                              <Separator />
                              
                              {/* Add Reply Section */}
                <div className="space-y-4">
                                <h4 className="font-medium">Add a comment</h4>
                                <Textarea
                                  placeholder="Share your thoughts or ask a follow-up question..."
                                  value={newReplyContent}
                                  onChange={(e) => setNewReplyContent(e.target.value)}
                                  className="min-h-20"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="anonymous-reply"
                                      checked={postAnonymously}
                                      onCheckedChange={(checked) => setPostAnonymously(checked === true)}
                                    />
                                    <label htmlFor="anonymous-reply" className="text-sm text-gray-600 cursor-pointer">
                                      Post anonymously
                                    </label>
                    </div>
                                  <Button
                                    onClick={handleCreateReply}
                                    disabled={!newReplyContent.trim()}
                                    className="bg-[#752432] hover:bg-[#5a1c24]"
                                  >
                                    Reply
                                  </Button>
                </div>
                  </div>
                  
                              <Separator />
                              
                              {/* Replies */}
                              <div className="space-y-4">
                                <h4 className="font-medium">Comments ({(selectedPostForDetail.replies || []).length})</h4>
                                {(selectedPostForDetail.replies || []).map((reply) => (
                                  <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-gray-100">
                                    <div className="flex flex-col items-center gap-1 pt-1">
                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 px-1"
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${courseColor}1a`}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        onClick={() => toggleReplyLike(reply.id)}
                                      >
                                        <ChevronUp className={`w-4 h-4 ${reply.userLiked ? 'text-[#752432]' : 'text-gray-400'}`} />
                                      </Button>
                                      <span className={`text-sm font-medium ${reply.userLiked ? 'text-[#752432]' : 'text-gray-700'}`}>
                                        {reply.likes}
                                      </span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 px-1 hover:bg-gray-100"
                                      >
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-[#752432] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                          {reply.author.initials}
                    </div>
                                        <span className="font-medium">{reply.author.name}</span>
                                        <span className="text-sm text-gray-500">•</span>
                                        <span className="text-sm text-gray-500">{reply.author.year}</span>
                                        <span className="text-sm text-gray-500">•</span>
                                        <span className="text-sm text-gray-500">{reply.timestamp}</span>
                    </div>
                                      <p className="text-gray-800 leading-relaxed">{reply.content}</p>
                    </div>
                    </div>
                                ))}
                  </div>
                    </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              </div>
              </Card>
            </div>
        </div>
      </div>

      {/* Create Post Dialog - Same as HomePage but for this course only */}
      <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Create Post for {cleanCourseName(userCourse?.class || courseName)}
            </DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or start a discussion with your classmates.
            </DialogDescription>
          </DialogHeader>

                <div className="space-y-4">
            {/* Post Type Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setNewPostType('text')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  newPostType === 'text' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 Text
              </button>
              <button
                onClick={() => setNewPostType('poll')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  newPostType === 'poll' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Poll
              </button>
            </div>

            {/* Title Field */}
                      <div>
              <Input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="An interesting title"
                className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] text-lg font-medium"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newPostTitle.length}/300
                    </div>
                  </div>
                  
            {/* Text Content - Only show for text posts */}
            {newPostType === 'text' && (
                      <div>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What are your thoughts?"
                  maxLength={500}
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                  rows={5}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newPostContent.length}/500
                      </div>
                    </div>
            )}

            {/* Poll Options */}
            {newPostType === 'poll' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Poll options</h4>
                {pollOptions.map((option, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={300}
                        className="flex-1"
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = pollOptions.filter((_, i) => i !== index);
                            setPollOptions(newOptions);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                  </div>
                    <div className="text-xs text-gray-500 ml-1">
                      {option.length}/300
                </div>
      </div>
                ))}
                {pollOptions.length < 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-[#752432] border-[#752432] hover:bg-[#752432]/10"
                  >
                    Add option
                  </Button>
                )}
              </div>
            )}

            {/* Anonymous Posting Option */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="anonymous-post"
                checked={postAnonymously}
                onChange={(e) => setPostAnonymously(e.target.checked)}
                className="w-4 h-4 text-[#752432] bg-gray-100 border-gray-300 rounded focus:ring-[#752432] focus:ring-2"
              />
              <label htmlFor="anonymous-post" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <span className="text-lg">🎭</span>
                Post anonymously as random name
                <span className="text-xs text-gray-500">(e.g., "Silly Squirrel")</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-gray-500">
                Remember to be respectful and follow community guidelines
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreatePostDialog(false);
                    setNewPostTitle('');
                    setNewPostContent('');
                    setNewPostType('text');
                    setPollOptions(['', '']);
                    setPostAnonymously(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCoursePost}
                  className="bg-[#752432] hover:bg-[#752432]/90"
                  disabled={
                    !newPostTitle.trim() || 
                    (newPostType === 'text' && !newPostContent.trim()) ||
                    (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2)
                  }
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}