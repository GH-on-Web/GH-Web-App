import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { nanoid } from 'nanoid';

function HomePage() {
  const navigate = useNavigate();
  const [workspaceId, setWorkspaceId] = useState('');
  const [username, setUsername] = useState('');
  const [workspaceType, setWorkspaceType] = useState('graph-editor'); // 'graph-editor' or 'workspace3dm'

  const handleCreateWorkspace = () => {
    const newWorkspaceId = nanoid();
    const user = username || `User_${nanoid(6)}`;
    // Store username in localStorage
    localStorage.setItem('username', user);
    
    if (workspaceType === 'graph-editor') {
      navigate(`/node-parser/${newWorkspaceId}`);
    } else {
      navigate(`/workspace3dm/${newWorkspaceId}`);
    }
  };

  const handleJoinWorkspace = () => {
    if (!workspaceId.trim()) {
      alert('Please enter a workspace ID');
      return;
    }
    const user = username || `User_${nanoid(6)}`;
    localStorage.setItem('username', user);
    
    if (workspaceType === 'graph-editor') {
      navigate(`/node-parser/${workspaceId.trim()}`);
    } else {
      navigate(`/workspace3dm/${workspaceId.trim()}`);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Container sx={{ py: 4, maxWidth: '600px' }}>
        <Typography variant="h4" gutterBottom align="center">
          GH Web Workspace
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Collaborative Grasshopper in the Browser
        </Typography>

        <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Workspace Type
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which type of workspace to create or join
          </Typography>
          <ToggleButtonGroup
            value={workspaceType}
            exclusive
            onChange={(e, newType) => newType && setWorkspaceType(newType)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="graph-editor">
              Graph Editor
            </ToggleButton>
            <ToggleButton value="workspace3dm">
              Workspace 3DM
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create New Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start a new collaborative {workspaceType === 'graph-editor' ? 'graph editor' : '3D workspace'}
          </Typography>
          <TextField
            fullWidth
            label="Your Name (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleCreateWorkspace}
          >
            Create Workspace
          </Button>
        </Paper>

        <Divider>OR</Divider>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Join Existing Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a workspace ID to join
          </Typography>
          <TextField
            fullWidth
            label="Workspace ID"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Enter workspace ID"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Your Name (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleJoinWorkspace}
            disabled={!workspaceId.trim()}
          >
            Join Workspace
          </Button>
        </Paper>
      </Stack>
      </Container>
    </Box>
  );
}

export default HomePage;
