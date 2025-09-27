import React, { useState } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Star, Pin, Clock, ThumbsUp, ThumbsDown, Reply, MoreHorizontal, User, EyeOff, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Comment {
  id: string;
  author: string;
  isAnonymous: boolean;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
}

interface Post {
  id: string;
  title: string;
  author: string;
  isAnonymous: boolean;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isPinned?: boolean;
  flair?: string;
  comments: Comment[];
  category: 'campus' | 'course';
  course?: string;
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Where is the best haircut in Cambridge?',
    author: 'Sarah Chen',
    isAnonymous: false,
    content: 'Looking for a good barber or salon near campus. Preferably somewhere that won\'t break the bank but gives decent cuts. Any recommendations?',
    timestamp: '2h ago',
    upvotes: 23,
    downvotes: 2,
    commentCount: 15,
    flair: 'Question',
    category: 'campus',
    comments: [
      {
        id: 'c1',
        author: 'Michael Rodriguez',
        isAnonymous: false,
        content: 'I\'ve been going to Tony\'s on Mass Ave for 3 years. Great cuts and reasonably priced!',
        timestamp: '1h ago',
        upvotes: 12,
        downvotes: 0,
        replies: [
          {
            id: 'c1r1',
            author: 'Anonymous',
            isAnonymous: true,
            content: 'Thanks! How much do they usually charge?',
            timestamp: '45m ago',
            upvotes: 3,
            downvotes: 0
          }
        ]
      },
      {
        id: 'c2',
        author: 'Anonymous',
        isAnonymous: true,
        content: 'Avoid the place on Harvard St - overpriced and inconsistent quality.',
        timestamp: '30m ago',
        upvotes: 8,
        downvotes: 1
      }
    ]
  },
  {
    id: '2',
    title: 'Who is going to bar review tonight?',
    author: 'Jessica Thompson',
    isAnonymous: false,
    content: 'Thinking of hitting up Charlie Kitchen after the Themis lecture. Anyone want to join? Could use some company and maybe form a study group.',
    timestamp: '4h ago',
    upvotes: 18,
    downvotes: 0,
    commentCount: 8,
    flair: 'Social',
    category: 'campus',
    comments: [
      {
        id: 'c3',
        author: 'David Park',
        isAnonymous: false,
        content: 'I\'m in! What time are you thinking?',
        timestamp: '3h ago',
        upvotes: 5,
        downvotes: 0
      },
      {
        id: 'c4',
        author: 'Anonymous',
        isAnonymous: true,
        content: 'Count me in too. We should definitely form that study group!',
        timestamp: '2h ago',
        upvotes: 4,
        downvotes: 0
      }
    ]
  },
  {
    id: '3',
    title: 'Finals schedule is out - thoughts?',
    author: 'Anonymous',
    isAnonymous: true,
    content: 'Just saw the exam schedule and I have 3 exams in 4 days. How is everyone else looking? Any tips for managing the chaos?',
    timestamp: '6h ago',
    upvotes: 45,
    downvotes: 3,
    commentCount: 32,
    flair: 'Discussion',
    category: 'campus',
    comments: [
      {
        id: 'c5',
        author: 'Emily Watson',
        isAnonymous: false,
        content: 'Same boat here. I\'m planning to start outline reviews this weekend. Coffee study sessions anyone?',
        timestamp: '5h ago',
        upvotes: 15,
        downvotes: 0
      }
    ]
  },
  {
    id: '4',
    title: 'PSA: Free coffee in Langdell lobby until 2pm',
    author: 'Alex Kim',
    isAnonymous: false,
    content: 'SBA is giving out free coffee and pastries in the library lobby. Get it while it lasts!',
    timestamp: '1h ago',
    upvotes: 67,
    downvotes: 1,
    commentCount: 12,
    flair: 'PSA',
    category: 'campus',
    comments: []
  },
  {
    id: '5',
    title: 'Constitutional Law - Midterm Study Group?',
    author: 'Rachel Martinez',
    isAnonymous: false,
    content: 'Anyone interested in forming a study group for Rodriguez\'s ConLaw midterm? I was thinking we could meet at Langdell this weekend to go through the cases.',
    timestamp: '3h ago',
    upvotes: 12,
    downvotes: 0,
    commentCount: 7,
    flair: 'Study Group',
    category: 'course',
    course: 'Constitutional Law',
    comments: [
      {
        id: 'c6',
        author: 'Anonymous',
        isAnonymous: true,
        content: 'I\'m definitely interested! Are you covering the Commerce Clause cases?',
        timestamp: '2h ago',
        upvotes: 4,
        downvotes: 0
      }
    ]
  },
  {
    id: '6',
    title: 'Torts Outline Sharing Thread',
    author: 'Anonymous',
    isAnonymous: true,
    content: 'Has anyone made a good outline for Moore\'s Torts class yet? Happy to trade - I have a solid Contracts outline from last semester.',
    timestamp: '5h ago',
    upvotes: 28,
    downvotes: 2,
    commentCount: 15,
    flair: 'Resources',
    category: 'course',
    course: 'Torts',
    comments: [
      {
        id: 'c7',
        author: 'James Wilson',
        isAnonymous: false,
        content: 'I\'ve got about 40 pages so far. DM me if you want to compare notes!',
        timestamp: '4h ago',
        upvotes: 8,
        downvotes: 0
      }
    ]
  }
];

