import React, { useState, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { 
  Upload, Mail, Calendar, Clock, MapPin, Plus, Trash2, Edit2, X, Check, 
  Users, Search, User, Target, ExternalLink, Globe, LogOut, Heart, MessageCircle, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStorageUrl, extractFilename } from '../utils/storage';
import { ExpandableText } from './ui/expandable-text';
import { ConfirmationPopup } from './ui/confirmation-popup';

// Types
export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  rsvps: string[]; // Array of user UUIDs who have RSVPed
}

export interface Member {
  id: string;
  name: string;
  picture: string;
  bio: string;
  role: string;
  email: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  author_id: string;
  course_id?: string | null;
  post_type: 'text' | 'poll' | 'youtube';
  is_anonymous: boolean;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  likes_count: number;
  comments_count: number;
  photo_url?: string | null;
  vid_link?: string | null;
  author?: {
    name: string;
    year: string;
  };
  course?: {
    name: string;
  };
  isLiked?: boolean;
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    totalVotes: number;
    userVotedOptionId?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  likes_count: number;
  author?: {
    name: string;
    year: string;
  };
  isLiked?: boolean;
  replies?: Comment[];
  isClubAccount?: boolean; // Flag to indicate if author is a club account (no profile page)
}

export interface ClubFormData {
  picture: string;
  name: string;
  description: string;
  tag: string;
  missionPurpose: string;
  email: string;
  website: string;
  events: Event[];
  members: Member[];
  posts: Post[];
}

