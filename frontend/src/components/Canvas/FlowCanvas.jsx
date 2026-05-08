import React from 'react';
import { Box } from '@mui/material';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './FlowCanvas.css';

/**
 * FlowCanvas - Main React Flow canvas component
 * Handles the node graph visualization and interaction
 */
function FlowCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onInit,
  colorMode,
}) {
  // Prevent node dragging if the drag starts from an input field
  const handleNodeDragStart = (event, node) => {
    const target = event.target;
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    const hasFocusedInput = nodeElement?.getAttribute('data-input-focused') === 'true';
    
    // Check if the drag is starting from an input field or Material-UI input
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.MuiInputBase-root') ||
      target.closest('.MuiInputBase-input') ||
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      hasFocusedInput
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  return (
    <Box 
      sx={{ width: '100%', height: '100%', position: 'relative' }}
      data-theme={colorMode}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        onNodeDragStart={handleNodeDragStart}
        colorMode={colorMode}
        fitView
        style={{ width: '100%', height: '100%' }}
        defaultEdgeOptions={{
          style: { strokeWidth: 3 },
          type: 'default',
        }}
      >
        <MiniMap 
          position="bottom-right"
          style={{
            bottom: 20,
            right: 20,
            zIndex: 4,
          }}
        />
        <Controls 
          position="bottom-left"
          showZoom={false}
          showInteractive={false}
          style={{
            bottom: 20,
            left: 20,
            zIndex: 4,
          }}
        />
        <Background />
      </ReactFlow>
    </Box>
  );
}

export default FlowCanvas;

