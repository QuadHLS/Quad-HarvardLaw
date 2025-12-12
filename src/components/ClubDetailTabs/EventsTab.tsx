import React from 'react';
import { TabsContent } from '../ui/tabs';
import { Card } from '../ui/card';

interface EventsTabProps {
  value: string;
  content: React.ReactNode;
}

export function EventsTab({ value, content }: EventsTabProps) {
  return (
    <TabsContent value={value} className="mt-6">
      <Card className="border-none" style={{ backgroundColor: '#FEFBF6' }}>
        {content}
      </Card>
    </TabsContent>
  );
}
