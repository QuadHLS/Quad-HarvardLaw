import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Edit, Save, X, Trophy, BookOpen, Clock, Upload, ArrowLeft, ChevronLeft, ChevronRight, Plus, RotateCcw, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { extractFilename, getStorageUrl } from '../utils/storage';
import { MatchInbox } from './MatchInbox';
import { MatchButton } from './MatchButton';

// Utility function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface ClubsAndActivitiesProps {
  selectedClubs: string[];
  onClubsChange: (clubs: string[]) => void;
  label?: string;
  className?: string;
}

function ClubsAndActivities({ 
  selectedClubs, 
  onClubsChange, 
  label = "Clubs & Activities",
  className = ""
}: ClubsAndActivitiesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [clubsList, setClubsList] = useState<string[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoadingClubs(true);
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('name')
          .order('name');
        if (!error && Array.isArray(data)) {
          const names = data
            .map((row: any) => String(row?.name || '').trim())
            .filter((n: string) => n.length > 0);
          setClubsList(names);
        } else {
          setClubsList([]);
        }
      } catch {
        setClubsList([]);
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchClubs();
  }, []);

  const toggleClub = (club: string) => {
    if (selectedClubs.includes(club)) {
      onClubsChange(selectedClubs.filter(c => c !== club));
    } else {
      onClubsChange([...selectedClubs, club]);
    }
  };

  const removeClub = (club: string) => {
    onClubsChange(selectedClubs.filter(c => c !== club));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}
      
      {/* Selected Clubs Display - Above Search */}
      {selectedClubs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClubs.map((club) => (
            <Badge
              key={club}
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-0.5 rounded-full border-0"
            >
              {club}
              <button
                onClick={() => removeClub(club)}
                className="ml-1.5 hover:bg-gray-400/30 rounded-full p-0.5 transition-colors"
                type="button"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Search Clubs Input */}
      <div className="border rounded-md">
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search clubs..."
            className="w-full px-3 py-2 border rounded-md text-sm"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {clubsList
            .filter(club => 
              club.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((club) => (
              <div
                key={club}
                onClick={() => toggleClub(club)}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    selectedClubs.includes(club)
                      ? 'bg-[#752432] border-[#752432]'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedClubs.includes(club) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <span className="text-sm">{club}</span>
              </div>
            ))}
          {(!loadingClubs && clubsList.filter(club => 
            club.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0) && (
            <div className="p-6 text-center text-sm text-gray-500">No clubs found.</div>
          )}
          {loadingClubs && (
            <div className="p-6 text-center text-sm text-gray-500">Loading clubs…</div>
          )}
        </div>
      </div>
    </div>
  );
}

// UI Components - All embedded within this file with exact styling match
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
  }
>(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    link: "text-blue-600 underline-offset-4 hover:underline",
  };
  
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-10 px-6",
    icon: "h-9 w-9",
  };
  
  return (
    <button
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
});



const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & { className?: string }
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  );
});

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & {
    variant?: "default" | "secondary" | "destructive" | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-900",
    destructive: "bg-red-500 text-white",
    outline: "border border-gray-300 text-gray-900",
  };
  
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium", variantClasses[variant], className)}
      {...props}
    />
  );
});

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-16 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);



// Interfaces
interface UserStats {
  outlinesSaved: number;
  outlinesUploaded: number;
  reviewsWritten: number;
  postsCreated: number;
  reputation: number;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  instagram: string;
  linkedin: string;
  year: string;
  age: number | null;
  hometown: string;
  underGrad: string;
  summerCity: string;
  summerFirm: string;
  bio: string;
  firm: string;
  city: string;
  tags: string[];
  currentCourses: { name: string; professor: string }[];
  clubMemberships: string[];
  stats: UserStats;
  schedule: { [key: string]: { course: string; time: string; location: string }[] };
  avatar_url?: string;
  photo_urls?: string[];
  clubs_visibility: boolean;
  courses_visibility: boolean;
  schedule_visibility: boolean;
}

interface ProfilePageProps {
  studentName?: string;
  onBack?: () => void;
  fromBarReview?: boolean;
}

