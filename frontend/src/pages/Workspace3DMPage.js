import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Toolbar, useMediaQuery } from '@mui/material';
import { RoomProvider } from '@liveblocks/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { nanoid } from 'nanoid';
import useWorkspaceStore from '../store/workspaceStore';
import useThemeStore from '../store/themeStore';
import AppLayout from '../components/Layout/AppLayout';
import FlowCanvas from '../components/Canvas/FlowCanvas';
import ComponentLibrary from '../components/Sidebar/ComponentLibrary';
import ThreeViewer from '../components/Viewer3D/ThreeViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import { PointNode, CircleNode, NumberNode } from '../components/nodes';
import { useCompute } from '../hooks/useCompute';
import { useCollaboration } from '../hooks/useCollaboration';
import CollaborationStatus from '../components/Collaboration/CollaborationStatus';

// Register custom node types
const nodeTypes = {
  point: PointNode,
  circle: CircleNode,
  number: NumberNode,
};

// Inner component that uses Liveblocks room
function Workspace3DMContent({ roomId }) {
  const { workspaceId } = useParams();
  const {
    selectedNode,
    setSelectedNode,
    addNode: addNodeToStore,
    deleteNodes,
  } = useWorkspaceStore();

  // Get theme mode for React Flow colorMode
  const { mode: themeMode } = useThemeStore();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const colorMode = themeMode === 'system'
    ? (prefersDarkMode ? 'dark' : 'light')
    : themeMode;

  // Get collaboration data from Liveblocks
  // Note: Must be called within RoomProvider context
  const {
    nodes: liveblocksNodes,
    edges: liveblocksEdges,
    updateNodes,
    updateEdges,
    isConnected,
    others,
  } = useCollaboration();

  // Use Liveblocks nodes/edges as source of truth
  // Ensure all nodes have the onChange handler attached (functions can't be serialized in Liveblocks)
  // Use a ref to always access the latest nodes
  const nodesRef = useRef(liveblocksNodes);
  useEffect(() => {
    nodesRef.current = liveblocksNodes;
  }, [liveblocksNodes]);

  const nodes = useMemo(() => {
    return liveblocksNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        // Attach onChange handler if it doesn't exist
        // Use nodesRef to always get the latest nodes
        onChange: node.data?.onChange || ((nodeId, inputKey, value) => {
          const currentNodes = nodesRef.current;
          const updatedNodes = currentNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    inputs: {
                      ...n.data.inputs,
                      [inputKey]: value,
                    },
                  },
                }
              : n
          );
          updateNodes(updatedNodes);
        }),
      },
    }));
  }, [liveblocksNodes, updateNodes]);
  
  const edges = liveblocksEdges;

  const { isComputing, geometry, compute } = useCompute(nodes, edges);
  const reactFlowInstance = useRef(null);

  // Sync React Flow changes to Liveblocks
  const onNodesChange = useCallback((changes) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    updateNodes(updatedNodes);
  }, [nodes, updateNodes]);

  const onEdgesChange = useCallback((changes) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    updateEdges(updatedEdges);
  }, [edges, updateEdges]);

  const onConnect = useCallback((connection) => {
    const updatedEdges = addEdge(connection, edges);
    updateEdges(updatedEdges);
  }, [edges, updateEdges]);

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
    
    // Create new node
    const newNode = {
      id: nanoid(),
      type: nodeType,
      position,
      data: {
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        inputs: getDefaultInputs(nodeType),
        onChange: (nodeId, inputKey, value) => {
          const updatedNodes = nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    inputs: {
                      ...node.data.inputs,
                      [inputKey]: value,
                    },
                  },
                }
              : node
          );
          updateNodes(updatedNodes);
        },
      },
    };
    
    // Add to Liveblocks storage
    updateNodes([...nodes, newNode]);
  }, [nodes, updateNodes]);

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
      console.error('Compute error in Workspace3DMPage:', error);
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
        // Remove nodes and connected edges
        const updatedNodes = nodes.filter((node) => !selectedNodeIds.includes(node.id));
        const updatedEdges = edges.filter(
          (edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        );
        updateNodes(updatedNodes);
        updateEdges(updatedEdges);
        setSelectedNode(null);
      }
    }
  }, [nodes, edges, updateNodes, updateEdges, setSelectedNode]);

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
              Workspace 3DM
            </Typography>
            <CollaborationStatus workspaceId={roomId} />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompute}
              disabled={isComputing || nodes.length === 0}
              sx={{ ml: 2 }}
            >
              {isComputing ? 'Computing...' : 'Compute'}
            </Button>
          </Toolbar>
          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
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
              colorMode={colorMode}
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

// Helper function to get default inputs for node types
function getDefaultInputs(type) {
  switch (type) {
    case 'point':
      return { x: 0, y: 0, z: 0 };
    case 'circle':
      return { radius: 1 };
    case 'number':
      return { value: 0 };
    default:
      return {};
  }
}

// Wrapper component that provides RoomProvider
// Note: LiveblocksProvider is now in App.js, so RoomProvider can be used here
function Workspace3DMPage() {
  const { workspaceId } = useParams();
  const roomId = workspaceId || 'workspace3dm-default';

  return (
    <ErrorBoundary>
      <RoomProvider id={roomId}>
        <Workspace3DMContent roomId={roomId} />
      </RoomProvider>
    </ErrorBoundary>
  );
}

export default Workspace3DMPage;