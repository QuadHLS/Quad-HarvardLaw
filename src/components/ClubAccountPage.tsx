import React, { useState, ChangeEvent, useEffect, useMemo } from 'react';
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
  Users, Search, User, MessageSquare, Target, ExternalLink, Globe, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStorageUrl, extractFilename } from '../utils/storage';

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
        console.error('Error uploading avatar:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
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
        console.error('Error updating avatar URL:', updateError);
        console.error('Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
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
      console.error('Error uploading avatar:', error);
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
      console.error('Error deleting avatar:', error);
      toast.error('Error deleting avatar. Please try again.');
    }
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 200) {
      updateFormData('description', e.target.value);
    }
  };

  const charCount = formData.description.length;

  return (
    <div className="space-y-6">
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
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {charCount}/200 characters
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
          console.error('Error fetching RSVP names:', error);
          return;
        }

        // Create a map of userId -> fullName
        const namesMap: Record<string, string> = {};
        data?.forEach((profile: { id: string; full_name: string | null }) => {
          namesMap[profile.id] = profile.full_name || 'Unknown User';
        });

        setRsvpNames(namesMap);
      } catch (err) {
        console.error('Unexpected error fetching RSVP names:', err);
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
        console.error('Error deleting event:', error);
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
      console.error('Unexpected error deleting event:', err);
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
          console.error('Error saving events:', error);
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
        console.error('Unexpected error saving event:', err);
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
        console.error('Error deleting RSVP:', error);
        toast.error('Failed to delete RSVP');
        // Revert local state on error
        updateFormData('events', formData.events);
        return;
      }

      toast.success('RSVP removed successfully');
    } catch (err) {
      console.error('Unexpected error deleting RSVP:', err);
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
          {/* Show saved events and currently editing event (if new) */}
          {[
            ...formData.events,
            ...(editingEvent && editFormData && !formData.events.find(e => e.id === editingEvent) ? [editFormData] : [])
          ].map((event) => (
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
                            <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
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
          console.log('Deleting member picture from storage:', fileName);
          // Delete from storage (same logic as avatar deletion)
          const { error: deleteError } = await supabase.storage
            .from('Avatar')
            .remove([fileName]);
          
          if (deleteError) {
            console.error('Error deleting member picture from storage:', deleteError);
            // Continue with member deletion even if picture delete fails
          } else {
            console.log('Successfully deleted member picture from storage:', fileName);
          }
        } else {
          console.warn('Could not extract filename from member picture:', memberToDelete.picture);
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
        console.error('Error deleting member:', error);
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
      console.error('Unexpected error deleting member:', err);
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
          console.error('Error saving members:', error);
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
        console.error('Unexpected error saving member:', err);
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
      console.error('Error uploading member picture:', error);
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
      console.error('Error deleting member picture:', error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Show saved members and currently editing member (if new) */}
          {[
            ...formData.members,
            ...(editingMember && editFormData && !formData.members.find(m => m.id === editingMember) ? [editFormData] : [])
          ].map((member) => (
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
                      <div className="w-20 h-20 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: '#5a3136' }}>
                        <img 
                          src={member.picture} 
                          alt={member.name}
                          className="w-full h-full"
                          style={{ 
                            objectFit: 'cover'
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
      )}
    </div>
  );
}

// ClubFeedPost Component
function ClubFeedPost({ formData, updateFormData }: { formData: ClubFormData; updateFormData: (field: keyof ClubFormData, value: any) => void }) {
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'poll' | 'youtube'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [isDragOverPhotoDrop, setIsDragOverPhotoDrop] = useState(false);
  const [newYoutubeLink, setNewYoutubeLink] = useState('');

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
      // Store preview URL for display (feed page is not connected to backend)
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

  const handleCreatePost = () => {
    if (!newPostTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (newPostType === 'poll' && pollOptions.filter(opt => opt.trim()).length < 2) {
      toast.error('Please add at least 2 poll options');
      return;
    }

    if (newPostType === 'youtube' && !newYoutubeLink.trim()) {
      toast.error('Please enter a video link');
      return;
    }

    const newPostItem: Post = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPost,
      timestamp: new Date()
    };

    updateFormData('posts', [newPostItem, ...formData.posts]);
    
    // Reset form
    setNewPost('');
    setNewPostTitle('');
    setNewPostType('text');
    setPollOptions(['', '']);
    setNewYoutubeLink('');
    if (postPhotoPreview) {
      handleRemovePostPhoto();
    }
    
    toast.success('Post added successfully!');
  };

  const deletePost = (id: string) => {
    updateFormData('posts', formData.posts.filter(post => post.id !== id));
    toast.success('Post deleted');
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-gray-900 mb-1 text-lg">Club Feed</h2>
        <p className="text-gray-600 text-sm">Create posts to share with your community</p>
      </div>

      {/* Split Layout: Create Post (Left) and Your Posts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
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
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What are your thoughts?"
                  maxLength={1000}
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] resize-none overflow-y-auto bg-white"
                  style={{ height: '120px', minHeight: '120px', maxHeight: '120px', fontSize: '14px' }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newPost.length}/1000
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
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What are your thoughts?"
                  maxLength={1000}
                  className="border-gray-300 focus:border-[#752432] focus:ring-[#752432] resize-none overflow-y-auto bg-white"
                  style={{ height: '120px', minHeight: '120px', maxHeight: '120px', fontSize: '14px' }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newPost.length}/1000
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col overflow-hidden">
          <h3 className="text-gray-900 mb-3 flex-shrink-0" style={{ marginTop: 0 }}>Your Posts ({formData.posts.length})</h3>
          
          <div className="flex-1 overflow-y-auto">
            {formData.posts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600">No posts</p>
              </div>
            ) : (
              <div className="space-y-4">
            {formData.posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {formData.picture ? (
                        <img 
                          src={formData.picture} 
                          alt="Club"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900">{formData.name || ''}</span>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(post.timestamp)}</span>
                        </div>
                      </div>
                      <h4 className="text-gray-900 mb-2">{post.title}</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deletePost(post.id)}
                    className="flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span>Upvote</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </Card>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
          console.error('Error fetching club account:', error);
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
        console.error('Unexpected error fetching club account:', err);
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
        console.error('Error updating club account:', error);
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
      console.error('Unexpected error saving basic info:', err);
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
        console.error('Error updating mission:', error);
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
      console.error('Unexpected error saving mission:', err);
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
        console.error('Error updating contact info:', error);
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
      console.error('Unexpected error saving contact info:', err);
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
        console.error('Error signing out:', error);
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
        // Redirect will be handled by auth state change in App.tsx
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Unexpected error signing out:', err);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#faf5ef', overflowX: 'hidden' }}>
      <div className="w-full h-full flex-1 overflow-y-auto px-4 py-4" style={{ overflowX: 'hidden' }}>
        <div className="w-full mx-auto h-full flex flex-col" style={{ maxWidth: '95vw' }}>
          <div className="mb-4 flex items-center gap-4 relative flex-shrink-0">
            <img src="/QUAD.svg" alt="Quad Logo" className="w-12 h-12 object-contain" style={{ minWidth: '48px' }} />
            <h1 className="text-3xl font-semibold absolute left-1/2 transform -translate-x-1/2" style={{ color: '#752532' }}>Club Console</h1>
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
            <div className="flex justify-center mb-4">
              <TabsList className="grid grid-cols-4 h-auto flex-shrink-0 shadow-sm" style={{ minHeight: '36px', backgroundColor: '#fefbf6', width: '750px' }}>
              <TabsTrigger value="basic" className="text-xs h-full flex items-center justify-center py-1">Basic Info</TabsTrigger>
              <TabsTrigger value="events" className="text-xs h-full flex items-center justify-center py-1">Events</TabsTrigger>
              <TabsTrigger value="members" className="text-xs h-full flex items-center justify-center py-1">Members</TabsTrigger>
              <TabsTrigger value="feed" className="text-xs h-full flex items-center justify-center py-1">Feed</TabsTrigger>
            </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
              <TabsContent value="basic" className="space-y-4" style={{ width: '100%' }}>
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
