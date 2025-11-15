import React from 'react';
import { Box } from '@mui/material';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import useWorkspaceStore from '../store/workspaceStore';

function WorkspacePage() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore();

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
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
  );
}

export default WorkspacePage;
