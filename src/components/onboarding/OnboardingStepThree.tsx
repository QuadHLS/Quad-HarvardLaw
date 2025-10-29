import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ArrowLeft, Upload, X, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Law School Clubs and Organizations
const LAW_SCHOOL_CLUBS = [
  'Harvard Law Review',
  'Harvard Civil Rights-Civil Liberties Law Review',
  'Harvard Environmental Law Review',
  'Harvard International Law Journal',
  'Harvard Journal of Law & Public Policy',
  'Harvard Journal on Legislation',
  'Harvard Latino Law Review',
  'Harvard National Security Journal',
  'Harvard Negotiation Law Review',
  'HALB (Harvard Association for Law and Business)',
  'HLEP (Harvard Law Entrepreneurship Project)',
  'Ames Moot Court',
  'Harvard Legal Aid Bureau',
  'Student Government',
  'Black Law Students Association',
  'Lambda (LGBTQ+ Alliance)',
  'Asian Pacific American Law Students Association',
  'Jewish Law Students Association',
  'American Constitution Society',
  'Federalist Society',
  'Environmental Law Society',
  'International Law Society',
  'Women\'s Law Association',
  'Veterans Legal Clinic',
  'Prison Legal Assistance Project',
  'Harvard Defenders',
  'Immigration Project',
  'Tenant Advocacy Project',
  'Harvard Journal of Sports & Entertainment Law',
  'Harvard Business Law Review',
  'Berkman Klein Center Student Fellows',
  'Alternative Dispute Resolution Program',
  'Harvard Law & International Development Society',
  'Health Law Society',
  'Intellectual Property Law Society',
  'Entertainment & Media Law Society',
  'Real Estate Law Society',
  'Tax Law Society',
  'Labor & Employment Law Society',
  'National Lawyers Guild',
  'Public Interest Law Society',
  'Christian Legal Society',
  'South Asian Law Students Association',
  'Native American Law Students Association',
  'Middle Eastern Law Students Association'
].sort();

