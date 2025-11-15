import React, { useState, useEffect } from 'react';
import NodeParser from '../components/NodeParser';
import exampleData from '../data/exampleGraph.json';
import './NodeParserDemo.css';

/**
 * Demo page for the NodeParser component with real GH component structure
 */
const NodeParserDemo = () => {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(exampleData, null, 2));
  const [currentData, setCurrentData] = useState(exampleData);
  const [parseError, setParseError] = useState(null);
  const [connections, setConnections] = useState(exampleData.connections || []);
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
    setJsonInput(JSON.stringify(exampleData, null, 2));
    setCurrentData(exampleData);
    setConnections(exampleData.connections || []);
    setParseError(null);
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setCurrentData(parsed);
      setConnections(parsed.connections || []);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message);
    }
  };

  const handleClear = () => {
    const emptyData = { componentInstances: [], connections: [] };
    setJsonInput(JSON.stringify(emptyData, null, 2));
    setCurrentData(emptyData);
    setConnections([]);
    setParseError(null);
  };

  const handleConnectionsChange = (newConnections) => {
    setConnections(newConnections);
    // Update current data with new connections to keep them in sync
    const updatedData = {
      ...currentData,
      connections: newConnections
    };
    setCurrentData(updatedData);
    setJsonInput(JSON.stringify(updatedData, null, 2));
  };

  const handleNodesChange = (newNodes, newComponentInstance, deletedNodeIds, isPositionUpdate) => {
    // If nodes are being deleted
    if (deletedNodeIds && deletedNodeIds.length > 0) {
      const updatedInstances = currentData.componentInstances?.filter(
        inst => !deletedNodeIds.includes(`node-${inst.instanceId}`)
      ) || [];
      
      const updatedData = {
        componentInstances: updatedInstances,
        connections: connections
      };
      setCurrentData(updatedData);
      setJsonInput(JSON.stringify(updatedData, null, 2));
      return;
    }
    
    // If a new component instance is being added
    if (newComponentInstance) {
      const updatedInstances = [...(currentData.componentInstances || []), newComponentInstance];
      const updatedData = {
        componentInstances: updatedInstances,
        connections: connections
      };
      setCurrentData(updatedData);
      setJsonInput(JSON.stringify(updatedData, null, 2));
      return;
    }
    
    // If this is a position update (node drag), update positions without triggering re-parse
    if (isPositionUpdate && newNodes) {
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
            Load Example
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
          <h3>Structure:</h3>
          <pre>{`{
  "componentInstances": [
    {
      "instanceId": "1",
      "position": {"x": 100, "y": 100},
      "component": {
        "Guid": "...",
        "Name": "Component Name",
        "Nickname": "Nick",
        "Category": "Category",
        "SubCategory": "SubCategory",
        "Inputs": [...],
        "Outputs": [...]
      }
    }
  ],
  "connections": [
    {
      "sourceNodeId": "node-1",
      "sourceHandleIndex": 0,
      "targetNodeId": "node-2",
      "targetHandleIndex": 0
    }
  ]
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
