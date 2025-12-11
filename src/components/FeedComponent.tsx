import React, { useState, useEffect, useCallback, useRef, startTransition, Suspense, lazy } from 'react';
import { supabase } from '../lib/supabase';
import { ExpandableText } from './ui/expandable-text';
import { ConfirmationPopup } from './ui/confirmation-popup';
import { getStorageUrl } from '../utils/storage';
import { VirtualizedList } from './ui/VirtualizedList';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

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
  post_type: 'text' | 'poll' | 'youtube';
  is_anonymous: boolean;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  likes_count: number;
  comments_count: number;
  photo_url?: string | null;
  vid_link?: string | null;
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
  isClubAccount?: boolean; // Flag to indicate if author is a club account (no profile page)
}

interface Comment {
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
  replies?: Comment[];
  isClubAccount?: boolean; // Flag to indicate if author is a club account (no profile page)
  _optimistic?: boolean; // Flag to identify optimistic (temporary) comments
}

// Course interface matching the structure from profiles.classes
interface Course {
  course_id: string; // UUID from Courses table
  class: string;
  professor: string;
  schedule?: any;
}

// Component props interface
interface FeedProps {
  onPostClick?: (postId: string) => void;
  feedMode?: 'campus' | 'my-courses';
  onFeedModeChange?: (mode: 'campus' | 'my-courses') => void;
  myCourses?: Course[];
  onThreadViewChange?: (isOpen: boolean) => void;
  onNavigateToStudentProfile?: (studentName: string) => void;
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

// ProfileBubble component (memoized for performance)
const ProfileBubble = React.memo(({ userName, size = "md", borderColor = "#752432", isAnonymous = false, userId, onProfileClick }: { 
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
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
});

ProfileBubble.displayName = 'ProfileBubble';

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

// Lazy-loaded YouTube iframe component - only loads when visible
const LazyVideoEmbed = React.memo(({ 
  embedUrl, 
  platform, 
  isVertical, 
  isInstagram 
}: { 
  embedUrl: string; 
  platform: 'youtube' | 'tiktok' | 'instagram';
  isVertical: boolean;
  isInstagram: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { 
    rootMargin: '200px',
    triggerOnce: true 
  });

  const scale = isInstagram ? 0.75 : 0.85;
  const width = isInstagram ? '133.33%' : '117.65%';
  const height = isInstagram ? '133.33%' : '117.65%';

  return (
    <div 
      ref={containerRef}
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
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={`${platform} video player`}
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
      ) : (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
});

LazyVideoEmbed.displayName = 'LazyVideoEmbed';

// Lazy-loaded video embed for thread view (different styling)
const LazyVideoEmbedThread = React.memo(({ 
  embedUrl, 
  platform, 
  isVertical, 
  isInstagram 
}: { 
  embedUrl: string; 
  platform: 'youtube' | 'tiktok' | 'instagram';
  isVertical: boolean;
  isInstagram: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { 
    rootMargin: '100px',
    triggerOnce: true 
  });

  const scale = isInstagram ? 0.65 : 0.90;
  const width = isInstagram ? '153.85%' : '111.11%';
  const height = isInstagram ? '153.85%' : '111.11%';

  return (
    <div 
      ref={containerRef}
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
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={`${platform} video player`}
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
      ) : (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
});

LazyVideoEmbedThread.displayName = 'LazyVideoEmbedThread';

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

export function Feed({ onPostClick, feedMode = 'campus', onFeedModeChange, myCourses = [], onThreadViewChange, onNavigateToStudentProfile }: FeedProps) {
  // State management
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll' | 'youtube'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [newPostTarget, setNewPostTarget] = useState<'campus' | 'my-courses'>(feedMode);
  const [selectedCourseForPost, setSelectedCourseForPost] = useState('');
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  // Post photo state
  const [postPhotoFile, setPostPhotoFile] = useState<File | null>(null);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [isDragOverPhotoDrop, setIsDragOverPhotoDrop] = useState(false);
  // YouTube link state
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentAnonymously, setCommentAnonymously] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // format: `${postId}:${commentId}`
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

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

  // Hover state for thread original post only
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);
  // Post photo URLs (signed URLs for private bucket)
  const [postPhotoUrls, setPostPhotoUrls] = useState<Map<string, string>>(new Map());

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
  
  // Refs for realtime callbacks to access current state without causing re-subscriptions
  const selectedPostThreadRef = useRef<string | null>(null);

  useEffect(() => {
    selectedPostThreadRef.current = selectedPostThread;
  }, [selectedPostThread]);

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
    // Format as "November 11" instead of numeric date
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }, []);

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

