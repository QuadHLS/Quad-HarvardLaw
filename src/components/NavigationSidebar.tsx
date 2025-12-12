import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Star, Beer, User, Archive, BookOpen, CalendarDays, Mail, Users, Briefcase, Lightbulb, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { PrefetchLink } from './PrefetchLink';

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
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/directory')) return 'directory';
    if (path.startsWith('/messaging')) return 'messaging';
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
  // Hover state for expand/collapse
  const [isHovered, setIsHovered] = useState(false);
  
  const isCollapsedOverride = !isHovered;
  const { user } = useAuth();
  const [, setIsResourcesExpanded] = useState(false);
  const [userName, setUserName] = useState('User');

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

  // Check if Quadle game is active and handle navigation
  const handleNavigation = (e: React.MouseEvent, to: string) => {
    // Allow navigation to Quadle page itself
    if (to === '/quadle') {
      return; // Let Link handle it normally
    }

    const gameActive = localStorage.getItem('quadleGameActive') === 'true';
    if (gameActive) {
      e.preventDefault();
      toast.error('Finish your game first', {
        description: 'You have an active Quadle game in progress. Please finish the game before navigating to another page.',
      });
    }
  };

  return (
    <div 
      className={`group text-gray-800 flex flex-col border-r border-gray-200 h-full flex-shrink-0 ${
        isCollapsedOverride ? 'w-16' : 'w-40'
      }`}
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)', transition: 'width 300ms ease-in-out', minWidth: '4rem' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-4">
        <div className={`flex items-center justify-center relative ${
          isCollapsedOverride ? 'flex-col gap-2' : 'flex-row'
        }`}>
          <Link
            to="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="flex items-center justify-center flex-shrink-0 hover:opacity-80 cursor-pointer w-12 h-12 relative z-20"
          >
            <img 
              src="/QUAD.svg" 
              alt="Quad Logo" 
              className="object-contain relative z-20"
              width={48}
              height={48}
              style={{ width: '48px', height: '48px' }}
              loading="eager"
              fetchpriority="high"
              id="sidebar-quad-logo"
              data-quad-logo="sidebar"
            />
          </Link>
          {/* Menu button removed */}
        </div>
      </div>

      {/* Unified Navigation - Icons always present; labels appear when expanded */}
      <nav className="pt-2 pb-4 flex-1 flex flex-col" aria-label="Main navigation">
        <div className="space-y-2 px-2">
          {/* Home */}
          <Link
            to="/"
            onClick={(e) => handleNavigation(e, '/')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'home' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'home' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Home' : undefined}
          >
            <Home className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Home</span>}
          </Link>

          {/* Planner */}
          <PrefetchLink
            to="/planner"
            onClick={(e) => handleNavigation(e, '/planner')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'planner' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'planner' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Registration Planner' : undefined}
          >
            <div className="w-5 h-5 flex-shrink-0">
              <CalendarDays className="w-5 h-5" style={{ color: '#752432' }} />
            </div>
            {!isCollapsedOverride && showText && (
              <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Registration Planner</span>
            )}
          </PrefetchLink>

          {/* Directory */}
          <PrefetchLink
            to="/directory"
            onClick={(e) => handleNavigation(e, '/directory')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'directory' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'directory' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Directory' : undefined}
          >
            <Users className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Directory</span>}
          </PrefetchLink>

          <PrefetchLink
            to="/clubs"
            onClick={(e) => handleNavigation(e, '/clubs')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'clubs' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'clubs' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Clubs' : undefined}
          >
            <Users className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Clubs</span>}
          </PrefetchLink>

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
                  <PrefetchLink
                    key={item.id}
                    to={`/${item.id}`}
                    onClick={(e) => handleNavigation(e, `/${item.id}`)}
                    className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
                      isActive ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                    }`}
                    style={{ borderRightColor: isActive ? '#752432' : 'transparent' }}
                    aria-label={item.label}
                  >
                    <div className="w-4 h-4 flex-shrink-0 transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">
                      <Icon className="w-4 h-4" style={{ color: '#752432' }} />
                    </div>
                    <span className="font-medium text-xs transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">{item.label}</span>
                  </PrefetchLink>
                ) : null;
              })}
            </div>
          )}

          {/* Big Law Guide */}
          <PrefetchLink
            to="/biglaw-guide"
            onClick={(e) => handleNavigation(e, '/biglaw-guide')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'biglaw-guide' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'biglaw-guide' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Big Law Guide' : undefined}
          >
            <Briefcase className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Big Law Guide</span>}
          </PrefetchLink>

          {/* Quadle */}
          <PrefetchLink
            to="/quadle"
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'quadle' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'quadle' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Quadle' : undefined}
          >
            <Lightbulb className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Quadle</span>}
          </PrefetchLink>

          {/* Bar Review */}
          <PrefetchLink
            to="/barreview"
            onClick={(e) => handleNavigation(e, '/barreview')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 transition-transform duration-500 ease-out ${
              activeSection === 'barreview' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ 
              borderRightColor: activeSection === 'barreview' ? '#752432' : 'transparent',
              transform: `translateY(${barReviewOffset}px)`
            }}
            aria-label={isCollapsedOverride ? 'Bar Review' : undefined}
          >
            <div className="w-5 h-5 flex-shrink-0">
              <Beer className="w-5 h-5" style={{ color: '#752432' }} />
            </div>
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Bar Review</span>}
          </PrefetchLink>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Messaging */}
        <div className="px-2 pt-2">
          <PrefetchLink
            to="/messaging"
            onClick={(e) => handleNavigation(e, '/messaging')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'messaging' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'messaging' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Messaging' : undefined}
          >
            <MessageCircle className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Messaging</span>}
          </PrefetchLink>
        </div>

        {/* Calendar */}
        <div className="px-2 pt-2">
          <PrefetchLink
            to="/calendar"
            onClick={(e) => handleNavigation(e, '/calendar')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'calendar' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'calendar' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Calendar' : undefined}
          >
            <CalendarDays className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Calendar</span>}
          </PrefetchLink>
        </div>

        {/* Feedback button */}
        <div className="px-2 pt-2">
          <PrefetchLink
            to="/feedback"
            onClick={(e) => handleNavigation(e, '/feedback')}
            className={`w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'feedback' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'feedback' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? 'Feedback' : undefined}
          >
            <Mail className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">Feedback</span>}
          </PrefetchLink>
        </div>

        {/* Profile bottom */}
        <div className="px-2 pt-2">
          <Link
            to="/profile"
            onClick={(e) => handleNavigation(e, '/profile')}
            className={`relative w-full flex items-center rounded-md justify-start px-3 py-2 gap-2 ${
              activeSection === 'profile' ? 'bg-white text-gray-800 border-r-2' : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            style={{ borderRightColor: activeSection === 'profile' ? '#752432' : 'transparent' }}
            aria-label={isCollapsedOverride ? `Profile: ${userName.replace(/\.$/, '')}` : undefined}
          >
            <User className={`${!isCollapsedOverride ? 'mr-1.5' : ''} w-5 h-5`} style={{ color: '#752432' }} />
            {!isCollapsedOverride && showText && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out opacity-0 animate-fade-in">{userName.replace(/\.$/, '')}</span>}
          </Link>
        </div>
      </nav>

      {/* Removed duplicated collapsed-only sections; unified nav above handles both states */}
    </div>
  );
}