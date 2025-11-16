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
import { 
  parseGrasshopperGraph, 
  parseGrasshopperComponent,
  parseSimplifiedGraph 
} from '../../utils/nodeParser';
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
  
  console.log('createInteractiveNode - GUID:', guid, 'Mapped Type:', nodeType);
  
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
        let parsedNodes, parsedEdges;
        
        // Detect format: simplified format has "nodes" and "links"
        // Old format has "componentInstances" and "connections"
        if (graphData.nodes && graphData.links) {
          // Use simplified parser
          const result = parseSimplifiedGraph(graphData, componentsDatabase || []);
          parsedNodes = result.nodes;
          parsedEdges = result.edges;
          console.log('[NodeParser] parseSimplifiedGraph returned:', parsedNodes.length, 'nodes and', parsedEdges.length, 'edges');
        } else {
          // Use old parser for backward compatibility
          const result = parseGrasshopperGraph(graphData);
          parsedNodes = result.nodes;
          parsedEdges = result.edges;
        }
        
        // Update nodes if this is initial load, node count changed, or database just loaded
        const nodesChanged = parsedNodes.length !== nodes.length;
        const hasDatabase = componentsDatabase && componentsDatabase.length > 0;
        
        if (!isInitialized.current || nodesChanged || (hasDatabase && parsedNodes.length > 0)) {
          // Preserve selection state when updating nodes
          setNodes((currentNodes) => {
            const selectedNodeIds = currentNodes.filter(n => n.selected).map(n => n.id);
            return parsedNodes.map(node => ({
              ...node,
              selected: selectedNodeIds.includes(node.id)
            }));
          });
          
          // Only mark as initialized if we have the database loaded (for simplified format)
          // or if we're using the old format
          if (!graphData.nodes || hasDatabase) {
            isInitialized.current = true;
          }
        }
        
        // Update edges if this is initial load, edge count changed, or database just loaded
        const edgesChanged = parsedEdges.length !== edges.length;
        
        if (!isInitialized.current || edgesChanged || (hasDatabase && parsedEdges.length > 0 && edges.length === 0)) {
          console.log('[NodeParser] Setting edges - current:', edges.length, 'new:', parsedEdges.length);
          console.log('[NodeParser] Edges being set:', parsedEdges.map(e => `${e.source}->${e.target}`));
          setEdges(parsedEdges);
        } else {
          console.log('[NodeParser] Skipping edge update - isInitialized:', isInitialized.current, 'edgesChanged:', edgesChanged, 'current:', edges.length, 'parsed:', parsedEdges.length);
        }
        
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
  }, [graphData, setNodes, setEdges, nodes.length, edges.length, componentsDatabase]);

  // Handle connection creation or deletion (Ctrl+drag deletes existing connection)
  const onConnect = useCallback(
    (params) => {
      // Check if Ctrl key is pressed - if so, delete the connection instead
      if (isCtrlPressed.current) {
        // Find and remove existing connection
        setEdges((eds) => {
          console.log('Ctrl+drag detected, looking for edge to delete');
          console.log('Available edges:', eds.length);
          console.log('Looking for:', params);
          
          // Try to find exact match first
          let existingEdge = eds.find(
            edge => 
              edge.source === params.source &&
              edge.sourceHandle === params.sourceHandle &&
              edge.target === params.target &&
              edge.targetHandle === params.targetHandle
          );
          
          // If not found, try reverse direction (in case user drags backwards)
          if (!existingEdge) {
            existingEdge = eds.find(
              edge => 
                edge.target === params.source &&
                edge.targetHandle === params.sourceHandle &&
                edge.source === params.target &&
                edge.sourceHandle === params.targetHandle
            );
          }
          
          if (existingEdge) {
            console.log('Found edge to delete:', existingEdge.id);
            const updatedEdges = eds.filter(e => e.id !== existingEdge.id);
            
            // Notify parent component with updated edges
            if (onConnectionsChange) {
              const connections = updatedEdges.map(edge => ({
                sourceNodeId: edge.source,
                sourceHandle: edge.sourceHandle,
                targetNodeId: edge.target,
                targetHandle: edge.targetHandle
              }));
              onConnectionsChange(connections);
            }
            
            return updatedEdges;
          } else {
            console.log('No matching edge found to delete');
          }
          return eds;
        });
      } else {
        // Normal connection creation
        const newEdge = { 
          ...params, 
          type: 'default', 
          selectable: true,
          deletable: true,
          style: { stroke: '#b1b1b7', strokeWidth: 2 } 
        };
        setEdges((eds) => {
          const updatedEdges = addEdge(newEdge, eds);
          
          // Notify parent component with updated edges
          if (onConnectionsChange) {
            // Convert edges to connection format for parent
            const connections = updatedEdges.map(edge => ({
              sourceNodeId: edge.source,
              sourceHandle: edge.sourceHandle,
              targetNodeId: edge.target,
              targetHandle: edge.targetHandle
            }));
            onConnectionsChange(connections);
          }
          
          return updatedEdges;
        });
      }
    },
    [setEdges, onConnectionsChange]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      setEdges((eds) => {
        const remainingEdges = eds.filter(
          edge => !edgesToDelete.some(del => del.id === edge.id)
        );
        
        // Notify parent component with updated edges
        if (onConnectionsChange) {
          const connections = remainingEdges.map(edge => ({
            sourceNodeId: edge.source,
            sourceHandle: edge.sourceHandle,
            targetNodeId: edge.target,
            targetHandle: edge.targetHandle
          }));
          onConnectionsChange(connections);
        }
        
        return remainingEdges;
      });
    },
    [onConnectionsChange, setEdges]
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
      console.log('Component selected:', component);
      
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
            guid: component.Guid,  // Preserve GUID for saving
            type: interactiveNode.type,
            ...interactiveNode.data
          }
        };
        console.log('Adding interactive node:', interactiveNode.type, 'at position:', position);
      } else {
        // Use standard Grasshopper node
        newNode = parseGrasshopperComponent(component, instanceId, position);
        console.log('Created standard node:', newNode);
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
        minZoom={0.05}
        maxZoom={4}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => '#1a192b'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="react-flow__minimap"
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
