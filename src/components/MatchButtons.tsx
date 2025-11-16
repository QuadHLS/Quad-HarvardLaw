import React from 'react';

import { Heart, HelpCircle } from 'lucide-react';

import { Button } from './ui/button';

import { Badge } from './ui/badge';



interface MatchButtonsProps {

  onMatchInboxClick?: () => void;

  onMatchInfoClick?: () => void;

  matchCount?: number;

}



export function MatchButtons({ 

  onMatchInboxClick, 

  onMatchInfoClick, 

  matchCount = 0 

}: MatchButtonsProps) {

  return (

    <div className="flex flex-col gap-2">

      <Button

        variant="outline"

        size="sm"

        onClick={onMatchInboxClick}

        className="gap-2"

      >

        <Heart className="w-4 h-4" style={{ fill: '#ef4444', color: '#ef4444' }} />

        Match Inbox

        {matchCount > 0 && (

          <Badge 

            className="ml-1 text-white" 

            style={{ backgroundColor: '#752432' }}

          >

            {matchCount}

          </Badge>

        )}

      </Button>

      <Button

        variant="outline"

        size="sm"

        onClick={onMatchInfoClick}

        className="gap-2"

      >

        <HelpCircle className="w-4 h-4" />

        How Match Works

      </Button>

    </div>

  );

}

