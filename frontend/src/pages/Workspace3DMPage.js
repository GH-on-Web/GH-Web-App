import React, { useCallback, useRef, useEffect } from 'react';
import { Box, Typography, Button, Toolbar } from '@mui/material';
import useWorkspaceStore from '../store/workspaceStore';
import AppLayout from '../components/Layout/AppLayout';
import FlowCanvas from '../components/Canvas/FlowCanvas';
import ComponentLibrary from '../components/Sidebar/ComponentLibrary';
import ThreeViewer from '../components/Viewer3D/ThreeViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import { PointNode, CircleNode, NumberNode } from '../components/nodes';
import { useCompute } from '../hooks/useCompute';

// Register custom node types
const nodeTypes = {
  point: PointNode,
  circle: CircleNode,
  number: NumberNode,
};

function Workspace3DMPage() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    deleteNodes,
  } = useWorkspaceStore();

  const { isComputing, geometry, compute } = useCompute(nodes, edges);
  const reactFlowInstance = useRef(null);

  // Handle node selection
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  // Handle adding node from component library
  const handleAddNode = useCallback((nodeType) => {
    // Place new node in center of viewport
    const position = reactFlowInstance.current
      ? reactFlowInstance.current.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: Math.random() * 400, y: Math.random() * 400 };
    addNode(nodeType, position);
  }, [addNode]);

  // Handle ReactFlow instance initialization
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handle compute button
  const handleCompute = useCallback(async () => {
    try {
      console.log('Compute button clicked');
      const result = await compute();
      console.log('Compute completed:', result);
    } catch (error) {
      console.error('Compute error in WorkspacePage:', error);
      alert(`Compute failed: ${error.message || 'Unknown error'}`);
    }
  }, [compute]);

  // Handle keyboard shortcuts (Delete/Backspace to delete nodes)
  const handleKeyDown = useCallback((event) => {
    // Only handle Delete/Backspace if not typing in an input
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      event.target.tagName !== 'INPUT' &&
      event.target.tagName !== 'TEXTAREA'
    ) {
      // Get selected nodes from React Flow
      const selectedNodeIds = nodes
        .filter((node) => node.selected)
        .map((node) => node.id);
      
      if (selectedNodeIds.length > 0) {
        event.preventDefault();
        deleteNodes(selectedNodeIds);
        setSelectedNode(null);
      }
    }
  }, [nodes, deleteNodes, setSelectedNode]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <AppLayout
      sidebar={
        <ComponentLibrary onAddNode={handleAddNode} />
      }
      main={
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '64px !important' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Workspace
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompute}
              disabled={isComputing || nodes.length === 0}
            >
              {isComputing ? 'Computing...' : 'Compute'}
            </Button>
          </Toolbar>
          <Box sx={{ flexGrow: 1, position: 'relative' }}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={() => setSelectedNode(null)}
              onInit={onInit}
            />
          </Box>
        </Box>
      }
      viewer={
        <ErrorBoundary>
          <ThreeViewer geometry={geometry} />
        </ErrorBoundary>
      }
      initialViewerWidth={500}
    />
     );
}

export default Workspace3DMPage;