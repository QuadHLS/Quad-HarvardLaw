import React from 'react';

import { Inbox, HelpCircle } from 'lucide-react';

import { Button } from './ui/button';



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

        className="gap-2 relative"

      >

        {matchCount > 0 && (
          <div 
            className="absolute rounded-full flex items-center justify-center text-white font-semibold z-10"
            style={{ 
              backgroundColor: '#ef4444', 
              fontSize: '11px', 
              minWidth: '22px',
              height: '22px',
              padding: matchCount > 9 ? '0 5px' : '0',
              lineHeight: '1',
              top: '-10px',
              right: '-8px'
            }}
          >
            {matchCount > 99 ? '99+' : matchCount}
          </div>
        )}
        <Inbox className="w-4 h-4" />

        Match Inbox

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

