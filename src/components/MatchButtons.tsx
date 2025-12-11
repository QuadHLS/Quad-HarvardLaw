import { Inbox, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';



interface MatchButtonsProps {

  onMatchInboxClick?: () => void;

  onMatchInfoClick?: () => void;

}



export function MatchButtons({ 

  onMatchInboxClick, 

  onMatchInfoClick

}: MatchButtonsProps) {

  return (

    <div className="flex gap-2 items-center">

      <Button

        variant="outline"

        size="sm"

        onClick={onMatchInboxClick}

        className="gap-2"

      >

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