  // Helper functions - memoized for performance
  const getPostColor = useCallback((postId: string, isClubAccount?: boolean) => {
    // Club posts always use maroon color
    if (isClubAccount) {
      return '#752432';
    }
    const colors = ['#0080BD', '#04913A', '#F22F21', '#FFBB06']; // Blue, Green, Red, Yellow
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % 4];
  }, []);

  const getPostHoverColor = useCallback((postId: string, isClubAccount?: boolean) => {
    // Club posts always use maroon hover color
    if (isClubAccount) {
      return 'rgba(117, 36, 50, 0.05)';
    }
    const hoverColors = ['rgba(0, 128, 189, 0.05)', 'rgba(4, 145, 58, 0.05)', 'rgba(242, 47, 33, 0.05)', 'rgba(255, 187, 6, 0.05)'];
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return hoverColors[Math.abs(hash) % 4];
  }, []);

  // Cache for user profiles and course data

  // Database functions
  const fetchPosts = useCallback(async (isInitialLoad: boolean = true, limit?: number) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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
          // Extract course UUIDs directly from the course objects
          const courseIds = profile.classes.map((course: any) => course.course_id).filter(Boolean);

          if (courseIds.length > 0) {
            query = query.in('course_id', courseIds);
          } else {
            // No valid course IDs found
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

      // Limit initial payload to reduce LCP/TBT; fetch rest later
      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error?.message || "Unknown error");
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

      // Batch fetch all author profiles (regular users)
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all club accounts (for club posts)
      const { data: clubAccounts } = await supabase
        .from('club_accounts')
        .select('id, name')
        .in('id', authorIds);

      // Batch fetch all course data from Courses table
      const { data: courses } = await supabase
        .from('Courses')
        .select('id, course_name')
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
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const clubAccountsMap = new Map(clubAccounts?.map((ca: any) => [ca.id, ca]) || []);
      const coursesMap = new Map(courses?.map((c: any) => [c.id, c]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      
      // Count likes and comments
      const likesCountMap = new Map();
      const commentsCountMap = new Map();
      
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });
      
      commentsCounts?.forEach((comment: any) => {
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
          pollOptionsMap.forEach((options) => {
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

        // Check if author is a club account or regular user
        // A post is a club post if: 1) author_id is found in club_accounts, OR 2) course_id is null (club posts don't have course_id)
        const clubAccount = clubAccountsMap.get(post.author_id);
        const isClubAccount = !!clubAccount || (!post.course_id && !author); // If no course_id and no regular author found, likely a club post

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
          author: isClubAccount 
            ? {
                // Club posts should never be anonymous, always show club name
                name: (clubAccount && (clubAccount as any).name) ? (clubAccount as any).name : 'Club',
                year: '' // Club accounts don't have year
              }
            : (author && (author as any).full_name ? {
                name: post.is_anonymous ? `Anonymous User` : (author as any).full_name,
                year: (author as any).class_year || ''
              } : undefined),
          course: course && (course as any).course_name ? { name: (course as any).course_name } : undefined,
          isLiked: isLiked,
          poll,
          isClubAccount // Store flag to disable profile clicks for club accounts
        };
      });

      setPosts(transformedPosts);

      // Generate signed URLs for post photos
      const postsWithPhotos = transformedPosts.filter(p => p.photo_url);
      if (postsWithPhotos.length > 0) {
        const photoUrlMap = new Map<string, string>();
        // Process photos in batches to avoid blocking main thread
        const batchSize = 10;
        for (let i = 0; i < postsWithPhotos.length; i += batchSize) {
          const batch = postsWithPhotos.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (post) => {
              if (post.photo_url) {
                const signedUrl = await getStorageUrl(post.photo_url, 'post_picture');
                if (signedUrl) {
                  photoUrlMap.set(post.id, signedUrl);
                }
              }
            })
          );
          // Yield to main thread between batches
          if (i + batchSize < postsWithPhotos.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        setPostPhotoUrls(photoUrlMap);
      } else {
        setPostPhotoUrls(new Map());
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [feedMode, user]);

  // Debounced fetchPosts to prevent rapid updates
  const debouncedFetchPosts = useCallback(() => {
    if (fetchPostsTimeoutRef.current) {
      clearTimeout(fetchPostsTimeoutRef.current);
    }
    
    const timeout = setTimeout(async () => {
      // Use the current feedMode value directly instead of relying on fetchPosts closure
      await fetchPosts(false); // Background refresh, don't show loading screen
    }, 150); // 150ms debounce
    
    fetchPostsTimeoutRef.current = timeout;
  }, [fetchPosts]);

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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error?.message || "Unknown error");
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
      const topLevelComments = data.filter((comment: any) => !comment.parent_comment_id);
      const replies = data.filter((comment: any) => comment.parent_comment_id);

      // Get all unique author IDs
      const authorIds = [...new Set(data.map((comment: any) => comment.author_id))];
      const commentIds = data.map((comment: any) => comment.id);

      // Batch fetch all author profiles (regular users)
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all club accounts (for club account comments)
      const { data: clubAccounts } = await supabase
        .from('club_accounts')
        .select('id, name')
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
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const clubAccountsMap = new Map(clubAccounts?.map((ca: any) => [ca.id, ca]) || []);
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
      const transformedComments: Comment[] = topLevelComments.map((comment: any) => {
        const author = authorsMap.get(comment.author_id);
        const clubAccount = clubAccountsMap.get(comment.author_id);
        const isClubAccount = !!clubAccount;
        const isLiked = userLikesSet.has(comment.id);
        const likesCount = likesCountMap.get(comment.id) || 0;

        // Transform replies for this comment
        const commentReplies = (repliesMap.get(comment.id) || []).map((reply: any) => {
          const replyAuthor = authorsMap.get(reply.author_id);
          const replyClubAccount = clubAccountsMap.get(reply.author_id);
          const replyIsClubAccount = !!replyClubAccount;
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
            author: replyIsClubAccount
              ? {
                  // Club replies should never be anonymous, always show club name
                  name: (replyClubAccount && (replyClubAccount as any).name) ? (replyClubAccount as any).name : 'Club',
                  year: '' // Club accounts don't have year
                }
              : (replyAuthor && (replyAuthor as any).full_name ? {
                  name: reply.is_anonymous ? `Anonymous User` : (replyAuthor as any).full_name,
                  year: (replyAuthor as any).class_year || ''
                } : undefined),
            isLiked: replyIsLiked,
            isClubAccount: replyIsClubAccount // Store flag to disable profile clicks for club accounts
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
            author: isClubAccount
            ? {
                // Club comments should never be anonymous, always show club name
                name: (clubAccount && (clubAccount as any).name) ? (clubAccount as any).name : 'Club',
                year: '' // Club accounts don't have year
              }
            : (author && (author as any).full_name ? {
                name: comment.is_anonymous ? `Anonymous User` : (author as any).full_name,
                year: (author as any).class_year || ''
              } : undefined),
          isLiked: isLiked,
          replies: commentReplies,
          isClubAccount // Store flag to disable profile clicks for club accounts
        };
      });

      setComments(prev => ({
        ...prev,
        [postId]: transformedComments
      }));
    } catch (error) {
      console.error('Error in fetchComments:', error instanceof Error ? error.message : "Unknown error");
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

  // Fetch user profile data from profiles table
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, class_year')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error?.message || "Unknown error");
          return;
        }

        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle profile click
  const handleProfileClick = (_userId: string, userName: string) => {
    if (onNavigateToStudentProfile) {
      onNavigateToStudentProfile(userName);
    }
  };

  // Load posts when component mounts, feedMode changes, or user changes
  useEffect(() => {
    if (user) {
      // Small payload first to unblock LCP/TBT, then full load in background
      fetchPosts(true, 10);
      // Defer heavy fetch to idle/late to avoid TBT/LCP impact
      let cancelled = false;
      const runDeferred = () => {
        if (!cancelled) {
          fetchPosts(false);
        }
      };
      // Use requestIdleCallback if available, fallback to a longer timeout
      const idleId = (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(runDeferred, { timeout: 4000 })
        : window.setTimeout(runDeferred, 3000);

      return () => {
        cancelled = true;
        if ((window as any).cancelIdleCallback && idleId) {
          (window as any).cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      };
    }
  }, [feedMode, user, fetchPosts]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;
    
    // Set a timeout to mark as disconnected if connection takes too long
    const connectionTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        setRealtimeStatus('disconnected');
      }
    }, 10000); // 10 second timeout

    // Set up realtime channels
    const setupChannels = async () => {
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
      await new Promise(resolve => setTimeout(resolve, 100));

      // Subscribe to posts changes using postgres_changes
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload: any) => {
          // Check if the new post is relevant to current feed mode
          const newPost = payload.new;
          if (!newPost) return;
          
          // If it's a campus feed, always refresh (campus posts have course_id = null)
          if (feedMode === 'campus' && !newPost.course_id) {
            debouncedFetchPosts();
            return;
          }
          
          // If it's my-courses feed, only refresh if the post is from one of user's courses
          if (feedMode === 'my-courses' && newPost.course_id) {
            // Check if the course UUID is in the user's courses
            const userCourseIds = myCourses.map(c => c.course_id);
            if (userCourseIds.includes(newPost.course_id)) {
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
          startTransition(() => {
            setPosts(prev => prev.filter(post => post.id !== payload.old.id));
          });
        }
      )
      .subscribe((status: any, err: any) => {
        if (err) {
          console.error('Posts channel error:', err instanceof Error ? err.message : "Unknown error");
          setRealtimeStatus('disconnected');
        } else if (status === 'SUBSCRIBED') {
          // Clear the connection timeout once we are subscribed to avoid stale timeout flipping status to red
          clearTimeout(connectionTimeout);
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    // Subscribe to likes changes using postgres_changes
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes'
        },
        (payload: any) => {
          // Only refresh if this like is from another user (not the current user)
          const payloadUserId = payload.new?.user_id;
          
          // If we can't determine the user ID from the payload, skip the refresh to be safe
          if (!payloadUserId) {
            return;
          }
          
          if (user && payloadUserId !== user.id) {
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
        (payload: any) => {
          // Only refresh if this unlike is from another user (not the current user)
          const payloadUserId = payload.old?.user_id;
          
          // If we can't determine the user ID from the payload, skip the refresh to be safe
          if (!payloadUserId) {
            return;
          }
          
          if (user && payloadUserId !== user.id) {
            debouncedFetchPosts();
          }
        }
      )
      .subscribe((_status: any, err: any) => {
        if (err) {
          console.error('Likes channel error:', err instanceof Error ? err.message : "Unknown error");
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
        async (payload: any) => {
          // Update comment count for the post
          startTransition(() => {
            setPosts(prev => prev.map(post => 
              post.id === payload.new.post_id 
                ? { ...post, comments_count: post.comments_count + 1 }
                : post
            ));
          });
          
          // If comments are expanded for this post, refresh them
          // Use refs to get current state without dependency issues
          if (selectedPostThreadRef.current === payload.new.post_id) {
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
          // Update comment count for the post
          startTransition(() => {
            setPosts(prev => prev.map(post => 
              post.id === payload.old.post_id 
                ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
                : post
            ));
          });
          
          // If comments are expanded for this post, refresh them
          // Use refs to get current state without dependency issues
          if (selectedPostThreadRef.current === payload.old.post_id) {
            await fetchComments(payload.old.post_id);
          }
        }
      )
      .subscribe((_status: any, err: any) => {
        if (err) {
          console.error('Comments channel error:', err instanceof Error ? err.message : "Unknown error");
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
        (payload: any) => {
          // Only refresh if this poll vote is from another user (not the current user)
          const payloadUserId = payload.new?.user_id || payload.old?.user_id;
          if (user && payloadUserId && payloadUserId !== user.id) {
            debouncedFetchPosts();
          }
        }
      )
      .subscribe((_status: any, err: any) => {
        if (err) {
          console.error('Poll votes channel error:', err instanceof Error ? err.message : "Unknown error");
        }
      });

      // Store channels for cleanup
      channelsRef.current = {
        postsChannel,
        likesChannel,
        commentsChannel,
        pollVotesChannel
      };
    };

    // Call setupChannels to initialize all channels
    setupChannels();

    // Cleanup subscriptions on unmount or user change
    return () => {
      if (channelsRef.current.postsChannel) supabase.removeChannel(channelsRef.current.postsChannel);
      if (channelsRef.current.likesChannel) supabase.removeChannel(channelsRef.current.likesChannel);
      if (channelsRef.current.commentsChannel) supabase.removeChannel(channelsRef.current.commentsChannel);
      if (channelsRef.current.pollVotesChannel) supabase.removeChannel(channelsRef.current.pollVotesChannel);
      
      // Clear any pending fetchPosts timeout
      if (fetchPostsTimeoutRef.current) {
        clearTimeout(fetchPostsTimeoutRef.current);
      }
      
      // Clear connection timeout
      clearTimeout(connectionTimeout);
    };
  }, [user]);

  // Add loading state for comments
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());



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
    // Text posts can have empty content (optional), but polls need at least 2 options
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;
    
    // Validate video link is required for YouTube posts
    if (newPostType === 'youtube' && !newYoutubeLink.trim()) return;
    
      // Validation: if posting to My Courses, must select a course
      if (newPostTarget === 'my-courses' && !selectedCourseForPost) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get course_id if posting to My Courses
      // selectedCourseForPost now contains the course UUID directly
      let courseId = null;
      if (newPostTarget === 'my-courses' && selectedCourseForPost) {
        courseId = selectedCourseForPost;
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

      // Create the post
      const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPost.trim(),
          author_id: user.id,
          course_id: courseId,
          post_type: newPostType,
          is_anonymous: isAnonymousPost,
          photo_url: photoFileName,
          vid_link: newPostType === 'youtube' ? newYoutubeLink.trim() : null
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating post:', postError);
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
      setNewYoutubeLink('');
      // Clear photo state
      if (postPhotoPreview) {
        URL.revokeObjectURL(postPhotoPreview);
      }
      setPostPhotoFile(null);
      setPostPhotoPreview(null);
      setShowCreatePostDialog(false);

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error('Error in handleCreatePost:', error instanceof Error ? error.message : "Unknown error");
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
    if (!files || files.length === 0 || !user?.id) return;

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
      console.error('Error in handleLike:', error instanceof Error ? error.message : "Unknown error");
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

  const handlePostClick = useCallback((postId: string) => {
    setSelectedPostThread(postId);
    onPostClick?.(postId);
  }, [onPostClick]);

  const handleBackToFeed = useCallback(() => {
    setSelectedPostThread(null);
    setIsThreadPostHovered(false);
    setHoveredPostId(null);
    setReplyingTo(null);
  }, []);


  const addComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isAnonymous = commentAnonymously[postId] || false;
      const tempId = `temp-comment-${Date.now()}-${Math.random()}`;

      // Create optimistic comment object
      const optimisticComment: Comment = {
        id: tempId,
        post_id: postId,
        author_id: user.id,
        content: commentText.trim(),
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        likes_count: 0,
        isLiked: false,
        author: isAnonymous
          ? { name: 'Anonymous User', year: '' }
          : (userProfile?.full_name ? { name: userProfile.full_name, year: userProfile.class_year || '' } : undefined),
        replies: [],
        _optimistic: true // Mark as optimistic for identification
      };

      // Add optimistic comment immediately
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimisticComment]
      }));

      // Clear input immediately
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setCommentAnonymously(prev => ({ ...prev, [postId]: false }));

      // Sync with server in background
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: commentText.trim(),
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) {
        // Remove optimistic comment on error
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== tempId)
        }));
        console.error('Error adding comment:', error?.message || "Unknown error");
        // TODO: Show error toast to user
        return;
      }

      // Replace optimistic comment with real one
      // We'll fetch comments to get the full data with author info
      await fetchComments(postId);
      
      // Note: Comment count is automatically updated via realtime subscription
    } catch (error) {
      // Remove optimistic comment on error (filter by optimistic flag)
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => !c._optimistic)
      }));
      console.error('Error in addComment:', error instanceof Error ? error.message : "Unknown error");
      // TODO: Show error toast to user
    }
  };

  const addReply = async (postId: string, commentId: string) => {
    const key = `${postId}:${commentId}`;
    const text = replyText[key];
    if (!text?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isAnonymous = replyAnonymously[key] || false;
      const tempId = `temp-reply-${Date.now()}-${Math.random()}`;

      // Create optimistic reply object
      const optimisticReply: Comment = {
        id: tempId,
        post_id: postId,
        parent_comment_id: commentId,
        author_id: user.id,
        content: text.trim(),
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        likes_count: 0,
        isLiked: false,
        author: isAnonymous
          ? { name: 'Anonymous User', year: '' }
          : (userProfile?.full_name ? { name: userProfile.full_name, year: userProfile.class_year || '' } : undefined),
        _optimistic: true // Mark as optimistic for identification
      };

      // Add optimistic reply immediately to the parent comment's replies
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticReply]
              }
            : comment
        )
      }));

      // Clear input immediately
      setReplyText(prev => ({ ...prev, [key]: '' }));
      setReplyAnonymously(prev => ({ ...prev, [key]: false }));
      setReplyingTo(null);

      // Sync with server in background
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: commentId,
          author_id: user.id,
          content: text.trim(),
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) {
        // Remove optimistic reply on error
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter(r => r.id !== tempId)
                }
              : comment
          )
        }));
        console.error('Error adding reply:', error?.message || "Unknown error");
        // TODO: Show error toast to user
        return;
      }

      // Replace optimistic reply with real one by fetching comments
      await fetchComments(postId);
      
      // Note: Comment count is automatically updated via realtime subscription
    } catch (error) {
      // Remove optimistic reply on error (filter by optimistic flag)
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: (comment.replies || []).filter(r => !r._optimistic)
              }
            : comment
        )
      }));
      console.error('Error in addReply:', error instanceof Error ? error.message : "Unknown error");
      // TODO: Show error toast to user
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
          console.error('Error unliking comment:', error?.message || "Unknown error");
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
          console.error('Error liking comment:', error?.message || "Unknown error");
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
      console.error('Error in toggleCommentLike:', error instanceof Error ? error.message : "Unknown error");
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
          console.error('Error unliking reply:', error?.message || "Unknown error");
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
          console.error('Error liking reply:', error?.message || "Unknown error");
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
      console.error('Error in toggleReplyLike:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const post = posts.find(p => p.id === postId);
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

      // Update local state for poll voting
      setPosts(prevPosts => 
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
      console.error('Error in handleVotePoll:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Edit and delete functions
  const handleEditPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
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
      await fetchPosts(); // Refresh posts
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
            console.error('Error deleting post likes:', likesError);
            throw likesError;
          }

          // Then delete the post (this will cascade to comments, polls, etc.)
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', user?.id);

          if (error) throw error;
          
          await fetchPosts(); // Refresh posts
          
          // If we're in thread view and the deleted post is the selected one, go back to home
          if (selectedPostThread === postId) {
            setSelectedPostThread(null);
          }
          
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting post:', error instanceof Error ? error.message : "Unknown error");
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
            console.error('Error deleting comment likes:', likesError);
            throw likesError;
          }

          // Delete likes for all replies to this comment
          // First, get all reply IDs for this comment
          const { data: replyIds, error: replyIdsError } = await supabase
            .from('comments')
            .select('id')
            .eq('parent_comment_id', commentId);

          if (replyIdsError) {
            console.error('Error fetching reply IDs:', replyIdsError);
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
              console.error('Error deleting reply likes:', replyLikesError);
              throw replyLikesError;
            }
          }
          
          // First, delete all replies to this comment (if it's a parent comment)
          const { error: repliesError } = await supabase
            .from('comments')
            .delete()
            .eq('parent_comment_id', commentId);

          if (repliesError) {
            console.error('Error deleting replies:', repliesError);
            throw repliesError;
          }
          
          // Then delete the comment itself
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('author_id', user?.id);

          if (error) {
            console.error('Delete error:', error?.message || "Unknown error");
            throw error;
          }
          
          // Refresh comments
          const postId = Object.keys(comments).find(key => 
            comments[key].some(c => c.id === commentId)
          );
          if (postId) {
            await fetchComments(postId);
          }
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting comment:', error instanceof Error ? error.message : "Unknown error");
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Posts are already filtered by the database query based on feed mode
  const filteredPosts = posts;

  // Reset hover states when feed mode changes
  React.useEffect(() => {
    setHoveredPostId(null);
    setIsThreadPostHovered(false);
    setReplyingTo(null);
    // Update post target to match current feed mode
    setNewPostTarget(feedMode);
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
      <>
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
              borderLeftColor: getPostColor(selectedPost.id, selectedPost.isClubAccount),
              boxShadow: isThreadPostHovered ? `0 0 0 2px ${getPostHoverColor(selectedPost.id, selectedPost.isClubAccount)}` : undefined
            }}
            onMouseEnter={() => setIsThreadPostHovered(true)}
            onMouseLeave={() => setIsThreadPostHovered(false)}
            onClick={() => { /* no-op click target for post area in thread view */ }}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <ProfileBubble 
                  userName={selectedPost.author?.name || (selectedPost.isClubAccount ? 'Club' : 'Anonymous')} 
                  size="lg" 
                  borderColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)}
                  isAnonymous={selectedPost.is_anonymous}
                  userId={selectedPost.author_id}
                  onProfileClick={selectedPost.isClubAccount ? undefined : handleProfileClick}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className={`${!selectedPost.is_anonymous && !selectedPost.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          !selectedPost.is_anonymous && !selectedPost.isClubAccount && handleProfileClick(selectedPost.author_id, selectedPost.author?.name || 'Anonymous');
                        }}
                    >
                      <h4 className="font-semibold text-gray-900">{selectedPost.isClubAccount ? (selectedPost.author?.name || 'Club') : (selectedPost.is_anonymous ? 'Anonymous' : (selectedPost.author?.name || 'Anonymous'))}</h4>
                    </div>
                    {!selectedPost.is_anonymous && selectedPost.isClubAccount && (
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: '#752532' }}
                      >
                        Club
                      </span>
                    )}
                    {!selectedPost.is_anonymous && <span className="text-sm text-gray-500">{selectedPost.author?.year || ''}</span>}
                    {/* verified badge removed */}
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
              
              {selectedPost.course && (
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
                  style={{ backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount) }}
                >
                  {selectedPost.course.name}
                </span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
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
                      backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                      backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                    buttonColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)}
                  />
                </div>
              )}

              {/* Post Photo in Thread View */}
              {selectedPost.photo_url && postPhotoUrls.has(selectedPost.id) && (
                <div className="mb-4 mt-4">
                  <img
                    src={postPhotoUrls.get(selectedPost.id) || ''}
                    alt="Post"
                    className="rounded-lg"
                    loading="lazy"
                    decoding="async"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '450px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    onError={() => {
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

              {/* Video Embed in Thread View - Lazy Loaded */}
              {selectedPost.vid_link && (
                <div className="mb-4 mt-4">
                  {(() => {
                    const embedData = getVideoEmbedUrl(selectedPost.vid_link);
                    if (!embedData) {
                      return null;
                    }
                    const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                    const isInstagram = embedData.platform === 'instagram';
                    return (
                      <LazyVideoEmbedThread
                        embedUrl={embedData.embedUrl}
                        platform={embedData.platform}
                        isVertical={isVertical}
                        isInstagram={isInstagram}
                      />
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
                            borderColor: isSelected ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : undefined,
                            backgroundColor: isSelected ? `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}0D` : undefined
                          }}
                        >
                          {hasVoted && (
                          <div 
                            className="absolute inset-0 transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}33`
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
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      selectedPost.isLiked ? '' : 'text-gray-600'
                    }`}
                    style={{
                      color: selectedPost.isLiked ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedPost.isLiked) {
                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                              // If already editing, cancel edit mode
                              setEditingPost(null);
                            } else {
                              // Start edit mode
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
                            e.currentTarget.style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                  <ProfileBubble userName={userProfile?.full_name || 'User'} size="md" borderColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)} />
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
                              backgroundColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : 'white',
                              borderColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : '#d1d5db'
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                        }}
                        onMouseLeave={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
            <div className="space-y-4 py-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 ml-8">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {comments[selectedPost.id]?.map((comment) => (
              <div key={comment.id} className="mb-4 ml-8">
                  <div className="flex items-start gap-3">
                    <ProfileBubble 
                      userName={comment.author?.name || (comment.isClubAccount ? 'Club' : 'Anonymous')} 
                      size="md" 
                      borderColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)} 
                      isAnonymous={comment.is_anonymous}
                      userId={comment.author_id}
                      onProfileClick={comment.isClubAccount ? undefined : handleProfileClick}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`${!comment.is_anonymous && !comment.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              !comment.is_anonymous && !comment.isClubAccount && handleProfileClick(comment.author_id, comment.author?.name || 'Anonymous');
                            }}
                        >
                          <h5 className="font-medium text-gray-900 text-sm">{comment.isClubAccount ? (comment.author?.name || 'Club') : (comment.is_anonymous ? 'Anonymous' : (comment.author?.name || 'Anonymous'))}</h5>
                        </div>
                        {!comment.is_anonymous && !comment.isClubAccount && comment.author?.year && (
                          <span className="text-xs text-gray-500">{comment.author.year}</span>
                        )}
                        <span className="text-xs text-gray-500">•</span>
                        {/* verified badge removed */}
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                          }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                          }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                                    buttonColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)}
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <button 
                          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                            comment.isLiked ? '' : 'text-gray-600'
                          }`}
                                    style={{
                                      color: comment.isLiked ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : undefined
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                      if (!comment.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                            e.currentTarget.style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                                  // If already editing, cancel edit mode
                                  setEditingComment(null);
                                } else {
                                  // Start edit mode
                                  setEditingComment(comment.id);
                                  setEditCommentContent(comment.content);
                                }
                              }}
                              className="text-xs font-medium transition-colors"
                              style={{ 
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                        {/* timestamp shown inline with name */}
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                                  <ProfileBubble 
                                    userName={reply.author?.name || (reply.isClubAccount ? 'Club' : 'Anonymous')} 
                                    size="sm" 
                                    borderColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)} 
                                    isAnonymous={reply.is_anonymous}
                                    userId={reply.author_id}
                                    onProfileClick={reply.isClubAccount ? undefined : handleProfileClick}
                                  />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className={`${!reply.is_anonymous && !reply.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      !reply.is_anonymous && !reply.isClubAccount && handleProfileClick(reply.author_id, reply.author?.name || 'Anonymous');
                                    }}
                                  >
                                    <h6 className="font-medium text-gray-900 text-sm">{reply.isClubAccount ? (reply.author?.name || 'Club') : (reply.is_anonymous ? 'Anonymous' : (reply.author?.name || 'Anonymous'))}</h6>
                                  </div>
                                  {!reply.is_anonymous && !reply.isClubAccount && reply.author?.year && (
                                    <span className="text-xs text-gray-500">{reply.author.year}</span>
                                  )}
                                  <span className="text-xs text-gray-500">•</span>
                                  {/* verified badge removed */}
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                                    buttonColor={getPostColor(selectedPost.id, selectedPost.isClubAccount)}
                                  />
                                )}
                                <div className="flex items-center gap-3">
                                  <button 
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                      reply.isLiked ? '' : 'text-gray-600'
                                    }`}
                                        style={{
                                          color: reply.isLiked ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : undefined
                                        }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          if (!reply.isLiked) {
                                            (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                                            // If already editing, cancel edit mode
                                            setEditingComment(null);
                                          } else {
                                            // Start edit mode
                                            setEditingComment(reply.id);
                                            setEditCommentContent(reply.content);
                                          }
                                        }}
                                        className="text-xs font-medium transition-colors"
                                        style={{ 
                                          color: '#6B7280'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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
                                  {/* timestamp shown inline with name */}
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
                                      backgroundColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : 'white',
                                      borderColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id, selectedPost.isClubAccount) : '#d1d5db'
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
                            backgroundColor: getPostColor(selectedPost.id, selectedPost.isClubAccount)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, selectedPost.isClubAccount)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, selectedPost.isClubAccount);
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

  // Conditional rendering
  if (selectedPostThread) {
    return renderThreadView();
  }

  return (
    <Card className="overflow-hidden flex flex-col" style={{ backgroundColor: '#FEFBF6', height: '100%', minWidth: '400px' }}>
      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Real-time connection indicator */}
            <div className="relative flex items-center justify-center w-2 h-2 overflow-visible mr-2">
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
            <div className="checkbox-wrapper-35">
              <input 
                type="checkbox" 
                id="feed-mode-toggle" 
                className="switch"
                checked={feedMode === 'my-courses'}
                onChange={(e) => onFeedModeChange?.(e.target.checked ? 'my-courses' : 'campus')}
              />
              <label htmlFor="feed-mode-toggle">
                <span className="switch-x-toggletext">
                  <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Campus</span>
                  <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>My Courses</span>
                </span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Add Post button in header */}
            <button
              onClick={() => {
                setNewPostTarget(feedMode);
                setShowCreatePostDialog(true);
              }}
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors text-white hover:opacity-90"
              style={{
                backgroundColor: feedMode === 'my-courses' ? '#0080BD' : '#04913A'
              }}
              aria-label="Create post"
              title="Create post"
            >
              + New Post
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto px-4 pb-10 flex-1 scrollbar-hide" style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: '80px'
      }}>
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
            <button
              onClick={() => {
                setNewPostTarget(feedMode);
                setShowCreatePostDialog(true);
              }}
              className="px-3 py-1.5 text-sm font-medium rounded transition-colors text-white hover:opacity-90"
              style={{
                backgroundColor: feedMode === 'my-courses' ? '#0080BD' : '#04913A'
              }}
            >
              Create First Post
            </button>
          </div>
        ) : (
        <div className="space-y-4 mt-4">
            {filteredPosts.map((post) => (
            <Card 
              key={post.id} 
              className="overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
              style={{ 
                backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id, post.isClubAccount) : '#FEFBF6',
                borderLeftColor: getPostColor(post.id, post.isClubAccount)
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
                      <ProfileBubble 
                        userName={post.author?.name || (post.isClubAccount ? 'Club' : 'Anonymous')} 
                        size="md" 
                        borderColor={getPostColor(post.id, post.isClubAccount)}
                        isAnonymous={post.is_anonymous}
                        userId={post.author_id}
                        onProfileClick={post.isClubAccount ? undefined : handleProfileClick}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 
                            className={`font-semibold text-gray-900 text-sm ${!post.is_anonymous && !post.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              !post.is_anonymous && !post.isClubAccount && handleProfileClick(post.author_id, post.author?.name || 'Anonymous');
                            }}
                          >
                            {post.isClubAccount ? (post.author?.name || 'Club') : (post.is_anonymous ? 'Anonymous' : (post.author?.name || 'Anonymous'))}
                          </h4>
                          {!post.is_anonymous && post.isClubAccount && (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: '#752432' }}
                            >
                              Club
                            </span>
                          )}
                          {!post.is_anonymous && <span className="text-xs text-gray-500">{post.author?.year || ''}</span>}
                          {/* verified badge removed */}
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

                {/* Course Tag */}
                {post.course && (
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getPostColor(post.id, post.isClubAccount) }}
                    >
                      {post.course.name}
                    </span>
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
                          backgroundColor: getPostColor(post.id, post.isClubAccount)
                        }}
                          onMouseEnter={(e: React.MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id, post.isClubAccount)}90`;
                          }}
                          onMouseLeave={(e: React.MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id, post.isClubAccount);
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
                          backgroundColor: getPostColor(post.id, post.isClubAccount)
                        }}
                          onMouseEnter={(e: React.MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id, post.isClubAccount)}90`;
                          }}
                          onMouseLeave={(e: React.MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id, post.isClubAccount);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ExpandableText 
                      text={post.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                      maxLines={10}
                      className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap"
                      buttonColor={getPostColor(post.id, post.isClubAccount)}
                    />
                  )}
                </div>

                {/* Post Photo */}
                {post.photo_url && postPhotoUrls.has(post.id) && (
                  <div className="mb-3 mt-3">
                    <img
                      src={postPhotoUrls.get(post.id) || ''}
                      alt="Post"
                      className="rounded-lg"
                      loading="lazy"
                      decoding="async"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '450px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                      onError={() => {
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

                {/* Video Embed (YouTube, TikTok, Instagram) - Lazy Loaded */}
                {post.vid_link && (
                  <div className="mb-3 mt-3">
                    {(() => {
                      const embedData = getVideoEmbedUrl(post.vid_link);
                      if (!embedData) {
                        return (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Invalid video URL: {post.vid_link}
                            </p>
                          </div>
                        );
                      }
                      const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                      const isInstagram = embedData.platform === 'instagram';
                      return (
                        <LazyVideoEmbed
                          embedUrl={embedData.embedUrl}
                          platform={embedData.platform}
                          isVertical={isVertical}
                          isInstagram={isInstagram}
                        />
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
                              borderColor: isSelected ? getPostColor(post.id, post.isClubAccount) : undefined,
                              backgroundColor: isSelected ? `${getPostColor(post.id, post.isClubAccount)}0D` : undefined
                            }}
                          >
                            {hasVoted && (
                              <div 
                                className="absolute inset-0 transition-all duration-300"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: `${getPostColor(post.id, post.isClubAccount)}33`
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
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        color: post.isLiked ? getPostColor(post.id, post.isClubAccount) : '#6B7280'
                      }}
                      onMouseEnter={(e) => {
                        if (!post.isLiked) {
                          (e.currentTarget as HTMLElement).style.color = getPostColor(post.id, post.isClubAccount);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!post.isLiked) {
                          (e.currentTarget as HTMLElement).style.color = '#6B7280';
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
                              e.currentTarget.style.color = getPostColor(post.id, post.isClubAccount);
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
            </Card>
            ))}
        </div>
        )}
      </div>

      {/* Floating Action Button removed; moved to header */}

      {/* Enhanced Create Post Dialog - Reddit Style */}
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
              <div className="flex items-center justify-start">
                <div className="checkbox-wrapper-35">
                  <input 
                    type="checkbox" 
                    id="post-target-toggle" 
                    className="switch"
                    checked={newPostTarget === 'my-courses'}
                    onChange={(e) => {
                      setNewPostTarget(e.target.checked ? 'my-courses' : 'campus');
                      if (!e.target.checked) {
                        setSelectedCourseForPost('');
                      }
                    }}
                  />
                  <label htmlFor="post-target-toggle">
                    <span className="switch-x-toggletext">
                      <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Campus</span>
                      <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>My Courses</span>
                    </span>
                  </label>
                </div>
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
                      <option key={course.course_id} value={course.course_id}>{course.class}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

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
                <img src="/text_picture_icon.svg" alt="Text and Picture" className="h-5 w-auto object-contain" width={20} height={20} loading="lazy" />
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
                <img src="/yt_icon_red_digital.png" alt="YouTube" className="h-6 w-auto object-contain" width={24} height={24} loading="lazy" />
                <img src="/Youtube_shorts_icon.svg" alt="YouTube Shorts" className="h-5 w-auto object-contain" width={20} height={20} loading="lazy" />
                <img src="/TikTok_Icon_Black_Circle.png" alt="TikTok" className="h-5 w-auto object-contain" width={20} height={20} loading="lazy" />
                <img src="/Instagram_Glyph_Gradient.png" alt="Instagram" className="h-5 w-auto object-contain" width={20} height={20} loading="lazy" />
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
                    value={newPost}
                    onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPost)}
                    placeholder="What are your thoughts?"
                    className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                    rows={5}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {countWords(newPost)}/1000 words
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
                    value={newPost}
                    onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPost)}
                    placeholder="What are your thoughts?"
                    className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] min-h-[120px] resize-none"
                    rows={5}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {countWords(newPost)}/1000 words
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
                            onClick={() => removePollOption(index)}
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
                    onClick={addPollOption}
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
                    checked={isAnonymousPost}
                    onChange={(e) => setIsAnonymousPost(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#752432] bg-gray-100 border-gray-300 rounded focus:ring-0 focus:outline-none"
                  />
                  <label htmlFor="anonymous-post" className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <span className={`text-sm ${isAnonymousPost ? 'relative' : ''}`}>
                      👁️
                      {isAnonymousPost && (
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
                    setShowCreatePostDialog(false);
                    setNewPost('');
                    setNewPostTitle('');
                    setNewPostType('text');
                    setPollOptions(['', '']);
                    setNewPostTarget('campus');
                    setSelectedCourseForPost('');
                    setIsAnonymousPost(false);
                    setNewYoutubeLink('');
                    // Clear photo state
                    if (postPhotoPreview) {
                      handleRemovePostPhoto();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePost}
                  className="text-white hover:opacity-90"
                  style={{
                    backgroundColor: newPostTarget === 'my-courses' ? '#0080BD' : '#04913A'
                  }}
                  disabled={
                    !newPostTitle.trim() || 
                    (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) ||
                    (newPostType === 'youtube' && !newYoutubeLink.trim()) ||
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

    </Card>
  );
}

// Export interfaces for use in other components
export type { Post, Comment, Poll, PollOption };

