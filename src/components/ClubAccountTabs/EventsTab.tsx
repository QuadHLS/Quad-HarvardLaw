import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Search, Users, Edit2, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { VirtualizedList } from '../ui/VirtualizedList';
import type { ClubFormData, Event } from '../ClubAccountPage';

interface EventsTabProps {
  formData: ClubFormData;
  updateFormData: (field: keyof ClubFormData, value: any) => void;
  rsvpDialogOpen: string | null;
  setRsvpDialogOpen: (id: string | null) => void;
  rsvpSearchQuery: string;
  setRsvpSearchQuery: (query: string) => void;
  rsvpNames: Record<string, string>;
  deleteRsvp: (eventId: string, userId: string) => Promise<void>;
  startEditing: (event: Event) => void;
  deleteEvent: (id: string) => void;
}

export function EventsTab({
  formData,
  updateFormData,
  rsvpDialogOpen,
  setRsvpDialogOpen,
  rsvpSearchQuery,
  setRsvpSearchQuery,
  rsvpNames,
  deleteRsvp,
  startEditing,
  deleteEvent,
}: EventsTabProps) {
  const events = formData.events || [];
  const useVirtual = events.length > 20;
  const height = Math.min(720, Math.max(360, events.length * 180));

  const renderCard = (event: Event) => (
    <Card key={event.id} className="p-4 bg-white shadow-sm border border-gray-200">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{event.name || 'Untitled Event'}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
              {event.date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </span>
              )}
              {(event.time || event.startTime || event.endTime) && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time || `${event.startTime || ''}${event.endTime ? ` - ${event.endTime}` : ''}`}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => startEditing(event)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => deleteEvent(event.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {event.shortDescription && <p className="text-gray-600 text-sm">{event.shortDescription}</p>}
        {event.fullDescription && <p className="text-gray-600 text-sm mt-2">{event.fullDescription}</p>}

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
                <DialogDescription>View and manage RSVPs for this event</DialogDescription>
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
                              <Button variant="outline" size="sm" onClick={() => deleteRsvp(event.id, userId)}>
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        {event.rsvps.filter((userId) => {
                          const fullName = (rsvpNames[userId] || 'Unknown User').toLowerCase();
                          return fullName.includes(rsvpSearchQuery.toLowerCase());
                        }).length === 0 &&
                          rsvpSearchQuery && (
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
    </Card>
  );

  if (!events.length) {
    return <p className="text-center text-gray-500 py-8">No events added yet.</p>;
  }

  if (useVirtual) {
    return (
      <VirtualizedList
        items={events}
        itemHeight={190}
        height={height}
        overscanCount={6}
        renderItem={(event) => renderCard(event)}
        className="rounded-lg border border-gray-100"
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => renderCard(event))}
    </div>
  );
}

