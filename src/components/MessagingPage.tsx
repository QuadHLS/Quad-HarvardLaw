import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  Hash,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Smile,
  AtSign,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';

interface Conversation {
  id: string;
  type: 'dm' | 'course' | 'squad';
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  status?: 'online' | 'away' | 'busy' | 'offline';
  participants?: string[];
  icon?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

export function MessagingPage() {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    dms: true,
    courses: true,
  });

  // Mock conversations
  const conversations: Conversation[] = [
    // DMs
    {
      id: 'dm-1',
      type: 'dm',
      name: 'Sarah Martinez',
      lastMessage: 'Thanks for sharing those notes!',
      lastMessageTime: '2 min ago',
      unreadCount: 2,
      status: 'online',
    },

    // Courses
    {
      id: 'course-1',
      type: 'course',
      name: 'contract-law',
      icon: '#',
      participants: ['42 students'],
      lastMessage: 'Prof. Chen: Assignment due Friday',
      lastMessageTime: '30 min ago',
      unreadCount: 3,
    },
  ];

  // Mock messages
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Hey! Did you get a chance to review the Constitutional Law readings?',
      timestamp: '10:30 AM',
      isCurrentUser: false,
    },
    {
      id: '2',
      senderId: 'current',
      senderName: 'You',
      content: 'Yes, I went through them last night. The commerce clause section was particularly interesting.',
      timestamp: '10:32 AM',
      isCurrentUser: true,
    },
    {
      id: '3',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Agreed! I found the historical context really helpful for understanding modern applications.',
      timestamp: '10:35 AM',
      isCurrentUser: false,
    },
    {
      id: '4',
      senderId: 'current',
      senderName: 'You',
      content: 'Want to meet up before class tomorrow to go over the discussion questions?',
      timestamp: '10:38 AM',
      isCurrentUser: true,
    },
    {
      id: '5',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Thanks for sharing those notes!',
      timestamp: '10:40 AM',
      isCurrentUser: false,
    },
  ];

  const toggleSection = (section: 'dms' | 'courses') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      setMessageInput('');
    }
  };

  const handleNavigateToLandingPage = () => {
    if (!selectedConversation) return;

    if (selectedConversation.type === 'course') {
      navigate(`/course/${selectedConversation.name}`);
    }
  };

  const getDMs = () => conversations.filter((c) => c.type === 'dm');
  const getCourses = () => conversations.filter((c) => c.type === 'course');

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#FEFBF6' }}>
      {/* Sidebar - Slack/Discord style */}
      <div className="w-64 flex flex-col border-r" style={{ backgroundColor: '#752432' }}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-white font-semibold mb-2">Law School Hub</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
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
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4" style={{ backgroundColor: '#F8F4ED' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                  ) : (
                    <div
                      className="w-9 h-9 rounded bg-white border-2 flex items-center justify-center"
                      style={{ borderColor: '#752432' }}
                    >
                      <Hash className="w-5 h-5" style={{ color: '#752432' }} />
                    </div>
                  )}
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
                    {selectedConversation.participants && (
                      <p className="text-sm text-gray-500">{selectedConversation.participants[0]}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    )}
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
                        'flex-1 flex flex-col',
                        message.isCurrentUser ? 'items-end' : 'items-start'
                      )}
                    >
                      {!message.isCurrentUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-4 py-2 rounded-lg max-w-2xl',
                          message.isCurrentUser ? 'text-white' : 'bg-gray-100 text-gray-900'
                        )}
                        style={message.isCurrentUser ? { backgroundColor: '#752432' } : {}}
                      >
                        <p>{message.content}</p>
                      </div>
                      {message.isCurrentUser && (
                        <span className="text-xs text-gray-500 mt-1">{message.timestamp}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Message ${selectedConversation.type === 'course' ? '#' : ''}${selectedConversation.name}`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="pr-12 resize-none"
                    />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="text-white h-9"
                    style={{ backgroundColor: '#752432' }}
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
                Select a conversation from the sidebar to start messaging with classmates, courses, or squads.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
