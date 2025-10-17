import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// Interfaces
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
  expiresAt?: string;
}

interface Post {
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
  // UI computed fields
  author?: {
    name: string;
    year: string;
  };
  course?: {
    name: string;
  };
  isLiked?: boolean;
  poll?: Poll;
}

interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  likes_count: number;
  // UI computed fields
  author?: {
    name: string;
    year: string;
  };
  isLiked?: boolean;
  replies?: Comment[];
}

// Component props interface
interface FeedProps {
  onPostClick?: (postId: string) => void;
  feedMode?: 'campus' | 'my-courses';
  onFeedModeChange?: (mode: 'campus' | 'my-courses') => void;
  myCourses?: string[];
  onThreadViewChange?: (isOpen: boolean) => void;
}

// Inline UI Components
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

// const Bookmark = ({ className, fill }: { className?: string; fill?: boolean }) => ( // removed
//   <svg className={className} width="24" height="24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
//   </svg>
// );

// const MoreHorizontal = ({ className }: { className?: string }) => ( // removed
//   <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
//   </svg>
// );

// const Megaphone = ({ className }: { className?: string }) => ( // removed
//   <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
//   </svg>
// );

// const EyeOff = ({ className }: { className?: string }) => ( // removed
//   <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
//   </svg>
// );

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ProfileBubble component
const ProfileBubble = ({ userName, size = "md", borderColor = "#752432" }: { userName: string; size?: "sm" | "md" | "lg"; borderColor?: string }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-10 h-10 text-base"
  };
  
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2`}
      style={{ 
        backgroundColor: borderColor,
        borderColor: borderColor
      }}
    >
      {initials}
    </div>
  );
};

// Card component
const Card = ({ children, className = "", style = {}, onClick, onMouseEnter, onMouseLeave }: { 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => (
  <div 
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    style={style}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </div>
);

// Button component
const Button = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "default", 
  size = "md", 
  disabled = false,
  ...props 
}: { 
  children?: React.ReactNode; 
  onClick?: (e?: any) => void; 
  className?: string; 
  variant?: "default" | "outline" | "ghost"; 
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  [key: string]: any;
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-[#752432] text-white hover:bg-[#752432]/90 focus:ring-[#752432]",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-[#752432]",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-[#752432]"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input component
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

// Textarea component
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

// Dialog components
const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
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

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    {children}
  </div>
);

const DialogTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-1">
    {children}
  </p>
);

// DropdownMenu components - removed
// const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
//   const [open, setOpen] = useState(false);
//   
//   return (
//     <div className="relative">
//       {React.Children.map(children, child => {
//         if (React.isValidElement(child)) {
//           return React.cloneElement(child, { open, setOpen } as any);
//         }
//         return child;
//       })}
//     </div>
//   );
// };

// const DropdownMenuTrigger = ({ children, open, setOpen }: { children: React.ReactNode; asChild?: boolean; open?: boolean; setOpen?: (open: boolean) => void }) => (
//   <div onClick={() => setOpen?.(!open)}>
//     {children}
//   </div>
// );

// const DropdownMenuContent = ({ children, align = "end", open, className = "" }: { children: React.ReactNode; align?: "start" | "end"; open?: boolean; setOpen?: (open: boolean) => void; className?: string }) => {
//   if (!open) return null;
//   
//   return (
//     <div 
//       className={`absolute z-50 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg ${align === "end" ? "right-0" : "left-0"} ${className}`}
//       onClick={(e) => e.stopPropagation()}
//     >
//       {children}
//     </div>
//   );
// };

// const DropdownMenuItem = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: (e?: any) => void }) => (
//   <button
//     className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${className}`}
//     onClick={onClick}
//   >
//     {children}
//   </button>
// );

