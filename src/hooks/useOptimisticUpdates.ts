import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Optimistic update hooks for instant UI feedback
 * These hooks update the UI immediately, then sync with the server
 */

/**
 * Optimistic like/unlike for posts
 * Updates UI immediately, then syncs with server
 */
export function useOptimisticLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (postId: string, currentLiked: boolean) => {
    if (!user) return;

    // Optimistically update local state immediately
    // This would need to be integrated with your existing state management
    // For now, this is a template that can be adapted

    try {
      if (currentLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      // Rollback optimistic update on error
      console.error('Error toggling like:', error);
      // Revert the optimistic update here
    }
  }, [user, queryClient]);
}

/**
 * Optimistic comment creation
 * Shows comment immediately, then syncs with server
 */
export function useOptimisticComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (
    postId: string,
    content: string,
    isAnonymous: boolean,
    onSuccess?: (comment: any) => void,
    onError?: (error: Error) => void
  ) => {
    if (!user) return;

    // Create optimistic comment object
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      content,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      author_name: isAnonymous ? 'Anonymous' : user.user_metadata?.full_name || 'User',
      // Add optimistic flag to identify it
      _optimistic: true,
    };

    // Immediately add to UI (this would need to be integrated with your state)
    // For example: setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), optimisticComment] }));

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          content,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic comment with real one
      // setComments(prev => {
      //   const current = prev[postId] || [];
      //   const filtered = current.filter(c => c.id !== optimisticComment.id);
      //   return { ...prev, [postId]: [...filtered, data] };
      // });

      onSuccess?.(data);
    } catch (error) {
      // Remove optimistic comment on error
      // setComments(prev => {
      //   const current = prev[postId] || [];
      //   return { ...prev, [postId]: current.filter(c => c.id !== optimisticComment.id) };
      // });
      onError?.(error as Error);
    }
  }, [user, queryClient]);
}

/**
 * Optimistic message sending
 * Shows message immediately, then syncs with server
 */
export function useOptimisticMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (
    conversationId: string,
    content: string,
    onSuccess?: (message: any) => void,
    onError?: (error: Error) => void
  ) => {
    if (!user) return;

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    // Immediately add to UI
    // setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      // setMessages(prev => {
      //   const filtered = prev.filter(m => m.id !== optimisticMessage.id);
      //   return [...filtered, data];
      // });

      onSuccess?.(data);
    } catch (error) {
      // Remove optimistic message on error
      // setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      onError?.(error as Error);
    }
  }, [user, queryClient]);
}

/**
 * Optimistic post creation
 * Shows post immediately, then syncs with server
 */
export function useOptimisticPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (
    postData: {
      title: string;
      content?: string;
      course_id?: string;
      is_anonymous: boolean;
      type: 'text' | 'poll' | 'youtube';
    },
    onSuccess?: (post: any) => void,
    onError?: (error: Error) => void
  ) => {
    if (!user) return;

    // Create optimistic post
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      author_id: user.id,
      ...postData,
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      _optimistic: true,
    };

    // Immediately add to UI (prepend to posts list)
    // setPosts(prev => [optimisticPost, ...prev]);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic post with real one
      // setPosts(prev => {
      //   const filtered = prev.filter(p => p.id !== optimisticPost.id);
      //   return [data, ...filtered];
      // });

      onSuccess?.(data);
    } catch (error) {
      // Remove optimistic post on error
      // setPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
      onError?.(error as Error);
    }
  }, [user, queryClient]);
}

