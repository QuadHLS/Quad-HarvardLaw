import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import { FileText, MessageSquare, Target, Mail, ExternalLink } from 'lucide-react';
import { ExpandableText } from '../ui/expandable-text';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ClubPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
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
  };
  isLiked?: boolean;
}

interface HomeTabProps {
  value: string;
  clubPosts: ClubPost[];
  postsLoading: boolean;
  hoveredPostId: string | null;
  setHoveredPostId: (id: string | null) => void;
  handlePostClick: (postId: string) => void;
  getPostHoverColor: (postId: string, isClubPost: boolean) => string;
  getPostColor: (postId: string, isClubPost: boolean) => string;
  postPhotoUrls: Map<string, string>;
  club: any;
}

const INITIAL_POSTS = 12;

export function HomeTab({
  value,
  clubPosts,
  postsLoading,
  hoveredPostId,
  setHoveredPostId,
  handlePostClick,
  getPostHoverColor,
  getPostColor,
  postPhotoUrls,
  club,
}: HomeTabProps) {
  const [visiblePostsCount, setVisiblePostsCount] = useState(INITIAL_POSTS);

  useEffect(() => {
    if (visiblePostsCount > clubPosts.length) {
      setVisiblePostsCount(Math.min(Math.max(INITIAL_POSTS, clubPosts.length), visiblePostsCount));
    }
  }, [clubPosts.length, visiblePostsCount]);

  const visiblePosts = useMemo(() => clubPosts.slice(0, visiblePostsCount), [clubPosts, visiblePostsCount]);

  return (
    <TabsContent value={value} className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6" style={{ color: '#752432' }} />
                Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {postsLoading ? (
                <div className="text-center py-12 text-gray-500">Loading posts...</div>
              ) : clubPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <h2 className="text-lg font-medium mb-2">No posts yet</h2>
                </div>
              ) : (
                <div className="space-y-4 px-4 py-4 pt-1" style={{ paddingBottom: '40px' }}>
                  {visiblePosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
                      style={{
                        backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id, true) : '#FEFBF6',
                        borderLeftColor: getPostColor(post.id, true)
                      }}
                      onClick={() => handlePostClick(post.id)}
                      onMouseEnter={() => setHoveredPostId(post.id)}
                      onMouseLeave={() => setHoveredPostId(null)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                                {post.title}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0"
                                style={{
                                  backgroundColor: '#752432',
                                  color: 'white'
                                }}
                              >
                                Club
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">{post.author?.name || 'Club'}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <ExpandableText
                            text={post.content}
                            maxLines={10}
                            className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap"
                            buttonColor={getPostColor(post.id, true)}
                          />
                        </div>

                        {post.photo_url && postPhotoUrls.has(post.id) && (
                          <div className="mb-3 mt-3">
                            <img
                              src={postPhotoUrls.get(post.id) || ''}
                              alt="Post"
                              className="rounded-lg"
                              loading="lazy"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '450px',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {clubPosts.length > visiblePostsCount && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        className="text-sm"
                        style={{ color: '#752432' }}
                        onClick={() => setVisiblePostsCount((count) => Math.min(clubPosts.length, count + 10))}
                      >
                        Load more posts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#752432' }} />
                Mission & Purpose
              </CardTitle>
            </CardHeader>
            <CardContent>
              {club?.mission ? (
                <p className="text-gray-700 leading-relaxed">{club.mission}</p>
              ) : club?.description ? (
                <p className="text-gray-700 leading-relaxed">{club.description}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" style={{ color: '#752432' }} />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {club?.email && (
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-gray-600">{club.email}</div>
                  </div>
                )}
                {club?.website && (
                  <div>
                    <div className="font-medium text-gray-900">Website</div>
                    <div className="text-gray-600 flex items-center gap-1">
                      <a 
                        href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {club.website}
                      </a>
                      <a 
                        href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
