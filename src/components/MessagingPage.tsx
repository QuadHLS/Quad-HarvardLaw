import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Users, 
  BookOpen, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface Chat {
  id: string;
  type: 'individual' | 'group' | 'class';
  name: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  course?: string;
}

interface ClassSchedule {
  studentName: string;
  currentClass?: {
    courseName: string;
    endTime: string;
  };
}

export function MessagingPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'group' | 'class'>('individual');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock class schedules for students (simulating current time as 2:30 PM on a Tuesday)
  const mockSchedules: ClassSchedule[] = [
    {
      studentName: 'Sarah Martinez',
      currentClass: {
        courseName: 'Constitutional Law',
        endTime: '3:00 PM'
      }
    },
    {
      studentName: 'Mike Chen',
      // Not currently in class
    },
    {
      studentName: 'Emma Wilson',
      currentClass: {
        courseName: 'Evidence',
        endTime: '2:50 PM'
      }
    },
    {
      studentName: 'Alex Johnson',
      // Not currently in class
    }
  ];

  // Mock data for chats
  const mockChats: Chat[] = [
    // Individual chats
    {
      id: '1',
      type: 'individual',
      name: 'Sarah Martinez',
      participants: ['Sarah Martinez'],
      lastMessage: 'Thanks for sharing those notes!',
      lastMessageTime: '2 min ago',
      unreadCount: 1
    },
    {
      id: '2',
      type: 'individual',
      name: 'Mike Chen',
      participants: ['Mike Chen'],
      lastMessage: 'Are you free to study tomorrow?',
      lastMessageTime: '1h ago',
      unreadCount: 0
    },
    {
      id: '3',
      type: 'individual',
      name: 'Emma Wilson',
      participants: ['Emma Wilson'],
      lastMessage: 'Great explanation in class today',
      lastMessageTime: '3h ago',
      unreadCount: 3
    },
    {
      id: '4',
      type: 'individual',
      name: 'Alex Johnson',
      participants: ['Alex Johnson'],
      lastMessage: 'Check out this case study',
      lastMessageTime: 'Yesterday',
      unreadCount: 0
    },
    
    // Group chats
    {
      id: '5',
      type: 'group',
      name: '2L Study Group',
      participants: ['Sarah Martinez', 'Mike Chen', 'Emma Wilson', 'Alex Johnson', 'Lisa Park'],
      lastMessage: 'Mike: Anyone want to review Evidence together?',
      lastMessageTime: '30 min ago',
      unreadCount: 2
    },
    {
      id: '6',
      type: 'group',
      name: 'Moot Court Team',
      participants: ['Emma Wilson', 'David Kim', 'Rachel Brown'],
      lastMessage: 'Rachel: Practice session at 3pm tomorrow',
      lastMessageTime: '2h ago',
      unreadCount: 0
    },
    {
      id: '7',
      type: 'group',
      name: 'Bar Exam Prep',
      participants: ['Sarah Martinez', 'Mike Chen', 'Lisa Park', 'Tom Anderson', 'Kelly White'],
      lastMessage: 'Tom: New practice questions uploaded',
      lastMessageTime: '5h ago',
      unreadCount: 1
    },
    
    // Class chats
    {
      id: '8',
      type: 'class',
      name: 'Constitutional Law - Rodriguez',
      course: 'Constitutional Law',
      participants: ['All students in Constitutional Law'],
      lastMessage: 'Prof. Rodriguez: Assignment due next Friday',
      lastMessageTime: '1h ago',
      unreadCount: 0
    },
    {
      id: '9',
      type: 'class',
      name: 'Contract Law - Chen',
      course: 'Contract Law',
      participants: ['All students in Contract Law'],
      lastMessage: 'Study group forming for midterm',
      lastMessageTime: '4h ago',
      unreadCount: 4
    },
    {
      id: '10',
      type: 'class',
      name: 'Criminal Law - Thompson',
      course: 'Criminal Law',
      participants: ['All students in Criminal Law'],
      lastMessage: 'Reading assignment for next week posted',
      lastMessageTime: '6h ago',
      unreadCount: 1
    },
    {
      id: '11',
      type: 'class',
      name: 'Torts - Moore',
      course: 'Torts',
      participants: ['All students in Torts'],
      lastMessage: 'Case brief templates available',
      lastMessageTime: 'Yesterday',
      unreadCount: 0
    }
  ];

  // Mock messages for selected chat
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Hey! Did you get a chance to review the Constitutional Law readings?',
      timestamp: '10:30 AM',
      isCurrentUser: false
    },
    {
      id: '2',
      senderId: 'current',
      senderName: 'You',
      content: 'Yes, I went through them last night. The commerce clause section was particularly interesting.',
      timestamp: '10:32 AM',
      isCurrentUser: true
    },
    {
      id: '3',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Agreed! I found the historical context really helpful for understanding modern applications.',
      timestamp: '10:35 AM',
      isCurrentUser: false
    },
    {
      id: '4',
      senderId: 'current',
      senderName: 'You',
      content: 'Want to meet up before class tomorrow to go over the discussion questions?',
      timestamp: '10:38 AM',
      isCurrentUser: true
    },
    {
      id: '5',
      senderId: '1',
      senderName: 'Sarah Martinez',
      content: 'Thanks for sharing those notes!',
      timestamp: '10:40 AM',
      isCurrentUser: false
    }
  ];

  const filteredChats = mockChats.filter(chat => 
    chat.type === activeTab &&
    (searchTerm === '' || chat.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      // Handle sending message logic here
      setMessageInput('');
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'individual': return MessageSquare;
      case 'group': return Users;
      case 'class': return BookOpen;
      default: return MessageSquare;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'individual': return 'Direct Messages';
      case 'group': return 'Group Chats';
      case 'class': return 'Class Chats';
      default: return 'Messages';
    }
  };

  const getClassStatus = (studentName: string) => {
    const schedule = mockSchedules.find(s => s.studentName === studentName);
    if (schedule?.currentClass) {
      return `${schedule.currentClass.courseName} until ${schedule.currentClass.endTime}`;
    }
    return 'Available';
  };

  const isStudentInClass = (studentName: string) => {
    const schedule = mockSchedules.find(s => s.studentName === studentName);
    return !!schedule?.currentClass;
  };

  return (
    <div className="h-screen style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} flex">
      {/* Sidebar */}
      <div className="w-80 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-medium text-gray-900 mb-4">Messaging</h1>
          
          {/* Tabs */}
          <div className="flex space-x-1 mb-4">
            {(['individual', 'group', 'class'] as const).map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;
              return (
                <Button
                  key={tab}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 gap-2 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={isActive ? { backgroundColor: '#752432' } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{getTabLabel(tab).split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 text-left hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback 
                      className="text-white text-sm"
                      style={{ backgroundColor: '#752432' }}
                    >
                      {chat.type === 'individual' 
                        ? chat.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                        : chat.type === 'group'
                        ? 'GRP'
                        : chat.course?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CLS'
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {chat.name}
                        </h3>
                        {chat.type === 'individual' && (
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ 
                              backgroundColor: isStudentInClass(chat.name) ? '#ef4444' : '#22c55e' 
                            }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate max-w-32 mr-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge 
                          className="text-white px-2 py-0.5 text-xs flex-shrink-0"
                          style={{ backgroundColor: '#752432' }}
                        >
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {chat.type === 'group' && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {chat.participants.length} members
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback 
                      className="text-white"
                      style={{ backgroundColor: '#752432' }}
                    >
                      {selectedChat.type === 'individual' 
                        ? selectedChat.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                        : selectedChat.type === 'group'
                        ? 'GRP'
                        : selectedChat.course?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CLS'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-gray-900">{selectedChat.name}</h2>
                      {selectedChat.type === 'individual' && (
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: isStudentInClass(selectedChat.name) ? '#ef4444' : '#22c55e' 
                          }}
                        />
                      )}
                    </div>
                    {selectedChat.type === 'individual' && (
                      <p className="text-sm text-gray-500">{getClassStatus(selectedChat.name)}</p>
                    )}
                    {selectedChat.type === 'group' && (
                      <p className="text-sm text-gray-500">{selectedChat.participants.length} members</p>
                    )}
                    {selectedChat.type === 'class' && (
                      <p className="text-sm text-gray-500">Class Discussion</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedChat.type === 'individual' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!message.isCurrentUser && (
                        <p className="text-xs text-gray-500 mb-1 ml-2">{message.senderName}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.isCurrentUser
                            ? 'text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                        style={message.isCurrentUser ? { backgroundColor: '#752432' } : {}}
                      >
                        <p>{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${message.isCurrentUser ? 'text-right mr-2' : 'ml-2'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="text-white"
                  style={{ backgroundColor: '#752432' }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose from your {getTabLabel(activeTab).toLowerCase()} to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}