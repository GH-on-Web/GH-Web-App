import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Paper,
  Avatar,
  Collapse,
} from '@mui/material';
import {
  Close,
  Comment,
  Send,
  Reply,
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useComments } from '../../hooks/useComments';
import { useSelf } from '@liveblocks/react';

/**
 * CommentsPanel - Side panel for displaying and managing comments/threads
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the panel is open
 * @param {Function} props.onClose - Callback when panel closes
 * @param {string} props.targetId - Optional target ID to filter comments (e.g., node ID)
 */
export function CommentsPanel({ open, onClose, targetId = null }) {
  const {
    comments,
    createComment,
    deleteComment,
    addReply,
    toggleResolve,
  } = useComments();
  const self = useSelf();
  
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());

  // Filter comments if targetId is provided
  const filteredComments = targetId
    ? comments.filter(c => c.targetId === targetId)
    : comments;

  // Sort: unresolved first, then by creation date
  const sortedComments = [...filteredComments].sort((a, b) => {
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleCreateComment = () => {
    if (!newCommentText.trim()) return;
    
    createComment({
      text: newCommentText,
      targetId: targetId,
      position: null, // Could add position tracking for canvas comments
    });
    
    setNewCommentText('');
  };

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;
    
    addReply(commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
    
    // Expand the comment to show the reply
    setExpandedComments(prev => new Set(prev).add(commentId));
  };

  const toggleCommentExpand = (commentId) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const canDeleteComment = (comment) => {
    return comment.createdByConnectionId === self?.connectionId;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Comment fontSize="small" />
            Comments
            {sortedComments.length > 0 && (
              <Chip label={sortedComments.length} size="small" />
            )}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Comment input */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleCreateComment();
              }
            }}
            size="small"
          />
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Send />}
              onClick={handleCreateComment}
              disabled={!newCommentText.trim()}
            >
              Comment
            </Button>
          </Box>
        </Box>

        {/* Comments list */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {sortedComments.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No comments yet. Start a conversation!
              </Typography>
            </Box>
          ) : (
            <List>
              {sortedComments.map((comment) => {
                const isExpanded = expandedComments.has(comment.id);
                const hasReplies = comment.replies && comment.replies.length > 0;
                
                return (
                  <React.Fragment key={comment.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        opacity: comment.resolved ? 0.6 : 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                          {comment.createdBy.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" component="span">
                              {comment.createdBy}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                            {comment.resolved && (
                              <Chip
                                label="Resolved"
                                size="small"
                                color="success"
                                icon={<CheckCircle />}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {comment.text}
                          </Typography>
                          
                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              size="small"
                              startIcon={<Reply />}
                              onClick={() => {
                                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                if (replyingTo !== comment.id) {
                                  setExpandedComments(prev => new Set(prev).add(comment.id));
                                }
                              }}
                            >
                              Reply
                            </Button>
                            <Button
                              size="small"
                              startIcon={comment.resolved ? <Cancel /> : <CheckCircle />}
                              onClick={() => toggleResolve(comment.id)}
                            >
                              {comment.resolved ? 'Unresolve' : 'Resolve'}
                            </Button>
                            {canDeleteComment(comment) && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => deleteComment(comment.id)}
                              >
                                Delete
                              </Button>
                            )}
                            {hasReplies && (
                              <Button
                                size="small"
                                onClick={() => toggleCommentExpand(comment.id)}
                                endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                              >
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                              </Button>
                            )}
                          </Box>

                          {/* Reply input */}
                          {replyingTo === comment.id && (
                            <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyText.trim()}
                                >
                                  Reply
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* Replies */}
                          {hasReplies && (
                            <Collapse in={isExpanded}>
                              <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
                                {comment.replies.map((reply) => (
                                  <Box key={reply.id} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main', fontSize: '0.75rem' }}>
                                        {reply.createdBy.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Typography variant="subtitle2" component="span" sx={{ fontSize: '0.875rem' }}>
                                        {reply.createdBy}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        {new Date(reply.createdAt).toLocaleString()}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ pl: 4 }}>
                                      {reply.text}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Collapse>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

