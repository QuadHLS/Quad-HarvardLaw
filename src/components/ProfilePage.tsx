import React, { useState } from 'react';
import { User, Mail, MapPin, Calendar, Edit, Save, X, Star, FileText, MessageSquare, Trophy, BookOpen, Clock, Upload, Instagram, Linkedin, Heart, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

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
  const [isEditing, setIsEditing] = useState(false);
  
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

  const [profileData, setProfileData] = useState<ProfileData>(getProfileData(studentName));

  const [editedData, setEditedData] = useState(profileData);

  const handleEdit = () => {
    setEditedData(profileData);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfileData(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
  };



  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
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
                  <div>
                    <h1 className="text-3xl font-medium text-gray-900 mb-2">{profileData.name}</h1>
                    <p className="text-lg text-gray-600">{profileData.year} Student • Harvard Law School</p>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-3 text-base text-gray-600">
                    <Mail className="w-5 h-5" />
                    {isEditing && (!studentName || studentName === 'Justin Abbey') ? (
                      <Input
                        value={editedData.email}
                        onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                        className="text-base h-10 px-3 w-80"
                      />
                    ) : (
                      <span>{profileData.email}</span>
                    )}
                  </div>
                  
                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-base text-gray-600">
                    <div><strong>Age:</strong> {profileData.age}</div>
                    <div><strong>Hometown:</strong> {profileData.hometown}</div>
                    <div><strong>Summer City:</strong> {profileData.summerCity}</div>
                    <div><strong>Summer Firm:</strong> {profileData.summerFirm}</div>
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
                        {/* Show Edit button only for main user */}
                        {(!studentName || studentName === 'Justin Abbey') && (
                          <Button onClick={handleEdit} variant="outline" className="gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Profile
                          </Button>
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
                    value={editedData.bio}
                    onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
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
    </div>
  );
}