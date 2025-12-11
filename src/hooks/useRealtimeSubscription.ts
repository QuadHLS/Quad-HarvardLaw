import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for managing Supabase Realtime subscriptions with automatic cleanup
 * 
 * Ensures subscriptions are:
 * - Only active when component is mounted
 * - Properly cleaned up on unmount
 * - Scoped to current component/page
 * 
 * Usage:
 * useRealtimeSubscription(() => {
 *   const channel = supabase.channel('my-channel')
 *     .on('postgres_changes', { ... }, handler)
 *     .subscribe();
 *   return channel;
 * });
 */
export function useRealtimeSubscription(
  setupSubscription: () => RealtimeChannel | null | undefined,
  deps: React.DependencyList = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Clean up any existing subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up new subscription
    const channel = setupSubscription();
    if (channel) {
      channelRef.current = channel;
    }

    // Cleanup function - runs on unmount or when deps change
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return channelRef.current;
}

/**
 * Hook to check if component is still mounted
 * Useful for preventing state updates after unmount
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return () => isMountedRef.current;
}

