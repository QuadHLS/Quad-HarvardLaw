import { useState } from 'react';

import { Inbox, Check } from 'lucide-react';

import { Button } from './ui/button';

import { toast } from 'sonner';

import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';



interface MatchButtonProps {

  studentName: string;

  receiverId: string;

  onMatchSent?: (name: string) => void;

  onMatchUnsent?: (name: string) => void;

  isMatchSent?: boolean;

  className?: string;

}



export function MatchButton({ 

  studentName, 

  receiverId,

  onMatchSent,

  onMatchUnsent,

  isMatchSent = false,

  className = ''

}: MatchButtonProps) {

  const { user } = useAuth();

  const [isAnimating, setIsAnimating] = useState(false);

  const [isLoading, setIsLoading] = useState(false);



  const handleMatchClick = async () => {

    if (!user?.id) return;

    setIsLoading(true);



    if (isMatchSent) {

      // Handle unsending - delete the match

      try {

        const { error } = await supabase

          .from('matches')

          .delete()

          .eq('sender_id', user.id)

          .eq('receiver_id', receiverId);



        if (error) {

          console.error('Error unsending match:', error);

          toast.error('Failed to unsend match');

        } else {

          if (onMatchUnsent) {

            onMatchUnsent(studentName);

          }

          toast.success(`Match unsent to ${studentName}`, {

            duration: 3000,

          });

        }

      } catch (error) {

        console.error('Error unsending match:', error);

        toast.error('Failed to unsend match');

      } finally {

        setIsLoading(false);

      }

      return;

    }

    

    setIsAnimating(true);

    

    try {

      // Check match limits before sending
      const now = new Date();
      // Use UTC for date calculations to match database timestamps
      const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Check daily limit: 2 matches per day total
      const { data: todayMatches, error: todayError } = await supabase
        .from('matches')
        .select('id')
        .eq('sender_id', user.id)
        .gte('created_at', startOfTodayUTC.toISOString());

      if (todayError) {
        console.error('Error checking daily match limit:', todayError);
        toast.error('Failed to check match limits');
        setIsAnimating(false);
        setIsLoading(false);
        return;
      }

      if (todayMatches && todayMatches.length >= 2) {
        toast.error('You can only send 2 matches per day');
        setIsAnimating(false);
        setIsLoading(false);
        return;
      }

      // Check weekly limit: 10 matches per week
      const { data: weekMatches, error: weekError } = await supabase
        .from('matches')
        .select('id')
        .eq('sender_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString());

      if (weekError) {
        console.error('Error checking weekly match limit:', weekError);
        toast.error('Failed to check match limits');
        setIsAnimating(false);
        setIsLoading(false);
        return;
      }

      if (weekMatches && weekMatches.length >= 10) {
        toast.error('You have reached the weekly limit of 10 matches');
        setIsAnimating(false);
        setIsLoading(false);
        return;
      }

      // Insert new match

      const { error } = await supabase

        .from('matches')

        .insert({

          sender_id: user.id,

          receiver_id: receiverId

        });



      if (error) {

        console.error('Error sending match:', error);

        toast.error('Failed to send match');

        setIsAnimating(false);

      } else {

        // Trigger callback if provided

        if (onMatchSent) {

          onMatchSent(studentName);

        }

        

        // Show toast notification

        toast.success(`Match sent to ${studentName}!`, {

          duration: 3000,

        });

        

        // Reset animation state after animation completes

        setTimeout(() => {

          setIsAnimating(false);

        }, 500);

      }

    } catch (error) {

      console.error('Error sending match:', error);

      toast.error('Failed to send match');

      setIsAnimating(false);

    } finally {

      setIsLoading(false);

    }

  };



  if (isMatchSent) {

    return (

      <Button 

        onClick={handleMatchClick}

        disabled={isLoading}

        className={`gap-2 text-white hover:opacity-90 transition-all ${className}`}

        style={{ backgroundColor: '#22c55e', cursor: isLoading ? 'wait' : 'pointer' }}

      >

        <Check className="w-4 h-4" />

        {isLoading ? 'Unsent...' : 'Match Sent'}

      </Button>

    );

  }



  return (

    <Button 

      onClick={handleMatchClick}

      disabled={isLoading || isAnimating}

      className={`gap-2 text-white hover:opacity-90 transition-all ${

        isAnimating ? 'scale-95' : ''

      } ${className}`}

      style={{ backgroundColor: '#752432' }}

    >

      <Inbox 

        className={`w-4 h-4 transition-transform ${

          isAnimating ? 'scale-110 animate-pulse' : ''

        }`} 

      />

      {isLoading ? 'Sending...' : 'Match'}

    </Button>

  );

}



interface MatchInboxButtonProps {

  onClick: () => void;

  className?: string;

}



export function MatchInboxButton({ 

  onClick, 

  className = ''

}: MatchInboxButtonProps) {

  return (

    <Button 

      onClick={onClick} 

      variant="outline" 

      className={`gap-2 ${className}`}

    >

      <Inbox className="w-4 h-4" />

      Match Inbox

    </Button>

  );

}

