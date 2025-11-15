import React, { useState, useEffect } from 'react';
import { NodeParser } from '../components/NodeParser';
import { POSITION_SCALE_FACTOR } from '../utils/nodeParser';
import exampleData from '../data/exampleGraph.json';
import exampleDataInteractive from '../data/exampleGraphInteractive.json';
import testScript1 from '../data/Test-Script-1.json';
import './NodeParserDemo.css';

/**
 * Demo page for the NodeParser component with real GH component structure
 */
const NodeParserDemo = () => {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(testScript1, null, 2));
  const [currentData, setCurrentData] = useState(testScript1);
  const [parseError, setParseError] = useState(null);
  const [connections, setConnections] = useState(testScript1.links || []);
  const [componentsDatabase, setComponentsDatabase] = useState([]);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);

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
            setJsonInput(fileContent);
            setCurrentData(parsed);
            setConnections(parsed.connections || []);
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
    setJsonInput(JSON.stringify(testScript1, null, 2));
    setCurrentData(testScript1);
    setConnections(testScript1.links || []);
    setParseError(null);
  };

  const handleLoadVanillaExample = () => {
    setJsonInput(JSON.stringify(exampleData, null, 2));
    setCurrentData(exampleData);
    setConnections(exampleData.connections || []);
    setParseError(null);
  };
  
  const handleLoadInteractiveExample = () => {
    setJsonInput(JSON.stringify(exampleDataInteractive, null, 2));
    setCurrentData(exampleDataInteractive);
    setConnections(exampleDataInteractive.connections || []);
    setParseError(null);
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setCurrentData(parsed);
      // Handle both formats: old format has "connections", new format has "links"
      setConnections(parsed.connections || parsed.links || []);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message);
    }
  };

  const handleClear = () => {
    const emptyData = { nodes: [], links: [] };
    setJsonInput(JSON.stringify(emptyData, null, 2));
    setCurrentData(emptyData);
    setConnections([]);
    setParseError(null);
  };

  const handleConnectionsChange = (newConnections) => {
    setConnections(newConnections);
    
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
    
    // Update current data with new connections to keep them in sync
    const updatedData = isSimplifiedFormat
      ? {
          ...currentData,
          links: formattedConnections
        }
      : {
          ...currentData,
          connections: newConnections
        };
    
    setCurrentData(updatedData);
    setJsonInput(JSON.stringify(updatedData, null, 2));
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
        
        const updatedData = {
          nodes: updatedNodes,
          links: currentData.links || []
        };
        setCurrentData(updatedData);
        setJsonInput(JSON.stringify(updatedData, null, 2));
      } else {
        const updatedInstances = currentData.componentInstances?.filter(
          inst => !deletedNodeIds.includes(`node-${inst.instanceId}`)
        ) || [];
        
        const updatedData = {
          componentInstances: updatedInstances,
          connections: connections
        };
        setCurrentData(updatedData);
        setJsonInput(JSON.stringify(updatedData, null, 2));
      }
      return;
    }
    
    // If a new component instance is being added
    if (newComponentInstance) {
      if (isSimplifiedFormat) {
        // Convert newComponentInstance to simplified format
        const reactFlowNode = newNodes?.find(n => n.id === `node-${newComponentInstance.instanceId}`);
        
        if (reactFlowNode) {
          const newSimplifiedNode = {
            id: newComponentInstance.instanceId,
            guid: reactFlowNode.data.guid,
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
          const updatedData = {
            nodes: updatedNodes,
            links: currentData.links || []
          };
          setCurrentData(updatedData);
          setJsonInput(JSON.stringify(updatedData, null, 2));
        }
      } else {
        const updatedInstances = [...(currentData.componentInstances || []), newComponentInstance];
        const updatedData = {
          componentInstances: updatedInstances,
          connections: connections
        };
        setCurrentData(updatedData);
        setJsonInput(JSON.stringify(updatedData, null, 2));
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
        
        const updatedData = {
          nodes: updatedNodes,
          links: currentData.links || []
        };
        setCurrentData(updatedData);
        setJsonInput(JSON.stringify(updatedData, null, 2));
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
        
        const updatedData = {
          componentInstances: updatedInstances,
          connections: connections
        };
        setCurrentData(updatedData);
        setJsonInput(JSON.stringify(updatedData, null, 2));
      }
      return;
    }
    
    // For other node movements/updates, don't trigger re-parse
    // This prevents the graph from re-parsing and losing edges
  };

  const handleExportConnections = () => {
    const connectionsJson = JSON.stringify(connections, null, 2);
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

  return (
    <div className="node-parser-demo">
      <div className="demo-sidebar">
        <h2>Grasshopper Node Parser</h2>
        <p className="demo-description">
          Load component instances from the GH database and visualize their connections.
          <br/>
          <strong>Create wire:</strong> Drag from output to input
          <br/>
          <strong>Delete wire:</strong> Ctrl+drag existing connection or select and press Delete
        </p>

        <div className="demo-controls">
          <button onClick={handleLoadFile} className="btn btn-secondary">
            📁 Load File
          </button>
          <button onClick={handleLoadExample} className="btn btn-example">
            Load Test Script 1 (Simplified)
          </button>
          <button onClick={handleLoadInteractiveExample} className="btn btn-example">
            Load Interactive Example (Old)
          </button>
          <button onClick={handleLoadVanillaExample} className="btn btn-example">
            Load Standard Example (Old)
          </button>
          <button onClick={handleParseJson} className="btn btn-primary">
            Parse & Render
          </button>
          <button onClick={handleClear} className="btn btn-tertiary">
            Clear
          </button>
          <button onClick={handleExportGraph} className="btn btn-export">
            💾 Export Graph
          </button>
          <button onClick={handleExportConnections} className="btn btn-export">
            Export Connections
          </button>
        </div>

        {parseError && (
          <div className="error-message">
            {parseError}
          </div>
        )}

        <div className="connections-info">
          <h3>Connections ({connections.length})</h3>
          <div className="connections-list">
            {connections.length === 0 ? (
              <p className="no-connections">No connections yet. Draw wires by dragging from outputs to inputs.</p>
            ) : (
              connections.map((conn, idx) => (
                <div key={idx} className="connection-item">
                  <span className="connection-text">
                    {conn.sourceNodeId}[{conn.sourceHandleIndex}] → {conn.targetNodeId}[{conn.targetHandleIndex}]
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="json-input-container">
          <label htmlFor="json-input">Graph JSON:</label>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your graph JSON here..."
            spellCheck="false"
          />
        </div>

        <div className="demo-info">
          <h3>Simplified Format (Test-Script-1.json):</h3>
          <pre>{`{
  "nodes": [
    {
      "id": "slider_x",
      "guid": "57da07bd-ecab-415d-9d86-af36d7073abc",
      "nickname": "X",
      "x": 40,
      "y": 40,
      "properties": {
        "Min": -10.0,
        "Max": 10.0,
        "Value": 2.0
      }
    }
  ],
  "links": [
    {
      "fromNode": "slider_x",
      "fromParam": "0",
      "toNode": "pt",
      "toParam": "X"
    }
  ]
}

// Old Format (for backward compatibility):
{
  "componentInstances": [...],
  "connections": [...]
}`}</pre>
        </div>
      </div>

      <div className="demo-canvas">
        {isLoadingDatabase && (
          <div className="loading-message">
            Loading components database ({componentsDatabase.length} loaded)...
          </div>
        )}
        {!isLoadingDatabase && componentsDatabase.length === 0 && (
          <div className="loading-message" style={{background: '#fff3cd', color: '#856404'}}>
            ⚠️ Components database not loaded. Search will not be available.
          </div>
        )}
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

export default NodeParserDemo;
