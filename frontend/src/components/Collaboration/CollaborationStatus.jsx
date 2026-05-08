import React, { useState } from 'react';
import { useStatus, useOthers } from '@liveblocks/react';
import { Box, Typography, Chip, Popover, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { People, Circle, ContentCopy, Check } from '@mui/icons-material';
import UserPresence from './UserPresence';

/**
 * CollaborationStatus - Status bar showing connection and user count
 */
function CollaborationStatus({ workspaceId }) {
  const status = useStatus();
  const others = useOthers();
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCopiedSnackbar, setShowCopiedSnackbar] = useState(false);

  const isConnected = status === 'connected';
  const userCount = others.length + 1; // +1 for current user

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopyWorkspaceId = async () => {
    if (!workspaceId) return;
    
    try {
      await navigator.clipboard.writeText(workspaceId);
      setCopied(true);
      setShowCopiedSnackbar(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy workspace ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = workspaceId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setShowCopiedSnackbar(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Connection Status */}
        <Chip
          icon={<Circle sx={{ fontSize: 8, color: isConnected ? 'success.main' : 'error.main' }} />}
          label={isConnected ? 'Connected' : 'Disconnected'}
          size="small"
          color={isConnected ? 'success' : 'error'}
          variant="outlined"
        />

        {/* User Count */}
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <People fontSize="small" />
          <Typography variant="body2">{userCount}</Typography>
        </IconButton>

        {/* Workspace ID with Copy */}
        {workspaceId && (
          <Tooltip title={copied ? 'Copied!' : 'Click to copy workspace ID'}>
            <Chip
              icon={copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
              label={
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {workspaceId}
                </Typography>
              }
              onClick={handleCopyWorkspaceId}
              size="small"
              variant="outlined"
              sx={{
                cursor: 'pointer',
                maxWidth: '200px',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            />
          </Tooltip>
        )}

        {/* User List Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <UserPresence />
        </Popover>
      </Box>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={showCopiedSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowCopiedSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowCopiedSnackbar(false)}>
          Workspace ID copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
}

export default CollaborationStatus;

