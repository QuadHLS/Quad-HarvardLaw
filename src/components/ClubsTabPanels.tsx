import React, { memo, useMemo } from 'react';
import { Users, BookOpen, Gavel } from 'lucide-react';
import { VirtualizedList } from './ui/VirtualizedList';

type Club = any;
type RenderCard = (club: Club, index: number) => React.ReactElement;

interface SectionProps {
  title: string;
  items: Club[];
  renderCard: RenderCard;
  startIndex?: number;
}

const Section = memo(function Section({ title, items, renderCard, startIndex = 0 }: SectionProps) {
  if (!items.length) return null;

  const useVirtual = items.length > 24;
  const height = useMemo(() => {
    const base = Math.min(items.length * 120, 900);
    return Math.max(420, base);
  }, [items.length]);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-medium text-gray-900">{title}</h2>
      </div>
      {useVirtual ? (
        <VirtualizedList
          items={items}
          itemHeight={220}
          height={height}
          overscanCount={8}
          renderItem={(club, index) => renderCard(club, startIndex + index)}
          className="rounded-xl border border-gray-100 bg-transparent"
          style={{ padding: '0.25rem' }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((club, index) => renderCard(club, startIndex + index))}
        </div>
      )}
    </div>
  );
});

interface TabProps {
  renderCard: RenderCard;
}

interface AllGroupsProps extends TabProps {
  top8: Club[];
  orgsExcludingTop: Club[];
  sposExcludingTop: Club[];
  journalsExcludingTop: Club[];
}

export const AllGroupsTab = memo(function AllGroupsTab({
  top8,
  orgsExcludingTop,
  sposExcludingTop,
  journalsExcludingTop,
  renderCard,
}: AllGroupsProps) {
  return (
    <div className="mt-0">
      {top8.length > 0 && <Section title="Top" items={top8} renderCard={renderCard} />}
      {orgsExcludingTop.length > 0 && (
        <Section title="Orgs" items={orgsExcludingTop} renderCard={renderCard} startIndex={top8.length} />
      )}
      {sposExcludingTop.length > 0 && (
        <Section
          title="SPOs"
          items={sposExcludingTop}
          renderCard={renderCard}
          startIndex={top8.length + orgsExcludingTop.length}
        />
      )}
      {journalsExcludingTop.length > 0 && (
        <Section
          title="Journals"
          items={journalsExcludingTop}
          renderCard={renderCard}
          startIndex={top8.length + orgsExcludingTop.length + sposExcludingTop.length}
        />
      )}
    </div>
  );
});

interface SingleCategoryProps extends TabProps {
  items: Club[];
  emptyLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EmptyState = memo(function EmptyState({ label, Icon }: { label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 text-lg">{label}</p>
    </div>
  );
});

export const SingleCategoryTab = memo(function SingleCategoryTab({
  items,
  emptyLabel,
  icon: Icon,
  renderCard,
}: SingleCategoryProps) {
  if (!items.length) {
    return <EmptyState label={emptyLabel} Icon={Icon} />;
  }
  return <Section title="" items={items} renderCard={renderCard} />;
});

interface MyClubsProps extends TabProps {
  items: Club[];
}

export const MyClubsTab = memo(function MyClubsTab({ items, renderCard }: MyClubsProps) {
  if (!items.length) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">You haven't joined any clubs yet.</p>
        <p className="text-gray-400 text-sm mt-2">Explore clubs in the other tabs to get started!</p>
      </div>
    );
  }
  return <Section title="My Clubs" items={items} renderCard={renderCard} />;
});
