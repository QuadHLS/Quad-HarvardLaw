import { useState, useEffect, useCallback } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { Badge } from './ui/badge';

import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';

import { Heart } from 'lucide-react';



interface ReceivedMatch {

  id: string;

  message: string;

  timestamp: string;

  matched: boolean;

  icon: string;

  name?: string;

  sender_id?: string | null;

}



interface SentMatch {

  id: string;

  message: string;

  timestamp: string;

  matched: boolean;

  name?: string;

  receiver_id: string;

  icon?: string;

}



interface MatchInboxProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  refreshTrigger?: number; // Triggers refresh when changed

}



// Helper function to format timestamp
function formatTimestamp(date: Date): string {

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);

  const diffHours = Math.floor(diffMs / 3600000);

  const diffDays = Math.floor(diffMs / 86400000);



  if (diffMins < 1) return 'Just now';

  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;

  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;

  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  return date.toLocaleDateString();

}



export function MatchInbox({ open, onOpenChange, refreshTrigger }: MatchInboxProps) {

  const { user } = useAuth();

  const [receivedMatches, setReceivedMatches] = useState<ReceivedMatch[]>([]);

  const [sentMatches, setSentMatches] = useState<SentMatch[]>([]);

  const [mutualMatches, setMutualMatches] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    name: string;
  }>>([]);

  const [loading, setLoading] = useState(true);



  const fetchMatches = useCallback(async () => {

    if (!user?.id) return;

    setLoading(true);

    try {

      // Fetch received matches using the function

      const { data: receivedData, error: receivedError } = await supabase

        .rpc('get_received_matches');



      if (receivedError) {

        console.error('Error fetching received matches:', receivedError);

      } else {

        // Process received matches - only show non-mutual matches
        const allReceivedMatches: ReceivedMatch[] = [];

        for (const match of receivedData || []) {
          const isMutual = match.is_mutual;
          const senderId = match.sender_id;

          // Only add non-mutual matches to received inbox
          if (!isMutual) {
            allReceivedMatches.push({
              id: match.id,
              message: 'Someone on Quad matched with you',
              timestamp: formatTimestamp(new Date(match.created_at)),
              matched: false,
              icon: '💌',
              name: undefined,
              sender_id: senderId
            });
          }
        }

        const formattedReceived = allReceivedMatches;

        setReceivedMatches(formattedReceived);

      }



      // Fetch sent matches

      const { data: sentData, error: sentError } = await supabase

        .from('matches')

        .select('id, receiver_id, created_at')

        .eq('sender_id', user.id)

        .order('created_at', { ascending: false });



      if (sentError) {

        console.error('Error fetching sent matches:', sentError);

      } else {

        // Check which ones are mutual and get receiver names
        // Only show non-mutual matches in sent inbox

        const formattedSent: SentMatch[] = await Promise.all((sentData || []).map(async (match: any) => {

          // Check if mutual using the database function

          const { data: isMutualData, error: mutualError } = await supabase

            .rpc('is_mutual_match', {

              sender_uuid: user.id,

              receiver_uuid: match.receiver_id

            });



          const isMutual = !mutualError && isMutualData === true;

          // Skip mutual matches - they'll be shown in Matches tab
          if (isMutual) {
            return null;
          }

          // Get receiver name

          const { data: profile } = await supabase

            .from('profiles')

            .select('full_name')

            .eq('id', match.receiver_id)

            .single();



          const receiverName = profile?.full_name || 'Unknown';



          return {

            id: match.id,

            message: `You sent a match to ${receiverName}`,

            timestamp: formatTimestamp(new Date(match.created_at)),

            matched: false,

            name: receiverName,

            receiver_id: match.receiver_id,

            icon: '💌'

          };

        }));

        // Filter out null values (mutual matches)
        const filteredSent = formattedSent.filter((match): match is SentMatch => match !== null);

        setSentMatches(filteredSent);

        // Fetch mutual matches for Matches tab
        const mutualMatchesList: Array<{
          id: string;
          message: string;
          timestamp: string;
          name: string;
        }> = [];

        // Check received matches for mutual ones
        for (const match of receivedData || []) {
          if (match.is_mutual && match.sender_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', match.sender_id)
              .single();
            
            if (profile?.full_name) {
              mutualMatchesList.push({
                id: match.id,
                message: `You and ${profile.full_name} matched!`,
                timestamp: formatTimestamp(new Date(match.created_at)),
                name: profile.full_name
              });
            }
          }
        }

        // Check sent matches for mutual ones
        if (sentData) {
          for (const match of sentData) {
            const { data: isMutualData } = await supabase
              .rpc('is_mutual_match', {
                sender_uuid: user.id,
                receiver_uuid: match.receiver_id
              });

            if (isMutualData === true) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', match.receiver_id)
                .single();

              if (profile?.full_name) {
                // Check if we already added this match (avoid duplicates)
                const exists = mutualMatchesList.some(m => m.name === profile.full_name);
                
                if (!exists) {
                  mutualMatchesList.push({
                    id: match.id,
                    message: `You and ${profile.full_name} matched!`,
                    timestamp: formatTimestamp(new Date(match.created_at)),
                    name: profile.full_name
                  });
                }
              }
            }
          }
        }

        setMutualMatches(mutualMatchesList);

      }

    } catch (error) {

      console.error('Error fetching matches:', error);

    } finally {

      setLoading(false);

    }

  }, [user?.id]);

  // Fetch matches when dialog opens or refreshTrigger changes
  useEffect(() => {
    if (open && user?.id) {
      fetchMatches();
    }
  }, [open, user?.id, refreshTrigger, fetchMatches]);



  const handleCancelMatch = async (matchId: string) => {

    if (!user?.id) return;



    try {

      const { error } = await supabase

        .from('matches')

        .delete()

        .eq('id', matchId)

        .eq('sender_id', user.id);



      if (error) {

        console.error('Error canceling match:', error);

      } else {

        // Refresh matches

        await fetchMatches();

      }

    } catch (error) {

      console.error('Error canceling match:', error);

    }

  };



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle>Match Inbox</DialogTitle>

        </DialogHeader>

        

        <Tabs defaultValue="received" className="w-full">

          <TabsList className="grid w-full grid-cols-3">

            <TabsTrigger value="received">Received</TabsTrigger>

            <TabsTrigger value="sent">Sent</TabsTrigger>

            <TabsTrigger value="matches">Matches</TabsTrigger>

          </TabsList>

          

          <TabsContent value="received" className="space-y-3 mt-4">

            {loading ? (

              <div className="text-center py-8 text-gray-500">Loading matches...</div>

            ) : receivedMatches.length === 0 ? (

              <div className="text-center py-8 text-gray-500">No received matches</div>

            ) : (

              receivedMatches.map((match) => (

                <div

                  key={match.id}

                  className={`p-4 rounded-lg border transition-colors ${

                    match.matched

                      ? 'bg-green-50 border-green-200'

                      : 'bg-white border-gray-200 hover:bg-gray-50'

                  }`}

                >

                  <div className="flex items-start gap-3">

                    <div className="flex items-center justify-center">
                      {match.icon === 'two-hearts' ? (
                        <div className="relative flex items-center justify-center" style={{ width: '32px', height: '28px' }}>
                          <Heart className="w-6 h-6 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '2px', left: '0px', zIndex: 1 }} />
                          <Heart className="w-4 h-4 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '-6px', left: '18px', zIndex: 2 }} />
                        </div>
                      ) : (
                        <span className="text-2xl">{match.icon || '💌'}</span>
                      )}
                    </div>

                    <div className="flex-1">

                      <div className={`${match.matched ? 'text-green-900' : 'text-gray-900'}`}>

                        {match.message}

                      </div>

                      <div className="text-xs text-gray-500 mt-1">{match.timestamp}</div>

                    </div>

                    {match.matched && (

                      <Badge 

                        className="border-0 text-white" 

                        style={{ backgroundColor: '#04913A' }}

                      >

                        Matched!

                      </Badge>

                    )}

                  </div>

                </div>

              ))

            )}

          </TabsContent>

          

          <TabsContent value="sent" className="space-y-3 mt-4">

            {loading ? (

              <div className="text-center py-8 text-gray-500">Loading matches...</div>

            ) : sentMatches.length === 0 ? (

              <div className="text-center py-8 text-gray-500">No sent matches</div>

            ) : (

              sentMatches.map((match) => (

                <div

                  key={match.id}

                  className={`p-4 rounded-lg border transition-colors ${

                    match.matched

                      ? 'bg-green-50 border-green-200'

                      : 'bg-white border-gray-200 hover:bg-gray-50'

                  }`}

                >

                  <div className="flex items-start gap-3">

                    <div className="flex items-center justify-center">
                      {match.icon === 'two-hearts' ? (
                        <div className="relative flex items-center justify-center" style={{ width: '32px', height: '28px' }}>
                          <Heart className="w-6 h-6 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '2px', left: '0px', zIndex: 1 }} />
                          <Heart className="w-4 h-4 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '-6px', left: '18px', zIndex: 2 }} />
                        </div>
                      ) : (
                        <span className="text-2xl">{match.icon || '💌'}</span>
                      )}
                    </div>

                    <div className="flex-1">

                      <div className={`${match.matched ? 'text-green-900' : 'text-gray-900'}`}>

                        {match.message}

                      </div>

                      <div className="text-xs text-gray-500 mt-1">{match.timestamp}</div>

                    </div>

                    <div className="flex items-center gap-2">

                      {match.matched && (

                        <Badge 

                          className="border-0 text-white" 

                          style={{ backgroundColor: '#04913A' }}

                        >

                          Matched!

                        </Badge>

                      )}

                      {!match.matched && (

                        <button

                          onClick={() => handleCancelMatch(match.id)}

                          className="text-xs text-red-600 hover:text-red-700 hover:underline"

                        >

                          Cancel

                        </button>

                      )}

                    </div>

                  </div>

                </div>

              ))

            )}

          </TabsContent>

          
          <TabsContent value="matches" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading matches...</div>
            ) : mutualMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No matches yet</div>
            ) : (
              mutualMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 rounded-lg border transition-colors bg-green-50 border-green-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center">
                      <div className="relative flex items-center justify-center" style={{ width: '32px', height: '28px' }}>
                        <Heart className="w-6 h-6 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '2px', left: '0px', zIndex: 1 }} />
                        <Heart className="w-4 h-4 absolute" style={{ color: '#ef4444', fill: '#ef4444', top: '-6px', left: '18px', zIndex: 2 }} />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-green-900">
                        {match.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{match.timestamp}</div>
                    </div>

                    <Badge 
                      className="border-0 text-white" 
                      style={{ backgroundColor: '#04913A' }}
                    >
                      Matched!
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

        </Tabs>

      </DialogContent>

    </Dialog>

  );

}

