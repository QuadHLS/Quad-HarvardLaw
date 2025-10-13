import React, { useState } from 'react';

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
  author: {
    name: string;
    avatar: string;
    year: string;
    // verified removed
  };
  content: string;
  timestamp: string;
  course?: string;
  type: 'text' | 'study-tip' | 'achievement' | 'question' | 'resource' | 'poll';
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  // isBookmarked: boolean; // removed
  tags?: string[];
  poll?: Poll;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    year: string;
    // verified removed
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
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
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      title: 'Contract Law Study Tips - Case Brief Method Works!',
      author: { name: 'Sarah Chen', avatar: '👩‍💼', year: '2L' },
      content: 'Just finished my Contracts outline! 📚 Using the case brief method really helped organize everything. Anyone else struggling with consideration doctrine?',
      timestamp: '2 hours ago',
      course: 'Contract Law',
      type: 'study-tip',
      likes: 24,
      comments: 2,
      shares: 3,
      isLiked: false,
      // isBookmarked: true, // removed
      tags: ['contracts', 'outlines', 'study-tips']
    },
    {
      id: '2',
      title: 'Torts Study Group - Saturday Library Session',
      author: { name: 'Marcus Johnson', avatar: '👨‍🎓', year: '3L' },
      content: 'Hosting a Torts study group this Saturday at 2 PM in the library! We\'ll be covering negligence and strict liability. DM me if you want to join 🤝',
      timestamp: '4 hours ago',
      course: 'Torts',
      type: 'text',
      likes: 18,
      comments: 2,
      shares: 6,
      isLiked: true,
      // isBookmarked: false, // removed
      tags: ['study-group', 'torts', 'negligence']
    },
    {
      id: '3',
      title: 'First A- on Property Law Exam! 🎉',
      author: { name: 'Emma Rodriguez', avatar: '👩‍⚖️', year: '1L' },
      content: '🎉 Just got my first A- on a Property Law exam! The key was understanding the bundle of rights concept early on. Thank you to everyone who shared their notes!',
      timestamp: '6 hours ago',
      course: 'Property Law',
      type: 'achievement',
      likes: 56,
      comments: 2,
      shares: 2,
      isLiked: true,
      // isBookmarked: false, // removed
      tags: ['achievement', 'property-law', 'exam']
    },
    {
      id: '4',
      title: 'Help with Civil Procedure: Rule 12(b)(6) vs Rule 56?',
      author: { name: 'David Park', avatar: '👨‍💻', year: '2L' },
      content: 'Question about Civil Procedure: Can someone explain the difference between Rule 12(b)(6) and Rule 56? I keep getting confused about when to use each motion 🤔',
      timestamp: '8 hours ago',
      course: 'Civil Procedure',
      type: 'question',
      likes: 12,
      comments: 1,
      shares: 1,
      isLiked: false,
      // isBookmarked: true, // removed
      tags: ['civil-procedure', 'motions', 'help']
    },
    {
      id: '5',
      title: 'Best Study Method for Final Exams?',
      author: { name: 'Jessica Liu', avatar: '👩‍🏫', year: '3L' },
      content: 'With finals approaching, I\'m curious what study methods work best for everyone. What\'s your go-to strategy?',
      timestamp: '1 day ago',
      type: 'poll',
      likes: 31,
      comments: 7,
      shares: 12,
      isLiked: false,
      // isBookmarked: true, // removed
      tags: ['finals', 'study-methods', 'polls'],
      poll: {
        id: 'poll1',
        question: 'What\'s your primary study method for finals?',
        options: [
          { id: 'opt1', text: 'Flashcards & memorization', votes: 24 },
          { id: 'opt2', text: 'Practice exams & outlines', votes: 45 },
          { id: 'opt3', text: 'Study groups & discussion', votes: 18 },
          { id: 'opt4', text: 'Visual aids & diagrams', votes: 12 }
        ],
        totalVotes: 99,
        expiresAt: '2 days'
      }
    },
    {
      id: '6',
      title: 'Pro Tip: Pomodoro Technique for Case Reading',
      author: { name: 'Alex Thompson', avatar: '👨‍⚖️', year: '1L' },
      content: 'Pro tip: Use the Pomodoro technique for reading cases! 25 minutes focused reading, 5-minute break. I\'ve increased my retention by 40% 🍅⏰',
      timestamp: '1 day ago',
      type: 'study-tip',
      likes: 43,
      comments: 11,
      shares: 18,
      isLiked: true,
      // isBookmarked: true, // removed
      tags: ['study-tips', 'productivity', 'case-reading']
    },
    {
      id: '7',
      title: 'Criminal Law Study Group - Mens Rea & Actus Reus',
      author: { name: 'Rachel Martinez', avatar: '👩‍🎓', year: '2L' },
      content: 'Criminal Law study group forming for next week! We\'ll focus on mens rea and actus reus. Meeting Tuesday 6 PM in Room 205 📚⚖️',
      timestamp: '1 day ago',
      course: 'Criminal Law',
      type: 'text',
      likes: 15,
      comments: 8,
      shares: 4,
      isLiked: false,
      // isBookmarked: false, // removed
      tags: ['criminal-law', 'study-group']
    },
    {
      id: '8',
      title: 'Corporate Governance Seminar Insights',
      author: { name: 'Kevin Zhang', avatar: '👨‍💼', year: '3L' },
      content: 'Amazing seminar on Corporate Governance today! Key takeaway: understanding fiduciary duties is crucial for in-house counsel roles 💼',
      timestamp: '2 days ago',
      course: 'Corporate Law',
      type: 'resource',
      likes: 28,
      comments: 6,
      shares: 9,
      isLiked: true,
      // isBookmarked: true, // removed
      tags: ['corporate-law', 'governance', 'careers']
    },
    {
      id: '9',
      title: 'Looking for Administrative Law Supplements',
      author: { name: 'Sofia Rodriguez', avatar: '👩‍⚖️', year: '1L' },
      content: 'Can anyone recommend good supplements for Administrative Law? The casebook is dense and I need something more accessible 📖',
      timestamp: '2 days ago',
      course: 'Administrative Law',
      type: 'question',
      likes: 22,
      comments: 14,
      shares: 2,
      isLiked: false,
      // isBookmarked: true, // removed
      tags: ['administrative-law', 'supplements', 'help']
    },
    {
      id: '10',
      title: 'New Coffee Shop Discovery!',
      author: { name: 'Maria Santos', avatar: '👩‍🔬', year: '2L' },
      content: 'Anyone else loving the new coffee shop that opened across from the law library? Perfect study spot with amazing wifi! ☕️📚',
      timestamp: '3 hours ago',
      type: 'text',
      likes: 15,
      comments: 1,
      shares: 2,
      isLiked: false,
      // isBookmarked: false, // removed
      tags: ['campus-life', 'coffee', 'study-spots']
    }
  ]);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // format: `${postId}:${commentId}`
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [mockComments, setMockComments] = useState<Record<string, Comment[]>>({
    '1': [
      {
        id: 'c1',
        author: { name: 'Mike Torres', avatar: '👨‍🎓', year: '2L' },
        content: 'This is so helpful! I struggled with consideration too. Have you tried the Restatement approach?',
        timestamp: '1 hour ago',
        likes: 5,
        isLiked: false,
        replies: [
          {
            id: 'r1',
            author: { name: 'Sarah Chen', avatar: '👩‍💼', year: '2L' },
            content: 'Yes! The Restatement approach really clarified things for me.',
            timestamp: '45 minutes ago',
            likes: 2,
            isLiked: false
          }
        ]
      }
    ],
    '2': [
      {
        id: 'c2',
        author: { name: 'Lisa Wang', avatar: '👩‍🎓', year: '1L' },
        content: 'I\'d love to join! What room in the library?',
        timestamp: '2 hours ago',
        likes: 3,
        isLiked: true
      }
    ],
    '5': [
      {
        id: 'c5',
        author: { name: 'John Davis', avatar: '👨‍🎓', year: '3L' },
        content: 'I do a combination - practice exams with my outline nearby!',
        timestamp: '12 hours ago',
        likes: 8,
        isLiked: false
      },
      {
        id: 'c5b',
        author: { name: 'Amy Chen', avatar: '👩‍💼', year: '2L' },
        content: 'Flashcards work best for me, especially for definitions.',
        timestamp: '10 hours ago',
        likes: 5,
        isLiked: true
      }
    ],
    '6': [
      {
        id: 'c6',
        author: { name: 'Mark Sullivan', avatar: '👨‍⚖️', year: '1L' },
        content: 'Game changer! I\'ve been doing this for a week and my focus has improved so much.',
        timestamp: '20 hours ago',
        likes: 12,
        isLiked: true
      }
    ],
    '10': [
      {
        id: 'c10',
        author: { name: 'Rachel Kim', avatar: '👩‍🎓', year: '2L' },
        content: 'Yes! Their cold brew is amazing. I was there this morning.',
        timestamp: '2 hours ago',
        likes: 4,
        isLiked: false
      }
    ]
  });
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // Hover state for thread original post only
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);

  // Course colors are now determined by the post's assigned color

  // Anonymous name generation
  const adjectives = ['Silly', 'Curious', 'Brave', 'Wise', 'Swift', 'Bright', 'Gentle', 'Fierce'];
  const animals = ['Squirrel', 'Owl', 'Fox', 'Bear', 'Eagle', 'Wolf', 'Deer', 'Hawk'];

  const generateAnonymousName = () => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adjective} ${animal}`;
  };

  // Helper functions
  const getPostColor = (postId: string) => {
    const colors = ['#0080BD', '#04913A', '#F22F21', '#FFBB06']; // Blue, Green, Red, Yellow
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % 4];
  };

  const getPostHoverColor = (postId: string) => {
    const hoverColors = ['rgba(0, 128, 189, 0.05)', 'rgba(4, 145, 58, 0.05)', 'rgba(242, 47, 33, 0.05)', 'rgba(255, 187, 6, 0.05)'];
    // Use postId to generate a consistent but random color
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      hash = ((hash << 5) - hash + postId.charCodeAt(i)) & 0xffffffff;
    }
    return hoverColors[Math.abs(hash) % 4];
  };

  // Create post functions
  const handleCreatePost = () => {
    if (newPostTitle.trim() && newPost.trim()) {
      // Validation: if posting to My Courses, must select a course
      if (newPostTarget === 'my-courses' && !selectedCourseForPost) {
        return; // Don't create post without course selection
      }

      // Generate author info based on whether posting anonymously
      const authorInfo = isAnonymousPost 
        ? { name: generateAnonymousName(), avatar: '🎭', year: 'Anonymous' }
        : { name: 'Justin', avatar: '👨‍🎓', year: '2L' };

      let newPostData: Post = {
        id: Date.now().toString(),
        title: newPostTitle,
        author: authorInfo,
        content: newPost,
        timestamp: 'Just now',
        type: newPostType,
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        // isBookmarked: false // removed
      };

      // Add course if posting to My Courses
      if (newPostTarget === 'my-courses' && selectedCourseForPost) {
        newPostData.course = selectedCourseForPost;
      }

      if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length >= 2) {
        newPostData.poll = {
          id: `poll_${Date.now()}`,
          question: newPost,
          options: pollOptions.filter(opt => opt.trim()).map((opt, index) => ({
            id: `opt_${index}`,
            text: opt.trim(),
            votes: 0
          })),
          totalVotes: 0
        };
      }

      setPosts([newPostData, ...posts]);

      // Reset form
      setNewPost('');
      setNewPostTitle('');
      setNewPostType('text');
      setPollOptions(['', '']);
      setNewPostTarget('campus');
      setSelectedCourseForPost('');
      setIsAnonymousPost(false);
      setShowCreatePostDialog(false);
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
  const handleLike = (postId: string) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
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

  const toggleCommentsExpanded = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const addComment = (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const newCommentObj: Comment = {
      id: `c_${Date.now()}`,
      author: { name: 'Justin', avatar: '👨‍🎓', year: '2L' },
      content: commentText.trim(),
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    setMockComments(prev => ({
      ...prev,
      [postId]: [newCommentObj, ...(prev[postId] || [])]
    }));

    setNewComment(prev => ({ ...prev, [postId]: '' }));

    // Update the comment count in posts
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  };

  const addReply = (postId: string, commentId: string) => {
    const key = `${postId}:${commentId}`;
    const text = replyText[key];
    if (!text?.trim()) return;

    const newReply: Comment = {
      id: `r_${Date.now()}`,
      author: { name: 'Justin', avatar: '👨‍🎓', year: '2L' },
      content: text.trim(),
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setMockComments(prev => {
      const existing = prev[postId] ? [...prev[postId]] : [];
      const updated = existing.map(c => c.id === commentId ? {
        ...c,
        replies: [...(c.replies || []), newReply]
      } : c);
      return { ...prev, [postId]: updated };
    });

    setReplyText(prev => ({ ...prev, [key]: '' }));
    setReplyingTo(null);

    // bump comment count on the post
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    setMockComments(prev => {
      const current = prev[postId] ? [...prev[postId]] : [];
      const updated = current.map(c => {
        if (c.id !== commentId) return c;
        const isLiked = !c.isLiked;
        const likes = isLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
        return { ...c, isLiked, likes };
      });
      return { ...prev, [postId]: updated };
    });
  };

  const toggleReplyLike = (postId: string, commentId: string, replyId: string) => {
    setMockComments(prev => {
      const current = prev[postId] ? [...prev[postId]] : [];
      const updated = current.map(c => {
        if (c.id !== commentId) return c;
        const replies = (c.replies || []).map(r => {
          if (r.id !== replyId) return r as Comment;
          const isLiked = !r.isLiked;
          const likes = isLiked ? r.likes + 1 : Math.max(0, r.likes - 1);
          return { ...(r as Comment), isLiked, likes };
        });
        return { ...c, replies };
      });
      return { ...prev, [postId]: updated };
    });
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== postId || !post.poll) return post;

      const previousSelection = post.poll.userVotedOptionId;
      let updatedTotalVotes = post.poll.totalVotes;

      // 1) First vote (no previous selection)
      if (!previousSelection) {
        updatedTotalVotes += 1;
        return {
          ...post,
          poll: {
            ...post.poll,
            userVotedOptionId: optionId,
            totalVotes: updatedTotalVotes,
            options: post.poll.options.map(opt => 
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            )
          }
        };
      }

      // 2) Toggle off (re-click same option)
      if (previousSelection === optionId) {
        updatedTotalVotes = Math.max(0, updatedTotalVotes - 1);
        return {
          ...post,
          poll: {
            ...post.poll,
            userVotedOptionId: undefined,
            totalVotes: updatedTotalVotes,
            options: post.poll.options.map(opt => 
              opt.id === optionId ? { ...opt, votes: Math.max(0, opt.votes - 1) } : opt
            )
          }
        };
      }

      // 3) Switch choice (different option)
      return {
        ...post,
        poll: {
          ...post.poll,
          userVotedOptionId: optionId,
          // totalVotes unchanged when switching
          totalVotes: updatedTotalVotes,
          options: post.poll.options.map(opt => {
            if (opt.id === previousSelection) return { ...opt, votes: Math.max(0, opt.votes - 1) };
            if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
            return opt;
          })
        }
      };
    }));
  };

  // Filter posts based on feed mode
  const filteredPosts = feedMode === 'my-courses' 
    ? posts.filter(post => post.course) // Only show posts with course tags
    : posts.filter(post => !post.course); // Only show posts without course tags

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
                <ProfileBubble userName={selectedPost.author.name} size="lg" borderColor={getPostColor(selectedPost.id)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{selectedPost.author.name}</h4>
                    <span className="text-sm text-gray-500">{selectedPost.author.year}</span>
                    {/* verified badge removed */}
                  </div>
                  <span className="text-sm text-gray-500">{selectedPost.timestamp}</span>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
              
              {selectedPost.course && (
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
                  style={{ backgroundColor: getPostColor(selectedPost.id) }}
                >
                  {selectedPost.course}
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
                    {selectedPost.likes}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    {mockComments[selectedPost.id] ? mockComments[selectedPost.id].length : 0} comments
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
          <div className="space-y-4">
            {mockComments[selectedPost.id]?.map((comment) => (
              <Card key={comment.id} style={{ backgroundColor: '#FEFBF6' }}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <ProfileBubble userName={comment.author.name} size="md" borderColor={getPostColor(selectedPost.id)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900 text-sm">{comment.author.name}</h5>
                        <span className="text-xs text-gray-500">{comment.author.year}</span>
                        {/* verified badge removed */}
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
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
                          {comment.likes}
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
                              <ProfileBubble userName={reply.author.name} size="sm" borderColor={getPostColor(selectedPost.id)} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="font-medium text-gray-900 text-xs">{reply.author.name}</h6>
                                  <span className="text-xs text-gray-500">{reply.author.year}</span>
                                  {/* verified badge removed */}
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">{reply.timestamp}</span>
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
                                    {reply.likes}
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
                      <ProfileBubble userName={post.author.name} size="md" borderColor={getPostColor(post.id)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{post.author.name}</h4>
                          <span className="text-xs text-gray-500">{post.author.year}</span>
                          {/* verified badge removed */}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{post.timestamp}</span>
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
                      {post.course}
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
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors`}
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
                      {post.likes}
                    </button>
                    <button 
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCommentsExpanded(post.id);
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments}
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

                    {/* Comments List */}
                    <div className="space-y-4">
                      {mockComments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                          <ProfileBubble userName={comment.author.name} size="md" borderColor={getPostColor(post.id)} />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900 text-sm">{comment.author.name}</h5>
                                <span className="text-xs text-gray-500">{comment.author.year}</span>
                                {/* verified badge removed */}
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{comment.timestamp}</span>
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
                                  {comment.likes}
                                </button>
                                <button 
                                  className="text-xs font-medium text-gray-600 hover:text-blue-500 transition-colors"
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setReplyingTo(prev => prev === `${post.id}:${comment.id}` ? null : `${post.id}:${comment.id}`); }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
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
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
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

