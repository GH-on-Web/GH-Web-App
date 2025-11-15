import React, { useCallback, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import GrasshopperNode from './GrasshopperNode';
import ComponentSearch from './ComponentSearch';
import { 
  NumberSliderNode, 
  PanelNode, 
  BooleanToggleNode, 
  ButtonNode, 
  NumberInputNode 
} from './nodes';
import { 
  createSliderNodeData,
  createPanelNodeData,
  createBooleanToggleData,
  createButtonData,
  createNumberInputData
} from './nodes';
import { parseGrasshopperGraph, parseGrasshopperComponent } from '../../utils/nodeParser';
import { ConnectionManager, convertReactFlowConnection } from '../../utils/connectionManager';
import './NodeParser.css';

/**
 * Maps Grasshopper component GUIDs/Names to interactive node types
 */
const INTERACTIVE_NODE_MAPPING = {
  // Number Slider - GUID from Grasshopper
  '57da07bd-ecab-415d-9d86-af36d7073abc': 'numberSlider',
  // Panel
  '59e0b89a-e487-49f8-bab8-b5bab16be14c': 'panel',
  // Boolean Toggle
  '2e78987b-9dfb-42a2-8b76-3923ac8bd91a': 'booleanToggle',
  // Button
  'a8b97322-2d53-47cd-905e-b932c3ccd74e': 'button',
  // Number (primitive)
  '3e8ca6be-fda8-4aaf-b5c0-3c54c8bb7312': 'numberInput'
};

/**
 * Creates an interactive node based on component type
 */
const createInteractiveNode = (component, instanceId, position) => {
  const nodePosition = position || { x: 100, y: 100 };
  const nodeId = `node-${instanceId}`;
  
  let nodeData = {
    id: nodeId,
    nickname: component.Nickname || component.Name || 'Node'
  };
  
  const guid = component.Guid;
  const nodeType = INTERACTIVE_NODE_MAPPING[guid];
  
  switch (nodeType) {
    case 'numberSlider':
      return {
        id: nodeId,
        type: 'numberSlider',
        position: nodePosition,
        data: {
          ...createSliderNodeData({
            nickname: component.Nickname || 'Slider',
            min: 0,
            max: 100,
            step: 1,
            value: 50
          }),
          id: nodeId
        }
      };
      
    case 'panel':
      return {
        id: nodeId,
        type: 'panel',
        position: nodePosition,
        data: {
          ...createPanelNodeData({
            nickname: component.Nickname || 'Panel',
            text: '',
            isInput: false
          }),
          id: nodeId
        }
      };
      
    case 'booleanToggle':
      return {
        id: nodeId,
        type: 'booleanToggle',
        position: nodePosition,
        data: {
          ...createBooleanToggleData({
            nickname: component.Nickname || 'Toggle',
            value: false
          }),
          id: nodeId
        }
      };
      
    case 'button':
      return {
        id: nodeId,
        type: 'button',
        position: nodePosition,
        data: {
          ...createButtonData({
            nickname: component.Nickname || 'Button'
          }),
          id: nodeId
        }
      };
      
    case 'numberInput':
      return {
        id: nodeId,
        type: 'numberInput',
        position: nodePosition,
        data: {
          ...createNumberInputData({
            nickname: component.Nickname || 'Number',
            value: 0
          }),
          id: nodeId
        }
      };
      
    default:
      return null;
  }
};

/**
 * Main NodeParser component that renders Grasshopper components using React Flow
 * Now with separate connection management and component search
 */
const NodeParser = ({ graphData, onConnectionsChange, onNodesChange: onNodesChangeCallback, componentsDatabase }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState(null);
  const connectionManager = useRef(new ConnectionManager());
  const isCtrlPressed = useRef(false);
  const isInitialized = useRef(false);
  const nextInstanceId = useRef(1000); // Start from 1000 for new components

  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    grasshopperNode: GrasshopperNode,
    numberSlider: NumberSliderNode,
    panel: PanelNode,
    booleanToggle: BooleanToggleNode,
    button: ButtonNode,
    numberInput: NumberInputNode
  }), []);

  // Track Ctrl/Cmd key state
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        isCtrlPressed.current = true;
      }
    };

    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        isCtrlPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Parse graph data when it changes
  React.useEffect(() => {
    if (graphData) {
      try {
        const { nodes: parsedNodes, edges: parsedEdges } = parseGrasshopperGraph(graphData);
        
        // Only update nodes if this is initial load or if the node count changed
        const nodesChanged = parsedNodes.length !== nodes.length;
        
        if (!isInitialized.current || nodesChanged) {
          setNodes(parsedNodes);
          isInitialized.current = true;
        }
        
        // Always update edges to reflect connection changes
        setEdges(parsedEdges);
        
        // Update connection manager
        if (graphData.connections) {
          connectionManager.current.importConnections(graphData.connections);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error parsing graph data:', err);
        setError('Failed to parse graph data: ' + err.message);
      }
    }
  }, [graphData, setNodes, setEdges, nodes.length]);

  // Handle connection creation or deletion (Ctrl+drag deletes existing connection)
  const onConnect = useCallback(
    (params) => {
      // Check if Ctrl key is pressed - if so, delete the connection instead
      if (isCtrlPressed.current) {
        // Find and remove existing connection
        setEdges((eds) => {
          const existingEdge = eds.find(
            edge => 
              edge.source === params.source &&
              edge.sourceHandle === params.sourceHandle &&
              edge.target === params.target &&
              edge.targetHandle === params.targetHandle
          );
          
          if (existingEdge) {
            // Remove from connection manager
            const connection = convertReactFlowConnection(params);
            connectionManager.current.removeConnection(
              connection.sourceNodeId,
              connection.sourceHandleIndex,
              connection.targetNodeId,
              connection.targetHandleIndex
            );
            
            // Notify parent component
            if (onConnectionsChange) {
              onConnectionsChange(connectionManager.current.getAllConnections());
            }
            
            // Remove from edges
            return eds.filter(e => e.id !== existingEdge.id);
          }
          return eds;
        });
      } else {
        // Normal connection creation
        const newEdge = { ...params, type: 'smoothstep', style: { stroke: '#b1b1b7', strokeWidth: 2 } };
        setEdges((eds) => addEdge(newEdge, eds));
        
        // Add to connection manager
        const connection = convertReactFlowConnection(params);
        connectionManager.current.addConnection(connection);
        
        // Notify parent component
        if (onConnectionsChange) {
          onConnectionsChange(connectionManager.current.getAllConnections());
        }
      }
    },
    [setEdges, onConnectionsChange]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      edgesToDelete.forEach(edge => {
        const connection = convertReactFlowConnection(edge);
        connectionManager.current.removeConnection(
          connection.sourceNodeId,
          connection.sourceHandleIndex,
          connection.targetNodeId,
          connection.targetHandleIndex
        );
      });
      
      // Notify parent component
      if (onConnectionsChange) {
        onConnectionsChange(connectionManager.current.getAllConnections());
      }
    },
    [onConnectionsChange]
  );

  // Handle node deletion
  const handleNodesDelete = useCallback(
    (nodesToDelete) => {
      const deletedNodeIds = nodesToDelete.map(n => n.id);
      
      nodesToDelete.forEach(node => {
        connectionManager.current.removeNodeConnections(node.id);
      });
      
      // Notify parent component about connection changes
      if (onConnectionsChange) {
        onConnectionsChange(connectionManager.current.getAllConnections());
      }
      
      // Notify parent about node deletion with a special flag
      if (onNodesChangeCallback) {
        onNodesChangeCallback(null, null, deletedNodeIds);
      }
    },
    [onConnectionsChange, onNodesChangeCallback]
  );

  // Handle component selection from search
  const handleComponentSelect = useCallback(
    (component) => {
      const instanceId = nextInstanceId.current++;
      
      // Calculate center position of the viewport
      const centerX = window.innerWidth / 2 - 200; // Offset for sidebar
      const centerY = window.innerHeight / 2;
      const position = { x: centerX, y: centerY };
      
      // Check if this component should be an interactive node
      const interactiveNode = createInteractiveNode(component, instanceId, position);
      
      let newNode;
      let componentData;
      
      if (interactiveNode) {
        // Use interactive node
        newNode = interactiveNode;
        componentData = {
          instanceId: instanceId.toString(),
          position: position,
          component: {
            type: interactiveNode.type,
            ...interactiveNode.data
          }
        };
        console.log('Adding interactive node:', interactiveNode.type, 'at position:', position);
      } else {
        // Use standard Grasshopper node
        newNode = parseGrasshopperComponent(component, instanceId, position);
        componentData = {
          instanceId: instanceId.toString(),
          position: position,
          component: component
        };
        console.log('Adding standard component:', component.Name, 'at position:', position);
      }
      
      // Add to nodes using the functional update to get latest state
      setNodes((currentNodes) => {
        const updated = [...currentNodes, newNode];
        
        // Notify parent about node addition with the updated list
        if (onNodesChangeCallback) {
          // Pass the component data along with the node
          onNodesChangeCallback(updated, componentData);
        }
        
        return updated;
      });
    },
    [setNodes, onNodesChangeCallback]
  );

  // Handle node drag end to save position changes
  const onNodeDragStop = useCallback(
    (event, node) => {
      if (onNodesChangeCallback) {
        // Pass the updated node positions back to parent
        setNodes((currentNodes) => {
          onNodesChangeCallback(currentNodes, null, null, true); // 4th param indicates position update
          return currentNodes;
        });
      }
    },
    [onNodesChangeCallback, setNodes]
  );

  if (error) {
    return (
      <div className="node-parser-error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="node-parser-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={handleNodesDelete}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => '#1a192b'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      
      {/* Always show search bar, but it will be empty if no database */}
      <ComponentSearch 
        componentsDatabase={componentsDatabase || []}
        onComponentSelect={handleComponentSelect}
      />
    </div>
  );
};

export default NodeParser;