export function ProfilePage({ studentName, onBack }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showRedoConfirm, setShowRedoConfirm] = useState(false);
  const [redoButtonRef, setRedoButtonRef] = useState<HTMLButtonElement | null>(null);
  const scheduleScrollRef = useRef<HTMLDivElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [matchInboxOpen, setMatchInboxOpen] = useState(false);
  const [matchSent, setMatchSent] = useState(false);

  // Check if match already exists when viewing someone else's profile
  useEffect(() => {
    const checkExistingMatch = async () => {
      if (!user?.id || !studentName || !profileData || profileData.email === user.email) {
        setMatchSent(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id')
          .eq('sender_id', user.id)
          .eq('receiver_id', profileData.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing match:', error);
        } else {
          setMatchSent(!!data);
        }
      } catch (error) {
        console.error('Error checking existing match:', error);
      }
    };

    if (profileData && studentName) {
      checkExistingMatch();
    }
  }, [user?.id, studentName, profileData]);
  
  // Pick a consistent color for the default avatar (green, blue, yellow, red)
  const getDefaultAvatarColor = (seed: string | undefined): string => {
    const colors = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
    if (!seed) return colors[Math.floor(Math.random() * colors.length)];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return colors[hash % colors.length];
  };
  
  // Get current day of week (0 = Monday, 1 = Tuesday, etc.)
  const getCurrentDayIndex = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to our Monday-Friday format (Monday = 0, Friday = 4)
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0; // Weekend defaults to Monday
    return dayOfWeek - 1;
  };
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(getCurrentDayIndex());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  
  // Fetch profile data from Supabase
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, phone, class_year, section, classes, age, hometown, under_grad, summer_city, summer_firm, instagram, linkedin, avatar_url, photo_urls, bio, clubs_activities, clubs_visibility, courses_visibility, schedule_visibility');

        // If viewing another student's profile, fetch by name; otherwise fetch by user ID
        if (studentName && studentName !== user.email) {
          query = query.eq('full_name', studentName);
        } else {
          query = query.eq('id', user.id);
        }

        const { data: profile, error } = await query.single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Convert Supabase profile data to ProfileData format
          const convertedProfile: ProfileData = {
            id: profile.id,
            name: profile.full_name || 'User',
            email: profile.email || '',
            phone: profile.phone || '',
            instagram: profile.instagram || '',
            linkedin: profile.linkedin || '',
            year: profile.class_year || '2L',
            age: profile.age || null,
            hometown: profile.hometown || '',
            underGrad: profile.under_grad || '',
            summerCity: profile.summer_city || '',
            summerFirm: profile.summer_firm || '',
            bio: profile.bio || '',
            firm: profile.summer_firm || '',
            city: profile.summer_city || '',
            tags: ['Law Student'], // Default tags
            currentCourses: (() => {
              const courses = (profile.classes || []).map((course: any) => ({
                name: (course.class || course.course_name || '').replace(/\s+\d+[A-Z]?$/, ''),
                professor: (course.professor || '').split(',')[0]
              }));
              
              // Group courses by name and combine professors for duplicates
              const courseMap = new Map();
              courses.forEach((course: { name: string; professor: string }) => {
                if (courseMap.has(course.name)) {
                  const existing = courseMap.get(course.name);
                  if (!existing.professor.includes(course.professor)) {
                    existing.professor += ` | ${course.professor}`;
                  }
                } else {
                  courseMap.set(course.name, { ...course });
                }
              });
              
              return Array.from(courseMap.values());
            })(),
            clubMemberships: profile.clubs_activities || [],
            stats: {
              outlinesSaved: 0,
              outlinesUploaded: 0,
              reviewsWritten: 0,
              postsCreated: 0,
              reputation: 0
            },
            schedule: (() => {
              const schedule: { [key: string]: any[] } = {
                'Monday': [],
                'Tuesday': [],
                'Wednesday': [],
                'Thursday': [],
                'Friday': []
              };
              
              // Build schedule from classes data
              if (profile.classes && Array.isArray(profile.classes)) {
                profile.classes.forEach((course: any) => {
                  if (course.schedule && course.schedule.days && course.schedule.times) {
                    const days = course.schedule.days.split(/[;,]/).map((d: string) => d.trim());
                    const times = course.schedule.times.split(/[;,]/).map((t: string) => t.trim());
                    
                    days.forEach((day: string) => {
                      const normalizedDay = day.toLowerCase();
                      let dayKey = '';
                      
                      if (normalizedDay.includes('mon')) dayKey = 'Monday';
                      else if (normalizedDay.includes('tue')) dayKey = 'Tuesday';
                      else if (normalizedDay.includes('wed')) dayKey = 'Wednesday';
                      else if (normalizedDay.includes('thu')) dayKey = 'Thursday';
                      else if (normalizedDay.includes('fri')) dayKey = 'Friday';
                      
                      if (dayKey && schedule[dayKey]) {
                        schedule[dayKey].push({
                          course: course.class || course.course_name || 'Unknown Course',
                          time: times[0] || 'TBD',
                          professor: course.professor || 'TBD',
                          semester: course.schedule.semester || 'TBD',
                          location: course.schedule.location || 'TBD'
                        });
                      }
                    });
                  }
                });
              }
              
              return schedule;
            })(),
            avatar_url: profile.avatar_url,
            photo_urls: profile.photo_urls || [],
            clubs_visibility: profile.clubs_visibility ?? true,
            courses_visibility: profile.courses_visibility ?? true,
            schedule_visibility: profile.schedule_visibility ?? true
          };

          setProfileData(convertedProfile);

          // Generate signed URLs for avatar and photos
          if (profile.avatar_url) {
            const signedUrl = await getStorageUrl(profile.avatar_url, 'Avatar');
            setAvatarUrl(signedUrl);
          } else {
            setAvatarUrl(null);
          }

          // Generate signed URLs for photos
          if (profile.photo_urls && profile.photo_urls.length > 0) {
            const photoUrlsMap: Record<number, string> = {};
            for (let i = 0; i < profile.photo_urls.length; i++) {
              const signedUrl = await getStorageUrl(profile.photo_urls[i], 'Photos');
              if (signedUrl) {
                photoUrlsMap[i] = signedUrl;
              }
            }
            setPhotoUrls(photoUrlsMap);
          } else {
            setPhotoUrls({});
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id, studentName]);
  
  // Course color pattern: green, blue, yellow, red repeating
  const getCourseColor = (_courseName: string, courseIndex: number = 0): string => {
    const colors = ['#04913A', '#0080BD', '#FFBB06', '#F22F21']; // green, blue, yellow, red
    return colors[courseIndex % 4];
  };
  
  // Parse time string to minutes for sorting (e.g., "9:00 AM" -> 540)
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || timeStr === 'TBD') return 9999; // Put TBD at the end
    
    try {
      // Extract start time from "9:00 AM - 10:00 AM" or just "9:00 AM"
      const startTimePart = timeStr.split('-')[0].trim();
      const timeMatch = startTimePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      
      if (!timeMatch) return 9999;
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    } catch {
      return 9999;
    }
  };
  
  // Sort classes by start time
  const sortClassesByTime = (classes: any[]): any[] => {
    return [...classes].sort((a, b) => {
      const timeA = parseTimeToMinutes(a.time);
      const timeB = parseTimeToMinutes(b.time);
      return timeA - timeB;
    });
  };
  
  // Get current week's days starting from Monday
  const getWeekDays = (): Array<{
    dayName: string;
    dayShort: string;
    date: string;
    fullDate: Date;
  }> => {
    const today = new Date(2024, 9, 21); // October 21, 2024 (Monday)
    const days: Array<{
      dayName: string;
      dayShort: string;
      date: string;
      fullDate: Date;
    }> = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date
      });
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  
  const handlePrevDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
      scrollToDay(selectedDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex < weekDays.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1);
      scrollToDay(selectedDayIndex + 1);
    }
  };

  const scrollToDay = (index: number) => {
    if (scheduleScrollRef.current) {
      const container = scheduleScrollRef.current;
      const dayWidth = container.scrollWidth / weekDays.length;
      container.scrollTo({
        left: dayWidth * index - (container.clientWidth - dayWidth) / 2,
        behavior: 'smooth'
      });
    }
  };

  

  const [editedData, setEditedData] = useState<ProfileData | null>(null);
  
  // Update editedData when profileData changes
  useEffect(() => {
    if (profileData) {
      setEditedData(profileData);
    }
  }, [profileData]);
  


  // Semester date logic (matching HomePage logic)
  const getSemestersFromCode = (semesterCode: string): string[] => {
    switch (semesterCode) {
      case 'FA': return ['FA'];
      case 'WI': return ['WI'];
      case 'SP': return ['SP'];
      case 'WS': return ['WI', 'SP'];
      default: return [];
    }
  };

  const courseMatchesSemester = (courseTerm: string, selectedSemester: 'FA' | 'WI' | 'SP'): boolean => {
    if (!courseTerm || courseTerm === 'TBD') return false;
    const semesterCode = courseTerm.slice(-2);
    const semesters = getSemestersFromCode(semesterCode);
    return semesters.includes(selectedSemester);
  };

  // Determine current semester by date
  const getCurrentTermByDate = (): 'FA' | 'WI' | 'SP' => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    // Fall: September 2 - November 25
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      return 'FA';
    }
    // Winter: January 5 - January 21
    if (month === 1 && day >= 5 && day <= 21) {
      return 'WI';
    }
    // Spring: January 26 - April 24
    if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      return 'SP';
    }
    // Default to Fall
    return 'FA';
  };

  // Get current semester
  const currentSemester = getCurrentTermByDate();

  // Convert profileData.schedule to array format for the new schedule display
  // Filter to only show courses for the current semester
  const weekSchedule = profileData ? [
    (profileData.schedule['Monday'] || []).filter((classItem: any) => 
      classItem.semester ? courseMatchesSemester(classItem.semester, currentSemester) : true
    ),
    (profileData.schedule['Tuesday'] || []).filter((classItem: any) => 
      classItem.semester ? courseMatchesSemester(classItem.semester, currentSemester) : true
    ),
    (profileData.schedule['Wednesday'] || []).filter((classItem: any) => 
      classItem.semester ? courseMatchesSemester(classItem.semester, currentSemester) : true
    ),
    (profileData.schedule['Thursday'] || []).filter((classItem: any) => 
      classItem.semester ? courseMatchesSemester(classItem.semester, currentSemester) : true
    ),
    (profileData.schedule['Friday'] || []).filter((classItem: any) => 
      classItem.semester ? courseMatchesSemester(classItem.semester, currentSemester) : true
    )
  ] : [];

  const handleEdit = () => {
    if (profileData) {
    setEditedData(profileData);
    setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editedData || !user?.id) return;

    try {
      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editedData.name,
          bio: editedData.bio,
          summer_firm: editedData.firm,
          summer_city: editedData.city,
          instagram: editedData.instagram,
          linkedin: editedData.linkedin,
          clubs_activities: editedData.clubMemberships,
          age: editedData.age,
          hometown: editedData.hometown,
          under_grad: editedData.underGrad || null,
          clubs_visibility: editedData.clubs_visibility,
          courses_visibility: editedData.courses_visibility,
          schedule_visibility: editedData.schedule_visibility
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        alert('Error updating profile. Please try again.');
        return;
      }

      // Update local state
    setProfileData(editedData);
    setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    }
  };

  // Handle visibility toggle changes immediately
  const handleVisibilityChange = async (field: 'clubs_visibility' | 'courses_visibility' | 'schedule_visibility', value: boolean) => {
    if (!user?.id) return;
    
    // Only allow changes when directly accessing own profile (no studentName param means direct /profile access)
    const isOwnProfile = !studentName && profileData && profileData.email === user.email;
    if (!isOwnProfile) return;

    try {
      // Update in database immediately
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating visibility:', error);
        return;
      }

      // Update local state
      if (isEditing && editedData) {
        setEditedData({ ...editedData, [field]: value });
      }
      if (profileData) {
        setProfileData({ ...profileData, [field]: value });
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleCancel = () => {
    if (profileData) {
    setEditedData(profileData);
    setIsEditing(false);
    }
  };

  const handleRedoOnboarding = () => {
    if (showRedoConfirm) {
      // If popup is already open, close it
      setShowRedoConfirm(false);
    } else {
      // If popup is closed, open it
      setShowRedoConfirm(true);
    }
  };

  const confirmRedoOnboarding = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ classes_filled: false })
        .eq('id', user.id);

      if (error) {
        console.error('Error resetting onboarding:', error);
        alert('Error resetting onboarding. Please try again.');
        return;
      }

      // Reload the page to trigger onboarding flow
      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      alert('Error resetting onboarding. Please try again.');
    }
  };

  // Complete onboarding without decrementing quota (used when no current courses)
  const completeOnboardingNoDecrement = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ classes_filled: false })
        .eq('id', user.id);
      if (error) {
        console.error('Error resetting onboarding:', error);
        alert('Error resetting onboarding. Please try again.');
        return;
      }
      window.location.reload();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      alert('Error resetting onboarding. Please try again.');
    }
  };

  const cancelRedoOnboarding = () => {
    setShowRedoConfirm(false);
  };

  // Avatar delete function
  const handleDeleteAvatar = async () => {
    if (!user?.id || !profileData?.avatar_url) return;

    try {
      // Extract filename (handles both old full URL format and new filename format)
      const fileName = extractFilename(profileData.avatar_url);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('Avatar')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting avatar from storage:', deleteError);
        alert('Error deleting avatar from storage. Please try again.');
        return;
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        alert('Error updating profile. Please try again.');
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: '' } : prev);
      setAvatarUrl(null);
      
      // Reset the file input
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      alert('Error deleting avatar. Please try again.');
    }
  };

  // Avatar upload function
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be less than 8MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Delete existing avatar if it exists
      if (profileData?.avatar_url) {
        const oldFileName = extractFilename(profileData.avatar_url);
        
        const { error: deleteError } = await supabase.storage
          .from('Avatar')
          .remove([oldFileName]);
          
        if (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Compress avatar image
      const compressedFile = await compressAvatarImage(file);
      
      // Create unique filename
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('Avatar')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
        alert(`Error uploading avatar: ${uploadError.message}. Please check the console for details.`);
        return;
      }

      // Store just the filename (not full URL) since bucket is now private
      const avatarFileName = fileName;

      // Update profile with just filename
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarFileName })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating avatar URL:', updateError);
        console.error('Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        alert(`Error updating profile: ${updateError.message}. Please check the console for details.`);
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: avatarFileName } : null);
      
      // Generate signed URL for new avatar
      const signedUrl = await getStorageUrl(avatarFileName, 'Avatar');
      setAvatarUrl(signedUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      if (error instanceof Error && error.message && error.message.includes('timeout')) {
        alert('Error: Image is too large or complex to process. Please try a smaller image.');
      } else {
        alert('Error uploading avatar. Please try again.');
      }
    } finally {
      setUploadingAvatar(false);
      // Reset the file input
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Photo upload function with compression
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user?.id) return;
    
    // Only allow upload when directly accessing own profile (no studentName param)
    const isOwnProfile = !studentName && profileData && profileData.email === user.email;
    if (!isOwnProfile) return;

    // Check if user already has 12 photos
    if (profileData?.photo_urls && profileData.photo_urls.length >= 12) {
      alert('You can only upload up to 12 photos');
      return;
    }

    setUploadingPhotos(true);
    
    try {
      const newPhotoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 8MB before compression)
        if (file.size > 8 * 1024 * 1024) {
          alert(`File ${file.name} is too large (max 8MB)`);
          continue;
        }

        try {
          // Compress image
          const compressedFile = await compressImage(file);
          
          // Create unique filename
          const fileExt = compressedFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('Photos')
            .upload(fileName, compressedFile);

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            alert(`Error uploading ${file.name}: ${uploadError.message}`);
            continue;
          }

          // Store just the filename (not full URL) since bucket is now private
          newPhotoUrls.push(fileName);
          
          // Generate signed URL for new photo and add to state
          const signedUrl = await getStorageUrl(fileName, 'Photos');
          if (signedUrl) {
            setPhotoUrls(prev => ({ ...prev, [(profileData.photo_urls?.length || 0) + newPhotoUrls.length - 1]: signedUrl }));
          }
        } catch (compressionError) {
          console.error(`Error compressing ${file.name}:`, compressionError);
          alert(`Error processing ${file.name}. Please try a different image.`);
          continue;
        }
      }

      if (newPhotoUrls.length > 0) {
        // Update profile with new photo URLs
        const updatedPhotoUrls = [...(profileData?.photo_urls || []), ...newPhotoUrls];
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ photo_urls: updatedPhotoUrls })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating photo URLs:', updateError);
          alert('Error updating profile. Please try again.');
          return;
        }

        // Update local state
        setProfileData(prev => prev ? { ...prev, photo_urls: updatedPhotoUrls } : null);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
      // Reset the file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Photo delete function
  const handleDeletePhoto = async (photoUrl: string) => {
    if (!user?.id || !profileData?.photo_urls) return;
    
    // Only allow deletion when directly accessing own profile (no studentName param)
    const isOwnProfile = !studentName && profileData && profileData.email === user.email;
    if (!isOwnProfile) return;

    try {
      // Extract filename (handles both old full URL format and new filename format)
      const fileName = extractFilename(photoUrl);
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('Photos')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting photo from storage:', deleteError);
        alert('Error deleting photo from storage. Please try again.');
        return;
      }

      // Extract filename from photoUrl (handles both old full URL format and new filename format)
      const photoFilename = extractFilename(photoUrl);
      
      // Update profile to remove photo URL (match by filename)
      const updatedPhotoUrls = profileData.photo_urls.filter(url => {
        const storedFilename = extractFilename(url);
        return storedFilename !== photoFilename;
      });
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_urls: updatedPhotoUrls })
        .eq('id', user.id);
      
      // Update local photoUrls state
      const photoIndex = profileData.photo_urls.findIndex(url => extractFilename(url) === photoFilename);
      if (photoIndex !== -1) {
        setPhotoUrls(prev => {
          const updated = { ...prev };
          delete updated[photoIndex];
          return updated;
        });
      }

      if (updateError) {
        console.error('Error updating profile:', updateError);
        alert('Error updating profile. Please try again.');
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, photo_urls: updatedPhotoUrls } : null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo. Please try again.');
    }
  };

  // Image compression function for photos
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Compression timeout - image too large or complex'));
      }, 30000); // 30 second timeout
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 800px width/height)
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to target size (2MB for optimal cost savings)
          const targetSize = 2 * 1024 * 1024; // 2MB in bytes
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  // If size is acceptable or quality is too low, use this result
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  compressToTargetSize(currentQuality - 0.1);
                }
              } else {
                clearTimeout(timeout);
                resolve(file);
              }
            }, 'image/jpeg', currentQuality);
          };
          
          compressToTargetSize(quality);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Avatar compression function (targets 500KB, maintains original ratio)
  const compressAvatarImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Avatar compression timeout - image too large or complex'));
      }, 30000); // 30 second timeout
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 400px on the longest side, maintain original ratio)
          const maxSize = 400;
          let { width, height } = img;
          
          // Maintain original aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress (maintains original aspect ratio)
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to target size (500KB for avatars)
          const targetSize = 500 * 1024; // 500KB in bytes
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  // If size is acceptable or quality is too low, use this result
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  compressToTargetSize(currentQuality - 0.1);
                }
              } else {
                clearTimeout(timeout);
                resolve(file);
              }
            }, 'image/jpeg', currentQuality);
          };
          
          compressToTargetSize(quality);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if no profile data
  if (!profileData) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAF5EF' }}>
      <style>{`
        /* Visibility toggle custom colors */
        .visibility-toggle-wrapper .switch + label::before {
          background-color: #ef4444 !important;
        }
        
        .visibility-toggle-wrapper .switch:checked + label::before {
          background-color: #04913A !important;
        }
        
        .golden-quad-logo {
          position: relative;
          overflow: hidden;
          background: #ffd700;
          border-radius: 0.5rem;
          padding: 0.25rem 0.75rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: 0.5s;
          display: flex;
          align-items: center;
          justify-content: center;
          height: fit-content;
        }
        
        
        .golden-quad-logo::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.55),
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
          z-index: 1;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
      <div className="max-w-6xl mx-auto p-4 pb-8 space-y-6">
        {/* Back Button - Only show when viewing student profile */}
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-2 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        )}
        
        {/* Header Card */}
        <div className="bg-white shadow-sm p-6" style={{ borderRadius: '20px' }}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with Upload */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto"
                   style={{ backgroundColor: profileData?.avatar_url ? undefined : getDefaultAvatarColor(profileData?.email || profileData?.name) }}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="h-auto object-contain rounded-full border-4 border-[#f8f5ed]"
                    style={{ maxWidth: '96px', maxHeight: '96px' }}
                  />
                ) : (
                  <div className="w-24 h-24 text-2xl font-medium text-white flex items-center justify-center rounded-full border-4 border-[#f8f5ed]">
                  {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
              </div>
              {isEditing && !studentName && profileData && profileData.email === user?.email && (
                <div className="flex flex-col gap-2 mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingAvatar}
                  />
                <Button 
                  size="sm" 
                    variant="outline"
                    className="text-xs px-3 py-1 h-7"
                    disabled={uploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {uploadingAvatar ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>{profileData.avatar_url ? 'Change Avatar' : 'Add Avatar'}</span>
                      </div>
                    )}
                  </Button>
                  {profileData.avatar_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={handleDeleteAvatar}
                    >
                      <div className="flex items-center gap-1">
                        <X className="w-3 h-3" />
                        <span>Delete Avatar</span>
                      </div>
                </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Name and Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-3 gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                      <Input
                        value={editedData?.name || ''}
                        onChange={(e) => editedData && setEditedData({ ...editedData, name: e.target.value })}
                        className="text-3xl font-bold border-0 bg-transparent p-0 h-auto"
                        placeholder="Enter your name"
                      />
                    ) : (
                    <h1 className="text-gray-900 text-3xl">{profileData.name}</h1>
                    )}
                    <Badge className="border-0 text-white" style={{ backgroundColor: '#752432' }}>
                      {profileData.year}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  {!isEditing ? (
                    <>
                      {/* Show Match button when viewing someone else's profile */}
                      {studentName && profileData && profileData.email !== user?.email && (
                        <MatchButton 
                          studentName={profileData.name}
                          receiverId={profileData.id}
                          isMatchSent={matchSent}
                          onMatchSent={() => {
                            setMatchSent(true);
                          }}
                          onMatchUnsent={() => {
                            setMatchSent(false);
                          }}
                        />
                      )}
                      {/* Show Edit button only when directly accessing own profile (no studentName param) */}
                      {(!studentName && profileData && profileData.email === user?.email) && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button onClick={() => setMatchInboxOpen(true)} variant="outline" size="sm" className="gap-2 text-xs px-3 py-1 h-7">
                              <Heart className="w-4 h-4" style={{ fill: '#ef4444', color: '#ef4444' }} />
                              Match Inbox
                            </Button>
                            <Button onClick={handleEdit} variant="outline" size="sm" className="gap-2 text-xs px-3 py-1 h-7" style={{ width: '120px' }}>
                              <Edit className="w-4 h-4" />
                              Edit Profile
                            </Button>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {profileData.currentCourses.length === 0 ? (
                              <Button 
                                ref={setRedoButtonRef}
                                onClick={completeOnboardingNoDecrement}
                                variant="outline" 
                                size="sm"
                                className="gap-2 text-xs px-3 py-1 h-7"
                                style={{ width: '120px' }}
                              >
                                Complete Onboarding
                              </Button>
                            ) : (
                            <Button 
                              ref={setRedoButtonRef}
                              onClick={handleRedoOnboarding} 
                              variant="outline" 
                                size="sm"
                                className="gap-2 text-blue-600 border-blue-600 text-xs px-3 py-1 h-7"
                                style={{ 
                                  backgroundColor: 'rgba(59, 130, 246, 0.4)',
                                  borderColor: 'rgb(37, 99, 235)',
                                  width: '120px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
                                }}
                            >
                              <RotateCcw className="w-4 h-4" />
                              Edit Courses
                              </Button>
                            )}
                            {/* Sign out under redo/completion button */}
                            <Button 
                              onClick={() => signOut()} 
                              variant="outline" 
                              size="sm"
                              className="gap-2 text-xs px-3 py-1 h-7"
                              style={{ width: '120px' }}
                            >
                              Sign out
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="gap-2 text-white hover:opacity-90" style={{ backgroundColor: '#752432' }}>
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                  <Textarea
                    value={editedData?.bio || ''}
                    onChange={(e) => editedData && setEditedData({ ...editedData, bio: e.target.value })}
                    className="min-h-20"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  profileData.bio && profileData.bio.trim() !== '' && (
                  <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                  )
                )}
              </div>

              {/* Firm and City Fields */}
              <div className="mb-4 space-y-2">
                {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 min-w-[60px] font-extrabold">Firm:</span>
                      <Input
                        value={editedData?.firm || ''}
                        onChange={(e) => editedData && setEditedData({ ...editedData, firm: e.target.value })}
                        placeholder="e.g., Cravath"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 min-w-[60px] font-extrabold">City:</span>
                      <Input
                        value={editedData?.city || ''}
                        onChange={(e) => editedData && setEditedData({ ...editedData, city: e.target.value })}
                        placeholder="e.g., New York"
                        className="flex-1"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {profileData.firm && profileData.firm.trim() !== '' && (
                    <div className="text-gray-700">
                        <span className="text-gray-900 font-bold">Firm:</span> {profileData.firm}
                    </div>
                    )}
                    {profileData.city && profileData.city.trim() !== '' && (
                    <div className="text-gray-700">
                        <span className="text-gray-900 font-bold">City:</span> {profileData.city}
                    </div>
                    )}
                  </>
                )}
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center gap-2 mb-3">
                {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src="/Instagram_Glyph_Gradient.png" 
                      alt="Instagram" 
                      className="h-6 w-auto" 
                    />
                    <Input
                      value={editedData?.instagram || ''}
                      onChange={(e) => editedData && setEditedData({ ...editedData, instagram: e.target.value })}
                      className="text-base h-8 px-2 w-48"
                      placeholder="Instagram URL"
                    />
              </div>
                ) : (
                  profileData.instagram && profileData.instagram.trim() !== '' && (
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={() => {
                        const raw = (profileData.instagram || '').trim();
                        if (!raw) return;
                        let url = '';
                        if (/^https?:\/\//i.test(raw)) {
                          url = raw;
                        } else if (/^www\./i.test(raw)) {
                          url = `https://${raw}`;
                        } else if (/instagram\.com/i.test(raw)) {
                          url = `https://${raw.replace(/^https?:\/\//i, '')}`;
                        } else {
                          const handle = raw.replace(/^@+/, '');
                          if (handle) url = `https://instagram.com/${handle}`;
                        }
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <img 
                        src="/Instagram_Glyph_Gradient.png" 
                        alt="Instagram" 
                        className="h-6 w-auto" 
                      />
                    </div>
                  )
                )}
                
                {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src="/LI-In-Bug.png" 
                      alt="LinkedIn" 
                      className="h-6 w-auto" 
                    />
                    <Input
                      value={editedData?.linkedin || ''}
                      onChange={(e) => editedData && setEditedData({ ...editedData, linkedin: e.target.value })}
                      className="text-base h-8 px-2 w-48"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                ) : (
                  profileData.linkedin && profileData.linkedin.trim() !== '' && (
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={() => {
                        if (profileData.linkedin) {
                          const url = profileData.linkedin.startsWith('http') 
                            ? profileData.linkedin 
                            : `https://${profileData.linkedin}`;
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <img 
                        src="/LI-In-Bug.png" 
                        alt="LinkedIn" 
                        className="h-6 w-auto" 
                      />
                    </div>
                  )
                )}
              </div>

              {/* Stats and Info Pills */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">🎂</span>
                          <span className="text-xs">Age:</span>
                          <Input
                            type="text"
                            value={editedData?.age || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow numbers
                              if (value === '' || /^\d+$/.test(value)) {
                                editedData && setEditedData({ 
                                  ...editedData, 
                                  age: value === '' ? null : parseInt(value) 
                                });
                              }
                            }}
                            className="w-16 h-6 text-xs px-1"
                            placeholder="Age"
                            maxLength={3}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">🏡</span>
                          <span className="text-xs">From:</span>
                          <Input
                            value={editedData?.hometown || ''}
                            onChange={(e) => editedData && setEditedData({ ...editedData, hometown: e.target.value })}
                            className="w-24 h-6 text-xs px-1"
                            placeholder="City, State"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">🎓</span>
                          <Input
                            value={editedData?.underGrad || ''}
                            onChange={(e) => editedData && setEditedData({ ...editedData, underGrad: e.target.value })}
                            className="w-32 h-6 text-xs px-1"
                            placeholder="Harvard University"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {profileData.age && profileData.age > 0 && (
                    <Badge variant="secondary" className="px-3 py-1">
                      🎂 {profileData.age} years old
                    </Badge>
                        )}
                        {profileData.hometown && profileData.hometown.trim() !== '' && (
                    <Badge variant="secondary" className="px-3 py-1">
                            🏡 From {profileData.hometown}
                    </Badge>
                        )}
                        {profileData.underGrad && profileData.underGrad.trim() !== '' && (
                    <Badge variant="secondary" className="px-3 py-1">
                            🎓 {profileData.underGrad}
                    </Badge>
                        )}
                        {/* Gold Quad Logo Button for Special Users */}
                        {profileData.email && ['justin031607@gmail.com', 'jabbey@jd26.law.harvard.edu', 'lnassif@jd26.law.harvard.edu'].includes(profileData.email.toLowerCase()) && (
                          <div className="golden-quad-logo">
                            <span className="text-sm font-semibold text-gray-900" style={{ position: 'relative', zIndex: 2 }}>
                              Quadfathers
                            </span>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Column - Narrower */}
          <div className="space-y-4" style={{ width: '30%' }}>
            {/* Clubs */}
            {(isEditing ? true : profileData?.clubs_visibility) && (
              <div className="relative">
                {isEditing && !studentName && profileData && profileData.email === user?.email && (
                  <div className="checkbox-wrapper-35 visibility-toggle-wrapper" style={{ transform: 'scale(0.75) translateX(0)', transformOrigin: 'right center', position: 'absolute', left: 'calc(100% - 135px)', top: '12px', zIndex: 10 }}>
                    <input 
                      type="checkbox" 
                      id="clubs-visibility-toggle" 
                      className="switch"
                      checked={isEditing ? (editedData?.clubs_visibility ?? true) : (profileData?.clubs_visibility ?? true)}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        if (isEditing && editedData) {
                          setEditedData({ ...editedData, clubs_visibility: newValue });
                        }
                        handleVisibilityChange('clubs_visibility', newValue);
                      }}
                    />
                    <label htmlFor="clubs-visibility-toggle">
                      <span className="switch-x-toggletext">
                        <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Hidden</span>
                        <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>Visible</span>
                      </span>
                    </label>
                  </div>
                )}
                <div className={`bg-white shadow-sm p-6 transition-opacity ${isEditing && !editedData?.clubs_visibility ? 'opacity-40 grayscale' : ''}`} style={{ borderRadius: '20px' }}>
                  <div className="flex items-center mb-3">
                    <h3 className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" style={{ color: '#752432' }} />
                      Clubs & Activities
                    </h3>
                  </div>
              {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                <ClubsAndActivities
                  selectedClubs={editedData?.clubMemberships || []}
                  onClubsChange={(clubs) => editedData && setEditedData({ ...editedData, clubMemberships: clubs })}
                  label=""
                />
              ) : (
                <div className="space-y-2">
                  {profileData.clubMemberships.map((club, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-gray-400">•</span>
                      <span>{club}</span>
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            )}

            {/* Current Courses - Compact */}
            {(isEditing ? true : profileData?.courses_visibility) && (
              <div className="relative">
                {isEditing && !studentName && profileData && profileData.email === user?.email && (
                  <div className="checkbox-wrapper-35 visibility-toggle-wrapper" style={{ transform: 'scale(0.75) translateX(0)', transformOrigin: 'right center', position: 'absolute', left: 'calc(100% - 135px)', top: '12px', zIndex: 10 }}>
                    <input 
                      type="checkbox" 
                      id="courses-visibility-toggle" 
                      className="switch"
                      checked={isEditing ? (editedData?.courses_visibility ?? true) : (profileData?.courses_visibility ?? true)}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        if (isEditing && editedData) {
                          setEditedData({ ...editedData, courses_visibility: newValue });
                        }
                        handleVisibilityChange('courses_visibility', newValue);
                      }}
                    />
                    <label htmlFor="courses-visibility-toggle">
                      <span className="switch-x-toggletext">
                        <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Hidden</span>
                        <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>Visible</span>
                      </span>
                    </label>
                  </div>
                )}
                <div className={`bg-white shadow-sm p-6 transition-opacity ${isEditing && !editedData?.courses_visibility ? 'opacity-40 grayscale' : ''}`} style={{ borderRadius: '20px' }}>
                  <div className="flex items-center mb-3">
                    <h3 className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" style={{ color: '#752432' }} />
                      Current Courses
                    </h3>
                  </div>
                <div className="space-y-2 mt-2">
                  {profileData.currentCourses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 mb-3">No current courses added yet.</p>
                      {!studentName && profileData && profileData.email === user?.email && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2"
                          onClick={completeOnboardingNoDecrement}
                        >
                          Complete Onboarding
                        </Button>
                      )}
                    </div>
                  ) : (
                    profileData.currentCourses.map((course, index) => (
                    <div key={index} className="text-sm py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-gray-900">{course.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{course.professor}</div>
                    </div>
                    ))
                  )}
                </div>
                </div>
              </div>
            )}

            {/* Weekly Schedule - Vertical */}
            {(isEditing ? true : profileData?.schedule_visibility) && (
              <div className="relative">
                {isEditing && !studentName && profileData && profileData.email === user?.email && (
                  <div className="checkbox-wrapper-35 visibility-toggle-wrapper" style={{ transform: 'scale(0.75) translateX(0)', transformOrigin: 'right center', position: 'absolute', left: 'calc(100% - 135px)', top: '12px', zIndex: 10 }}>
                    <input 
                      type="checkbox" 
                      id="schedule-visibility-toggle" 
                      className="switch"
                      checked={isEditing ? (editedData?.schedule_visibility ?? true) : (profileData?.schedule_visibility ?? true)}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        if (isEditing && editedData) {
                          setEditedData({ ...editedData, schedule_visibility: newValue });
                        }
                        handleVisibilityChange('schedule_visibility', newValue);
                      }}
                    />
                    <label htmlFor="schedule-visibility-toggle">
                      <span className="switch-x-toggletext">
                        <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Hidden</span>
                        <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>Visible</span>
                      </span>
                    </label>
                  </div>
                )}
                <div className={`bg-white shadow-sm p-6 transition-opacity ${isEditing && !editedData?.schedule_visibility ? 'opacity-40 grayscale' : ''}`} style={{ borderRadius: '20px' }}>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: '#752432' }} />
                      <h3>This Week's Schedule</h3>
                    </div>
                  </div>

              {/* Day Navigation - Single Day with Arrows */}
              <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-3">
                <button
                  onClick={handlePrevDay}
                  disabled={selectedDayIndex === 0}
                  className={`p-1.5 rounded-lg transition-all ${
                    selectedDayIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center flex-1">
                  <div className="text-gray-900">{weekDays[selectedDayIndex].dayName}</div>
                </div>
                
                <button
                  onClick={handleNextDay}
                  disabled={selectedDayIndex === weekDays.length - 1}
                  className={`p-1.5 rounded-lg transition-all ${
                    selectedDayIndex === weekDays.length - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Day's Schedule */}
              <div>
                <div className="space-y-3">
                  {weekSchedule[selectedDayIndex] && weekSchedule[selectedDayIndex].length > 0 ? (
                    sortClassesByTime(weekSchedule[selectedDayIndex]).map((classItem, classIndex) => (
                      <div
                        key={classIndex}
                        className="pl-6 border-l-4 py-2 bg-gray-50 rounded-r-lg"
                        style={{ borderLeftColor: getCourseColor(classItem.course, classIndex) }}
                      >
                        <div className="text-sm text-gray-900 mb-1 ml-3">
                          {classItem.course}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5 ml-3">
                          <Clock className="w-3 h-3" />
                          {classItem.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 ml-3">
                          <MapPin className="w-3 h-3" />
                          {classItem.location}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic py-4 text-center bg-gray-50 rounded-lg">
                      No classes scheduled
                    </div>
                  )}
                </div>
              </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Wider */}
          <div className="flex-1 space-y-4" style={{ width: '70%' }}>
            {/* Photo Gallery */}
            <div className="bg-white shadow-sm p-6" style={{ borderRadius: '20px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2">
                  Photos
                </h3>
                {!studentName && profileData && profileData.email === user?.email && (
                  <>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 rounded-full"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploadingPhotos || (profileData.photo_urls?.length || 0) >= 12}
                    >
                      {uploadingPhotos ? (
                        <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                    <Plus className="w-3 h-3" />
                      )}
                    New
                  </Button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Display actual photos */}
                {profileData.photo_urls && profileData.photo_urls.length > 0 ? (
                  profileData.photo_urls.map((photoUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      {(!studentName || studentName === user?.email || (profileData && profileData.email === user?.email)) ? (
                        <div
                          onClick={() => handleDeletePhoto(photoUrl)}
                          className="cursor-pointer relative"
                        >
                          <img 
                            src={photoUrls[index] || ''} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover hover:shadow-md transition-shadow"
                            onError={() => {
                              // Try to regenerate signed URL if it expired
                              getStorageUrl(photoUrl, 'Photos').then(url => {
                                if (url) {
                                  setPhotoUrls(prev => ({ ...prev, [index]: url }));
                                }
                              });
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                              <X className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={photoUrls[index] || ''} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => {
                            // Try to regenerate signed URL if it expired
                            getStorageUrl(photoUrl, 'Photos').then(url => {
                              if (url) {
                                setPhotoUrls(prev => ({ ...prev, [index]: url }));
                              }
                            });
                          }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  /* Show placeholder when no photos */
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center"
                  >
                    {i === 5 && (
                      <span className="text-sm text-gray-500 italic">No photos added</span>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Courses Confirmation Popup */}
      {showRedoConfirm && redoButtonRef && (
        <div 
          className="fixed inset-0 z-50"
          onClick={cancelRedoOnboarding}
        >
          {/* Popup positioned under the button */}
          <div 
            className="absolute bg-white border border-blue-200/30 rounded-lg p-4 shadow-lg pointer-events-auto"
            style={{
              top: redoButtonRef.offsetTop + redoButtonRef.offsetHeight + 8,
              right: '20px',
              width: '200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Edit Courses
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              This will let you update your class year, section, and courses. All other profile information will be kept.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={cancelRedoOnboarding} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmRedoOnboarding}
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 border-blue-600"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.4)',
                  borderColor: 'rgb(37, 99, 235)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
                }}
              >
                Yes, Edit
              </Button>
            </div>
          </div>
        </div>
      )}
      <MatchInbox open={matchInboxOpen} onOpenChange={setMatchInboxOpen} />
    </div>
  );
}
