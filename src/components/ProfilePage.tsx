import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, Edit, Save, X, Star, FileText, MessageSquare, Trophy, BookOpen, Clock, Upload, Heart, ArrowLeft, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CourseSelectionPage } from './CourseSelectionPage';

interface UserStats {
  outlinesSaved: number;
  outlinesUploaded: number;
  reviewsWritten: number;
  postsCreated: number;
  reputation: number;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  linkedin: string;
  avatar_url: string;
  photo_urls: string[];
  year: string;
  section: string;
  age: number;
  hometown: string;
  summerCity: string;
  summerFirm: string;
  bio: string;
  currentCourses: { name: string; professor: string }[];
  clubMemberships: string[];
  stats: UserStats;
  schedule: { [key: string]: { course: string; time: string; location: string }[] };
}

interface ProfilePageProps {
  studentName?: string;
  onBack?: () => void;
}

export function ProfilePage({ studentName, onBack }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangeName, setShowChangeName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showChangeCourses, setShowChangeCourses] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [showCourseSelection, setShowCourseSelection] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);


  // Fetch profile data from Supabase
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone, class_year, section, classes, age, hometown, summer_city, summer_firm, instagram, linkedin, avatar_url, photo_urls')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Convert Supabase profile data to ProfileData format
          const convertedProfile: ProfileData = {
            name: profile.full_name || 'User',
            email: profile.email || '',
            phone: profile.phone || '',
            instagram: profile.instagram || '',
            linkedin: profile.linkedin || '',
            avatar_url: profile.avatar_url || '',
            photo_urls: profile.photo_urls || [],
            year: profile.class_year || '',
            section: profile.section || '',
            age: profile.age || 0,
            hometown: profile.hometown || '',
            summerCity: profile.summer_city || '',
            summerFirm: profile.summer_firm || '',
            bio: '',
            currentCourses: profile.classes?.map((cls: any) => ({
              name: cls.class || '',
              professor: cls.professor || ''
            })) || [],
            clubMemberships: [],
            stats: {
              outlinesSaved: 0,
              outlinesUploaded: 0,
              reviewsWritten: 0,
              postsCreated: 0,
              reputation: 0
            },
            schedule: {}
          };
          
          setProfileData(convertedProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);
  
  // Function to get profile data based on student name
  const getProfileData = (name?: string): ProfileData => {
    const profileMap: { [key: string]: ProfileData } = {
      'Sarah Martinez': {
        name: 'Sarah Martinez',
        email: 'sarah.martinez@student.harvard.edu',
        phone: '(617) 555-0456',
        instagram: '@sarahmartinez_law',
        linkedin: 'sarah-martinez-hls',
        avatar_url: '',
        photo_urls: [],
        year: '2L',
        section: '3',
        age: 24,
        hometown: 'Los Angeles, CA',
        summerCity: 'San Francisco, CA',
        summerFirm: 'Wilson Sonsini',
        bio: 'Second-year law student focusing on intellectual property and tech law. President of the IP Law Society and active in pro bono clinics.',
        currentCourses: [
          { name: 'Contract Law', professor: 'Chen' },
          { name: 'Torts', professor: 'Johnson' },
          { name: 'Patent Law', professor: 'Davis' },
          { name: 'Corporate Law', professor: 'Collins' }
        ],
        clubMemberships: ['IP Law Society (President)', 'Tech Law Review', 'Pro Bono Clinic', 'Women in Law'],
        schedule: {
          'Monday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
            { course: 'Patent Law', time: '2:00 - 3:30', location: 'Room 204' }
          ],
          'Tuesday': [
            { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' }
          ],
          'Wednesday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
            { course: 'Corporate Law', time: '3:00 - 4:30', location: 'Room 301' }
          ],
          'Thursday': [
            { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' }
          ],
          'Friday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' }
          ]
        },
        stats: {
          outlinesSaved: 35,
          outlinesUploaded: 8,
          reviewsWritten: 15,
          postsCreated: 22,
          reputation: 892
        }
      },
      'Mike Chen': {
        name: 'Mike Chen',
        email: 'mike.chen@student.harvard.edu',
        phone: '(617) 555-0789',
        instagram: '@mikechen_law',
        linkedin: 'mike-chen-hls',
        avatar_url: '',
        photo_urls: [],
        year: '2L',
        section: '5',
        age: 26,
        hometown: 'Seattle, WA',
        summerCity: 'Chicago, IL',
        summerFirm: 'Kirkland & Ellis',
        bio: 'Second-year law student with interests in corporate law and mergers & acquisitions. Editor of Harvard Business Law Review.',
        currentCourses: [
          { name: 'Contract Law', professor: 'Chen' },
          { name: 'Torts', professor: 'Johnson' },
          { name: 'Corporate Law', professor: 'Collins' },
          { name: 'Securities Law', professor: 'Martinez' }
        ],
        clubMemberships: ['Harvard Business Law Review (Editor)', 'Corporate Law Society', 'Asian Law Students Association', 'Investment Law Club'],
        schedule: {
          'Monday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' }
          ],
          'Tuesday': [
            { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' },
            { course: 'Securities Law', time: '2:00 - 3:30', location: 'Room 250' }
          ],
          'Wednesday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
            { course: 'Corporate Law', time: '3:00 - 4:30', location: 'Room 301' }
          ],
          'Thursday': [
            { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' }
          ],
          'Friday': [
            { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' }
          ]
        },
        stats: {
          outlinesSaved: 42,
          outlinesUploaded: 6,
          reviewsWritten: 28,
          postsCreated: 15,
          reputation: 756
        }
      }
    };

    // Default to Justin Abbey if no specific student name is provided or not found
    return profileMap[name || 'Justin Abbey'] || {
      name: 'Justin Abbey',
      email: 'justin.abbey@student.harvard.edu',
      phone: '(617) 555-0123',
      instagram: '@justinabbey',
      linkedin: 'justin-abbey-hls',
      avatar_url: '',
      photo_urls: [],
      year: '2L',
      section: '2',
      age: 25,
      hometown: 'Boston, MA',
      summerCity: 'New York, NY',
      summerFirm: 'Cravath, Swaine & Moore',
      bio: 'Second-year law student with interests in constitutional law and civil rights. Active member of the Harvard Law Review and mock trial team.',
      currentCourses: [
        { name: 'Contract Law', professor: 'Chen' },
        { name: 'Torts', professor: 'Johnson' },
        { name: 'Property Law', professor: 'Chen' },
        { name: 'Civil Procedure', professor: 'Martinez' }
      ],
      clubMemberships: ['Harvard Law Review', 'Mock Trial Team', 'Student Bar Association', 'Public Interest Law Foundation'],
      schedule: {
        'Monday': [
          { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
          { course: 'Property Law', time: '11:30 - 12:30', location: 'Austin Hall 200' }
        ],
        'Tuesday': [
          { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' },
          { course: 'Civil Procedure', time: '2:00 - 3:30', location: 'Hauser Hall 104' }
        ],
        'Wednesday': [
          { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
          { course: 'Property Law', time: '11:30 - 12:30', location: 'Austin Hall 200' }
        ],
        'Thursday': [
          { course: 'Torts', time: '10:30 - 12:00', location: 'Langdell Library North' },
          { course: 'Civil Procedure', time: '2:00 - 3:30', location: 'Hauser Hall 104' }
        ],
        'Friday': [
          { course: 'Contract Law', time: '9:00 - 10:00', location: 'Austin Hall 101' },
          { course: 'Property Law', time: '11:30 - 12:30', location: 'Austin Hall 200' }
        ]
      },
      stats: {
        outlinesSaved: 47,
        outlinesUploaded: 12,
        reviewsWritten: 23,
        postsCreated: 18,
        reputation: 1024
      }
    };
  };

  const [editedData, setEditedData] = useState<ProfileData | null>(null);

  // Update editedData when profileData changes
  useEffect(() => {
    if (profileData) {
      setEditedData(profileData);
    }
  }, [profileData]);

  const handleEdit = () => {
    if (profileData) {
      setEditedData(profileData);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editedData || !user?.id) return;

    try {
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          age: editedData.age,
          hometown: editedData.hometown,
          summer_city: editedData.summerCity,
          summer_firm: editedData.summerFirm,
          bio: editedData.bio,
          instagram: editedData.instagram,
          linkedin: editedData.linkedin
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      // Update local state
      setProfileData(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setEditedData(profileData);
      setIsEditing(false);
    }
  };

  const handleChangeName = async () => {
    if (!newName.trim() || !user?.id || nameLoading) return;

    setNameLoading(true);
    try {
      // Update the full_name in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating name:', error);
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, name: newName.trim() } : null);
      setShowChangeName(false);
      setNewName('');
    } catch (error) {
      console.error('Error changing name:', error);
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePhone = async () => {
    if (!newPhone.trim() || !user?.id || phoneLoading) return;

    setPhoneLoading(true);
    try {
      // Update the phone in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ phone: newPhone.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating phone:', error);
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, phone: newPhone.trim() } : null);
      setShowChangePhone(false);
      setNewPhone('');
    } catch (error) {
      console.error('Error changing phone:', error);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleChangeCourses = async () => {
    if (!user?.id || courseLoading) return;

    setCourseLoading(true);
    try {
      // For now, just close the modal and show a success message
      // In a full implementation, this would update the courses in Supabase
      setShowChangeCourses(false);
      console.log('Courses updated successfully');
    } catch (error) {
      console.error('Error changing courses:', error);
    } finally {
      setCourseLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.id || !profileData?.avatar_url) return;

    try {
      // Extract filename from URL
      const urlParts = profileData.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      console.log('Delete attempt:', {
        avatarUrl: profileData.avatar_url,
        extractedFileName: fileName,
        urlParts: urlParts,
        userId: user.id,
        filenameStartsWithUserId: fileName.startsWith(user.id)
      });

      // Delete from storage
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('Avatar')
        .remove([fileName]);

      console.log('Delete result:', {
        deleteData: deleteData,
        deleteError: deleteError
      });

      if (deleteError) {
        console.error('Error deleting avatar from storage:', deleteError);
        alert('Error deleting avatar from storage. Please try again.');
        return;
      }

      console.log('File successfully deleted from storage');

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
      setProfileData(prev => prev ? { ...prev, avatar_url: '' } : null);
      
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
      if (profileData.avatar_url) {
        const urlParts = profileData.avatar_url.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        
        console.log('Deleting old avatar:', oldFileName);
        
        const { error: deleteError } = await supabase.storage
          .from('Avatar')
          .remove([oldFileName]);
          
        if (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Continue with upload even if delete fails
        } else {
          console.log('Successfully deleted old avatar');
        }
      }

      // Compress avatar image
      const compressedFile = await compressAvatarImage(file);
      
      // Create unique filename
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      console.log('Attempting to upload file:', {
        fileName,
        originalFileSize: file.size,
        compressedFileSize: compressedFile.size,
        fileType: file.type,
        userId: user.id
      });
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Avatar')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;
      console.log('Generated avatar URL:', avatarUrl);

      // Update profile with new avatar URL
      console.log('Attempting to update profile with avatar URL:', avatarUrl);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
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

      console.log('Successfully updated avatar URL in database');

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      console.log('Updated local profile data with new avatar URL');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      if (error.message && error.message.includes('timeout')) {
        alert('Error: Image is too large or complex to process. Please try a smaller image.');
      } else {
        alert('Error uploading avatar. Please try again.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Photo upload function with compression
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user?.id) return;

    // Check if user already has 20 photos
    if (profileData?.photo_urls && profileData.photo_urls.length >= 20) {
      alert('You can only upload up to 20 photos');
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
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Photos')
            .upload(fileName, compressedFile);

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            alert(`Error uploading ${file.name}: ${uploadError.message}`);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('Photos')
            .getPublicUrl(fileName);

          newPhotoUrls.push(urlData.publicUrl);
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

    try {
      // Extract filename from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('Photos')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting photo from storage:', deleteError);
        alert('Error deleting photo from storage. Please try again.');
        return;
      }

      // Update profile to remove photo URL
      const updatedPhotoUrls = profileData.photo_urls.filter(url => url !== photoUrl);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_urls: updatedPhotoUrls })
        .eq('id', user.id);

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
        reject(new Error('Failed to load avatar image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  if (loading) {
    return (
      <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Back Button - Only show when viewing student profile */}
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Cover Photo */}
          <div className="h-24 rounded-t-lg" style={{ backgroundColor: '#752432' }}></div>
          
          {/* Profile Content */}
          <div className="p-8">
            <div className="relative">
              {/* Profile Content */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 mb-8">
                {/* Avatar with Upload */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-4 border-white shadow-lg -mt-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profileData.avatar_url ? (
                      <img 
                        src={profileData.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full text-2xl font-medium bg-gray-100 text-gray-700 flex items-center justify-center">
                        {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  {isEditing && (!studentName || studentName === 'Justin Abbey') && (
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
                            <span>Add Avatar</span>
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
                
                {/* Main Profile Info */}
                <div className="flex-1 space-y-6">
                  {/* Name and School */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2 break-words">{profileData.name}</h1>
                      <p className="text-base sm:text-lg text-gray-600 break-words">{profileData.year} Student • Section {profileData.section} • Harvard Law School</p>
                    </div>
                    {/* Show Edit and Settings buttons only for main user */}
                    {(!studentName || studentName === 'Justin Abbey') && !isEditing && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button onClick={handleEdit} variant="outline" className="gap-1.5 text-xs px-2 py-1 h-7">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button 
                          onClick={() => setShowSettings(true)} 
                          variant="outline" 
                          className="gap-1.5 text-xs px-2 py-1 h-7"
                        >
                          <Settings className="w-3 h-3" />
                          Settings
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-3 text-base text-gray-600 min-w-0">
                    <Mail className="w-5 h-5 flex-shrink-0" />
                    <span className={`${isEditing ? 'text-gray-500' : ''} break-all`}>{profileData.email}</span>
                    {isEditing && (
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">(Email cannot be changed)</span>
                    )}
                  </div>
                  
                  {/* Social Media Icons */}
                  <div className="flex items-center gap-4 mb-4">
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
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          if (profileData.instagram) {
                            const url = profileData.instagram.startsWith('http') 
                              ? profileData.instagram 
                              : `https://${profileData.instagram}`;
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        <img 
                          src="/Instagram_Glyph_Gradient.png" 
                          alt="Instagram" 
                          className="h-6 w-auto" 
                        />
                        {!profileData.instagram && profileData.linkedin && (
                          <span className="text-sm text-gray-400">
                            Show your creative side! ✨
                          </span>
                        )}
                      </div>
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
                        {!profileData.linkedin && profileData.instagram && (
                          <span className="text-sm text-gray-400">
                            Grow your career network! 🎯
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Show message only when both are empty */}
                    {!profileData.instagram && !profileData.linkedin && !isEditing && (
                      <span className="text-sm text-gray-400">
                        Let others find you online! ⚡
                      </span>
                    )}
                  </div>
                  
                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-16 gap-y-3 text-base text-gray-600">
                    <div className="flex items-center gap-2">
                      <strong>Age:</strong> 
                      {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                        <Input
                          value={editedData?.age || ''}
                          onChange={(e) => editedData && setEditedData({ ...editedData, age: parseInt(e.target.value) || 0 })}
                          className="text-base h-8 px-2 w-16 md:w-20"
                          type="number"
                          placeholder="Age"
                        />
                      ) : (
                        <span>{profileData.age || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Hometown:</strong> 
                      {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                        <Input
                          value={editedData?.hometown || ''}
                          onChange={(e) => editedData && setEditedData({ ...editedData, hometown: e.target.value })}
                          className="text-base h-8 px-2 w-32 md:w-40"
                          placeholder="Hometown"
                        />
                      ) : (
                        <span>{profileData.hometown || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Summer City:</strong> 
                      {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                        <Input
                          value={editedData?.summerCity || ''}
                          onChange={(e) => editedData && setEditedData({ ...editedData, summerCity: e.target.value })}
                          className="text-base h-8 px-2 w-32 md:w-40"
                          placeholder="Summer City"
                        />
                      ) : (
                        <span>{profileData.summerCity || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Summer Firm:</strong> 
                      {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                        <Input
                          value={editedData?.summerFirm || ''}
                          onChange={(e) => editedData && setEditedData({ ...editedData, summerFirm: e.target.value })}
                          className="text-base h-8 px-2 w-32 md:w-40"
                          placeholder="Summer Firm"
                        />
                      ) : (
                        <span>{profileData.summerFirm || 'Not specified'}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {!isEditing ? (
                      <>
                        {/* Show Message and Match buttons only for other students */}
                        {studentName && studentName !== 'Justin Abbey' && (
                          <>
                            <Button 
                              className="gap-2 text-white hover:opacity-90" 
                              style={{ backgroundColor: '#752432' }}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </Button>
                            <Button 
                              className="gap-2 text-white hover:opacity-90" 
                              style={{ backgroundColor: '#752432' }}
                            >
                              <Heart className="w-4 h-4" />
                              Match
                            </Button>
                          </>
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
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                  <Textarea
                    value={editedData?.bio || ''}
                    onChange={(e) => editedData && setEditedData({ ...editedData, bio: e.target.value })}
                    className="min-h-24"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-700">{profileData.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Club Memberships */}
            <Card>
              <CardHeader>
                <CardTitle>Club Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.clubMemberships.map((club, index) => (
                    <Badge key={index} variant="outline" className="border-gray-300">
                      {club}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Photo Gallery */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Photos</CardTitle>
                  {isEditing && (!studentName || studentName === 'Justin Abbey') && (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        disabled={uploadingPhotos}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        disabled={uploadingPhotos || (profileData.photo_urls?.length || 0) >= 20}
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        {uploadingPhotos ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <>
                      <Upload className="w-4 h-4" />
                      Add Photos
                          </>
                        )}
                    </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Show photos only if there are photos */}
                {profileData.photo_urls && profileData.photo_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {/* Display actual photos only */}
                    {profileData.photo_urls.map((photoUrl, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden">
                        {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                          <div
                            onClick={() => handleDeletePhoto(photoUrl)}
                            className="cursor-pointer relative"
                          >
                            <img 
                              src={photoUrl} 
                              alt={`Photo ${index + 1}`}
                              className="h-auto object-contain rounded-lg"
                              style={{ maxWidth: '150px' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                                <X className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={photoUrl} 
                            alt={`Photo ${index + 1}`}
                            className="h-auto object-contain rounded-lg"
                            style={{ maxWidth: '150px' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Show motivational message when no photos */
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📸</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Share Your Story!</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Upload up to 20 photos to showcase your personality, interests, and experiences. 
                      Let others get to know the real you! ✨
                    </p>
                    {isEditing && (!studentName || studentName === 'Justin Abbey') && (
                      <div className="flex justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload-empty"
                          disabled={uploadingPhotos}
                        />
                        <Button 
                          size="lg" 
                          className="gap-2 text-white hover:opacity-90"
                          style={{ backgroundColor: '#752432' }}
                          disabled={uploadingPhotos}
                          onClick={() => document.getElementById('photo-upload-empty')?.click()}
                        >
                          {uploadingPhotos ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Uploading...</span>
                  </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              Upload Your First Photos
                            </>
                          )}
                        </Button>
                </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Current Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {profileData.currentCourses.map((course, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <Badge 
                          className="text-white px-2 py-1" 
                          style={{ backgroundColor: '#752432' }}
                        >
                          2L
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{course.professor}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>📚 Credits: 3</span>
                        <span>⏰ MWF 10:00-11:00</span>
                        <span>📍 Room 150</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                    <div key={day} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 text-center border-b pb-2">
                        {day}
                      </h4>
                      <div className="space-y-2 min-h-48">
                        {profileData.schedule[day]?.map((classItem, index) => (
                          <div
                            key={index}
                            className="p-2 rounded text-white text-xs"
                            style={{ backgroundColor: '#752432' }}
                          >
                            <div className="font-medium truncate">{classItem.course}</div>
                            <div className="opacity-90">{classItem.time}</div>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-xs text-center py-4">
                            No classes
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowSettings(false)}
          />
          
          {/* Settings Modal */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Settings Content */}
            <div className="p-6 space-y-6">
              {/* Account Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive updates about your courses and activities</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      On
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Profile Visibility</p>
                      <p className="text-xs text-gray-500">Control who can see your profile</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      Public
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Privacy Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Show Contact Info</p>
                      <p className="text-xs text-gray-500">Display email and phone to other students</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      On
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Show Course Schedule</p>
                      <p className="text-xs text-gray-500">Let others see your class schedule</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      On
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      setNewName(profileData?.name || '');
                      setShowChangeName(true);
                    }}
                    variant="outline" 
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Change Name
                  </Button>
                  <Button 
                    onClick={() => {
                      setNewPhone(profileData?.phone || '');
                      setShowChangePhone(true);
                    }}
                    variant="outline" 
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Change Phone Number
                  </Button>
                  <Button 
                    onClick={() => setShowChangeCourses(true)}
                    variant="outline" 
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Change Courses and Section
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <User className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button 
                    onClick={async () => {
                      setShowSettings(false);
                      await signOut();
                    }}
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Name Modal */}
      {showChangeName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowChangeName(false)}
          />
          
          {/* Change Name Modal */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Change Name</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangeName(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Change Name Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full"
                  disabled={nameLoading}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleChangeName}
                  disabled={!newName.trim() || nameLoading}
                  className="flex-1 text-white hover:opacity-90"
                  style={{ backgroundColor: '#752432' }}
                >
                  {nameLoading ? 'Updating...' : 'Update Name'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowChangeName(false)}
                  disabled={nameLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Phone Modal */}
      {showChangePhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowChangePhone(false)}
          />
          
          {/* Change Phone Modal */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Change Phone Number</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangePhone(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Change Phone Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full"
                  disabled={phoneLoading}
                  type="tel"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleChangePhone}
                  disabled={!newPhone.trim() || phoneLoading}
                  className="flex-1 text-white hover:opacity-90"
                  style={{ backgroundColor: '#752432' }}
                >
                  {phoneLoading ? 'Updating...' : 'Update Phone'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowChangePhone(false)}
                  disabled={phoneLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Courses Modal */}
      {showChangeCourses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowChangeCourses(false)}
          />
          
          {/* Change Courses Modal */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Change Courses</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangeCourses(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Change Courses Content */}
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  To change your courses, please go through the onboarding process again.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This will allow you to select new courses and update your schedule.
                </p>
              </div>
              
              {/* Current Courses Display */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Courses</h3>
                <div className="space-y-2">
                  {profileData?.currentCourses?.length ? (
                    profileData.currentCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.name}</p>
                          <p className="text-sm text-gray-500">{course.professor}</p>
                        </div>
                        <Badge variant="secondary">{profileData.year}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No courses selected</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowChangeCourses(false);
                    setTimeout(() => {
                      setShowCourseSelection(true);
                    }, 100);
                  }}
                  className="flex-1 text-white hover:opacity-90"
                  style={{ backgroundColor: '#752432' }}
                >
                  {courseLoading ? 'Processing...' : 'Start Course Selection'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowChangeCourses(false)}
                  disabled={courseLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Page - Full Screen Overlay */}
      {showCourseSelection && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
          <CourseSelectionPage
            onBack={() => {
              setShowCourseSelection(false);
            }}
            onComplete={() => {
              setShowCourseSelection(false);
              // Refresh profile data after course selection
              window.location.reload();
            }}
          />
        </div>
      )}
    </div>
  );
}