import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { RoomProvider } from '@liveblocks/react';
import { NodeParser } from '../components/NodeParser';
import { useGraphCollaboration } from '../hooks/useCollaboration';
import CollaborationStatus from '../components/Collaboration/CollaborationStatus';
import { POSITION_SCALE_FACTOR } from '../utils/nodeParser';
import exampleData from '../data/exampleGraph.json';
import exampleDataInteractive from '../data/exampleGraphInteractive.json';
import testScript1 from '../data/Test-Script-1.json';
import './NodeParserDemo.css';

/**
 * Inner component that uses Liveblocks room for real-time collaboration
 */
const NodeParserDemoContent = ({ roomId }) => {
  const theme = useTheme();
  
  // Collaboration mode toggle
  const [isCollabMode, setIsCollabMode] = useState(false);
  
  // Use Liveblocks for collaborative state
  const {
    graphData: currentData,
    updateGraphData,
    updateGraphNodes,
    updateGraphLinks,
    isConnected,
    others
  } = useGraphCollaboration();
  
  const [jsonInput, setJsonInput] = useState(JSON.stringify(currentData, null, 2));
  const [parseError, setParseError] = useState(null);
  const [componentsDatabase, setComponentsDatabase] = useState([]);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);

  // Sync JSON input when currentData changes from Liveblocks
  useEffect(() => {
    setJsonInput(JSON.stringify(currentData, null, 2));
  }, [currentData]);

  // Load the components database
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch('/gh_components_native.json');
        if (response.ok) {
          const data = await response.json();
          if (data && data.Components) {
            setComponentsDatabase(data.Components);
            console.log(`Loaded ${data.Components.length} components from database`);
          } else {
            console.error('No components found in database');
          }
        } else {
          console.error('Failed to fetch database:', response.statusText);
        }
        setIsLoadingDatabase(false);
      } catch (error) {
        console.error('Failed to load components database:', error);
        setIsLoadingDatabase(false);
      }
    };
    
    loadDatabase();
  }, []);

  const handleLoadFile = () => {
    // Warn if others are connected and collab mode is active
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading a file will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const fileContent = event.target.result;
            const parsed = JSON.parse(fileContent);
            updateGraphData(parsed);
            setParseError(null);
          } catch (err) {
            setParseError('Failed to load file: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  const handleLoadExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(testScript1);
    setParseError(null);
  };

  const handleLoadVanillaExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(exampleData);
    setParseError(null);
  };
  
  const handleLoadInteractiveExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(exampleDataInteractive);
    setParseError(null);
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      updateGraphData(parsed);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message);
    }
  };

  const handleClear = () => {
    const emptyData = { nodes: [], links: [] };
    updateGraphData(emptyData);
    setParseError(null);
  };

  const handleConnectionsChange = (newConnections) => {
    // Detect format and update accordingly
    const isSimplifiedFormat = currentData.nodes && currentData.links;
    
    // Convert connections to the appropriate format
    let formattedConnections = newConnections;
    
    if (isSimplifiedFormat) {
      // Convert from React Flow edge format {sourceNodeId: "node-xyz", sourceHandle: "output-0", ...}
      // to simplified format {fromNode: "xyz", fromParam: "0", toNode: "abc", toParam: "A"}
      formattedConnections = newConnections.map(conn => {
        // Remove "node-" prefix from IDs
        const fromNode = conn.sourceNodeId?.replace(/^node-/, '');
        const toNode = conn.targetNodeId?.replace(/^node-/, '');
        
        // Extract param from handle ID (e.g., "output-0" -> "0", "input-A" -> "A")
        const fromParam = conn.sourceHandle?.replace(/^output-/, '') || "0";
        const toParam = conn.targetHandle?.replace(/^input-/, '') || "0";
        
        return {
          fromNode,
          fromParam,
          toNode,
          toParam
        };
      });
    }
    
    // Update links in Liveblocks
    updateGraphLinks(formattedConnections);
  };

  const handleNodesChange = (newNodes, newComponentInstance, deletedNodeIds, isPositionUpdate) => {
    // Detect format
    const isSimplifiedFormat = currentData.nodes && currentData.links;
    
    // If nodes are being deleted
    if (deletedNodeIds && deletedNodeIds.length > 0) {
      if (isSimplifiedFormat) {
        const updatedNodes = currentData.nodes?.filter(
          node => !deletedNodeIds.includes(`node-${node.id}`)
        ) || [];
        
        updateGraphNodes(updatedNodes);
      } else {
        const updatedInstances = currentData.componentInstances?.filter(
          inst => !deletedNodeIds.includes(`node-${inst.instanceId}`)
        ) || [];
        
        updateGraphData({
          componentInstances: updatedInstances,
          connections: currentData.links || currentData.connections || []
        });
      }
      return;
    }
    
    // If a new component instance is being added
    if (newComponentInstance) {
      if (isSimplifiedFormat) {
        // Convert newComponentInstance to simplified format
        const reactFlowNode = newNodes?.find(n => n.id === `node-${newComponentInstance.instanceId}`);
        
        if (reactFlowNode) {
          // Get GUID from component data or from the node data
          const guid = newComponentInstance.component?.guid || 
                       newComponentInstance.component?.Guid || 
                       reactFlowNode.data.guid;
          
          const newSimplifiedNode = {
            id: newComponentInstance.instanceId,
            guid: guid,
            nickname: reactFlowNode.data.nickname || reactFlowNode.data.name,
            x: newComponentInstance.position.x / POSITION_SCALE_FACTOR,
            y: newComponentInstance.position.y / POSITION_SCALE_FACTOR,
            properties: {}
          };
          
          // Add properties for interactive nodes
          if (reactFlowNode.type === 'numberSlider') {
            newSimplifiedNode.properties = {
              Min: reactFlowNode.data.min || 0,
              Max: reactFlowNode.data.max || 100,
              Step: reactFlowNode.data.step || 1,
              Value: reactFlowNode.data.value || 0
            };
          } else if (reactFlowNode.type === 'panel') {
            newSimplifiedNode.properties = {
              Text: reactFlowNode.data.text || '',
              IsInput: reactFlowNode.data.isInput || false
            };
          } else if (reactFlowNode.type === 'booleanToggle') {
            newSimplifiedNode.properties = {
              Value: reactFlowNode.data.value || false
            };
          } else if (reactFlowNode.type === 'numberInput') {
            newSimplifiedNode.properties = {
              Value: reactFlowNode.data.value || 0
            };
          }
          
          const updatedNodes = [...(currentData.nodes || []), newSimplifiedNode];
          updateGraphNodes(updatedNodes);
        }
      } else {
        const updatedInstances = [...(currentData.componentInstances || []), newComponentInstance];
        updateGraphData({
          componentInstances: updatedInstances,
          connections: currentData.links || currentData.connections || []
        });
      }
      return;
    }
    
    // If this is a position update (node drag), update positions without triggering re-parse
    if (isPositionUpdate && newNodes) {
      if (isSimplifiedFormat) {
        const updatedNodes = currentData.nodes?.map(node => {
          const reactFlowNode = newNodes.find(n => n.id === `node-${node.id}`);
          if (reactFlowNode && reactFlowNode.position) {
            return {
              ...node,
              x: reactFlowNode.position.x / POSITION_SCALE_FACTOR,
              y: reactFlowNode.position.y / POSITION_SCALE_FACTOR
            };
          }
          return node;
        }) || [];
        
        updateGraphNodes(updatedNodes);
      } else {
        const updatedInstances = currentData.componentInstances?.map(inst => {
          const node = newNodes.find(n => n.id === `node-${inst.instanceId}`);
          if (node && node.position) {
            return {
              ...inst,
              position: node.position
            };
          }
          return inst;
        }) || [];
        
        updateGraphData({
          componentInstances: updatedInstances,
          connections: currentData.links || currentData.connections || []
        });
      }
      return;
    }
    
    // For other node movements/updates, don't trigger re-parse
    // This prevents the graph from re-parsing and losing edges
  };

  const handleExportConnections = () => {
    const connectionsJson = JSON.stringify(currentData.links || currentData.connections || [], null, 2);
    // Create a downloadable file
    const blob = new Blob([connectionsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connections.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGraph = () => {
    const graphJson = JSON.stringify(currentData, null, 2);
    // Create a downloadable file
    const blob = new Blob([graphJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grasshopper-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    // Export current canvas graph (will be replaced with backend call later)
    handleExportGraph();
  };

  return (
    <div className="node-parser-demo" data-theme={theme.palette.mode}>
      {/* Collaboration toggle button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 102 }}>
        <button 
          onClick={() => setIsCollabMode(!isCollabMode)}
          className="btn"
          style={{
            backgroundColor: isCollabMode ? '#4caf50' : theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0',
            color: isCollabMode ? 'white' : theme.palette.mode === 'dark' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title={isCollabMode ? 'Stop collaboration mode' : 'Start collaboration mode'}
        >
          {isCollabMode ? '🛑 Stop Collab' : '🚀 Start Collab'}
        </button>
      </div>

      {/* Collaboration status indicator - only show in collab mode */}
      {isCollabMode && (
        <div style={{ position: 'absolute', top: '70px', left: '20px', zIndex: 101 }}>
          <CollaborationStatus workspaceId={roomId} />
        </div>
      )}
      
      {/* Floating action buttons */}
      <div className="demo-floating-controls">
        <button onClick={handleExportGraph} className="btn btn-save" title="Save graph as JSON file">
          💾 Save
        </button>
        <button onClick={handleLoadFile} className="btn btn-load" title="Load JSON file">
          📁 Load File
        </button>
        <button onClick={handleClear} className="btn btn-clear" title="Clear canvas">
          🗑️ Clear
        </button>
        <button onClick={handleRun} className="btn btn-run" title="Export and run (coming soon)">
          ▶ Run
        </button>
      </div>

      <div className="demo-canvas">
        {isLoadingDatabase ? (
          <div className="loading-message">
            Loading components database...
          </div>
        ) : componentsDatabase.length === 0 ? (
          <div className="loading-message" style={{background: '#fff3cd', color: '#856404'}}>
            ⚠️ Components database not loaded. Some features may not work correctly.
          </div>
        ) : null}
        <NodeParser 
          graphData={currentData} 
          onConnectionsChange={handleConnectionsChange}
          onNodesChange={handleNodesChange}
          componentsDatabase={componentsDatabase}
        />
      </div>
    </div>
  );
};

/**
 * Wrapper component that provides RoomProvider for collaboration
 * Note: LiveblocksProvider is in App.js, so RoomProvider can be used here
 */
const NodeParserDemo = () => {
  const { workspaceId } = useParams();
  const roomId = workspaceId || 'nodeparser-default';

  return (
    <RoomProvider 
      id={roomId}
      initialPresence={{}}
      initialStorage={{
        graphData: testScript1, // Initial data for new rooms
      }}
    >
      <NodeParserDemoContent roomId={roomId} />
    </RoomProvider>
  );
};

export default NodeParserDemo;
