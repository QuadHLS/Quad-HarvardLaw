import React from 'react';
import { Search, ChevronDown, ChevronRight, AtSign, Users, Hash, Plus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import { VirtualizedList } from '../ui/VirtualizedList';

interface Conversation {
  id: string;
  name: string;
  type: 'dm' | 'group' | 'course' | 'squad';
  userId?: string;
  unreadCount: number;
}

interface SearchUser {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchFocus?: () => void;
  searchResults: SearchUser[];
  showSearchResults: boolean;
  searchLoading: boolean;
  onSelectUser: (user: SearchUser) => void;
  expandedSections: {
    dms: boolean;
    groups: boolean;
    courses: boolean;
  };
  onToggleSection: (section: 'dms' | 'groups' | 'courses') => void;
  onCreateGroup: () => void;
  onlineUsers: Set<string>;
  getDMs: () => Conversation[];
  getGroups: () => Conversation[];
  getCourses: () => Conversation[];
  truncateName: (name: string) => string;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ConversationList - Sidebar component for messaging
 * Displays DMs, Groups, and Course chats
 */
export const ConversationList = React.memo(({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  onSearchFocus,
  searchResults,
  showSearchResults,
  searchLoading,
  onSelectUser,
  expandedSections,
  onToggleSection,
  onCreateGroup,
  onlineUsers,
  getDMs,
  getGroups,
  getCourses,
  truncateName,
  searchContainerRef,
}: ConversationListProps) => {
  const dms = getDMs();
  const groups = getGroups();
  const courses = getCourses();

  const useVirtualDms = dms.length > 40;
  const useVirtualGroups = groups.length > 40;
  const useVirtualCourses = courses.length > 40;

  const dmHeight = Math.min(520, Math.max(260, dms.length * 52));
  const groupHeight = Math.min(520, Math.max(260, groups.length * 52));
  const courseHeight = Math.min(520, Math.max(260, courses.length * 52));

  const renderDmButton = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelectConversation(conv)}
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
  );

  const renderGroupButton = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelectConversation(conv)}
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
  );

  const renderCourseButton = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelectConversation(conv)}
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
  );

  return (
    <div className="w-64 flex flex-col border-r" style={{ backgroundColor: '#752432' }}>
      {/* Workspace Header */}
      <div className="p-4 border-b border-white/10 relative">
        <h1 className="text-white font-semibold mb-2">Search Users</h1>
        <div className="relative search-container" ref={searchContainerRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onSearchFocus}
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
                      onSelectUser(user);
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
              onClick={() => onToggleSection('dms')}
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
              {useVirtualDms ? (
                <VirtualizedList
                  items={dms}
                  itemHeight={52}
                  height={dmHeight}
                  overscanCount={8}
                  renderItem={(conv) => renderDmButton(conv)}
                />
              ) : (
                dms.map(renderDmButton)
              )}
              </div>
            )}
          </div>

          {/* Group Chats Section */}
          <div className="mb-4">
            <div className="w-full px-4 py-1 flex items-center justify-between">
              <button
                onClick={() => onToggleSection('groups')}
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
                  onCreateGroup();
                }}
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Create Group"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {expandedSections.groups && (
              <div className="mt-1">
              {useVirtualGroups ? (
                <VirtualizedList
                  items={groups}
                  itemHeight={52}
                  height={groupHeight}
                  overscanCount={6}
                  renderItem={(conv) => renderGroupButton(conv)}
                />
              ) : (
                groups.map(renderGroupButton)
              )}
              </div>
            )}
          </div>

          {/* Courses Section */}
          <div className="mb-4">
            <button
              onClick={() => onToggleSection('courses')}
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
              {useVirtualCourses ? (
                <VirtualizedList
                  items={courses}
                  itemHeight={52}
                  height={courseHeight}
                  overscanCount={6}
                  renderItem={(conv) => renderCourseButton(conv)}
                />
              ) : (
                courses.map(renderCourseButton)
              )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});

ConversationList.displayName = 'ConversationList';

