import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, MessageSquare, GraduationCap, Clock, MapPin, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExpandableText } from './ui/expandable-text';
import { ConfirmationPopup } from './ui/confirmation-popup';

// Heart component (matching FeedComponent)
const Heart = ({ className, fill }: { className?: string; fill?: boolean }) => (
  <svg 
    className={className} 
    width="24"
    height="24"
    fill={fill ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2"
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

// MessageCircle component (matching FeedComponent)
const MessageCircle = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="24"
    height="24"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
// Custom Input component to match FeedComponent styling
const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  type = "text",
  ...props 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string; 
  className?: string; 
  type?: string;
  [key: string]: any;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#752432] focus:border-[#752432] ${className}`}
    {...props}
  />
);
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface CoursePageOverviewProps {
  courseName: string;
  onBack: () => void;
  onNavigateToOutlines?: (courseName: string, outlineName: string) => void;
  onNavigateToOutlinesPage?: (courseName: string) => void;
  onNavigateToStudentProfile?: (studentName: string) => void;
}

interface UserCourse {
  course_id: string; // UUID from Courses table
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

interface CourseComment {
  id: string;
  post_id: string;
  parent_comment_id?: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  likes_count: number;
  // UI computed fields
  author?: {
    name: string;
    year: string;
  };
  isLiked?: boolean;
  replies?: CourseComment[];
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
  edited_at?: string;
  is_edited?: boolean;
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



export function CoursePage({ courseName, onBack, onNavigateToStudentProfile }: CoursePageOverviewProps) {
  const { user } = useAuth();
  const [userCourse, setUserCourse] = useState<UserCourse | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coursePosts, setCoursePosts] = useState<CoursePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
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

  const fetchPostsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Unread tracking state
  const [lastReadTime] = useState<string>('now');
  
  // Post creation state
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postAnonymously, setPostAnonymously] = useState(false);
  
  // State for inline comments (matching FeedComponent)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, CourseComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  
  // Edit state management
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editCommentContent, setEditCommentContent] = useState('');
  
  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    position: { top: 0, left: 0 }
  });
  
  // Update poll option
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Format timestamp (matching FeedComponent)
  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return postDate.toLocaleDateString();
    }
  };

  // Fetch comments for a post (matching FeedComponent)
  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Separate top-level comments and replies
      const topLevelComments = (commentsData || []).filter((c: any) => !c.parent_comment_id);
      const replies = (commentsData || []).filter((c: any) => c.parent_comment_id);

      // Get author info for comments
      const authorIds = [...new Set(commentsData?.map((c: any) => c.author_id) || [])];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Get user likes for comments
      const commentIds = commentsData?.map((c: any) => c.id) || [];
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', user?.id)
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      // Get likes counts for comments
      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      // Create lookup maps
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      
      // Count likes per comment
      const likesCountMap = new Map();
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });

      // Group replies by parent comment ID
      const repliesMap = new Map();
      replies.forEach((reply: any) => {
        if (!repliesMap.has(reply.parent_comment_id)) {
          repliesMap.set(reply.parent_comment_id, []);
        }
        repliesMap.get(reply.parent_comment_id).push(reply);
      });

      // Transform top-level comments
      const transformedComments = topLevelComments.map((comment: any) => {
        const author = authorsMap.get(comment.author_id);
        const isLiked = userLikesSet.has(comment.id);
        const likesCount = likesCountMap.get(comment.id) || 0;

        // Transform replies for this comment
        const commentReplies = (repliesMap.get(comment.id) || []).map((reply: any) => {
          const replyAuthor = authorsMap.get(reply.author_id);
          const replyIsLiked = userLikesSet.has(reply.id);
          const replyLikesCount = likesCountMap.get(reply.id) || 0;

          return {
            id: reply.id,
            post_id: reply.post_id,
            parent_comment_id: reply.parent_comment_id,
            author_id: reply.author_id,
            content: reply.content,
            is_anonymous: reply.is_anonymous,
            created_at: reply.created_at,
            edited_at: reply.edited_at,
            is_edited: reply.is_edited,
            likes_count: replyLikesCount,
            author: replyAuthor ? {
              name: reply.is_anonymous ? `Anonymous` : (replyAuthor as any).full_name,
              year: (replyAuthor as any).class_year
            } : undefined,
            isLiked: replyIsLiked
          };
        });

        return {
          id: comment.id,
          post_id: comment.post_id,
          parent_comment_id: comment.parent_comment_id,
          author_id: comment.author_id,
          content: comment.content,
          is_anonymous: comment.is_anonymous,
          created_at: comment.created_at,
          edited_at: comment.edited_at,
          is_edited: comment.is_edited,
          likes_count: likesCount,
          author: author ? {
              name: comment.is_anonymous ? `Anonymous` : (author as any).full_name,
            year: (author as any).class_year
          } : undefined,
          isLiked: isLiked,
          replies: commentReplies
        };
      });

      setComments(prev => ({
        ...prev,
        [postId]: transformedComments
      }));
    } catch (error) {
      console.error('Error in fetchComments:', error);
    }
  };

  // Toggle comments expanded (matching FeedComponent)
  const toggleCommentsExpanded = async (postId: string) => {
    const isCurrentlyExpanded = expandedComments[postId];
    
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // If we're expanding comments and they haven't been fetched yet, fetch them
    if (!isCurrentlyExpanded && !comments[postId]) {
      setLoadingComments(prev => new Set(prev).add(postId));
      await fetchComments(postId);
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Add comment (matching FeedComponent)
  const addComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content || !user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: content,
          is_anonymous: postAnonymously
        });

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Clear the input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setPostAnonymously(false);

      // Refresh comments
      await fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Add reply (matching FeedComponent)
  const addReply = async (postId: string, parentCommentId: string) => {
    const content = replyText[`${postId}:${parentCommentId}`]?.trim();
    if (!content || !user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: parentCommentId,
          author_id: user.id,
          content: content,
          is_anonymous: replyAnonymously[`${postId}:${parentCommentId}`] || false
        });

      if (error) {
        console.error('Error adding reply:', error);
        return;
      }

      // Clear the input
      setReplyText(prev => ({ ...prev, [`${postId}:${parentCommentId}`]: '' }));
      setReplyAnonymously(prev => ({ ...prev, [`${postId}:${parentCommentId}`]: false }));
      setReplyingTo(null);

      // Refresh comments
      await fetchComments(postId);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Toggle comment like (matching FeedComponent)
  const toggleCommentLike = async (postId: string, commentId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', commentId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('likeable_type', 'comment')
          .eq('likeable_id', commentId);

        if (error) {
          console.error('Error unliking comment:', error);
          return;
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            likeable_type: 'comment',
            likeable_id: commentId
          });

        if (error) {
          console.error('Error liking comment:', error);
          return;
        }
      }

      // Refresh comments to get updated like counts
      await fetchComments(postId);
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  // Toggle reply like (matching FeedComponent)
  const toggleReplyLike = async (postId: string, _parentCommentId: string, replyId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', replyId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('likeable_type', 'comment')
          .eq('likeable_id', replyId);

        if (error) {
          console.error('Error unliking reply:', error);
          return;
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            likeable_type: 'comment',
            likeable_id: replyId
          });

        if (error) {
          console.error('Error liking reply:', error);
          return;
        }
      }

      // Refresh comments to get updated like counts
      await fetchComments(postId);
    } catch (error) {
      console.error('Error toggling reply like:', error);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = coursePosts.find(p => p.id === postId);
      if (!post || !post.poll) return;

      const previousSelection = post.poll.userVotedOptionId;

      // If user has already voted, prevent any further voting
      if (previousSelection) {
        console.log('User has already voted on this poll, voting disabled');
        return;
      }

      // First vote only
      console.log('Inserting poll vote:', {
        poll_id: post.poll.id,
        option_id: optionId,
        user_id: user.id
      });
      
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: post.poll.id,
          option_id: optionId,
          user_id: user.id
        });

      if (error) {
        console.error('Error voting on poll:', error);
        return;
      }
      
      console.log('Poll vote inserted successfully');

      // Update local state immediately for better UX
      setCoursePosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? {
                ...p,
                poll: p.poll ? {
                  ...p.poll,
                  userVotedOptionId: optionId,
                  totalVotes: p.poll.totalVotes + 1,
                  options: p.poll.options.map(opt => ({
                    ...opt,
                    votes: opt.id === optionId ? opt.votes + 1 : opt.votes
                  }))
                } : undefined
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error handling poll vote:', error);
    }
  };

  // Edit and delete functions
  const handleEditPost = async (postId: string) => {
    try {
      const post = coursePosts.find(p => p.id === postId);
      if (!post) return;
      
      // For poll posts, only allow title editing
      const updateData: any = {
        title: editPostTitle,
        edited_at: new Date().toISOString(),
        is_edited: true
      };
      
      // Only update content for non-poll posts
      if (post.post_type !== 'poll') {
        updateData.content = editPostContent;
      }
      
      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('author_id', user?.id);

      if (error) throw error;
      
      setEditingPost(null);
      await fetchCoursePosts(); // Refresh posts
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleDeletePost = async (postId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
          // First, delete all likes for this post
          const { error: likesError } = await supabase
            .from('likes')
            .delete()
            .eq('likeable_type', 'post')
            .eq('likeable_id', postId);

          if (likesError) {
            console.error('CoursePage error deleting post likes:', likesError);
            throw likesError;
          }

          // Then delete the post (this will cascade to comments, polls, etc.)
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', user?.id);

          if (error) throw error;
          
          await fetchCoursePosts(); // Refresh posts
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('CoursePage error deleting post:', error);
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleEditComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editCommentContent,
          edited_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', commentId)
        .eq('author_id', user?.id);

      if (error) throw error;
      
      setEditingComment(null);
      // Refresh comments for the specific post
      // Check both top-level comments and replies
      const postId = Object.keys(comments).find(key => 
        comments[key].some(c => 
          c.id === commentId || 
          (c.replies && c.replies.some(r => r.id === commentId))
        )
      );
      if (postId) await fetchComments(postId);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    console.log('CoursePage handleDeleteComment called with:', { commentId, userId: user?.id });
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
          console.log('CoursePage attempting to delete comment:', commentId);
          
          // First, delete all likes for this comment and its replies
          const { error: likesError } = await supabase
            .from('likes')
            .delete()
            .eq('likeable_type', 'comment')
            .eq('likeable_id', commentId);

          if (likesError) {
            console.error('CoursePage error deleting comment likes:', likesError);
            throw likesError;
          }

          // Delete likes for all replies to this comment
          // First, get all reply IDs for this comment
          const { data: replyIds, error: replyIdsError } = await supabase
            .from('comments')
            .select('id')
            .eq('parent_comment_id', commentId);

          if (replyIdsError) {
            console.error('CoursePage error fetching reply IDs:', replyIdsError);
            throw replyIdsError;
          }

          // Delete likes for replies if there are any
          if (replyIds && replyIds.length > 0) {
            const replyIdList = replyIds.map((reply: { id: string }) => reply.id);
            const { error: replyLikesError } = await supabase
              .from('likes')
              .delete()
              .eq('likeable_type', 'comment')
              .in('likeable_id', replyIdList);

            if (replyLikesError) {
              console.error('CoursePage error deleting reply likes:', replyLikesError);
              throw replyLikesError;
            }
          }
          
          // First, delete all replies to this comment (if it's a parent comment)
          const { error: repliesError } = await supabase
            .from('comments')
            .delete()
            .eq('parent_comment_id', commentId);

          if (repliesError) {
            console.error('CoursePage error deleting replies:', repliesError);
            throw repliesError;
          }
          
          // Then delete the comment itself
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('author_id', user?.id);

          if (error) {
            console.error('CoursePage delete error:', error);
            throw error;
          }
          
          console.log('CoursePage comment deleted successfully, refreshing comments...');
          // Refresh comments
          // Check both top-level comments and replies
          const postId = Object.keys(comments).find(key => 
            comments[key].some(c => 
              c.id === commentId || 
              (c.replies && c.replies.some(r => r.id === commentId))
            )
          );
          if (postId) {
            console.log('CoursePage refreshing comments for post:', postId);
            await fetchComments(postId);
          }
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('CoursePage error deleting comment:', error);
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle profile click
  const handleProfileClick = (_userId: string, userName: string) => {
    if (onNavigateToStudentProfile) {
      onNavigateToStudentProfile(userName);
    }
  };

  const debouncedFetchPosts = useCallback(() => {
    if (fetchPostsTimeoutRef.current) {
      clearTimeout(fetchPostsTimeoutRef.current);
    }
    
    const timeout = setTimeout(async () => {
      // Only fetch posts if we have a valid course UUID
      if (userCourse?.course_id) {
        await fetchCoursePosts(false); // Background refresh, don't show loading screen
      }
    }, 150); // 150ms debounce
    
    fetchPostsTimeoutRef.current = timeout;
  }, [userCourse?.course_id]);

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
          .select('classes, full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Set user profile data
          setUserProfile(profile);
          
          if (profile.classes && Array.isArray(profile.classes)) {
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
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [user, courseName]);

  // Fetch posts for this specific course
  const fetchCoursePosts = async (isInitialLoad: boolean = true) => {
    try {
      if (isInitialLoad) {
        setPostsLoading(true);
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping fetchCoursePosts');
        setPostsLoading(false);
        return;
      }
      
      // Check if we have a course with UUID
      if (!userCourse?.course_id) {
        console.log('No course UUID found');
        setCoursePosts([]);
        setPostsLoading(false);
        return;
      }

      // Fetch posts for this course using the course UUID directly
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('course_id', userCourse.course_id)
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
          edited_at: post.edited_at,
          is_edited: post.is_edited,
          likes_count: likesCount,
          comments_count: commentsCount,
          author: author ? {
            name: post.is_anonymous ? `Anonymous` : (author as any).full_name,
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

  // Fetch course students when component loads
  useEffect(() => {
    if (userCourse?.course_id) {
      fetchCourseStudents();
    }
  }, [userCourse]);

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
            if (payload.new.course_id && userCourse?.course_id && payload.new.course_id === userCourse.course_id) {
              debouncedFetchPosts();
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
            // Only refresh if we have a valid course UUID and this like is for a post in our course
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
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
            // Only refresh if we have a valid course UUID
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
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
            // Update comment count for the post locally
            setCoursePosts(prev => prev.map(post => 
              post.id === payload.new.post_id 
                ? { ...post, comments_count: post.comments_count + 1 }
                : post
            ));
            
            // If comments are expanded for this post, refresh them
            if (expandedComments[payload.new.post_id]) {
              await fetchComments(payload.new.post_id);
            }
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
            // Update comment count for the post locally
            setCoursePosts(prev => prev.map(post => 
              post.id === payload.old.post_id 
                ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
                : post
            ));
            
            // If comments are expanded for this post, refresh them
            if (expandedComments[payload.old.post_id]) {
              await fetchComments(payload.old.post_id);
            }
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
            // Only refresh if we have a valid course UUID
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
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
            // Only refresh if we have a valid course UUID
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
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
  }, [user, userCourse, courseName]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchPostsTimeoutRef.current) {
        clearTimeout(fetchPostsTimeoutRef.current);
      }
    };
  }, []);

  // Create post for this course (matches HomePage feed logic exactly)
  const handleCreateCoursePost = async () => {
    // Validate title is required
    if (!newPostTitle.trim()) return;
    
    // Validate content based on post type
    if (newPostType === 'text' && !newPostContent.trim()) return;
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if we have a course with UUID
      if (!userCourse?.course_id) {
        console.error('No course UUID found');
        return;
      }

      // Create the post using the course UUID directly
      const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          author_id: user.id,
          course_id: userCourse.course_id,
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
  const [courseStudents, setCourseStudents] = useState<Array<{ name: string; year: string; }>>([]);
  
  // Get the actual course name for color matching
  const actualCourseName = userCourse?.class || courseName;
  const courseColor = getCourseColor(actualCourseName);

  // Fetch real students for the course
  const fetchCourseStudents = async () => {
    try {
      // Check if we have a course UUID
      if (!userCourse?.course_id) {
        console.log('No course UUID available for fetching students');
        return;
      }

      // First, get user IDs from course_enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('course_id', userCourse.course_id);

      if (enrollmentsError) {
        console.error('Error fetching course enrollments:', enrollmentsError);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log('No students found for this course');
        setCourseStudents([]);
        return;
      }

      // Extract user IDs
      const userIds = enrollments.map((enrollment: any) => enrollment.user_id);

      // Then, get profile information for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, class_year')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
        return;
      }

      // Transform the data
      const studentList = profiles?.map((profile: any) => ({
        name: profile.full_name || 'Unknown',
        year: profile.class_year || ''
      })) || [];

      setCourseStudents(studentList);
    } catch (error) {
      console.error('Error fetching course students:', error);
    }
  };
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
    <div className="h-full overflow-hidden" style={{ backgroundColor: '#FAF5EF' }}>
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
                <h1 className="text-3xl font-bold mb-2">{userCourse?.class || courseName}</h1>
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
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
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
                    Students ({courseStudents.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-3 pt-0 -mt-3" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#752531 transparent'
              }}>
                <div className="space-y-2">
                    {courseStudents.map((student: any, index: number) => (
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
            <Card className="h-[600px] overflow-hidden w-full">
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
                  <button
                    onClick={() => setShowCreatePostDialog(true)}
                    className="px-3 py-1.5 text-sm font-medium rounded transition-colors bg-white text-[#752432] hover:bg-gray-100"
                    aria-label="Create post"
                    title="Create post"
                  >
                    + New Post
                  </button>
                      </div>
                    </div>
              <div className="bg-white" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="h-full overflow-y-auto" style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#752531 transparent'
                }}>
                  <div className="space-y-4 px-4 py-4 pt-1" style={{ paddingBottom: '160px' }}>
                    {!postsLoading && coursePosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                          <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                        </div>
                    ) : (
                      coursePosts.map((post) => (
                      <div 
                        key={post.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 border-l-4"
                        style={{ 
                          borderLeftColor: courseColor
                        }}
                      >
                        <div className="p-4">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div 
                                  className={`flex items-center gap-3 ${!post.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    !post.is_anonymous && handleProfileClick(post.author_id, post.author?.name || 'Anonymous');
                                  }}
                                >
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white border-2"
                                  style={{ 
                                    backgroundColor: courseColor,
                                    borderColor: courseColor
                                  }}
                                >
                                  {post.is_anonymous ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                  ) : (
                                    post.author?.initials || 'U'
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">{post.is_anonymous ? 'Anonymous' : (post.author?.name || 'Anonymous')}</h4>
                                    {!post.is_anonymous && <span className="text-xs text-gray-500">{post.author?.year || ''}</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</span>
                                    {post.is_edited && (
                                      <span className="text-xs text-gray-400 italic">(edited)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Post Title */}
                          {editingPost !== post.id && (
                            <div className="mb-3">
                              <h2 className="text-lg font-semibold text-gray-900 leading-tight">{post.title}</h2>
                            </div>
                          )}

                          {/* Post Content */}
                          <div className="mb-3">
                            {editingPost === post.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editPostTitle}
                                  onChange={(e) => setEditPostTitle(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  maxLength={100}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Post title..."
                                />
                                {post.post_type !== 'poll' && (
                                  <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    maxLength={1000}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="Post content..."
                                  />
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPost(post.id);
                                    }}
                                    className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                    style={{ 
                                      backgroundColor: courseColor
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPost(null);
                                    }}
                                    className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                    style={{ 
                                      backgroundColor: courseColor
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <ExpandableText 
                                text={post.content}
                                maxLines={10}
                                className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap"
                                buttonColor={courseColor}
                              />
                            )}
                          </div>

                          {/* Poll Component */}
                          {post.poll && (
                            <div className="mb-4 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3">{post.poll.question}</h4>
                              <div className="space-y-2">
                                {post.poll.options.map((option) => {
                                  const hasVoted = post.poll!.userVotedOptionId !== undefined;
                                  const percentage = hasVoted && post.poll!.totalVotes > 0 
                                    ? (option.votes / post.poll!.totalVotes * 100) 
                                    : 0;
                                  const isSelected = post.poll!.userVotedOptionId === option.id;
                                  
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVotePoll(post.id, option.id);
                                      }}
                                      className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                                        isSelected 
                                          ? 'bg-gray-50'
                                          : hasVoted
                                          ? 'border-gray-200 bg-gray-50'
                                          : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}
                                      style={{
                                        borderColor: isSelected ? courseColor : undefined,
                                        backgroundColor: isSelected ? `${courseColor}0D` : undefined
                                      }}
                                    >
                                      {hasVoted && (
                                        <div 
                                          className="absolute inset-0 transition-all duration-300"
                                          style={{ 
                                            width: `${percentage}%`,
                                            backgroundColor: `${courseColor}33`
                                          }}
                                        />
                                      )}
                                      <div className="relative flex items-center justify-between">
                                        <span className="text-sm font-medium">{option.text}</span>
                                        {hasVoted && (
                                          <span className="text-xs text-gray-600">
                                            {option.votes} votes ({percentage.toFixed(1)}%)
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-3 text-xs text-gray-500">{`${post.poll.totalVotes} total votes`}</div>
                            </div>
                          )}

                          {/* Post Actions */}
                          <div className="flex items-center justify-start pt-4 mt-1 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePostLike(post.id);
                                }}
                                disabled={likingPosts.has(post.id)}
                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{
                                  color: post.isLiked ? courseColor : '#6B7280'
                                }}
                                onMouseEnter={(e) => {
                                  if (!post.isLiked) {
                                    e.currentTarget.style.color = courseColor;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!post.isLiked) {
                                    e.currentTarget.style.color = '#6B7280';
                                  }
                                }}
                              >
                                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                {post.likes_count}
                              </button>
                              <button 
                                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await toggleCommentsExpanded(post.id);
                                }}
                              >
                                <MessageCircle className="w-5 h-5" />
                                {post.comments_count}
                              </button>
                              
                              {/* Edit/Delete buttons for post author */}
                              {post.author_id === user?.id && (
                                <div className="flex items-center gap-2">
                                  {post.post_type !== 'poll' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (editingPost === post.id) {
                                          // If already editing, cancel edit mode
                                          setEditingPost(null);
                                        } else {
                                          // Start edit mode
                                          setEditingPost(post.id);
                                          setEditPostTitle(post.title);
                                          setEditPostContent(post.content || '');
                                        }
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePost(post.id, e);
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Inline Comments Section */}
                          {expandedComments[post.id] && (
                            <div className="pt-4 border-t border-gray-100 mt-4">
                              {/* Add Comment Input */}
                              <div className="flex gap-3 mb-4">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white border-2"
                                  style={{ 
                                    backgroundColor: courseColor,
                                    borderColor: courseColor
                                  }}
                                >
                                  {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                                </div>
                                <div className="flex-1">
                                  <Textarea
                                    placeholder="Write a comment..."
                                    value={newComment[post.id] || ''}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    className="min-h-[60px] text-sm resize-none"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  />
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          id={`anonymous-comment-${post.id}`}
                                          checked={postAnonymously}
                                          onChange={(e) => setPostAnonymously(e.target.checked)}
                                          className="sr-only"
                                        />
                                        <div 
                                          className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                                          style={{ 
                                            backgroundColor: postAnonymously ? courseColor : 'white',
                                            borderColor: postAnonymously ? courseColor : '#d1d5db'
                                          }}
                                          onClick={() => setPostAnonymously(!postAnonymously)}
                                        >
                                          {postAnonymously && (
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                      <label htmlFor={`anonymous-comment-${post.id}`} className="text-xs text-gray-600 cursor-pointer">
                                        Post anonymously
                                      </label>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addComment(post.id);
                                      }}
                                      disabled={!newComment[post.id]?.trim()}
                                      className="text-white"
                                      style={{ 
                                        backgroundColor: courseColor
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${courseColor}90`;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = courseColor;
                                      }}
                                    >
                                      Comment
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Loading State for Comments */}
                              {loadingComments.has(post.id) && (
                                <div className="flex items-center justify-center py-4">
                                  <div className="w-6 h-6 border-2 border-[#752432] border-t-transparent rounded-full animate-spin"></div>
                                  <span className="ml-2 text-sm text-gray-600">Loading comments...</span>
                                </div>
                              )}

                              {/* Comments List */}
                              {!loadingComments.has(post.id) && (
                                <div className="space-y-4">
                                  {comments[post.id]?.map((comment) => (
                                    <div key={comment.id} className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                                      <div 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white border-2 ${!comment.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                        style={{ 
                                          backgroundColor: courseColor,
                                          borderColor: courseColor
                                        }}
                                        onClick={() => !comment.is_anonymous && handleProfileClick(comment.author_id, comment.author?.name || 'Anonymous')}
                                      >
                                        {comment.is_anonymous ? (
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                          </svg>
                                        ) : (
                                          comment.author?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="p-3">
                                          <div className="flex items-center gap-2 mb-1">
                                              <div 
                                                className={`${!comment.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  !comment.is_anonymous && handleProfileClick(comment.author_id, comment.author?.name || 'Anonymous');
                                                }}
                                              >
                                              <h5 className="font-medium text-gray-900 text-sm">{comment.is_anonymous ? 'Anonymous' : (comment.author?.name || 'Anonymous')}</h5>
                                            </div>
                                            {!comment.is_anonymous && <span className="text-xs text-gray-500">{comment.author?.year || ''}</span>}
                                            <span className="text-xs text-gray-500">•</span>
                                            <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                                            {comment.is_edited && (
                                              <span className="text-xs text-gray-400 italic">(edited)</span>
                                            )}
                                          </div>
                                          {editingComment === comment.id ? (
                                            <div className="space-y-2">
                                              <textarea
                                                value={editCommentContent}
                                                onChange={(e) => setEditCommentContent(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
                                                placeholder="Comment content..."
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditComment(comment.id);
                                                  }}
                                                  className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                                  style={{ 
                                                    backgroundColor: courseColor
                                                  }}
                                                  onMouseEnter={(e: React.MouseEvent) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                                  }}
                                                  onMouseLeave={(e: React.MouseEvent) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                                  }}
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingComment(null);
                                                  }}
                                                  className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                                  style={{ 
                                                    backgroundColor: courseColor
                                                  }}
                                                  onMouseEnter={(e: React.MouseEvent) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                                  }}
                                                  onMouseLeave={(e: React.MouseEvent) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <ExpandableText 
                                              text={comment.content}
                                              maxLines={10}
                                              className="text-gray-800 text-sm whitespace-pre-wrap"
                                              buttonColor={courseColor}
                                            />
                                          )}
                                          {/* comment actions */}
                                          <div className="mt-2 flex items-center gap-3">
                                            <button 
                                              className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                                comment.isLiked ? '' : 'text-gray-600'
                                              }`}
                                              style={{
                                                color: comment.isLiked ? courseColor : undefined
                                              }}
                                              onMouseEnter={(e) => {
                                                if (!comment.isLiked) {
                                                  e.currentTarget.style.color = courseColor;
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (!comment.isLiked) {
                                                  e.currentTarget.style.color = '';
                                                }
                                              }}
                                              onClick={(e) => { e.stopPropagation(); toggleCommentLike(post.id, comment.id); }}
                                            >
                                              <Heart className={`w-5 h-5 ${comment.isLiked ? 'fill-current' : ''}`} />
                                              {comment.likes_count}
                                            </button>
                                            <button 
                                              className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setReplyingTo(prev => prev === `${post.id}:${comment.id}` ? null : `${post.id}:${comment.id}`); }}
                                            >
                                              Reply
                                            </button>
                                            
                                            {/* Edit/Delete buttons for comment author */}
                                            {comment.author_id === user?.id && (
                                              <>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (editingComment === comment.id) {
                                                      // If already editing, cancel edit mode
                                                      setEditingComment(null);
                                                    } else {
                                                      // Start edit mode
                                                      setEditingComment(comment.id);
                                                      setEditCommentContent(comment.content);
                                                    }
                                                  }}
                                                  className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteComment(comment.id, e);
                                                  }}
                                                  className="text-xs font-medium text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Replies Display */}
                                        {comment.replies && comment.replies.length > 0 && (
                                          <div className="mt-3 ml-4 space-y-2">
                                            {comment.replies.map((reply: any) => (
                                              <div key={reply.id} className="flex items-start gap-2">
                                                <div 
                                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold text-white border-2 text-xs ${!reply.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                                  style={{ 
                                                    backgroundColor: courseColor,
                                                    borderColor: courseColor
                                                  }}
                                                  onClick={() => !reply.is_anonymous && handleProfileClick(reply.author_id, reply.author?.name || 'Anonymous')}
                                                >
                                                  {reply.is_anonymous ? (
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                  ) : (
                                                    reply.author?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'
                                                  )}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                      <div 
                                                        className={`${!reply.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          !reply.is_anonymous && handleProfileClick(reply.author_id, reply.author?.name || 'Anonymous');
                                                        }}
                                                      >
                                                      <h6 className="font-medium text-gray-900 text-xs">{reply.is_anonymous ? 'Anonymous' : (reply.author?.name || 'Anonymous')}</h6>
                                                    </div>
                                                    {!reply.is_anonymous && <span className="text-xs text-gray-500">{reply.author?.year || ''}</span>}
                                                    <span className="text-xs text-gray-500">•</span>
                                                    <span className="text-xs text-gray-500">{formatTimestamp(reply.created_at)}</span>
                                                    {reply.is_edited && (
                                                      <span className="text-xs text-gray-400 italic">(edited)</span>
                                                    )}
                                                  </div>
                                                  {editingComment === reply.id ? (
                                                    <div className="space-y-2">
                                                      <textarea
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none text-xs"
                                                        placeholder="Reply content..."
                                                      />
                                                      <div className="flex gap-2">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditComment(reply.id);
                                                          }}
                                                          className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                                          style={{ 
                                                            backgroundColor: courseColor
                                                          }}
                                                          onMouseEnter={(e: React.MouseEvent) => {
                                                            (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                                          }}
                                                          onMouseLeave={(e: React.MouseEvent) => {
                                                            (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                                          }}
                                                        >
                                                          Save
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingComment(null);
                                                          }}
                                                          className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                                          style={{ 
                                                            backgroundColor: courseColor
                                                          }}
                                                          onMouseEnter={(e: React.MouseEvent) => {
                                                            (e.currentTarget as HTMLElement).style.backgroundColor = `${courseColor}90`;
                                                          }}
                                                          onMouseLeave={(e: React.MouseEvent) => {
                                                            (e.currentTarget as HTMLElement).style.backgroundColor = courseColor;
                                                          }}
                                                        >
                                                          Cancel
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <p className="text-gray-800 text-xs mb-2">{reply.content}</p>
                                                  )}
                                                  <div className="flex items-center gap-3">
                                                    <button 
                                                      className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                                        reply.isLiked ? '' : 'text-gray-600'
                                                      }`}
                                                      style={{
                                                        color: reply.isLiked ? courseColor : undefined
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        if (!reply.isLiked) {
                                                          e.currentTarget.style.color = courseColor;
                                                        }
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        if (!reply.isLiked) {
                                                          e.currentTarget.style.color = '';
                                                        }
                                                      }}
                                                      onClick={(e) => { e.stopPropagation(); toggleReplyLike(post.id, comment.id, reply.id); }}
                                                    >
                                                      <Heart className={`w-5 h-5 ${reply.isLiked ? 'fill-current' : ''}`} />
                                                      {reply.likes_count}
                                                    </button>
                                                    
                                                    {/* Edit/Delete buttons for reply author */}
                                                    {reply.author_id === user?.id && (
                                                      <>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (editingComment === reply.id) {
                                                              // If already editing, cancel edit mode
                                                              setEditingComment(null);
                                                            } else {
                                                              // Start edit mode
                                                              setEditingComment(reply.id);
                                                              setEditCommentContent(reply.content);
                                                            }
                                                          }}
                                                          className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                                        >
                                                          Edit
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteComment(reply.id, e);
                                                          }}
                                                          className="text-xs font-medium text-gray-600 hover:text-red-500 transition-colors"
                                                        >
                                                          Delete
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Reply composer */}
                                        {replyingTo === `${post.id}:${comment.id}` && (
                                          <div className="mt-2 ml-4 space-y-2">
                                            <Textarea
                                              value={replyText[`${post.id}:${comment.id}`] || ''}
                                              onChange={(e) => setReplyText(prev => ({ ...prev, [`${post.id}:${comment.id}`]: e.target.value }))}
                                              placeholder="Write a reply..."
                                              className="min-h-[40px] text-xs"
                                            />
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <div className="relative">
                                                  <input
                                                    type="checkbox"
                                                    id={`anonymous-reply-${post.id}-${comment.id}`}
                                                    checked={replyAnonymously[`${post.id}:${comment.id}`] || false}
                                                    onChange={(e) => setReplyAnonymously(prev => ({ ...prev, [`${post.id}:${comment.id}`]: e.target.checked }))}
                                                    className="sr-only"
                                                  />
                                                  <div 
                                                    className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                                                    style={{ 
                                                      backgroundColor: replyAnonymously[`${post.id}:${comment.id}`] ? courseColor : 'white',
                                                      borderColor: replyAnonymously[`${post.id}:${comment.id}`] ? courseColor : '#d1d5db'
                                                    }}
                                                    onClick={() => setReplyAnonymously(prev => ({ ...prev, [`${post.id}:${comment.id}`]: !prev[`${post.id}:${comment.id}`] }))}
                                                  >
                                                    {replyAnonymously[`${post.id}:${comment.id}`] && (
                                                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                      </svg>
                                                    )}
                                                  </div>
                                                </div>
                                                <label htmlFor={`anonymous-reply-${post.id}-${comment.id}`} className="text-xs text-gray-600 cursor-pointer">
                                                  Post anonymously
                                                </label>
                                              </div>
                                              <Button
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  addReply(post.id, comment.id);
                                                }}
                                                disabled={!replyText[`${post.id}:${comment.id}`]?.trim()}
                                                className="text-white"
                                                style={{ 
                                                  backgroundColor: courseColor
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = `${courseColor}90`;
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = courseColor;
                                                }}
                                              >
                                                Reply
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                    )}
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
              Create Post for {userCourse?.class || courseName}
            </DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or start a discussion with your classmates.
            </DialogDescription>
          </DialogHeader>

                <div className="space-y-4">
            {/* Post Type Selection */}
            <div className="flex gap-2 p-1 rounded-lg">
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
                maxLength={100}
                className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] text-lg font-medium"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newPostTitle.length}/100
              </div>
                  </div>
                  
            {/* Text Content - Only show for text posts */}
            {newPostType === 'text' && (
                      <div>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What are your thoughts?"
                  maxLength={1000}
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                  rows={5}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newPostContent.length}/1000
                </div>
                    </div>
            )}

            {/* Poll Options */}
            {newPostType === 'poll' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Poll options</h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="space-y-1 mb-3 last:mb-0">
                      <div className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          maxLength={100}
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
                        {option.length}/100
                      </div>
                    </div>
                  ))}
                </div>
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
            <div className="flex items-center gap-2 p-3 rounded-lg">
              <div className="relative">
                <input
                  type="checkbox"
                  id="anonymous-post"
                  checked={postAnonymously}
                  onChange={(e) => setPostAnonymously(e.target.checked)}
                  className="sr-only"
                />
                <div 
                  className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                  style={{ 
                    backgroundColor: postAnonymously ? courseColor : 'white',
                    borderColor: postAnonymously ? courseColor : '#d1d5db'
                  }}
                  onClick={() => setPostAnonymously(!postAnonymously)}
                >
                  {postAnonymously && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <label htmlFor="anonymous-post" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <span className={`text-lg ${postAnonymously ? 'relative' : ''}`}>
                  👁️
                  {postAnonymously && (
                    <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xl leading-none pointer-events-none">
                      ╱
                    </span>
                  )}
                </span>
                Post anonymously
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
                  className="text-white"
                  style={{ 
                    backgroundColor: courseColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${courseColor}90`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = courseColor;
                  }}
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

      {/* Confirmation Popup */}
      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        confirmText="Delete"
        cancelText="Cancel"
        position={confirmationPopup.position}
        onConfirm={confirmationPopup.onConfirm}
        onCancel={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}