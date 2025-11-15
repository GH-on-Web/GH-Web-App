import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useWorkspaceStore from '../store/workspaceStore';
import useThemeStore from '../store/themeStore';

function WorkspacePage() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore();
  const { mode } = useThemeStore();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Determine the colorMode for ReactFlow
  const colorMode = mode === 'system'
    ? (prefersDarkMode ? 'dark' : 'light')
    : mode;

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
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
