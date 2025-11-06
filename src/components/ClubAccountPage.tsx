import React, { useState, ChangeEvent } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Upload, Mail, Globe, Calendar, Clock, MapPin, Plus, Trash2, Edit2, X, Check, 
  Users, Search, ChevronDown, User, MessageSquare 
} from 'lucide-react';

// Types
export interface RSVP {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  rsvps: RSVP[];
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
function ClubBasicInfo({ formData, updateFormData }: { formData: ClubFormData; updateFormData: (field: keyof ClubFormData, value: any) => void }) {
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('picture', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const words = e.target.value.trim().split(/\s+/);
    if (words.length <= 50 || e.target.value === '') {
      updateFormData('description', e.target.value);
    }
  };

  const wordCount = formData.description.trim() ? formData.description.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1">Basic Information</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div>
            <Label htmlFor="club-picture">Club Picture *</Label>
            <div className="mt-2">
              {formData.picture ? (
                <div className="relative w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img 
                    src={formData.picture} 
                    alt="Club" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => updateFormData('picture', '')}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-base text-gray-600">Upload Image</span>
                  <input
                    id="club-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center">
              <div className="w-full">
                <Label htmlFor="club-name">Club Name *</Label>
                <Input
                  id="club-name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your club name"
                  className="mt-2 bg-white"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Label htmlFor="club-description">Club Description *</Label>
                <Textarea
                  id="club-description"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Brief description of your club"
                  className="mt-2 bg-white"
                  style={{ minHeight: '256px', fontSize: '14px' }}
                />
                <p className="text-sm text-gray-500 mt-1 text-right">
                  {wordCount}/50 words
                </p>
              </div>

              <div className="flex-1">
                <Label htmlFor="club-tag">Club Tag *</Label>
                <Select value={formData.tag} onValueChange={(value) => updateFormData('tag', value)}>
                  <SelectTrigger id="club-tag" className="mt-2">
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student-practice">Student Practice Organization</SelectItem>
                    <SelectItem value="student-org">Student Organization</SelectItem>
                    <SelectItem value="journal">Journal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="mission-purpose">Mission & Purpose *</Label>
          <Textarea
            id="mission-purpose"
            value={formData.missionPurpose}
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/);
              if (words.length <= 500 || e.target.value === '') {
                updateFormData('missionPurpose', e.target.value);
              }
            }}
            placeholder="What is your club's mission and purpose? What goals do you hope to achieve?"
            className="mt-2 min-h-48 bg-white"
            style={{ fontSize: '14px' }}
          />
          <div className="flex justify-end mt-1">
            <p className="text-sm text-gray-500">
              {formData.missionPurpose.trim() ? formData.missionPurpose.trim().split(/\s+/).length : 0}/500 words
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="club@university.edu"
                className="pl-10 bg-white"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <div className="relative mt-2">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://yourclub.com"
                className="pl-10 bg-white"
                style={{ fontSize: '14px' }}
              />
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
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState<string | null>(null);
  const [newRsvpFirstName, setNewRsvpFirstName] = useState('');
  const [newRsvpLastName, setNewRsvpLastName] = useState('');
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState('');
  const [manualAddOpen, setManualAddOpen] = useState(false);

  const addEvent = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      name: '',
      date: '',
      time: '',
      location: '',
      shortDescription: '',
      fullDescription: '',
      rsvps: []
    };
    updateFormData('events', [...formData.events, newEvent]);
    setEditingEvent(newEvent.id);
    setEditFormData(newEvent);
  };

  const deleteEvent = (id: string) => {
    updateFormData('events', formData.events.filter(event => event.id !== id));
    if (editingEvent === id) {
      setEditingEvent(null);
      setEditFormData(null);
    }
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event.id);
    setEditFormData({ ...event });
  };

  const saveEditing = () => {
    if (editFormData) {
      updateFormData('events', formData.events.map(event => 
        event.id === editFormData.id ? editFormData : event
      ));
      setEditingEvent(null);
      setEditFormData(null);
    }
  };

  const cancelEditing = () => {
    if (editFormData && !editFormData.name) {
      deleteEvent(editFormData.id);
    }
    setEditingEvent(null);
    setEditFormData(null);
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

  const addRsvp = (eventId: string) => {
    if (!newRsvpFirstName.trim() || !newRsvpLastName.trim()) return;
    
    const newRsvp: RSVP = {
      id: Date.now().toString(),
      firstName: newRsvpFirstName.trim(),
      lastName: newRsvpLastName.trim()
    };

    updateFormData('events', formData.events.map(event => 
      event.id === eventId 
        ? { ...event, rsvps: [...event.rsvps, newRsvp] }
        : event
    ));

    setNewRsvpFirstName('');
    setNewRsvpLastName('');
  };

  const deleteRsvp = (eventId: string, rsvpId: string) => {
    updateFormData('events', formData.events.map(event => 
      event.id === eventId 
        ? { ...event, rsvps: event.rsvps.filter(rsvp => rsvp.id !== rsvpId) }
        : event
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900 mb-1">Events</h2>
          <p className="text-gray-600">Add upcoming events for your club</p>
        </div>
        <Button onClick={addEvent} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {formData.events.length === 0 ? (
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
          {formData.events.map((event) => (
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
                      <div className="relative mt-2">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id={`event-time-${event.id}`}
                          type="time"
                          value={editFormData.time}
                          onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                          className="pl-10 bg-white"
                          style={{ fontSize: '14px' }}
                        />
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
                                    .filter((rsvp) => {
                                      const fullName = `${rsvp.firstName} ${rsvp.lastName}`.toLowerCase();
                                      return fullName.includes(rsvpSearchQuery.toLowerCase());
                                    })
                                    .map((rsvp) => (
                                      <div key={rsvp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <span className="text-sm">{rsvp.firstName} {rsvp.lastName}</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => deleteRsvp(event.id, rsvp.id)}
                                        >
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  {event.rsvps.filter((rsvp) => {
                                    const fullName = `${rsvp.firstName} ${rsvp.lastName}`.toLowerCase();
                                    return fullName.includes(rsvpSearchQuery.toLowerCase());
                                  }).length === 0 && rsvpSearchQuery && (
                                    <p className="text-sm text-gray-500 text-center py-4">No matching RSVPs found</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-4">
                            <Collapsible open={manualAddOpen} onOpenChange={setManualAddOpen}>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between text-gray-600">
                                  <span className="text-sm">Manually add RSVP</span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${manualAddOpen ? 'rotate-180' : ''}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-3">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor="rsvp-first-name">First Name</Label>
                                      <Input
                                        id="rsvp-first-name"
                                        value={newRsvpFirstName}
                                        onChange={(e) => setNewRsvpFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="mt-1 bg-white"
                                        style={{ fontSize: '14px' }}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="rsvp-last-name">Last Name</Label>
                                      <Input
                                        id="rsvp-last-name"
                                        value={newRsvpLastName}
                                        onChange={(e) => setNewRsvpLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="mt-1 bg-white"
                                        style={{ fontSize: '14px' }}
                                      />
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => addRsvp(event.id)}
                                    disabled={!newRsvpFirstName.trim() || !newRsvpLastName.trim()}
                                    className="w-full"
                                    size="sm"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add RSVP
                                  </Button>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
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

  const addMember = () => {
    const newMember: Member = {
      id: Date.now().toString(),
      name: '',
      picture: '',
      bio: '',
      role: '',
      email: ''
    };
    updateFormData('members', [...formData.members, newMember]);
    setEditingMember(newMember.id);
    setEditFormData(newMember);
  };

  const deleteMember = (id: string) => {
    updateFormData('members', formData.members.filter(member => member.id !== id));
    if (editingMember === id) {
      setEditingMember(null);
      setEditFormData(null);
    }
  };

  const startEditing = (member: Member) => {
    setEditingMember(member.id);
    setEditFormData({ ...member });
  };

  const saveEditing = () => {
    if (editFormData) {
      updateFormData('members', formData.members.map(member => 
        member.id === editFormData.id ? editFormData : member
      ));
      setEditingMember(null);
      setEditFormData(null);
    }
  };

  const cancelEditing = () => {
    if (editFormData && !editFormData.name) {
      deleteMember(editFormData.id);
    }
    setEditingMember(null);
    setEditFormData(null);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editFormData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-900 mb-1">Board Members</h2>
          <p className="text-gray-600">Add your club's leadership team</p>
        </div>
        <Button onClick={addMember} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {formData.members.length === 0 ? (
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
          {formData.members.map((member) => (
            <Card key={member.id} className="p-4">
              {editingMember === member.id && editFormData ? (
                <div className="space-y-4">
                  <div>
                    <Label>Member Picture</Label>
                    <div className="mt-2">
                      {editFormData.picture ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                          <img 
                            src={editFormData.picture} 
                            alt="Member" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setEditFormData({ ...editFormData, picture: '' })}
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-gray-400 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
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
                      <img 
                        src={member.picture} 
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
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
  const [postPhotoFile, setPostPhotoFile] = useState<File | null>(null);
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
      setPostPhotoFile(compressedFile);
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
    setPostPhotoFile(null);
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
        <div className="space-y-3 flex-1 overflow-y-auto">
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
                Cancel
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
        <div className="flex flex-col overflow-hidden h-full">
          <h3 className="text-gray-900 mb-3 flex-shrink-0">Your Posts ({formData.posts.length})</h3>
          
          <div className="flex-1 overflow-y-auto">
            {formData.posts.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No posts</p>
              </Card>
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
                        <span className="text-gray-900">{formData.name || 'Your Club'}</span>
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

  const updateFormData = (field: keyof ClubFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name || !formData.description || !formData.tag) {
      toast.error('Please fill out all required fields in Basic Information');
      setActiveTab('basic');
      return;
    }
    
    if (!formData.missionPurpose) {
      toast.error('Please fill out the Mission & Purpose');
      setActiveTab('basic');
      return;
    }

    if (!formData.email) {
      toast.error('Please provide contact email');
      setActiveTab('basic');
      return;
    }

    toast.success('Club onboarding completed successfully!');
    console.log('Form Data:', formData);
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#f9f6f1' }}>
      <div className="w-full h-full flex-1 overflow-y-auto px-4 py-4">
        <div className="w-full mx-auto h-full flex flex-col" style={{ maxWidth: '95vw' }}>
          <div className="mb-4 flex items-center gap-4 relative flex-shrink-0">
            <img src="/QUAD.svg" alt="Quad Logo" className="w-12 h-12 object-contain" style={{ minWidth: '48px' }} />
            <h1 className="text-xl font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Club Control Center</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 mb-4 h-auto flex-shrink-0" style={{ minHeight: '36px' }}>
              <TabsTrigger value="basic" className="text-xs h-full flex items-center justify-center py-1">Basic Info</TabsTrigger>
              <TabsTrigger value="events" className="text-xs h-full flex items-center justify-center py-1">Events</TabsTrigger>
              <TabsTrigger value="members" className="text-xs h-full flex items-center justify-center py-1">Members</TabsTrigger>
              <TabsTrigger value="feed" className="text-xs h-full flex items-center justify-center py-1">Feed</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
              <TabsContent value="basic" className="space-y-4">
                <ClubBasicInfo 
                  formData={formData}
                  updateFormData={updateFormData}
                />
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

          {activeTab !== 'events' && activeTab !== 'members' && activeTab !== 'feed' && (
            <div className="mt-4 flex justify-end items-center pt-3 border-t border-gray-300 flex-shrink-0">
              <Button onClick={handleSubmit} size="sm">
                Save
              </Button>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
};
