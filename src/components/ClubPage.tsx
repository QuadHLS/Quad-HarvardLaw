import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Mail, ExternalLink, MapPin, Clock, Award, Target, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../utils/storage';


interface ClubPageProps {
  clubId: string;
  onBack: () => void;
}

export function ClubPage({ clubId, onBack }: ClubPageProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberPictureUrls, setMemberPictureUrls] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        
        // Try to decode the slug back to club name, or use clubId as-is if it's a UUID
        let query = supabase
          .from('club_accounts')
          .select('id, name, description, avatar_url, mission, email, website, events, members, member_joins');
        
        // Check if clubId is a UUID (contains hyphens and is 36 chars) or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);
        
        if (isUUID) {
          query = query.eq('id', clubId);
        } else {
          // Decode slug and search by exact name match
          const decodedName = decodeURIComponent(clubId);
          query = query.eq('name', decodedName);
        }
        
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error fetching club:', error?.message || "Unknown error");
          return;
        }

        if (!data) {
          return;
        }

        // Count members from member_joins array
        const memberCount = Array.isArray(data.member_joins) ? data.member_joins.length : 0;

        // Map events from JSONB array
        const mappedEvents = Array.isArray(data.events) ? data.events
          .filter((event: any) => event && event.id && event.name)
          .map((event: any) => ({
            id: event.id,
            title: event.name,
            date: event.date,
            time: event.time,
            location: event.location,
            description: event.shortDescription,
            longDescription: event.fullDescription,
            attendees: Array.isArray(event.rsvps) ? event.rsvps.length : 0,
            lunchProvided: event.lunchProvided
          })) : [];

        // Map members from JSONB array
        const mappedMembers = Array.isArray(data.members) ? data.members
          .filter((member: any) => member && member.id && member.name)
          .map((member: any) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            email: member.email,
            bio: member.bio,
            picture: member.picture
          })) : [];

        setClub({
          id: data.id,
          name: data.name,
          description: data.description,
          members: memberCount,
          mission: data.mission,
          email: data.email,
          website: data.website,
          events: mappedEvents,
          membersList: mappedMembers
        });

        // Fetch avatar URL
        if (data.avatar_url) {
          const url = await getStorageUrl(data.avatar_url, 'Avatar');
          setAvatarUrl(url);
        }

        // Fetch member picture URLs
        const picturePromises = mappedMembers
          .filter((member: any) => member.picture)
          .map(async (member: any) => {
            const url = await getStorageUrl(member.picture, 'Avatar');
            return { id: member.id, url };
          });

        const pictureUrls = await Promise.all(picturePromises);
        const urlMap: Record<string, string> = {};
        pictureUrls.forEach(({ id, url }) => {
          if (url) urlMap[id] = url;
        });
        setMemberPictureUrls(urlMap);
      } catch (err) {
        console.error('Error fetching club data:', err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [clubId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-gray-600">Loading club...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Club not found</h2>
          <Button onClick={onBack}>Back to Clubs</Button>
        </div>
      </div>
    );
  }

  const events = club.events;
  const boardMembers = club.membersList;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAF5EF' }}>
      {/* Header */}
      <div className="border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
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
                className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#F5F1E8' }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10" style={{ color: '#752432' }} />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{club.name}</h1>
                {club.description && (
                  <p className="text-gray-600 mb-4 max-w-3xl">{club.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {club.members} members
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                className="flex items-center gap-2"
                style={{ backgroundColor: '#752432' }}
              >
                <Users className="w-4 h-4" />
                Join
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3" style={{ backgroundColor: '#FEFBF6' }}>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Feed Section */}
                <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="w-6 h-6" style={{ color: '#752432' }} />
                      Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[70vh] overflow-y-auto" style={{ maxHeight: '70vh' }}>
                    <div className="space-y-5">
                      {/* Feed is empty */}
                      <div className="text-center py-12 text-gray-500">
                        <p>No posts yet.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" style={{ color: '#752432' }} />
                      Mission & Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {club.mission ? (
                      <p className="text-gray-700 leading-relaxed">{club.mission}</p>
                    ) : club.description ? (
                      <p className="text-gray-700 leading-relaxed">{club.description}</p>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" style={{ color: '#752432' }} />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {club.email && (
                        <div>
                          <div className="font-medium text-gray-900">Email</div>
                          <div className="text-gray-600">{club.email}</div>
                        </div>
                      )}
                      {club.website && (
                        <div>
                          <div className="font-medium text-gray-900">Website</div>
                          <div className="text-gray-600 flex items-center gap-1">
                            <a 
                              href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {club.website}
                            </a>
                            <a 
                              href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-gray-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers && boardMembers.length > 0 ? boardMembers.map((member: any) => {
                const memberPictureUrl = memberPictureUrls[member.id];
                return (
                <Card key={member.id} className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F5F1E8' }}>
                        {memberPictureUrl ? (
                          <img 
                            src={memberPictureUrl} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            {member.year && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5" style={{ borderColor: '#752432', color: '#752432' }}>
                                {member.year}
                              </Badge>
                            )}
                          </div>
                          {member.role && (
                            <p className="font-medium text-lg mb-1" style={{ color: '#752432' }}>{member.role}</p>
                          )}
                        </div>
                        {member.bio && (
                          <p className="text-sm text-gray-600 text-center leading-relaxed mb-4">{member.bio}</p>
                        )}
                        {member.email && (
                          <div className="flex justify-center">
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{member.email}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="text-center py-12 text-gray-500 col-span-full">
                  <p>No members listed.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>

              <div className="space-y-4">
                {events && events.length > 0 ? events.map((event: any, index: number) => {
                  const accentColors = ['#0080BD', '#04913A', '#FFBB06', '#F22F21'];
                  const accentColor = accentColors[index % accentColors.length];
                  return (
                    <Card 
                      key={event.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer border-none"
                      style={{ backgroundColor: 'white' }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${accentColor}15`, borderRadius: '0.5rem' }}
                          >
                            <Calendar className="w-8 h-8" style={{ color: accentColor }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                            <div className="space-y-1 text-sm text-gray-600 mb-4">
                              {event.date && (
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4" />
                                  {event.date}
                                </div>
                              )}
                              {event.time && (
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4" />
                                  {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-3">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-700 mb-4">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4">
                              <Button 
                                size="sm" 
                                style={{ backgroundColor: accentColor }}
                                className="text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                {event.attendees} Going
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Interested
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No events scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: '#FEFBF6' }}>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="sr-only">
                  View event details including date, time, location, and description
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#752432', borderRadius: '0.5rem' }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Date & Time</div>
                      {selectedEvent.date && (
                        <div className="text-gray-700">{selectedEvent.date}</div>
                      )}
                      {selectedEvent.time && (
                        <div className="text-gray-600">{selectedEvent.time}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: '#752432' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Location</div>
                      {selectedEvent.location ? (
                        <div className="text-gray-700">{selectedEvent.location}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                    >
                      <Users className="w-6 h-6" style={{ color: '#752432' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Attendance</div>
                      <div className="text-gray-700">{selectedEvent.attendees} people going</div>
                    </div>
                  </div>

                  {selectedEvent.lunchProvided && (
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#F5F1E8', borderRadius: '0.5rem' }}
                      >
                        <Award className="w-6 h-6" style={{ color: '#752432' }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">Refreshments</div>
                        <div className="text-gray-700">Lunch will be provided</div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedEvent.longDescription && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">About This Event</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.longDescription}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    className="flex-1"
                    style={{ backgroundColor: '#752432' }}
                    onClick={() => setSelectedEvent(null)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    RSVP
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
