import React, { useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, Edit2, Trash2 } from 'lucide-react';
import { VirtualizedList } from '../ui/VirtualizedList';
import { extractFilename } from '../../utils/storage';
import type { ClubFormData, Member } from '../ClubAccountPage';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface MembersTabProps {
  formData: ClubFormData;
  updateFormData: (field: keyof ClubFormData, value: any) => void;
  startEditing: (member: Member) => void;
}

export function MembersTab({ formData, updateFormData, startEditing }: MembersTabProps) {
  const members = formData.members || [];
  const useVirtual = members.length > 30;
  const height = Math.min(800, Math.max(360, members.length * 140));

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const first = (a.name || '').split(/\s+/)[0].toLowerCase();
      const second = (b.name || '').split(/\s+/)[0].toLowerCase();
      return first.localeCompare(second);
    });
  }, [members]);

  const deleteMember = async (id: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Failed to delete: User not authenticated');
        return;
      }

      const memberToDelete = members.find((m) => m.id === id);
      if (memberToDelete?.picture && !memberToDelete.picture.startsWith('data:')) {
        const fileName = extractFilename(memberToDelete.picture);
        if (fileName) {
          await supabase.storage.from('Avatar').remove([fileName]);
        }
      }

      const updatedMembers = members.filter((m) => m.id !== id);
      updateFormData('members', updatedMembers);

      const { error } = await supabase
        .from('club_accounts')
        .update({ members: updatedMembers, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to delete member');
        updateFormData('members', members);
      } else {
        toast.success('Member deleted');
      }
    } catch (err) {
      toast.error('Unexpected error deleting member');
      updateFormData('members', members);
    }
  };

  const renderCard = (member: Member) => (
    <Card key={member.id} className="p-4 bg-white shadow-sm border border-gray-200">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {member.picture ? (
                <img
                  src={member.picture}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-600">
                  {(member.name || 'Member').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{member.name || 'Member'}</h3>
              <p className="text-sm text-gray-600">{member.role || 'Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => startEditing(member)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => deleteMember(member.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        {member.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{member.email}</span>
          </div>
        )}
        {member.bio && <p className="text-sm text-gray-600">{member.bio}</p>}
      </div>
    </Card>
  );

  if (!sortedMembers.length) {
    return <p className="text-center text-gray-500 py-8">No members added yet.</p>;
  }

  if (useVirtual) {
    return (
      <VirtualizedList
        items={sortedMembers}
        itemHeight={150}
        height={height}
        overscanCount={8}
        renderItem={(member) => renderCard(member)}
        className="rounded-lg border border-gray-100"
      />
    );
  }

  return <div className="space-y-3">{sortedMembers.map(renderCard)}</div>;
}

