import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ConfirmationPopup } from '../ui/confirmation-popup';
import { VirtualizedList } from '../ui/VirtualizedList';
import { ExpandableText } from '../ui/expandable-text';
import { FileText, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getStorageUrl } from '../../utils/storage';
import type { ClubFormData, Post, Comment } from '../ClubAccountPage';
import { toast } from 'sonner';

interface FeedTabProps {
  formData: ClubFormData;
  updateFormData: (field: keyof ClubFormData, value: any) => void;
}

const INITIAL_POSTS = 12;

export function FeedTab({ formData, updateFormData }: FeedTabProps) {
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll' | 'youtube'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [postPhotoFile, setPostPhotoFile] = useState<File | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [clubAccountName, setClubAccountName] = useState<string>('');
  const [clubAccountId, setClubAccountId] = useState<string | null>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentAnonymously, setCommentAnonymously] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [postPhotoUrls, setPostPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
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

  const [visiblePostsCount, setVisiblePostsCount] = useState(INITIAL_POSTS);

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

  const getPostColor = useCallback((_postId: string) => '#752432', []);
  const getPostHoverColor = useCallback((_postId: string) => 'rgba(117, 36, 50, 0.05)', []);

  const visiblePosts = useMemo(() => posts.slice(0, visiblePostsCount), [posts, visiblePostsCount]);

  useEffect(() => {
    if (visiblePostsCount > posts.length) {
      setVisiblePostsCount(Math.min(Math.max(INITIAL_POSTS, posts.length), visiblePostsCount));
    }
  }, [posts.length, visiblePostsCount]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data: clubAccount, error } = await supabase
          .from('club_accounts')
          .select('id, name')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !clubAccount) return;
        setClubAccountId(clubAccount.id);
        setClubAccountName(clubAccount.name || 'Club');

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', clubAccount.id)
          .order('created_at', { ascending: false });

        const transformed = (postsData || []).map((p: any) => ({
          ...p,
          author: { name: clubAccount.name || 'Club', year: '' },
          isLiked: false,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
        }));
        setPosts(transformed);

        const withPhotos = transformed.filter((p: Post) => p.photo_url);
        if (withPhotos.length) {
          const urls = await Promise.all(
            withPhotos.map(async (p: Post) => {
              const url = await getStorageUrl(p.photo_url, 'post_picture');
              return { id: p.id, url };
            })
          );
          setPostPhotoUrls(new Map(urls.filter(({ url }) => url).map(({ id, url }) => [id, url!])));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderPost = useCallback((post: Post) => {
    return (
      <div
        key={post.id}
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
        style={{
          backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id) : '#FEFBF6',
          borderLeftColor: getPostColor(post.id)
        }}
        onMouseEnter={() => setHoveredPostId(post.id)}
        onMouseLeave={() => setHoveredPostId((prev) => (prev === post.id ? null : prev))}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm">{clubAccountName}</h4>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: '#752432' }}
                >
                  Club
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</span>
                {post.is_edited && <span className="text-xs text-gray-400 italic">(edited)</span>}
              </div>
            </div>
          </div>

          {editingPost !== post.id && (
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">{post.title}</h3>
            </div>
          )}

          <div className="mb-3">
            {editingPost === post.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editPostTitle}
                  onChange={(e) => setEditPostTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Post title..."
                />
                {post.post_type !== 'poll' && (
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    placeholder="Post content..."
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingPost(null)} style={{ backgroundColor: getPostColor(post.id), color: 'white' }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <ExpandableText
                text={post.content}
                maxLines={10}
                className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap"
                buttonColor={getPostColor(post.id)}
              />
            )}
          </div>

          {post.photo_url && postPhotoUrls.has(post.id) && (
            <div className="mb-3 mt-3">
              <img
                src={postPhotoUrls.get(post.id) || ''}
                alt="Post"
                loading="lazy"
                className="rounded-lg"
                style={{ maxWidth: '100%', maxHeight: '450px', width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }, [
    clubAccountName,
    editPostContent,
    editPostTitle,
    editingPost,
    formatTimestamp,
    getPostColor,
    getPostHoverColor,
    hoveredPostId,
    postPhotoUrls
  ]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading posts...</div>;
  }

  if (!posts.length) {
    return (
      <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6" style={{ color: '#752432' }} />
            Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <h2 className="text-lg font-medium mb-2">No posts yet</h2>
          </div>
        </CardContent>
      </Card>
    );
  }

  const useVirtual = posts.length > 30;
  const height = Math.min(900, Math.max(420, visiblePosts.length * 240));

  return (
    <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-6 h-6" style={{ color: '#752432' }} />
          Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <div className="space-y-4 px-1 pt-1" style={{ paddingBottom: '40px' }}>
          {useVirtual ? (
            <VirtualizedList
              items={visiblePosts}
              itemHeight={260}
              height={height}
              overscanCount={6}
              renderItem={(post) => renderPost(post)}
            />
          ) : (
            visiblePosts.map(renderPost)
          )}
          {posts.length > visiblePostsCount && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                className="text-sm"
                style={{ color: '#752432' }}
                onClick={() => setVisiblePostsCount((count) => Math.min(posts.length, count + 10))}
              >
                Load more posts
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

