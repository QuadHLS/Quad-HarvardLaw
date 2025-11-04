import { useState } from 'react';

import { Heart, Check, Inbox } from 'lucide-react';

import { Button } from './ui/button';

import { Badge } from './ui/badge';

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

      <Heart 

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

  unreadCount?: number;

  className?: string;

}



export function MatchInboxButton({ 

  onClick, 

  unreadCount = 0,

  className = ''

}: MatchInboxButtonProps) {

  return (

    <Button 

      onClick={onClick} 

      variant="outline" 

      className={`gap-2 relative ${className}`}

    >

      <div className="relative">

        <Inbox className="w-4 h-4" />

        {unreadCount > 0 && (

          <Badge 

            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs border-2 border-white text-white"

            style={{ backgroundColor: '#752432' }}

          >

            {unreadCount > 99 ? '99+' : unreadCount}

          </Badge>

        )}

      </div>

      Match Inbox

    </Button>

  );

}

