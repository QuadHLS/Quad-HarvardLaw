import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Mail, ExternalLink, MapPin, Clock, Award, Target, FileText, MessageSquare, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ConfirmationPopup } from './ui/confirmation-popup';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../utils/storage';
import { ExpandableText } from './ui/expandable-text';
import { useAuth } from '../contexts/AuthContext';

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
};


interface ClubDetailPageProps {
  clubId: string;
  onBack: () => void;
}

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
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    totalVotes: number;
    userVotedOptionId?: string;
  };
}

interface ClubComment {
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
  author?: {
    name: string;
    year: string;
  };
  isLiked?: boolean;
  replies?: ClubComment[];
}

// Helper function to convert video URLs to embed format
const getVideoEmbedUrl = (url: string | null | undefined): { embedUrl: string; platform: 'youtube' | 'tiktok' | 'instagram' } | null => {
  if (!url || !url.trim()) return null;
  
  const trimmedUrl = url.trim();
  
  // YouTube (regular videos and shorts)
  let watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([^&\s]+)/);
  if (watchMatch) {
    const videoId = watchMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  let shortMatch = trimmedUrl.match(/youtu\.be\/([^?\s]+)/);
  if (shortMatch) {
    const videoId = shortMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  let shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([^?\s]+)/);
  if (shortsMatch) {
    const videoId = shortsMatch[1].split('&')[0].split('#')[0];
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
  }
  
  // TikTok
  let tiktokMatch = trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1];
    return { embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`, platform: 'tiktok' };
  }
  
  // Instagram
  let instagramMatch = trimmedUrl.match(/instagram\.com\/(?:p|reel)\/([^\/\?\s]+)/);
  if (instagramMatch) {
    const postId = instagramMatch[1];
    return { embedUrl: `https://www.instagram.com/p/${postId}/embed/`, platform: 'instagram' };
  }
  
  return null;
};