const pinnedThreads = [
  { id: 'p1', title: 'Where to Print on Campus', commentCount: 25 },
  { id: 'p2', title: 'How to connect to Harvard WiFi', commentCount: 18 },
  { id: 'p3', title: 'Best study spots around campus', commentCount: 42 },
  { id: 'p4', title: 'Dining options near HLS', commentCount: 33 },
  { id: 'p5', title: 'Housing tips for incoming students', commentCount: 56 }
];

export function FeedPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  const [feedType, setFeedType] = useState<'campus' | 'course'>('campus');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFlair, setNewPostFlair] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'campus' | 'course'>('campus');
  const [newPostCourse, setNewPostCourse] = useState('');

  const handleVote = (postId: string, isUpvote: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          upvotes: isUpvote ? post.upvotes + 1 : post.upvotes,
          downvotes: !isUpvote ? post.downvotes + 1 : post.downvotes
        };
      }
      return post;
    }));
  };

  const handleCommentVote = (commentId: string, isUpvote: boolean) => {
    if (!selectedPost) return;
    
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            upvotes: isUpvote ? comment.upvotes + 1 : comment.upvotes,
            downvotes: !isUpvote ? comment.downvotes + 1 : comment.downvotes
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateComments(comment.replies)
          };
        }
        return comment;
      });
    };

    setSelectedPost(prev => prev ? {
      ...prev,
      comments: updateComments(prev.comments)
    } : null);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      author: postAnonymously ? 'Anonymous' : 'You',
      isAnonymous: postAnonymously,
      content: newComment.trim(),
      timestamp: 'now',
      upvotes: 0,
      downvotes: 0
    };

    setSelectedPost(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment],
      commentCount: prev.commentCount + 1
    } : null);

    // Update the main posts list
    setPosts(prev => prev.map(post => {
      if (post.id === selectedPost.id) {
        return {
          ...post,
          comments: [...post.comments, comment],
          commentCount: post.commentCount + 1
        };
      }
      return post;
    }));

    setNewComment('');
    setPostAnonymously(false);
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      title: newPostTitle.trim(),
      author: postAnonymously ? 'Anonymous' : 'You',
      isAnonymous: postAnonymously,
      content: newPostContent.trim(),
      timestamp: 'now',
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      flair: newPostFlair || undefined,
      category: newPostCategory,
      course: newPostCategory === 'course' ? newPostCourse : undefined,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    
    // Reset form
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostFlair('');
    setNewPostCategory('campus');
    setNewPostCourse('');
    setPostAnonymously(false);
    setShowCreatePost(false);
  };

  // Available courses for posting
  const availableCourses = [
    'Constitutional Law',
    'Torts',
    'Contracts',
    'Criminal Law',
    'Civil Procedure',
    'Property Law',
    'Administrative Law',
    'Evidence',
    'Corporate Law',
    'Tax Law'
  ];

  const getFlairColor = (flair: string) => {
    switch (flair?.toLowerCase()) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'discussion': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'psa': return 'bg-red-100 text-red-800';
      case 'study group': return 'bg-orange-100 text-orange-800';
      case 'resources': return 'bg-cyan-100 text-cyan-800';
      default: return 'text-gray-800';
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="flex items-start gap-3">
        <Avatar className="w-6 h-6 mt-1">
          <AvatarFallback className="text-xs">
            {comment.isAnonymous ? '?' : comment.author[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
              {comment.author}
              {comment.isAnonymous && (
                <EyeOff className="w-3 h-3 text-gray-500" />
              )}
            </span>
            <span className="text-xs text-gray-500">{comment.timestamp}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1"
                onClick={() => handleCommentVote(comment.id, true)}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-600">{comment.upvotes - comment.downvotes}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1"
                onClick={() => handleCommentVote(comment.id, false)}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </div>
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Main Feed */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">Student Feed</h1>
                <p className="text-gray-600">Connect with your classmates and stay updated on campus life</p>
              </div>
              
              {/* Feed Type Toggle */}
              <div className="flex items-center gap-3 rounded-lg p-3 shadow-sm border" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                <span className={`text-sm font-medium transition-colors ${feedType === 'campus' ? 'text-red-800' : 'text-gray-500'}`}>
                  Campus
                </span>
                <Switch
                  checked={feedType === 'course'}
                  onCheckedChange={(checked) => setFeedType(checked ? 'course' : 'campus')}
                />
                <span className={`text-sm font-medium transition-colors ${feedType === 'course' ? 'text-red-800' : 'text-gray-500'}`}>
                  My Courses
                </span>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.filter(post => post.category === feedType).map((post) => (
              <Dialog key={post.id}>
                <DialogTrigger asChild>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-red-800">
                    <CardContent className="p-4" onClick={() => setSelectedPost(post)}>
                      <div className="flex gap-3">
                        {/* Vote buttons */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-1 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(post.id, true);
                            }}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-gray-700">
                            {post.upvotes - post.downvotes}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-1 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(post.id, false);
                            }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Post content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {post.flair && (
                              <Badge variant="secondary" className={`text-xs ${getFlairColor(post.flair)}`}>
                                {post.flair}
                              </Badge>
                            )}
                            {post.course && (
                              <Badge variant="outline" className="text-xs">
                                {post.course}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              Posted by {post.author}
                              {post.isAnonymous && (
                                <EyeOff className="w-3 h-3" />
                              )}
                              • {post.timestamp}
                            </span>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 mb-2 hover:text-red-800 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                
                <DialogContent 
                  className="w-[98vw] max-w-[1600px] max-h-[85vh] overflow-y-auto"
                  aria-describedby="post-detail-description"
                >
                  <div id="post-detail-description" className="sr-only">
                    Post details and comments
                  </div>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedPost?.flair && (
                        <Badge variant="secondary" className={`text-xs ${getFlairColor(selectedPost.flair)}`}>
                          {selectedPost.flair}
                        </Badge>
                      )}
                      {selectedPost?.title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      View post details, comments, and add your own comments to the discussion.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedPost && (
                    <div className="space-y-4">
                      {/* Post content */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-1"
                            onClick={() => handleVote(selectedPost.id, true)}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            {selectedPost.upvotes - selectedPost.downvotes}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-1"
                            onClick={() => handleVote(selectedPost.id, false)}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                            <User className="w-4 h-4" />
                            <span className="flex items-center gap-1">
                              {selectedPost.author}
                              {selectedPost.isAnonymous && (
                                <EyeOff className="w-3 h-3" />
                              )}
                              • {selectedPost.timestamp}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-4">{selectedPost.content}</p>
                        </div>
                      </div>

                      {/* Add comment */}
                      <div className="border-t pt-4">
                        <div className="flex gap-3 mb-4">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">Y</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-20"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="anonymous-comment"
                                  checked={postAnonymously}
                                  onCheckedChange={setPostAnonymously}
                                />
                                <label htmlFor="anonymous-comment" className="text-sm text-gray-600 cursor-pointer">
                                  Post anonymously
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewComment('');
                                    setPostAnonymously(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim()}
                                  className="bg-red-800 hover:bg-red-700"
                                >
                                  Comment
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Comments ({selectedPost.commentCount})
                        </h4>
                        {selectedPost.comments.map(comment => renderComment(comment))}
                      </div>
                    </div>
                  )}
                </DialogContent>
        
                {/* Post actions outside the dialog trigger but inside the card */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentCount} comments</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-red-100">
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-red-100">
                    Save
                  </Button>
                </div>
              </Dialog>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Threads Sidebar */}
      <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                className="w-full justify-start bg-[rgba(117,36,50,1)] hover:bg-red-700"
                onClick={() => setShowCreatePost(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Post
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                View Saved Posts
              </Button>
            </div>
          </div>

          {/* Pinned Threads */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pin className="w-4 h-4 text-red-800" />
              <h3 className="font-medium text-gray-900">Pinned Threads</h3>
            </div>
            <div className="space-y-2">
              {pinnedThreads.map((thread) => (
                <Card key={thread.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <button className="text-left w-full focus:outline-none focus:ring-2 focus:ring-red-800 rounded">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {thread.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>{thread.commentCount} comments</span>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trending Topics */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Trending Topics</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#finals</span>
                <span className="text-gray-500">127 posts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#barreview</span>
                <span className="text-gray-500">89 posts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#studygroup</span>
                <span className="text-gray-500">64 posts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#conlaw</span>
                <span className="text-gray-500">52 posts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#outlines</span>
                <span className="text-gray-500">43 posts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">#torts</span>
                <span className="text-gray-500">38 posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-2xl w-full max-w-3xl max-h-screen overflow-y-auto border border-gray-200" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-800 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
                  <p className="text-sm text-gray-600">Share your thoughts with the community</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Post Category Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📍 Post Destination
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-red-800 transition-colors" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                    <input
                      type="radio"
                      name="category"
                      value="campus"
                      checked={newPostCategory === 'campus'}
                      onChange={(e) => setNewPostCategory(e.target.value as 'campus' | 'course')}
                      className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-800"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">🏫 Campus Community</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-red-800 transition-colors" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                    <input
                      type="radio"
                      name="category"
                      value="course"
                      checked={newPostCategory === 'course'}
                      onChange={(e) => setNewPostCategory(e.target.value as 'campus' | 'course')}
                      className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-800"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">📚 My Courses</span>
                  </label>
                </div>
              </div>

              {/* Course Selection (only show if course category is selected) */}
              {newPostCategory === 'course' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <Select value={newPostCourse} onValueChange={setNewPostCourse}>
                    <SelectTrigger className="border-gray-300 focus:border-red-800 focus:ring-red-800">
                      <SelectValue placeholder="Choose a course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Post Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter a clear, descriptive title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full border-gray-300 focus:border-red-800 focus:ring-red-800 text-lg"
                />
              </div>

              {/* Post Flair */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (optional)
                </label>
                <Select value={newPostFlair} onValueChange={setNewPostFlair}>
                  <SelectTrigger className="border-gray-300 focus:border-red-800 focus:ring-red-800">
                    <SelectValue placeholder="Choose a category to help others find your post..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Question">❓ Question</SelectItem>
                    <SelectItem value="Discussion">💬 Discussion</SelectItem>
                    <SelectItem value="Social">🎉 Social</SelectItem>
                    <SelectItem value="PSA">📢 PSA</SelectItem>
                    <SelectItem value="Study Group">📖 Study Group</SelectItem>
                    <SelectItem value="Resources">📁 Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Post Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Share your thoughts, ask questions, or start a discussion..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full min-h-36 border-gray-300 focus:border-red-800 focus:ring-red-800 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {newPostContent.length}/2000 characters
                  </div>
                </div>
              </div>

              {/* Anonymous Option */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="anonymous-post"
                    checked={postAnonymously}
                    onCheckedChange={setPostAnonymously}
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="anonymous-post" className="text-sm font-medium text-gray-900 cursor-pointer block">
                      🎭 Post anonymously
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Your identity will be hidden from other users
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                All posts must follow community guidelines
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostTitle.trim() || !newPostContent.trim() || (newPostCategory === 'course' && !newPostCourse)}
                  className="bg-red-800 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}