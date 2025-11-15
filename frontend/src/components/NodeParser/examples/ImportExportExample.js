import React, { useState, useEffect } from 'react';
import { NodeParser } from '../components/NodeParser';

/**
 * Example: NodeParser with Import/Export
 * 
 * This example shows how to add file import/export functionality
 * to save and load graph data.
 */
const ImportExportExample = () => {
  const [graphData, setGraphData] = useState({
    componentInstances: [],
    connections: []
  });
  const [components, setComponents] = useState([]);

  useEffect(() => {
    fetch('/gh_components v0.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.Components) {
          setComponents(data.Components);
        }
      });
  }, []);

  const handleConnectionsChange = (newConnections) => {
    setGraphData(prev => ({
      ...prev,
      connections: newConnections
    }));
  };

  const handleNodesChange = (newNodes, newInstance, deletedIds, isPositionUpdate) => {
    if (deletedIds && deletedIds.length > 0) {
      setGraphData(prev => ({
        ...prev,
        componentInstances: prev.componentInstances.filter(
          inst => !deletedIds.includes(`node-${inst.instanceId}`)
        )
      }));
    } else if (newInstance) {
      setGraphData(prev => ({
        ...prev,
        componentInstances: [...prev.componentInstances, newInstance]
      }));
    } else if (isPositionUpdate && newNodes) {
      setGraphData(prev => ({
        ...prev,
        componentInstances: prev.componentInstances.map(inst => {
          const node = newNodes.find(n => n.id === `node-${inst.instanceId}`);
          return node ? { ...inst, position: node.position } : inst;
        })
      }));
    }
  };

  // Export graph to JSON file
  const handleExport = () => {
    const json = JSON.stringify(graphData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grasshopper-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import graph from JSON file
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            setGraphData(data);
          } catch (err) {
            console.error('Failed to parse JSON:', err);
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  // Clear graph
  const handleClear = () => {
    if (window.confirm('Clear all nodes and connections?')) {
      setGraphData({
        componentInstances: [],
        connections: []
      });
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '10px', 
        background: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '10px'
      }}>
        <button onClick={handleImport} style={buttonStyle}>
          📁 Import
        </button>
        <button onClick={handleExport} style={buttonStyle}>
          💾 Export
        </button>
        <button onClick={handleClear} style={{ ...buttonStyle, background: '#ff6b6b', color: 'white' }}>
          🗑️ Clear
        </button>
        <div style={{ marginLeft: 'auto', padding: '8px' }}>
          Nodes: {graphData.componentInstances.length} | Connections: {graphData.connections.length}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <NodeParser
          graphData={graphData}
          onConnectionsChange={handleConnectionsChange}
          onNodesChange={handleNodesChange}
          componentsDatabase={components}
        />
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '8px 16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: 'white',
  cursor: 'pointer',
  fontSize: '14px'
};

export default ImportExportExample;
