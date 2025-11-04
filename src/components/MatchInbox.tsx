import { useState, useEffect, useCallback } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { Badge } from './ui/badge';

import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';



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

        // Process received matches - create array with both anonymous and named entries for mutual matches
        const allReceivedMatches: ReceivedMatch[] = [];

        for (const match of receivedData || []) {
          const isMutual = match.is_mutual;
          const senderId = match.sender_id;
          let senderName: string | undefined;

          // If mutual, get sender's name
          if (isMutual && senderId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', senderId)
              .single();
            if (profile?.full_name) {
              senderName = profile.full_name;
            }
          }

          // Always add the anonymous "Someone on Quad likes you" message
          allReceivedMatches.push({
            id: match.id,
            message: 'Someone on Quad likes you',
            timestamp: formatTimestamp(new Date(match.created_at)),
            matched: isMutual,
            icon: '❤️',
            name: undefined,
            sender_id: senderId
          });

          // If mutual, also add the named message
          if (isMutual && senderName) {
            allReceivedMatches.push({
              id: `${match.id}-named`,
              message: `${senderName} likes you`,
              timestamp: formatTimestamp(new Date(match.created_at)),
              matched: true,
              icon: '💚',
              name: senderName,
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

        const formattedSent: SentMatch[] = await Promise.all((sentData || []).map(async (match: any) => {

          // Check if mutual using the database function

          const { data: isMutualData, error: mutualError } = await supabase

            .rpc('is_mutual_match', {

              sender_uuid: user.id,

              receiver_uuid: match.receiver_id

            });



          const isMutual = !mutualError && isMutualData === true;



          // Get receiver name

          const { data: profile } = await supabase

            .from('profiles')

            .select('full_name')

            .eq('id', match.receiver_id)

            .single();



          const receiverName = profile?.full_name || 'Unknown';



          let message = `You sent a match to ${receiverName}`;

          if (isMutual) {

            message = `You and ${receiverName} matched!`;

          }



          return {

            id: match.id,

            message,

            timestamp: formatTimestamp(new Date(match.created_at)),

            matched: isMutual,

            name: receiverName,

            receiver_id: match.receiver_id

          };

        }));

        setSentMatches(formattedSent);

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

          <TabsList className="grid w-full grid-cols-2">

            <TabsTrigger value="received">Received</TabsTrigger>

            <TabsTrigger value="sent">Sent</TabsTrigger>

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

                    <div className="text-2xl">{match.icon}</div>

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

                    <div className="text-2xl">{match.matched ? '💚' : '💌'}</div>

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

        </Tabs>

      </DialogContent>

    </Dialog>

  );

}

