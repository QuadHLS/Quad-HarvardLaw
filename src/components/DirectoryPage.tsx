import React, { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDirectoryUsers } from '../hooks/useSupabaseQueries';
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// UI COMPONENTS - Input
// ============================================

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

// ============================================
// UI COMPONENTS - Select
// ============================================

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

// ============================================
// DIRECTORY PAGE COMPONENT
// ============================================

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  classYear: string;
  section: string;
}

interface DirectoryPageProps {
  onNavigateToStudentProfile?: (studentName: string) => void;
}

export function DirectoryPage({ onNavigateToStudentProfile }: DirectoryPageProps) {
  const navigate = useNavigate();
  
  // Use React Query hook for data fetching
  const { data: users = [], isLoading: loading } = useDirectoryUsers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Get class year badge color - all use the same crimson color
  const getClassYearColor = (_classYear: string) => {
    return '#752432'; // Same crimson as the page
  };

  // Filter users based on search query and year filter (memoized for performance)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
    // Year filter
    if (yearFilter !== 'all' && user.classYear !== yearFilter) {
      return false;
    }
    
    // Search query filter - only by name
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (!user.fullName) return false;
    const fullNameLower = user.fullName.toLowerCase();
    const nameParts = user.fullName.split(' ');
    
    // Search in full name and individual parts
    return (
      fullNameLower.includes(query) ||
      nameParts.some(part => part.toLowerCase().includes(query))
    );
  });
  }, [users, searchQuery, yearFilter]);

  // Group users by first letter of full name
  const groupedUsers: { [key: string]: DirectoryUser[] } = {};
  filteredUsers.forEach(user => {
    if (!user.fullName || user.fullName.trim() === '') return;
    const firstLetter = user.fullName.charAt(0).toUpperCase();
    if (firstLetter && firstLetter.match(/[A-Z]/)) {
      if (!groupedUsers[firstLetter]) {
        groupedUsers[firstLetter] = [];
      }
      groupedUsers[firstLetter].push(user);
    }
  });

  // Get sorted letters
  const sortedLetters = Object.keys(groupedUsers).sort();

  const handleUserClick = (user: DirectoryUser) => {
    if (onNavigateToStudentProfile) {
      onNavigateToStudentProfile(user.fullName);
    } else {
      navigate(`/student-profile/${encodeURIComponent(user.fullName)}`);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200" style={{ backgroundColor: '#752432' }}>
        <div className="flex items-center justify-between gap-8">
          {/* Left side: Title and subtitle */}
          <div>
            <h1 className="text-white font-bold" style={{ fontSize: '34px' }}>Directory</h1>
            <p className="text-white/90">See who's in the Quad!</p>
          </div>
          
          {/* Right side: Search Bar and Filter */}
          <div className="flex gap-4 flex-1 max-w-2xl items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-600 placeholder:text-gray-400"
                />
              </div>
            </div>
            
            {/* Year Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/80 pl-1">Filter by Year</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1L">1L</SelectItem>
                  <SelectItem value="2L">2L</SelectItem>
                  <SelectItem value="3L">3L</SelectItem>
                  <SelectItem value="LLM">LLM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory List */}
      <div className="flex-1 overflow-y-auto p-6" style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: '#752432 transparent'
      }}>
        <div className="max-w-4xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No students found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  {/* Alphabetical Section Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                      style={{ 
                        backgroundColor: '#752432',
                        boxShadow: '0 4px 6px -1px rgba(117, 36, 50, 0.3), 0 2px 4px -1px rgba(117, 36, 50, 0.15)'
                      }}
                    >
                      <span className="text-white text-xl transform rotate-3">{letter}</span>
                    </div>
                    <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: '#752432', opacity: 0.2 }}></div>
                  </div>
                  
                  {/* Users in this section */}
                  <div className="grid gap-3">
                    {groupedUsers[letter].map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                        style={{ 
                          backgroundColor: '#FFFFFF',
                          transform: 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900">
                                {user.fullName}
                              </p>
                              {user.classYear && user.classYear.trim() !== '' && (
                                <span 
                                  className="px-2 py-0.5 rounded-full text-xs text-white"
                                  style={{ backgroundColor: getClassYearColor(user.classYear) }}
                                >
                                  {user.classYear}
                                </span>
                              )}
                            </div>
                            {user.classYear !== 'LLM' && user.section && (
                              <p className="text-sm text-gray-500">
                                Section {user.section}
                              </p>
                            )}
                          </div>
                          
                          {/* Arrow indicator */}
                          <svg 
                            className="w-5 h-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5l7 7-7 7" 
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}