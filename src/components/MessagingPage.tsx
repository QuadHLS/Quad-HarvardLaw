import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Search,
  Send,
  Hash,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Smile,
  AtSign,
  Users,
  Plus,
  X as XIcon,
  Settings,
  Edit,
  Ban,
  Unlock,
  File as FileIcon,
  Download,
  Check,
  MoreVertical,
  Globe,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface Conversation {
  id: string;
  type: 'dm' | 'group' | 'course' | 'squad';
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageAt?: string; // ISO timestamp for sorting
  unreadCount: number;
  status?: 'online' | 'away' | 'busy' | 'offline';
  participants?: string[];
  icon?: string;
  userId?: string; // For DMs - the other user's ID
}

interface SearchUser {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  created_at: string;
  isCurrentUser: boolean;
  is_edited?: boolean;
  edited_at?: string;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  message_id: string;
  attachment_type: 'image' | 'file';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  thumbnail_url?: string;
  signedUrl?: string; // Cached signed URL for private buckets
}

export function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    dms: true,
    groups: true,
    courses: true,
  });

  // Create group modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupUserSearch, setGroupUserSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [groupSearchLoading, setGroupSearchLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string; full_name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const groupMembersListRef = useRef<HTMLDivElement>(null);
  const groupMembersContainerRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Simple function to set scroll position to bottom
  const setScrollToBottom = useCallback(() => {
    const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
    const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, []);
  
  // Blocking state
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByUser, setBlockedByUser] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  
  // Group management state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([]);
  const [groupParticipants, setGroupParticipants] = useState<SearchUser[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [showGroupMembersList, setShowGroupMembersList] = useState(false);
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  
  // Timestamp reveal state (for two-finger swipe)
  const [showAllTimestamps, setShowAllTimestamps] = useState(false);
  
  // File upload state
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperclipButtonRef = useRef<HTMLButtonElement>(null);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; userName: string; timestamp: number }>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingClearTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Search users for group creation
  const searchUsersForGroup = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGroupSearchResults([]);
      return;
    }

    setGroupSearchLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGroupSearchResults([]);
        setGroupSearchLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .not('full_name', 'is', null)
        .neq('id', user.id)
        .ilike('full_name', `%${query}%`)
        .limit(10)
        .order('full_name');

      // Filter out already selected users client-side
      const filteredData = (data || []).filter((profile: SearchUser) => !selectedUsers.some(u => u.id === profile.id));

      if (error) {
        console.error('Error searching users:', error);
        setGroupSearchResults([]);
      } else {
        setGroupSearchResults(filteredData);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setGroupSearchResults([]);
    } finally {
      setGroupSearchLoading(false);
    }
  }, [selectedUsers]);

  // Search users function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .not('full_name', 'is', null)
        .neq('id', user.id) // Exclude current user
        .ilike('full_name', `%${query}%`)
        .limit(10)
        .order('full_name');

      if (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Search users when searchTerm changes (immediate, no debounce)
  useEffect(() => {
    searchUsers(searchTerm);
  }, [searchTerm, searchUsers]);

  // Search users for group when groupUserSearch changes (immediate, no debounce)
  useEffect(() => {
    searchUsersForGroup(groupUserSearch);
  }, [groupUserSearch, searchUsersForGroup]);

  // Close search results when clicking outside
  const searchContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      // Use 'click' instead of 'mousedown' so button onClick fires first
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSearchResults]);

  // Close group members list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        groupMembersListRef.current &&
        groupMembersContainerRef.current &&
        !groupMembersListRef.current.contains(target) &&
        !groupMembersContainerRef.current.contains(target)
      ) {
        setShowGroupMembersList(false);
      }
    };
    if (showGroupMembersList) {
      // Use a small delay to allow the button click to toggle first
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showGroupMembersList]);

  // Close block menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (blockMenuRef.current && !blockMenuRef.current.contains(event.target as Node)) {
        setShowBlockMenu(false);
      }
    };
    if (showBlockMenu) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showBlockMenu]);

  // Set up presence tracking for online status
  useEffect(() => {
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a global presence channel for all users
      presenceChannel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Track current user as online
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel?.presenceState();
          if (!state) return;
          
          const onlineUserIds = new Set<string>();
          
          // Extract user IDs from presence state
          // State structure: { [key: string]: Array<{ user_id?: string, ... }> }
          Object.values(state).forEach((presences) => {
            const presenceArray = presences as Array<{ user_id?: string }>;
            if (Array.isArray(presenceArray)) {
              presenceArray.forEach((presence) => {
                if (presence?.user_id) {
                  onlineUserIds.add(presence.user_id);
                }
              });
            }
          });
          
          setOnlineUsers(onlineUserIds);
        })
        .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: Array<{ user_id?: string }> }) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            if (Array.isArray(newPresences)) {
              newPresences.forEach((presence: { user_id?: string }) => {
                if (presence?.user_id) {
                  updated.add(presence.user_id);
                }
              });
            }
            return updated;
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: Array<{ user_id?: string }> }) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            if (Array.isArray(leftPresences)) {
              leftPresences.forEach((presence: { user_id?: string }) => {
                if (presence?.user_id) {
                  updated.delete(presence.user_id);
                }
              });
            }
            return updated;
          });
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && presenceChannel) {
            // Track current user as online
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            presenceChannelRef.current = presenceChannel;
          }
        });
    };

    setupPresence();

    // Cleanup function
    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, []);

  // Reset Create Group modal state when it opens
  useEffect(() => {
    if (showCreateGroupModal) {
      setGroupName('');
      setGroupUserSearch('');
      setGroupSearchResults([]);
      setSelectedUsers([]);
    }
  }, [showCreateGroupModal]);

  // Reset Edit Members modal state when it opens
  useEffect(() => {
    if (showEditMembersModal) {
      setGroupMembers([]);
      // fetchGroupInfo will set groupParticipants, so we don't reset that here
    }
  }, [showEditMembersModal]);

  // Refresh group info when Edit Members modal opens
  useEffect(() => {
    if (showEditMembersModal && selectedConversation?.type === 'group' && selectedConversation?.id) {
      fetchGroupInfo(selectedConversation.id);
    }
  }, [showEditMembersModal, selectedConversation?.id]);

  // Handle adding user to group (for create modal)
  const handleAddUserToGroup = (user: SearchUser) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setGroupUserSearch('');
      setGroupSearchResults([]);
    }
  };
  
  // Handle adding user to group (for add members modal)
  const handleAddUserToGroupForExisting = (user: SearchUser) => {
    if (!groupMembers.some(u => u.id === user.id) && !groupParticipants.some(p => p.id === user.id)) {
      setGroupMembers([...groupMembers, user]);
      setGroupUserSearch('');
      setGroupSearchResults([]);
    }
  };

  // Handle removing user from group
  const handleRemoveUserFromGroup = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Handle creating group
  const handleCreateGroup = async () => {
    // Require group name and at least 2 other users (3 total including creator)
    if (!groupName.trim() || selectedUsers.length < 2) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create group conversation using SECURITY DEFINER function to bypass RLS
      const memberIds = selectedUsers.map(u => u.id);
      const { data: convId, error: convError } = await supabase.rpc('create_group_conversation', {
        group_name: groupName.trim(),
        member_user_ids: memberIds
      });

      if (convError) {
        console.error('Error creating group via function:', convError);
        throw convError;
      }
      if (!convId) {
        throw new Error('Failed to create conversation');
      }

      // Fetch the created conversation to get its name
      const { data: newConv, error: fetchError } = await supabase
        .from('conversations')
        .select('id, name, type')
        .eq('id', convId)
        .single();

      if (fetchError) {
        console.error('Error fetching created conversation:', fetchError);
        throw fetchError;
      }
      if (!newConv) {
        throw new Error('Failed to fetch created conversation');
      }

      // Add to conversations list
      const newConversation: Conversation = {
        id: newConv.id,
        type: 'group',
        name: newConv.name || 'Unnamed Group',
        unreadCount: 0,
        participants: [`${selectedUsers.length + 1} members`],
      };

      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(newConversation);

      // Reset modal state
      setShowCreateGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
      setGroupUserSearch('');
      setGroupSearchResults([]);
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error('Failed to create group. Please try again.');
    }
  };

  // Handle clicking on a user from search results
  const handleSelectUser = async (user: SearchUser) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('No current user found');
        return;
      }

      // Check if DM conversation already exists between these two users
      const { data: existingConvs, error: convsError } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'dm');

      if (convsError) {
        console.error('Error fetching existing conversations:', convsError);
        throw convsError;
      }

      let conversationId: string | null = null;

      if (existingConvs && existingConvs.length > 0) {
        // Check each DM conversation to see if both users are participants
        for (const conv of existingConvs) {
          const { data: participants, error: partError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .in('user_id', [currentUser.id, user.id])
            .eq('is_active', true);

          if (partError) {
            console.error('Error checking participants:', partError);
            continue;
          }

          if (participants && participants.length === 2) {
            // Both users are participants - this is the existing DM
            conversationId = conv.id;
            break;
          }
        }
      }

      if (!conversationId) {
        // Create new DM conversation using SECURITY DEFINER function to bypass RLS
        const { data: convId, error: convError } = await supabase.rpc('create_dm_conversation', {
          other_user_id: user.id
        });

        if (convError) {
          console.error('Error creating conversation via function:', convError);
          throw convError;
        }
        if (!convId) {
          throw new Error('Failed to create conversation');
        }
        conversationId = convId;
      }

      if (!conversationId) {
        throw new Error('Failed to get conversation ID');
      }

      // Create conversation object and add to list immediately (for current session)
      const newConversation: Conversation = {
        id: conversationId,
      type: 'dm',
        name: user.full_name,
        unreadCount: 0,
        userId: user.id,
      };

      // Add to conversations list if not already there (shows on left side immediately)
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) {
          // If it exists, update it with the latest info
          return prev.map((c) => (c.id === conversationId ? newConversation : c));
        }
        return [newConversation, ...prev];
      });

      // Select the conversation
      setSelectedConversation(newConversation);
      setSearchTerm('');
      setShowSearchResults(false);
      
      // Ensure DMs section is expanded
      setExpandedSections((prev) => ({ ...prev, dms: true }));
    } catch (err) {
      console.error('Error creating DM:', err);
      toast.error('Failed to create conversation. Please try again.');
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    setMessagesLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessagesLoading(false);
        return;
      }

      // Fetch messages with attachments
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id, 
          sender_id, 
          content, 
          created_at, 
          is_edited, 
          edited_at,
          message_attachments (
            id,
            attachment_type,
            file_name,
            file_path,
            file_size,
            mime_type,
            thumbnail_url
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setMessagesLoading(false);
        return;
      }

      if (!messagesData) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }

      // Fetch sender profiles for all unique sender IDs
      const senderIds = [...new Set(messagesData.map((m: { sender_id: string }) => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);

      const profilesMap = new Map(
        profilesData?.map((p: { id: string; full_name: string; avatar_url?: string }) => [p.id, p]) || []
      );

      // Transform messages and generate signed URLs for attachments
      const transformedMessages: Message[] = await Promise.all(
        messagesData.map(async (msg: { 
          id: string; 
          sender_id: string; 
          content: string | null; 
          created_at: string; 
          is_edited: boolean | null; 
          edited_at: string | null;
          message_attachments?: MessageAttachment[];
        }) => {
          const profile = profilesMap.get(msg.sender_id) as { id: string; full_name: string; avatar_url?: string } | undefined;
          const isCurrentUser = msg.sender_id === user.id;

          // Generate signed URLs for attachments (private buckets require signed URLs)
          const attachmentsWithUrls: MessageAttachment[] = await Promise.all(
            (msg.message_attachments || []).map(async (att: MessageAttachment) => {
              const bucket = att.attachment_type === 'image' ? 'message-images' : 'message-files';
              try {
                const { data, error } = await supabase.storage
                  .from(bucket)
                  .createSignedUrl(att.file_path, 3600); // 1 hour expiry
                
                if (!error && data?.signedUrl) {
                  return { ...att, signedUrl: data.signedUrl };
                }
              } catch (err) {
                console.error('Error creating signed URL:', err);
              }
              return att;
            })
          );

          return {
            id: msg.id,
            senderId: msg.sender_id,
            senderName: profile?.full_name || 'Unknown User',
            senderAvatar: profile?.avatar_url,
            content: msg.content || '',
            timestamp: new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            created_at: msg.created_at,
            isCurrentUser,
            is_edited: msg.is_edited || false,
            edited_at: msg.edited_at || undefined,
            attachments: attachmentsWithUrls,
          };
        })
      );

      setMessages(transformedMessages);
      
      // Scroll position will be set by useLayoutEffect when messages render
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const loadConversationData = async () => {
      if (selectedConversation?.id) {
        fetchMessages(selectedConversation.id);
        
        // Check blocking status for DMs
        if (selectedConversation.type === 'dm' && selectedConversation.userId) {
          checkBlockingStatus(selectedConversation.userId);
        } else {
          setIsBlocked(false);
          setBlockedByUser(false);
        }
        
        // Fetch group info for group chats
        if (selectedConversation.type === 'group') {
          fetchGroupInfo(selectedConversation.id);
        }
        
        // Fetch member count for course and group chats
        if (selectedConversation.type === 'course' || selectedConversation.type === 'group') {
          const { count } = await supabase
            .from('conversation_participants')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', selectedConversation.id)
            .eq('is_active', true);
          
          setMemberCount(count || 0);
        } else {
          setMemberCount(null);
        }
      } else {
        setMessages([]);
        setIsBlocked(false);
        setBlockedByUser(false);
        setMemberCount(null);
      }
    };
    
    loadConversationData();
  }, [selectedConversation?.id, selectedConversation?.type, selectedConversation?.userId, fetchMessages]);
  
  // Simple: Set scroll position to bottom when messages finish loading
  useEffect(() => {
    if (selectedConversation?.id && messages.length > 0 && !messagesLoading) {
      // Set scroll to bottom - try multiple times to ensure it works
      setScrollToBottom();
      setTimeout(() => setScrollToBottom(), 10);
      setTimeout(() => setScrollToBottom(), 50);
      setTimeout(() => setScrollToBottom(), 100);
      setTimeout(() => setScrollToBottom(), 200);
    }
  }, [messages.length, messagesLoading, setScrollToBottom, selectedConversation?.id]);

  // Set initial height for edit textarea when editing starts
  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (editTextareaRef.current) {
          editTextareaRef.current.style.height = 'auto';
          editTextareaRef.current.style.height = `${Math.min(editTextareaRef.current.scrollHeight, 200)}px`;
        }
      }, 10);
    }
  }, [editingMessageId, editMessageContent]);
  
  // Fetch conversations (extracted to reusable function)
  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConversationsLoading(false);
        return;
      }

      // Fetch conversation IDs where user is a participant
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (partError) {
        console.error('Error fetching conversations:', partError);
        setConversationsLoading(false);
        return;
      }

      if (!participants || participants.length === 0) {
        setConversations([]);
        setConversationsLoading(false);
        return;
      }

      const conversationIds = participants.map((p: { conversation_id: string }) => p.conversation_id);

      // Fetch conversation details
      const { data: convsData, error: convsError } = await supabase
        .from('conversations')
        .select('id, type, name, course_id, last_message_at, created_at')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (convsError) {
        console.error('Error fetching conversation details:', convsError);
        setConversationsLoading(false);
        return;
      }

      if (!convsData) {
        setConversations([]);
        setConversationsLoading(false);
        return;
      }

      // Fetch blocked users to filter out blocked DMs
      const { data: blocksData } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      const blockedIds = new Set(blocksData?.map((b: { blocked_id: string }) => b.blocked_id) || []);

      // Fetch last messages and other user info for each conversation
      const convs: Conversation[] = await Promise.all(
        convsData.map(async (conv: { id: string; type: string; name: string | null; course_id: string | null; last_message_at: string | null; created_at: string }) => {
          if (conv.type === 'dm') {
            // Get the other user's info
            const { data: otherPart } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .neq('user_id', user.id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle();

            if (!otherPart) return null;

            // Skip if blocked
            if (blockedIds.has(otherPart.user_id)) {
              return null;
            }

            const { data: otherUser } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', otherPart.user_id)
              .maybeSingle();

            if (!otherUser) return null;

            // Get last message - only show DM if it has messages
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Only return DM if it has at least one message
            if (!lastMessage) return null;

            return {
              id: conv.id,
              type: 'dm' as const,
              name: otherUser.full_name || 'Unknown User',
              lastMessage: lastMessage.content,
              lastMessageTime: new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              lastMessageAt: lastMessage.created_at,
              unreadCount: 0,
              userId: otherUser.id,
            };
          }

          // For group and course conversations
          // Fetch last message for display
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: conv.id,
            type: conv.type as 'group' | 'course',
            name: conv.name || 'Unnamed',
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            lastMessageAt: lastMessage?.created_at || conv.last_message_at || undefined,
            unreadCount: 0,
          };
        })
      );

      const filteredConvs = convs.filter((c): c is Conversation => c !== null);
      setConversations(filteredConvs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Check blocking status
  const checkBlockingStatus = async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if current user blocked the other user
      const { data: blocked } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', otherUserId)
        .maybeSingle();
      
      // Check if other user blocked current user
      const { data: blockedBy } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', otherUserId)
        .eq('blocked_id', user.id)
        .maybeSingle();
      
      setIsBlocked(!!blocked);
      setBlockedByUser(!!blockedBy);
    } catch (err) {
      console.error('Error checking blocking status:', err);
    }
  };
  
  // Block user
  const handleBlockUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });
      
      if (error) throw error;
      
      setIsBlocked(true);
      toast.success('User blocked');
      
      // Refresh blocking status to ensure state is up to date
      await checkBlockingStatus(userId);
      
      // Refresh conversations to hide blocked DM (without page reload)
      await fetchConversations();
    } catch (err) {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user');
    }
  };
  
  // Unblock user
  const handleUnblockUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);
      
      if (error) throw error;
      
      setIsBlocked(false);
      toast.success('User unblocked');
      
      // Refresh blocking status to ensure state is up to date
      await checkBlockingStatus(userId);
      
      // Refresh conversations (without page reload)
      await fetchConversations();
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error('Failed to unblock user');
    }
  };
  
  // Fetch group info
  const fetchGroupInfo = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch conversation details
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id, name, created_by')
        .eq('id', conversationId)
        .single();
      
      // If conversation doesn't exist (was deleted), clear state and return
      if (convError || !conv) {
        setSelectedConversation(null);
        setShowEditMembersModal(false);
        setShowGroupSettings(false);
        return;
      }
      
      if (conv) {
        setEditGroupName(conv.name || '');
      }
      
      // Fetch participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, is_active')
        .eq('conversation_id', conversationId)
        .eq('is_active', true);
      
      if (participants) {
        const userIds = participants.map((p: { user_id: string }) => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          setGroupParticipants(profiles.map((p: { id: string; full_name: string; avatar_url?: string }) => ({
            id: p.id,
            full_name: p.full_name || 'Unknown',
            avatar_url: p.avatar_url,
          })));
          setMemberCount(participants.length);
        }
      }
    } catch (err) {
      console.error('Error fetching group info:', err);
      // If error fetching, clear state
      setSelectedConversation(null);
      setShowEditMembersModal(false);
      setShowGroupSettings(false);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload: { new: { id: string; sender_id: string; content: string | null; created_at: string; is_edited: boolean | null; edited_at: string | null } }) => {
          const newMessage = payload.new;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .maybeSingle();

          // Fetch attachments and generate signed URLs
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('id, attachment_type, file_name, file_path, file_size, mime_type, thumbnail_url')
            .eq('message_id', newMessage.id);

          // Generate signed URLs for attachments
          const attachmentsWithUrls: MessageAttachment[] = await Promise.all(
            (attachments || []).map(async (att: MessageAttachment) => {
              const bucket = att.attachment_type === 'image' ? 'message-images' : 'message-files';
              try {
                const { data, error } = await supabase.storage
                  .from(bucket)
                  .createSignedUrl(att.file_path, 3600); // 1 hour expiry
                
                if (!error && data?.signedUrl) {
                  return { ...att, signedUrl: data.signedUrl };
                }
              } catch (err) {
                console.error('Error creating signed URL:', err);
              }
              return att;
            })
          );

          const { data: { user } } = await supabase.auth.getUser();
          const isCurrentUser = newMessage.sender_id === user?.id;

          const transformedMessage: Message = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            senderName: profile?.full_name || 'Unknown User',
            senderAvatar: profile?.avatar_url,
            content: newMessage.content || '',
            timestamp: new Date(newMessage.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            created_at: newMessage.created_at,
            isCurrentUser,
            is_edited: newMessage.is_edited || false,
            edited_at: newMessage.edited_at || undefined,
            attachments: attachmentsWithUrls,
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === transformedMessage.id)) {
              return prev;
            }
            const updated = [...prev, transformedMessage];
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
              const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
              if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
              } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload: { new: { id: string; sender_id: string; content: string | null; created_at: string; is_edited: boolean | null; edited_at: string | null; deleted_at: string | null } }) => {
          const updatedMessage = payload.new;

          // If message was soft-deleted, remove it from UI
          if (updatedMessage.deleted_at) {
            setMessages((prev) => prev.filter((m) => m.id !== updatedMessage.id));
            return;
          }

          // Fetch attachments for the updated message
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('id, attachment_type, file_name, file_path, file_size, mime_type, thumbnail_url')
            .eq('message_id', updatedMessage.id);

          // Generate signed URLs for attachments
          const attachmentsWithUrls: MessageAttachment[] = await Promise.all(
            (attachments || []).map(async (att: MessageAttachment) => {
              const bucket = att.attachment_type === 'image' ? 'message-images' : 'message-files';
              try {
                const { data, error } = await supabase.storage
                  .from(bucket)
                  .createSignedUrl(att.file_path, 3600);
                
                if (!error && data?.signedUrl) {
                  return { ...att, signedUrl: data.signedUrl };
                }
              } catch (err) {
                console.error('Error creating signed URL:', err);
              }
              return att;
            })
          );

          // Update the message in the UI
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id
                ? {
                    ...m,
                    content: updatedMessage.content || '',
                    is_edited: updatedMessage.is_edited || false,
                    edited_at: updatedMessage.edited_at || undefined,
                    attachments: attachmentsWithUrls,
                  }
                : m
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload: { old: { id: string } }) => {
          // Remove deleted message from UI (hard delete - undo send)
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('Realtime subscription timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Typing indicator: Setup channel and listen for typing events
  useEffect(() => {
    if (!selectedConversation?.id) {
      setTypingUsers(new Map());
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupTypingSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create channel for typing events (use same channel for sending and receiving)
      channel = supabase
        .channel(`typing:${selectedConversation.id}`, {
          config: {
            broadcast: { self: false } // Don't receive our own typing events
          }
        })
        .on('broadcast', { event: 'typing' }, (payload: { payload: { userId: string; userName: string; conversationId: string } }) => {
          const { userId, userName, conversationId } = payload.payload;
          
          // Verify this event is for the current conversation
          if (conversationId !== selectedConversation.id) return;
          
          // Don't show typing indicator for current user
          if (userId === user.id) return;

          // Clear any existing timeout for this user
          const existingTimeout = typingClearTimeoutsRef.current.get(userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingClearTimeoutsRef.current.delete(userId);
          }

          // Update typing users map
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              userId,
              userName,
              timestamp: Date.now(),
            });
            return newMap;
          });

          // Clear typing indicator after 3 seconds of no updates
          // This timeout will be cleared if a new typing event comes in
          const timeoutId = setTimeout(() => {
            setTypingUsers((prev) => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
            typingClearTimeoutsRef.current.delete(userId);
          }, 3000) as unknown as NodeJS.Timeout;
          
          typingClearTimeoutsRef.current.set(userId, timeoutId);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            typingChannelRef.current = channel;
          }
        });
    };

    setupTypingSubscription();

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      // Clear all typing timeouts
      typingClearTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      typingClearTimeoutsRef.current.clear();
      setTypingUsers(new Map());
    };
  }, [selectedConversation?.id]);

  // Typing indicator: Send typing events (debounced)
  useEffect(() => {
    if (!selectedConversation?.id) {
      // Clear timeout when no conversation is selected
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    const sendTypingEvent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the existing channel or create a temporary one
      // Supabase allows sending before subscription (uses HTTP)
      const channel = typingChannelRef.current || supabase.channel(`typing:${selectedConversation.id}`, {
        config: {
          broadcast: { self: false }
        }
      });

      // Send typing event via broadcast (works even if not subscribed - uses HTTP)
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          userName: currentUserProfile?.full_name || 'You',
          conversationId: selectedConversation.id,
        },
      });

      // Clean up temporary channel if we created one
      if (channel !== typingChannelRef.current) {
        supabase.removeChannel(channel);
      }
    };

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Only send typing event if input is not empty
    if (messageInput.trim()) {
      // Send typing event immediately when user types
      sendTypingEvent();
      
      // Set timeout to stop sending after 2 seconds of no typing
      // If user types again within 2 seconds, this timeout will be cleared and reset
      typingTimeoutRef.current = setTimeout(() => {
        // Timeout expired - user stopped typing
        // No need to send a "stopped typing" event, the receiving side will clear after 3 seconds
        typingTimeoutRef.current = null;
      }, 2000) as unknown as NodeJS.Timeout;
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [messageInput, selectedConversation?.id, currentUserProfile]);

  const toggleSection = (section: 'dms' | 'groups' | 'courses') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    
    // If files are selected, upload them
    if (selectedFiles.length > 0) {
      await handleUploadFiles();
      // If there's also text, continue to send it below
      if (!messageInput.trim()) {
        return; // Only files, no text to send
      }
    }
    
    // If no files and no text, return
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    // Check if user is blocked (only for DMs) - check both directions
    if (selectedConversation.type === 'dm' && selectedConversation.userId) {
      // Re-check blocking status before sending to ensure it's up to date
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if current user blocked the other user
        const { data: iBlockedThem } = await supabase
          .from('user_blocks')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', selectedConversation.userId)
          .maybeSingle();

        // Check if other user blocked current user
        const { data: theyBlockedMe } = await supabase
          .from('user_blocks')
          .select('id')
          .eq('blocker_id', selectedConversation.userId)
          .eq('blocked_id', user.id)
          .maybeSingle();

        if (theyBlockedMe) {
          toast.error('This user has blocked you');
          return;
        }
        if (iBlockedThem) {
          toast.error('You have blocked this user');
          return;
        }
      }
    }

    // Preserve all newlines - don't trim as it might affect newline preservation
    // Only check if content is not empty
    const content = messageInput;
    setMessageInput('');
    // Reset textarea height after sending
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }
    // Clear typing indicator timeout when sending message
    if (typingTimeoutRef.current) {
      clearInterval(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setSendingMessage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSendingMessage(false);
        return;
      }

      // Check if message starts with a URL
      const urlCheck = startsWithUrl(content);
      
      if (urlCheck.isUrl && urlCheck.url) {
        // Send the URL as a separate message first
        const { data: linkMessage, error: linkError } = await supabase
          .from('messages')
          .insert({
            conversation_id: selectedConversation.id,
            sender_id: user.id,
            content: urlCheck.url,
            message_type: 'text',
          })
          .select('id, sender_id, content, created_at, is_edited, edited_at')
          .single();

        if (linkError) {
          console.error('Error sending link message:', linkError);
          setMessageInput(content);
          setSendingMessage(false);
          return;
        }

        // Fetch sender profile for link message
        const { data: linkProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        // Add link message to local state optimistically
        if (linkMessage && linkProfile) {
          const optimisticLinkMessage: Message = {
            id: linkMessage.id,
            senderId: linkMessage.sender_id,
            senderName: linkProfile.full_name || 'You',
            senderAvatar: linkProfile.avatar_url,
            content: linkMessage.content,
            timestamp: new Date(linkMessage.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            created_at: linkMessage.created_at,
            isCurrentUser: true,
            is_edited: linkMessage.is_edited,
            edited_at: linkMessage.edited_at,
            attachments: [],
          };

          setMessages((prev) => {
            const updated = [...prev, optimisticLinkMessage];
            // Scroll to bottom after sending
            setTimeout(() => {
              const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
              const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
              if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
              } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
            return updated;
          });
        }

        // If there's remaining text after the URL, send it as a separate message
        if (urlCheck.remainingText) {
          // Determine message type for remaining text
          let messageType: 'text' | 'emoji' | 'image' | 'file' | 'mixed' = 'text';
          const emojiRegex = /^[\p{Emoji}\s]+$/u;
          if (emojiRegex.test(urlCheck.remainingText)) {
            messageType = 'emoji';
          }

          const { data: textMessage, error: textError } = await supabase
            .from('messages')
            .insert({
              conversation_id: selectedConversation.id,
              sender_id: user.id,
              content: urlCheck.remainingText,
              message_type: messageType,
            })
            .select('id, sender_id, content, created_at, is_edited, edited_at')
            .single();

          if (textError) {
            console.error('Error sending text message:', textError);
            setSendingMessage(false);
            return;
          }

          // Fetch sender profile for text message
          const { data: textProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          // Add text message to local state optimistically
          if (textMessage && textProfile) {
            const optimisticTextMessage: Message = {
              id: textMessage.id,
              senderId: textMessage.sender_id,
              senderName: textProfile.full_name || 'You',
              senderAvatar: textProfile.avatar_url,
              content: textMessage.content,
              timestamp: new Date(textMessage.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              created_at: textMessage.created_at,
              isCurrentUser: true,
              is_edited: textMessage.is_edited,
              edited_at: textMessage.edited_at,
              attachments: [],
            };

            setMessages((prev) => {
              const updated = [...prev, optimisticTextMessage];
              // Scroll to bottom after sending
              setTimeout(() => {
                const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
                const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
                if (viewport) {
                  viewport.scrollTop = viewport.scrollHeight;
                } else {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
              return updated;
            });
          }
        }

        setSendingMessage(false);
        return;
      }

      // Normal message sending (no URL at start)
      // Determine message type based on content
      let messageType: 'text' | 'emoji' | 'image' | 'file' | 'mixed' = 'text';
      
      // Simple emoji detection (if message is only emojis)
      const emojiRegex = /^[\p{Emoji}\s]+$/u;
      if (emojiRegex.test(content)) {
        messageType = 'emoji';
      }

      // Insert message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: content,
          message_type: messageType,
        })
        .select('id, sender_id, content, created_at, is_edited, edited_at')
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        // Restore message input on error
        setMessageInput(content);
        setSendingMessage(false);
        return;
      }

      if (!newMessage) {
        console.error('Error: Message was not created');
        // Restore message input on error
        setMessageInput(content);
        setSendingMessage(false);
        return;
      }

      // Fetch sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      // Add message to local state immediately for optimistic update
      if (newMessage) {
        const transformedMessage: Message = {
          id: newMessage.id,
          senderId: newMessage.sender_id,
          senderName: profile?.full_name || currentUserProfile?.full_name || 'You',
          senderAvatar: profile?.avatar_url,
          content: newMessage.content || '',
          timestamp: new Date(newMessage.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          created_at: newMessage.created_at,
          isCurrentUser: true,
          is_edited: false,
        };

        setMessages((prev) => {
          const updated = [...prev, transformedMessage];
          // Scroll to bottom after sending
          setTimeout(() => {
            const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
            const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight;
            } else {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
          return updated;
        });

        // Refresh conversations list after a short delay to allow trigger to update last_message_at
        // The existing fetchConversations useEffect will handle this automatically
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore message input on error
      setMessageInput(content);
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Group management functions
  const handleEditGroupName = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group' || !editGroupName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ name: editGroupName.trim() })
        .eq('id', selectedConversation.id);
      
      if (error) throw error;
      
      setSelectedConversation({ ...selectedConversation, name: editGroupName.trim() });
      setShowEditGroupModal(false);
      
      // Refresh conversations list without reload
      await fetchConversations();
    } catch (err) {
      console.error('Error editing group name:', err);
    }
  };
  
  const handleAddMembersToGroup = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group' || groupMembers.length === 0) return;
    
    try {
      // Use RPC function to add members (bypasses RLS recursion issues)
      const memberIds = groupMembers.map(user => user.id);
      const { error } = await supabase.rpc('add_members_to_group', {
        conv_id: selectedConversation.id,
        member_user_ids: memberIds
      });
      
      if (error) {
        console.error('Error adding members:', error);
        toast.error(error.message || 'Failed to add members. You may not have permission.');
        return;
      }
      
      toast.success(`${groupMembers.length} ${groupMembers.length === 1 ? 'member' : 'members'} added successfully`);
      setGroupMembers([]);
      setShowAddMembersModal(false);
      fetchGroupInfo(selectedConversation.id);
    } catch (err: any) {
      console.error('Error adding members:', err);
      toast.error(err.message || 'Failed to add members');
    }
  };
  
  const handleRemoveMemberFromGroup = async (userId: string) => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    
    try {
      // Use RPC function to remove member (bypasses RLS recursion issues)
      const { error } = await supabase.rpc('remove_member_from_group', {
        conv_id: selectedConversation.id,
        member_user_id: userId
      });
      
      if (error) {
        console.error('Error removing member:', error);
        toast.error(error.message || 'Failed to remove member. You may not have permission.');
        return;
      }
      
      toast.success('Member removed successfully');
      
      // Check if conversation still exists (might have been auto-deleted if < 3 members)
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', selectedConversation.id)
        .single();
      
      if (convError || !conv) {
        // Group was auto-deleted (had < 3 members)
        // Remove from conversations list
        setConversations((prev) => prev.filter((c) => c.id !== selectedConversation.id));
        setSelectedConversation(null);
        setShowEditMembersModal(false);
        setShowGroupSettings(false);
        toast.info('Group was deleted (less than 3 members)');
        return;
      }
      
      // Group still exists, refresh info
      fetchGroupInfo(selectedConversation.id);
    } catch (err: any) {
      console.error('Error removing member:', err);
      toast.error(err.message || 'Failed to remove member');
    }
  };
  
  const handleLeaveGroup = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    
    try {
      // Use RPC function to leave group (bypasses RLS recursion issues)
      const { error } = await supabase.rpc('leave_group_conversation', {
        conv_id: selectedConversation.id
      });
      
      if (error) {
        console.error('Error leaving group:', error);
        toast.error(error.message || 'Failed to leave group');
        return;
      }
      
      toast.success('Left group successfully');
      
      // Check if conversation still exists (might have been auto-deleted if < 3 members)
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', selectedConversation.id)
        .single();
      
      if (convError || !conv) {
        // Group was auto-deleted (had < 3 members)
        // Remove from conversations list
        setConversations((prev) => prev.filter((c) => c.id !== selectedConversation.id));
        toast.info('Group was deleted (less than 3 members)');
      }
      
      setSelectedConversation(null);
      setShowEditMembersModal(false);
      setShowGroupSettings(false);
      // Don't reload page, just clear the conversation
    } catch (err: any) {
      console.error('Error leaving group:', err);
      toast.error(err.message || 'Failed to leave group');
    }
  };
  
  // File upload functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Append new files to existing selected files instead of replacing
    setSelectedFiles((prev) => [...prev, ...files]);
    // Reset the input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Blur the paperclip button to prevent Enter key from triggering it
    if (paperclipButtonRef.current) {
      paperclipButtonRef.current.blur();
    }
    // Focus the message input so Enter key will send the file
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };
  
  const handleUploadFiles = async () => {
    if (!selectedConversation || selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      // Upload files and create messages in order
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        // Add small delay between files to ensure proper ordering (10ms per file)
        const timestamp = Date.now() + (i * 10);
        const fileName = `${user.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const isImage = file.type.startsWith('image/');
        const bucket = isImage ? 'message-images' : 'message-files';
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Create message
        const messageType = isImage ? 'image' : 'file';
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: selectedConversation.id,
            sender_id: user.id,
            content: file.name,
            message_type: messageType,
          })
          .select('id, sender_id, content, created_at, is_edited, edited_at')
          .single();
        
        if (messageError) throw messageError;
        
        // Create attachment record
        const { data: attachment, error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: message.id,
            attachment_type: isImage ? 'image' : 'file',
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
          })
          .select('id, attachment_type, file_name, file_path, file_size, mime_type, thumbnail_url')
          .single();
        
        if (attachmentError) throw attachmentError;
        
        // Get signed URL for attachment
        let signedUrl: string | undefined;
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(fileName, 3600); // 1 hour expiry
          
          if (!signedUrlError && signedUrlData?.signedUrl) {
            signedUrl = signedUrlData.signedUrl;
          }
        } catch (err) {
          console.error('Error creating signed URL:', err);
        }
        
        // Add message to local state immediately for optimistic update
        const transformedMessage: Message = {
          id: message.id,
          senderId: message.sender_id,
          senderName: profile?.full_name || currentUserProfile?.full_name || 'You',
          senderAvatar: profile?.avatar_url,
          content: message.content || '',
          timestamp: new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          created_at: message.created_at,
          isCurrentUser: true,
          is_edited: false,
          attachments: attachment ? [{
            ...attachment,
            signedUrl: signedUrl,
          }] : [],
        };
        
        setMessages((prev) => {
          const updated = [...prev, transformedMessage];
          // Scroll to bottom after sending (only for the last file)
          if (i === selectedFiles.length - 1) {
            setTimeout(() => {
              const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
              const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
              if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
              } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }
          return updated;
          });
      }
      
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(false);
    }
  };
  
  // Message editing functions
  const handleStartEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditMessageContent(message.content);
  };
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent('');
  };
  
  const handleSaveEdit = async () => {
    // Check if message has any non-whitespace content (preserving newlines)
    if (!editingMessageId || !editMessageContent || !editMessageContent.trim()) return;
    
    try {
      const { data, error } = await supabase.rpc('edit_message', {
        message_uuid: editingMessageId,
        new_content: editMessageContent, // Preserve newlines, don't trim
        attachment_ids_to_keep: [],
      });
      
      if (error) throw error;
      
      if (data?.success) {
        // Delete files from storage if any
        if (data.deleted_file_paths && data.deleted_file_paths.length > 0) {
          for (const filePath of data.deleted_file_paths) {
            // file_path from database is already the full path (user_id/filename)
            // Determine bucket from file extension
            const isImage = filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const bucket = isImage ? 'message-images' : 'message-files';
            
            try {
              await supabase.storage
                .from(bucket)
                .remove([filePath]);
            } catch (storageError) {
              console.error('Error deleting file from storage:', storageError);
              // Continue even if storage deletion fails
            }
          }
        }
        
        // Update message in local state instead of reloading
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessageId
              ? {
                  ...m,
                  content: editMessageContent, // Preserve newlines, don't trim
                  is_edited: true,
                  edited_at: new Date().toISOString(),
                  // Remove attachments if they were deleted (attachment_ids_to_keep is empty)
                  attachments: [],
                }
              : m
          )
        );
        
        setEditingMessageId(null);
        setEditMessageContent('');
        toast.success('Message edited');
      }
    } catch (err) {
      console.error('Error editing message:', err);
      toast.error('Failed to edit message');
    }
  };
  
  // Undo send function (Delete message)
  const handleUndoSend = async (messageId: string) => {
    try {
      // Get message attachments before deleting
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        console.error('Message not found');
        return;
      }
      
      const attachments = message?.attachments || [];
      
      const { data, error } = await supabase.rpc('undo_send_message', {
        message_uuid: messageId,
      });
      
      if (error) {
        console.error('Error calling undo_send_message:', error);
        toast.error('Failed to delete message');
        throw error;
      }
      
      if (data) {
        // Delete attachments from storage
        for (const att of attachments) {
          const bucket = att.attachment_type === 'image' ? 'message-images' : 'message-files';
          try {
            await supabase.storage
              .from(bucket)
              .remove([att.file_path]);
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue even if storage deletion fails
          }
        }
        
        // Remove message from UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success('Message deleted');
      } else {
        // Function returned false - message might be outside time window or not found
        toast.error('Unable to delete message. It may be outside the 2-minute window.');
      }
    } catch (err) {
      console.error('Error undoing send:', err);
      toast.error('Failed to delete message');
    }
  };
  
  // Check if message can be deleted (within 2 minutes)
  const canDeleteMessage = (createdAt: string): boolean => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    return (now - created) / 1000 <= 120; // 2 minutes
  };

  // Check if message can be edited (within 10 minutes)
  const canEditMessage = (createdAt: string): boolean => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    return (now - created) / 1000 <= 600; // 10 minutes
  };

  // Fetch current user profile on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUserProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch existing conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('conversations-updates', {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
          },
          async (payload: { new: { id: string; last_message_at: string | null } }) => {
            // When last_message_at is updated, refresh conversations list
            if (payload.new.last_message_at) {
              await fetchConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
          },
          async (payload: { new: { id: string } }) => {
            // When a new conversation is created, check if current user is a participant
            const { data: participant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', payload.new.id)
              .eq('user_id', user.id)
              .eq('is_active', true)
              .maybeSingle();
            
            if (participant) {
              // Current user is a participant, refresh conversations list
              await fetchConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_participants',
          },
          async (payload: { new: { user_id: string; is_active: boolean } }) => {
            // When a user is added to a conversation, refresh if it's the current user
            if (payload.new.user_id === user.id && payload.new.is_active) {
              await fetchConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
          },
          async (payload: { new: { user_id: string }; old?: { user_id: string } }) => {
            // When a participant's status changes (e.g., left conversation)
            if (payload.new.user_id === user.id || payload.old?.user_id === user.id) {
              await fetchConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'conversation_participants',
          },
          async (payload: { old: { user_id: string } }) => {
            // When a participant is removed (hard delete), refresh if it's the current user
            if (payload.old.user_id === user.id) {
              await fetchConversations();
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime conversations channel error:', err);
          } else if (status === 'TIMED_OUT') {
            console.error('Realtime conversations subscription timed out');
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchConversations]);

  // Subscribe to real-time user_blocks changes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('user-blocks-updates', {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_blocks',
          },
          async (payload: { new: { blocker_id: string; blocked_id: string } }) => {
            // When a block is created, refresh conversations if it affects the current user
            if (payload.new.blocker_id === user.id || payload.new.blocked_id === user.id) {
              await fetchConversations();
              
              // If viewing a DM with the blocked/blocker user, refresh blocking status
              const currentConv = selectedConversation;
              if (currentConv?.type === 'dm' && currentConv?.userId) {
                if (currentConv.userId === payload.new.blocked_id || 
                    currentConv.userId === payload.new.blocker_id) {
                  // Refresh blocking status for the current conversation
                  const { data: iBlockedThem } = await supabase
                    .from('user_blocks')
                    .select('id')
                    .eq('blocker_id', user.id)
                    .eq('blocked_id', currentConv.userId)
                    .maybeSingle();
                  
                  const { data: theyBlockedMe } = await supabase
                    .from('user_blocks')
                    .select('id')
                    .eq('blocker_id', currentConv.userId)
                    .eq('blocked_id', user.id)
                    .maybeSingle();
                  
                  setIsBlocked(!!iBlockedThem);
                  setBlockedByUser(!!theyBlockedMe);
                }
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'user_blocks',
          },
          async (payload: { old: { blocker_id: string; blocked_id: string } }) => {
            // When a block is removed (unblock), refresh conversations if it affects the current user
            if (payload.old.blocker_id === user.id || payload.old.blocked_id === user.id) {
              await fetchConversations();
              
              // If viewing a DM with the unblocked user, refresh blocking status
              const currentConv = selectedConversation;
              if (currentConv?.type === 'dm' && currentConv?.userId) {
                if (currentConv.userId === payload.old.blocked_id || 
                    currentConv.userId === payload.old.blocker_id) {
                  // Refresh blocking status for the current conversation
                  const { data: iBlockedThem } = await supabase
                    .from('user_blocks')
                    .select('id')
                    .eq('blocker_id', user.id)
                    .eq('blocked_id', currentConv.userId)
                    .maybeSingle();
                  
                  const { data: theyBlockedMe } = await supabase
                    .from('user_blocks')
                    .select('id')
                    .eq('blocker_id', currentConv.userId)
                    .eq('blocked_id', user.id)
                    .maybeSingle();
                  
                  setIsBlocked(!!iBlockedThem);
                  setBlockedByUser(!!theyBlockedMe);
                }
              }
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime user_blocks channel error:', err);
          } else if (status === 'TIMED_OUT') {
            console.error('Realtime user_blocks subscription timed out');
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchConversations, selectedConversation]);

  // Auto-select the most recent conversation when conversations are loaded
  useEffect(() => {
    // Only auto-select if no conversation is currently selected
    if (selectedConversation || conversations.length === 0) return;

    // Priority: DMs first, then groups (exclude course messages)
    const dms = conversations.filter(c => c.type === 'dm');
    const groups = conversations.filter(c => c.type === 'group');
    
    let mostRecentConv: Conversation | null = null;
    
    if (dms.length > 0) {
      // Sort DMs by last message timestamp (most recent first)
      const sortedDMs = [...dms].sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });
      mostRecentConv = sortedDMs[0];
    } else if (groups.length > 0) {
      // Sort groups by last message timestamp (most recent first)
      const sortedGroups = [...groups].sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });
      mostRecentConv = sortedGroups[0];
    }
    
    // Auto-select the most recent conversation
    if (mostRecentConv) {
      setSelectedConversation(mostRecentConv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]); // Only depend on conversations, not selectedConversation to avoid loops

  const getDMs = () => conversations.filter((c) => c.type === 'dm');
  const getGroups = () => conversations.filter((c) => c.type === 'group');
  const getCourses = () => conversations.filter((c) => c.type === 'course');
  
  // Check if user has any DMs or groups (excluding course messages)
  const hasDMsOrGroups = getDMs().length > 0 || getGroups().length > 0;

  // Helper function to truncate names to 28 characters
  const truncateName = (name: string): string => {
    if (!name) return '';
    if (name.length <= 28) return name;
    return name.substring(0, 28) + '...';
  };

  const truncateFileName = (fileName: string): string => {
    if (!fileName) return '';
    if (fileName.length <= 80) return fileName;
    return fileName.substring(0, 80) + '...';
  };

  // Format file name for iMessage-style display: max 3 lines, 40 chars per line
  const formatFileNameForDisplay = (fileName: string): string[] => {
    if (!fileName) return [''];
    const maxLines = 3;
    const charsPerLine = 40;
    const lines: string[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const start = i * charsPerLine;
      const end = start + charsPerLine;
      if (start >= fileName.length) break;
      
      const line = fileName.substring(start, end);
      if (i === maxLines - 1 && fileName.length > end) {
        // Last line, add ellipsis if there's more
        lines.push(line.substring(0, charsPerLine - 3) + '...');
      } else {
        lines.push(line);
      }
    }
    
    return lines.length > 0 ? lines : [fileName];
  };

  // Get file type from mime_type or file extension
  const getFileType = (mimeType?: string, fileName?: string): string => {
    if (mimeType) {
      if (mimeType.startsWith('application/pdf')) return 'PDF Document';
      if (mimeType.startsWith('image/')) return 'Image';
      if (mimeType.startsWith('video/')) return 'Video';
      if (mimeType.startsWith('audio/')) return 'Audio';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel Spreadsheet';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint';
      if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive';
      if (mimeType.includes('text')) return 'Text Document';
    }
    
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return 'PDF Document';
      if (['doc', 'docx'].includes(ext || '')) return 'Word Document';
      if (['xls', 'xlsx'].includes(ext || '')) return 'Excel Spreadsheet';
      if (['ppt', 'pptx'].includes(ext || '')) return 'PowerPoint';
      if (['zip', 'rar', '7z'].includes(ext || '')) return 'Archive';
      if (['txt'].includes(ext || '')) return 'Text Document';
    }
    
    return 'Document';
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      let cleanUrl = url;
      if (url.startsWith('www.')) {
        cleanUrl = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        cleanUrl = 'https://' + url;
      }
      const urlObj = new URL(cleanUrl);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
      return match ? match[1] : url;
    }
  };

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
    if (trimmedUrl.includes('tiktok.com') || trimmedUrl.includes('vm.tiktok.com')) {
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

  // Format date like iMessage: "Today 12:29 PM", "Tuesday 12:29 PM", or "Sun, Nov 30 at 9:00 PM"
  // Returns JSX with bold text before time (except "at")
  const formatDayTimestamp = (dateString: string): React.ReactNode => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Get start of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Get start of the message's day
    const messageDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate days difference
    const daysDiff = Math.floor((todayStart.getTime() - messageDayStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Format time
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    
    if (daysDiff === 0) {
      // Today
      return <><span className="font-semibold">Today</span> {timeStr}</>;
    } else if (daysDiff === 1) {
      // Yesterday
      return <><span className="font-semibold">Yesterday</span> {timeStr}</>;
    } else if (daysDiff < 7) {
      // This week - show day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return <><span className="font-semibold">{dayNames[date.getDay()]}</span> {timeStr}</>;
    } else {
      // Older - show "Sun, Nov 30 at 9:00 PM"
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const datePart = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
      return <><span className="font-semibold">{datePart}</span> at {timeStr}</>;
    }
  };

  // Check if text starts with a URL
  const startsWithUrl = (text: string): { isUrl: boolean; url?: string; remainingText?: string } => {
    if (!text || !text.trim()) return { isUrl: false };
    
    const trimmed = text.trim();
    // URL regex pattern - matches http, https, www, and common domains at start
    // Stop at commas, semicolons, and other punctuation that aren't valid in URLs
    const urlRegex = /^(https?:\/\/[^\s,;.]+(?:\.[^\s,;.]+)*(?:\/[^\s,;]*)?|www\.[^\s,;.]+(?:\.[^\s,;.]+)*(?:\/[^\s,;]*)?|[a-zA-Z0-9-]+\.[a-zA-Z]{3,}(?:\/[^\s,;]*)?(?:\?[^\s,;]*)?(?:#[^\s,;]*)?)/;
    const match = trimmed.match(urlRegex);
    
    if (match) {
      let url = match[0];
      // Add https:// if it starts with www. or doesn't have protocol
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Validate that it's actually a valid URL and has a valid hostname
      try {
        const urlObj = new URL(url);
        // Check if hostname looks like a real domain (has at least one dot and valid TLD)
        const hostname = urlObj.hostname;
        if (!hostname.includes('.') || hostname.split('.').pop()!.length < 2) {
          return { isUrl: false };
        }
        // Reject if hostname has invalid characters or looks like random text
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(hostname)) {
          return { isUrl: false };
        }
        const remainingText = trimmed.substring(match[0].length).trim();
        return { isUrl: true, url: match[0], remainingText: remainingText || undefined };
      } catch {
        // Not a valid URL, return false
        return { isUrl: false };
      }
    }
    
    return { isUrl: false };
  };

  // Convert URLs in text to clickable links
  // If link is at start (separate message), show as card. Otherwise, show as underlined text.
  const linkifyText = (text: string, isCurrentUser: boolean, isLinkOnlyMessage: boolean = false): React.ReactNode[] => {
    if (!text) return [];
    
    // If this is a link-only message, check if it's a YouTube/video link
    if (isLinkOnlyMessage) {
      let url = text.trim();
      // Add https:// if it starts with www. or doesn't have protocol
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Check if it's a YouTube/video link
      const embedData = getVideoEmbedUrl(url);
      if (embedData && embedData.platform === 'youtube') {
        // Render YouTube iframe with original aspect ratio
        return [
          <div
            key="youtube-embed"
            className="relative w-full"
            style={{ maxWidth: '800px' }}
          >
            <div className="relative overflow-hidden rounded-lg">
              <iframe
                src={embedData.embedUrl}
                title="YouTube video player"
                frameBorder="0"
                scrolling="no"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full rounded-lg"
                style={{ 
                  border: 'none', 
                  overflow: 'hidden',
                  aspectRatio: '16/9',
                  minHeight: '250px'
                }}
              />
            </div>
          </div>
        ];
      }
      
      // Otherwise, show as regular link card
      const domain = extractDomain(url);
      
      return [
        <a
          key="link-card"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-3 px-3 py-2 rounded-lg w-full max-w-md"
          style={{ backgroundColor: '#e9e8eb' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d3d6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9e8eb'}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-black leading-tight">
                {domain}
              </span>
              <div className="flex justify-end">
                <span className="text-xs text-black/70">Link</span>
              </div>
            </div>
          </div>
          <Globe className="w-6 h-6 flex-shrink-0 text-black/80" />
        </a>
      ];
    }
    
    // Otherwise, show links as underlined text
    // Stop at commas, semicolons, and other punctuation that aren't valid in URLs
    const urlRegex = /(https?:\/\/[^\s,;.]+(?:\.[^\s,;.]+)*(?:\/[^\s,;]*)?|www\.[^\s,;.]+(?:\.[^\s,;.]+)*(?:\/[^\s,;]*)?|[a-zA-Z0-9-]+\.[a-zA-Z]{3,}(?:\/[^\s,;]*)?(?:\?[^\s,;]*)?(?:#[^\s,;]*)?)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      // Prepare the URL for validation
      let url = match[0];
      // Add https:// if it starts with www. or doesn't have protocol
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Validate that it's actually a valid URL and has a valid hostname
      try {
        const urlObj = new URL(url);
        // Check if hostname looks like a real domain (has at least one dot and valid TLD)
        const hostname = urlObj.hostname;
        if (!hostname.includes('.') || hostname.split('.').pop()!.length < 2) {
          continue;
        }
        // Reject if hostname has invalid characters or looks like random text
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(hostname)) {
          continue;
        }
        
        // Add text before the URL
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        
        // Add the URL as underlined text link
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline break-all decoration-solid",
              isCurrentUser ? "text-white/90 hover:text-white underline decoration-white/90" : "text-black hover:text-gray-800 underline decoration-black"
            )}
            style={{ textDecoration: 'underline' }}
            onClick={(e) => e.stopPropagation()}
          >
            {match[0]}
          </a>
        );
        
        lastIndex = match.index + match[0].length;
      } catch {
        // Not a valid URL, skip it and continue
        // Don't update lastIndex so we don't skip the text
      }
    }
    
    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Wrap text to 120 characters per line (including whitespace)
  const wrapTextToLines = (text: string, maxCharsPerLine: number = 120): string => {
    if (!text) return '';
    
    // Split by existing newlines first to preserve user's line breaks
    const lines = text.split('\n');
    const wrappedLines: string[] = [];
    
    for (const line of lines) {
      if (line.length <= maxCharsPerLine) {
        wrappedLines.push(line);
      } else {
        // Break long lines into chunks of maxCharsPerLine, trying to break at word boundaries
        let start = 0;
        while (start < line.length) {
          let end = Math.min(start + maxCharsPerLine, line.length);
          
          // If not at the end of the string, try to find a space to break at
          if (end < line.length) {
            const lastSpace = line.lastIndexOf(' ', end);
            // If we found a space within the last 20 characters, use it
            if (lastSpace > start && lastSpace > end - 20) {
              end = lastSpace;
            }
          }
          
          wrappedLines.push(line.substring(start, end).trim());
          start = end;
          // Skip the space if we broke at a word boundary
          if (start < line.length && line[start] === ' ') {
            start++;
          }
        }
      }
    }
    
    return wrappedLines.join('\n');
  };

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#FEFBF6' }}>
      {/* Sidebar - Slack/Discord style */}
      <div className="w-64 flex flex-col border-r" style={{ backgroundColor: '#752432' }}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-white/10 relative">
          <h1 className="text-white font-semibold mb-2">Search Users</h1>
          <div className="relative search-container" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (searchResults.length > 0 || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                          {user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900 font-medium">{user.full_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="py-2">
            {/* DMs Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('dms')}
                className="w-full px-4 py-1 flex items-center justify-between text-white/80 hover:text-white text-sm group"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.dms ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>Direct Messages</span>
                </div>
              </button>

              {expandedSections.dms && (
                <div className="mt-1">
                  {getDMs().map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        'w-full px-4 py-1.5 flex items-center gap-2 text-sm transition-colors',
                        selectedConversation?.id === conv.id
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <AtSign className="w-4 h-4" />
                      <span className="flex-1 text-left truncate">{conv.name}</span>
                      {conv.userId && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: onlineUsers.has(conv.userId) 
                              ? '#43a25a' 
                              : 'transparent',
                            border: onlineUsers.has(conv.userId) 
                              ? 'none' 
                              : '3px solid #9ca3af',
                            boxSizing: 'border-box'
                          }}
                          title={onlineUsers.has(conv.userId) ? 'Online' : 'Offline'}
                        />
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-white text-[#752432] px-1.5 py-0 text-xs h-5">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Group Chats Section */}
            <div className="mb-4">
              <div className="w-full px-4 py-1 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('groups')}
                  className="flex-1 flex items-center gap-2 text-white/80 hover:text-white text-sm group"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.groups ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Group Chats</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateGroupModal(true);
                  }}
                  className="text-white/60 hover:text-white transition-colors p-1"
                  title="Create Group"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {expandedSections.groups && (
                <div className="mt-1">
                  {getGroups().map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        'w-full px-4 py-1.5 flex items-center gap-2 text-sm transition-colors',
                        selectedConversation?.id === conv.id
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Users className="w-4 h-4" />
                      <span className="flex-1 text-left truncate" title={conv.name}>{truncateName(conv.name)}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-white text-[#752432] px-1.5 py-0 text-xs h-5">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Courses Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('courses')}
                className="w-full px-4 py-1 flex items-center justify-between text-white/80 hover:text-white text-sm group"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.courses ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>Courses</span>
                </div>
              </button>

              {expandedSections.courses && (
                <div className="mt-1">
                  {getCourses().map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        'w-full px-4 py-1.5 flex items-center gap-2 text-sm transition-colors',
                        selectedConversation?.id === conv.id
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Hash className="w-4 h-4" />
                      <span className="flex-1 text-left truncate" title={conv.name}>{truncateName(conv.name)}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-white text-[#752432] px-1.5 py-0 text-xs h-5">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-h-0 min-w-0">
        {conversationsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#752432] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          </div>
        ) : selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4 relative z-10" style={{ backgroundColor: 'rgba(248, 244, 237, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {selectedConversation.type === 'dm' ? (
                    <div className="relative">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="text-white" style={{ backgroundColor: '#752432' }}>
                          {selectedConversation.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.userId && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: onlineUsers.has(selectedConversation.userId) 
                              ? '#43a25a' 
                              : '#121214',
                            border: onlineUsers.has(selectedConversation.userId) 
                              ? 'none' 
                              : '3px solid #9ca3af',
                            boxSizing: 'border-box'
                          }}
                          title={onlineUsers.has(selectedConversation.userId) ? 'Online' : 'Offline'}
                        />
                      )}
                    </div>
                  ) : selectedConversation.type === 'group' ? (
                    <div
                      className="w-9 h-9 rounded bg-white border-2 flex items-center justify-center"
                      style={{ borderColor: '#752432' }}
                    >
                      <Users className="w-5 h-5" style={{ color: '#752432' }} />
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                      <h2 className="font-medium text-gray-900">{selectedConversation.name}</h2>
                    {(selectedConversation.type === 'course' || selectedConversation.type === 'group') && memberCount !== null && (
                      <div ref={groupMembersContainerRef} className="relative">
                        {selectedConversation.type === 'group' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowGroupMembersList(!showGroupMembersList);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap"
                          >
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500 whitespace-nowrap">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </p>
                        )}
                        {/* Group Members List Modal */}
                        {selectedConversation.type === 'group' && showGroupMembersList && groupParticipants.length > 0 && (
                          <div 
                            ref={groupMembersListRef}
                            className="absolute left-0 top-full mt-2 w-64 bg-white rounded-md shadow-lg z-10 border overflow-hidden"
                          >
                            <div className="font-medium text-sm mb-2 p-2 border-b">Group Members</div>
                            <div className="max-h-48 overflow-y-auto">
                              {groupParticipants.map((user) => (
                                <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                                      {user.full_name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-700 flex-1 truncate">{user.full_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedConversation.participants && selectedConversation.type === 'dm' && (
                      <p className="text-sm text-gray-500">{selectedConversation.participants[0]}</p>
                    )}
                    {selectedConversation.type === 'dm' && blockedByUser && (
                      <p className="text-xs text-red-500">You are blocked by this user</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.type === 'dm' && selectedConversation.userId && (
                    <div className="relative" ref={blockMenuRef}>
                        <Button
                          variant="ghost"
                          size="sm"
                        onClick={() => setShowBlockMenu(!showBlockMenu)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                        <MoreVertical className="w-4 h-4" />
                        </Button>
                      {showBlockMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]">
                          {isBlocked ? (
                            <button
                              onClick={() => {
                                handleUnblockUser(selectedConversation.userId!);
                                setShowBlockMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Unlock className="w-4 h-4" />
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleBlockUser(selectedConversation.userId!);
                                setShowBlockMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" />
                          Block
                            </button>
                      )}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedConversation.type === 'group' && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGroupSettings(!showGroupSettings)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      {showGroupSettings && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowEditGroupModal(true);
                                setShowGroupSettings(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Group Name
                            </button>
                            <button
                              onClick={() => {
                                setShowEditMembersModal(true);
                                setShowGroupSettings(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Users className="w-4 h-4" />
                              Edit Members
                            </button>
                            <button
                              onClick={() => {
                                handleLeaveGroup();
                                setShowGroupSettings(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <XIcon className="w-4 h-4" />
                              Leave Group
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 relative z-0" style={{ marginTop: '-73px', marginBottom: '-100px' }}>
            <ScrollArea 
                className="h-full"
              onWheel={(e) => {
                // Detect two-finger horizontal swipe (trackpad gesture)
                // Check for horizontal scroll with significant deltaX
                // On trackpads, two-finger swipe generates wheel events with deltaX
                const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2;
                const hasSignificantHorizontalMovement = Math.abs(e.deltaX) > 8;
                
                if (isHorizontalSwipe && hasSignificantHorizontalMovement) {
                  // Swipe right (positive deltaX) - show timestamps
                  if (e.deltaX > 0) {
                    setShowAllTimestamps(true);
                    // Auto-hide after 3 seconds
                    setTimeout(() => {
                      setShowAllTimestamps(false);
                    }, 3000);
                  }
                }
              }}
            >
              {messagesLoading ? (
                <div className="max-w-4xl mx-auto p-6" style={{ paddingTop: 'calc(73px + 1.5rem)', paddingBottom: 'calc(100px + 1.5rem)' }}>
                  <div className="text-center text-gray-500 py-8">Loading messages...</div>
                </div>
              ) : messages.length > 0 ? (
                <div className="p-6 space-y-1 imessage" style={{ paddingTop: 'calc(73px + 1.5rem)', paddingBottom: 'calc(100px + 1.5rem)' }}>
                  {messages.map((message, index) => {
                    const hasButtons = message.isCurrentUser && (canDeleteMessage(message.created_at) || canEditMessage(message.created_at));
                    
                    // Check if this is the first message in a consecutive group from the same sender
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    
                    // Calculate time difference if previous message exists
                    let timeDiffMs = 0;
                    if (prevMessage) {
                      const prevTime = new Date(prevMessage.created_at).getTime();
                      const currentTime = new Date(message.created_at).getTime();
                      timeDiffMs = currentTime - prevTime;
                    }
                    
                    // Show timestamp if there's been more than 1 hour since the previous message
                    // OR if this is the first message of a new day
                    // This applies regardless of who sent the messages (same person or different person)
                    const ONE_HOUR_MS = 60 * 60 * 1000;
                    const isNewDay = prevMessage ? (() => {
                      const prevDate = new Date(prevMessage.created_at);
                      const currentDate = new Date(message.created_at);
                      return prevDate.getDate() !== currentDate.getDate() ||
                             prevDate.getMonth() !== currentDate.getMonth() ||
                             prevDate.getFullYear() !== currentDate.getFullYear();
                    })() : false;
                    const shouldShowDayTimestamp = !prevMessage || timeDiffMs > ONE_HOUR_MS || isNewDay;
                    
                    // Group messages only if they're from the same sender AND sent within 2 minutes (120000 ms)
                    const TWO_MINUTES_MS = 2 * 60 * 1000;
                    const isFirstInGroup = !prevMessage || 
                      prevMessage.senderId !== message.senderId || 
                      prevMessage.isCurrentUser !== message.isCurrentUser ||
                      timeDiffMs > TWO_MINUTES_MS;
                    
                    // Check if this is the last message in a consecutive group from the same sender
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    let nextTimeDiffMs = 0;
                    if (nextMessage) {
                      const currentTime = new Date(message.created_at).getTime();
                      const nextTime = new Date(nextMessage.created_at).getTime();
                      nextTimeDiffMs = nextTime - currentTime;
                    }
                    
                    const isLastInGroup = !nextMessage ||
                      nextMessage.senderId !== message.senderId ||
                      nextMessage.isCurrentUser !== message.isCurrentUser ||
                      nextTimeDiffMs > TWO_MINUTES_MS;
                    
                    // Show avatar on last message, name on first message for group chats
                    const shouldShowAvatar = !message.isCurrentUser && 
                      selectedConversation?.type !== 'dm' && 
                      isLastInGroup;
                    const shouldShowName = !message.isCurrentUser && 
                      selectedConversation?.type !== 'dm' && 
                      isFirstInGroup;
                    
                    return (
                      <React.Fragment key={message.id}>
                        {shouldShowDayTimestamp && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                              {formatDayTimestamp(message.created_at)}
                            </span>
                          </div>
                        )}
                  <div
                    className={cn(
                        'flex gap-3 relative w-full',
                        message.isCurrentUser ? 'flex-row-reverse justify-end' : 'flex-row justify-start',
                        'items-start'
                    )}
                      style={{
                        transform: showAllTimestamps 
                          ? (message.isCurrentUser ? 'translateX(-60px)' : 'translateX(60px)')
                          : 'translateX(0)',
                        transition: 'transform 0.3s ease-out',
                        marginTop: shouldShowName ? '0.75rem' : undefined
                      }}
                  >
                    {shouldShowAvatar && (
                      <div className="flex flex-col" style={{ alignSelf: 'flex-end', marginBottom: message.is_edited ? '1.25rem' : '0' }}>
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarFallback className="text-white" style={{ backgroundColor: '#752432' }}>
                            {message.senderName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    {!shouldShowAvatar && !message.isCurrentUser && selectedConversation?.type !== 'dm' && (
                      <div className="w-9 flex-shrink-0"></div>
                    )}
                    <div
                      className={cn(
                        'flex flex-col relative flex-1',
                        message.isCurrentUser ? 'items-end max-w-[55%]' : 'items-start max-w-[55%]'
                      )}
                    >
                      {shouldShowName && (
                        <div className="flex items-center gap-2 mb-1" style={{ marginLeft: '0.5rem' }}>
                          <span className="font-medium text-sm">{message.senderName}</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                      {(() => {
                        const hasFileAttachments = message.attachments?.some(att => att.attachment_type === 'file') ?? false;
                        const hasOnlyImages = (message.attachments?.length ?? 0) > 0 && 
                          (message.attachments?.every(att => att.attachment_type === 'image') ?? false) &&
                          !hasFileAttachments;
                        const hasTextContent = message.content && 
                          !(message.attachments && message.attachments.length > 0 && 
                            message.attachments.some(att => att.file_name === message.content));
                        // Check if message is link-only (should not have bubble)
                        const urlCheck = message.content ? startsWithUrl(message.content.trim()) : { isUrl: false };
                        const isLinkOnly = urlCheck.isUrl && !urlCheck.remainingText;
                        // Show bubble for any text message that's not link-only
                        const shouldShowBubble = hasTextContent && !isLinkOnly;
                        
                        return (
                      <div
                        className={cn(
                              'max-w-xl relative group flex flex-col'
                        )}
                      >
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              ref={editTextareaRef}
                              value={editMessageContent}
                              onChange={(e) => {
                                setEditMessageContent(e.target.value);
                                // Auto-resize textarea
                                const textarea = e.target;
                                textarea.style.height = 'auto';
                                textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
                              }}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-400 resize-none overflow-y-auto"
                              style={{ 
                                minHeight: '40px',
                                maxHeight: '200px',
                                lineHeight: '1.5'
                              }}
                              rows={1}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                className="h-7 text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-7 text-xs"
                              >
                                <XIcon className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                      </div>
                          </div>
                        ) : (
                          <>
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="space-y-2">
                                {message.attachments.map((att) => (
                                  <div key={att.id} className="relative inline-flex items-center">
                                    {att.attachment_type === 'image' ? (
                                      <div className="flex flex-col items-start gap-2 w-full">
                                        <img
                                          src={att.signedUrl || ''}
                                          alt={att.file_name}
                                          className="max-w-xs max-h-[70px] rounded-lg object-contain"
                                        />
                                        <a
                                          href={att.signedUrl || '#'}
                                          download={att.file_name}
                                          className="w-full p-2 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center border border-black"
                                          onClick={async (e) => {
                                            if (!att.signedUrl) {
                                              e.preventDefault();
                                              return;
                                            }
                                            e.preventDefault();
                                            try {
                                              const response = await fetch(att.signedUrl);
                                              const blob = await response.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = att.file_name;
                                              document.body.appendChild(a);
                                              a.click();
                                              window.URL.revokeObjectURL(url);
                                              document.body.removeChild(a);
                                            } catch (error) {
                                              console.error('Error downloading image:', error);
                                            }
                                          }}
                                          title={`Download ${att.file_name}`}
                                        >
                                          <Download className="w-4 h-4" />
                                          <span className="text-xs ml-1">·</span>
                                          <span className="text-xs ml-1">{formatFileSize(att.file_size)}</span>
                                        </a>
                                      </div>
                                    ) : (
                                      <a
                                        href={att.signedUrl || '#'}
                                        download={att.file_name}
                                        className="inline-flex items-start gap-3 px-3 py-2 rounded-lg w-full max-w-md"
                                        style={{ backgroundColor: '#e9e8eb' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d3d6'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9e8eb'}
                                        onClick={async (e) => {
                                          if (!att.signedUrl) {
                                            e.preventDefault();
                                            return;
                                          }
                                          e.preventDefault();
                                          try {
                                            const response = await fetch(att.signedUrl);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = att.file_name;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                          } catch (error) {
                                            console.error('Error downloading file:', error);
                                          }
                                        }}
                                        title={`Click to download ${att.file_name}`}
                                      >
                                        <FileIcon className="w-12 h-12 flex-shrink-0 text-black/80" />
                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                          <div className="flex flex-col">
                                            {formatFileNameForDisplay(att.file_name).map((line, idx) => (
                                              <span key={idx} className="text-sm font-medium text-black leading-tight">
                                                {line}
                                              </span>
                                            ))}
                                          </div>
                                          <div className="text-xs text-black/70 flex items-center gap-1">
                                            <span>{getFileType(att.mime_type, att.file_name)}</span>
                                            <span>·</span>
                                            <span>{formatFileSize(att.file_size)}</span>
                                          </div>
                                        </div>
                                      </a>
                      )}
                    </div>
                                ))}
                  </div>
                            )}
                            {message.content && 
                             !(message.attachments && message.attachments.length > 0 && 
                               message.attachments.some(att => att.file_name === message.content)) && (
                              (() => {
                                // Check if the entire message is just a URL (link-only message)
                                const urlCheck = startsWithUrl(message.content.trim());
                                const isLinkOnly = urlCheck.isUrl && !urlCheck.remainingText;
                                
                                if (isLinkOnly) {
                                  // Render as link card (div) - cannot be inside <p>
                                  return (
                                    <div 
                                      className={cn(
                                        "m-0 leading-tight",
                                        shouldShowBubble && isLastInGroup ? (message.isCurrentUser ? "from-me" : "from-them") : ""
                                      )}
                                      style={{ 
                                        lineHeight: '1.4',
                                        ...(shouldShowBubble && !isLastInGroup ? {
                                          borderRadius: '1.15rem',
                                          padding: '0.5rem .875rem',
                                          backgroundColor: message.isCurrentUser ? '#752432' : '#e9e8eb',
                                          color: message.isCurrentUser ? '#fff' : '#000',
                                          display: 'inline-block',
                                          maxWidth: '100%'
                                        } : {})
                                      }}
                                    >
                                      {linkifyText(message.content.trim(), message.isCurrentUser, true)}
                                    </div>
                                  );
                                } else {
                                  // Render normally with underlined links inside <p>
                                  return (
                                    <p 
                                      className={cn(
                                        "whitespace-pre-wrap m-0 leading-tight",
                                        shouldShowBubble && isLastInGroup ? (message.isCurrentUser ? "from-me" : "from-them") : ""
                                      )}
                                      style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        wordBreak: 'break-word', 
                                        lineHeight: '1.4',
                                        ...(shouldShowBubble && !isLastInGroup ? {
                                          borderRadius: '1.15rem',
                                          padding: '0.5rem .875rem',
                                          backgroundColor: message.isCurrentUser ? '#752432' : '#e9e8eb',
                                          color: message.isCurrentUser ? '#fff' : '#000',
                                          display: 'inline-block',
                                          maxWidth: '100%'
                                        } : {})
                                      }}
                                    >
                                      {wrapTextToLines(message.content, 120).split('\n').map((line, idx, arr) => (
                                        <React.Fragment key={idx}>
                                          {linkifyText(line, message.isCurrentUser, false)}
                                          {idx < arr.length - 1 && <br />}
                                        </React.Fragment>
                                      ))}
                                    </p>
                                  );
                                }
                              })()
                            )}
                          </>
                        )}
                        {/* Timestamp positioned at middle of text bubble when revealed via two-finger swipe */}
                        {showAllTimestamps && (
                          <span 
                            className="text-xs text-gray-500 absolute top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none z-10 transition-opacity duration-200"
                            style={{
                              opacity: 1,
                              right: message.isCurrentUser ? '-70px' : 'auto',
                              // For non-current user messages in group/course chats, account for avatar (36px) + gap (12px) = 48px
                              left: message.isCurrentUser ? 'auto' : (!message.isCurrentUser && selectedConversation?.type !== 'dm' ? '-118px' : '-70px')
                            }}
                          >
                            {message.timestamp}
                          </span>
                        )}
                          </div>
                        );
                      })()}
                      {/* Undo Send and Edit buttons - below the message bubble */}
                      {hasButtons && (
                        <div className={cn(
                          "flex items-center gap-2 mt-1",
                          message.isCurrentUser ? "justify-end" : "justify-start"
                        )}>
                                {canDeleteMessage(message.created_at) && (
                                  <button
                                    onClick={() => handleUndoSend(message.id)}
                              className="text-xs underline cursor-pointer"
                                    title="Undo send (within 2 min)"
                              style={{color: '#000000' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
                                  >
                              Undo Send
                                  </button>
                                )}
                          {canEditMessage(message.created_at) && !message.attachments?.length && (
                                  <button
                                    onClick={() => handleStartEditMessage(message)}
                              className="text-xs underline cursor-pointer"
                                    title="Edit (within 10 min)"
                              style={{color: '#000000' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
                                  >
                                    Edit
                                  </button>
                                )}
              </div>
                            )}
                      </div>
                      {/* Edited tag - outside the message bubble */}
                      {message.is_edited && (
                        <span className={cn(
                          "text-xs opacity-70 italic mt-1",
                          message.isCurrentUser ? "text-right" : "text-left"
                        )}>
                          edited
                        </span>
                      )}
                    </div>
                  </div>
                      </React.Fragment>
                  );
                  })}
                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex flex-row justify-start items-start px-4 py-2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : null}
            </ScrollArea>
            </div>

            {/* Message Input */}
            <div 
              className={cn("border-t p-4 relative z-10")}
              style={{ 
                backgroundColor: isDragging ? 'rgba(117, 37, 49, 0.2)' : 'rgba(255, 255, 255, 0.75)', 
                backdropFilter: 'blur(12px)', 
                WebkitBackdropFilter: 'blur(12px)' 
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  // Filter to only accept images and allowed file types
                  const acceptedFiles = files.filter(file => {
                    const isImage = file.type.startsWith('image/');
                    const isAllowedFile = file.type.includes('pdf') || 
                                        file.type.includes('document') || 
                                        file.type.includes('text') ||
                                        file.name.endsWith('.pdf') ||
                                        file.name.endsWith('.doc') ||
                                        file.name.endsWith('.docx') ||
                                        file.name.endsWith('.txt');
                    return isImage || isAllowedFile;
                  });
                  
                  if (acceptedFiles.length > 0) {
                    // Append new files to existing selected files
                    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
                    // Focus the message input
                    setTimeout(() => {
                      if (messageInputRef.current) {
                        messageInputRef.current.focus();
                      }
                    }, 100);
                  }
                }
              }}
            >
              <div className="max-w-4xl">
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                        <span className="text-xs">{truncateFileName(file.name)}</span>
                        <button
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button 
                    ref={paperclipButtonRef}
                    variant="ghost" 
                    onClick={() => {
                      fileInputRef.current?.click();
                      // Blur the button after clicking to prevent Enter key from triggering it
                      setTimeout(() => {
                        if (paperclipButtonRef.current) {
                          paperclipButtonRef.current.blur();
                        }
                      }, 0);
                    }}
                    disabled={uploadingFiles}
                    className="bg-gray-200 hover:bg-gray-300"
                    style={{ height: '40px', minHeight: '40px', width: '40px', minWidth: '40px', padding: 0 }}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative flex items-center">
                    <textarea
                      ref={messageInputRef}
                      placeholder={
                        selectedConversation.type === 'dm' && (blockedByUser || isBlocked)
                          ? blockedByUser ? 'This user has blocked you' : 'You have blocked this user'
                          : `Message ${selectedConversation.name}`
                      }
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (selectedFiles.length > 0 || messageInput.trim()) {
                          handleSendMessage();
                          }
                        }
                      }}
                      disabled={selectedConversation.type === 'dm' && (blockedByUser || isBlocked)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed pr-12 resize-none overflow-y-auto"
                      style={{ 
                        minHeight: '40px',
                        maxHeight: '200px',
                        lineHeight: '1.5'
                      }}
                      rows={1}
                    />
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 bottom-2"
                        >
                      <Smile className="w-4 h-4" />
                    </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2" align="end">
                        <div className="max-h-64 overflow-y-auto">
                          {(() => {
                            const allEmojis = [
                              // Smileys & People
                            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                            '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
                            '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
                            '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
                            '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                            '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
                            '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫',
                            '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
                            '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
                            '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
                            '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
                            '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
                            '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹',
                              '😻', '😼', '😽', '🙀', '😿', '😾',
                              // People & Body
                              '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
                              '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
                              '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
                              '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
                              '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
                              '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
                              '👄', '💋', '🩸',
                              // People
                              '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱',
                              '👨‍🦱', '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👩‍🦳', '👨‍🦳', '👩‍🦲',
                              '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳',
                              '👮‍♀️', '👮', '👷‍♀️', '👷', '💂‍♀️', '💂', '🕵️‍♀️', '🕵️',
                              '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓',
                              '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻',
                              '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨',
                              '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️',
                              '👰', '🤵', '👸', '🤴', '🦸‍♀️', '🦸', '🦹‍♀️', '🦹',
                              '🤶', '🎅', '🧙‍♀️', '🧙', '🧝‍♀️', '🧝', '🧛‍♀️', '🧛',
                              '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🧜‍♀️', '🧜', '🧚‍♀️', '🧚',
                              '👼', '🤰', '🤱', '👩‍🍼', '👨‍🍼', '🙇‍♀️', '🙇', '💁',
                              '💁‍♂️', '🙅', '🙅‍♂️', '🙆', '🙆‍♂️', '🙋', '🙋‍♂️', '🧏',
                              '🤦', '🤦‍♂️', '🤷', '🤷‍♂️', '👩‍🦯', '👨‍🦯', '👩‍🦼', '👨‍🦼',
                              '👩‍🦽', '👨‍🦽', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️',
                              '👯', '👯‍♂️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌',
                              // Animals & Nature
                              '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
                              '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
                              '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
                              '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
                              '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
                              '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎',
                              '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
                              '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
                              '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪',
                              '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎',
                              '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩',
                              '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🦅', '🦆', '🦢',
                              '🦩', '🦚', '🦜', '🦉', '🦤', '🪶', '🦃', '🦤',
                              '🦚', '🦜', '🐓', '🐣', '🐤', '🐥', '🦆', '🦅',
                              '🌲', '🌳', '🌴', '🌵', '🌶️', '🌾', '🌿', '☘️',
                              '🍀', '🍁', '🍂', '🍃', '🌺', '🌻', '🌹', '🥀',
                              '🌷', '🌼', '🌸', '🌾', '🌱', '🌿', '🍃', '🍂',
                              '🍁', '🍄', '🌰', '🪵', '🪴', '🌍', '🌎', '🌏',
                              '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗',
                              '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐',
                              '🌟', '💫', '✨', '☄️', '💥', '🔥', '🌈', '☀️',
                              '⛅', '☁️', '⛈️', '🌤️', '🌦️', '🌧️', '⛈️', '🌩️',
                              '❄️', '☃️', '⛄', '🌨️', '💧', '💦', '☔', '☂️',
                              '🌊', '🌫️',
                              // Food & Drink
                              '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
                              '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
                              '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽',
                              '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨',
                              '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖',
                              '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮',
                              '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛',
                              '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘',
                              '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦',
                              '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
                              '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼',
                              '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂',
                              '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊',
                              // Travel & Places
                              '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
                              '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵',
                              '🦽', '🦼', '🛴', '🚲', '🛴', '🛹', '🛼', '🚁',
                              '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🚤',
                              '⛵', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧',
                              '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯',
                              '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️',
                              '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖',
                              '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬',
                              '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩',
                              '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋',
                              '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆',
                              '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪',
                              '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉',
                              '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐',
                              '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘',
                              '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽',
                              '🦼', '🛴', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸',
                              '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🚤',
                              '⛵', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧',
                              '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯',
                              '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️',
                              '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖',
                              '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬',
                              '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩',
                              '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋',
                              // Activities
                              '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
                              '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
                              '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽',
                              '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂',
                              '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘',
                              '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇',
                              '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️',
                              '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧',
                              '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪗', '🎻',
                              '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
                              // Objects
                              '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
                              '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷',
                              '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
                              '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️',
                              '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡',
                              '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶',
                              '💷', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛',
                              '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️',
                              '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓',
                              '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️',
                              '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬',
                              '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠',
                              '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽',
                              '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣',
                              '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️',
                              '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒',
                              '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🪡', '🧵',
                              '🪢', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕',
                              '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻',
                              '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝',
                              '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡',
                              '🩰', '👢', '🪖', '⛑️', '🎩', '🎓', '🧢', '👒',
                              '🎪', '🪄', '💼', '👜', '👝', '👛', '👜', '💼',
                              '🎒', '🧳', '☂️', '🌂', '🧵', '🧶', '🪡', '🪢',
                              '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖',
                              '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱',
                              '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️',
                              '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰',
                              '👢', '🪖', '⛑️', '🎩', '🎓', '🧢', '👒', '🪖',
                              '⛑️', '🎩', '🎓', '🧢', '👒', '🪄', '💼', '👜',
                              // Symbols
                              '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                              '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                              '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
                              '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
                              '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                              '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
                              '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️',
                              '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹',
                              '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌',
                              '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
                              '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗',
                              '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️',
                              '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯',
                              '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀',
                              '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂',
                              '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮',
                              '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠',
                              '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣',
                              '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
                              '🔟', '🔢', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️',
                              '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽',
                              '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️',
                              '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁',
                              '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗',
                              '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰',
                              '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '✔️', '☑️',
                              '🔘', '⚪', '⚫', '🔴', '🔵', '🔺', '🔻', '🔸',
                              '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾',
                              '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦',
                              '🟪', '🟫', '⬛', '⬜', '🔈', '🔇', '🔉', '🔊',
                              '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️',
                              '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🎯',
                              '🎲', '🎰', '🪅', '🪄', '🪆', '🪡', '🪢', '🧵',
                              '🧶', '🪣', '🪒', '🪥', '🪠', '🧹', '🧺', '🧻',
                              '🪞', '🪟', '🪆', '🪄', '🪅', '🪡', '🪢', '🧵',
                              // Flags
                              '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫',
                              '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶',
                              '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸',
                              '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲',
                              '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳',
                              '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻',
                              '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨',
                              '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷',
                              '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲', '🇩🇴',
                              '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇪🇹', '🇪🇺',
                              '🇫🇰', '🇫🇴', '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫',
                              '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱',
                              '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾',
                              '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷',
                              '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲', '🇯🇵', '🇯🇪',
                              '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦',
                              '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺',
                              '🇲🇴', '🇲🇰', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹',
                              '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩',
                              '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦',
                              '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬',
                              '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼',
                              '🇵🇸', '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱',
                              '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺', '🇷🇼', '🇼🇸',
                              '🇸🇲', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽',
                              '🇸🇰', '🇸🇮', '🇸🇧', '🇸🇴', '🇿🇦', '🇬🇸', '🇰🇷', '🇸🇸',
                              '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨',
                              '🇸🇩', '🇸🇷', '🇸🇿', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯',
                              '🇹🇿', '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳',
                              '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇻🇮', '🇺🇬', '🇺🇦', '🇦🇪',
                              '🇬🇧', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳',
                              '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼'
                            ];
                            
                            // Split emojis into rows of 8
                            const rows: string[][] = [];
                            for (let i = 0; i < allEmojis.length; i += 8) {
                              rows.push(allEmojis.slice(i, i + 8));
                            }
                            
                            return rows.map((row, rowIndex) => (
                              <div key={rowIndex} className="block">
                                {row.map((emoji, colIndex) => (
                            <button
                                    key={`${rowIndex}-${colIndex}`}
                              type="button"
                              onClick={() => {
                                setMessageInput((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                                    className="hover:bg-gray-100 rounded transition-colors"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-block',
                                      fontSize: '20px',
                                      height: '32px',
                                      lineHeight: '21px',
                                      margin: '0 1px -1px 0',
                                      padding: '0.25rem 0 0.2rem',
                                      textAlign: 'center',
                                      width: '36px',
                                    }}
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                              </div>
                            ));
                          })()}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={(selectedFiles.length === 0 && !messageInput.trim()) || sendingMessage || uploadingFiles || (selectedConversation.type === 'dm' && (blockedByUser || isBlocked))}
                    className="text-white"
                    style={{ backgroundColor: '#752432', height: '40px', minHeight: '40px' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Only show welcome page if user has no DMs and no groups (course messages don't count)
          !hasDMsOrGroups ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#F5F1E8' }}
              >
                <Hash className="w-8 h-8" style={{ color: '#752432' }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messaging</h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
          ) : null
        )}
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>
              Create a group chat with at least 3 members (including you). Add a name and at least 2 other members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Group Name Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Group Name
              </label>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Add Users Section */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Add Members
              </label>
              
              {/* Search Input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users to add..."
                  value={groupUserSearch}
                  onChange={(e) => setGroupUserSearch(e.target.value)}
                  className="pl-9"
                />
                
                {/* Search Results Dropdown */}
                {groupUserSearch.trim() && (groupSearchResults.length > 0 || groupSearchLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50">
                    {groupSearchLoading ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                    ) : (
                      groupSearchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAddUserToGroup(user)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                              {user.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900 font-medium">{user.full_name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Users List */}
              <div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {/* Current User (always included) */}
                  {currentUserProfile && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                          {currentUserProfile.full_name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2) || 'You'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700 font-medium flex-1 truncate">
                        {currentUserProfile.full_name || 'You'}
                      </span>
                    </div>
                  )}

                  {/* Selected Users */}
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                          {user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700 font-medium flex-1 truncate">{user.full_name}</span>
                      <button
                        onClick={() => handleRemoveUserFromGroup(user.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Remove"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Member count indicator */}
                <div className="text-xs text-gray-500 px-2 mt-2">
                  {selectedUsers.length + 1} {selectedUsers.length + 1 === 1 ? 'member' : 'members'} 
                  {selectedUsers.length < 2 && ' (need at least 3 total)'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGroupModal(false);
                setGroupName('');
                setSelectedUsers([]);
                setGroupUserSearch('');
                setGroupSearchResults([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length < 2}
              className="text-white"
              style={{ backgroundColor: '#752432' }}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Name Modal */}
      <Dialog open={showEditGroupModal} onOpenChange={setShowEditGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group Name</DialogTitle>
            <DialogDescription>
              Change the name of this group chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter group name..."
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGroupModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditGroupName}
              disabled={!editGroupName.trim()}
              className="text-white"
              style={{ backgroundColor: '#752432' }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog open={showAddMembersModal} onOpenChange={setShowAddMembersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>
              Search and add members to this group chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users to add..."
                value={groupUserSearch}
                onChange={(e) => setGroupUserSearch(e.target.value)}
                className="pl-9"
              />
              {groupUserSearch.trim() && (groupSearchResults.length > 0 || groupSearchLoading) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50">
                  {groupSearchLoading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                  ) : (
                    groupSearchResults
                      .filter((user) => !groupParticipants.some((p) => p.id === user.id))
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAddUserToGroupForExisting(user)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                              {user.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900 font-medium">{user.full_name}</span>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
            {groupMembers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Selected Members</label>
                {groupMembers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                        {user.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 font-medium flex-1">{user.full_name}</span>
                    <button
                      onClick={() => setGroupMembers(groupMembers.filter((u) => u.id !== user.id))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddMembersModal(false);
              setGroupMembers([]);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMembersToGroup}
              disabled={groupMembers.length === 0}
              className="text-white"
              style={{ backgroundColor: '#752432' }}
            >
              Add Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Members Modal */}
      <Dialog open={showEditMembersModal} onOpenChange={setShowEditMembersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Members</DialogTitle>
            <DialogDescription>
              Add or remove members from this group chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Current Members */}
            {groupParticipants.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Members</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {groupParticipants.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                          {user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700 font-medium flex-1 truncate">{user.full_name}</span>
                      {user.id !== currentUserProfile?.id && (
                        <button
                          onClick={() => handleRemoveMemberFromGroup(user.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Remove member"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Members */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Add Members</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users to add..."
                  value={groupUserSearch}
                  onChange={(e) => setGroupUserSearch(e.target.value)}
                  className="pl-9"
                />
                {groupUserSearch.trim() && (groupSearchResults.length > 0 || groupSearchLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50">
                    {groupSearchLoading ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                    ) : (
                      groupSearchResults
                        .filter((user) => !groupParticipants.some((p) => p.id === user.id) && !groupMembers.some((m) => m.id === user.id))
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddUserToGroupForExisting(user)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                                {user.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 font-medium">{user.full_name}</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
              {groupMembers.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selected to Add</label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {groupMembers.map((user) => (
                      <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                            {user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-700 font-medium flex-1 truncate">{user.full_name}</span>
                        <button
                          onClick={() => setGroupMembers(groupMembers.filter((u) => u.id !== user.id))}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditMembersModal(false);
              setGroupMembers([]);
              setGroupUserSearch('');
              setGroupSearchResults([]);
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (groupMembers.length > 0) {
                  await handleAddMembersToGroup();
                }
                setShowEditMembersModal(false);
                setGroupMembers([]);
                setGroupUserSearch('');
                setGroupSearchResults([]);
              }}
              disabled={groupMembers.length === 0}
              className="text-white"
              style={{ backgroundColor: '#752432' }}
            >
              {groupMembers.length > 0 ? 'Add Members' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
