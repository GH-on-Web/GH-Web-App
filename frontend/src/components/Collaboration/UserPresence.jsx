import React from 'react';
import { useOthers } from '@liveblocks/react';
import { Box, Typography, Chip, Avatar, Stack } from '@mui/material';

/**
 * UserPresence - Display list of other users in the workspace
 */
function UserPresence() {
  const others = useOthers();

  if (others.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No other users online
        </Typography>
      </Box>
    );
  }

  // Generate consistent color for each user
  const getUserColor = (connectionId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const index = connectionId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get username from presence or use connection ID
  const getUsername = (other) => {
    return other.presence?.username || `User ${other.connectionId.substring(0, 6)}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Online Users ({others.length})
      </Typography>
      <Stack spacing={1}>
        {others.map((other) => {
          const color = getUserColor(other.connectionId);
          const username = getUsername(other);
          
          return (
            <Chip
              key={other.connectionId}
              avatar={
                <Avatar sx={{ bgcolor: color, width: 24, height: 24 }}>
                  {username.charAt(0).toUpperCase()}
                </Avatar>
              }
              label={username}
              size="small"
              sx={{ justifyContent: 'flex-start' }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

export default UserPresence;

