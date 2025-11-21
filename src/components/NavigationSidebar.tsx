import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Star, Beer, User, Archive, BookOpen, CalendarDays, Mail, Users, Briefcase, Lightbulb } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function NavigationSidebar({ isCollapsed: _isCollapsed, onToggleCollapsed: _onToggleCollapsed }: NavigationSidebarProps) {
  const location = useLocation();
  
  // Get current section from URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/outlines')) return 'outlines';
    if (path.startsWith('/exams')) return 'exams';
    if (path.startsWith('/reviews')) return 'reviews';
    if (path.startsWith('/planner')) return 'planner';
    if (path.startsWith('/directory')) return 'directory';
    if (path.startsWith('/club/') || path.startsWith('/clubs')) return 'clubs';
    if (path.startsWith('/barreview')) return 'barreview';
    if (path.startsWith('/biglaw-guide')) return 'biglaw-guide';
    if (path.startsWith('/quadle')) return 'quadle';
    if (path.startsWith('/feedback')) return 'feedback';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/course')) return 'course';
    if (path.startsWith('/student-profile')) return 'student-profile';
    return 'home';
  };

  const activeSection = getCurrentSection();
  // Start collapsed and auto-expand on load
  const [isAutoExpanded, setIsAutoExpanded] = useState(false);
  
  // Auto-expand on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAutoExpanded(true);
    }, 100); // Small delay for smooth animation
    
    return () => clearTimeout(timer);
  }, []);
  
  const isCollapsedOverride = !isAutoExpanded;
  const { user } = useAuth();
  const [, setIsResourcesExpanded] = useState(false);
  const [userName, setUserName] = useState('User');
  const [matchCount, setMatchCount] = useState(0);

  // Track collapse/expand transition to avoid overlapping UIs
  const [showText, setShowText] = useState(false);
  const [showSubItems, setShowSubItems] = useState([false, false, false]);
  const [barReviewOffset, setBarReviewOffset] = useState(0);
  
  useEffect(() => {
    if (isCollapsedOverride) {
      setShowText(false); // Hide text immediately when collapsing
      setShowSubItems([false, false, false]); // Hide all sub-items
      setBarReviewOffset(0); // Reset Bar Review position
    } else {
      // Delay showing text until after width transition completes
      const timer = setTimeout(() => setShowText(true), 300);
      
      // Stagger the sub-items fade-in and Bar Review movement
      const subItemTimers = [
        setTimeout(() => {
          setShowSubItems(prev => [true, prev[1], prev[2]]);
        }, 350), // First sub-item
        setTimeout(() => {
          setShowSubItems(prev => [prev[0], true, prev[2]]);
        }, 380), // Second sub-item (30ms gap)
        setTimeout(() => {
          setShowSubItems(prev => [prev[0], prev[1], true]);
        }, 410), // Third sub-item (30ms gap)
      ];
      
      // Continuous Bar Review movement - start immediately and move smoothly
      const barReviewStart = setTimeout(() => {
        setBarReviewOffset(0); // Move down 2px from current position (-2+2=0)
      }, 350);
      
      return () => {
        clearTimeout(timer);
        subItemTimers.forEach(clearTimeout);
        clearTimeout(barReviewStart);
      };
    }
  }, [isCollapsedOverride]);

  // Fetch user's name from profiles table
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user name:', error?.message || "Unknown error");
          return;
        }

        if (profile?.full_name) {
          // Extract first name and last initial
          const nameParts = profile.full_name.split(' ');
          const firstName = nameParts[0];
          const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
          setUserName(`${firstName} ${lastInitial}.`);
        }
      } catch (error) {
        console.error('Error fetching user name:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchUserName();
  }, [user]);

  // Fetch match count for received + matched matches
  useEffect(() => {
    const fetchMatchCount = async () => {
      if (!user?.id) {
        setMatchCount(0);
        return;
      }

      try {
        // Fetch received matches
        const { data: receivedData, error: receivedError } = await supabase
          .rpc('get_received_matches');

        if (receivedError) {
          console.error('Error fetching received matches:', receivedError);
          setMatchCount(0);
          return;
        }

        // Count received matches (non-mutual)
        const receivedCount = (receivedData || []).filter((match: any) => !match.is_mutual).length;

        // Count mutual matches from received
        const mutualFromReceived = (receivedData || []).filter((match: any) => match.is_mutual).length;

        // Fetch sent matches to check for mutual ones that weren't received
        const { data: sentData, error: sentError } = await supabase
          .from('matches')
          .select('receiver_id')
          .eq('sender_id', user.id);

        let mutualFromSent = 0;
        if (!sentError && sentData) {
          // Get list of received match sender IDs to avoid double counting
          const receivedSenderIds = new Set((receivedData || [])
            .filter((m: any) => m.is_mutual && m.sender_id)
            .map((m: any) => m.sender_id));

          for (const match of sentData) {
            // Skip if we already counted this person from received side
            if (receivedSenderIds.has(match.receiver_id)) {
              continue;
            }

            const { data: isMutualData } = await supabase
              .rpc('is_mutual_match', {
                sender_uuid: user.id,
                receiver_uuid: match.receiver_id
              });

            if (isMutualData === true) {
              mutualFromSent++;
            }
          }
        }

        // Total count = received (non-mutual) + matched (mutual from received) + matched (mutual from sent, not already counted)
        setMatchCount(receivedCount + mutualFromReceived + mutualFromSent);
      } catch (error) {
        console.error('Error fetching match count:', error);
        setMatchCount(0);
      }
    };

    fetchMatchCount();
    // Refresh count every 5 seconds
    const interval = setInterval(fetchMatchCount, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  

  

  // Auto-expand resources section when any resource sub-item is active
  React.useEffect(() => {
    if (['outlines', 'reviews', 'exams'].includes(activeSection)) {
      setIsResourcesExpanded(true);
    }
  }, [activeSection, setIsResourcesExpanded]);

  const resourceItems = [
    { id: 'outlines', label: 'Outlines', icon: FileText },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div 
      className={`group text-gray-800 flex flex-col border-r border-gray-200 h-full flex-shrink-0 ${
        isCollapsedOverride ? 'w-16' : 'w-40'
      }`}
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)', transition: 'width 300ms ease-in-out', minWidth: '4rem' }}
      onMouseEnter={() => {/* Disabled for now - sidebar always extended */}}
      onMouseLeave={() => {/* Disabled for now - sidebar always extended */}}
    >
      {/* Header */}
      <div className="p-4">
        <div className={`flex items-center justify-center relative ${
          isCollapsedOverride ? 'flex-col gap-2' : 'flex-row'
        }`}>
          <Link
            to="/"
            className="flex items-center justify-center flex-shrink-0 hover:opacity-80 cursor-pointer w-12 h-12 relative z-20"
          >
            <img 
              src="/QUAD.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain h-12 relative z-20"
            />
          </Link>
          {/* Menu button removed */}
        </div>
      </div>

      {/* Unified Navigation - Icons always present; labels appear when expanded */}
      <nav className="pt-2 pb-4 flex-1 flex flex-col">
        <div className="space-y-2 px-2">
          {/* Home */}
          <Link
            to="/"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'home' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'home' ? '#752432' : 'transparent' }}
          >
            <Home className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Home</span>}
          </Link>

          {/* Planner */}
          <Link
            to="/planner"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'planner' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'planner' ? '#752432' : 'transparent' }}
          >
            <div className="w-5 h-5 flex-shrink-0">
              <CalendarDays className="w-5 h-5" style={{ color: '#752432' }} />
            </div>
            {!isCollapsedOverride && showText && (
              <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Registration Planner</span>
            )}
          </Link>

          {/* Directory */}
          <Link
            to="/directory"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'directory' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'directory' ? '#752432' : 'transparent' }}
          >
            <Users className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Directory</span>}
          </Link>

          {/* Clubs - Hidden for now */}
          {/* <Link
            to="/clubs"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'clubs' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'clubs' ? '#752432' : 'transparent' }}
          >
            <span className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5 flex items-center justify-center text-2xl leading-none`} style={{ color: '#752432', WebkitTextStroke: '1.5px #752432', WebkitTextFillColor: 'transparent' }}>♣</span>
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Clubs</span>}
          </Link> */}

          {/* Resources - not clickable, only sub-items are */}
          <div
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              ['outlines', 'reviews', 'exams'].includes(activeSection) ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600'
            }`}
            style={{ 
              borderRightColor: ['outlines', 'reviews', 'exams'].includes(activeSection) ? '#752432' : 'transparent',
              cursor: 'default'
            }}
          >
            <Archive className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm flex-1 transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Resources</span>}
          </div>

          {/* Resource items - only render when they should be visible */}
          {!isCollapsedOverride && (
            <div className="ml-4 space-y-1 mt-1">
              {resourceItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return showSubItems[index] ? (
                  <Link
                    key={item.id}
                    to={`/${item.id}`}
                    className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
                      isActive ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                    }`}
                    style={{ borderRightColor: isActive ? '#752432' : 'transparent' }}
                  >
                    <div className="w-4 h-4 flex-shrink-0 transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">
                      <Icon className="w-4 h-4" style={{ color: '#752432' }} />
                    </div>
                    <span className="font-medium text-xs transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">{item.label}</span>
                  </Link>
                ) : null;
              })}
            </div>
          )}

          {/* Big Law Guide */}
          <Link
            to="/biglaw-guide"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'biglaw-guide' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'biglaw-guide' ? '#752432' : 'transparent' }}
          >
            <Briefcase className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Big Law Guide</span>}
          </Link>

          {/* Quadle */}
          <Link
            to="/quadle"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'quadle' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'quadle' ? '#752432' : 'transparent' }}
          >
            <Lightbulb className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Quadle</span>}
          </Link>

          {/* Bar Review */}
          <Link
            to="/barreview"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 transition-transform duration-500 ease-out ${
              activeSection === 'barreview' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ 
              borderRightColor: activeSection === 'barreview' ? '#752432' : 'transparent',
              transform: `translateY(${barReviewOffset}px)`
            }}
          >
            <div className="w-5 h-5 flex-shrink-0">
              <Beer className="w-5 h-5" style={{ color: '#752432' }} />
            </div>
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Bar Review</span>}
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Feedback button */}
        <div className="px-2 pt-2">
          <Link
            to="/feedback"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'feedback' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'feedback' ? '#752432' : 'transparent' }}
          >
            <Mail className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Feedback</span>}
          </Link>
        </div>

        {/* Profile bottom */}
        <div className="px-2 pt-2">
          <Link
            to="/profile"
            className={`relative w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'profile' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'profile' ? '#752432' : 'transparent' }}
          >
            {matchCount > 0 && (
              <div 
                className="absolute rounded-full flex items-center justify-center text-white font-semibold z-10"
                style={{ 
                  backgroundColor: '#ef4444', 
                  fontSize: '11px', 
                  minWidth: '22px',
                  height: '22px',
                  padding: matchCount > 9 ? '0 5px' : '0',
                  lineHeight: '1',
                  top: '-6px',
                  right: '-4px'
                }}
              >
                {matchCount > 99 ? '99+' : matchCount}
              </div>
            )}
            <User className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">{userName.replace(/\.$/, '')}</span>}
          </Link>
        </div>
      </nav>

      {/* Removed duplicated collapsed-only sections; unified nav above handles both states */}

    </div>
  );
}