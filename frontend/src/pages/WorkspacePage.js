import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import useWorkspaceStore from '../store/workspaceStore';

function WorkspacePage() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore();

  return (
    <Container sx={{ py: 4, height: 'calc(100vh - 64px)' }} maxWidth={false}>
      <Typography variant="h4" gutterBottom>
        Workspace
      </Typography>
      <Box sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
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
    </Container>
  );
}

export default WorkspacePage;