// ClubBasicInfo Component
function ClubBasicInfo({ formData, updateFormData, onSaveBasicInfo, onSaveMission, onSaveContact, savingBasicInfo, savingMission, savingContact, onAvatarUploaded, onAvatarDeleted, currentAvatarUrl, uploadingAvatar, setUploadingAvatar, hasBasicInfoChanges, hasMissionChanges, hasContactChanges }: { formData: ClubFormData; updateFormData: (field: keyof ClubFormData, value: any) => void; onSaveBasicInfo: () => void; onSaveMission: () => void; onSaveContact: () => void; savingBasicInfo: boolean; savingMission: boolean; savingContact: boolean; onAvatarUploaded: (fileName: string) => void; onAvatarDeleted: () => void; currentAvatarUrl: string | null; uploadingAvatar: boolean; setUploadingAvatar: (uploading: boolean) => void; hasBasicInfoChanges: boolean; hasMissionChanges: boolean; hasContactChanges: boolean }) {
  const compressAvatarImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Avatar compression timeout - image too large or complex'));
      }, 30000);
      
      img.onload = () => {
        try {
          const maxSize = 400;
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
          ctx?.drawImage(img, 0, 0, width, height);
          
          const targetSize = 500 * 1024;
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  compressToTargetSize(currentQuality - 0.1);
                }
              } else {
                clearTimeout(timeout);
                reject(new Error('Failed to compress image'));
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

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be less than 8MB');
      return;
    }

    // Get current user first (like profile page)
    const { data: { user } } = await supabase.auth.getUser();
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    try {
      // Delete existing avatar if it exists (from database)
      if (currentAvatarUrl) {
        const oldFileName = extractFilename(currentAvatarUrl);
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
      
      // Upload to Supabase Storage immediately
      const { error: uploadError } = await supabase.storage
        .from('Avatar')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError.message || 'Unknown error');
        toast.error(`Error uploading avatar: ${uploadError.message}. Please check the console for details.`);
        return;
      }

      // Store just the filename (not full URL) since bucket is private
      const avatarFileName = fileName;

      // Update club account immediately
      const { error: updateError } = await supabase
        .from('club_accounts')
        .update({ avatar_url: avatarFileName })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating avatar URL:', updateError.message || 'Unknown error');
        toast.error(`Error updating club account: ${updateError.message}. Please check the console for details.`);
        return;
      }

      // Update local state
      onAvatarUploaded(avatarFileName);
      
      // Generate signed URL for new avatar
      const signedUrl = await getStorageUrl(avatarFileName, 'Avatar');
      if (signedUrl) {
        updateFormData('picture', signedUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.message && error.message.includes('timeout')) {
        toast.error('Error: Image is too large or complex to process. Please try a smaller image.');
      } else {
        toast.error('Error uploading avatar. Please try again.');
      }
    } finally {
      setUploadingAvatar(false);
      // Reset the file input
      const fileInput = document.getElementById('club-picture') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Extract filename
      const fileName = extractFilename(currentAvatarUrl);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('Avatar')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting avatar from storage:', deleteError);
        toast.error('Error deleting avatar from storage. Please try again.');
        return;
      }

      // Update club account to remove avatar URL
      const { error: updateError } = await supabase
        .from('club_accounts')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating club account:', updateError);
        toast.error('Error updating club account. Please try again.');
        return;
      }

      // Update local state
      updateFormData('picture', '');
      onAvatarDeleted();
      
      // Reset the file input
      const fileInput = document.getElementById('club-picture') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      toast.success('Avatar deleted successfully!');
    } catch (error) {
      console.error('Error deleting avatar:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Error deleting avatar. Please try again.');
    }
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 1000) {
      updateFormData('description', e.target.value);
    }
  };

  const charCount = formData.description.length;

  return (
    <div className="space-y-6 h-full">
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '24px', flexWrap: 'nowrap', width: '100%', maxWidth: '100%', overflowX: 'hidden', justifyContent: 'center' }}>
        <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fefbf6', flex: '1 1 0', minWidth: 0, maxWidth: '570px' }}>
          <div className="flex items-start gap-4">
            <div>
              <Label htmlFor="club-picture">Club Picture *</Label>
              <div className="mt-2">
                <div className="flex flex-col items-center">
                  {formData.picture ? (
                    <div 
                      className="w-64 h-64 rounded-full border-2 overflow-hidden mb-4"
                      style={{ borderColor: '#5a3136' }}
                    >
                      <img 
                        src={formData.picture} 
                        alt="Club" 
                        className="w-full h-full"
                        style={{ 
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center mb-4 rounded-full border-2" style={{ borderColor: '#5a3136', backgroundColor: '#fefafb' }}>
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="club-picture"
                      disabled={savingBasicInfo || uploadingAvatar}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs px-3 py-1 h-7"
                      disabled={savingBasicInfo || uploadingAvatar}
                      onClick={() => document.getElementById('club-picture')?.click()}
                    >
                      {uploadingAvatar ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{formData.picture ? 'Change Avatar' : 'Add Avatar'}</span>
                        </div>
                      )}
                    </Button>
                    {formData.picture && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-3 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={handleDeleteAvatar}
                        disabled={savingBasicInfo || uploadingAvatar}
                      >
                        <div className="flex items-center gap-1">
                          <X className="w-3 h-3" />
                          <span>Delete Avatar</span>
                        </div>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="w-full">
              <Label htmlFor="club-name">Club Name *</Label>
              <Input
                id="club-name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter your club name"
                className="mt-2 bg-white w-full"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div className="w-full">
              <Label htmlFor="club-tag">Club Tag *</Label>
              <Select value={formData.tag} onValueChange={(value) => updateFormData('tag', value)}>
                <SelectTrigger id="club-tag" className="mt-2 bg-white w-full">
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student-practice">Student Practice Organization</SelectItem>
                  <SelectItem value="student-org">Student Organization</SelectItem>
                  <SelectItem value="journal">Journal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Label htmlFor="club-description">Club Description *</Label>
              <Textarea
                id="club-description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Brief description of your club"
                className="mt-2 bg-white w-full"
                style={{ minHeight: '160px', fontSize: '14px' }}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {charCount}/1000 characters
              </p>
            </div>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button 
              onClick={onSaveBasicInfo}
              className={`${hasBasicInfoChanges ? 'bg-[#752432] hover:bg-[#5a3136] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={savingBasicInfo || uploadingAvatar || !hasBasicInfoChanges}
            >
              {savingBasicInfo ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 0', minWidth: 0, maxWidth: '450px' }}>
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fefbf6', alignSelf: 'flex-start', width: '100%' }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5" style={{ color: '#752432' }} />
              <h3 className="text-lg font-semibold">Mission & Purpose</h3>
            </div>
            <div>
              <Textarea
                value={formData.missionPurpose}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    updateFormData('missionPurpose', e.target.value);
                  }
                }}
                placeholder="What is your club's mission and purpose? What goals do you hope to achieve?"
                className="bg-white w-full"
                style={{ fontSize: '14px', height: '200px', maxHeight: '200px', maxWidth: '100%', boxSizing: 'border-box', overflowY: 'auto' }}
                maxLength={500}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={onSaveMission}
                className={`${hasMissionChanges ? 'bg-[#752432] hover:bg-[#5a3136] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                disabled={savingMission || !hasMissionChanges}
              >
                {savingMission ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fefbf6', width: '100%' }}>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" style={{ color: '#752432' }} />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-email" className="text-sm font-medium text-gray-900">Email</Label>
                <div className="mt-2 relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="club@university.edu"
                    className="bg-white pl-10"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact-website" className="text-sm font-medium text-gray-900">Website</Label>
                <div className="mt-2 relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="contact-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://yourclub.com"
                    className="bg-white pl-10 pr-8"
                    style={{ fontSize: '14px' }}
                  />
                  <ExternalLink className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={onSaveContact}
                className={`${hasContactChanges ? 'bg-[#752432] hover:bg-[#5a3136] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                disabled={savingContact || !hasContactChanges}
              >
                {savingContact ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ClubEvents Component
function ClubEvents({ formData, updateFormData }: { formData: ClubFormData; updateFormData: (field: keyof ClubFormData, value: any) => void }) {
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Event | null>(null);
  const [originalEventData, setOriginalEventData] = useState<Event | null>(null);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState<string | null>(null);
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState('');
  const [rsvpNames, setRsvpNames] = useState<Record<string, string>>({}); // Map of userId -> fullName

  // Format date string (YYYY-MM-DD) to display format without timezone conversion
  // This ensures the date is displayed exactly as the user entered it
  const formatDateString = (dateString: string): string => {
    if (!dateString) return '';
    // Parse YYYY-MM-DD directly without timezone conversion
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    // Create date in local timezone but use the exact values entered
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Sort events by date and time (earliest first - soonest upcoming events at top)
  const sortedEvents = useMemo(() => {
    return [...formData.events].sort((a, b) => {
      // First compare by date (YYYY-MM-DD format, so string comparison works)
      if (a.date && b.date) {
        const dateCompare = a.date.localeCompare(b.date); // Ascending (earliest first)
        if (dateCompare !== 0) return dateCompare;
        
        // If dates are the same, compare by time (HH:MM format)
        if (a.time && b.time) {
          return a.time.localeCompare(b.time); // Ascending (earliest first)
        }
        // If one has time and other doesn't, prioritize the one with time
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
      }
      // If one has date and other doesn't, prioritize the one with date
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      // If neither has date, maintain original order
      return 0;
    });
  }, [formData.events]);

  // Cleanup: Cancel editing when component unmounts (e.g., switching tabs)
  useEffect(() => {
    return () => {
      if (editingEvent && editFormData) {
        // Component is unmounting - discard unsaved changes
        const existingEvent = formData.events.find(e => e.id === editFormData.id);
        if (!existingEvent) {
          // New event that wasn't saved - discard it
          setEditingEvent(null);
          setEditFormData(null);
          setOriginalEventData(null);
        }
      }
    };
  }, []);

  // Fetch RSVP user names when dialog opens
  useEffect(() => {
    const fetchRsvpNames = async () => {
      if (!rsvpDialogOpen) {
        setRsvpNames({});
        return;
      }

      const event = formData.events.find(e => e.id === rsvpDialogOpen);
      if (!event || event.rsvps.length === 0) {
        setRsvpNames({});
        return;
      }

      try {
        // Fetch profiles for all RSVP user IDs
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', event.rsvps);

        if (error) {
          console.error('Error fetching RSVP names:', error?.message || "Unknown error");
          return;
        }

        // Create a map of userId -> fullName
        const namesMap: Record<string, string> = {};
        data?.forEach((profile: { id: string; full_name: string | null }) => {
          namesMap[profile.id] = profile.full_name || 'Unknown User';
        });

        setRsvpNames(namesMap);
      } catch (err) {
        console.error('Unexpected error fetching RSVP names:', err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchRsvpNames();
  }, [rsvpDialogOpen, formData.events]);

  const addEvent = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      name: '',
      date: '',
      time: '',
      location: '',
      shortDescription: '',
      fullDescription: '',
      rsvps: [] // Array of user UUIDs
    };
    // Don't add to formData yet - only add when Save is clicked
    setEditingEvent(newEvent.id);
    setEditFormData(newEvent);
    setOriginalEventData(null); // New event, no original
  };

  const deleteEvent = async (id: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to delete: User not authenticated');
        return;
      }

      // Update local state first
      const updatedEvents = formData.events.filter(event => event.id !== id);
      updateFormData('events', updatedEvents);

      // Save to database
      const { error } = await supabase
        .from('club_accounts')
        .update({
          events: updatedEvents,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting event:', error?.message || "Unknown error");
        toast.error('Failed to delete event');
        // Revert local state on error
        updateFormData('events', formData.events);
        return;
      }

      toast.success('Event deleted successfully');
      if (editingEvent === id) {
        setEditingEvent(null);
        setEditFormData(null);
      }
    } catch (err) {
      console.error('Unexpected error deleting event:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while deleting');
      // Revert local state on error
      updateFormData('events', formData.events);
    }
  };

  const startEditing = (event: Event) => {
    // Normalize time to HH:MM format (remove seconds if present)
    const normalizedEvent = {
      ...event,
      time: event.time ? event.time.split(':').slice(0, 2).join(':') : ''
    };
    setEditingEvent(event.id);
    setEditFormData(normalizedEvent);
    setOriginalEventData(normalizedEvent); // Store original for cancel
  };

  const saveEditing = async () => {
    if (editFormData) {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          toast.error('Failed to save: User not authenticated');
          return;
        }

        // Normalize time to HH:MM format before saving
        const normalizedEditFormData = {
          ...editFormData,
          time: editFormData.time ? editFormData.time.split(':').slice(0, 2).join(':') : ''
        };

        // Check if this is a new event (not in formData.events yet)
        const existingEvent = formData.events.find(e => e.id === normalizedEditFormData.id);
        let updatedEvents: Event[];
        
        if (existingEvent) {
          // Update existing event
          updatedEvents = formData.events.map(event => 
            event.id === normalizedEditFormData.id ? normalizedEditFormData : event
          );
        } else {
          // Add new event
          updatedEvents = [...formData.events, normalizedEditFormData];
        }

        // Update local state first
        updateFormData('events', updatedEvents);

        // Save to database
        const { error } = await supabase
          .from('club_accounts')
          .update({
            events: updatedEvents,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving events:', error?.message || "Unknown error");
          toast.error('Failed to save event');
          // Revert local state on error
          updateFormData('events', formData.events);
          return;
        }

        toast.success('Event saved successfully!');
        setEditingEvent(null);
        setEditFormData(null);
        setOriginalEventData(null);
      } catch (err) {
        console.error('Unexpected error saving event:', err instanceof Error ? err.message : "Unknown error");
        toast.error('An unexpected error occurred while saving');
        // Revert local state on error
        updateFormData('events', formData.events);
      }
    }
  };

  const cancelEditing = () => {
    // If it's a new event (not saved yet), just discard it
    const existingEvent = formData.events.find(e => editFormData?.id === e.id);
    if (!existingEvent && editFormData) {
      // New event that wasn't saved - just clear editing state
      setEditingEvent(null);
      setEditFormData(null);
      setOriginalEventData(null);
    } else if (editFormData && originalEventData) {
      // Restore original data if editing existing event
      // (This shouldn't happen since we're not modifying formData until save, but just in case)
      setEditFormData({ ...originalEventData });
      setEditingEvent(null);
      setEditFormData(null);
      setOriginalEventData(null);
    }
  };

  const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!editFormData) return;
    const words = e.target.value.trim().split(/\s+/);
    if (words.length <= 30 || e.target.value === '') {
      setEditFormData({ ...editFormData, shortDescription: e.target.value });
    }
  };

  const handleFullDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!editFormData) return;
    const words = e.target.value.trim().split(/\s+/);
    if (words.length <= 250 || e.target.value === '') {
      setEditFormData({ ...editFormData, fullDescription: e.target.value });
    }
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const deleteRsvp = async (eventId: string, rsvpUserId: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to delete RSVP: User not authenticated');
        return;
      }

      // Update local state first
      const updatedEvents = formData.events.map(event => 
        event.id === eventId 
          ? { ...event, rsvps: event.rsvps.filter(userId => userId !== rsvpUserId) }
          : event
      );
      updateFormData('events', updatedEvents);

      // Save to database
      const { error } = await supabase
        .from('club_accounts')
        .update({
          events: updatedEvents,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting RSVP:', error?.message || "Unknown error");
        toast.error('Failed to delete RSVP');
        // Revert local state on error
        updateFormData('events', formData.events);
        return;
      }

      toast.success('RSVP removed successfully');
    } catch (err) {
      console.error('Unexpected error deleting RSVP:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while deleting');
      // Revert local state on error
      updateFormData('events', formData.events);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900 mb-1">Events</h2>
          <p className="text-gray-600">Add upcoming events for your club</p>
        </div>
         <Button 
            onClick={addEvent} 
            size="sm" 
            style={{ backgroundColor: editingEvent ? '#9ca3af' : '#752532', color: 'white' }} 
            className={editingEvent ? '' : 'hover:bg-[#5a3136]'}
            disabled={!!editingEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
      </div>

      {formData.events.length === 0 && !editingEvent ? (
        <Card className="p-8 text-center border-dashed">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No events added yet</p>
          <Button onClick={addEvent} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Show editing event form at the top if it's a new event */}
          {editingEvent && editFormData && !formData.events.find(e => e.id === editingEvent) && (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`event-name-${editFormData.id}`}>Event Name</Label>
                  <Input
                    id={`event-name-${editFormData.id}`}
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Event name"
                    className="mt-2 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`event-date-${editFormData.id}`}>Date</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id={`event-date-${editFormData.id}`}
                        type="date"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        className="pl-10 bg-white"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`event-time-${editFormData.id}`}>Time</Label>
                    <div className="relative mt-2 flex items-center gap-2">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <div className="flex items-center gap-2 flex-1 pl-10">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={editFormData.time ? editFormData.time.split(':')[0] || '' : ''}
                          onChange={(e) => {
                            const hour = e.target.value === '' ? '00' : Math.max(0, Math.min(23, parseInt(e.target.value) || 0)).toString().padStart(2, '0');
                            const currentMinute = editFormData.time ? editFormData.time.split(':')[1] || '00' : '00';
                            setEditFormData({ ...editFormData, time: `${hour}:${currentMinute}` });
                          }}
                          placeholder="HH"
                          className="w-20 bg-white text-center"
                          style={{ fontSize: '14px' }}
                        />
                        <span className="text-gray-500">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={editFormData.time ? editFormData.time.split(':')[1] || '' : ''}
                          onChange={(e) => {
                            const minute = e.target.value === '' ? '00' : Math.max(0, Math.min(59, parseInt(e.target.value) || 0)).toString().padStart(2, '0');
                            const currentHour = editFormData.time ? editFormData.time.split(':')[0] || '12' : '12';
                            setEditFormData({ ...editFormData, time: `${currentHour}:${minute}` });
                          }}
                          placeholder="MM"
                          className="w-20 bg-white text-center"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`event-location-${editFormData.id}`}>Location</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id={`event-location-${editFormData.id}`}
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      placeholder="Event location"
                      className="pl-10 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`event-short-description-${editFormData.id}`}>Brief Description</Label>
                  <Textarea
                    id={`event-short-description-${editFormData.id}`}
                    value={editFormData.shortDescription}
                    onChange={handleShortDescriptionChange}
                    placeholder="Brief event description"
                    className="mt-2 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                  <div className="flex justify-end mt-1">
                    <p className="text-sm text-gray-500">
                      {getWordCount(editFormData.shortDescription)}/30 words
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`event-full-description-${editFormData.id}`}>Full Description</Label>
                  <Textarea
                    id={`event-full-description-${editFormData.id}`}
                    value={editFormData.fullDescription}
                    onChange={handleFullDescriptionChange}
                    placeholder="Detailed event description (optional)"
                    className="mt-2 min-h-32 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                  <div className="flex justify-end mt-1">
                    <p className="text-sm text-gray-500">
                      {getWordCount(editFormData.fullDescription)}/250 words
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditing}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Show saved events */}
          {sortedEvents.map((event) => (
            <Card key={event.id} className="p-4">
              {editingEvent === event.id && editFormData ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`event-name-${event.id}`}>Event Name</Label>
                    <Input
                      id={`event-name-${event.id}`}
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Event name"
                      className="mt-2 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`event-date-${event.id}`}>Date</Label>
                      <div className="relative mt-2">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id={`event-date-${event.id}`}
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="pl-10 bg-white"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`event-time-${event.id}`}>Time</Label>
                      <div className="relative mt-2 flex items-center gap-2">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                        <div className="flex items-center gap-2 flex-1 pl-10">
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editFormData.time ? editFormData.time.split(':')[0] || '' : ''}
                            onChange={(e) => {
                              const hour = e.target.value === '' ? '00' : Math.max(0, Math.min(23, parseInt(e.target.value) || 0)).toString().padStart(2, '0');
                              const currentMinute = editFormData.time ? editFormData.time.split(':')[1] || '00' : '00';
                              setEditFormData({ ...editFormData, time: `${hour}:${currentMinute}` });
                            }}
                            placeholder="HH"
                            className="w-20 bg-white text-center"
                            style={{ fontSize: '14px' }}
                          />
                          <span className="text-gray-500">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={editFormData.time ? editFormData.time.split(':')[1] || '' : ''}
                            onChange={(e) => {
                              const minute = e.target.value === '' ? '00' : Math.max(0, Math.min(59, parseInt(e.target.value) || 0)).toString().padStart(2, '0');
                              const currentHour = editFormData.time ? editFormData.time.split(':')[0] || '12' : '12';
                              setEditFormData({ ...editFormData, time: `${currentHour}:${minute}` });
                            }}
                            placeholder="MM"
                            className="w-20 bg-white text-center"
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`event-location-${event.id}`}>Location</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id={`event-location-${event.id}`}
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        placeholder="Event location"
                        className="pl-10 bg-white"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`event-short-description-${event.id}`}>Brief Description</Label>
                    <Textarea
                      id={`event-short-description-${event.id}`}
                      value={editFormData.shortDescription}
                      onChange={handleShortDescriptionChange}
                      placeholder="Brief event description"
                      className="mt-2 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                    <div className="flex justify-end mt-1">
                      <p className="text-sm text-gray-500">
                        {getWordCount(editFormData.shortDescription)}/30 words
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`event-full-description-${event.id}`}>Full Description</Label>
                    <Textarea
                      id={`event-full-description-${event.id}`}
                      value={editFormData.fullDescription}
                      onChange={handleFullDescriptionChange}
                      placeholder="Detailed event description (optional)"
                      className="mt-2 min-h-32 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                    <div className="flex justify-end mt-1">
                      <p className="text-sm text-gray-500">
                        {getWordCount(editFormData.fullDescription)}/250 words
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEditing}>
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-gray-900">{event.name || 'Untitled Event'}</h3>
                      {event.date && (
                        <div className="flex items-center gap-4 text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDateString(event.date)}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{event.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(event)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {event.shortDescription && (
                    <p className="text-gray-600 text-sm">{event.shortDescription}</p>
                  )}
                  {event.fullDescription && (
                    <p className="text-gray-600 text-sm mt-2">{event.fullDescription}</p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                    <Dialog 
                      open={rsvpDialogOpen === event.id} 
                      onOpenChange={(open) => {
                        setRsvpDialogOpen(open ? event.id : null);
                        if (!open) setRsvpSearchQuery('');
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-2" />
                          View RSVPs ({event.rsvps.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Event RSVPs</DialogTitle>
                          <DialogDescription>
                            View and manage RSVPs for this event
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm text-gray-600">Total RSVPs: {event.rsvps.length}</p>
                            </div>
                            
                            {event.rsvps.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No RSVPs yet</p>
                            ) : (
                              <div className="space-y-3">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    value={rsvpSearchQuery}
                                    onChange={(e) => setRsvpSearchQuery(e.target.value)}
                                    placeholder="Search by name..."
                                    className="pl-9 bg-white"
                                    style={{ fontSize: '14px' }}
                                  />
                                </div>
                                
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {event.rsvps
                                    .filter((userId) => {
                                      const fullName = (rsvpNames[userId] || 'Unknown User').toLowerCase();
                                      return fullName.includes(rsvpSearchQuery.toLowerCase());
                                    })
                                    .map((userId) => (
                                      <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <span className="text-sm">{rsvpNames[userId] || 'Unknown User'}</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => deleteRsvp(event.id, userId)}
                                        >
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  {event.rsvps.filter((userId) => {
                                    const fullName = (rsvpNames[userId] || 'Unknown User').toLowerCase();
                                    return fullName.includes(rsvpSearchQuery.toLowerCase());
                                  }).length === 0 && rsvpSearchQuery && (
                                    <p className="text-sm text-gray-500 text-center py-4">No matching RSVPs found</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ClubMembers Component
function ClubMembers({ formData, updateFormData }: { formData: ClubFormData; updateFormData: (field: keyof ClubFormData, value: any) => void }) {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Member | null>(null);
  const [originalMemberData, setOriginalMemberData] = useState<Member | null>(null);

  // Sort members by first name alphabetically
  const sortedMembers = useMemo(() => {
    return [...formData.members].sort((a, b) => {
      // Get first name (first word of the name)
      const getFirstName = (name: string): string => {
        if (!name) return '';
        return name.trim().split(/\s+/)[0].toLowerCase();
      };
      
      const firstNameA = getFirstName(a.name);
      const firstNameB = getFirstName(b.name);
      
      return firstNameA.localeCompare(firstNameB);
    });
  }, [formData.members]);

  // Cleanup: Cancel editing when component unmounts (e.g., switching tabs)
  useEffect(() => {
    return () => {
      if (editingMember && editFormData) {
        // Component is unmounting - discard unsaved changes
        const existingMember = formData.members.find(m => m.id === editFormData.id);
        if (!existingMember) {
          // New member that wasn't saved - discard it
          setEditingMember(null);
          setEditFormData(null);
          setOriginalMemberData(null);
        }
      }
    };
  }, []);

  const addMember = () => {
    const newMember: Member = {
      id: Date.now().toString(),
      name: '',
      picture: '',
      bio: '',
      role: '',
      email: ''
    };
    // Don't add to formData yet - only add when Save is clicked
    setEditingMember(newMember.id);
    setEditFormData(newMember);
    setOriginalMemberData(null); // New member, no original
  };

  const deleteMember = async (id: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to delete: User not authenticated');
        return;
      }

      // Find member to delete and get picture filename
      const memberToDelete = formData.members.find(m => m.id === id);
      if (memberToDelete?.picture && !memberToDelete.picture.startsWith('data:')) {
        // Extract filename (same logic as avatar deletion)
        // Handle both signed URL and direct filename
        const fileName = extractFilename(memberToDelete.picture);
        
        if (fileName) {
          // Delete from storage (same logic as avatar deletion)
          const { error: deleteError } = await supabase.storage
            .from('Avatar')
            .remove([fileName]);
          
          if (deleteError) {
            console.error('Error deleting member picture from storage');
            // Continue with member deletion even if picture delete fails
          }
        }
      }

      // Update local state
      const updatedMembers = formData.members.filter(member => member.id !== id);
      updateFormData('members', updatedMembers);

      // Save to database
      const { error } = await supabase
        .from('club_accounts')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting member:', error?.message || "Unknown error");
        toast.error('Failed to delete member');
        // Revert local state on error
        updateFormData('members', formData.members);
        return;
      }

      toast.success('Member deleted successfully');
      if (editingMember === id) {
        setEditingMember(null);
        setEditFormData(null);
      }
    } catch (err) {
      console.error('Unexpected error deleting member:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while deleting');
      // Revert local state on error
      updateFormData('members', formData.members);
    }
  };

  const startEditing = async (member: Member) => {
    setEditingMember(member.id);
    
    // Convert picture filename to signed URL for display if it exists
    let pictureUrl = member.picture || '';
    let originalFilename: string | null = null;
    
    if (member.picture && !member.picture.startsWith('data:')) {
      // Extract filename from signed URL or use directly if it's already a filename
      originalFilename = extractFilename(member.picture);
      
      // If extraction resulted in a filename (not a URL), use it
      // If it's still a URL, extractFilename should have gotten the filename part
      if (originalFilename && originalFilename.includes('/')) {
        // Still looks like a URL, extract the filename part
        const parts = originalFilename.split('/');
        originalFilename = parts[parts.length - 1];
      }
      
      // Convert to signed URL for display if we have a filename
      if (originalFilename && !member.picture.startsWith('http')) {
        const signedUrl = await getStorageUrl(originalFilename, 'Avatar');
        pictureUrl = signedUrl || '';
      } else if (member.picture.startsWith('http')) {
        // Already a signed URL, keep it for display
        pictureUrl = member.picture;
      }
    }
    
    const memberWithPictureUrl = {
      ...member,
      picture: pictureUrl
    };
    
    setEditFormData(memberWithPictureUrl);
    setOriginalMemberData({ ...member }); // Store original for cancel
    setCurrentMemberPictureUrl(originalFilename); // Store current picture filename (for deletion, like avatar)
  };

  const saveEditing = async () => {
    if (editFormData) {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          toast.error('Failed to save: User not authenticated');
          return;
        }

        // Get current picture filename from database (picture is already uploaded/deleted immediately)
        // Extract filename from currentMemberPictureUrl or from editFormData.picture
        let pictureFilename = '';
        if (currentMemberPictureUrl) {
          pictureFilename = currentMemberPictureUrl;
        } else if (editFormData.picture && !editFormData.picture.startsWith('data:') && !editFormData.picture.startsWith('http')) {
          // It's already a filename
          pictureFilename = editFormData.picture;
        } else if (editFormData.picture && editFormData.picture.startsWith('http')) {
          // It's a signed URL, extract filename
          pictureFilename = extractFilename(editFormData.picture);
        }

        // Create member object with only required fields (name, role, email, bio, picture filename)
        const memberToSave = {
          id: editFormData.id,
          name: editFormData.name || '',
          picture: pictureFilename || '', // Store filename from currentMemberPictureUrl
          role: editFormData.role || '',
          email: editFormData.email || '',
          bio: editFormData.bio || ''
        };

        // Check if this is a new member (not in formData.members yet)
        const existingMember = formData.members.find(m => m.id === memberToSave.id);
        let updatedMembers: Member[];
        
        if (existingMember) {
          // Update existing member
          updatedMembers = formData.members.map(member => 
            member.id === memberToSave.id ? memberToSave : member
          );
        } else {
          // Add new member
          updatedMembers = [...formData.members, memberToSave];
        }

        // Save to database (members JSONB column)
        const { error } = await supabase
          .from('club_accounts')
          .update({
            members: updatedMembers,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving members:', error?.message || "Unknown error");
          toast.error('Failed to save member');
          return;
        }

        // Convert picture filename to signed URL for display in local state
        const updatedMembersWithUrls = await Promise.all(
          updatedMembers.map(async (member) => {
            if (member.picture && !member.picture.startsWith('data:') && !member.picture.startsWith('http')) {
              // It's a filename, convert to signed URL
              const signedUrl = await getStorageUrl(member.picture, 'Avatar');
              return {
                ...member,
                picture: signedUrl || ''
              };
            }
            return member;
          })
        );

        // Update local state with signed URLs
        updateFormData('members', updatedMembersWithUrls);
        
        toast.success('Member saved successfully!');
        setEditingMember(null);
        setEditFormData(null);
        setOriginalMemberData(null);
        setCurrentMemberPictureUrl(null);
      } catch (err) {
        console.error('Unexpected error saving member:', err instanceof Error ? err.message : "Unknown error");
        toast.error('An unexpected error occurred while saving');
      }
    }
  };

  const cancelEditing = () => {
    // If it's a new member (not saved yet), just discard it
    const existingMember = formData.members.find(m => editFormData?.id === m.id);
    if (!existingMember && editFormData) {
      // New member that wasn't saved - just clear editing state
      setEditingMember(null);
      setEditFormData(null);
      setOriginalMemberData(null);
      setCurrentMemberPictureUrl(null);
    } else if (editFormData && originalMemberData) {
      // Restore original data if editing existing member
      // (This shouldn't happen since we're not modifying formData until save, but just in case)
      setEditFormData({ ...originalMemberData });
      setEditingMember(null);
      setEditFormData(null);
      setOriginalMemberData(null);
      setCurrentMemberPictureUrl(null);
    }
  };

  // Compress member image (same logic as avatar)
  const compressMemberImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Image compression timeout - image too large or complex'));
      }, 30000);
      
      img.onload = () => {
        try {
          const maxSize = 400;
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
          ctx?.drawImage(img, 0, 0, width, height);
          
          const targetSize = 500 * 1024;
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  compressToTargetSize(currentQuality - 0.1);
                }
              } else {
                clearTimeout(timeout);
                reject(new Error('Failed to compress image'));
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

  const [uploadingMemberPicture, setUploadingMemberPicture] = useState(false);
  const [currentMemberPictureUrl, setCurrentMemberPictureUrl] = useState<string | null>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editFormData) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be less than 8MB');
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!file || !user?.id) return;

    setUploadingMemberPicture(true);
    try {
      // Delete existing picture if it exists (from database)
      if (currentMemberPictureUrl) {
        const oldFileName = extractFilename(currentMemberPictureUrl);
        const { error: deleteError } = await supabase.storage
          .from('Avatar')
          .remove([oldFileName]);
        
        if (deleteError) {
          console.error('Error deleting old member picture:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Compress image
      const compressedFile = await compressMemberImage(file);
      
      // Create unique filename
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-member-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage immediately (like avatar)
      const { error: uploadError } = await supabase.storage
        .from('Avatar')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Error uploading member picture:', uploadError);
        toast.error(`Error uploading picture: ${uploadError.message}`);
        setUploadingMemberPicture(false);
        return;
      }

      // Update member picture in database immediately (only picture field, like avatar)
      // Check if this is a new member (not in formData.members yet)
      const existingMember = formData.members.find(m => m.id === editFormData.id);
      let updatedMembers: Member[];
      
      if (existingMember) {
        // Update existing member - only picture field
        updatedMembers = formData.members.map(member => 
          member.id === editFormData.id 
            ? { ...member, picture: fileName } // Only update picture, keep other fields
            : member
        );
      } else {
        // Add new member with picture
        updatedMembers = [...formData.members, {
          ...editFormData,
          picture: fileName // Store filename, not signed URL
        }];
      }

      // Save to database immediately
      const { error: updateError } = await supabase
        .from('club_accounts')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating member picture:', updateError);
        toast.error('Error updating member picture. Please try again.');
        setUploadingMemberPicture(false);
        return;
      }

      // Update local state
      setCurrentMemberPictureUrl(fileName);
      
      // Generate signed URL for display
      const signedUrl = await getStorageUrl(fileName, 'Avatar');
      if (signedUrl) {
        setEditFormData({ ...editFormData, picture: signedUrl });
        // Update formData.members with signed URL for display (only the edited member)
        const updatedMembersWithUrls = updatedMembers.map(m => 
          m.id === editFormData.id 
            ? { ...m, picture: signedUrl }
            : m
        );
        updateFormData('members', updatedMembersWithUrls);
      }
      
      toast.success('Picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading member picture:', error instanceof Error ? error.message : "Unknown error");
      if (error instanceof Error && error.message && error.message.includes('timeout')) {
        toast.error('Error: Image is too large or complex to process. Please try a smaller image.');
      } else {
        toast.error('Error uploading picture. Please try again.');
      }
    } finally {
      setUploadingMemberPicture(false);
      // Reset the file input
      const fileInput = document.getElementById(`member-picture-${editFormData.id}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleDeleteMemberPicture = async () => {
    if (!currentMemberPictureUrl || !editFormData) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Extract filename
      const fileName = extractFilename(currentMemberPictureUrl);

      // Delete from storage (like avatar)
      const { error: deleteError } = await supabase.storage
        .from('Avatar')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting member picture from storage:', deleteError);
        toast.error('Error deleting picture from storage. Please try again.');
        return;
      }

      // Update member in database immediately (like avatar)
      const memberWithoutPicture = {
        ...editFormData,
        picture: '' // Remove picture
      };

      // Check if this is a new member (not in formData.members yet)
      const existingMember = formData.members.find(m => m.id === memberWithoutPicture.id);
      let updatedMembers: Member[];
      
      if (existingMember) {
        // Update existing member
        updatedMembers = formData.members.map(member => 
          member.id === memberWithoutPicture.id ? memberWithoutPicture : member
        );
      } else {
        // Add new member (shouldn't happen, but handle it)
        updatedMembers = [...formData.members, memberWithoutPicture];
      }

      // Save to database immediately
      const { error: updateError } = await supabase
        .from('club_accounts')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating member:', updateError);
        toast.error('Error updating member. Please try again.');
        return;
      }

      // Update local state
      setEditFormData({ ...editFormData, picture: '' });
      setCurrentMemberPictureUrl(null);
      
      // Update formData.members
      updateFormData('members', updatedMembers);
      
      // Reset the file input
      const fileInput = document.getElementById(`member-picture-${editFormData.id}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      toast.success('Picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting member picture:', error instanceof Error ? error.message : "Unknown error");
      toast.error('Error deleting picture. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900 mb-1">Board Members</h2>
          <p className="text-gray-600">Add your club's leadership team</p>
        </div>
        <Button 
          onClick={addMember} 
          size="sm" 
          style={{ backgroundColor: editingMember ? '#9ca3af' : '#752532', color: 'white' }} 
          className={editingMember ? '' : 'hover:bg-[#5a3136]'}
          disabled={!!editingMember}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {formData.members.length === 0 && !editingMember ? (
        <Card className="p-8 text-center border-dashed">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No board members added yet</p>
          <Button onClick={addMember} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Member
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Show editing member form at the top if it's a new member */}
          {editingMember && editFormData && !formData.members.find(m => m.id === editingMember) && (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Member Picture</Label>
                  <div className="mt-2">
                    <div className="flex flex-col items-center">
                      {editFormData.picture ? (
                        <div className="w-20 h-20 rounded-full border-2 overflow-hidden mb-4" style={{ borderColor: '#5a3136' }}>
                          <img 
                            src={editFormData.picture} 
                            alt="Member" 
                            className="w-full h-full"
                            style={{ 
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center mb-4 rounded-full border-2" style={{ borderColor: '#5a3136', backgroundColor: '#fefafb' }}>
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id={`member-picture-${editFormData.id}`}
                          disabled={uploadingMemberPicture}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs px-3 py-1 h-7"
                          disabled={uploadingMemberPicture}
                          onClick={() => document.getElementById(`member-picture-${editFormData.id}`)?.click()}
                        >
                          {uploadingMemberPicture ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              <span>{editFormData.picture ? 'Change Picture' : 'Add Picture'}</span>
                            </div>
                          )}
                        </Button>
                        {editFormData.picture && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs px-3 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={handleDeleteMemberPicture}
                            disabled={uploadingMemberPicture}
                          >
                            <div className="flex items-center gap-1">
                              <X className="w-3 h-3" />
                              <span>Delete Picture</span>
                            </div>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`member-name-${editFormData.id}`}>Name</Label>
                  <Input
                    id={`member-name-${editFormData.id}`}
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Member name"
                    className="mt-2 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <Label htmlFor={`member-role-${editFormData.id}`}>Role</Label>
                  <Input
                    id={`member-role-${editFormData.id}`}
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    placeholder="e.g., President, Vice President"
                    className="mt-2 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <Label htmlFor={`member-email-${editFormData.id}`}>Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id={`member-email-${editFormData.id}`}
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="member@university.edu"
                      className="pl-10 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`member-bio-${editFormData.id}`}>Bio</Label>
                  <Textarea
                    id={`member-bio-${editFormData.id}`}
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    placeholder="Brief bio about the member"
                    className="mt-2 bg-white"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditing}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Show saved members */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedMembers.map((member) => (
              <Card key={member.id} className="p-4">
              {editingMember === member.id && editFormData ? (
                <div className="space-y-4">
                  <div>
                    <Label>Member Picture</Label>
                    <div className="mt-2">
                      <div className="flex flex-col items-center">
                        {editFormData.picture ? (
                          <div className="w-20 h-20 rounded-full border-2 overflow-hidden mb-4" style={{ borderColor: '#5a3136' }}>
                            <img 
                              src={editFormData.picture} 
                              alt="Member" 
                              className="w-full h-full"
                              style={{ 
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center mb-4 rounded-full border-2" style={{ borderColor: '#5a3136', backgroundColor: '#fefafb' }}>
                            <Upload className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id={`member-picture-${member.id}`}
                            disabled={uploadingMemberPicture}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs px-3 py-1 h-7"
                            disabled={uploadingMemberPicture}
                            onClick={() => document.getElementById(`member-picture-${member.id}`)?.click()}
                          >
                            {uploadingMemberPicture ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>{editFormData.picture ? 'Change Picture' : 'Add Picture'}</span>
                              </div>
                            )}
                          </Button>
                          {editFormData.picture && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-3 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={handleDeleteMemberPicture}
                              disabled={uploadingMemberPicture}
                            >
                              <div className="flex items-center gap-1">
                                <X className="w-3 h-3" />
                                <span>Delete Picture</span>
                              </div>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`member-name-${member.id}`}>Name</Label>
                    <Input
                      id={`member-name-${member.id}`}
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Member name"
                      className="mt-2 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`member-role-${member.id}`}>Role</Label>
                    <Input
                      id={`member-role-${member.id}`}
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      placeholder="e.g., President, Vice President"
                      className="mt-2 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`member-email-${member.id}`}>Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id={`member-email-${member.id}`}
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="member@university.edu"
                        className="pl-10 bg-white"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`member-bio-${member.id}`}>Bio</Label>
                    <Textarea
                      id={`member-bio-${member.id}`}
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      placeholder="Brief bio about the member"
                      className="mt-2 bg-white"
                      style={{ fontSize: '14px' }}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEditing}>
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-4 mb-3">
                    {member.picture ? (
                      <div className="w-20 h-20 rounded-full border-2 overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ borderColor: '#5a3136' }}>
                        <img 
                          src={member.picture} 
                          alt={member.name}
                          className="max-w-full max-h-full"
                          style={{ 
                            objectFit: 'contain',
                            width: 'auto',
                            height: 'auto'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 flex-shrink-0" style={{ borderColor: '#5a3136' }}>
                        <User className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-gray-900">{member.name || 'Untitled Member'}</h3>
                          {member.role && (
                            <p className="text-sm text-gray-600">{member.role}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(member)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {member.bio && (
                    <p className="text-sm text-gray-600">{member.bio}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ClubFeedPost Component
function ClubFeedPost({ formData: _formData }: { formData: ClubFormData; updateFormData?: (field: keyof ClubFormData, value: any) => void }) {
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll' | 'youtube'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [postPhotoFile, setPostPhotoFile] = useState<File | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [isDragOverPhotoDrop, setIsDragOverPhotoDrop] = useState(false);
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [clubAccountName, setClubAccountName] = useState<string>('');
  const [clubAccountId, setClubAccountId] = useState<string | null>(null);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentAnonymously, setCommentAnonymously] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnonymously, setReplyAnonymously] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [selectedPostThread, setSelectedPostThread] = useState<string | null>(null);
  const [isThreadPostHovered, setIsThreadPostHovered] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [postPhotoUrls, setPostPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [confirmationPopup, setConfirmationPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    position: { top: 0, left: 0 }
  });

  // Helper function to get club account UUID (same as auth user.id, but verified)
  const getClubAccountId = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Verify the user exists in club_accounts table and return the UUID
      // Since club_accounts.id references auth.users.id, they're the same
      const { data: clubAccount, error } = await supabase
        .from('club_accounts')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !clubAccount) {
        console.error('Error verifying club account:', error?.message || "Unknown error");
        return null;
      }

      return clubAccount.id;
    } catch (error) {
      console.error('Error getting club account ID:', error instanceof Error ? error.message : "Unknown error");
      return null;
    }
  };

  // Helper functions
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }, []);

  // Helper function to count words in text
  const countWords = useCallback((text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Helper function to enforce word limit on text input
  const handleTextChangeWithWordLimit = useCallback((value: string, maxWords: number, setter: (value: string) => void) => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length <= maxWords) {
      setter(value);
    } else {
      // If exceeding limit, truncate to maxWords
      const truncated = value.trim().split(/\s+/).slice(0, maxWords).join(' ');
      setter(truncated);
    }
  }, []);

  const getPostColor = useCallback((_postId: string) => {
    // All club posts use the maroon color
    return '#752432';
  }, []);

  const getPostHoverColor = useCallback((_postId: string) => {
    // Hover color for club posts
    return 'rgba(117, 36, 50, 0.05)';
  }, []);

  const getVideoEmbedUrl = (url: string | null | undefined): { embedUrl: string; platform: 'youtube' | 'tiktok' | 'instagram' } | null => {
    if (!url || !url.trim()) return null;
    
    const trimmedUrl = url.trim();
    
    // YouTube (regular videos and shorts)
    let watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([^&\s]+)/);
    if (watchMatch) {
      return { embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}`, platform: 'youtube' };
    }
    
    let shortMatch = trimmedUrl.match(/youtube\.com\/shorts\/([^?\s]+)/);
    if (shortMatch) {
      return { embedUrl: `https://www.youtube.com/embed/${shortMatch[1]}`, platform: 'youtube' };
    }
    
    let youtuBeMatch = trimmedUrl.match(/youtu\.be\/([^?\s]+)/);
    if (youtuBeMatch) {
      return { embedUrl: `https://www.youtube.com/embed/${youtuBeMatch[1]}`, platform: 'youtube' };
    }
    
    // TikTok
    let tiktokMatch = trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return { embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`, platform: 'tiktok' };
    }
    
    // Instagram
    let instagramMatch = trimmedUrl.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (instagramMatch) {
      return { embedUrl: `https://www.instagram.com/p/${instagramMatch[1]}/embed/`, platform: 'instagram' };
    }
    
    return null;
  };

  // ProfileBubble component
  const ProfileBubble = ({ userName, size = "md", borderColor = "#752432", isAnonymous = false, userId, onProfileClick }: { 
    userName: string; 
    size?: "sm" | "md" | "lg"; 
    borderColor?: string; 
    isAnonymous?: boolean;
    userId?: string;
    onProfileClick?: (userId: string, userName: string) => void;
  }) => {
    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-8 h-8 text-sm", 
      lg: "w-10 h-10 text-base"
    };
    
    const iconSizes = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    };
    
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isAnonymous && userId && onProfileClick) {
        onProfileClick(userId, userName);
      }
    };
    
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${
          !isAnonymous && userId && onProfileClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
        style={{ 
          backgroundColor: borderColor,
          borderColor: borderColor
        }}
        onClick={handleClick}
      >
        {isAnonymous ? (
          <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          initials
        )}
      </div>
    );
  };

  // Image compression function
  const compressPostImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error('Compression timeout'));
      }, 30000);
      
      img.onload = () => {
        try {
          const maxSize = 1200;
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
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          const targetSize = 2 * 1024 * 1024;
          let quality = 0.8;
          
          const compressToTargetSize = (currentQuality: number): void => {
            canvas.toBlob((blob) => {
              if (blob) {
                if (blob.size <= targetSize || currentQuality <= 0.1) {
                  clearTimeout(timeout);
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
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

  const handlePostPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error('File is not an image');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File is too large (max 8MB)');
      return;
    }

    if (postPhotoPreview) {
      URL.revokeObjectURL(postPhotoPreview);
    }

    setUploadingPostPhoto(true);
    
    try {
      const compressedFile = await compressPostImage(file);
      // Store the compressed file for upload
      setPostPhotoFile(compressedFile);
      // Store preview URL for display
      const previewUrl = URL.createObjectURL(compressedFile);
      setPostPhotoPreview(previewUrl);
    } catch (compressionError) {
      console.error('Error compressing image:', compressionError);
      toast.error('Error processing image. Please try a different image.');
    } finally {
      setUploadingPostPhoto(false);
      const fileInput = event.target;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleRemovePostPhoto = () => {
    if (postPhotoPreview) {
      URL.revokeObjectURL(postPhotoPreview);
    }
    setPostPhotoPreview(null);
    setPostPhotoFile(null);
    setIsDragOverPhotoDrop(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Fetch posts for this club account with full data
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) {
        setLoading(false);
      return;
    }
      // Set user state for compatibility (club account ID is the same as auth user ID)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      }

      // Fetch posts where author_id matches the club account UUID
      const { data: fetchedPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', clubAccountId)
        .is('course_id', null) // Only get posts without course_id (club posts)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error?.message || "Unknown error");
        setLoading(false);
      return;
    }

      if (!fetchedPosts || fetchedPosts.length === 0) {
        setPosts([]);
        setLoading(false);
      return;
    }

      const postIds = fetchedPosts.map((post: any) => post.id);
      const authorIds = [...new Set(fetchedPosts.map((post: any) => post.author_id))];

      // Fetch club account data for authors (club accounts, not profiles)
      const { data: clubAccounts } = await supabase
        .from('club_accounts')
        .select('id, name')
        .in('id', authorIds);

      // Set current club account name and ID for comment input
      const currentClubAccount = clubAccounts?.find((ca: any) => ca.id === clubAccountId);
      if (currentClubAccount) {
        setClubAccountName((currentClubAccount as any).name || '');
        setClubAccountId(clubAccountId);
      }

      // Batch fetch all user likes for posts (using club account UUID)
      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', clubAccountId)
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all likes counts
      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'post')
        .in('likeable_id', postIds);

      // Batch fetch all comments counts
      const { data: commentsCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      // Create lookup maps
      const clubAccountsMap = new Map(clubAccounts?.map((ca: any) => [ca.id, ca]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      
      // Count likes and comments
      const likesCountMap = new Map();
      const commentsCountMap = new Map();
      
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });
      
      commentsCounts?.forEach((comment: any) => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Get poll data for poll posts
      const pollPostIds = fetchedPosts.filter((post: any) => post.post_type === 'poll').map((post: any) => post.id);
      let pollsMap = new Map();
      let pollOptionsMap = new Map();
      let pollVotesMap = new Map();

      if (pollPostIds.length > 0) {
        const { data: polls } = await supabase
          .from('polls')
          .select('*')
          .in('post_id', pollPostIds);

        if (polls && polls.length > 0) {
          const pollIds = polls.map((p: any) => p.id);
          pollsMap = new Map(polls.map((p: any) => [p.post_id, p]));

          const { data: pollOptions } = await supabase
            .from('poll_options')
            .select('*')
            .in('poll_id', pollIds);

          pollOptionsMap = new Map();
          pollOptions?.forEach((option: any) => {
            if (!pollOptionsMap.has(option.poll_id)) {
              pollOptionsMap.set(option.poll_id, []);
            }
            pollOptionsMap.get(option.poll_id).push(option);
          });

          const { data: userPollVotes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id')
            .eq('user_id', clubAccountId)
            .in('poll_id', pollIds);

          pollVotesMap = new Map(userPollVotes?.map((v: any) => [v.poll_id, v.option_id]) || []);

          const { data: allPollVotes } = await supabase
            .from('poll_votes')
            .select('option_id')
            .in('poll_id', pollIds);

          const voteCounts = new Map();
          allPollVotes?.forEach((vote: any) => {
            voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
          });

          pollOptionsMap.forEach((options) => {
            options.forEach((option: any) => {
              option.votes = voteCounts.get(option.id) || 0;
            });
          });
        }
      }

      // Transform data to match UI interface
      const transformedPosts: Post[] = fetchedPosts.map((post: any) => {
        const clubAccount = clubAccountsMap.get(post.author_id);
        const isLiked = userLikesSet.has(post.id);
        const likesCount = likesCountMap.get(post.id) || 0;
        const commentsCount = commentsCountMap.get(post.id) || 0;

        // Handle poll data
        let poll = undefined;
        if (post.post_type === 'poll') {
          const pollData = pollsMap.get(post.id);
          if (pollData) {
            const options = pollOptionsMap.get(pollData.id) || [];
            const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
            const userVotedOptionId = pollVotesMap.get(pollData.id);

            poll = {
              id: pollData.id,
              question: pollData.question,
              options: options,
              totalVotes: totalVotes,
              userVotedOptionId: userVotedOptionId
            };
          }
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          timestamp: new Date(post.created_at),
          author_id: post.author_id,
          course_id: post.course_id,
          post_type: post.post_type,
          is_anonymous: post.is_anonymous,
          created_at: post.created_at,
          edited_at: post.edited_at,
          is_edited: post.is_edited,
          likes_count: likesCount,
          comments_count: commentsCount,
          photo_url: post.photo_url || null,
          vid_link: post.vid_link || null,
          author: clubAccount ? {
            name: post.is_anonymous ? 'Anonymous User' : ((clubAccount as any).name || 'Club'),
            year: '' // Club accounts don't have year
          } : undefined,
          isLiked: isLiked,
          poll
        };
      });

      setPosts(transformedPosts);

      // Load photo URLs for posts with photos
      const postsWithPhotos = transformedPosts.filter(p => p.photo_url);
      for (const post of postsWithPhotos) {
        if (post.photo_url) {
          const url = await getStorageUrl(post.photo_url, 'post_picture');
          if (url) {
            setPostPhotoUrls(prev => new Map(prev).set(post.id, url));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    // Validate title is required
    if (!newPostTitle.trim()) return;
    
    // Validate content based on post type
    // Text posts can have empty content (optional), but polls need at least 2 options
    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) return;
    
    // Validate video link is required for YouTube posts
    if (newPostType === 'youtube' && !newYoutubeLink.trim()) return;

    try {
      // Get current user (club account)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload photo if present (for text posts only)
      let photoFileName: string | null = null;
      if (postPhotoFile && newPostType === 'text') {
        try {
          const fileExt = postPhotoFile.name.split('.').pop() || 'jpg';
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post_picture')
            .upload(fileName, postPhotoFile);

          if (uploadError) {
            console.error('Error uploading post photo:', uploadError);
            toast.error('Error uploading photo. Please try again.');
            return;
          }

          photoFileName = fileName;
        } catch (uploadError) {
          console.error('Error uploading post photo:', uploadError);
          toast.error('Error uploading photo. Please try again.');
          return;
        }
      }

      // Create the post - club accounts: author_id is user.id, course_id is null, is_anonymous is false
      const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPost.trim(),
          author_id: user.id, // Club account UUID
          course_id: null, // Always null for club posts
          post_type: newPostType,
          is_anonymous: false, // Always false for club posts
          photo_url: photoFileName,
          vid_link: newPostType === 'youtube' ? newYoutubeLink.trim() : null
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating post:', postError);
        toast.error(`Error creating post: ${postError.message || 'Unknown error'}`);
        // If post creation failed and we uploaded a photo, clean it up
        if (photoFileName) {
          try {
            await supabase.storage.from('post_picture').remove([photoFileName]);
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded photo:', cleanupError);
          }
        }
        return;
      }

      // Create poll if it's a poll post
      if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: createdPost.id,
            question: newPost.trim()
          })
          .select()
          .single();

        if (pollError) {
          console.error('Error creating poll:', pollError);
          return;
        }

        // Create poll options
        const pollOptionsData = pollOptions
          .filter(opt => opt.trim())
          .map(opt => ({
            poll_id: poll.id,
            text: opt.trim()
          }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(pollOptionsData);

        if (optionsError) {
          console.error('Error creating poll options:', optionsError);
          return;
        }
      }
    
    // Reset form
    setNewPost('');
    setNewPostTitle('');
    setNewPostType('text');
    setPollOptions(['', '']);
    setNewYoutubeLink('');
      // Clear photo state
    if (postPhotoPreview) {
        URL.revokeObjectURL(postPhotoPreview);
    }
      setPostPhotoFile(null);
      setPostPhotoPreview(null);

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error('Error in handleCreatePost:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleLike = async (postId: string) => {
    if (likingPosts.has(postId)) return;
    
    try {
      setLikingPosts(prev => new Set(prev).add(postId));
      
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', clubAccountId)
        .eq('likeable_type', 'post')
        .eq('likeable_id', postId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', clubAccountId)
          .eq('likeable_type', 'post')
          .eq('likeable_id', postId);
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: clubAccountId,
            likeable_type: 'post',
            likeable_id: postId
          });
      }

      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                isLiked: !isCurrentlyLiked,
                likes_count: isCurrentlyLiked ? p.likes_count - 1 : p.likes_count + 1
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error in handleLike:', error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleEditPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const updateData: any = {
        title: editPostTitle,
        edited_at: new Date().toISOString(),
        is_edited: true
      };
      
      if (post.post_type !== 'poll') {
        updateData.content = editPostContent;
      }
      
      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('author_id', user?.id);

      if (error) throw error;
      
      setEditingPost(null);
      await fetchPosts();
    } catch (error) {
      console.error('Error editing post:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeletePost = async (postId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    const position = event ? { top: event.clientY, left: event.clientX } : { top: 0, left: 0 };
    
    setConfirmationPopup({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      position,
      onConfirm: async () => {
        try {
          const { data: postData } = await supabase
            .from('posts')
            .select('photo_url')
            .eq('id', postId)
            .eq('author_id', user?.id)
            .single();

          if (postData?.photo_url) {
            try {
              await supabase.storage.from('post_picture').remove([postData.photo_url]);
            } catch (photoError) {
              console.error('Error deleting post photo from storage:', photoError);
            }
          }

          await supabase
            .from('likes')
            .delete()
            .eq('likeable_type', 'post')
            .eq('likeable_id', postId);

          await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', user?.id);
          
          await fetchPosts();
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
          
          // If we're in thread view and the deleted post is the selected one, go back to feed
          if (selectedPostThread === postId) {
            setSelectedPostThread(null);
            setHoveredPostId(null);
            setReplyingTo(null);
          }
        } catch (error) {
          console.error('Error deleting post:', error instanceof Error ? error.message : "Unknown error");
          setConfirmationPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const post = posts.find(p => p.id === postId);
      if (!post || !post.poll) return;

      if (post.poll.userVotedOptionId) return;

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: post.poll.id,
          option_id: optionId,
          user_id: clubAccountId
        });

      if (error) {
        console.error('Error voting on poll:', error?.message || "Unknown error");
        return;
      }

      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                poll: p.poll ? {
                  ...p.poll,
                  userVotedOptionId: optionId,
                  totalVotes: p.poll.totalVotes + 1,
                  options: p.poll.options.map(opt => ({
                    ...opt,
                    votes: opt.id === optionId ? opt.votes + 1 : opt.votes
                  }))
                } : undefined
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error in handleVotePoll:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => new Set(prev).add(postId));
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) {
        setComments(prev => ({ ...prev, [postId]: [] }));
        setLoadingComments(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        return;
      }

      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error?.message || "Unknown error");
        setComments(prev => ({ ...prev, [postId]: [] }));
        setLoadingComments(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments(prev => ({ ...prev, [postId]: [] }));
        setLoadingComments(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        return;
      }

      const commentIds = commentsData.map((c: any) => c.id);
      const authorIds = [...new Set(commentsData.map((c: any) => c.author_id))];

      // Batch fetch all profiles (for regular user comments)
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, full_name, class_year')
        .in('id', authorIds);

      // Batch fetch all club accounts (for club account comments)
      const { data: clubAccounts } = await supabase
        .from('club_accounts')
        .select('id, name')
        .in('id', authorIds);

      const { data: userLikes } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('user_id', clubAccountId)
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      const { data: likesCounts } = await supabase
        .from('likes')
        .select('likeable_id')
        .eq('likeable_type', 'comment')
        .in('likeable_id', commentIds);

      const { data: repliesData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .not('parent_comment_id', 'is', null)
        .order('created_at', { ascending: true });

      // Create lookup maps
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const clubAccountsMap = new Map(clubAccounts?.map((ca: any) => [ca.id, ca]) || []);
      const userLikesSet = new Set(userLikes?.map((l: any) => l.likeable_id) || []);
      const likesCountMap = new Map();
      likesCounts?.forEach((like: any) => {
        likesCountMap.set(like.likeable_id, (likesCountMap.get(like.likeable_id) || 0) + 1);
      });

      const repliesMap = new Map<string, any[]>();
      repliesData?.forEach((reply: any) => {
        if (!repliesMap.has(reply.parent_comment_id)) {
          repliesMap.set(reply.parent_comment_id, []);
        }
        repliesMap.get(reply.parent_comment_id)!.push(reply);
      });

      const transformedComments: Comment[] = commentsData.map((comment: any) => {
        const author = authorsMap.get(comment.author_id);
        const clubAccount = clubAccountsMap.get(comment.author_id);
        const isClubAccount = !!clubAccount;
        const replies = repliesMap.get(comment.id) || [];
        
        const transformedReplies: Comment[] = replies.map((reply: any) => {
          const replyAuthor = authorsMap.get(reply.author_id);
          const replyClubAccount = clubAccountsMap.get(reply.author_id);
          const replyIsClubAccount = !!replyClubAccount;
          const replyIsLiked = userLikesSet.has(reply.id);
          const replyLikesCount = likesCountMap.get(reply.id) || 0;
          
          return {
            id: reply.id,
            post_id: reply.post_id,
            parent_comment_id: reply.parent_comment_id,
            author_id: reply.author_id,
            content: reply.content,
            is_anonymous: reply.is_anonymous,
            created_at: reply.created_at,
            edited_at: reply.edited_at,
            is_edited: reply.is_edited,
            likes_count: replyLikesCount,
            author: replyIsClubAccount
              ? (replyClubAccount && (replyClubAccount as any).name ? {
                  name: reply.is_anonymous ? 'Anonymous User' : (replyClubAccount as any).name,
                  year: '' // Club accounts don't have year
                } : undefined)
              : (replyAuthor && (replyAuthor as any).full_name ? {
                  name: reply.is_anonymous ? 'Anonymous User' : (replyAuthor as any).full_name,
                  year: (replyAuthor as any).class_year || ''
                } : undefined),
            isLiked: replyIsLiked,
            isClubAccount: replyIsClubAccount // Store flag to disable profile clicks for club accounts
          };
        });

        const isLiked = userLikesSet.has(comment.id);
        const likesCount = likesCountMap.get(comment.id) || 0;

        return {
          id: comment.id,
          post_id: comment.post_id,
          parent_comment_id: comment.parent_comment_id,
          author_id: comment.author_id,
          content: comment.content,
          is_anonymous: comment.is_anonymous,
          created_at: comment.created_at,
          edited_at: comment.edited_at,
          is_edited: comment.is_edited,
          likes_count: likesCount,
          author: isClubAccount
            ? (clubAccount && (clubAccount as any).name ? {
                name: comment.is_anonymous ? 'Anonymous User' : (clubAccount as any).name,
                year: '' // Club accounts don't have year
              } : undefined)
            : (author && (author as any).full_name ? {
                name: comment.is_anonymous ? 'Anonymous User' : (author as any).full_name,
                year: (author as any).class_year || ''
              } : undefined),
          isLiked: isLiked,
          replies: transformedReplies,
          isClubAccount // Store flag to disable profile clicks for club accounts
        };
      });

      setComments(prev => ({ ...prev, [postId]: transformedComments }));
      setLoadingComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } catch (error) {
      console.error('Error fetching comments:', error instanceof Error ? error.message : "Unknown error");
      setLoadingComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const addComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: clubAccountId,
          content: commentText.trim(),
          is_anonymous: commentAnonymously[postId] || false
        });

      if (error) {
        console.error('Error adding comment:', error?.message || "Unknown error");
        return;
      }

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setCommentAnonymously(prev => ({ ...prev, [postId]: false }));

      await fetchComments(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error in addComment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const addReply = async (postId: string, commentId: string) => {
    const key = `${postId}:${commentId}`;
    const text = replyText[key];
    if (!text?.trim()) return;

    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: commentId,
          author_id: clubAccountId,
          content: text.trim(),
          is_anonymous: replyAnonymously[key] || false
        });

      if (error) {
        console.error('Error adding reply:', error?.message || "Unknown error");
        return;
      }

      setReplyText(prev => ({ ...prev, [key]: '' }));
      setReplyAnonymously(prev => ({ ...prev, [key]: false }));
      setReplyingTo(null);

      await fetchComments(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error in addReply:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handlePostClick = (postId: string) => {
    setSelectedPostThread(postId);
    // Always fetch comments when opening thread view (to get latest data)
    fetchComments(postId);
  };

  // Load comments when thread view opens
  useEffect(() => {
    if (selectedPostThread && !comments[selectedPostThread]) {
      setLoadingComments(prev => new Set(prev).add(selectedPostThread));
      fetchComments(selectedPostThread).then(() => {
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedPostThread);
          return newSet;
        });
      }).catch(() => {
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedPostThread);
          return newSet;
        });
      });
    }
  }, [selectedPostThread]);

  const handleBackToFeed = () => {
    setSelectedPostThread(null);
    setHoveredPostId(null);
    setReplyingTo(null);
  };

  // Handle profile click (no-op for club accounts since they don't have profile pages)
  const handleProfileClick = (_userId: string, _userName: string) => {
    // Club accounts don't have profile pages, so this is a no-op
    // Regular users commenting on club posts would navigate, but we don't have navigation in this context
  };

  // Get selected post for thread view
  const selectedPost = selectedPostThread ? posts.find(p => p.id === selectedPostThread) : null;

  // Render thread view (full-page, matching campus feed)
  const renderThreadView = () => {
    if (!selectedPost) return null;
    
    // Color consistency is now maintained by using post ID instead of index

    return (
      <>
      <div className="w-full h-full overflow-y-auto scrollbar-hide flex justify-center" style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: '30px'
      }}>
        <div className="w-full max-w-4xl p-6">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToFeed}
              className="flex items-center gap-2 text-[#752432] bg-white hover:bg-[#752432]/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Button>
          </div>
          
          {/* Original Post (highlight on hover, only this area is hoverable/clickable) */}
          <Card 
            className="mb-6 border-l-4 cursor-pointer" 
            style={{ 
              backgroundColor: '#FEFBF6',
              borderLeftColor: getPostColor(selectedPost.id),
              boxShadow: isThreadPostHovered ? `0 0 0 2px ${getPostHoverColor(selectedPost.id)}` : undefined
            }}
            onMouseEnter={() => setIsThreadPostHovered(true)}
            onMouseLeave={() => setIsThreadPostHovered(false)}
            onClick={() => { /* no-op click target for post area in thread view */ }}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <ProfileBubble 
                  userName={selectedPost.author?.name || 'Club'} 
                  size="lg" 
                  borderColor={getPostColor(selectedPost.id)} 
                  isAnonymous={selectedPost.is_anonymous}
                  userId={selectedPost.author_id}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{selectedPost.is_anonymous ? 'Anonymous' : (selectedPost.author?.name || 'Club')}</h4>
                    {!selectedPost.is_anonymous && (
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: '#752532' }}
                      >
                        Club
                      </span>
                    )}
                    {!selectedPost.is_anonymous && <span className="text-sm text-gray-500">{selectedPost.author?.year || ''}</span>}
                    {/* verified badge removed */}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{formatTimestamp(selectedPost.created_at)}</span>
                    {selectedPost.is_edited && (
                      <span className="text-xs text-gray-400 italic">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {editingPost !== selectedPost.id && (
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedPost.title}
                </h1>
              )}
              
              {/* Edit Post Form in Thread View */}
              {editingPost === selectedPost.id ? (
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl font-bold"
                    placeholder="Post title..."
                  />
                  {selectedPost.post_type !== 'poll' && (
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      placeholder="Post content..."
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPost(selectedPost.id);
                      }}
                      className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                      style={{ 
                        backgroundColor: getPostColor(selectedPost.id)
                      }}
                      onMouseEnter={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                      }}
                      onMouseLeave={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPost(null);
                      }}
                      className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                      style={{ 
                        backgroundColor: getPostColor(selectedPost.id)
                      }}
                      onMouseEnter={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                      }}
                      onMouseLeave={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <ExpandableText 
                    text={selectedPost.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                    maxLines={10}
                    className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                    buttonColor={getPostColor(selectedPost.id)}
                  />
                </div>
              )}

              {/* Post Photo in Thread View */}
              {selectedPost.photo_url && postPhotoUrls.has(selectedPost.id) && (
                <div className="mb-4 mt-4">
                  <img
                    src={postPhotoUrls.get(selectedPost.id) || ''}
                    alt="Post"
                    className="rounded-lg"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '450px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    onError={(_e) => {
                      // If signed URL expires, regenerate it
                      if (selectedPost.photo_url) {
                        getStorageUrl(selectedPost.photo_url, 'post_picture').then(url => {
                          if (url) {
                            setPostPhotoUrls(prev => {
                              const newMap = new Map(prev);
                              newMap.set(selectedPost.id, url);
                              return newMap;
                            });
                          }
                        });
                      }
                    }}
                  />
                </div>
              )}

              {/* Video Embed in Thread View */}
              {selectedPost.vid_link && (
                <div className="mb-4 mt-4">
                  {(() => {
                    const embedData = getVideoEmbedUrl(selectedPost.vid_link);
                    if (!embedData) {
                      return null;
                    }
                    const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                    const isInstagram = embedData.platform === 'instagram';
                    // Use different scales to make the actual content appear the same size
                    const scale = isInstagram ? 0.65 : 0.90;
                    const width = isInstagram ? '153.85%' : '111.11%';
                    const height = isInstagram ? '153.85%' : '111.11%';
                    return (
                      <div 
                        className="relative overflow-hidden rounded-lg" 
                        style={isVertical 
                          ? { 
                              maxHeight: '600px', 
                              maxWidth: '45%',
                              width: '45%',
                              aspectRatio: '9/16',
                              margin: '0 auto'
                            } 
                          : { paddingBottom: '56.25%', minHeight: '200px', width: '100%' }
                        }
                      >
                        <iframe
                          src={embedData.embedUrl}
                          title={`${embedData.platform} video player`}
                          frameBorder="0"
                          scrolling="no"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className={isVertical ? "rounded-lg" : "absolute top-0 left-0 w-full h-full rounded-lg"}
                          style={isVertical 
                            ? { 
                                border: 'none', 
                                overflow: 'hidden',
                                transform: `translate(-50%, -50%) scale(${scale})`,
                                transformOrigin: 'center center',
                                width: width,
                                height: height,
                                position: 'absolute',
                                left: '50%',
                                top: '50%'
                              }
                            : { border: 'none', overflow: 'hidden' }
                          }
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Poll in thread view */}
              {selectedPost.poll && (
                <div className="mb-4 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{selectedPost.poll.question}</h4>
                  <div className="space-y-2">
                    {selectedPost.poll.options.map((option) => {
                      const hasVoted = selectedPost.poll!.userVotedOptionId !== undefined;
                      const percentage = selectedPost.poll!.totalVotes > 0 
                        ? (option.votes / selectedPost.poll!.totalVotes * 100) 
                        : 0;
                      const isSelected = selectedPost.poll!.userVotedOptionId === option.id;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVotePoll(selectedPost.id, option.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                            isSelected 
                              ? 'bg-gray-50'
                              : hasVoted
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          style={{
                            borderColor: isSelected ? getPostColor(selectedPost.id) : undefined,
                            backgroundColor: isSelected ? `${getPostColor(selectedPost.id)}0D` : undefined
                          }}
                        >
                          {hasVoted && (
                          <div 
                            className="absolute inset-0 transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `${getPostColor(selectedPost.id)}33`
                            }}
                          />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className="text-sm font-medium">{option.text}</span>
                            {hasVoted && (
                            <span className="text-xs text-gray-600">
                              {option.votes} votes ({percentage.toFixed(1)}%)
                            </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">{selectedPost.poll.totalVotes} total votes</div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      selectedPost.isLiked ? '' : 'text-gray-600'
                    }`}
                    style={{
                      color: selectedPost.isLiked ? getPostColor(selectedPost.id) : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedPost.isLiked) {
                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedPost.isLiked) {
                        (e.currentTarget as HTMLElement).style.color = '';
                      }
                    }}
                  >
                    <Heart className={`w-5 h-5 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                    {selectedPost.likes_count}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                    {selectedPost.comments_count} comments
                  </span>
                  
                  {/* Edit/Delete buttons for post author */}
                  {selectedPost.author_id === clubAccountId && (
                    <div className="flex items-center gap-2 relative z-10">
                      {selectedPost.post_type !== 'poll' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (editingPost === selectedPost.id) {
                              // If already editing, cancel edit mode
                              setEditingPost(null);
                            } else {
                              // Start edit mode
                              setEditingPost(selectedPost.id);
                              setEditPostTitle(selectedPost.title);
                              setEditPostContent(selectedPost.content || '');
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                          style={{ 
                            pointerEvents: 'auto',
                            color: '#6B7280'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = getPostColor(selectedPost.id);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6B7280';
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeletePost(selectedPost.id, e);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                        style={{ 
                          pointerEvents: 'auto',
                          color: '#6B7280'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6B7280';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Add top-level reply (comment) to post */}
              <div className="mt-4">
                <div className="flex gap-3">
                  <ProfileBubble userName={clubAccountName || 'User'} size="md" borderColor={getPostColor(selectedPost.id)} />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment[selectedPost.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                      className="min-h-[60px] text-sm resize-none bg-white border border-gray-300 shadow-sm"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`anonymous-comment-thread-${selectedPost.id}`}
                            checked={commentAnonymously[selectedPost.id] || false}
                            onChange={(e) => setCommentAnonymously(prev => ({ ...prev, [selectedPost.id]: e.target.checked }))}
                            className="sr-only"
                          />
                          <div 
                            className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                            style={{ 
                              backgroundColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id) : 'white',
                              borderColor: commentAnonymously[selectedPost.id] ? getPostColor(selectedPost.id) : '#d1d5db'
                            }}
                            onClick={() => setCommentAnonymously(prev => ({ ...prev, [selectedPost.id]: !prev[selectedPost.id] }))}
                          >
                            {commentAnonymously[selectedPost.id] && (
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <label htmlFor={`anonymous-comment-thread-${selectedPost.id}`} className="text-xs text-gray-600 cursor-pointer">
                          Post anonymously
                        </label>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addComment(selectedPost.id)}
                        disabled={!newComment[selectedPost.id]?.trim()}
                        className="text-white"
                        style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                        }}
                        onMouseLeave={(e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                        }}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Comments */}
          {loadingComments.has(selectedPost.id) ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#752432] border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {comments[selectedPost.id]?.map((comment) => (
              <div key={comment.id} className="mb-4 ml-8">
                  <div className="flex items-start gap-3">
                    <ProfileBubble 
                      userName={comment.author?.name || 'Anonymous'} 
                      size="md" 
                      borderColor={getPostColor(selectedPost.id)} 
                      isAnonymous={comment.is_anonymous}
                      userId={comment.author_id}
                      onProfileClick={comment.isClubAccount ? undefined : handleProfileClick}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`${!comment.is_anonymous && !comment.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              !comment.is_anonymous && !comment.isClubAccount && handleProfileClick(comment.author_id, comment.author?.name || 'Anonymous');
                            }}
                        >
                          <h5 className="font-medium text-gray-900 text-sm">{comment.is_anonymous ? 'Anonymous' : (comment.author?.name || 'Anonymous')}</h5>
                        </div>
                        {!comment.is_anonymous && !comment.isClubAccount && comment.author?.year && (
                          <span className="text-xs text-gray-500">{comment.author.year}</span>
                        )}
                        <span className="text-xs text-gray-500">•</span>
                        {/* verified badge removed */}
                        <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                        {comment.is_edited && (
                          <span className="text-xs text-gray-400 italic">(edited)</span>
                        )}
                      </div>
                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm bg-white shadow-sm"
                            placeholder="Comment content..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditComment(comment.id);
                              }}
                              className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                              style={{ 
                                backgroundColor: getPostColor(selectedPost.id)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingComment(null);
                              }}
                              className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                              style={{ 
                                backgroundColor: getPostColor(selectedPost.id)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ExpandableText 
                          text={comment.content}
                          maxLines={10}
                          className="text-gray-800 text-base mb-2 whitespace-pre-wrap"
                          buttonColor={getPostColor(selectedPost.id)}
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <button 
                          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                            comment.isLiked ? '' : 'text-gray-600'
                          }`}
                          style={{
                            color: comment.isLiked ? getPostColor(selectedPost.id) : undefined
                          }}
                          onMouseEnter={(e: React.MouseEvent) => {
                            if (!comment.isLiked) {
                              (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                            }
                          }}
                          onMouseLeave={(e: React.MouseEvent) => {
                            if (!comment.isLiked) {
                              (e.currentTarget as HTMLElement).style.color = '';
                            }
                          }}
                          onClick={() => toggleCommentLike(selectedPost.id, comment.id)}
                        >
                          <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes_count}
                        </button>
                        <button 
                          className="text-xs font-medium transition-colors"
                          style={{ 
                            color: '#6B7280'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = getPostColor(selectedPost.id);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6B7280';
                          }}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            setReplyingTo(prev => prev === `${selectedPost.id}:${comment.id}` ? null : `${selectedPost.id}:${comment.id}`); 
                          }}
                        >
                          Reply
                        </button>
                        
                        {/* Edit/Delete buttons for comment author */}
                        {comment.author_id === clubAccountId && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (editingComment === comment.id) {
                                  setEditingComment(null);
                                } else {
                                  setEditingComment(comment.id);
                                  setEditCommentContent(comment.content);
                                }
                              }}
                              className="text-xs font-medium transition-colors"
                              style={{ 
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = getPostColor(selectedPost.id);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteComment(comment.id, e);
                              }}
                              className="text-xs font-medium transition-colors"
                              style={{ 
                                color: '#6B7280'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#DC2626';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                                  <ProfileBubble 
                                    userName={reply.author?.name || 'Anonymous'} 
                                    size="sm" 
                                    borderColor={getPostColor(selectedPost.id)} 
                                    isAnonymous={reply.is_anonymous}
                                    userId={reply.author_id}
                                    onProfileClick={reply.isClubAccount ? undefined : handleProfileClick}
                                  />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className={`${!reply.is_anonymous && !reply.isClubAccount ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      !reply.is_anonymous && !reply.isClubAccount && handleProfileClick(reply.author_id, reply.author?.name || 'Anonymous');
                                    }}
                                  >
                                    <h6 className="font-medium text-gray-900 text-sm">{reply.is_anonymous ? 'Anonymous' : (reply.author?.name || 'Anonymous')}</h6>
                                  </div>
                                  {!reply.is_anonymous && !reply.isClubAccount && reply.author?.year && (
                                    <span className="text-xs text-gray-500">{reply.author.year}</span>
                                  )}
                                  <span className="text-xs text-gray-500">•</span>
                                  {/* verified badge removed */}
                                  <span className="text-xs text-gray-500">{formatTimestamp(reply.created_at)}</span>
                                  {reply.is_edited && (
                                    <span className="text-xs text-gray-400 italic">(edited)</span>
                                  )}
                                </div>
                                {editingComment === reply.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editCommentContent}
                                      onChange={(e) => setEditCommentContent(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none text-xs bg-white shadow-sm"
                                      placeholder="Reply content..."
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditComment(reply.id);
                                        }}
                                        className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                          style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingComment(null);
                                        }}
                                        className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                          style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                          }}
                                        onMouseEnter={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                                        }}
                                        onMouseLeave={(e: React.MouseEvent) => {
                                          (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <ExpandableText 
                                    text={reply.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                                    maxLines={10}
                                    className="text-gray-800 text-sm mb-2 whitespace-pre-wrap"
                                    buttonColor={getPostColor(selectedPost.id)}
                                  />
                                )}
                                <div className="flex items-center gap-3">
                                  <button 
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                                      reply.isLiked ? '' : 'text-gray-600'
                                    }`}
                                    style={{
                                      color: reply.isLiked ? getPostColor(selectedPost.id) : undefined
                                    }}
                                    onMouseEnter={(e: React.MouseEvent) => {
                                      if (!reply.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = getPostColor(selectedPost.id);
                                      }
                                    }}
                                    onMouseLeave={(e: React.MouseEvent) => {
                                      if (!reply.isLiked) {
                                        (e.currentTarget as HTMLElement).style.color = '';
                                      }
                                    }}
                                    onClick={() => toggleCommentLike(selectedPost.id, reply.id)}
                                  >
                                    <Heart className={`w-4 h-4 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    {reply.likes_count}
                                  </button>
                                  
                                  {/* Edit/Delete buttons for reply author */}
                                  {reply.author_id === clubAccountId && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (editingComment === reply.id) {
                                            // If already editing, cancel edit mode
                                            setEditingComment(null);
                                          } else {
                                            // Start edit mode
                                            setEditingComment(reply.id);
                                            setEditCommentContent(reply.content);
                                          }
                                        }}
                                        className="text-xs font-medium transition-colors"
                                        style={{ 
                                          color: '#6B7280'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = getPostColor(selectedPost.id);
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#6B7280';
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDeleteComment(reply.id, e);
                                        }}
                                        className="text-xs font-medium transition-colors"
                                        style={{ 
                                          color: '#6B7280'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#DC2626';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#6B7280';
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  {/* timestamp shown inline with name */}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* reply composer (only one level deep) */}
                      {replyingTo === `${selectedPost.id}:${comment.id}` && (
                        <div className="mt-2 ml-4 space-y-2">
                          <Textarea
                            value={replyText[`${selectedPost.id}:${comment.id}`] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="min-h-[40px] text-xs bg-white border border-gray-300 shadow-sm"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id={`anonymous-reply-thread-${selectedPost.id}-${comment.id}`}
                                  checked={replyAnonymously[`${selectedPost.id}:${comment.id}`] || false}
                                  onChange={(e) => setReplyAnonymously(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: e.target.checked }))}
                                  className="sr-only"
                                />
                                <div 
                                  className="w-3 h-3 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
                                  style={{ 
                                    backgroundColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id) : 'white',
                                    borderColor: replyAnonymously[`${selectedPost.id}:${comment.id}`] ? getPostColor(selectedPost.id) : '#d1d5db'
                                  }}
                                  onClick={() => setReplyAnonymously(prev => ({ ...prev, [`${selectedPost.id}:${comment.id}`]: !prev[`${selectedPost.id}:${comment.id}`] }))}
                                >
                                  {replyAnonymously[`${selectedPost.id}:${comment.id}`] && (
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <label htmlFor={`anonymous-reply-thread-${selectedPost.id}-${comment.id}`} className="text-xs text-gray-600 cursor-pointer">
                                Post anonymously
                              </label>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addReply(selectedPost.id, comment.id)}
                              disabled={!replyText[`${selectedPost.id}:${comment.id}`]?.trim()}
                              className="text-white"
                              style={{ 
                            backgroundColor: getPostColor(selectedPost.id)
                              }}
                              onMouseEnter={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(selectedPost.id)}90`;
                              }}
                              onMouseLeave={(e: React.MouseEvent) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(selectedPost.id);
                              }}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ height: '30px' }}></div>
        </div>
      </div>
      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        position={confirmationPopup.position}
        onConfirm={confirmationPopup.onConfirm}
        onCancel={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))}
        confirmText="Delete"
        cancelText="Cancel"
      />
      </>
    );
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;

    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const { error } = await supabase
        .from('comments')
        .update({
          content: editCommentContent.trim(),
          edited_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', commentId)
        .eq('author_id', clubAccountId);

      if (error) {
        console.error('Error editing comment:', error?.message || "Unknown error");
        return;
      }

      // Update local state
      setComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(postId => {
          updated[postId] = updated[postId].map(c => {
            if (c.id === commentId) {
              return { ...c, content: editCommentContent.trim(), is_edited: true };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map(r =>
                  r.id === commentId
                    ? { ...r, content: editCommentContent.trim(), is_edited: true }
                    : r
                )
              };
            }
            return c;
          });
        });
        return updated;
      });

      setEditingComment(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Error in handleEditComment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      // Find which post this comment belongs to
      let postId: string | null = null;
      Object.keys(comments).forEach(pId => {
        const comment = comments[pId].find(c => c.id === commentId);
        if (comment) {
          postId = pId;
        }
        if (!postId) {
          const reply = comments[pId].find(c => c.replies?.some(r => r.id === commentId));
          if (reply) {
            postId = pId;
          }
        }
      });

      if (!postId) return;

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', clubAccountId);

      if (error) {
        console.error('Error deleting comment:', error?.message || "Unknown error");
        return;
      }

      // Update local state
      setComments(prev => {
        const updated = { ...prev };
        if (updated[postId!]) {
          updated[postId!] = updated[postId!]
            .map(c => {
              if (c.replies) {
                return {
                  ...c,
                  replies: c.replies.filter(r => r.id !== commentId)
                };
              }
              return c;
            })
            .filter(c => c.id !== commentId);
        }
        return updated;
      });

      // Update post comments count
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments_count: Math.max(0, p.comments_count - 1) };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error in handleDeleteComment:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  const toggleCommentLike = async (postId: string, commentId: string) => {
    try {
      const clubAccountId = await getClubAccountId();
      if (!clubAccountId) return;

      const comment = comments[postId]?.find(c => c.id === commentId);
      if (!comment) return;

      const { data: currentLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', clubAccountId)
        .eq('likeable_type', 'comment')
        .eq('likeable_id', commentId)
        .maybeSingle();

      const isCurrentlyLiked = !!currentLike;

      if (isCurrentlyLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', clubAccountId)
          .eq('likeable_type', 'comment')
          .eq('likeable_id', commentId);
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: clubAccountId,
            likeable_type: 'comment',
            likeable_id: commentId
          });
      }

      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: !isCurrentlyLiked,
              likes_count: isCurrentlyLiked ? c.likes_count - 1 : c.likes_count + 1
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId
                  ? {
                      ...r,
                      isLiked: !isCurrentlyLiked,
                      likes_count: isCurrentlyLiked ? r.likes_count - 1 : r.likes_count + 1
                    }
                  : r
              )
            };
          }
          return c;
        })
      }));
    } catch (error) {
      console.error('Error in toggleCommentLike:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Conditional rendering - if thread view is open, show full-page thread view
  if (selectedPostThread) {
    return renderThreadView();
  }

  return (
    <div className="h-full flex flex-col overflow-hidden pb-4" style={{ minHeight: 0 }}>
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-gray-900 mb-1 text-lg">Club Feed</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <p className="text-gray-600 text-sm">Create posts to share with your community</p>
          <h3 className="text-gray-900 text-sm">Your Posts ({posts.length})</h3>
        </div>
      </div>

      {/* Split Layout: Create Post (Left) and Your Posts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden mb-4" style={{ minHeight: 0 }}>
        {/* Left: Create Post Form - Matching Home Page Feed */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col overflow-hidden">
        <div className="space-y-3 flex-1 overflow-y-auto" style={{ marginTop: 0 }}>
          {/* Post Type Selection */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setNewPostType('text');
                setNewYoutubeLink('');
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                newPostType === 'text' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <img src="/text_picture_icon.svg" alt="Text and Picture" className="h-5 w-auto object-contain" />
              <span>Text and Picture</span>
            </button>
            <button
              onClick={() => {
                if (postPhotoPreview) {
                  handleRemovePostPhoto();
                }
                setNewPostType('youtube');
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                newPostType === 'youtube' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <img src="/yt_icon_red_digital.png" alt="YouTube" className="h-6 w-auto object-contain" />
              <img src="/Youtube_shorts_icon.svg" alt="YouTube Shorts" className="h-5 w-auto object-contain" />
              <img src="/TikTok_Icon_Black_Circle.png" alt="TikTok" className="h-5 w-auto object-contain" />
              <img src="/Instagram_Glyph_Gradient.png" alt="Instagram" className="h-5 w-auto object-contain" />
            </button>
            <button
              onClick={() => {
                if (postPhotoPreview) {
                  handleRemovePostPhoto();
                }
                setNewYoutubeLink('');
                setNewPostType('poll');
              }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                newPostType === 'poll' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <img src="/poll_icon.svg" alt="Poll" className="h-5 w-auto object-contain align-middle" />
              <span className="align-middle">Poll</span>
            </button>
          </div>

          {/* Title Field */}
          <div>
            <Input
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="An interesting title"
              maxLength={100}
              className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] font-medium bg-white"
              style={{ fontSize: '16px' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              {newPostTitle.length}/100
            </div>
          </div>

          {/* Text Content - Only show for text posts */}
          {newPostType === 'text' && (
            <div className="space-y-3">
              <div>
                <Textarea
                  value={newPost}
                  onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPost)}
                  placeholder="What are your thoughts?"
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] resize-none overflow-y-auto bg-white"
                  style={{ height: '120px', minHeight: '120px', maxHeight: '120px', fontSize: '14px' }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {countWords(newPost)}/1000 words
                </div>
              </div>

              {/* Photo Upload Dropbox */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Add a photo</div>
                <div className="photo-drop-zone">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative overflow-hidden ${
                      isDragOverPhotoDrop 
                        ? 'border-[#752432] bg-gray-50' 
                        : 'border-gray-300 hover:border-[#752432] hover:bg-gray-50'
                    }`}
                    style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverPhotoDrop(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverPhotoDrop(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverPhotoDrop(false);
                      
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('image/')) {
                          const syntheticEvent = {
                            target: { files: [file], value: '' }
                          } as unknown as React.ChangeEvent<HTMLInputElement>;
                          handlePostPhotoUpload(syntheticEvent);
                        }
                      }
                    }}
                    onClick={() => {
                      if (!postPhotoPreview) {
                        document.getElementById('post-photo-upload')?.click();
                      }
                    }}
                  >
                    {postPhotoPreview ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={postPhotoPreview}
                          alt="Post preview"
                          className="max-w-full max-h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePostPhoto();
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg z-10"
                          aria-label="Remove photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {uploadingPostPhoto ? 'Processing image...' : 'Add a photo'}
                        </span>
                        <span className="text-xs text-gray-500">Click to upload or drag and drop</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePostPhotoUpload}
                    disabled={uploadingPostPhoto}
                    className="hidden"
                    id="post-photo-upload"
                  />
                </div>
              </div>
            </div>
          )}

          {/* YouTube Content - Only show for youtube posts */}
          {newPostType === 'youtube' && (
            <div className="space-y-3">
              <div>
                <Textarea
                  value={newPost}
                  onChange={(e) => handleTextChangeWithWordLimit(e.target.value, 1000, setNewPost)}
                  placeholder="What are your thoughts?"
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] resize-none overflow-y-auto bg-white"
                  style={{ height: '120px', minHeight: '120px', maxHeight: '120px', fontSize: '14px' }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {countWords(newPost)}/1000 words
                </div>
              </div>

              {/* YouTube Link Input */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Paste video link (YouTube, YouTube Shorts, TikTok, or Instagram)</div>
                <Input
                  value={newYoutubeLink}
                  onChange={(e) => setNewYoutubeLink(e.target.value)}
                  placeholder="Paste YouTube, TikTok, or Instagram link"
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] bg-white"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Poll Options */}
          {newPostType === 'poll' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Poll options</h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                {pollOptions.map((option, index) => (
                  <div key={index} className="space-y-1 mb-3 last:mb-0">
                    <div className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                        className="flex-1 bg-white"
                        style={{ fontSize: '14px' }}
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePollOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-1">
                      {option.length}/100
                    </div>
                  </div>
                ))}
              </div>
              {pollOptions.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPollOption}
                  className="text-[#752432] border-[#752432] hover:bg-[#752432]/10"
                >
                  Add option
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end pt-3 border-t flex-shrink-0 mt-3">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewPost('');
                  setNewPostTitle('');
                  setNewPostType('text');
                  setPollOptions(['', '']);
                  setNewYoutubeLink('');
                  if (postPhotoPreview) {
                    handleRemovePostPhoto();
                  }
                }}
              >
                Clear
              </Button>
              <Button 
                onClick={handleCreatePost}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: '#04913A' }}
                disabled={
                  !newPostTitle.trim() || 
                  (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) ||
                  (newPostType === 'youtube' && !newYoutubeLink.trim())
                }
              >
                Post
              </Button>
            </div>
          </div>
        </div>
        </div>

        {/* Right: Your Posts */}
        <div className="flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col overflow-hidden flex-1" style={{ minHeight: 0 }}>
            {/* Feed View */}
            <>
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, paddingBottom: '30px' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600">No posts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="overflow-hidden transition-all duration-200 border-l-4 cursor-pointer"
                    style={{ 
                      backgroundColor: hoveredPostId === post.id ? getPostHoverColor(post.id) : '#FEFBF6',
                      borderLeftColor: getPostColor(post.id)
                    }}
                    onClick={() => handlePostClick(post.id)}
                    onMouseEnter={() => setHoveredPostId(post.id)}
                    onMouseLeave={() => setHoveredPostId(prev => (prev === post.id ? null : prev))}
                  >
                    <div className="p-4" style={{ backgroundColor: 'transparent' }}>
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <ProfileBubble 
                              userName={post.author?.name || 'Club'} 
                              size="md" 
                              borderColor={getPostColor(post.id)} 
                              isAnonymous={post.is_anonymous}
                              userId={post.author_id}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {post.is_anonymous ? 'Anonymous' : (post.author?.name || 'Club')}
                                </h4>
                                {!post.is_anonymous && (
                                  <span 
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                    style={{ backgroundColor: '#752432' }}
                                  >
                                    Club
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</span>
                                {post.is_edited && (
                                  <span className="text-xs text-gray-400 italic">(edited)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Title */}
                      {editingPost !== post.id && (
                        <div className="mb-3">
                          <h2 className="text-lg font-semibold text-gray-900 leading-tight">{post.title}</h2>
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="mb-3">
                        {editingPost === post.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editPostTitle}
                              onChange={(e) => setEditPostTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              maxLength={100}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Post title..."
                            />
                            {post.post_type !== 'poll' && (
                              <textarea
                                value={editPostContent}
                                onChange={(e) => setEditPostContent(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                maxLength={1000}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                placeholder="Post content..."
                              />
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(post.id);
                                }}
                                className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                style={{ backgroundColor: getPostColor(post.id) }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id)}90`;
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id);
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPost(null);
                                }}
                                className="px-2 py-1 text-white rounded-md transition-colors text-xs"
                                style={{ backgroundColor: getPostColor(post.id) }}
                                onMouseEnter={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = `${getPostColor(post.id)}90`;
                                }}
                                onMouseLeave={(e: React.MouseEvent) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = getPostColor(post.id);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                      ) : (
                          <ExpandableText 
                            text={post.content ? post.content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') : ''}
                            maxLines={10}
                            className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap"
                            buttonColor={getPostColor(post.id)}
                          />
                      )}
                    </div>

                      {/* Post Photo */}
                      {post.photo_url && postPhotoUrls.has(post.id) && (
                        <div className="mb-3 mt-3">
                          <img
                            src={postPhotoUrls.get(post.id) || ''}
                            alt="Post"
                            className="rounded-lg"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '450px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain'
                            }}
                            onError={(_e) => {
                              if (post.photo_url) {
                                getStorageUrl(post.photo_url, 'post_picture').then(url => {
                                  if (url) {
                                    setPostPhotoUrls(prev => {
                                      const newMap = new Map(prev);
                                      newMap.set(post.id, url);
                                      return newMap;
                                    });
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Video Embed */}
                      {post.vid_link && (
                        <div className="mb-3 mt-3">
                          {(() => {
                            const embedData = getVideoEmbedUrl(post.vid_link);
                            if (!embedData) {
                              return (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    Invalid video URL: {post.vid_link}
                                  </p>
                      </div>
                              );
                            }
                            const isVertical = embedData.platform === 'tiktok' || embedData.platform === 'instagram';
                            const isInstagram = embedData.platform === 'instagram';
                            const scale = isInstagram ? 0.75 : 0.85;
                            const width = isInstagram ? '133.33%' : '117.65%';
                            const height = isInstagram ? '133.33%' : '117.65%';
                            return (
                              <div 
                                className="relative overflow-hidden rounded-lg" 
                                style={isVertical 
                                  ? { 
                                      maxHeight: '600px', 
                                      maxWidth: isInstagram ? '75%' : '65%',
                                      width: isInstagram ? '75%' : '65%',
                                      aspectRatio: '9/16',
                                      margin: '0 auto'
                                    } 
                                  : { paddingBottom: '56.25%', minHeight: '200px', width: '100%' }
                                }
                              >
                                <iframe
                                  src={embedData.embedUrl}
                                  title={`${embedData.platform} video player`}
                                  frameBorder="0"
                                  scrolling="no"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className={isVertical ? "rounded-lg" : "absolute top-0 left-0 w-full h-full rounded-lg"}
                                  style={isVertical 
                                    ? { 
                                        border: 'none', 
                                        overflow: 'hidden',
                                        transform: `translate(-50%, -50%) scale(${scale})`,
                                        transformOrigin: 'center center',
                                        width: width,
                                        height: height,
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%'
                                      }
                                    : { border: 'none', overflow: 'hidden' }
                                  }
                                />
                    </div>
                            );
                          })()}
                  </div>
                      )}

                      {/* Poll Component */}
                      {post.poll && (
                        <div className="mb-4 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">{post.poll.question}</h4>
                          <div className="space-y-2">
                            {post.poll.options.map((option) => {
                              const hasVoted = post.poll!.userVotedOptionId !== undefined;
                              const percentage = hasVoted && post.poll!.totalVotes > 0 
                                ? (option.votes / post.poll!.totalVotes * 100) 
                                : 0;
                              const isSelected = post.poll!.userVotedOptionId === option.id;
                              
                              return (
                                <button
                                  key={option.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVotePoll(post.id, option.id);
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                                    isSelected 
                                      ? 'bg-gray-50'
                                      : hasVoted
                                      ? 'border-gray-200 bg-gray-50'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                  style={{
                                    borderColor: isSelected ? getPostColor(post.id) : undefined,
                                    backgroundColor: isSelected ? `${getPostColor(post.id)}0D` : undefined
                                  }}
                                >
                                  {hasVoted && (
                                    <div 
                                      className="absolute inset-0 transition-all duration-300"
                                      style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: `${getPostColor(post.id)}33`
                                      }}
                                    />
                                  )}
                                  <div className="relative flex items-center justify-between">
                                    <span className="text-sm font-medium">{option.text}</span>
                                    {hasVoted && (
                                      <span className="text-xs text-gray-600">
                                        {option.votes} votes ({percentage.toFixed(1)}%)
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 text-xs text-gray-500">{`${post.poll.totalVotes} total votes`}</div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-start pt-4 mt-1 border-t border-gray-200" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(post.id);
                            }}
                            disabled={likingPosts.has(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{
                              color: post.isLiked ? getPostColor(post.id) : '#6B7280'
                            }}
                            onMouseEnter={(e) => {
                              if (!post.isLiked) {
                                (e.currentTarget as HTMLElement).style.color = getPostColor(post.id);
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!post.isLiked) {
                                (e.currentTarget as HTMLElement).style.color = '#6B7280';
                              }
                            }}
                          >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            {post.likes_count}
                          </button>
                          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <MessageCircle className="w-5 h-5" />
                            {post.comments_count}
                          </span>
                          
                          {/* Edit/Delete buttons for post author */}
                          {post.author_id === user?.id && (
                            <div className="flex items-center gap-2 relative z-10">
                              {post.post_type !== 'poll' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (editingPost === post.id) {
                                      setEditingPost(null);
                                    } else {
                                      setEditingPost(post.id);
                                      setEditPostTitle(post.title);
                                      setEditPostContent(post.content || '');
                                    }
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                                  style={{ 
                                    pointerEvents: 'auto',
                                    color: '#6B7280'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = getPostColor(post.id);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#6B7280';
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeletePost(post.id, e);
                                }}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-md relative z-10"
                                style={{ 
                                  pointerEvents: 'auto',
                                  color: '#6B7280'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#DC2626';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#6B7280';
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                </div>
              </Card>
              ))}
              <div style={{ height: '30px' }}></div>
              </div>
            )}
          </div>
          </>
          </div>
        </div>
      </div>
      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        position={confirmationPopup.position}
        onConfirm={confirmationPopup.onConfirm}
        onCancel={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

// Main Component
export const ClubAccountPage: React.FC = () => {
  const [formData, setFormData] = useState<ClubFormData>({
    picture: '',
    name: '',
    description: '',
    tag: '',
    missionPurpose: '',
    email: '',
    website: '',
    events: [],
    members: [],
    posts: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [savingMission, setSavingMission] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Store original values to detect changes
  const [originalValues, setOriginalValues] = useState<{
    name: string;
    tag: string;
    description: string;
    missionPurpose: string;
    email: string;
    website: string;
  }>({
    name: '',
    tag: '',
    description: '',
    missionPurpose: '',
    email: '',
    website: ''
  });

  // Fetch club account data on mount
  useEffect(() => {
    const fetchClubAccountData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          toast.error('Failed to load user data');
          setLoading(false);
          return;
        }

        // Fetch club account data
        const { data, error } = await supabase
          .from('club_accounts')
          .select('name, club_tag, description, mission, email, website, avatar_url, events, members')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching club account:', error?.message || "Unknown error");
          toast.error('Failed to load club data');
          setLoading(false);
          return;
        }

        // Populate form data if club account exists
        if (data) {
          // Get signed URL for avatar if it exists
          let avatarUrl = '';
          if (data.avatar_url) {
            const signedUrl = await getStorageUrl(data.avatar_url, 'Avatar');
            avatarUrl = signedUrl || '';
          }

          const loadedData = {
            name: data.name || '',
            tag: data.club_tag || '',
            description: data.description || '',
            missionPurpose: data.mission || '',
            email: data.email || '',
            website: data.website || ''
          };

          // Parse events from JSONB (default to empty array if null)
          const events: Event[] = data.events && Array.isArray(data.events) 
            ? data.events
                .filter((event: any) => event && typeof event === 'object') // Filter out invalid entries
                .map((event: any) => ({
                  id: event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID if missing
                  name: event.name || '',
                  date: event.date || '',
                  time: event.time ? event.time.split(':').slice(0, 2).join(':') : '', // Normalize to HH:MM format
                  location: event.location || '',
                  shortDescription: event.shortDescription || '',
                  fullDescription: event.fullDescription || '',
                  rsvps: event.rsvps && Array.isArray(event.rsvps) ? event.rsvps.filter((id: any) => typeof id === 'string') : [] // Ensure RSVPs are strings
                }))
            : [];

          // Parse members from JSONB and convert picture filenames to signed URLs
          const members: Member[] = data.members && Array.isArray(data.members)
            ? await Promise.all(
                data.members
                  .filter((member: any) => member && typeof member === 'object')
                  .map(async (member: any) => {
                    let pictureUrl = member.picture || '';
                    // Convert filename to signed URL if it exists
                    if (member.picture && !member.picture.startsWith('data:')) {
                      const signedUrl = await getStorageUrl(member.picture, 'Avatar');
                      pictureUrl = signedUrl || '';
                    }
                    return {
                      id: member.id || `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      name: member.name || '',
                      picture: pictureUrl, // Use signed URL for display
                      bio: member.bio || '',
                      role: member.role || '',
                      email: member.email || ''
                    };
                  })
              )
            : [];

          setFormData(prev => ({
            ...prev,
            ...loadedData,
            picture: avatarUrl,
            events: events,
            members: members
          }));
          
          // Store original values for change detection
          setOriginalValues(loadedData);
          
          // Store the current avatar URL for deletion purposes
          setCurrentAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error('Unexpected error fetching club account:', err instanceof Error ? err.message : "Unknown error");
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClubAccountData();
  }, []);

  const updateFormData = (field: keyof ClubFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save function for Basic Info box (picture, name, tag, description)
  const handleSaveBasicInfo = async () => {
    // Validate required fields
    if (!formData.name || !formData.description || !formData.tag) {
      toast.error('Please fill out all required fields: Club Name, Club Tag, and Club Description');
      return;
    }

    try {
      setSavingBasicInfo(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to save: User not authenticated');
        setSavingBasicInfo(false);
        return;
      }

      // Get current avatar_url from database (avatar is uploaded immediately on selection, not during save)
      let avatarUrl: string | null = null;
      const { data: existingData } = await supabase
        .from('club_accounts')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingData?.avatar_url) {
        avatarUrl = existingData.avatar_url;
      }

      // Update only basic info fields
      const { error } = await supabase
        .from('club_accounts')
        .update({
          name: formData.name || null,
          club_tag: formData.tag || null,
          description: formData.description || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating club account:', error?.message || "Unknown error");
        toast.error('Failed to save basic information');
        setSavingBasicInfo(false);
        return;
      }

      // Update original values after successful save
      setOriginalValues({
        ...originalValues,
        name: formData.name || '',
        tag: formData.tag || '',
        description: formData.description || ''
      });

      toast.success('Basic information saved successfully!');
    } catch (err) {
      console.error('Unexpected error saving basic info:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while saving');
    } finally {
      setSavingBasicInfo(false);
    }
  };

  // Save function for Mission & Purpose box
  const handleSaveMission = async () => {
    try {
      setSavingMission(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to save: User not authenticated');
        setSavingMission(false);
        return;
      }

      // Update only mission field
      const { error } = await supabase
        .from('club_accounts')
        .update({
          mission: formData.missionPurpose || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating mission:', error?.message || "Unknown error");
        toast.error('Failed to save mission and purpose');
        setSavingMission(false);
        return;
      }

      // Update original values after successful save
      setOriginalValues({
        ...originalValues,
        missionPurpose: formData.missionPurpose || ''
      });

      toast.success('Mission and purpose saved successfully!');
    } catch (err) {
      console.error('Unexpected error saving mission:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while saving');
    } finally {
      setSavingMission(false);
    }
  };

  // Save function for Contact Information box
  const handleSaveContact = async () => {
    try {
      setSavingContact(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('Failed to save: User not authenticated');
        setSavingContact(false);
        return;
      }

      // Update only contact fields
      const { error } = await supabase
        .from('club_accounts')
        .update({
          email: formData.email || null,
          website: formData.website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating contact info:', error?.message || "Unknown error");
        toast.error('Failed to save contact information');
        setSavingContact(false);
        return;
      }

      // Update original values after successful save
      setOriginalValues({
        ...originalValues,
        email: formData.email || '',
        website: formData.website || ''
      });

      toast.success('Contact information saved successfully!');
    } catch (err) {
      console.error('Unexpected error saving contact info:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred while saving');
    } finally {
      setSavingContact(false);
    }
  };

  // Check if basic info has changes (excluding avatar)
  const hasBasicInfoChanges = useMemo(() => {
    return (
      formData.name !== originalValues.name ||
      formData.tag !== originalValues.tag ||
      formData.description !== originalValues.description
    );
  }, [formData.name, formData.tag, formData.description, originalValues]);

  // Check if mission has changes
  const hasMissionChanges = useMemo(() => {
    return formData.missionPurpose !== originalValues.missionPurpose;
  }, [formData.missionPurpose, originalValues.missionPurpose]);

  // Check if contact has changes
  const hasContactChanges = useMemo(() => {
    return (
      formData.email !== originalValues.email ||
      formData.website !== originalValues.website
    );
  }, [formData.email, formData.website, originalValues]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error?.message || "Unknown error");
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
        // Redirect will be handled by auth state change in App.tsx
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Unexpected error signing out:', err instanceof Error ? err.message : "Unknown error");
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#faf5ef', overflowX: 'hidden' }}>
      <div className="w-full h-full flex-1 overflow-y-auto px-4 pt-4 pb-0" style={{ overflowX: 'hidden' }}>
        <div className="w-full mx-auto h-full flex flex-col" style={{ maxWidth: '95vw' }}>
          <div className="mb-4 flex items-center gap-4 relative flex-shrink-0">
            <img src="/QUAD.svg" alt="Quad Logo" className="w-12 h-12 object-contain" style={{ minWidth: '48px' }} />
            <h1 className="text-3xl font-semibold absolute left-1/2 transform -translate-x-1/2" style={{ color: '#000000' }}>Club Console</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="ml-auto"
              style={{ backgroundColor: '#fefbf6', borderColor: '#5a3136', color: '#752532' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-center mb-2">
              <TabsList className="grid grid-cols-4 h-auto flex-shrink-0 shadow-sm" style={{ minHeight: '36px', backgroundColor: '#fefbf6', width: '750px' }}>
              <TabsTrigger value="basic" className="text-xs h-full flex items-center justify-center py-1">Basic Info</TabsTrigger>
              <TabsTrigger value="events" className="text-xs h-full flex items-center justify-center py-1">Events</TabsTrigger>
              <TabsTrigger value="members" className="text-xs h-full flex items-center justify-center py-1">Members</TabsTrigger>
              <TabsTrigger value="feed" className="text-xs h-full flex items-center justify-center py-1">Feed</TabsTrigger>
            </TabsList>
            </div>

            <div className={`flex-1 pr-2 ${activeTab === 'basic' ? 'overflow-hidden' : 'overflow-y-auto'}`} style={{ minHeight: 0, paddingBottom: activeTab === 'basic' ? 0 : undefined }}>
              <TabsContent value="basic" className="overflow-hidden h-full" style={{ width: '100%', paddingBottom: 0, marginBottom: 0 }}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-600">Loading club data...</p>
                  </div>
                ) : (
                  <ClubBasicInfo 
                    formData={formData}
                    updateFormData={updateFormData}
                    onSaveBasicInfo={handleSaveBasicInfo}
                    onSaveMission={handleSaveMission}
                    onSaveContact={handleSaveContact}
                    savingBasicInfo={savingBasicInfo}
                    savingMission={savingMission}
                    savingContact={savingContact}
                    onAvatarUploaded={(fileName) => {
                      setCurrentAvatarUrl(fileName);
                    }}
                    onAvatarDeleted={() => {
                      setCurrentAvatarUrl(null);
                    }}
                    currentAvatarUrl={currentAvatarUrl}
                    uploadingAvatar={uploadingAvatar}
                    setUploadingAvatar={setUploadingAvatar}
                    hasBasicInfoChanges={hasBasicInfoChanges}
                    hasMissionChanges={hasMissionChanges}
                    hasContactChanges={hasContactChanges}
                  />
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <div className="max-w-2xl mx-auto">
                  <ClubEvents
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="max-w-2xl mx-auto">
                  <ClubMembers
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </div>
              </TabsContent>

              <TabsContent value="feed" className="h-full" style={{ minHeight: 0 }}>
                <ClubFeedPost
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
