import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { ReactFlow, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useWorkspaceStore from '../store/workspaceStore';
import useThemeStore from '../store/themeStore';
import useViewModeStore from '../store/viewModeStore';
import Scene3D from '../components/Scene3D';
import ViewModeToggle from '../components/ViewModeToggle';

function WorkspacePage() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore();
  const { mode: themeMode } = useThemeStore();
  const { mode: viewMode } = useViewModeStore();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Determine the colorMode for ReactFlow
  const colorMode = themeMode === 'system'
    ? (prefersDarkMode ? 'dark' : 'light')
    : themeMode;

  // Calculate opacity and pointer events based on view mode
  const graphOpacity = viewMode === 'graph' ? 1 : 0.3;
  const graphPointerEvents = viewMode === 'graph' ? 'auto' : 'none';

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: 'transparent' }}>
      {/* 3D Scene Layer (behind) */}
      <Scene3D />

      {/* React Flow Layer (in front) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: graphPointerEvents,
          backgroundColor: 'transparent',
          '& .react-flow__nodes, & .react-flow__edges': {
            opacity: graphOpacity,
            transition: 'opacity 0.3s ease-in-out',
          },
          '& .react-flow__viewport': {
            backgroundColor: 'transparent !important',
          },
          '& .react-flow__pane': {
            backgroundColor: 'transparent !important',
          },
          '& .react-flow__renderer': {
            backgroundColor: 'transparent !important',
          },
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          colorMode={colorMode}
          fitView
          nodesDraggable={viewMode === 'graph'}
          nodesConnectable={viewMode === 'graph'}
          elementsSelectable={viewMode === 'graph'}
        >
          <MiniMap />
          <Controls />
          <Background gap={12} size={1} style={{ opacity: 0.2 }} />
        </ReactFlow>
      </Box>

      {/* Mode Toggle (always interactive) */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 3,
          pointerEvents: 'auto',
        }}
      >
        <ViewModeToggle />
      </Box>
    </Box>
  );
}

export default WorkspacePage;
