import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Example TanStack Query hooks for Supabase queries
 * 
 * These hooks demonstrate how to:
 * - Cache Supabase queries
 * - Deduplicate simultaneous requests
 * - Enable background revalidation
 * - Invalidate cache on mutations
 * 
 * Usage in components:
 * const { data: outlines, isLoading, error } = useOutlines();
 */

// Query Keys - Centralized for consistency
export const queryKeys = {
  outlines: ['outlines'] as const,
  outline: (id: string) => ['outlines', id] as const,
  exams: ['exams'] as const,
  exam: (id: string) => ['exams', id] as const,
  courses: ['courses'] as const,
  userProfile: (userId: string) => ['profiles', userId] as const,
  savedOutlines: (userId: string) => ['savedOutlines', userId] as const,
  savedExams: (userId: string) => ['savedExams', userId] as const,
};

/**
 * Hook to fetch all outlines
 * Caches results and deduplicates requests
 */
export function useOutlines() {
  return useQuery({
    queryKey: queryKeys.outlines,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    // Data is considered fresh for 5 minutes (set in queryClient)
    // Stale data is kept for 10 minutes
  });
}

/**
 * Hook to fetch all exams
 */
export function useExams() {
  return useQuery({
    queryKey: queryKeys.exams,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch user's saved outlines
 */
export function useSavedOutlines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.savedOutlines(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile?.saved_outlines || profile.saved_outlines.length === 0) {
        return [];
      }

      const { data: outlines, error: outlinesError } = await supabase
        .from('outlines')
        .select('*')
        .in('id', profile.saved_outlines);

      if (outlinesError) throw outlinesError;
      return outlines || [];
    },
    enabled: !!user?.id, // Only run query if user is logged in
  });
}

/**
 * Hook to fetch user profile
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.userProfile(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

/**
 * Example mutation hook for saving an outline
 * Automatically invalidates and refetches saved outlines
 */
export function useSaveOutline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outlineId: string) => {
      if (!user?.id) throw new Error('User not logged in');

      // Get current saved outlines
      const { data: profile } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      const currentSaved = profile?.saved_outlines || [];
      const newSaved = currentSaved.includes(outlineId)
        ? currentSaved.filter((id: string) => id !== outlineId) // Remove if already saved
        : [...currentSaved, outlineId]; // Add if not saved

      const { error } = await supabase
        .from('profiles')
        .update({ saved_outlines: newSaved })
        .eq('id', user.id);

      if (error) throw error;
      return { outlineId, saved: !currentSaved.includes(outlineId) };
    },
    // Invalidate and refetch saved outlines after mutation
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedOutlines(user.id) });
      }
    },
  });
}

/**
 * Example mutation with optimistic update
 * Updates UI immediately, then syncs with server
 */
export function useToggleSaveOutline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outlineId: string) => {
      if (!user?.id) throw new Error('User not logged in');

      const { data: profile } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      const currentSaved = profile?.saved_outlines || [];
      const isCurrentlySaved = currentSaved.includes(outlineId);
      const newSaved = isCurrentlySaved
        ? currentSaved.filter((id: string) => id !== outlineId)
        : [...currentSaved, outlineId];

      const { error } = await supabase
        .from('profiles')
        .update({ saved_outlines: newSaved })
        .eq('id', user.id);

      if (error) throw error;
      return { outlineId, saved: !isCurrentlySaved };
    },
    // Optimistic update - update cache immediately
    onMutate: async (outlineId: string) => {
      if (!user?.id) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.savedOutlines(user.id) });

      // Snapshot the previous value
      const previousSaved = queryClient.getQueryData(queryKeys.savedOutlines(user.id));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.savedOutlines(user.id), (old: any) => {
        const currentSaved = (old || []).map((o: any) => o.id);
        const isSaved = currentSaved.includes(outlineId);
        // Return optimistic data (simplified - in real app, fetch the outline)
        return old; // Keep old data, actual update happens on success
      });

      return { previousSaved };
    },
    // If mutation fails, roll back to previous value
    onError: (err, outlineId, context) => {
      if (context?.previousSaved && user?.id) {
        queryClient.setQueryData(queryKeys.savedOutlines(user.id), context.previousSaved);
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedOutlines(user.id) });
      }
    },
  });
}

