import { useStorage, useMutation } from '@liveblocks/react';
import { nanoid } from 'nanoid';
import { useCallback } from 'react';

/**
 * useComments - Hook for managing comments and threads
 * Uses Liveblocks storage to persist comments
 * Must be used within a RoomProvider context
 * 
 * @returns {Object} Comments state and functions
 */
export function useComments() {
  // Get comments from storage
  const storageRoot = useStorage((root) => root);
  const comments = storageRoot?.comments ?? [];
  const threads = storageRoot?.threads ?? {};

  // Create a new comment
  const createComment = useMutation(({ storage, self }, commentData) => {
    if (!storage) {
      console.error('Storage not available');
      return null;
    }

    const connectionIdStr = self?.connectionId ? String(self.connectionId) : null;
    const comment = {
      id: nanoid(),
      ...commentData,
      createdAt: new Date().toISOString(),
      createdBy: self?.presence?.name || (connectionIdStr ? `User ${connectionIdStr.slice(0, 4)}` : 'Anonymous'),
      createdByConnectionId: self?.connectionId || null,
      replies: [],
      resolved: false,
    };

    const currentComments = storage.get('comments') || [];
    storage.set('comments', [...currentComments, comment]);
    
    return comment.id;
  }, []);

  // Update a comment
  const updateComment = useMutation(({ storage }, commentId, updates) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }

    const comments = storage.get('comments') || [];
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, ...updates, updatedAt: new Date().toISOString() }
        : comment
    );
    storage.set('comments', updatedComments);
  }, []);

  // Delete a comment
  const deleteComment = useMutation(({ storage }, commentId) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }

    const comments = storage.get('comments') || [];
    const filteredComments = comments.filter(comment => comment.id !== commentId);
    storage.set('comments', filteredComments);
  }, []);

  // Add a reply to a comment (creates a thread)
  const addReply = useMutation(({ storage, self }, commentId, replyText) => {
    if (!storage) {
      console.error('Storage not available');
      return null;
    }

    const connectionIdStr = self?.connectionId ? String(self.connectionId) : null;
    const reply = {
      id: nanoid(),
      text: replyText,
      createdAt: new Date().toISOString(),
      createdBy: self?.presence?.name || (connectionIdStr ? `User ${connectionIdStr.slice(0, 4)}` : 'Anonymous'),
      createdByConnectionId: self?.connectionId || null,
    };

    const comments = storage.get('comments') || [];
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...(comment.replies || []), reply] }
        : comment
    );
    storage.set('comments', updatedComments);
    
    return reply.id;
  }, []);

  // Resolve/unresolve a comment
  const toggleResolve = useMutation(({ storage }, commentId) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }

    const comments = storage.get('comments') || [];
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, resolved: !comment.resolved }
        : comment
    );
    storage.set('comments', updatedComments);
  }, []);

  // Get comments for a specific target (e.g., a node, position, etc.)
  const getCommentsForTarget = useCallback((targetId) => {
    return comments.filter(comment => comment.targetId === targetId);
  }, [comments]);

  return {
    comments: comments || [],
    threads: threads || {},
    createComment,
    updateComment,
    deleteComment,
    addReply,
    toggleResolve,
    getCommentsForTarget,
  };
}

