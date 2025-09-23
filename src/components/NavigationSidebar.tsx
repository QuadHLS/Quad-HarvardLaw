import React, { useState, useEffect } from 'react';
import { Home, FileText, Star, Beer, Calendar, Menu, User, MessageCircle, Archive, ChevronDown, ChevronRight, BookOpen, LogOut, Sun, Moon, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NavigationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function NavigationSidebar({ activeSection, onSectionChange, isCollapsed, onToggleCollapsed }: NavigationSidebarProps) {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  const [isResourcesCollapsedExpanded, setIsResourcesCollapsedExpanded] = useState(false);
  const [userName, setUserName] = useState('User');
  const [theme, setTheme] = useState<'light' | 'dark' | 'beige'>('beige');
  const [showMenuButton, setShowMenuButton] = useState(!isCollapsed);

  // Handle delayed menu button teleport
  useEffect(() => {
    if (!isCollapsed) {
      // Delay the menu button appearance by 200ms to let sidebar expand first
      const timer = setTimeout(() => {
        setShowMenuButton(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // Show immediately when collapsing
      setShowMenuButton(true);
    }
  }, [isCollapsed]);

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
          console.error('Error fetching user name:', error);
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
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
    } else if (theme === 'dark') {
      root.style.setProperty('--background-color', '#0e172c');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.setProperty('--background-color', '#f9f5f0');
      root.style.setProperty('--text-color', '#000000');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'beige') => {
    setTheme(newTheme);
  };

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('beige');
    } else if (theme === 'beige') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  // Auto-expand resources section when any resource sub-item is active
  React.useEffect(() => {
    if (['outlines', 'reviews', 'exams'].includes(activeSection)) {
      setIsResourcesExpanded(true);
    }
  }, [activeSection]);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
  ];

  const resourceItems = [
    { id: 'outlines', label: 'Outlines', icon: FileText },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div 
      className={`text-gray-800 flex flex-col border-r border-gray-200 h-full flex-shrink-0 ${
        isCollapsed ? 'w-16' : 'w-40'
      }`}
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)', transition: 'width 300ms ease-in-out', minWidth: isCollapsed ? '4rem' : '10rem' }}
    >
      {/* Header */}
      <div className={`p-4 ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
        <div className={`flex items-center justify-center relative ${
          isCollapsed ? 'flex-col gap-2' : 'flex-row'
        }`}>
          <button
            onClick={() => onSectionChange('home')}
            className="flex items-center justify-center flex-shrink-0 hover:opacity-80 cursor-pointer w-12 h-12 relative z-20"
          >
            <img 
              src="/Quad Logo.png" 
              alt="Quad Logo" 
              className="w-auto object-contain h-10 relative z-20"
            />
          </button>
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className={`text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0 ${
                isCollapsed ? 'relative z-10' : 'absolute z-10'
              }`}
              style={isCollapsed ? {} : { right: '-12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <Menu className="w-4 h-4" style={{ color: '#752432' }} />
            </Button>
          )}
        </div>
      </div>

      {/* All Sidebar Content - Curtain reveal effect */}
      <div 
        className="flex-1 flex flex-col" 
        style={{ 
          position: 'absolute',
          top: '80px',
          left: '0',
          height: 'calc(100% - 80px)',
          overflow: 'hidden',
          width: isCollapsed ? '0' : '160px',
          transition: isCollapsed ? 'width 0ms ease-in-out' : 'width 300ms ease-in-out'
        }}
      >
        <div className="flex flex-col h-full" style={{ width: '160px', minWidth: '160px' }}>
          {/* Navigation Items */}
          <nav className="py-4 px-3">
            <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-left ${
                        isActive 
                          ? 'bg-white text-gray-800 border-r-2' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                      }`}
                  style={{
                    borderRightColor: isActive ? '#752432' : 'transparent'
                  }}
                >
                  <Icon 
                    className="w-5 h-5 mr-2" 
                    style={{ color: '#752432' }}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}

            {/* Resources Section */}
            <div>
              {/* Resources Parent Item */}
              <button
                onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                className={`w-full flex items-center px-3 py-2 text-left ${
                  ['outlines', 'reviews', 'exams'].includes(activeSection)
                    ? 'bg-white text-gray-800 border-r-2' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                }`}
                style={{
                  borderRightColor: ['outlines', 'reviews', 'exams'].includes(activeSection) ? '#752432' : 'transparent'
                }}
              >
                <Archive 
                  className="w-5 h-5 mr-2" 
                  style={{ color: '#752432' }}
                />
                <span className="font-medium flex-1 text-sm">Resources</span>
                {isResourcesExpanded ? (
                  <ChevronDown className="w-3 h-3" style={{ color: '#752432' }} />
                ) : (
                  <ChevronRight className="w-3 h-3" style={{ color: '#752432' }} />
                )}
              </button>

              {/* Resource Sub-items */}
              {isResourcesExpanded && (
                <div className="ml-6 space-y-1 mt-1" style={{ width: 'calc(100% - 24px)', minWidth: 'calc(100% - 24px)' }}>
                  {resourceItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`w-full flex items-center px-4 py-2 text-left ${
                          isActive 
                            ? 'bg-white text-gray-800 border-r-2' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                        }`}
                        style={{
                          borderRightColor: isActive ? '#752432' : 'transparent'
                        }}
                      >
                        <Icon 
                          className="w-4 h-4 mr-3" 
                          style={{ color: '#752432' }}
                        />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bar Review */}
            <button
              onClick={() => onSectionChange('barreview')}
              className={`w-full flex items-center px-3 py-2 text-left ${
                activeSection === 'barreview'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'barreview' ? '#752432' : 'transparent'
              }}
            >
              <Beer 
                className="w-5 h-5 mr-2" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium text-sm">Bar Review</span>
            </button>
            </div>
          </nav>
          
          {/* Spacer to push bottom section down */}
          <div className="flex-1" />

          {/* Bottom Section - Calendar, Messaging, Profile, Theme, Sign Out */}
          <div className="border-t border-gray-200">
            {/* Calendar Section */}
            <button
              onClick={() => onSectionChange('calendar')}
              className={`w-full flex items-center px-3 py-2 text-left ${
                activeSection === 'calendar'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'calendar' ? '#752432' : 'transparent'
              }}
            >
              <Calendar 
                className="w-5 h-5 mr-2" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium text-sm">Calendar</span>
            </button>

            {/* Messaging Section */}
            <button
              onClick={() => onSectionChange('messaging')}
              className={`w-full flex items-center px-3 py-2 text-left ${
                activeSection === 'messaging'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'messaging' ? '#752432' : 'transparent'
              }}
            >
              <div className="relative mr-2">
                <MessageCircle 
                  className="w-5 h-5" 
                  style={{ color: '#752432' }}
                />
                {/* Small unread notification bubble */}
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: '#752432' }}
                />
              </div>
              <span className="font-medium text-sm">Messaging</span>
            </button>
            
            {/* Profile Section */}
            <button
              onClick={() => onSectionChange('profile')}
              className={`w-full flex items-center px-3 py-2 text-left ${
                activeSection === 'profile'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'profile' ? '#752432' : 'transparent'
              }}
            >
              <User 
                className="w-5 h-5 mr-2" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium text-sm">{userName}</span>
            </button>

            {/* Theme Toggle Section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => handleThemeChange('light')}
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${theme === 'light' ? 'bg-gray-100' : ''}`}
                >
                  <Sun className="w-4 h-4" style={{ color: theme === 'light' ? '#000000' : '#6b7280' }} />
                </Button>
                <Button
                  onClick={() => handleThemeChange('beige')}
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${theme === 'beige' ? 'bg-gray-100' : ''}`}
                >
                  <Palette className="w-4 h-4" style={{ color: theme === 'beige' ? '#000000' : '#6b7280' }} />
                </Button>
                <Button
                  onClick={() => handleThemeChange('dark')}
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${theme === 'dark' ? 'bg-gray-100' : ''}`}
                >
                  <Moon className="w-4 h-4" style={{ color: theme === 'dark' ? '#000000' : '#6b7280' }} />
                </Button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="border-t border-gray-200 p-4">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-medium">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Navigation Items - Show when collapsed */}
      {isCollapsed && (
        <nav className="pt-2 pb-4">
          <div className="space-y-2">
            {/* Home */}
            <button
              onClick={() => onSectionChange('home')}
              className={`w-full flex items-center justify-center py-2 ${
                activeSection === 'home'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'home' ? '#752432' : 'transparent'
              }}
            >
              <Home className="w-5 h-5" style={{ color: '#752432' }} />
            </button>

            {/* Resources - Click to show dropdown */}
            <div>
              <button
                onClick={() => setIsResourcesCollapsedExpanded(!isResourcesCollapsedExpanded)}
                className={`w-full flex items-center justify-center py-2 ${
                  ['outlines', 'reviews', 'exams'].includes(activeSection)
                    ? 'bg-white text-gray-800 border-r-2' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                }`}
                style={{
                  borderRightColor: ['outlines', 'reviews', 'exams'].includes(activeSection) ? '#752432' : 'transparent'
                }}
              >
                <Archive className="w-5 h-5" style={{ color: '#752432' }} />
              </button>
              
              {/* Click dropdown for resources - appears below and pushes Bar Review down */}
              {isResourcesCollapsedExpanded && (
                <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] mt-1">
                  <div className="py-1 space-y-1">
                    {resourceItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => onSectionChange(item.id)}
                          className={`w-full flex items-center justify-center py-1 ${
                            isActive 
                              ? 'bg-white text-gray-800 border-r-2' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                          }`}
                          style={{
                            borderRightColor: isActive ? '#752432' : 'transparent'
                          }}
                        >
                          <Icon 
                            className="w-4 h-4" 
                            style={{ color: '#752432' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Review */}
            <button
              onClick={() => onSectionChange('barreview')}
              className={`w-full flex items-center justify-center py-2 ${
                activeSection === 'barreview'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'barreview' ? '#752432' : 'transparent'
              }}
            >
              <Beer className="w-5 h-5" style={{ color: '#752432' }} />
            </button>
          </div>
        </nav>
      )}

      {/* Spacer to push bottom section down when collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* Collapsed Bottom Section - Show when collapsed */}
      {isCollapsed && (
        <div className="py-3">
          <div className="space-y-2">
            {/* Calendar Icon */}
            <button
              onClick={() => onSectionChange('calendar')}
              className={`w-full flex items-center justify-center py-2 ${
                activeSection === 'calendar'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'calendar' ? '#752432' : 'transparent'
              }}
            >
              <Calendar 
                className="w-5 h-5" 
                style={{ color: '#752432' }}
              />
            </button>

            {/* Messaging Icon */}
            <button
              onClick={() => onSectionChange('messaging')}
              className={`w-full flex items-center justify-center py-2 ${
                activeSection === 'messaging'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'messaging' ? '#752432' : 'transparent'
              }}
            >
              <div className="relative">
                <MessageCircle 
                  className="w-5 h-5" 
                  style={{ color: '#752432' }}
                />
                {/* Small unread notification bubble */}
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: '#752432' }}
                />
              </div>
            </button>
            
            {/* Profile Icon */}
            <button
              onClick={() => onSectionChange('profile')}
              className={`w-full flex items-center justify-center py-2 ${
                activeSection === 'profile'
                  ? 'bg-white text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
              }`}
              style={{
                borderRightColor: activeSection === 'profile' ? '#752432' : 'transparent'
              }}
            >
              <User 
                className="w-5 h-5" 
                style={{ color: '#752432' }}
              />
            </button>

            {/* Theme Toggle Icon */}
            <button
              onClick={handleThemeToggle}
              className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-gray-800 hover:bg-white"
            >
              {theme === 'light' && <Sun className="w-5 h-5" style={{ color: '#000000' }} />}
              {theme === 'beige' && <Palette className="w-5 h-5" style={{ color: '#000000' }} />}
              {theme === 'dark' && <Moon className="w-5 h-5" style={{ color: '#ffffff' }} />}
            </button>

            {/* Sign Out Button */}
            <div className="border-t border-gray-200 w-full pt-2">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="ghost"
                className="w-full justify-center text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}