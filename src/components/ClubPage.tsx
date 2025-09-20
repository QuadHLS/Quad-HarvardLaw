import React, { useState } from 'react';
import { ArrowLeft, Users, Calendar, Mail, ExternalLink, MapPin, Clock, Award, Target, FileText, Send, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { harvardLawClubs } from './ClubsPage';

// Mock board members data
const getMockBoardMembers = (clubId: string) => {
  const baseMembers = [
    { name: 'Sarah Chen', role: 'President', year: '3L', email: 'sarah.chen@student.harvard.edu', bio: 'Passionate about corporate law and diversity initiatives.' },
    { name: 'Michael Rodriguez', role: 'Vice President', year: '2L', email: 'michael.rodriguez@student.harvard.edu', bio: 'Focused on public interest law and community engagement.' },
    { name: 'Emma Thompson', role: 'Secretary', year: '2L', email: 'emma.thompson@student.harvard.edu', bio: 'Interested in intellectual property and technology law.' },
    { name: 'David Kim', role: 'Treasurer', year: '3L', email: 'david.kim@student.harvard.edu', bio: 'Concentrating in tax law and financial regulation.' },
    { name: 'Jennifer Liu', role: 'Events Coordinator', year: '1L', email: 'jennifer.liu@student.harvard.edu', bio: 'Organizing engaging events and networking opportunities.' },
    { name: 'Robert Johnson', role: 'Outreach Director', year: '2L', email: 'robert.johnson@student.harvard.edu', bio: 'Building connections with the broader legal community.' }
  ];
  
  // Vary board size based on club
  const boardSizes: { [key: string]: number } = {
    'harvard-law-review': 8,
    'hls-student-government': 12,
    'business-law-association': 6,
    'black-law-students-association': 7,
    'womens-law-association': 8
  };
  
  const size = boardSizes[clubId] || 5;
  return baseMembers.slice(0, size);
};

// Mock events data
const getMockEvents = (clubId: string) => [
  {
    id: '1',
    title: 'Speaker Series: Career Panel',
    date: '2024-03-15',
    time: '6:00 PM - 8:00 PM',
    location: 'Austin Hall, Room 101',
    description: 'Join us for an evening with practicing attorneys who will share insights about their career paths.',
    rsvpRequired: true
  },
  {
    id: '2',
    title: 'Networking Reception',
    date: '2024-03-22',
    time: '5:30 PM - 7:30 PM',
    location: 'Langdell Library',
    description: 'Connect with fellow members and alumni in a relaxed setting.',
    rsvpRequired: true
  },
  {
    id: '3',
    title: 'Workshop: Legal Writing Excellence',
    date: '2024-04-05',
    time: '12:00 PM - 1:30 PM',
    location: 'Hauser Hall, Room 204',
    description: 'Improve your legal writing skills with tips from experienced practitioners.',
    rsvpRequired: false
  }
];

// Mock application requirements
const getMockApplicationInfo = (clubId: string) => {
  if (clubId === 'harvard-law-review') {
    return {
      applicationOpen: true,
      deadline: '2024-04-15',
      requirements: [
        'Completed first-year curriculum with high academic standing',
        'Personal statement (500 words maximum)',
        'Writing sample demonstrating legal analysis',
        'Two faculty recommendations',
        'Participation in case comment competition'
      ],
      process: 'Applications are reviewed by the Editorial Board. Candidates may be invited for interviews. Selection is based on academic performance, writing ability, and demonstrated commitment to legal scholarship.',
      contact: 'applications@harvardlawreview.org'
    };
  }
  
  return {
    applicationOpen: true,
    deadline: '2024-05-01',
    requirements: [
      'Current Harvard Law School student in good academic standing',
      'Brief statement of interest (250 words)',
      'Demonstrated interest in the organization\'s mission'
    ],
    process: 'Applications are reviewed on a rolling basis. New members are welcomed at the beginning of each semester.',
    contact: 'membership@club.harvard.edu'
  };
};

interface ClubPageProps {
  clubId: string;
  onBack: () => void;
}

export function ClubPage({ clubId, onBack }: ClubPageProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [joinInterest, setJoinInterest] = useState(false);
  
  const club = harvardLawClubs.find(c => c.id === clubId);
  
  if (!club) {
    return (
      <div className="h-full flex items-center justify-center style={{ backgroundColor: '#f9f5f0' }}">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Club Not Found</h2>
          <p className="text-gray-600 mb-4">The requested organization could not be found.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clubs
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = club.icon;
  const boardMembers = getMockBoardMembers(clubId);
  const events = getMockEvents(clubId);
  const applicationInfo = getMockApplicationInfo(clubId);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Professional': 'bg-green-100 text-green-800',
      'Public Interest': 'bg-purple-100 text-purple-800',
      'Diversity & Identity': 'bg-orange-100 text-orange-800',
      'Political': 'bg-red-100 text-red-800',
      'Religious': 'bg-yellow-100 text-yellow-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Student Government': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'style={{ backgroundColor: '#f9f5f0' }} text-gray-800';
  };

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#f9f5f0' }}>
      {/* Header */}
      <div className="style={{ backgroundColor: '#f9f5f0' }} border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Clubs
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex items-start gap-6 flex-1">
              <div 
                className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#f5f1f2' }}
              >
                <IconComponent className="w-10 h-10" style={{ color: '#752432' }} />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{club.name}</h1>
                <Badge className={`text-sm mb-3 ${getCategoryColor(club.category)}`}>
                  {club.category}
                </Badge>
                <p className="text-gray-600 mb-4 max-w-3xl">{club.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {club.members} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Founded {club.founded}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {!joinInterest ? (
                <Button
                  onClick={() => setJoinInterest(true)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: '#752432' }}
                >
                  <Heart className="w-4 h-4" />
                  Join Organization
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
                >
                  <Star className="w-4 h-4 fill-green-500" />
                  Interest Recorded
                </Button>
              )}
              <Button variant="outline" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Contact
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {club.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 text-sm rounded-full"
                style={{ backgroundColor: '#f5f1f2', color: '#752432' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="board">Leadership</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="join">Join Us</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" style={{ color: '#752432' }} />
                      Mission & Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {club.description}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Our organization is committed to fostering excellence, promoting diversity, and creating meaningful opportunities for professional and personal growth within the Harvard Law School community.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" style={{ color: '#752432' }} />
                      What We Do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                        Host speaker series featuring prominent legal professionals and academics
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                        Organize networking events and career development workshops
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                        Provide mentorship opportunities for students at all levels
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                        Engage in community service and pro bono legal work
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                        Support academic and professional development initiatives
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: '#752432' }} />
                      Meeting Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">General Meetings</div>
                        <div className="text-gray-600">Every other Wednesday, 6:00 PM</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Board Meetings</div>
                        <div className="text-gray-600">Monthly, First Monday, 5:30 PM</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Location</div>
                        <div className="text-gray-600">Austin Hall, Various Rooms</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" style={{ color: '#752432' }} />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <div className="text-gray-600">contact@{clubId.replace(/-/g, '')}.harvard.edu</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Website</div>
                        <div className="text-gray-600 flex items-center gap-1">
                          www.harvard.edu/clubs/{clubId}
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="board" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm" style={{ color: '#752432' }}>{member.role}</p>
                      <p className="text-sm text-gray-500">{member.year}</p>
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-3">{member.bio}</p>
                    <div className="text-center">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        {event.rsvpRequired && (
                          <Badge variant="outline" className="text-xs">RSVP Required</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-4">{event.description}</p>
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        style={{ backgroundColor: '#752432' }}
                      >
                        {event.rsvpRequired ? 'RSVP Now' : 'Learn More'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="join" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" style={{ color: '#752432' }} />
                      Application Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Application Status</span>
                          <Badge 
                            className={applicationInfo.applicationOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {applicationInfo.applicationOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        {applicationInfo.applicationOpen && (
                          <p className="text-sm text-gray-600">
                            Applications due: {new Date(applicationInfo.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {applicationInfo.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Selection Process</h4>
                        <p className="text-sm text-gray-600">{applicationInfo.process}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Questions?</h4>
                        <p className="text-sm text-gray-600">
                          Contact us at {applicationInfo.contact}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Express Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <Input placeholder="Enter your full name" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <Input type="email" placeholder="your.email@student.harvard.edu" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year/Program
                        </label>
                        <Input placeholder="e.g., 2L, LLM, SJD" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Why are you interested in joining? (Optional)
                        </label>
                        <Textarea
                          placeholder="Tell us about your interest in this organization..."
                          rows={4}
                        />
                      </div>
                      
                      <Button 
                        className="w-full"
                        style={{ backgroundColor: '#752432' }}
                      >
                        Submit Interest
                      </Button>
                      
                      <p className="text-xs text-gray-500 text-center">
                        Submitting this form doesn't constitute a formal application. 
                        You'll receive information about upcoming events and application deadlines.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}