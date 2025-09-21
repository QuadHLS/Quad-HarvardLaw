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
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userName, setUserName] = useState('User');
  const [theme, setTheme] = useState<'light' | 'dark' | 'beige'>('beige');

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
      className={`text-gray-800 flex flex-col transition-all duration-300 border-r border-gray-200 h-full ${
        isCollapsed ? 'w-16' : 'w-40'
      }`}
      style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}
    >
      {/* Header */}
      <div className={`p-4 ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-center relative">
            <button
              onClick={() => onSectionChange('home')}
              className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src="/Quad Logo.png" 
                alt="Quad Logo" 
                className="h-10 w-auto object-contain"
              />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="absolute text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
              style={{ right: '-8px' }}
            >
              <Menu className="w-4 h-4" style={{ color: '#752432' }} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onSectionChange('home')}
              className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ width: '50px', height: '50px' }}
            >
              <img 
                src="/Quad Logo.png" 
                alt="Quad Logo" 
                className="h-12 w-auto object-contain"
              />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
            >
              <Menu className="w-4 h-4" style={{ color: '#752432' }} />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Items - Only show when expanded */}
      {!isCollapsed && (
        <nav className="flex-1 py-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                    isActive 
                      ? 'bg-gray-100 text-gray-800 border-r-2' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  style={{
                    borderRightColor: isActive ? '#752432' : 'transparent'
                  }}
                >
                  <Icon 
                    className="w-5 h-5 mr-3" 
                    style={{ color: '#752432' }}
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            {/* Resources Section */}
            <div>
              {/* Resources Parent Item */}
              <button
                onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                  ['outlines', 'reviews', 'exams'].includes(activeSection)
                    ? 'bg-gray-100 text-gray-800 border-r-2' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                style={{
                  borderRightColor: ['outlines', 'reviews', 'exams'].includes(activeSection) ? '#752432' : 'transparent'
                }}
              >
                <Archive 
                  className="w-5 h-5 mr-3" 
                  style={{ color: '#752432' }}
                />
                <span className="font-medium flex-1">Resources</span>
                {isResourcesExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: '#752432' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: '#752432' }} />
                )}
              </button>

              {/* Resource Sub-items */}
              {isResourcesExpanded && (
                <div className="ml-6 space-y-1 mt-1">
                  {resourceItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`w-full flex items-center px-4 py-2 transition-colors text-left ${
                          isActive 
                            ? 'bg-gray-100 text-gray-800 border-r-2' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
              className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                activeSection === 'barreview'
                  ? 'bg-gray-100 text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{
                borderRightColor: activeSection === 'barreview' ? '#752432' : 'transparent'
              }}
            >
              <Beer 
                className="w-5 h-5 mr-3" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium">Bar Review</span>
            </button>
          </div>
        </nav>
      )}

      {/* Spacer to push bottom section to bottom when collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* Bottom Section - Calendar, Messaging and Profile */}
      <div className={!isCollapsed ? "border-t border-gray-200" : ""}>
        {!isCollapsed ? (
          <>
            {/* Calendar Section - Expanded */}
            <button
              onClick={() => onSectionChange('calendar')}
              className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                activeSection === 'calendar'
                  ? 'bg-gray-100 text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{
                borderRightColor: activeSection === 'calendar' ? '#752432' : 'transparent'
              }}
            >
              <Calendar 
                className="w-5 h-5 mr-3" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium">Calendar</span>
            </button>

            {/* Messaging Section - Expanded */}
            <button
              onClick={() => onSectionChange('messaging')}
              className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                activeSection === 'messaging'
                  ? 'bg-gray-100 text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{
                borderRightColor: activeSection === 'messaging' ? '#752432' : 'transparent'
              }}
            >
              <div className="relative mr-3">
                <MessageCircle 
                  className="w-5 h-5" 
                  style={{ color: '#752432' }}
                />
                {/* Small unread notification bubble */}
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white"
                  style={{ backgroundColor: '#752432' }}
                />
              </div>
              <span className="font-medium">Messaging</span>
            </button>
            
            {/* Profile Section - Expanded */}
            <button
              onClick={() => onSectionChange('profile')}
              className={`w-full flex items-center px-4 py-3 transition-colors text-left ${
                activeSection === 'profile'
                  ? 'bg-gray-100 text-gray-800 border-r-2' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{
                borderRightColor: activeSection === 'profile' ? '#752432' : 'transparent'
              }}
            >
              <User 
                className="w-5 h-5 mr-3" 
                style={{ color: '#752432' }}
              />
              <span className="font-medium">{userName}</span>
            </button>

            {/* Theme Toggle Section - Expanded */}
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
          </>
        ) : (
          /* Collapsed - Calendar above Messaging above Profile above Theme in vertical stack */
          <div className="p-3 flex flex-col items-center gap-3">
            {/* Calendar Icon - Top */}
            <button
              onClick={() => onSectionChange('calendar')}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                activeSection === 'calendar'
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Calendar 
                className="w-5 h-5" 
                style={{ color: '#752432' }}
              />
            </button>

            {/* Messaging Icon - Middle */}
            <button
              onClick={() => onSectionChange('messaging')}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                activeSection === 'messaging'
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <MessageCircle 
                  className="w-5 h-5" 
                  style={{ color: '#752432' }}
                />
                {/* Small unread notification bubble */}
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white"
                  style={{ backgroundColor: '#752432' }}
                />
              </div>
            </button>
            
            {/* Profile Icon - Bottom */}
            <button
              onClick={() => onSectionChange('profile')}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                activeSection === 'profile'
                  ? 'bg-gray-100 text-gray-800' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <User 
                className="w-4 h-4" 
                style={{ color: '#752432' }}
              />
            </button>

            {/* Theme Toggle Icon */}
            <button
              onClick={handleThemeToggle}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              {theme === 'light' && <Sun className="w-5 h-5" style={{ color: '#000000' }} />}
              {theme === 'beige' && <Palette className="w-5 h-5" style={{ color: '#000000' }} />}
              {theme === 'dark' && <Moon className="w-5 h-5" style={{ color: '#ffffff' }} />}
            </button>
          </div>
        )}
      </div>

      {/* Sign Out Button - Bottom */}
      <div className={`${!isCollapsed ? "border-t border-gray-200 p-4" : "p-3"}`}>
        <Button
          onClick={handleSignOut}
          disabled={isSigningOut}
          variant="ghost"
          className={`w-full ${!isCollapsed ? "justify-start" : "justify-center"} text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors`}
        >
          <LogOut className={`${!isCollapsed ? "w-5 h-5 mr-3" : "w-4 h-4"}`} />
          {!isCollapsed && (
            <span className="font-medium">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
        </Button>
      </div>

    </div>
  );
}