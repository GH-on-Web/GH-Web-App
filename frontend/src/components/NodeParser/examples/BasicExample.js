import React, { useState, useEffect } from 'react';
import { NodeParser } from '../components/NodeParser';

/**
 * Example: Basic NodeParser Usage
 * 
 * This example shows how to integrate the NodeParser component
 * with minimal setup.
 */
const BasicExample = () => {
  const [graphData, setGraphData] = useState({
    componentInstances: [],
    connections: []
  });
  const [components, setComponents] = useState([]);

  // Load component database
  useEffect(() => {
    fetch('/gh_components v0.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.Components) {
          setComponents(data.Components);
        }
      })
      .catch(err => console.error('Failed to load components:', err));
  }, []);

  // Handle connection changes
  const handleConnectionsChange = (newConnections) => {
    setGraphData(prev => ({
      ...prev,
      connections: newConnections
    }));
  };

  // Handle node changes (additions, deletions, position updates)
  const handleNodesChange = (newNodes, newInstance, deletedIds, isPositionUpdate) => {
    if (deletedIds && deletedIds.length > 0) {
      // Handle node deletion
      setGraphData(prev => ({
        ...prev,
        componentInstances: prev.componentInstances.filter(
          inst => !deletedIds.includes(`node-${inst.instanceId}`)
        )
      }));
    } else if (newInstance) {
      // Handle new node addition
      setGraphData(prev => ({
        ...prev,
        componentInstances: [...prev.componentInstances, newInstance]
      }));
    } else if (isPositionUpdate && newNodes) {
      // Handle position updates
      setGraphData(prev => ({
        ...prev,
        componentInstances: prev.componentInstances.map(inst => {
          const node = newNodes.find(n => n.id === `node-${inst.instanceId}`);
          return node ? { ...inst, position: node.position } : inst;
        })
      }));
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <NodeParser
        graphData={graphData}
        onConnectionsChange={handleConnectionsChange}
        onNodesChange={handleNodesChange}
        componentsDatabase={components}
      />
    </div>
  );
};

export default BasicExample;
