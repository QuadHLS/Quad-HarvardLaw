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

    <div className="flex gap-2 items-center">

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

        size="icon"

        onClick={onMatchInfoClick}

        className="!w-8 !h-8 !p-0 !min-w-8 !min-h-8"

        style={{ width: '32px', height: '32px', padding: 0 }}

        title="How Match Works"

      >

        <HelpCircle className="w-4 h-4" />

      </Button>

    </div>

  );

}