// Format timestamp helper (matching CoursePage)
const formatTimestamp = (timestamp: string): string => {
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

export function ClubDetailPage({ clubId, onBack }: ClubDetailPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberPictureUrls, setMemberPictureUrls] = useState<Record<string, string>>({});
  
  // Feed state
  const [clubPosts, setClubPosts] = useState<ClubPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postPhotoUrls, setPostPhotoUrls] = useState<Map<string, string>>(new Map());
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, ClubComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // format: `${postId}:${commentId}`
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [commentAnonymously, setCommentAnonymously] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
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
  const [editCommentContent, setEditCommentContent] = useState<string>('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState<string>('');
  const [editPostContent, setEditPostContent] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});
  const [eventRsvpStatus, setEventRsvpStatus] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        
        // Try to decode the slug back to club name, or use clubId as-is if it's a UUID
        let query = supabase
          .from('club_accounts')
          .select('id, name, description, avatar_url, mission, email, website, events, members, member_joins');
        
        // Check if clubId is a UUID (contains hyphens and is 36 chars) or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);
        
        if (isUUID) {
          query = query.eq('id', clubId);
        } else {
          // Decode slug and search by exact name match
          const decodedName = decodeURIComponent(clubId);
          query = query.eq('name', decodedName);
        }
        
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error fetching club:', error?.message || "Unknown error");
          return;
        }

        if (!data) {
          return;
        }

        // Count members from member_joins array
        const memberCount = Array.isArray(data.member_joins) ? data.member_joins.length : 0;
        
        // Check if current user has joined
        if (user?.id && Array.isArray(data.member_joins)) {
          setIsJoined(data.member_joins.includes(user.id));
        } else {
          setIsJoined(false);
        }

        // Map events from JSONB array
        const mappedEvents = Array.isArray(data.events) ? data.events
          .filter((event: any) => event && event.id && event.name)
          .map((event: any) => ({
            id: event.id,
            title: event.name,
            date: event.date,
            time: event.time,
            location: event.location,
            description: event.shortDescription,
            longDescription: event.fullDescription,
            attendees: Array.isArray(event.rsvps) ? event.rsvps.length : 0,
            rsvps: Array.isArray(event.rsvps) ? event.rsvps : [],
            lunchProvided: event.lunchProvided
          })) : [];

        // Check RSVP status for each event
        if (user?.id && Array.isArray(data.events)) {
          const rsvpStatus: Record<string, boolean> = {};
          const userIdStr = user.id.toString();
          data.events.forEach((event: any) => {
            if (event && event.id && Array.isArray(event.rsvps)) {
              rsvpStatus[event.id] = event.rsvps.includes(userIdStr);
            }
          });
          setEventRsvpStatus(rsvpStatus);
        }

        // Map members from JSONB array
        const mappedMembers = Array.isArray(data.members) ? data.members
          .filter((member: any) => member && member.id && member.name)
          .map((member: any) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            email: member.email,
            bio: member.bio,
            picture: member.picture
          })) : [];

        setClub({
          id: data.id,
          name: data.name,
          description: data.description,
          members: memberCount,
          mission: data.mission,
          email: data.email,
          website: data.website,
          events: mappedEvents,
          membersList: mappedMembers
        });

        // Fetch avatar URL
        if (data.avatar_url) {
          const url = await getStorageUrl(data.avatar_url, 'Avatar');
          setAvatarUrl(url);
        }

        // Fetch member picture URLs
        const picturePromises = mappedMembers
          .filter((member: any) => member.picture)
          .map(async (member: any) => {
            const url = await getStorageUrl(member.picture, 'Avatar');
            return { id: member.id, url };
          });

        const pictureUrls = await Promise.all(picturePromises);
        const urlMap: Record<string, string> = {};
        pictureUrls.forEach(({ id, url }) => {
          if (url) urlMap[id] = url;
        });
        setMemberPictureUrls(urlMap);
      } catch (err) {
        console.error('Error fetching club data:', err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [clubId, user?.id]);

  // Fetch posts for this club
  useEffect(() => {
    if (club?.id) {
      fetchClubPosts();
    }
  }, [club?.id, user]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
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

  // Handle join/leave club
  const handleJoinLeave = async () => {
    if (!user || !club?.id || isJoining) return;

    try {
      setIsJoining(true);

      if (isJoined) {
        // Leave club
        const { error } = await supabase.rpc('leave_club', {
          club_account_id: club.id
        });

        if (error) {
          console.error('Error leaving club:', error?.message || "Unknown error");
          toast.error('Failed to leave club. Please try again.');
          return;
        }
        
        toast.success('You have left the club');
      } else {
        // Join club
        const { error } = await supabase.rpc('join_club', {
          club_account_id: club.id
        });

        if (error) {
          console.error('Error joining club:', error?.message || "Unknown error");
          toast.error('Failed to join club. Please try again.');
          return;
        }
        
        toast.success('You have joined the club!');
      }

      // Refresh club data to get updated member_joins
      const { data: updatedClub, error: fetchError } = await supabase
        .from('club_accounts')
        .select('id, name, description, avatar_url, mission, email, website, events, members, member_joins')
        .eq('id', club.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated club data:', fetchError?.message || "Unknown error");
        return;
      }

      if (updatedClub) {
        // Update club state
        const memberCount = Array.isArray(updatedClub.member_joins) ? updatedClub.member_joins.length : 0;
        setClub({
          ...club,
          member_joins: updatedClub.member_joins,
          members: memberCount
        });

        // Update joined state
        if (user?.id && Array.isArray(updatedClub.member_joins)) {
          setIsJoined(updatedClub.member_joins.includes(user.id));
        } else {
          setIsJoined(false);
        }
      }
    } catch (error) {
      console.error('Error in handleJoinLeave:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsJoining(false);
    }
  };

  // Handle RSVP to event
  const handleEventRSVP = async (eventId: string) => {
    if (!user || !club?.id || rsvpLoading[eventId]) return;

    try {
      setRsvpLoading(prev => ({ ...prev, [eventId]: true }));

      const isRsvped = eventRsvpStatus[eventId] || false;

      if (isRsvped) {
        // Un-RSVP
        const { error } = await supabase.rpc('unrsvp_from_event', {
          club_account_id: club.id,
          event_id: eventId
        });

        if (error) {
          console.error('Error un-RSVPing from event:', error?.message || "Unknown error");
          toast.error('Failed to un-RSVP. Please try again.');
          return;
        }
        
        toast.success('You have un-RSVPed from the event');
      } else {
        // RSVP
        const { error } = await supabase.rpc('rsvp_to_event', {
          club_account_id: club.id,
          event_id: eventId
        });

        if (error) {
          console.error('Error RSVPing to event:', error?.message || "Unknown error");
          toast.error('Failed to RSVP. Please try again.');
          return;
        }
        
        toast.success('You have RSVPed to the event!');
      }

      // Refresh club data to get updated events
      const { data: updatedClub, error: fetchError } = await supabase
        .from('club_accounts')
        .select('id, name, description, avatar_url, mission, email, website, events, members, member_joins')
        .eq('id', club.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated club data:', fetchError?.message || "Unknown error");
        return;
      }

      if (updatedClub) {
        // Map events with updated RSVP data
        const updatedMappedEvents = Array.isArray(updatedClub.events) ? updatedClub.events
          .filter((event: any) => event && event.id && event.name)
          .map((event: any) => ({
            id: event.id,
            title: event.name,
            date: event.date,
            time: event.time,
            location: event.location,
            description: event.shortDescription,
            longDescription: event.fullDescription,
            attendees: Array.isArray(event.rsvps) ? event.rsvps.length : 0,
            rsvps: Array.isArray(event.rsvps) ? event.rsvps : [],
            lunchProvided: event.lunchProvided
          })) : [];

        // Update club state with new events (mapped events)
        setClub({
          ...club,
          events: updatedMappedEvents
        });

        // Update RSVP status
        if (user?.id && Array.isArray(updatedClub.events)) {
          const rsvpStatus: Record<string, boolean> = {};
          const userIdStr = user.id.toString();
          updatedClub.events.forEach((event: any) => {
            if (event && event.id && Array.isArray(event.rsvps)) {
              rsvpStatus[event.id] = event.rsvps.includes(userIdStr);
            }
          });
          setEventRsvpStatus(rsvpStatus);
        }
      }
    } catch (error) {
      console.error('Error in handleEventRSVP:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setRsvpLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const fetchClubPosts = async () => {
    try {
      setPostsLoading(true);
      
      if (!user || !club?.id) {
        setPostsLoading(false);
        return;
      }

      // Fetch posts where author_id = club.id
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', club.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching club posts:', postsError?.message || "Unknown error");
        setPostsLoading(false);
        return;
      }

      if (!posts || posts.length === 0) {
        setClubPosts([]);
        setPostsLoading(false);
        return;
      }

      // Get post IDs for batch fetching
      const postIds = posts.map((p: any) => p.id);

      // Batch fetch user likes for posts
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

      // Create lookup maps
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
      const pollPostIds = posts.filter((p: any) => p.post_type === 'poll').map((p: any) => p.id);
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

          const { data: userPollVotes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id')
            .eq('user_id', user.id)
            .in('poll_id', pollIds);

          pollVotesMap = new Map(userPollVotes?.map((v: any) => [v.poll_id, v.option_id]) || []);

          const { data: allPollVotes } = await supabase
            .from('poll_votes')
            .select('option_id')
            .in('poll_id', pollIds);

          const voteCounts = new Map();
          allPollVotes?.forEach((vote: any) => {
            voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
          });

          pollOptionsMap.forEach((options) => {
            options.forEach((option: any) => {
              option.votes = voteCounts.get(option.id) || 0;
            });
          });
        }
      }

      // Transform posts - all posts are from the club, so author is always the club
      const transformedPosts: ClubPost[] = posts.map((post: any) => {
        const isLiked = userLikesSet.has(post.id);
        const likesCount = likesCountMap.get(post.id) || 0;
        const commentsCount = commentsCountMap.get(post.id) || 0;

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
          post_type: post.post_type,
          is_anonymous: post.is_anonymous,
          created_at: post.created_at,
          edited_at: post.edited_at,
          is_edited: post.is_edited,
          likes_count: likesCount,
          comments_count: commentsCount,
          photo_url: post.photo_url || null,
          vid_link: post.vid_link || null,
          author: {
            name: club.name,
            year: ''
          },
          isLiked: isLiked,
          poll
        };
      });

      setClubPosts(transformedPosts);

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
      console.error('Error fetching club posts:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setPostsLoading(false);
    }
  };

  // Toggle like for a post
  const togglePostLike = async (postId: string) => {
    if (likingPosts.has(postId) || !user) return;
    
    try {
      setLikingPosts(prev => new Set(prev).add(postId));
      
      const post = clubPosts.find(p => p.id === postId);
      if (!post) return;

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
      setClubPosts(prevPosts => 
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
      console.error('Error toggling post like:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Handle post click to open thread view
  const handlePostClick = (postId: string) => {
    setSelectedPostThread(postId);
    setLoadingComments(prev => new Set(prev).add(postId));
    fetchComments(postId);
  };

  // Handle back to feed
  const handleBackToFeed = () => {
    setSelectedPostThread(null);
    setReplyingTo(null);
  };

  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    try {
      if (!user) return;

      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error?.message || "Unknown error");
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        return;
      }

      const topLevelComments = (commentsData || []).filter((c: any) => !c.parent_comment_id);
      const replies = (commentsData || []).filter((c: any) => c.parent_comment_id);

      const authorIds = [...new Set(commentsData?.map((c: any) => c.author_id) || [])];
      
      // Fetch regular user authors
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Fetch club account authors
      const { data: clubAccounts } = await supabase
        .from('club_accounts')
        .select('id, name')
        .in('id', authorIds);

      const commentIds = commentsData?.map((c: any) => c.id) || [];
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const clubAccountsMap = new Map(clubAccounts?.map((ca: any) => [ca.id, ca]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      
      const likesCountMap = new Map();
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });

      const repliesMap = new Map();
      replies.forEach((reply: any) => {
        if (!repliesMap.has(reply.parent_comment_id)) {
          repliesMap.set(reply.parent_comment_id, []);
        }
        repliesMap.get(reply.parent_comment_id).push(reply);
      });

      const transformedComments = topLevelComments.map((comment: any) => {
        const author = authorsMap.get(comment.author_id);
        const clubAccount = clubAccountsMap.get(comment.author_id);
        const isClubAccount = !!clubAccount;
        const isLiked = userLikesSet.has(comment.id);
        const likesCount = likesCountMap.get(comment.id) || 0;

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
              ? { name: (replyClubAccount as any).name || 'Club', year: '' }
              : (replyAuthor && (replyAuthor as any).full_name ? {
                  name: reply.is_anonymous ? 'Anonymous User' : (replyAuthor as any).full_name,
                  year: (replyAuthor as any).class_year || ''
                } : undefined),
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
          author: isClubAccount
            ? { name: (clubAccount as any).name || 'Club', year: '' }
            : (author && (author as any).full_name ? {
                name: comment.is_anonymous ? 'Anonymous User' : (author as any).full_name,
                year: (author as any).class_year || ''
              } : undefined),
          isLiked: isLiked,
          replies: commentReplies
        };
      });

      setComments(prev => ({
        ...prev,
        [postId]: transformedComments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment[postId].trim(),
          is_anonymous: commentAnonymously[postId] || false
        });

      if (error) {
        console.error('Error adding comment:', error?.message || "Unknown error");
        return;
      }

      setNewComment(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });

      setCommentAnonymously(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });

      // Refresh comments
      fetchComments(postId);
      
      // Update post comment count
      setClubPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Add reply
  const handleAddReply = async (postId: string, commentId: string) => {
    const key = `${postId}:${commentId}`;
    const text = replyText[key];
    if (!text?.trim()) return;

    try {
      if (!user) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: commentId,
          author_id: user.id,
          content: text.trim(),
          is_anonymous: replyAnonymously[key] || false
        });

      if (error) {
        console.error('Error adding reply:', error?.message || "Unknown error");
        return;
      }

      setReplyText(prev => ({ ...prev, [key]: '' }));
      setReplyAnonymously(prev => ({ ...prev, [key]: false }));
      setReplyingTo(null);

      // Refresh comments to get the new reply
      await fetchComments(postId);
      
      // Update post comment count
      setClubPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error adding reply:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Edit post
  const handleEditPost = async (postId: string) => {
    if (!user || !editPostTitle.trim()) return;

    try {
      const updateData: any = {
        title: editPostTitle.trim(),
        is_edited: true
      };

      if (editPostContent.trim()) {
        updateData.content = editPostContent.trim();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('author_id', user.id);

      if (error) {
        console.error('Error editing post:', error?.message || "Unknown error");
        return;
      }

      setEditingPost(null);
      setEditPostTitle('');
      setEditPostContent('');

      // Refresh posts
      if (club?.id) {
        fetchClubPosts();
      }
    } catch (error) {
      console.error('Error editing post:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Vote on poll
  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      if (!user) return;

      const post = clubPosts.find(p => p.id === postId);
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
      setClubPosts(prevPosts => 
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

  // Delete post
  const handleDeletePost = async (postId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
          if (!user) return;

          // First, get the post to check if it has a photo
          const { data: postData } = await supabase
            .from('posts')
            .select('photo_url')
            .eq('id', postId)
            .eq('author_id', user.id)
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
            .eq('author_id', user.id);

          if (error) throw error;
          
          setClubPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
          
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

  // Toggle comment like
  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!user || !editCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editCommentContent.trim(),
          is_edited: true
        })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) {
        console.error('Error editing comment:', error?.message || "Unknown error");
        return;
      }

      setEditingComment(null);
      setEditCommentContent('');

      // Refresh comments for all posts
      Object.keys(comments).forEach(postId => {
        fetchComments(postId);
      });
    } catch (error) {
      console.error('Error editing comment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
          if (!user) return;

          // First, delete all replies to this comment
          const { error: repliesError } = await supabase
            .from('comments')
            .delete()
            .eq('parent_comment_id', commentId);

          if (repliesError) {
            console.error('Error deleting replies:', repliesError?.message || "Unknown error");
          }

          // Then delete the comment itself
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('author_id', user.id);

          if (error) throw error;

          // Find which post this comment belongs to
          const postId = Object.keys(comments).find(key => 
            comments[key].some(c => 
              c.id === commentId || 
              (c.replies && c.replies.some(r => r.id === commentId))
            )
          );

          // Refresh comments for all posts
          Object.keys(comments).forEach(postId => {
            fetchComments(postId);
          });

          // Update post comment counts
          if (postId) {
            setClubPosts(prevPosts => 
              prevPosts.map(p => {
                const comment = comments[p.id]?.find(c => c.id === commentId);
                if (comment) {
                  const replyCount = comment.replies?.length || 0;
                  return { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1 - replyCount) };
                }
                return p;
              })
            );
          }
          
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting comment:', error instanceof Error ? error.message : "Unknown error");
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const toggleCommentLike = async (commentId: string) => {
    if (likingComments.has(commentId) || !user) return;

    try {
      setLikingComments(prev => new Set(prev).add(commentId));

      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', commentId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('likeable_type', 'comment')
          .eq('likeable_id', commentId);
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            likeable_type: 'comment',
            likeable_id: commentId
          });
      }

      // Update comment like state in all posts
      setComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          const updateCommentLikes = (comments: ClubComment[]): ClubComment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  isLiked: !isCurrentlyLiked,
                  likes_count: isCurrentlyLiked 
                    ? Math.max(0, comment.likes_count - 1) 
                    : comment.likes_count + 1
                };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: updateCommentLikes(comment.replies || [])
                };
              }
              return comment;
            });
          };
          updated[postId] = updateCommentLikes(updated[postId]);
        });
        return updated;
      });
    } catch (error) {
      console.error('Error toggling comment like:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-gray-600">Loading club...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Club not found</h2>
          <Button onClick={onBack}>Back to Clubs</Button>
        </div>
      </div>
    );
  }

  const events = club.events;
  const boardMembers = club.membersList;

  // Post color functions (matching FeedComponent - club posts always use maroon)
  const getPostColor = (postId: string, isClubAccount: boolean = true): string => {
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
  };

  const getPostHoverColor = (postId: string, isClubAccount: boolean = true): string => {
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
  };

  // Render thread view
  const renderThreadView = () => {
    const selectedPost = clubPosts.find(p => p.id === selectedPostThread);
    if (!selectedPost) return null;
    
    return (
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
                
                {/* Original Post */}
                <Card 
                  className="mb-6 border-l-4 cursor-pointer" 
                  style={{ 
                    backgroundColor: '#FEFBF6',
                    borderLeftColor: getPostColor(selectedPost.id, true),
                    boxShadow: isThreadPostHovered ? `0 0 0 2px ${getPostHoverColor(selectedPost.id, true)}` : undefined
                  }}
                  onMouseEnter={() => setIsThreadPostHovered(true)}
                  onMouseLeave={() => setIsThreadPostHovered(false)}
                  onClick={() => { /* no-op click target for post area in thread view */ }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <ProfileBubble 
                        userName={selectedPost.author?.name || 'Club'} 
                        size="lg" 
                        borderColor={getPostColor(selectedPost.id, true)}
                        isAnonymous={false}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{selectedPost.author?.name || 'Club'}</h4>
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: '#752432' }}
                          >
                            Club
                          </span>
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
                              backgroundColor: getPostColor(selectedPost.id, true)
                            }}
                            onMouseEnter={(e: React.MouseEvent) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                            }}
                            onMouseLeave={(e: React.MouseEvent) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                              backgroundColor: getPostColor(selectedPost.id, true)
                            }}
                            onMouseEnter={(e: React.MouseEvent) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                            }}
                            onMouseLeave={(e: React.MouseEvent) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                          buttonColor={getPostColor(selectedPost.id, true)}
                        />
                      </div>
                    )}
                    
                    {selectedPost.photo_url && postPhotoUrls.has(selectedPost.id) && (
                      <div className="mb-4 mt-4">
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
                          onError={() => {
                            // If signed URL expires, regenerate it
                            if (selectedPost.photo_url) {
                              getStorageUrl(selectedPost.photo_url, 'post_picture').then(url => {
                                if (url) {
                                  setPostPhotoUrls(prev => {
                                    const updatedMap = new Map(prev);
                                    updatedMap.set(selectedPost.id, url);
                                    return updatedMap;
                                  });
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {selectedPost.vid_link && (
                      <div className="mb-4 mt-4">
                        {(() => {
                          const embedData = getVideoEmbedUrl(selectedPost.vid_link);
                          if (!embedData) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  Invalid video URL: {selectedPost.vid_link}
                                </p>
                              </div>
                            );
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVotePoll(selectedPost.id, option.id);
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                                  isSelected 
                                    ? 'bg-gray-50'
                                    : hasVoted
                                    ? 'border-gray-200 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                                style={{
                                  borderColor: isSelected ? getPostColor(selectedPost.id, true) : undefined,
                                  backgroundColor: isSelected ? `${getPostColor(selectedPost.id, true)}0D` : undefined
                                }}
                              >
                                {hasVoted && (
                                  <div 
                                    className="absolute inset-0 transition-all duration-300"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: `${getPostColor(selectedPost.id, true)}33`
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
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => togglePostLike(selectedPost.id)}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                            selectedPost.isLiked ? '' : 'text-gray-600'
                          }`}
                          style={{
                            color: selectedPost.isLiked ? getPostColor(selectedPost.id, true) : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedPost.isLiked) {
                              (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, true);
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
                                  e.currentTarget.style.color = getPostColor(selectedPost.id, true);
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
                        <ProfileBubble userName={userProfile?.full_name || 'User'} size="md" borderColor={getPostColor(selectedPost.id, true)} />
                        <div className="flex-1">
                          <textarea
                            placeholder="Write a comment..."
                            value={newComment[selectedPost.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#752432] focus:border-[#752432] resize-none min-h-[60px] text-sm"
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
                                    backgroundColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id, true) : 'white',
                                    borderColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id, true) : '#d1d5db'
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
                              onClick={() => handleAddComment(selectedPost.id)}
                              disabled={!newComment[selectedPost.id]?.trim()}
                              className="text-white"
                              style={{ 
                                backgroundColor: getPostColor(selectedPost.id, true)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
                              }}
                            >
                              Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
                        userName={comment.author?.name || 'User'} 
                        size="md" 
                        borderColor={getPostColor(selectedPost.id, true)} 
                        isAnonymous={comment.is_anonymous}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900 text-sm">{comment.author?.name || 'User'}</h5>
                          {!comment.is_anonymous && comment.author?.year && (
                            <span className="text-xs text-gray-500">{comment.author.year}</span>
                          )}
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
                                  backgroundColor: getPostColor(selectedPost.id, true)
                                }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                                  backgroundColor: getPostColor(selectedPost.id, true)
                                }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                            buttonColor={getPostColor(selectedPost.id, true)}
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <button 
                            className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                              comment.isLiked ? '' : 'text-gray-600'
                            }`}
                            style={{
                              color: comment.isLiked ? getPostColor(selectedPost.id, true) : undefined
                            }}
                            onMouseEnter={(e: React.MouseEvent) => {
                              if (!comment.isLiked) {
                                (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, true);
                              }
                            }}
                            onMouseLeave={(e: React.MouseEvent) => {
                              if (!comment.isLiked) {
                                (e.currentTarget as HTMLElement).style.color = '';
                              }
                            }}
                            onClick={() => toggleCommentLike(comment.id)}
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
                              e.currentTarget.style.color = getPostColor(selectedPost.id, true);
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
                                  e.currentTarget.style.color = getPostColor(selectedPost.id, true);
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
                        
                        {/* Reply Input */}
                        {replyingTo === `${selectedPost.id}:${comment.id}` && (
                          <div className="mt-2 ml-4 space-y-2">
                            <textarea
                              value={replyText[`${selectedPost.id}:${comment.id}`] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.value }))}
                              placeholder="Write a reply..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#752432] focus:border-[#752432] resize-none min-h-[40px] text-xs"
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
                                      backgroundColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id, true) : 'white',
                                      borderColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id, true) : '#d1d5db'
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
                                onClick={() => handleAddReply(selectedPost.id, comment.id)}
                                disabled={!replyText[`${selectedPost.id}:${comment.id}`]?.trim()}
                                className="text-white"
                                style={{ 
                                  backgroundColor: getPostColor(selectedPost.id, true)
                                }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
                                }}
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <ProfileBubble 
                                  userName={reply.author?.name || 'User'} 
                                  size="sm" 
                                  borderColor={getPostColor(selectedPost.id, true)} 
                                  isAnonymous={reply.is_anonymous}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h6 className="font-medium text-gray-900 text-sm">{reply.author?.name || 'User'}</h6>
                                    {!reply.is_anonymous && reply.author?.year && (
                                      <span className="text-xs text-gray-500">{reply.author.year}</span>
                                    )}
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
                                            backgroundColor: getPostColor(selectedPost.id, true)
                                          }}
                                          onMouseEnter={(e: React.MouseEvent) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                                          }}
                                          onMouseLeave={(e: React.MouseEvent) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                                            backgroundColor: getPostColor(selectedPost.id, true)
                                          }}
                                          onMouseEnter={(e: React.MouseEvent) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id, true)}90`;
                                          }}
                                          onMouseLeave={(e: React.MouseEvent) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id, true);
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
                                      buttonColor={getPostColor(selectedPost.id, true)}
                                    />
                                  )}
                                  <div className="flex items-center gap-3">
                                    <button 
                                      className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                        reply.isLiked ? '' : 'text-gray-600'
                                      }`}
                                      style={{
                                        color: reply.isLiked ? getPostColor(selectedPost.id, true) : undefined
                                      }}
                                      onMouseEnter={(e: React.MouseEvent) => {
                                        if (!reply.isLiked) {
                                          (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id, true);
                                        }
                                      }}
                                      onMouseLeave={(e: React.MouseEvent) => {
                                        if (!reply.isLiked) {
                                          (e.currentTarget as HTMLElement).style.color = '';
                                        }
                                      }}
                                      onClick={() => toggleCommentLike(reply.id)}
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
                                            e.currentTarget.style.color = getPostColor(selectedPost.id, true);
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
  };

  // If in thread view, render thread view
  if (selectedPostThread) {
    return renderThreadView();
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAF5EF' }}>
      {/* Header */}
      <div className="border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Clubs
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex items-start gap-6 flex-1">
              <div 
                className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#F5F1E8' }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10" style={{ color: '#752432' }} />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{club.name}</h1>
                {club.description && (
                  <p className="text-gray-600 mb-4 max-w-3xl">{club.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {club.members} members
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                className="flex items-center gap-2"
                style={{ 
                  backgroundColor: isJoined ? '#3da44b' : '#752432',
                  color: 'white'
                }}
                onClick={handleJoinLeave}
                disabled={isJoining || !user}
                onMouseEnter={(e) => {
                  if (!isJoining && user) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = isJoined ? '#2d7a3a' : '#5a1a26';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isJoining && user) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = isJoined ? '#3da44b' : '#752432';
                  }
                }}
              >
                <Users className="w-4 h-4" />
                {isJoining ? 'Loading...' : isJoined ? 'Joined' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3" style={{ backgroundColor: '#FEFBF6' }}>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Feed Section */}
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
                        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                      </div>
                    ) : (
                      <div className="space-y-4 px-4 py-4 pt-1" style={{ paddingBottom: '40px' }}>
                        {clubPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
                            style={{ 
                              backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id, true) : '#FEFBF6',
                              borderLeftColor: getPostColor(post.id, true)
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
                                    <ProfileBubble 
                                      userName={post.author?.name || 'Club'} 
                                      size="md" 
                                      borderColor={getPostColor(post.id, true)}
                                      isAnonymous={false}
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                          {post.author?.name || 'Club'}
                                        </h4>
                                        <span 
                                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                          style={{ backgroundColor: '#752432' }}
                                        >
                                          Club
                                        </span>
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
                                          backgroundColor: getPostColor(post.id, true)
                                        }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id, true)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id, true);
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
                                          backgroundColor: getPostColor(post.id, true)
                                        }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id, true)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id, true);
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
                                    buttonColor={getPostColor(post.id, true)}
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
                                              const updatedMap = new Map(prev);
                                              updatedMap.set(post.id, url);
                                              return updatedMap;
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
                                            borderColor: isSelected ? getPostColor(post.id, true) : undefined,
                                            backgroundColor: isSelected ? `${getPostColor(post.id, true)}0D` : undefined
                                          }}
                                        >
                                          {hasVoted && (
                                            <div 
                                              className="absolute inset-0 transition-all duration-300"
                                              style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: `${getPostColor(post.id, true)}33`
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
                              <div className="flex items-center justify-start pt-4 mt-1 border-t border-gray-200" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePostLike(post.id);
                                    }}
                                    disabled={likingPosts.has(post.id)}
                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={{
                                      color: post.isLiked ? getPostColor(post.id, true) : '#6B7280'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!post.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = getPostColor(post.id, true);
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
                                            e.currentTarget.style.color = getPostColor(post.id, true);
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
                    {club.mission ? (
                      <p className="text-gray-700 leading-relaxed">{club.mission}</p>
                    ) : club.description ? (
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
                      {club.email && (
                        <div>
                          <div className="font-medium text-gray-900">Email</div>
                          <div className="text-gray-600">{club.email}</div>
                        </div>
                      )}
                      {club.website && (
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

          <TabsContent value="members" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers && boardMembers.length > 0 ? boardMembers.map((member: any) => {
                const memberPictureUrl = memberPictureUrls[member.id];
                return (
                <Card key={member.id} className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F5F1E8' }}>
                        {memberPictureUrl ? (
                          <img 
                            src={memberPictureUrl} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            {member.year && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5" style={{ borderColor: '#752432', color: '#752432' }}>
                                {member.year}
                              </Badge>
                            )}
                          </div>
                          {member.role && (
                            <p className="font-medium text-lg mb-1" style={{ color: '#752432' }}>{member.role}</p>
                          )}
                        </div>
                        {member.bio && (
                          <p className="text-sm text-gray-600 text-center leading-relaxed mb-4">{member.bio}</p>
                        )}
                        {member.email && (
                          <div className="flex justify-center">
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{member.email}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="text-center py-12 text-gray-500 col-span-full">
                  <p>No members listed.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>

              <div className="space-y-4">
                {events && events.length > 0 ? events.map((event: any, index: number) => {
                  const accentColors = ['#0080BD', '#04913A', '#FFBB06', '#F22F21'];
                  const accentColor = accentColors[index % accentColors.length];
                  return (
                    <Card 
                      key={event.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border-none"
                      style={{ backgroundColor: 'white' }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${accentColor}15`, borderRadius: '0.5rem' }}
                          >
                            <Calendar className="w-8 h-8" style={{ color: accentColor }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                            <div className="space-y-1 text-sm text-gray-600 mb-4">
                              {event.date && (
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4" />
                                  {event.date}
                                </div>
                              )}
                              {event.time && (
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4" />
                                  {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-3">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-700 mb-4">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4">
                              <Button 
                                size="sm" 
                                style={{ backgroundColor: accentColor }}
                                className="text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventRSVP(event.id);
                                }}
                                disabled={rsvpLoading[event.id] || !user}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                {rsvpLoading[event.id] ? 'Loading...' : event.attendees} Going
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                style={{
                                  borderColor: eventRsvpStatus[event.id] ? '#3da44b' : undefined,
                                  backgroundColor: eventRsvpStatus[event.id] ? '#3da44b' : undefined,
                                  color: eventRsvpStatus[event.id] ? 'white' : undefined
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventRSVP(event.id);
                                }}
                                disabled={rsvpLoading[event.id] || !user}
                                onMouseEnter={(e) => {
                                  if (!rsvpLoading[event.id] && user) {
                                    if (eventRsvpStatus[event.id]) {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = '#2d7a3a';
                                    }
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!rsvpLoading[event.id] && user) {
                                    if (eventRsvpStatus[event.id]) {
                                      (e.currentTarget as HTMLElement).style.backgroundColor = '#3da44b';
                                    }
                                  }
                                }}
                              >
                                {rsvpLoading[event.id] ? 'Loading...' : eventRsvpStatus[event.id] ? 'Interested ✓' : 'Interested'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No events scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: '#FEFBF6' }}>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="sr-only">
                  View event details including date, time, location, and description
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#752432', borderRadius: '0.5rem' }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Date & Time</div>
                      {selectedEvent.date && (
                        <div className="text-gray-700">{selectedEvent.date}</div>
                      )}
                      {selectedEvent.time && (
                        <div className="text-gray-600">{selectedEvent.time}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: '#752432' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Location</div>
                      {selectedEvent.location ? (
                        <div className="text-gray-700">{selectedEvent.location}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                    >
                      <Users className="w-6 h-6" style={{ color: '#752432' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Attendance</div>
                      <div className="text-gray-700">
                        {selectedEvent.attendees === 1 
                          ? '1 person going' 
                          : `${selectedEvent.attendees} people going`}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.lunchProvided && (
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                      >
                        <Award className="w-6 h-6" style={{ color: '#752432' }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">Refreshments</div>
                        <div className="text-gray-700">Lunch will be provided</div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedEvent.longDescription && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">About This Event</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.longDescription}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    className="flex-1"
                    style={{ 
                      backgroundColor: eventRsvpStatus[selectedEvent.id] ? '#3da44b' : '#752432',
                      color: 'white'
                    }}
                    onClick={() => {
                      handleEventRSVP(selectedEvent.id);
                    }}
                    disabled={rsvpLoading[selectedEvent.id] || !user}
                    onMouseEnter={(e) => {
                      if (!rsvpLoading[selectedEvent.id] && user) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = eventRsvpStatus[selectedEvent.id] ? '#2d7a3a' : '#5a1a26';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!rsvpLoading[selectedEvent.id] && user) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = eventRsvpStatus[selectedEvent.id] ? '#3da44b' : '#752432';
                      }
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {rsvpLoading[selectedEvent.id] ? 'Loading...' : eventRsvpStatus[selectedEvent.id] ? 'RSVPed ✓' : 'RSVP'}
                  </Button>
                </div>
              </div>
            </>
          )}
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