export function Feed({ onPostClick, feedMode = 'campus', onFeedModeChange, myCourses = ['Contract Law', 'Torts', 'Civil Procedure', 'Property Law'], onThreadViewChange }: FeedProps) {
  // State management
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [newPostTarget, setNewPostTarget] = useState<'campus' | 'my-courses'>('campus');
  const [selectedCourseForPost, setSelectedCourseForPost] = useState('');
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // format: `${postId}:${commentId}`
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // Hover state for thread original post only
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);

  // Real-time connection status
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Course colors are now determined by the post's assigned color


  // Format timestamp - memoized for performance
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }, []);

  // Helper functions - memoized for performance
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

  // Cache for user profiles and course data
  const [profileCache, setProfileCache] = useState<Record<string, any>>({});
  const [courseCache, setCourseCache] = useState<Record<string, any>>({});

  // Debounced fetchPosts to prevent rapid updates
  const [fetchPostsTimeout, setFetchPostsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedFetchPosts = useCallback(() => {
    if (fetchPostsTimeout) {
      clearTimeout(fetchPostsTimeout);
    }
    
    const timeout = setTimeout(async () => {
      await fetchPosts();
    }, 500); // 500ms debounce
    
    setFetchPostsTimeout(timeout);
  }, [fetchPostsTimeout]);

  // Database functions
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping fetchPosts');
        setLoading(false);
        return;
      }
      
      console.log('Fetching posts for user:', user.id, 'feedMode:', feedMode);

      // Build query based on feed mode - use simple select first
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
          // Extract course names from the course objects and clean them
          const courseNames = profile.classes.map((course: any) => {
            const className = course.class;
            
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
          });
          
          // Get course IDs for user's classes
          const { data: userCourses } = await supabase
            .from('feedcourses')
            .select('id')
            .in('name', courseNames);

          if (userCourses && userCourses.length > 0) {
            const courseIds = userCourses.map((c: any) => c.id);
            query = query.in('course_id', courseIds);
          } else {
            // No matching courses found
            setPosts([]);
            setLoading(false);
            return;
          }
        } else {
          // No classes enrolled
          setPosts([]);
          setLoading(false);
          return;
        }
      } else {
        // Campus feed - only posts without course_id
        query = query.is('course_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setLoading(false);
        return;
      }

      // Get all unique author IDs and course IDs for batch fetching
      const authorIds = [...new Set((data || []).map((post: any) => post.author_id))];
      const courseIds = [...new Set((data || []).map((post: any) => post.course_id).filter(Boolean))];
      const postIds = (data || []).map((post: any) => post.id);

      // Batch fetch all author profiles
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all course data
      const { data: courses } = await supabase
        .from('feedcourses')
        .select('id, name')
        .in('id', courseIds);

      // Batch fetch all user likes for posts
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all likes counts
      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all comments counts
      const { data: commentsCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      // Create lookup maps for faster access
      const authorsMap = new Map(authors?.map(a => [a.id, a]) || []);
      const coursesMap = new Map(courses?.map(c => [c.id, c]) || []);
      const userLikesSet = new Set(userLikes?.map(l => l.likeable_id) || []);
      
      // Count likes and comments
      const likesCountMap = new Map();
      const commentsCountMap = new Map();
      
      likesCounts?.forEach(like => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });
      
      commentsCounts?.forEach(comment => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Get poll data for poll posts
      const pollPostIds = (data || []).filter((post: any) => post.post_type === 'poll').map((post: any) => post.id);
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
          const pollIds = polls.map(p => p.id);
          pollsMap = new Map(polls.map(p => [p.post_id, p]));

          // Batch fetch poll options
          const { data: pollOptions } = await supabase
            .from('poll_options')
            .select('*')
            .in('poll_id', pollIds);

          pollOptionsMap = new Map();
          pollOptions?.forEach(option => {
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

          pollVotesMap = new Map(userPollVotes?.map(v => [v.poll_id, v.option_id]) || []);

          // Batch fetch all poll votes for counts
          const { data: allPollVotes } = await supabase
            .from('poll_votes')
            .select('option_id')
            .in('poll_id', pollIds);

          // Count votes per option
          const voteCounts = new Map();
          allPollVotes?.forEach(vote => {
            voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
          });

          // Update poll options with vote counts
          pollOptionsMap.forEach((options, pollId) => {
            options.forEach((option: any) => {
              option.votes = voteCounts.get(option.id) || 0;
            });
          });
        }
      }

      // Transform data to match UI interface
      const transformedPosts: Post[] = (data || []).map((post: any) => {
        const author = authorsMap.get(post.author_id);
        const course = post.course_id ? coursesMap.get(post.course_id) : undefined;
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
            name: post.is_anonymous ? `Anonymous User` : author.full_name,
            year: author.class_year
          } : undefined,
          course: course ? { name: course.name } : undefined,
          isLiked: isLiked,
          poll
        };
      });

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all comments for this post (both top-level and replies)
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (!data || data.length === 0) {
        setComments(prev => ({
          ...prev,
          [postId]: []
        }));
        return;
      }

      // Separate top-level comments and replies
      const topLevelComments = data.filter(comment => !comment.parent_comment_id);
      const replies = data.filter(comment => comment.parent_comment_id);

      // Get all unique author IDs
      const authorIds = [...new Set(data.map(comment => comment.author_id))];
      const commentIds = data.map(comment => comment.id);

      // Batch fetch all author profiles
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all user likes for comments
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      // Batch fetch all likes counts for comments
      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      // Create lookup maps
      const authorsMap = new Map(authors?.map(a => [a.id, a]) || []);
      const userLikesSet = new Set(userLikes?.map(l => l.likeable_id) || []);
      
      // Count likes per comment
      const likesCountMap = new Map();
      likesCounts?.forEach(like => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });

      // Group replies by parent comment ID
      const repliesMap = new Map();
      replies.forEach(reply => {
        if (!repliesMap.has(reply.parent_comment_id)) {
          repliesMap.set(reply.parent_comment_id, []);
        }
        repliesMap.get(reply.parent_comment_id).push(reply);
      });

      // Transform top-level comments
      const transformedComments: Comment[] = topLevelComments.map((comment: any) => {
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
            likes_count: replyLikesCount,
            author: replyAuthor ? {
              name: reply.is_anonymous ? `Anonymous User` : replyAuthor.full_name,
              year: replyAuthor.class_year
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
          likes_count: likesCount,
          author: author ? {
            name: comment.is_anonymous ? `Anonymous User` : author.full_name,
            year: author.class_year
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

  // Track user authentication state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Load posts when component mounts, feedMode changes, or user changes
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [feedMode, user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);
    
    // Set a timeout to mark as disconnected if connection takes too long
    const connectionTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        setRealtimeStatus('disconnected');
      }
    }, 10000); // 10 second timeout

    // Subscribe to posts changes
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          console.log('New post received:', payload);
          // Fetch the new post with all related data (debounced)
          debouncedFetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post deleted:', payload);
          setPosts(prev => prev.filter(post => post.id !== payload.old.id));
        }
      )
      .subscribe((status, err) => {
        console.log('Posts channel status:', status);
        if (err) {
          console.error('Posts channel error:', err);
          setRealtimeStatus('disconnected');
        } else if (status === 'SUBSCRIBED') {
          // Clear the connection timeout once we are subscribed to avoid stale timeout flipping status to red
          clearTimeout(connectionTimeout);
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `likeable_type=eq.post`
        },
        async (payload) => {
          console.log('Likes changed:', payload);
          // Refresh posts to get updated like counts (debounced)
          debouncedFetchPosts();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Likes channel error:', err);
        }
      });

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('New comment received:', payload);
          // Update comment count for the post
          setPosts(prev => prev.map(post => 
            post.id === payload.new.post_id 
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          ));
          
          // If comments are expanded for this post, refresh them
          if (expandedComments[payload.new.post_id] || selectedPostThread === payload.new.post_id) {
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
        async (payload) => {
          console.log('Comment deleted:', payload);
          // Update comment count for the post
          setPosts(prev => prev.map(post => 
            post.id === payload.old.post_id 
              ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
              : post
          ));
          
          // If comments are expanded for this post, refresh them
          if (expandedComments[payload.old.post_id] || selectedPostThread === payload.old.post_id) {
            await fetchComments(payload.old.post_id);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Comments channel error:', err);
        }
      });

    // Subscribe to poll votes changes
    const pollVotesChannel = supabase
      .channel('poll-votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_votes'
        },
        async (payload) => {
          console.log('Poll vote changed:', payload);
          // Refresh posts to get updated poll results (debounced)
          debouncedFetchPosts();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Poll votes channel error:', err);
        }
      });

    // Cleanup subscriptions on unmount or user change
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(pollVotesChannel);
      
      // Clear any pending fetchPosts timeout
      if (fetchPostsTimeout) {
        clearTimeout(fetchPostsTimeout);
      }
      
      // Clear connection timeout
      clearTimeout(connectionTimeout);
    };
  }, [user, feedMode, expandedComments, selectedPostThread]);

  // Add loading state for comments
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());

  // Optimized comment loading with loading state
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


  // Load comments when thread view opens
  useEffect(() => {
    if (selectedPostThread && !comments[selectedPostThread]) {
      setLoadingComments(prev => new Set(prev).add(selectedPostThread));
      fetchComments(selectedPostThread).then(() => {
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedPostThread);
          return newSet;
        });
      });
    }
  }, [selectedPostThread]);

  // Create post functions
  const handleCreatePost = async () => {
    // Validate title is required
    if (!newPostTitle.trim()) return;
    
    // Validate content based on post type
    if (newPostType === 'text' && !newPost.trim()) return;
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;
    
      // Validation: if posting to My Courses, must select a course
      if (newPostTarget === 'my-courses' && !selectedCourseForPost) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get course_id if posting to My Courses
      let courseId = null;
      if (newPostTarget === 'my-courses' && selectedCourseForPost) {
        const { data: course } = await supabase
          .from('feedcourses')
          .select('id')
          .eq('name', selectedCourseForPost)
          .maybeSingle();
        courseId = course?.id || null;
      }

      // Create the post
      const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPost.trim(),
          author_id: user.id,
          course_id: courseId,
          post_type: newPostType,
          is_anonymous: isAnonymousPost
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating post:', postError);
        return;
      }

      // Create poll if it's a poll post
      if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: createdPost.id,
            question: newPost.trim()
          })
          .select()
          .single();

        if (pollError) {
          console.error('Error creating poll:', pollError);
          return;
        }

        // Create poll options
        const pollOptionsData = pollOptions
          .filter(opt => opt.trim())
          .map(opt => ({
            poll_id: poll.id,
            text: opt.trim()
          }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(pollOptionsData);

        if (optionsError) {
          console.error('Error creating poll options:', optionsError);
          return;
        }
      }

      // Reset form
      setNewPost('');
      setNewPostTitle('');
      setNewPostType('text');
      setPollOptions(['', '']);
      setNewPostTarget('campus');
      setSelectedCourseForPost('');
      setIsAnonymousPost(false);
      setShowCreatePostDialog(false);

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error('Error in handleCreatePost:', error);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Event handlers
  const handleLike = async (postId: string) => {
    // Prevent multiple simultaneous like operations on the same post
    if (likingPosts.has(postId)) return;
    
    try {
      setLikingPosts(prev => new Set(prev).add(postId));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Double-check the current like state from database
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

      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                isLiked: !isCurrentlyLiked,
                likes_count: isCurrentlyLiked ? p.likes_count - 1 : p.likes_count + 1
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error in handleLike:', error);
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // const handleBookmark = (postId: string) => { // removed
  //   setPosts(posts.map(post => 
  //     post.id === postId 
  //       ? { ...post, isBookmarked: !post.isBookmarked }
  //       : post
  //     ));
  // };

  const handlePostClick = (postId: string) => {
    setSelectedPostThread(postId);
    onPostClick?.(postId);
  };

  const handleBackToFeed = () => {
    setSelectedPostThread(null);
    setIsThreadPostHovered(false);
    setHoveredPostId(null);
    setReplyingTo(null);
  };


  const addComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
      content: commentText.trim(),
          is_anonymous: false // Could be made configurable
        });

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

    setNewComment(prev => ({ ...prev, [postId]: '' }));

      // Refresh comments to get the new comment
      await fetchComments(postId);
      
      // Update post comment count locally
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error in addComment:', error);
    }
  };

  const addReply = async (postId: string, commentId: string) => {
    const key = `${postId}:${commentId}`;
    const text = replyText[key];
    if (!text?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: commentId,
          author_id: user.id,
          content: text.trim(),
          is_anonymous: false // Could be made configurable
        });

      if (error) {
        console.error('Error adding reply:', error);
        return;
      }

    setReplyText(prev => ({ ...prev, [key]: '' }));
    setReplyingTo(null);

      // Refresh comments to get the new reply
      await fetchComments(postId);
      
      // Update post comment count locally
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error in addReply:', error);
    }
  };

  const toggleCommentLike = async (postId: string, commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const comment = comments[postId]?.find(c => c.id === commentId);
      if (!comment) return;

      // Double-check the current like state from database
      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', commentId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        // Unlike the comment
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
        // Like the comment
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

      // Update local state immediately for better UX
      setComments(prevComments => ({
        ...prevComments,
        [postId]: (prevComments[postId] || []).map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !isCurrentlyLiked,
                likes_count: isCurrentlyLiked ? comment.likes_count - 1 : comment.likes_count + 1
              }
            : comment
        )
      }));
    } catch (error) {
      console.error('Error in toggleCommentLike:', error);
    }
  };

  const toggleReplyLike = async (postId: string, commentId: string, replyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const comment = comments[postId]?.find(c => c.id === commentId);
      const reply = comment?.replies?.find(r => r.id === replyId);
      if (!reply) return;

      // Double-check the current like state from database
      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', replyId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        // Unlike the reply
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
        // Like the reply
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

      // Update local state immediately for better UX
      setComments(prevComments => ({
        ...prevComments,
        [postId]: (prevComments[postId] || []).map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: (comment.replies || []).map(reply =>
                  reply.id === replyId
                    ? {
                        ...reply,
                        isLiked: !isCurrentlyLiked,
                        likes_count: isCurrentlyLiked ? reply.likes_count - 1 : reply.likes_count + 1
                      }
                    : reply
                )
              }
            : comment
        )
      }));
    } catch (error) {
      console.error('Error in toggleReplyLike:', error);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = posts.find(p => p.id === postId);
      if (!post || !post.poll) return;

      const previousSelection = post.poll.userVotedOptionId;

      if (!previousSelection) {
        // First vote
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
      } else if (previousSelection === optionId) {
        // Toggle off (re-click same option)
        console.log('Removing poll vote for poll:', post.poll.id, 'user:', user.id);
        
        const { error } = await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', post.poll.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing poll vote:', error);
          return;
        }
        
        console.log('Poll vote removed successfully');
      } else {
        // Switch choice (different option)
        console.log('Updating poll vote from', previousSelection, 'to', optionId);
        
        const { error } = await supabase
          .from('poll_votes')
          .update({ option_id: optionId })
          .eq('poll_id', post.poll.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating poll vote:', error);
          return;
        }
        
        console.log('Poll vote updated successfully');
      }

      // Update local state for poll voting
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                poll: p.poll ? {
                  ...p.poll,
                  userVotedOptionId: previousSelection === optionId ? undefined : optionId,
                  totalVotes: previousSelection === optionId 
                    ? p.poll.totalVotes - 1 
                    : previousSelection 
                    ? p.poll.totalVotes 
                    : p.poll.totalVotes + 1,
                  options: p.poll.options.map(opt => ({
                    ...opt,
                    votes: opt.id === optionId 
                      ? (previousSelection === optionId ? opt.votes - 1 : opt.votes + 1)
                      : (previousSelection === opt.id ? opt.votes - 1 : opt.votes)
                  }))
                } : undefined
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error in handleVotePoll:', error);
    }
  };

  // Posts are already filtered by the database query based on feed mode
  const filteredPosts = posts;

  // Reset hover states when feed mode changes
  React.useEffect(() => {
    setHoveredPostId(null);
    setIsThreadPostHovered(false);
    setReplyingTo(null);
  }, [feedMode]);

  // Notify parent when thread view state changes
  React.useEffect(() => {
    onThreadViewChange?.(selectedPostThread !== null);
  }, [selectedPostThread, onThreadViewChange]);

  // Render thread view
  const renderThreadView = () => {
    const selectedPost = posts.find(p => p.id === selectedPostThread);
    if (!selectedPost) return null;
    
    // Color consistency is now maintained by using post ID instead of index

    return (
      <div className="w-full">
        <div className="p-6">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToFeed}
              className="flex items-center gap-2 text-[#752432] hover:bg-[#752432]/10"
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
                <ProfileBubble userName={selectedPost.author?.name || 'Anonymous'} size="lg" borderColor={getPostColor(selectedPost.id)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{selectedPost.author?.name || 'Anonymous'}</h4>
                    <span className="text-sm text-gray-500">{selectedPost.author?.year || ''}</span>
                    {/* verified badge removed */}
                  </div>
                  <span className="text-sm text-gray-500">{formatTimestamp(selectedPost.created_at)}</span>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
              
              {selectedPost.course && (
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
                  style={{ backgroundColor: getPostColor(selectedPost.id) }}
                >
                  {selectedPost.course.name}
                </span>
              )}
              
              <p className="text-gray-800 leading-relaxed mb-4">{selectedPost.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}</p>
              
              {/* Poll in thread view */}
              {selectedPost.poll && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
                            className="absolute inset-0 bg-gray-100 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
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
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      selectedPost.isLiked ? '' : 'text-gray-600'
                    }`}
                    style={{
                      color: selectedPost.isLiked ? getPostColor(selectedPost.id) : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedPost.isLiked) {
                        e.currentTarget.style.color = getPostColor(selectedPost.id);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedPost.isLiked) {
                        e.currentTarget.style.color = '';
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                    {selectedPost.likes_count}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    {selectedPost.comments_count} comments
                  </span>
                </div>
              </div>

              {/* Add top-level reply (comment) to post */}
              <div className="mt-4">
                <div className="flex gap-3">
                  <ProfileBubble userName="Justin" size="md" borderColor={getPostColor(selectedPost.id)} />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment[selectedPost.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                      className="min-h-[60px] text-sm resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => addComment(selectedPost.id)}
                        disabled={!newComment[selectedPost.id]?.trim()}
                        className="bg-[#752432] hover:bg-[#752432]/90 text-white"
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
              <Card key={comment.id} style={{ backgroundColor: '#FEFBF6' }}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <ProfileBubble userName={comment.author?.name || 'Anonymous'} size="md" borderColor={getPostColor(selectedPost.id)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900 text-sm">{comment.author?.name || 'Anonymous'}</h5>
                        <span className="text-xs text-gray-500">{comment.author?.year || ''}</span>
                        {/* verified badge removed */}
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-800 text-sm mb-2">{comment.content}</p>
                      <div className="flex items-center gap-3">
                        <button 
                          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                            comment.isLiked ? '' : 'text-gray-600'
                          }`}
                          style={{
                            color: comment.isLiked ? getPostColor(selectedPost.id) : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (!comment.isLiked) {
                              e.currentTarget.style.color = getPostColor(selectedPost.id);
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!comment.isLiked) {
                              e.currentTarget.style.color = '';
                            }
                          }}
                          onClick={() => toggleCommentLike(selectedPost.id, comment.id)}
                        >
                          <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes_count}
                        </button>
                        <button 
                          className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setReplyingTo(prev => prev === `${selectedPost.id}:${comment.id}` ? null : `${selectedPost.id}:${comment.id}`); }}
                        >
                          Reply
                        </button>
                        {/* timestamp shown inline with name */}
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                                  <ProfileBubble userName={reply.author?.name || 'Anonymous'} size="sm" borderColor={getPostColor(selectedPost.id)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                      <h6 className="font-medium text-gray-900 text-xs">{reply.author?.name || 'Anonymous'}</h6>
                                      <span className="text-xs text-gray-500">{reply.author?.year || ''}</span>
                                  {/* verified badge removed */}
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">{formatTimestamp(reply.created_at)}</span>
                                </div>
                                <p className="text-gray-800 text-xs mb-2">{reply.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}</p>
                                <div className="flex items-center gap-3">
                                  <button 
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                      reply.isLiked ? '' : 'text-gray-600'
                                    }`}
                                    style={{
                                      color: reply.isLiked ? getPostColor(selectedPost.id) : undefined
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!reply.isLiked) {
                                        e.currentTarget.style.color = getPostColor(selectedPost.id);
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!reply.isLiked) {
                                        e.currentTarget.style.color = '';
                                      }
                                    }}
                                    onClick={() => toggleReplyLike(selectedPost.id, comment.id, reply.id)}
                                  >
                                    <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    {reply.likes_count}
                                  </button>
                                  <button 
                                    className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setReplyingTo(prev => prev === `${selectedPost.id}:${comment.id}` ? null : `${selectedPost.id}:${comment.id}`); }}
                                  >
                                    Reply
                                  </button>
                                  {/* timestamp shown inline with name */}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* reply composer (only one level deep) */}
                      {replyingTo === `${selectedPost.id}:${comment.id}` && (
                        <div className="mt-2 ml-4 flex gap-2">
                          <Textarea
                            value={replyText[`${selectedPost.id}:${comment.id}`] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="min-h-[40px] text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => addReply(selectedPost.id, comment.id)}
                            disabled={!replyText[`${selectedPost.id}:${comment.id}`]?.trim()}
                            className="bg-[#752432] hover:bg-[#752432]/90 text-white"
                          >
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Conditional rendering
  if (selectedPostThread) {
    return renderThreadView();
  }

  return (
    <Card className="overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#752432]" />
            <h3 className="font-semibold text-gray-900">Feed</h3>
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
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onFeedModeChange?.('campus')}
              className={`font-medium transition-all duration-200 ${feedMode === 'campus' ? 'text-sm text-[#752432]' : 'text-xs text-gray-500'}`}
            >
              Campus
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onFeedModeChange?.('campus')}
                className={`rounded-full transition-all duration-200 ${
                  feedMode === 'campus' 
                    ? 'w-3 h-3 bg-[#752432]' 
                    : 'w-2 h-2 bg-gray-400'
                }`}
              />
              <button
                onClick={() => onFeedModeChange?.('my-courses')}
                className={`rounded-full transition-all duration-200 ${
                  feedMode === 'my-courses' 
                    ? 'w-3 h-3 bg-[#752432]' 
                    : 'w-2 h-2 bg-gray-400'
                }`}
              />
            </div>
            <button
              onClick={() => onFeedModeChange?.('my-courses')}
              className={`font-medium transition-all duration-200 ${feedMode === 'my-courses' ? 'text-sm text-[#752432]' : 'text-xs text-gray-500'}`}
            >
              My Courses
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto px-4 pb-4" style={{ height: 'calc(100vh - 120px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading posts...</div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {feedMode === 'campus' ? 'No campus posts yet' : 'No course posts yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {feedMode === 'campus' 
                ? 'Be the first to share something with the campus community!'
                : 'No posts in your courses yet. Start a discussion!'
              }
            </p>
            <Button
              onClick={() => setShowCreatePostDialog(true)}
              className="bg-[#752432] hover:bg-[#752432]/90 text-white"
            >
              Create First Post
            </Button>
          </div>
        ) : (
        <div className="space-y-4 mt-4">
            {filteredPosts.map((post) => (
            <Card 
              key={post.id} 
              className="overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
              style={{ 
                backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id) : '#FEFBF6',
                borderLeftColor: getPostColor(post.id)
              }}
              onClick={() => handlePostClick(post.id)}
              onMouseEnter={() => setHoveredPostId(post.id)}
              onMouseLeave={() => setHoveredPostId(prev => (prev === post.id ? null : prev))}
            >
              <div 
                className="p-4"
                style={{ backgroundColor: 'transparent' }}
              >
                {/* Post Body (header/title/content) */}
                <div>
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <ProfileBubble userName={post.author?.name || 'Anonymous'} size="md" borderColor={getPostColor(post.id)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{post.author?.name || 'Anonymous'}</h4>
                          <span className="text-xs text-gray-500">{post.author?.year || ''}</span>
                          {/* verified badge removed */}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Title */}
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{post.title}</h2>
                </div>

                {/* Course Tag */}
                {post.course && (
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getPostColor(post.id) }}
                    >
                      {post.course.name}
                    </span>
                  </div>
                )}

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-gray-800 leading-relaxed text-sm">{post.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}</p>
                </div>
                {/* Poll Component */}
                {post.poll && (
                  <div 
                    className="mb-4 p-4 rounded-lg"
                    style={{ backgroundColor: '#F3F4F6' }}
                  >
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
                              borderColor: isSelected ? getPostColor(post.id) : undefined,
                              backgroundColor: isSelected ? `${getPostColor(post.id)}0D` : undefined
                            }}
                          >
                            {hasVoted && (
                              <div 
                                className="absolute inset-0 bg-gray-100 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
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
                </div>

                {/* Post Actions (home feed) - not hoverable for navigation */}
                <div className="flex items-center justify-start pt-4 mt-1 border-t border-gray-200" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      disabled={likingPosts.has(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        color: post.isLiked ? getPostColor(post.id) : '#6B7280'
                      }}
                      onMouseEnter={(e) => {
                        if (!post.isLiked) {
                          e.currentTarget.style.color = getPostColor(post.id);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!post.isLiked) {
                          e.currentTarget.style.color = '#6B7280';
                        }
                      }}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </button>
                    <button 
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleCommentsExpanded(post.id);
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count}
                    </button>
                  </div>
                </div>

                {/* Inline Comments Section */}
                {expandedComments[post.id] && (
                  <div className="pt-4 border-t border-gray-100 mt-4" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                    {/* Add Comment Input */}
                    <div className="flex gap-3 mb-4">
                      <ProfileBubble userName="Justin" size="md" borderColor={getPostColor(post.id)} />
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="min-h-[60px] text-sm resize-none"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addComment(post.id);
                            }}
                            disabled={!newComment[post.id]?.trim()}
                            className="bg-[#752432] hover:bg-[#752432]/90 text-white"
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
                          <ProfileBubble userName={comment.author?.name || 'Anonymous'} size="md" borderColor={getPostColor(post.id)} />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900 text-sm">{comment.author?.name || 'Anonymous'}</h5>
                                <span className="text-xs text-gray-500">{comment.author?.year || ''}</span>
                                {/* verified badge removed */}
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                              </div>
                              <p className="text-gray-800 text-sm">{comment.content}</p>
                              {/* comment actions */}
                              <div className="mt-2 flex items-center gap-3">
                                <button 
                                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                    comment.isLiked ? '' : 'text-gray-600'
                                  }`}
                                  style={{
                                    color: comment.isLiked ? getPostColor(post.id) : undefined
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!comment.isLiked) {
                                      e.currentTarget.style.color = getPostColor(post.id);
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!comment.isLiked) {
                                      e.currentTarget.style.color = '';
                                    }
                                  }}
                                  onClick={(e) => { e.stopPropagation(); toggleCommentLike(post.id, comment.id); }}
                                >
                                  <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                                  {comment.likes_count}
                                </button>
                                <button 
                                  className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setReplyingTo(prev => prev === `${post.id}:${comment.id}` ? null : `${post.id}:${comment.id}`); }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                            
                            {/* Replies Display */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 ml-4 space-y-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <ProfileBubble userName={reply.author?.name || 'Anonymous'} size="sm" borderColor={getPostColor(post.id)} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h6 className="font-medium text-gray-900 text-xs">{reply.author?.name || 'Anonymous'}</h6>
                                        <span className="text-xs text-gray-500">{reply.author?.year || ''}</span>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-gray-500">{formatTimestamp(reply.created_at)}</span>
                                      </div>
                                      <p className="text-gray-800 text-xs mb-2">{reply.content}</p>
                                      <div className="flex items-center gap-3">
                                        <button 
                                          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                            reply.isLiked ? '' : 'text-gray-600'
                                          }`}
                                          style={{
                                            color: reply.isLiked ? getPostColor(post.id) : undefined
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!reply.isLiked) {
                                              e.currentTarget.style.color = getPostColor(post.id);
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!reply.isLiked) {
                                              e.currentTarget.style.color = '';
                                            }
                                          }}
                                          onClick={(e) => { e.stopPropagation(); toggleReplyLike(post.id, comment.id, reply.id); }}
                                        >
                                          <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                          {reply.likes_count}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* reply composer (only one level deep) */}
                            {replyingTo === `${post.id}:${comment.id}` && (
                              <div className="mt-2 ml-3 flex gap-2">
                                <Textarea
                                  value={replyText[`${post.id}:${comment.id}`] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [`${post.id}:${comment.id}`]: e.target.value }))}
                                  placeholder="Write a reply..."
                                  className="min-h-[40px] text-xs flex-1"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                />
                                <Button
                                  size="sm"
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); addReply(post.id, comment.id); }}
                                  disabled={!replyText[`${post.id}:${comment.id}`]?.trim()}
                                  className="bg-[#752432] hover:bg-[#752432]/90 text-white"
                                >
                                  Reply
                                </Button>
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
            </Card>
          ))}
        </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreatePostDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#752432] hover:bg-[#752432]/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Enhanced Create Post Dialog - Reddit Style */}
      <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Create a post
            </DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or start a discussion with the law school community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Post Target Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setNewPostTarget('campus');
                    setSelectedCourseForPost('');
                  }}
                  className={`font-medium transition-all duration-200 ${newPostTarget === 'campus' ? 'text-sm text-[#752432]' : 'text-xs text-gray-500'}`}
                >
                  Campus
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewPostTarget('campus');
                      setSelectedCourseForPost('');
                    }}
                    className={`rounded-full transition-all duration-200 ${
                      newPostTarget === 'campus' 
                        ? 'w-3 h-3 bg-[#752432]' 
                        : 'w-2 h-2 bg-gray-400'
                    }`}
                  />
                  <button
                    onClick={() => setNewPostTarget('my-courses')}
                    className={`rounded-full transition-all duration-200 ${
                      newPostTarget === 'my-courses' 
                        ? 'w-3 h-3 bg-[#752432]' 
                        : 'w-2 h-2 bg-gray-400'
                    }`}
                  />
                </div>
                <button
                  onClick={() => setNewPostTarget('my-courses')}
                  className={`font-medium transition-all duration-200 ${newPostTarget === 'my-courses' ? 'text-sm text-[#752432]' : 'text-xs text-gray-500'}`}
                >
                  My Courses
                </button>
              </div>
              
              {/* Course Selection for My Courses */}
              {newPostTarget === 'my-courses' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Course</label>
                  <select
                    value={selectedCourseForPost}
                    onChange={(e) => setSelectedCourseForPost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#752432] focus:ring-[#752432] bg-white"
                  >
                    <option value="">Choose a course...</option>
                    {myCourses.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

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
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                  rows={5}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newPost.length}/40000
                </div>
              </div>
            )}

            {/* Poll Options */}
            {newPostType === 'poll' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Poll options</h4>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePollOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
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
                checked={isAnonymousPost}
                onChange={(e) => setIsAnonymousPost(e.target.checked)}
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
                    setNewPost('');
                    setNewPostTitle('');
                    setNewPostType('text');
                    setPollOptions(['', '']);
                    setNewPostTarget('campus');
                    setSelectedCourseForPost('');
                    setIsAnonymousPost(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePost}
                  className="bg-[#752432] hover:bg-[#752432]/90"
                  disabled={
                    !newPostTitle.trim() || 
                    (newPostType === 'text' && !newPost.trim()) ||
                    (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) ||
                    (newPostTarget === 'my-courses' && !selectedCourseForPost)
                  }
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Export interfaces for use in other components
export type { Post, Comment, Poll, PollOption };

