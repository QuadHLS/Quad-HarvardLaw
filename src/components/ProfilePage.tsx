import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, Edit, Save, X, Star, FileText, MessageSquare, Trophy, BookOpen, Clock, Upload, Instagram, Linkedin, Heart, ArrowLeft, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  year: string;
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
  const { user } = useAuth();
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
          .select('full_name, email, phone, class_year, section, classes, age, hometown, summer_city, summer_firm')
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
            instagram: '',
            linkedin: '',
            year: profile.class_year || '',
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
        year: '2L',
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
        year: '2L',
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
      year: '2L',
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
          bio: editedData.bio
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



  if (loading) {
    return (
      <div className="h-full style={{ backgroundColor: '#f9f5f0' }} flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="h-full style={{ backgroundColor: '#f9f5f0' }} flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#f9f5f0' }}>
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
              <div className="flex items-start gap-8 mb-8">
                {/* Avatar with Upload */}
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg -mt-12">
                    <AvatarFallback className="text-2xl font-medium bg-gray-100 text-gray-700">
                      {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (!studentName || studentName === 'Justin Abbey') && (
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full shadow-md hover:opacity-90"
                      style={{ backgroundColor: '#752432' }}
                    >
                      <Upload className="w-3 h-3 text-white" />
                    </Button>
                  )}
                </div>
                
                {/* Main Profile Info */}
                <div className="flex-1 space-y-6">
                  {/* Name and School */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-medium text-gray-900 mb-2">{profileData.name}</h1>
                      <p className="text-lg text-gray-600">{profileData.year} Student • Harvard Law School</p>
                    </div>
                    {/* Show Edit and Settings buttons only for main user */}
                    {(!studentName || studentName === 'Justin Abbey') && !isEditing && (
                      <div className="flex gap-1.5">
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
                  <div className="flex items-center gap-3 text-base text-gray-600">
                    <Mail className="w-5 h-5" />
                    <span className={isEditing ? 'text-gray-500' : ''}>{profileData.email}</span>
                    {isEditing && (
                      <span className="text-xs text-gray-400 ml-2">(Email cannot be changed)</span>
                    )}
                  </div>
                  
                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-base text-gray-600">
                    <div className="flex items-center gap-2">
                      <strong>Age:</strong> 
                      {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                        <Input
                          value={editedData?.age || ''}
                          onChange={(e) => editedData && setEditedData({ ...editedData, age: parseInt(e.target.value) || 0 })}
                          className="text-base h-8 px-2 w-20"
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
                          className="text-base h-8 px-2 w-40"
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
                          className="text-base h-8 px-2 w-40"
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
                          className="text-base h-8 px-2 w-40"
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
              
              {/* Social Media Icons - Bottom Right */}
              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                <Instagram className="w-6 h-6 cursor-pointer hover:opacity-80" style={{ color: '#752432' }} />
                <Linkedin className="w-6 h-6 cursor-pointer hover:opacity-80" style={{ color: '#752432' }} />
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
                  {isEditing && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Add Photos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* Placeholder photos */}
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">📸</span>
                  </div>
                </div>
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
                    Change Courses
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <User className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
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
                      <div key={index} className="flex items-center justify-between p-3 style={{ backgroundColor: '#f9f5f0' }} rounded-lg">
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
                    // In a full implementation, this would redirect to onboarding
                    setShowChangeCourses(false);
                    console.log('Redirecting to onboarding...');
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
    </div>
  );
}