interface ClubsAndActivitiesProps {
  selectedClubs: string[];
  onClubsChange: (clubs: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function ClubsAndActivities({ 
  selectedClubs, 
  onClubsChange, 
  label = "Clubs & Activities",
  placeholder = "Select clubs and activities...",
  className = ""
}: ClubsAndActivitiesProps) {
  const [clubsPopoverOpen, setClubsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      
      {/* Add Clubs Popover */}
      <Popover open={clubsPopoverOpen} onOpenChange={setClubsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            type="button"
          >
            {selectedClubs.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <span className="text-gray-500">Add more clubs...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Search clubs..."
              className="w-full px-3 py-2 border rounded-md text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {LAW_SCHOOL_CLUBS
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
            {LAW_SCHOOL_CLUBS.filter(club => 
              club.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No clubs found.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Selected Clubs Display - Under Search Button */}
      {selectedClubs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedClubs.map((club) => (
            <Badge
              key={club}
              variant="secondary"
              className="bg-[#752432] text-white hover:bg-[#6a1f2d] pl-3 pr-2 py-1.5"
            >
              {club}
              <button
                onClick={() => removeClub(club)}
                className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseData {
  id: string;
  courseName: string;
  professor: string;
  credits: number;
  semester: 'Spring' | 'Fall' | 'Winter' | 'Spring 2026' | 'Fall 2025' | 'Winter 2026';
  days: string[];
  time: string;
  location?: string;
  original_course_id?: number;
  course_uuid?: string;
}

interface OnboardingStepThreeProps {
  onDone: () => void;
  onBack?: () => void;
  selectedCourses: CourseData[];
  userInfo: {
    name: string;
    phone: string;
    classYear: string;
    section: string;
  };
}

export function OnboardingStepThree({ onDone, onBack, selectedCourses, userInfo }: OnboardingStepThreeProps) {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [hometown, setHometown] = useState('');
  const [underGrad, setUnderGrad] = useState('');
  const [postGradEmployer, setPostGradEmployer] = useState('');
  const [postGradCity, setPostGradCity] = useState('');
  const [clubsActivities, setClubsActivities] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarWarning, setAvatarWarning] = useState<string>('');
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarWarning('Invalid format. Please try a different image.');
      return;
    }

    // Validate file size (max 8MB before compression)
    if (file.size > 8 * 1024 * 1024) {
      setAvatarWarning('Image is too big. Please try a smaller file.');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Compress avatar image
      const compressedFile = await compressAvatarImage(file);
      
      // Store the compressed file for later upload
      setAvatarFile(compressedFile);
      
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      setProfileImage(previewUrl);
      
      // Clear any previous warnings
      setAvatarWarning('');
      
      console.log('Avatar file prepared for upload:', {
        fileName: compressedFile.name,
        fileSize: compressedFile.size,
        fileType: compressedFile.type
      });
    } catch (error) {
      console.error('Error processing avatar:', error);
      if (error instanceof Error && error.message && error.message.includes('timeout')) {
        setAvatarWarning('Image is too big. Please try a smaller file.');
      } else {
        setAvatarWarning('Invalid format. Please try a different image.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };


  // Get initials for avatar
  const getInitials = () => {
    return userInfo.name ? userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD';
  };

  return (
    <div className="min-h-screen w-full flex flex-col px-4" style={{ backgroundColor: '#f9f5f0' }}>
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8" style={{ marginTop: '40px' }}>
          <div className="inline-flex items-center justify-center mb-8">
            <img 
              src="/QUAD.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain"
              style={{ height: '100px' }}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Your Profile
          </h1>
          <p className="text-lg text-gray-600">
            Tell your classmates a bit about yourself
          </p>
        </div>

        {/* Profile Form */}
        <Card className="shadow-lg flex-1 w-full mx-auto" style={{ maxWidth: '800px' }}>
                 <CardHeader className="pb-6 border-b flex items-center justify-center">
                   <CardTitle className="text-2xl text-center text-gray-900">
                     {userInfo.name}
                   </CardTitle>
                 </CardHeader>
          <CardContent className="pt-6 flex-1 mt-4">
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div>
                  <div className="-mt-12 flex items-center justify-center">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-auto object-contain rounded-full border-4 border-white shadow-lg"
                        style={{ maxWidth: '96px', maxHeight: '96px' }}
                      />
                    ) : (
                      <div className="w-24 h-24 text-2xl font-medium bg-gray-100 text-gray-700 flex items-center justify-center rounded-full border-4 border-white shadow-lg">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                         <div className="flex flex-col gap-2 mt-4 w-fit mx-auto">
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
                             className="text-xs px-3 py-1 h-7 w-auto"
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
                                 <span>{profileImage ? 'Change Avatar' : 'Add Avatar'}</span>
                               </div>
                             )}
                           </Button>
                           {profileImage && (
                             <Button 
                               size="sm" 
                               variant="outline"
                               className="text-xs px-3 py-1 h-7 w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                               onClick={() => {
                                 setProfileImage('');
                                 setAvatarFile(null);
                                 setAvatarWarning('');
                                 // Reset the file input
                                 const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
                                 if (fileInput) {
                                   fileInput.value = '';
                                 }
                               }}
                             >
                               <div className="flex items-center gap-1">
                                 <X className="w-3 h-3" />
                                 <span>Delete Avatar</span>
                               </div>
                             </Button>
                           )}
                         </div>
                         {avatarWarning && (
                           <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                             <div className="flex items-center">
                               <div className="ml-3">
                                 <p className="text-sm text-yellow-800">{avatarWarning}</p>
                               </div>
                               <div className="ml-auto pl-3 flex items-center">
                                 <button
                                   onClick={() => setAvatarWarning('')}
                                   className="inline-flex items-center justify-center text-yellow-400 hover:text-yellow-600"
                                 >
                                   <X className="h-4 w-4" />
                                 </button>
                               </div>
                             </div>
                           </div>
                         )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="mt-1.5 resize-none"
                />
              </div>

              {/* Age, Home Town, and Under Grad - Same Line */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="text"
                    placeholder="25"
                    value={age}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numeric input
                      if (value === '' || /^\d+$/.test(value)) {
                        setAge(value);
                      }
                    }}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="hometown">Home Town</Label>
                  <Input
                    id="hometown"
                    type="text"
                    placeholder="Boston, MA"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="underGrad">Undergraduate</Label>
                  <Input
                    id="underGrad"
                    type="text"
                    placeholder="Harvard University"
                    value={underGrad}
                    onChange={(e) => setUnderGrad(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Post-Grad Employer and Post-Grad City - Same Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postGradEmployer">Post-Grad Employer (if any)</Label>
                  <Input
                    id="postGradEmployer"
                    type="text"
                    placeholder="Firm or organization"
                    value={postGradEmployer}
                    onChange={(e) => setPostGradEmployer(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="postGradCity">Post-Grad City</Label>
                  <Input
                    id="postGradCity"
                    type="text"
                    placeholder="New York, NY"
                    value={postGradCity}
                    onChange={(e) => setPostGradCity(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Clubs & Activities */}
              <ClubsAndActivities
                selectedClubs={clubsActivities}
                onClubsChange={setClubsActivities}
                label="Clubs & Activities"
                placeholder="Select clubs and activities..."
              />

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Social Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      type="text"
                      placeholder="@name or instagram.com/name"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="text"
                      placeholder="linkedin.com/in/name"
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center mt-8" style={{ marginBottom: '40px' }}>
          {/* Back Button */}
          <Button
            onClick={onBack || (() => {})}
            variant="outline"
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={!onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Progress Indicator - Center */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
            <span className="text-sm text-gray-600">Step 3 of 3 - Profile</span>
            <div className="w-2 h-2 bg-[#752432] rounded-full"></div>
            <div className="w-2 h-2 bg-[#752432] rounded-full"></div>
            <div className="w-2 h-2 bg-[#752432] rounded-full"></div>
          </div>

          {/* Finish Button */}
                 <Button
                   onClick={async () => {
                     // Save all courses and profile data to database
                     if (user && selectedCourses.length > 0) {
                       try {
                         let avatarUrl = null;
                         
                         // Upload avatar to bucket if one was selected
                         if (avatarFile) {
                           const fileExt = avatarFile.name.split('.').pop();
                           const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                           
                           console.log('Uploading avatar to bucket:', fileName);
                           
                           const { error: uploadError } = await supabase.storage
                             .from('Avatar')
                             .upload(fileName, avatarFile);

                           if (uploadError) {
                             console.error('Error uploading avatar:', uploadError);
                             alert('Error uploading avatar. Please try again.');
                             return;
                           }

                           // Get public URL
                           const { data: urlData } = supabase.storage
                             .from('Avatar')
                             .getPublicUrl(fileName);

                           avatarUrl = urlData.publicUrl;
                           console.log('Avatar uploaded successfully:', avatarUrl);
                         }

                         const classesData = selectedCourses.map(course => ({
                           class: course.courseName,
                           schedule: {
                             days: course.days.join(' • '),
                             times: course.time,
                             credits: course.credits,
                             location: course.location || 'Location TBD',
                             semester: course.semester,
                             instructor: course.professor,
                             course_name: course.courseName
                           },
                           professor: course.professor,
                           course_id: (course as any).course_uuid || null
                         }));

                         const { error } = await supabase
                           .from('profiles')
                           .update({ 
                             classes: classesData,
                             full_name: userInfo.name,
                             phone: userInfo.phone,
                             class_year: userInfo.classYear,
                             section: userInfo.section,
                             avatar_url: avatarUrl,
                             bio: bio,
                             age: age ? parseInt(age) : null,
                             hometown: hometown,
                             under_grad: underGrad || null,
                             summer_city: postGradCity,
                             summer_firm: postGradEmployer,
                             instagram: instagram,
                             linkedin: linkedIn,
                             clubs_activities: clubsActivities,
                             classes_filled: true
                           })
                           .eq('id', user.id);

                         if (error) {
                           console.error('Error saving profile:', error);
                           alert('Error saving your profile. Please try again.');
                           return;
                         }
                         
                         console.log('Profile and courses saved successfully');
                       } catch (error) {
                         console.error('Error saving profile:', error);
                         alert('Error saving your profile. Please try again.');
                         return;
                       }
                     }
                     
                     onDone();
                   }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            Done!
          </Button>
        </div>
      </div>
    </div>
  );
}
