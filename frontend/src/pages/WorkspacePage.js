import React from 'react';
import { Box, Container, Typography, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import useWorkspaceStore from '../store/workspaceStore';
import useScriptsStore from '../store/scriptsStore';

function WorkspacePage() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore();
  const { scripts, selectedScriptId, selectScript } = useScriptsStore();

  return (
    <Container sx={{ py: 4, height: 'calc(100vh - 64px)' }} maxWidth={false}>
      <Typography variant="h4" gutterBottom>
        Workspace
      </Typography>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: 16 }}>
              Grasshopper Scripts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files in <code>/public/gh-scripts</code>
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List dense>
              {scripts.map((script) => (
                <ListItemButton
                  key={script.id}
                  selected={script.id === selectedScriptId}
                  onClick={() => selectScript(script.id)}
                >
                  <ListItemText
                    primary={script.name}
                    secondary={script.fileName}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))}
              {scripts.length === 0 && (
                <ListItemText
                  sx={{ px: 2, py: 1.5 }}
                  primary="No scripts found"
                  secondary="Add .gh files under /public/gh-scripts"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              )}
            </List>
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </Box>
      </Box>
    </Container>
  );
}

export default WorkspacePage;
