import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2,
  Ban,
  Unlock,
  File as FileIcon,
  Download,
  Check,
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
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Blocking state
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByUser, setBlockedByUser] = useState(false);
  
  // Group management state
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([]);
  const [groupParticipants, setGroupParticipants] = useState<SearchUser[]>([]);
  const [isGroupCreator, setIsGroupCreator] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  
  // Timestamp reveal state (for two-finger swipe)
  const [showAllTimestamps, setShowAllTimestamps] = useState(false);
  
  // File upload state
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
      alert('Failed to create group. Please try again.');
    }
  };

  // Handle clicking on a user from search results
  const handleSelectUser = async (user: SearchUser) => {
    console.log('handleSelectUser called for user:', user.full_name);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('No current user found');
        return;
      }
      
      console.log('Current user:', currentUser.id);

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
        console.log('Creating new DM conversation with function for user:', user.id);
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
        console.log('Created conversation ID:', conversationId);
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

      console.log('Conversation ID:', conversationId);
      console.log('New conversation object:', newConversation);
      
      // Add to conversations list if not already there (shows on left side immediately)
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) {
          // If it exists, update it with the latest info
          const updated = prev.map((c) => (c.id === conversationId ? newConversation : c));
          console.log('Updated existing conversation in list');
          return updated;
        }
        const updated = [newConversation, ...prev];
        console.log('Added new conversation to list. Total conversations:', updated.length);
        return updated;
      });

      // Select the conversation
      setSelectedConversation(newConversation);
      console.log('Selected conversation:', newConversation);
      setSearchTerm('');
      setShowSearchResults(false);
      
      // Ensure DMs section is expanded
      setExpandedSections((prev) => ({ ...prev, dms: true }));
      console.log('DM section expanded');
    } catch (err) {
      console.error('Error creating DM:', err);
      alert('Failed to create conversation. Please try again.');
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
      
      // Set scroll position to bottom immediately after messages load (no animation)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Find the ScrollArea viewport element that contains messages and set scroll to bottom
          const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
          const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        });
      });
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
  
  // Set scroll position to bottom when messages change or conversation is selected (no animation)
  useEffect(() => {
    if (selectedConversation?.id && messages.length > 0 && !messagesLoading) {
      // Use requestAnimationFrame to set scroll position immediately after DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Find the ScrollArea viewport element that contains messages and set scroll to bottom
          const messagesContainer = messagesEndRef.current?.closest('[data-slot="scroll-area"]');
          const viewport = messagesContainer?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        });
      });
    }
  }, [messages, selectedConversation?.id, messagesLoading]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch conversation IDs where user is a participant
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (partError) {
        console.error('Error fetching conversations:', partError);
        return;
      }

      if (!participants || participants.length === 0) {
        setConversations([]);
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
        return;
      }

      if (!convsData) {
        setConversations([]);
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
            unreadCount: 0,
          };
        })
      );

      const filteredConvs = convs.filter((c): c is Conversation => c !== null);
      setConversations(filteredConvs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
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
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, name, created_by')
        .eq('id', conversationId)
        .single();
      
      if (conv) {
        setEditGroupName(conv.name || '');
        setIsGroupCreator(conv.created_by === user.id);
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
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  const toggleSection = (section: 'dms' | 'groups' | 'courses') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    // Check if user is blocked (only for DMs)
    if (selectedConversation.type === 'dm' && blockedByUser) {
      toast.error('This user has blocked you');
      return;
    }

    // Preserve all newlines - don't trim as it might affect newline preservation
    // Only check if content is not empty
    const content = messageInput;
    setMessageInput('');
    // Reset textarea height after sending
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }
    setSendingMessage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSendingMessage(false);
        return;
      }

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

  const handleNavigateToLandingPage = () => {
    if (!selectedConversation) return;

    if (selectedConversation.type === 'course') {
      navigate(`/course/${selectedConversation.name}`);
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
      
      // Refresh conversations list
      const fetchConversations = async () => {
        // This will be handled by the existing useEffect
        window.location.reload();
      };
      fetchConversations();
    } catch (err) {
      console.error('Error editing group name:', err);
    }
  };
  
  const handleAddMembersToGroup = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group' || groupMembers.length === 0) return;
    
    try {
      const participants = groupMembers.map((user) => ({
        conversation_id: selectedConversation.id,
        user_id: user.id,
        is_active: true,
      }));
      
      const { error } = await supabase
        .from('conversation_participants')
        .upsert(participants, { onConflict: 'conversation_id,user_id' });
      
      if (error) throw error;
      
      setGroupMembers([]);
      setShowAddMembersModal(false);
      fetchGroupInfo(selectedConversation.id);
    } catch (err) {
      console.error('Error adding members:', err);
    }
  };
  
  const handleRemoveMemberFromGroup = async (userId: string) => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation.id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      fetchGroupInfo(selectedConversation.id);
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };
  
  const handleLeaveGroup = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSelectedConversation(null);
      window.location.reload();
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  };
  
  const handleDeleteGroup = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group' || !isGroupCreator) return;
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', selectedConversation.id);
      
      if (error) throw error;
      
      setSelectedConversation(null);
      window.location.reload();
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };
  
  // File upload functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };
  
  const handleUploadFiles = async () => {
    if (!selectedConversation || selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Upload files and create messages
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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
          .select('id')
          .single();
        
        if (messageError) throw messageError;
        
        // Create attachment record
        await supabase
          .from('message_attachments')
          .insert({
            message_id: message.id,
            attachment_type: isImage ? 'image' : 'file',
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
          });
      }
      
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error uploading files:', err);
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

  const getDMs = () => conversations.filter((c) => c.type === 'dm');
  const getGroups = () => conversations.filter((c) => c.type === 'group');
  const getCourses = () => conversations.filter((c) => c.type === 'course');

  // Helper function to truncate names to 28 characters
  const truncateName = (name: string): string => {
    if (!name) return '';
    if (name.length <= 28) return name;
    return name.substring(0, 28) + '...';
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
        <ScrollArea className="flex-1">
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
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4" style={{ backgroundColor: '#F8F4ED' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {selectedConversation.type === 'dm' ? (
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-white" style={{ backgroundColor: '#752432' }}>
                        {selectedConversation.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : selectedConversation.type === 'group' ? (
                    <div
                      className="w-9 h-9 rounded bg-white border-2 flex items-center justify-center"
                      style={{ borderColor: '#752432' }}
                    >
                      <Users className="w-5 h-5" style={{ color: '#752432' }} />
                    </div>
                  ) : null}
                  <div>
                    {selectedConversation.type === 'course' ? (
                      <button
                        onClick={handleNavigateToLandingPage}
                        className="hover:underline cursor-pointer text-left"
                      >
                        <h2 className="font-medium text-gray-900">
                          {selectedConversation.name}
                        </h2>
                      </button>
                    ) : (
                      <h2 className="font-medium text-gray-900">{selectedConversation.name}</h2>
                    )}
                    {(selectedConversation.type === 'course' || selectedConversation.type === 'group') && memberCount !== null && (
                      <p className="text-sm text-gray-500">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </p>
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
                    <>
                      {isBlocked ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblockUser(selectedConversation.userId!)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlockUser(selectedConversation.userId!)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Block
                        </Button>
                      )}
                    </>
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
                              Edit Group Name
                            </button>
                            <button
                              onClick={() => {
                                setShowAddMembersModal(true);
                                setShowGroupSettings(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Members
                            </button>
                            {isGroupCreator && (
                              <button
                                onClick={() => {
                                  handleDeleteGroup();
                                  setShowGroupSettings(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Group
                              </button>
                            )}
                            {!isGroupCreator && (
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
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea 
              className="flex-1 min-h-0"
              onWheel={(e) => {
                // Detect two-finger horizontal swipe (trackpad gesture)
                // Check for horizontal scroll with significant deltaX
                // On trackpads, two-finger swipe generates wheel events with deltaX
                const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2;
                const hasSignificantHorizontalMovement = Math.abs(e.deltaX) > 30;
                
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
                <div className="max-w-4xl mx-auto p-6">
                  <div className="text-center text-gray-500 py-8">Loading messages...</div>
                </div>
              ) : messages.length > 0 ? (
                <div className="p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3 relative w-full',
                        message.isCurrentUser ? 'flex-row-reverse items-start justify-end' : 'flex-row items-end justify-start'
                      )}
                      style={{
                        transform: showAllTimestamps && message.isCurrentUser ? 'translateX(-60px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease-out'
                      }}
                    >
                    {!message.isCurrentUser && (
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="text-white" style={{ backgroundColor: '#752432' }}>
                          {message.senderName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'flex flex-col relative flex-1',
                        message.isCurrentUser ? 'items-end max-w-[70%]' : 'items-start max-w-[70%]'
                      )}
                    >
                      {!message.isCurrentUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-4 py-1.5 max-w-2xl relative group',
                          message.isCurrentUser ? 'text-white' : 'bg-gray-100 text-gray-900'
                        )}
                        style={{
                          ...(message.isCurrentUser ? { backgroundColor: '#752432' } : {}),
                          borderRadius: '24px'
                        }}
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
                                          className="max-w-xs max-h-64 rounded-lg object-contain"
                                        />
                                        <a
                                          href={att.signedUrl || '#'}
                                          download={att.file_name}
                                          className="w-full p-2 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center"
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
                                        </a>
                                      </div>
                                    ) : (
                                      <a
                                        href={att.signedUrl || '#'}
                                        download={att.file_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-2 py-1 bg-white/10 rounded hover:bg-white/20 whitespace-nowrap"
                                        onClick={(e) => {
                                          if (!att.signedUrl) {
                                            e.preventDefault();
                                          }
                                        }}
                                        title={att.file_name}
                                      >
                                        <FileIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm truncate max-w-[200px]">{att.file_name}</span>
                                        <Download className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {message.content && 
                             !(message.attachments && message.attachments.length > 0 && 
                               message.attachments.some(att => att.file_name === message.content)) && (
                              <p className="whitespace-pre-wrap break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                {message.content.split('\n').map((line, idx, arr) => (
                                  <React.Fragment key={idx}>
                                    {line}
                                    {idx < arr.length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </p>
                            )}
                            {message.isCurrentUser && (canDeleteMessage(message.created_at) || canEditMessage(message.created_at)) && (
                              <div className="flex items-center gap-1 mt-2">
                                {canDeleteMessage(message.created_at) && (
                                  <button
                                    onClick={() => handleUndoSend(message.id)}
                                    className="text-xs px-2 py-1 rounded hover:bg-white/20 opacity-75 hover:opacity-100 transition-opacity"
                                    title="Undo send (within 2 min)"
                                  >
                                    Undo send
                                  </button>
                                )}
                                {canEditMessage(message.created_at) && (
                                  <button
                                    onClick={() => handleStartEditMessage(message)}
                                    className="text-xs px-2 py-1 rounded hover:bg-white/20 opacity-75 hover:opacity-100 transition-opacity"
                                    title="Edit (within 10 min)"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}
                          </>
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
                    {/* Timestamp on right side when revealed via two-finger swipe - positioned relative to message row */}
                    {showAllTimestamps && (
                      <span 
                        className="text-xs text-gray-500 absolute top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none z-10 transition-opacity duration-200"
                        style={{
                          opacity: 1,
                          right: '0px',
                          transform: message.isCurrentUser ? 'translateX(60px) translateY(-50%)' : 'translateY(-50%)'
                        }}
                      >
                        {message.timestamp}
                      </span>
                    )}
                  </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : null}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="max-w-4xl">
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                        <span className="text-xs">{file.name}</span>
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
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  {selectedFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUploadFiles}
                      disabled={uploadingFiles}
                    >
                      {uploadingFiles ? 'Uploading...' : 'Upload'}
                    </Button>
                  )}
                  <div className="flex-1 relative flex items-end">
                    <textarea
                      ref={messageInputRef}
                      placeholder={
                        selectedConversation.type === 'dm' && blockedByUser
                          ? 'This user has blocked you'
                          : `Message ${selectedConversation.type === 'course' ? '#' : ''}${selectedConversation.name}`
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
                          handleSendMessage();
                        }
                      }}
                      disabled={selectedConversation.type === 'dm' && blockedByUser}
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
                        <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                          {[
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
                            '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡',
                            '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                            '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
                            '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯',
                            '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊',
                            '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒',
                            '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
                            '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮',
                            '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️',
                            '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑',
                            '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯',
                            '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
                            '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸',
                            '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️',
                            '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧',
                            '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄',
                            '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶',
                            '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗',
                            '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣',
                            '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢',
                            '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩',
                            '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️',
                            '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️',
                            '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄',
                            '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '💲',
                            '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚',
                            '🔙', '🔛', '🔜', '🔝', '✔️', '☑️', '🔘', '⚪',
                            '⚫', '🔴', '🔵', '🔺', '🔻', '🔸', '🔹', '🔶',
                            '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️',
                            '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫',
                            '⬛', '⬜', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕',
                            '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️',
                            '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒',
                            '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚',
                            '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢',
                            '🕣', '🕤', '🕥', '🕦', '🕧'
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setMessageInput((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage || (selectedConversation.type === 'dm' && blockedByUser)}
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
              <div className="space-y-2">
                {/* Current User (always included) */}
                {currentUserProfile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                        {currentUserProfile.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2) || 'You'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 font-medium flex-1">
                      {currentUserProfile.full_name || 'You'}
                    </span>
                    <Badge className="bg-gray-200 text-gray-700 text-xs">Creator</Badge>
                  </div>
                )}

                {/* Selected Users */}
                {selectedUsers.map((user) => (
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
                      onClick={() => handleRemoveUserFromGroup(user.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

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

      {/* Group Members List Modal */}
      {selectedConversation?.type === 'group' && groupParticipants.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border p-2 max-h-96 overflow-y-auto">
          <div className="font-medium text-sm mb-2">Group Members</div>
          {groupParticipants.map((user) => (
            <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#752432' }}>
                  {user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 flex-1">{user.full_name}</span>
              {isGroupCreator && user.id !== currentUserProfile?.id && (
                <button
                  onClick={() => handleRemoveMemberFromGroup(user.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove member"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
