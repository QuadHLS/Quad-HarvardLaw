import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const [postGradEmployer, setPostGradEmployer] = useState('');
  const [postGradCity, setPostGradCity] = useState('');
  const [clubsActivities, setClubsActivities] = useState<string[]>([]);
  const [clubsInput, setClubsInput] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeClub = (club: string) => {
    setClubsActivities(clubsActivities.filter(c => c !== club));
  };

  // Get initials for avatar
  const getInitials = () => {
    return 'JD'; // Placeholder initials
  };

  return (
    <div className="min-h-screen w-full flex flex-col px-4" style={{ backgroundColor: '#f9f5f0' }}>
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8" style={{ marginTop: '40px' }}>
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/Quad SVG.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain"
              style={{ height: '80px' }}
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
          <CardHeader className="pb-6 border-b">
            <CardTitle className="text-2xl text-center text-gray-900">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <Label className="text-center mb-3">Profile Picture</Label>
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-2xl font-medium shadow-lg">
                      {getInitials()}
                    </div>
                  )}
                  <label
                    htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 border border-gray-200"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Click to upload a photo</p>
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

              {/* Age and Home Town - Same Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <Label>Clubs & Activities</Label>
                <div className="mt-1.5">
                  {/* Selected Clubs */}
                  {clubsActivities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {clubsActivities.map((club) => (
                        <Badge
                          key={club}
                          variant="secondary"
                          className="bg-[#752432] text-white hover:bg-[#6a1f2d] pl-3 pr-2 py-1.5"
                        >
                          {club}
                          <button
                            onClick={() => removeClub(club)}
                            className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Input
                    placeholder="Add clubs and activities (comma separated)"
                    value={clubsInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClubsInput(value);
                      if (value.includes(',')) {
                        const newClubs = value.split(',').map(c => c.trim()).filter(c => c);
                        setClubsActivities([...clubsActivities, ...newClubs]);
                        setClubsInput('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && clubsInput.trim()) {
                        setClubsActivities([...clubsActivities, clubsInput.trim()]);
                        setClubsInput('');
                      }
                    }}
                    className="mt-1.5"
                  />
                </div>
              </div>

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
                      section: userInfo.section
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
