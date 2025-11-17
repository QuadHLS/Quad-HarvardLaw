import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
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
// Custom Textarea component to match FeedComponent styling
const Textarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  rows = 3,
  ...props 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
  className?: string; 
  rows?: number;
  [key: string]: any;
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#752432] focus:border-[#752432] resize-none ${className}`}
    {...props}
  />
);
import { getStorageUrl } from '../utils/storage';
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
// Dialog components (matching FeedComponent)
const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
);

// ProfileBubble component (matching FeedComponent)
const ProfileBubble = ({ userName, size = "md", borderColor = "#752432", isAnonymous = false, userId, onProfileClick }: { 
  userName: string; 
  size?: "sm" | "md" | "lg"; 
  borderColor?: string; 
  isAnonymous?: boolean;
  userId?: string;
  onProfileClick?: (userId: string, userName: string) => void;
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-10 h-10 text-base"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };
  
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const handleClick = () => {
    if (!isAnonymous && userId && onProfileClick) {
      onProfileClick(userId, userName);
    }
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${
        !isAnonymous && userId && onProfileClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      style={{ 
        backgroundColor: borderColor,
        borderColor: borderColor
      }}
      onClick={handleClick}
    >
      {isAnonymous ? (
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        initials
      )}
    </div>
  );
};

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
  post_type: 'text' | 'poll' | 'youtube';
  is_anonymous: boolean;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  likes_count: number;
  comments_count: number;
  photo_url?: string | null;
  vid_link?: string | null;
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



// Helper function to convert video URLs (YouTube, YouTube Shorts, TikTok, Instagram) to embed format
const getVideoEmbedUrl = (url: string | null | undefined): { embedUrl: string; platform: 'youtube' | 'tiktok' | 'instagram' } | null => {
  if (!url || !url.trim()) return null;
  
  const trimmedUrl = url.trim();
  
  // YouTube (regular videos and shorts)
  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  let watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([^&\s]+)/);
  if (watchMatch) {
    const videoId = watchMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  // Format: https://youtu.be/VIDEO_ID
  let shortMatch = trimmedUrl.match(/youtu\.be\/([^?\s]+)/);
  if (shortMatch) {
    const videoId = shortMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  // Format: https://www.youtube.com/shorts/VIDEO_ID
  let shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([^?\s]+)/);
  if (shortsMatch) {
    const videoId = shortsMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  // Format: https://www.youtube.com/embed/VIDEO_ID
  let embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?\s]+)/);
  if (embedMatch) {
    return { embedUrl: trimmedUrl, platform: 'youtube' };
  }
  
  // If it's just a video ID (no URL structure) - assume YouTube
  if (!trimmedUrl.includes('http') && !trimmedUrl.includes('/') && !trimmedUrl.includes('?')) {
    return { embedUrl: `https://www.youtube.com/embed/${trimmedUrl}`, platform: 'youtube' };
  }
  
  // TikTok
  // Format: https://www.tiktok.com/@username/video/VIDEO_ID
  let tiktokMatch = trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1];
    return { embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`, platform: 'tiktok' };
  }
  
  // Format: https://vm.tiktok.com/CODE or https://tiktok.com/@username/video/VIDEO_ID
  // Note: vm.tiktok.com links need to be resolved to full URLs first, but we can try direct embed
  if (trimmedUrl.includes('tiktok.com') || trimmedUrl.includes('vm.tiktok.com')) {
    // Extract video ID from various TikTok formats
    let vidMatch = trimmedUrl.match(/video\/(\d+)/);
    if (vidMatch) {
      return { embedUrl: `https://www.tiktok.com/embed/v2/${vidMatch[1]}`, platform: 'tiktok' };
    }
  }
  
  // Instagram
  // Format: https://www.instagram.com/p/VIDEO_ID/ or https://www.instagram.com/reel/VIDEO_ID/
  let instagramMatch = trimmedUrl.match(/instagram\.com\/(?:p|reel)\/([^\/\?\s]+)/);
  if (instagramMatch) {
    const postId = instagramMatch[1];
    return { embedUrl: `https://www.instagram.com/p/${postId}/embed/`, platform: 'instagram' };
  }
  
  return null;
};

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
  const [newPostType, setNewPostType] = useState<'text' | 'poll' | 'youtube'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postAnonymously, setPostAnonymously] = useState(false);
  // Post photo state
  const [postPhotoFile, setPostPhotoFile] = useState<File | null>(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [isDragOverPhotoDrop, setIsDragOverPhotoDrop] = useState(false);
  // YouTube link state
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  // Post photo URLs (signed URLs for private bucket)
  const [postPhotoUrls, setPostPhotoUrls] = useState<Map<string, string>>(new Map());
  
  // State for thread view (matching FeedComponent)
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);
  
  // State for comments (matching FeedComponent)
  const [comments, setComments] = useState<Record<string, CourseComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  const [commentAnonymously, setCommentAnonymously] = useState<Record<string, boolean>>({});
  
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

  // Post color functions (matching FeedComponent)
  const getPostColor = useCallback((postId: string) => {
    const colors = ['#0080BD', '#04913A', '#F22F21', '#FFBB06']; // Blue, Green, Red, Yellow
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % 4];
  }, []);

  const getPostHoverColor = useCallback((postId: string) => {
    const hoverColors = ['rgba(0, 128, 189, 0.05)', 'rgba(4, 145, 58, 0.05)', 'rgba(242, 47, 33, 0.05)', 'rgba(255, 187, 6, 0.05)'];
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return hoverColors[Math.abs(hash) % 4];
  }, []);

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

  // Helper function to count words in text
  const countWords = useCallback((text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Helper function to enforce word limit on text input
  const handleTextChangeWithWordLimit = useCallback((value: string, maxWords: number, setter: (value: string) => void) => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length <= maxWords) {
      setter(value);
    } else {
      // If exceeding limit, truncate to maxWords
      const truncated = value.trim().split(/\s+/).slice(0, maxWords).join(' ');
      setter(truncated);
    }
  }, []);

  // Handle post click to open thread view (matching FeedComponent)
  const handlePostClick = (postId: string) => {
    setSelectedPostThread(postId);
    // Always fetch comments when opening thread view (to get latest data)
    setLoadingComments(prev => new Set(prev).add(postId));
    fetchComments(postId);
  };

  // Handle back to feed (matching FeedComponent)
  const handleBackToFeed = () => {
    setSelectedPostThread(null);
    setIsThreadPostHovered(false);
    setHoveredPostId(null);
    setReplyingTo(null);
  };

  // Handle profile click
  const handleProfileClick = (userId: string, userName: string) => {
    if (onNavigateToStudentProfile) {
      onNavigateToStudentProfile(userName);
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
        console.error('Error fetching comments:', error?.message || "Unknown error");
        // Clear loading state on error
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
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
      
      // Clear loading state
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } catch (error) {
      console.error('Error in fetchComments:', error instanceof Error ? error.message : "Unknown error");
      // Clear loading state on error too
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
          is_anonymous: commentAnonymously[postId] || false
        });

      if (error) {
        console.error('Error adding comment:', error?.message || "Unknown error");
        return;
      }

      // Clear the input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setCommentAnonymously(prev => ({ ...prev, [postId]: false }));

      // Refresh comments
      await fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error instanceof Error ? error.message : "Unknown error");
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
        console.error('Error adding reply:', error?.message || "Unknown error");
        return;
      }

      // Clear the input
      setReplyText(prev => ({ ...prev, [`${postId}:${parentCommentId}`]: '' }));
      setReplyAnonymously(prev => ({ ...prev, [`${postId}:${parentCommentId}`]: false }));
      setReplyingTo(null);

      // Refresh comments
      await fetchComments(postId);
    } catch (error) {
      console.error('Error adding reply:', error instanceof Error ? error.message : "Unknown error");
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
          console.error('Error unliking comment:', error?.message || "Unknown error");
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
          console.error('Error liking comment:', error?.message || "Unknown error");
          return;
        }
      }

      // Refresh comments to get updated like counts
      await fetchComments(postId);
    } catch (error) {
      console.error('Error toggling comment like:', error instanceof Error ? error.message : "Unknown error");
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
          console.error('Error unliking reply:', error?.message || "Unknown error");
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
          console.error('Error liking reply:', error?.message || "Unknown error");
          return;
        }
      }

      // Refresh comments to get updated like counts
      await fetchComments(postId);
    } catch (error) {
      console.error('Error toggling reply like:', error instanceof Error ? error.message : "Unknown error");
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
        return;
      }

      // First vote only
      
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: post.poll.id,
          option_id: optionId,
          user_id: user.id
        });

      if (error) {
        console.error('Error voting on poll:', error?.message || "Unknown error");
        return;
      }

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
      console.error('Error handling poll vote:', error instanceof Error ? error.message : "Unknown error");
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
      console.error('Error editing post:', error instanceof Error ? error.message : "Unknown error");
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
          // First, get the post to check if it has a photo
          const { data: postData } = await supabase
            .from('posts')
            .select('photo_url')
            .eq('id', postId)
            .eq('author_id', user?.id)
            .single();

          // Delete photo from bucket if it exists
          if (postData?.photo_url) {
            try {
              const { error: photoError } = await supabase.storage
                .from('post_picture')
                .remove([postData.photo_url]);

              if (photoError) {
                console.error('Error deleting post photo from storage:', photoError);
                // Continue with post deletion even if photo deletion fails
              }
            } catch (photoError) {
              console.error('Error deleting post photo from storage:', photoError);
              // Continue with post deletion even if photo deletion fails
            }
          }

          // Delete all likes for this post
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
          
          // After successful deletion, if we're in thread view and the deleted post is the selected one, go back to feed
          const wasInThreadView = selectedPostThread === postId;
          
          await fetchCoursePosts(); // Refresh posts
          
          // Return to feed view after deletion if we were viewing the deleted post
          if (wasInThreadView) {
            setSelectedPostThread(null);
            setIsThreadPostHovered(false);
            setHoveredPostId(null);
            setReplyingTo(null);
          }
          
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('CoursePage error deleting post:', error instanceof Error ? error.message : "Unknown error");
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
      console.error('Error editing comment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteComment = async (commentId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
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
            console.error('CoursePage delete error:', error?.message || "Unknown error");
            throw error;
          }
          
          // Refresh comments
          // Check both top-level comments and replies
          const postId = Object.keys(comments).find(key => 
            comments[key].some(c => 
              c.id === commentId || 
              (c.replies && c.replies.some(r => r.id === commentId))
            )
          );
          if (postId) {
            await fetchComments(postId);
          }
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('CoursePage error deleting comment:', error instanceof Error ? error.message : "Unknown error");
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle profile click

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
          console.error('Error fetching profile:', error?.message || "Unknown error");
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
        console.error('Error fetching course data:', error instanceof Error ? error.message : "Unknown error");
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
        setPostsLoading(false);
        return;
      }
      
      // Check if we have a course with UUID
      if (!userCourse?.course_id) {
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
          photo_url: post.photo_url || null,
          vid_link: post.vid_link || null,
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

      // Generate signed URLs for post photos
      const postsWithPhotos = transformedPosts.filter(p => p.photo_url);
      if (postsWithPhotos.length > 0) {
        const photoUrlMap = new Map<string, string>();
        await Promise.all(
          postsWithPhotos.map(async (post) => {
            if (post.photo_url) {
              const signedUrl = await getStorageUrl(post.photo_url, 'post_picture');
              if (signedUrl) {
                photoUrlMap.set(post.id, signedUrl);
              }
            }
          })
        );
        setPostPhotoUrls(photoUrlMap);
      } else {
        setPostPhotoUrls(new Map());
      }
    } catch (error) {
      console.error('Error fetching course posts:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setPostsLoading(false);
    }
  };

  // Prevent default drag behavior globally to stop images from opening in new tab
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };

    const handleDrop = (e: DragEvent) => {
      // Only prevent default if not over our drop zone
      // The drop zone handler will prevent default in its own handler
      if (!e.target || !(e.target as Element).closest('.photo-drop-zone')) {
        e.preventDefault();
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

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
    
    // Set a timeout to mark as disconnected if connection takes too long
    const connectionTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        setRealtimeStatus('disconnected');
      }
    }, 15000); // 15 second timeout (increased from 10)

    // Set up realtime channels
    const setupChannels = async () => {
      try {
        // Clean up any existing channels first
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
            startTransition(() => {
              setCoursePosts(prev => prev.filter(post => post.id !== payload.old.id));
            });
          }
        )
        .subscribe((status: any, err: any) => {
          if (err) {
            console.error('Posts channel error:', err instanceof Error ? err.message : "Unknown error");
            // Don't immediately set disconnected - let it retry
          } else if (status === 'SUBSCRIBED') {
            clearTimeout(connectionTimeout);
            setRealtimeStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Don't set disconnected immediately - let it retry
          } else {
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
            // Only refresh if we have a valid course UUID
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Likes channel error:', err instanceof Error ? err.message : "Unknown error");
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
            // Update comment count for the post locally
            startTransition(() => {
              setCoursePosts(prev => prev.map(post => 
                post.id === payload.new.post_id 
                  ? { ...post, comments_count: post.comments_count + 1 }
                  : post
              ));
            });
            
            // Fetch comments if the post is currently selected in thread view
            if (selectedPostThread === payload.new.post_id) {
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
            // Update comment count for the post locally
            startTransition(() => {
              setCoursePosts(prev => prev.map(post => 
                post.id === payload.old.post_id 
                  ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
                  : post
              ));
            });
            
            // Fetch comments if the post is currently selected in thread view
            if (selectedPostThread === payload.old.post_id) {
              await fetchComments(payload.old.post_id);
            }
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Comments channel error:', err instanceof Error ? err.message : "Unknown error");
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
            // Only refresh if we have a valid course UUID
            if (userCourse?.course_id) {
              debouncedFetchPosts();
            }
          }
        )
        .subscribe((_status: any, err: any) => {
          if (err) {
            console.error('Poll votes channel error:', err instanceof Error ? err.message : "Unknown error");
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
      } catch (error) {
        console.error('Error setting up realtime channels:', error instanceof Error ? error.message : "Unknown error");
        setRealtimeStatus('disconnected');
      }
    };

    setupChannels();

    // Cleanup function
    return () => {
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
    // Text posts can have empty content (optional), but polls need at least 2 options
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;
    
    // Validate video link is required for YouTube posts
    if (newPostType === 'youtube' && !newYoutubeLink.trim()) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if we have a course with UUID
      if (!userCourse?.course_id) {
        console.error('No course UUID found');
        return;
      }

      // Upload photo if present (for text posts only)
      let photoFileName: string | null = null;
      if (postPhotoFile && newPostType === 'text') {
        try {
          const fileExt = postPhotoFile.name.split('.').pop() || 'jpg';
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post_picture')
            .upload(fileName, postPhotoFile);

          if (uploadError) {
            console.error('Error uploading post photo:', uploadError);
            alert('Error uploading photo. Please try again.');
            return;
          }

          photoFileName = fileName;
        } catch (uploadError) {
          console.error('Error uploading post photo:', uploadError);
          alert('Error uploading photo. Please try again.');
          return;
        }
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
          is_anonymous: postAnonymously,
          photo_url: photoFileName,
          vid_link: newPostType === 'youtube' ? newYoutubeLink.trim() : null
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating course post:', postError);
        alert(`Error creating post: ${postError.message || 'Unknown error'}`);
        // If post creation failed and we uploaded a photo, clean it up
        if (photoFileName) {
          try {
            await supabase.storage.from('post_picture').remove([photoFileName]);
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded photo:', cleanupError);
          }
        }
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
      setNewYoutubeLink('');
      // Clear photo state
      if (postPhotoPreview) {
        URL.revokeObjectURL(postPhotoPreview);
      }
      setPostPhotoFile(null);
      setPostPhotoPreview(null);
      setShowCreatePostDialog(false);

      // Refresh posts
      await fetchCoursePosts();
    } catch (error) {
      console.error('Error creating course post:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Image compression function for post photos
  const compressPostImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Compression timeout - image too large or complex'));
      }, 30000); // 30 second timeout
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 1200px width/height for post photos)
          const maxSize = 1200;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to target size (2MB for post photos)
          const targetSize = 2 * 1024 * 1024; // 2MB in bytes
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  // If size is acceptable or quality is too low, use this result
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  compressToTargetSize(currentQuality - 0.1);
                }
              } else {
                clearTimeout(timeout);
                resolve(file);
              }
            }, 'image/jpeg', currentQuality);
          };
          
          compressToTargetSize(quality);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle post photo upload
  const handlePostPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File is not an image');
      return;
    }

    // Validate file size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      alert('File is too large (max 8MB)');
      return;
    }

    // Clean up existing photo preview if there is one
    if (postPhotoPreview) {
      URL.revokeObjectURL(postPhotoPreview);
    }

    setUploadingPostPhoto(true);
    
    try {
      // Compress image
      const compressedFile = await compressPostImage(file);
      
      // Store compressed file and create preview
      setPostPhotoFile(compressedFile);
      const previewUrl = URL.createObjectURL(compressedFile);
      setPostPhotoPreview(previewUrl);
    } catch (compressionError) {
      console.error('Error compressing image:', compressionError);
      alert('Error processing image. Please try a different image.');
    } finally {
      setUploadingPostPhoto(false);
      // Reset the file input
      const fileInput = event.target;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Handle remove post photo
  const handleRemovePostPhoto = () => {
    if (postPhotoPreview) {
      URL.revokeObjectURL(postPhotoPreview);
    }
    setPostPhotoFile(null);
    setPostPhotoPreview(null);
    setIsDragOverPhotoDrop(false);
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
          console.error('Error unliking post:', error?.message || "Unknown error");
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
          console.error('Error liking post:', error?.message || "Unknown error");
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
      console.error('Error toggling post like:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Helper functions for semester matching (matching HomePage logic)
  const getSemestersFromCode = (semesterCode: string): ('FA' | 'WI' | 'SP')[] => {
    switch (semesterCode) {
      case 'FA': return ['FA'];
      case 'WI': return ['WI'];
      case 'SP': return ['SP'];
      case 'FS': return ['FA', 'SP'];
      case 'FW': return ['FA', 'WI'];
      case 'WS': return ['WI', 'SP'];
      default: return [];
    }
  };

  const courseMatchesSemester = (courseTerm: string, selectedSemester: 'FA' | 'WI' | 'SP'): boolean => {
    if (!courseTerm || courseTerm === 'TBD') return false;
    const semesterCode = courseTerm.slice(-2);
    const semesters = getSemestersFromCode(semesterCode);
    return semesters.includes(selectedSemester);
  };

  const formatDisplayCourseName = (rawName: string): string => {
    if (!rawName) return rawName;
    const requiredPatterns = [
      'Civil Procedure',
      'Contracts',
      'Criminal Law',
      'Torts',
      'Constitutional Law',
      'Property',
      'Legislation and Regulation'
    ];
    const pattern = new RegExp(`^(?:${requiredPatterns.join('|')})\\s([1-7])$`);
    if (pattern.test(rawName)) {
      return rawName.replace(/\s[1-7]$/, '');
    }
    return rawName;
  };

  // Get current semester using date-based logic (matching HomePage)
  const getCurrentSemester = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      return `${year}FA`;
    } else if (month === 1 && day >= 5 && day <= 21) {
      return `${year}WI`;
    } else if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      return `${year}SP`;
    } else {
      return `${year}FA`;
    }
  };

  // Helper function to get course-specific color (matches HomePage color system exactly)
  const getCourseColor = (courseName: string) => {
    // Use the same color cycle as HomePage
    const colorCycle = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
    
    // Get current semester
    const currentSemester = getCurrentSemester();
    const currentTerm = currentSemester.slice(-2) as 'FA' | 'WI' | 'SP';
    
    // Filter courses for current semester (same logic as HomePage)
    const filteredCourses = userCourses.filter(course => {
      const courseSemester = course.schedule?.semester ?? '';
      return courseMatchesSemester(courseSemester, currentTerm);
    });
    
    // Find the course's index in the filtered course list (matching HomePage behavior)
    const courseIndex = filteredCourses.findIndex((course: UserCourse) => {
      const courseClass = course.class || '';
      const formattedClassName = formatDisplayCourseName(courseClass);
      const formattedCourseName = formatDisplayCourseName(courseName);
      
      return formattedClassName === formattedCourseName || 
             courseClass === courseName || 
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

  // Render thread view (matching FeedComponent)
  const renderThreadView = () => {
    const selectedPost = coursePosts.find(p => p.id === selectedPostThread);
    if (!selectedPost) return null;
    
    return (
      <>
      <div className="h-full overflow-hidden" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="flex justify-center min-w-0" style={{ minWidth: '400px' }}>
          <div className="w-full max-w-4xl flex flex-col" style={{ height: 'calc(100vh - 12px)', minWidth: '400px' }}>
            <div className="w-full h-full overflow-y-auto scrollbar-hide" style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <div className="p-6" style={{ paddingBottom: '80px' }}>
                <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToFeed}
              className="flex items-center gap-2 text-[#752432] bg-white hover:bg-[#752432]/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Button>
          </div>
          
          {/* Original Post (highlight on hover, only this area is hoverable/clickable) */}
          <Card 
            className="mb-6 border-l-4 cursor-pointer" 
            style={{ 
              backgroundColor: '#FEFBF6',
              borderLeftColor: getPostColor(selectedPost.id),
              boxShadow: isThreadPostHovered ? `0 0 0 2px ${getPostHoverColor(selectedPost.id)}` : undefined
            }}
            onMouseEnter={() => setIsThreadPostHovered(true)}
            onMouseLeave={() => setIsThreadPostHovered(false)}
            onClick={() => { /* no-op click target for post area in thread view */ }}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <ProfileBubble 
                  userName={selectedPost.author?.name || 'Anonymous'} 
                  size="lg" 
                  borderColor={getPostColor(selectedPost.id)} 
                  isAnonymous={selectedPost.is_anonymous}
                  userId={selectedPost.author_id}
                  onProfileClick={handleProfileClick}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className={`${!selectedPost.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          !selectedPost.is_anonymous && handleProfileClick(selectedPost.author_id, selectedPost.author?.name || 'Anonymous');
                        }}
                    >
                      <h4 className="font-semibold text-gray-900">{selectedPost.is_anonymous ? 'Anonymous' : (selectedPost.author?.name || 'Anonymous')}</h4>
                    </div>
                    {!selectedPost.is_anonymous && <span className="text-sm text-gray-500">{selectedPost.author?.year || ''}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{formatTimestamp(selectedPost.created_at)}</span>
                    {selectedPost.is_edited && (
                      <span className="text-xs text-gray-400 italic">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {editingPost !== selectedPost.id && (
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedPost.title}
                </h1>
              )}
              
              {/* Edit Post Form in Thread View */}
              {editingPost === selectedPost.id ? (
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl font-bold"
                    placeholder="Post title..."
                  />
                  {selectedPost.post_type !== 'poll' && (
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                      placeholder="Post content..."
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPost(selectedPost.id);
                      }}
                      className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                      style={{ 
                        backgroundColor: getPostColor(selectedPost.id)
                      }}
                      onMouseEnter={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                      }}
                      onMouseLeave={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
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
                        backgroundColor: getPostColor(selectedPost.id)
                      }}
                      onMouseEnter={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                      }}
                      onMouseLeave={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <ExpandableText 
                    text={selectedPost.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                    maxLines={10}
                    className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                    buttonColor={getPostColor(selectedPost.id)}
                  />
                </div>
              )}

              {/* Post Photo in Thread View */}
              {selectedPost.photo_url && postPhotoUrls.has(selectedPost.id) && (
                <div className="mb-4 mt-4" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={postPhotoUrls.get(selectedPost.id) || ''}
                    alt="Post"
                    className="rounded-lg"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '450px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => {
                      // If signed URL expires, regenerate it
                      if (selectedPost.photo_url) {
                        getStorageUrl(selectedPost.photo_url, 'post_picture').then(url => {
                          if (url) {
                            setPostPhotoUrls(prev => {
                              const newMap = new Map(prev);
                              newMap.set(selectedPost.id, url);
                              return newMap;
                            });
                          }
                        });
                      }
                    }}
                  />
                </div>
              )}

              {/* YouTube Video in Thread View */}
              {selectedPost.vid_link && (
                <div className="mb-4 mt-4">
                  {(() => {
                    const embedData = getVideoEmbedUrl(selectedPost.vid_link);
                    if (!embedData) {
                      return null;
                    }
                    const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                    const isInstagram = embedData.platform === 'instagram';
                    // Use different scales to make the actual content appear the same size
                    const scale = isInstagram ? 0.65 : 0.90;
                    const width = isInstagram ? '153.85%' : '111.11%';
                    const height = isInstagram ? '153.85%' : '111.11%';
                    return (
                      <div 
                        className="relative overflow-hidden rounded-lg" 
                        style={isVertical 
                          ? { 
                              maxHeight: '600px', 
                              maxWidth: '45%',
                              width: '45%',
                              aspectRatio: '9/16',
                              margin: '0 auto'
                            } 
                          : { paddingBottom: '56.25%', minHeight: '200px', width: '100%' }
                        }
                      >
                        <iframe
                          src={embedData.embedUrl}
                          title={`${embedData.platform} video player`}
                          frameBorder="0"
                          scrolling="no"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className={isVertical ? "rounded-lg" : "absolute top-0 left-0 w-full h-full rounded-lg"}
                          style={isVertical 
                            ? { 
                                border: 'none', 
                                overflow: 'hidden',
                                transform: `translate(-50%, -50%) scale(${scale})`,
                                transformOrigin: 'center center',
                                width: width,
                                height: height,
                                position: 'absolute',
                                left: '50%',
                                top: '50%'
                              }
                            : { border: 'none', overflow: 'hidden' }
                          }
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {/* Poll in thread view */}
              {selectedPost.poll && (
                <div className="mb-4 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedPost.poll.question}</h4>
                  <div className="space-y-2">
                    {selectedPost.poll.options.map((option) => {
                      const hasVoted = selectedPost.poll!.userVotedOptionId !== undefined;
                      const percentage = selectedPost.poll!.totalVotes > 0 
                        ? (option.votes / selectedPost.poll!.totalVotes * 100) 
                        : 0;
                      const isSelected = selectedPost.poll!.userVotedOptionId === option.id;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVotePoll(selectedPost.id, option.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                            isSelected 
                              ? 'bg-gray-50'
                              : hasVoted
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          style={{
                            borderColor: isSelected ? getPostColor(selectedPost.id) : undefined,
                            backgroundColor: isSelected ? `${getPostColor(selectedPost.id)}0D` : undefined
                          }}
                        >
                          {hasVoted && (
                          <div 
                            className="absolute inset-0 transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `${getPostColor(selectedPost.id)}33`
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
                  <div className="mt-3 text-xs text-gray-500">{selectedPost.poll.totalVotes} total votes</div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 relative z-10">
                <div className="flex items-center gap-4 relative z-10">
                  <button
                    onClick={() => togglePostLike(selectedPost.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      selectedPost.isLiked ? '' : 'text-gray-600'
                    }`}
                    style={{
                      color: selectedPost.isLiked ? getPostColor(selectedPost.id) : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedPost.isLiked) {
                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedPost.isLiked) {
                        (e.currentTarget as HTMLElement).style.color = '';
                      }
                    }}
                  >
                    <Heart className={`w-5 h-5 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                    {selectedPost.likes_count}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                    {selectedPost.comments_count} comments
                  </span>
                  
                  {/* Edit/Delete buttons for post author */}
                  {selectedPost.author_id === user?.id && (
                    <div className="flex items-center gap-2 relative z-10">
                      {selectedPost.post_type !== 'poll' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (editingPost === selectedPost.id) {
                              setEditingPost(null);
                            } else {
                              setEditingPost(selectedPost.id);
                              setEditPostTitle(selectedPost.title);
                              setEditPostContent(selectedPost.content || '');
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                          style={{ 
                            pointerEvents: 'auto',
                            color: '#6B7280'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = getPostColor(selectedPost.id);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6B7280';
                          }}
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
                          e.preventDefault();
                          handleDeletePost(selectedPost.id, e);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                        style={{ 
                          pointerEvents: 'auto',
                          color: '#6B7280'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6B7280';
                        }}
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

              {/* Add top-level reply (comment) to post */}
              <div className="mt-4">
                <div className="flex gap-3">
                  <ProfileBubble userName={userProfile?.full_name || 'User'} size="md" borderColor={getPostColor(selectedPost.id)} />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment[selectedPost.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                      className="min-h-[60px] text-sm resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`anonymous-comment-thread-${selectedPost.id}`}
                            checked={commentAnonymously[selectedPost.id] || false}
                            onChange={(e) => setCommentAnonymously(prev => ({ ...prev, [selectedPost.id]: e.target.checked }))}
                            className="sr-only"
                          />
                          <div 
                            className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                            style={{ 
                              backgroundColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id) : 'white',
                              borderColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id) : '#d1d5db'
                            }}
                            onClick={() => setCommentAnonymously(prev => ({ ...prev, [selectedPost.id]: !prev[selectedPost.id] }))}
                          >
                            {commentAnonymously[selectedPost.id] && (
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <label htmlFor={`anonymous-comment-thread-${selectedPost.id}`} className="text-xs text-gray-600 cursor-pointer">
                          Post anonymously
                        </label>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addComment(selectedPost.id)}
                        disabled={!newComment[selectedPost.id]?.trim()}
                        className="text-white"
                        style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                        }}
                        onMouseLeave={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                        }}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Comments */}
          {loadingComments.has(selectedPost.id) ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#752432] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {comments[selectedPost.id]?.map((comment) => (
              <div key={comment.id} className="mb-4 ml-8">
                  <div className="flex items-start gap-3">
                    <ProfileBubble 
                      userName={comment.author?.name || 'Anonymous'} 
                      size="md" 
                      borderColor={getPostColor(selectedPost.id)} 
                      isAnonymous={comment.is_anonymous}
                      userId={comment.author_id}
                      onProfileClick={handleProfileClick}
                    />
                    <div className="flex-1">
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
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
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
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
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
                          className="text-gray-800 text-base mb-2 whitespace-pre-wrap"
                          buttonColor={getPostColor(selectedPost.id)}
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <button 
                          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                            comment.isLiked ? '' : 'text-gray-600'
                          }`}
                          style={{
                            color: comment.isLiked ? getPostColor(selectedPost.id) : undefined
                          }}
                          onMouseEnter={(e: React.MouseEvent) => {
                            if (!comment.isLiked) {
                              (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                            }
                          }}
                          onMouseLeave={(e: React.MouseEvent) => {
                            if (!comment.isLiked) {
                              (e.currentTarget as HTMLElement).style.color = '';
                            }
                          }}
                          onClick={() => toggleCommentLike(selectedPost.id, comment.id)}
                        >
                          <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes_count}
                        </button>
                        <button 
                          className="text-xs font-medium transition-colors"
                          style={{ 
                            color: '#6B7280'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = getPostColor(selectedPost.id);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6B7280';
                          }}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            setReplyingTo(prev => prev === `${selectedPost.id}:${comment.id}` ? null : `${selectedPost.id}:${comment.id}`); 
                          }}
                        >
                          Reply
                        </button>
                        
                        {/* Edit/Delete buttons for comment author */}
                        {comment.author_id === user?.id && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (editingComment === comment.id) {
                                  setEditingComment(null);
                                } else {
                                  setEditingComment(comment.id);
                                  setEditCommentContent(comment.content);
                                }
                              }}
                              className="text-xs font-medium transition-colors"
                              style={{ 
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = getPostColor(selectedPost.id);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteComment(comment.id, e);
                              }}
                              className="text-xs font-medium transition-colors"
                              style={{ 
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#DC2626';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                                  <ProfileBubble 
                                    userName={reply.author?.name || 'Anonymous'} 
                                    size="sm" 
                                    borderColor={getPostColor(selectedPost.id)} 
                                    isAnonymous={reply.is_anonymous}
                                    userId={reply.author_id}
                                    onProfileClick={handleProfileClick}
                                  />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className={`${!reply.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      !reply.is_anonymous && handleProfileClick(reply.author_id, reply.author?.name || 'Anonymous');
                                    }}
                                  >
                                    <h6 className="font-medium text-gray-900 text-sm">{reply.is_anonymous ? 'Anonymous' : (reply.author?.name || 'Anonymous')}</h6>
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
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
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
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <ExpandableText 
                                    text={reply.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                                    maxLines={10}
                                    className="text-gray-800 text-sm mb-2 whitespace-pre-wrap"
                                    buttonColor={getPostColor(selectedPost.id)}
                                  />
                                )}
                                <div className="flex items-center gap-3">
                                  <button 
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                      reply.isLiked ? '' : 'text-gray-600'
                                    }`}
                                    style={{
                                      color: reply.isLiked ? getPostColor(selectedPost.id) : undefined
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                      if (!reply.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                                      }
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                      if (!reply.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = '';
                                      }
                                    }}
                                    onClick={() => toggleReplyLike(selectedPost.id, comment.id, reply.id)}
                                  >
                                    <Heart className={`w-4 h-4 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    {reply.likes_count}
                                  </button>
                                  
                                  {/* Edit/Delete buttons for reply author */}
                                  {reply.author_id === user?.id && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (editingComment === reply.id) {
                                            setEditingComment(null);
                                          } else {
                                            setEditingComment(reply.id);
                                            setEditCommentContent(reply.content);
                                          }
                                        }}
                                        className="text-xs font-medium transition-colors"
                                        style={{ 
                                          color: '#6B7280'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = getPostColor(selectedPost.id);
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#6B7280';
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDeleteComment(reply.id, e);
                                        }}
                                        className="text-xs font-medium transition-colors"
                                        style={{ 
                                          color: '#6B7280'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#DC2626';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#6B7280';
                                        }}
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

                      {/* reply composer (only one level deep) */}
                      {replyingTo === `${selectedPost.id}:${comment.id}` && (
                        <div className="mt-2 ml-4 space-y-2">
                          <Textarea
                            value={replyText[`${selectedPost.id}:${comment.id}`] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="min-h-[40px] text-xs"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id={`anonymous-reply-thread-${selectedPost.id}-${comment.id}`}
                                  checked={replyAnonymously[`${selectedPost.id}:${comment.id}`] || false}
                                  onChange={(e) => setReplyAnonymously(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.checked }))}
                                  className="sr-only"
                                />
                                <div 
                                  className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                                  style={{ 
                                    backgroundColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id) : 'white',
                                    borderColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id) : '#d1d5db'
                                  }}
                                  onClick={() => setReplyAnonymously(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: !prev[`${selectedPost.id}:${comment.id}`] }))}
                                >
                                  {replyAnonymously[`${selectedPost.id}:${comment.id}`] && (
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <label htmlFor={`anonymous-reply-thread-${selectedPost.id}-${comment.id}`} className="text-xs text-gray-600 cursor-pointer">
                                Post anonymously
                              </label>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addReply(selectedPost.id, comment.id)}
                              disabled={!replyText[`${selectedPost.id}:${comment.id}`]?.trim()}
                              className="text-white"
                              style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                              }}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
      </>
    );
  };

  // Fetch real students for the course
  const fetchCourseStudents = async () => {
    try {
      // Check if we have a course UUID
      if (!userCourse?.course_id) {
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
        setCourseStudents([]);
        return;
      }

      // Extract user IDs
      const userIds = enrollments.map((enrollment: any) => enrollment.user_id);

      // Then, get profile information for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, class_year, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
        return;
      }

      // Exclude specific emails
      const excludedEmails = [
        '123@jd27.law.harvard.edu',
        'sr1@harvard.edu',
        'sr2@harvard.edu',
        'sr3@harvard.edu',
        'sr4@harvard.edu',
        'sr5@harvard.edu',
        'sr6@harvard.edu',
        'sr7@harvard.edu',
        'master@harvard.edu'
      ];

      // Transform the data and filter out excluded emails
      const studentList = profiles
        ?.filter((profile: any) => !excludedEmails.includes(profile.email))
        .map((profile: any) => ({
          name: profile.full_name || 'Unknown',
          year: profile.class_year || ''
        })) || [];

      setCourseStudents(studentList);
    } catch (error) {
      console.error('Error fetching course students:', error instanceof Error ? error.message : "Unknown error");
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

  // Conditional rendering - show thread view if post is selected
  if (selectedPostThread) {
    return renderThreadView();
  }

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
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-white hover:bg-gray-100"
                style={{ color: courseColor }}
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
            <Card className="flex flex-col overflow-hidden w-full" style={{ height: 'calc(100vh - 230px)' }}>
              <div className="text-white p-4 pb-3" style={{ backgroundColor: courseColor }}>
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                    Students ({courseStudents.length})
                </h3>
              </div>
              <div className="bg-white p-3 pt-0 -mt-3 overflow-y-auto" style={{ 
                height: 'calc(100vh - 300px)',
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
            <Card className="overflow-hidden w-full" style={{ height: 'calc(100vh - 230px)' }}>
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
                    className="px-3 py-1.5 text-sm font-medium rounded transition-colors bg-white hover:bg-gray-100"
                    style={{ color: courseColor }}
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
                  {!postsLoading && coursePosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full w-full text-gray-500">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 py-4 pt-1" style={{ paddingBottom: '160px' }}>
                      {coursePosts.map((post) => (
                      <div 
                        key={post.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
                        style={{ 
                          backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id) : '#FEFBF6',
                          borderLeftColor: getPostColor(post.id)
                        }}
                        onClick={() => handlePostClick(post.id)}
                        onMouseEnter={() => setHoveredPostId(post.id)}
                        onMouseLeave={() => setHoveredPostId(prev => (prev === post.id ? null : prev))}
                      >
                        <div className="p-4">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                <div 
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white border-2 ${!post.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                  style={{ 
                                    backgroundColor: courseColor,
                                    borderColor: courseColor
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    !post.is_anonymous && handleProfileClick(post.author_id, post.author?.name || 'Anonymous');
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
                                    <h4 
                                      className={`font-semibold text-gray-900 text-sm ${!post.is_anonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        !post.is_anonymous && handleProfileClick(post.author_id, post.author?.name || 'Anonymous');
                                      }}
                                    >
                                      {post.is_anonymous ? 'Anonymous' : (post.author?.name || 'Anonymous')}
                                    </h4>
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

                          {/* Post Photo */}
                          {post.photo_url && postPhotoUrls.has(post.id) && (
                            <div className="mb-3 mt-3" onClick={(e) => e.stopPropagation()}>
                              <img
                                src={postPhotoUrls.get(post.id) || ''}
                                alt="Post"
                                className="rounded-lg"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '450px',
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  display: 'block'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onError={(e) => {
                                  // If signed URL expires, regenerate it
                                  if (post.photo_url) {
                                    getStorageUrl(post.photo_url, 'post_picture').then(url => {
                                      if (url) {
                                        setPostPhotoUrls(prev => {
                                          const newMap = new Map(prev);
                                          newMap.set(post.id, url);
                                          return newMap;
                                        });
                                      }
                                    });
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* YouTube Video */}
                          {post.vid_link && (
                            <div className="mb-3 mt-3">
                              {(() => {
                                const embedData = getVideoEmbedUrl(post.vid_link);
                                if (!embedData) {
                                  return null;
                                }
                                const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                                const isInstagram = embedData.platform === 'instagram';
                                const scale = isInstagram ? 0.75 : 0.85;
                                const width = isInstagram ? '133.33%' : '117.65%';
                                const height = isInstagram ? '133.33%' : '117.65%';
                                return (
                                  <div 
                                    className="relative overflow-hidden rounded-lg" 
                                    style={isVertical 
                                      ? { 
                                          maxHeight: '600px', 
                                          maxWidth: isInstagram ? '75%' : '65%',
                                          width: isInstagram ? '75%' : '65%',
                                          aspectRatio: '9/16',
                                          margin: '0 auto'
                                        } 
                                      : { paddingBottom: '56.25%', minHeight: '200px', width: '100%' }
                                    }
                                  >
                                    <iframe
                                      src={embedData.embedUrl}
                                      title={`${embedData.platform} video player`}
                                      frameBorder="0"
                                      scrolling="no"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                      className={isVertical ? "rounded-lg" : "absolute top-0 left-0 w-full h-full rounded-lg"}
                                      style={isVertical 
                                        ? { 
                                            border: 'none', 
                                            overflow: 'hidden',
                                            transform: `translate(-50%, -50%) scale(${scale})`,
                                            transformOrigin: 'center center',
                                            width: width,
                                            height: height,
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%'
                                          }
                                        : { border: 'none', overflow: 'hidden' }
                                      }
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          )}

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
                          <div className="flex items-center justify-start pt-4 mt-1 border-t border-gray-200 relative z-10">
                            <div className="flex items-center gap-4 relative z-10">
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
                              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                <MessageCircle className="w-5 h-5" />
                                {post.comments_count}
                              </span>
                              
                              {/* Edit/Delete buttons for post author */}
                              {post.author_id === user?.id && (
                                <div className="flex items-center gap-2 relative z-10">
                                  {post.post_type !== 'poll' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
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
                                      className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                                      style={{ 
                                        pointerEvents: 'auto',
                                        color: '#6B7280'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = courseColor;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#6B7280';
                                      }}
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
                                      e.preventDefault();
                                      handleDeletePost(post.id, e);
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                                    style={{ 
                                      pointerEvents: 'auto',
                                      color: '#6B7280'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#DC2626';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#6B7280';
                                    }}
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
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          </Card>
        </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog 
        open={showCreatePostDialog} 
        onOpenChange={(open) => {
          setShowCreatePostDialog(open);
          // Clear photo and video link when dialog closes
          if (!open) {
            if (postPhotoPreview) {
              handleRemovePostPhoto();
            }
            setNewYoutubeLink('');
            setIsDragOverPhotoDrop(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Create a post
            </DialogTitle>
            <DialogDescription>
              Share your thoughts or ask questions for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Post Type Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setNewPostType('text');
                  // Clear video link when switching to text
                  setNewYoutubeLink('');
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  newPostType === 'text' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <img src="/text_picture_icon.svg" alt="Text and Picture" className="h-5 w-auto object-contain" />
                <span>Text and Picture</span>
              </button>
              <button
                onClick={() => {
                  // Clear photo when switching to youtube (photos only for text posts)
                  if (postPhotoPreview) {
                    handleRemovePostPhoto();
                  }
                  setNewPostType('youtube');
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  newPostType === 'youtube' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <img src="/yt_icon_red_digital.png" alt="YouTube" className="h-6 w-auto object-contain" />
                <img src="/Youtube_shorts_icon.svg" alt="YouTube Shorts" className="h-5 w-auto object-contain" />
                <img src="/TikTok_Icon_Black_Circle.png" alt="TikTok" className="h-5 w-auto object-contain" />
                <img src="/Instagram_Glyph_Gradient.png" alt="Instagram" className="h-5 w-auto object-contain" />
              </button>
              <button
                onClick={() => {
                  // Clear photo and video link when switching to poll
                  if (postPhotoPreview) {
                    handleRemovePostPhoto();
                  }
                  setNewYoutubeLink('');
                  setNewPostType('poll');
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  newPostType === 'poll' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <img src="/poll_icon.svg" alt="Poll" className="h-5 w-auto object-contain align-middle" />
                <span className="align-middle">Poll</span>
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
              <div className="space-y-3">
                <div>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPostContent)}
                    placeholder="What are your thoughts?"
                    className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                    rows={5}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {countWords(newPostContent)}/1000 words
                  </div>
                </div>

                {/* Photo Upload Dropbox */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Add a photo</div>
                  <div className="photo-drop-zone">
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative overflow-hidden ${
                        isDragOverPhotoDrop 
                          ? 'border-[#752432] bg-gray-50' 
                          : 'border-gray-300 hover:border-[#752432] hover:bg-gray-50'
                      }`}
                      style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverPhotoDrop(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverPhotoDrop(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragOverPhotoDrop(false);
                        
                        const files = e.dataTransfer.files;
                        if (files.length > 0 && user?.id) {
                          // Only process the first file, ignore others
                          const file = files[0];
                          if (file.type.startsWith('image/')) {
                            // Create a synthetic event to reuse handlePostPhotoUpload
                            const syntheticEvent = {
                              target: { files: [file], value: '' }
                            } as unknown as React.ChangeEvent<HTMLInputElement>;
                            handlePostPhotoUpload(syntheticEvent);
                          }
                        }
                      }}
                      onClick={() => {
                        if (!postPhotoPreview) {
                          document.getElementById('post-photo-upload')?.click();
                        }
                      }}
                    >
                      {postPhotoPreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={postPhotoPreview}
                            alt="Post preview"
                            className="max-w-full max-h-full object-contain"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePostPhoto();
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg z-10"
                            aria-label="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {uploadingPostPhoto ? 'Processing image...' : 'Add a photo'}
                          </span>
                          <span className="text-xs text-gray-500">Click to upload or drag and drop</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePostPhotoUpload}
                      disabled={uploadingPostPhoto}
                      className="hidden"
                      id="post-photo-upload"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Content - Only show for youtube posts */}
            {newPostType === 'youtube' && (
              <div className="space-y-3">
                <div>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPostContent)}
                    placeholder="What are your thoughts?"
                    className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                    rows={5}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {countWords(newPostContent)}/1000 words
                  </div>
                </div>

                {/* YouTube Link Input */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Paste video link (YouTube, YouTube Shorts, TikTok, or Instagram)</div>
                  <Input
                    value={newYoutubeLink}
                    onChange={(e) => setNewYoutubeLink(e.target.value)}
                    placeholder="Paste YouTube, TikTok, or Instagram link"
                    className="border-gray-300 focus:border-[#752432] focus:ring-[#752432]"
                  />
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
                          onChange={(e) => {
                            const newOptions = [...pollOptions];
                            newOptions[index] = e.target.value;
                            setPollOptions(newOptions);
                          }}
                          placeholder={`Option ${index + 1}`}
                          maxLength={100}
                          className="flex-1"
                        />
                        {pollOptions.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPollOptions(pollOptions.filter((_, i) => i !== index));
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous-post"
                    checked={postAnonymously}
                    onChange={(e) => setPostAnonymously(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#752432] bg-gray-100 border-gray-300 rounded focus:ring-0 focus:outline-none"
                  />
                  <label htmlFor="anonymous-post" className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <span className={`text-sm ${postAnonymously ? 'relative' : ''}`}>
                      👁️
                      {postAnonymously && (
                        <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-base leading-none pointer-events-none">
                          ╱
                        </span>
                      )}
                    </span>
                    Post anonymously
                  </label>
                </div>
                <div className="text-xs text-gray-500">
                  Remember to be respectful and follow community guidelines
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setNewPostTitle('');
                    setNewPostContent('');
                    setNewPostType('text');
                    setPollOptions(['', '']);
                    setPostAnonymously(false);
                    setNewYoutubeLink('');
                    // Clear photo state
                    if (postPhotoPreview) {
                      handleRemovePostPhoto();
                    }
                    setShowCreatePostDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCoursePost}
                  className="text-white hover:opacity-90"
                  style={{ 
                    backgroundColor: (userCourse && getCourseColor(userCourse.class)) || '#752432'
                  }}
                  disabled={
                    !newPostTitle.trim() || 
                    (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) ||
                    (newPostType === 'youtube' && !newYoutubeLink.trim())
                  }
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
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
