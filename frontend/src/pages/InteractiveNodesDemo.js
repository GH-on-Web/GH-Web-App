import React, { useState, useCallback } from 'react';
import { NodeParser } from '../components/NodeParser';
import { 
  createSliderNodeData, 
  createPanelNodeData,
  createBooleanToggleData,
  createButtonData,
  createNumberInputData
} from '../components/NodeParser/nodes';
import './InteractiveNodesDemo.css';

/**
 * Demo page for Interactive Node Components
 * Shows custom UI nodes like sliders, panels, toggles, etc.
 */
const InteractiveNodesDemo = () => {
  const [graphData, setGraphData] = useState({
    componentInstances: [],
    connections: []
  });
  const [outputLog, setOutputLog] = useState([]);
  const nextId = React.useRef(1);

  // Handle value changes from interactive nodes
  const handleValueChange = useCallback((nodeId, value) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutputLog(prev => [
      { id: Date.now(), nodeId, value, timestamp },
      ...prev.slice(0, 9) // Keep last 10 entries
    ]);
  }, []);

  // Add a number slider
  const addSlider = useCallback(() => {
    const id = nextId.current++;
    const newNode = {
      instanceId: id.toString(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      component: {
        type: 'numberSlider',
        ...createSliderNodeData({
          nickname: `Slider ${id}`,
          min: 0,
          max: 100,
          step: 1,
          value: 50,
          onChange: handleValueChange
        })
      }
    };

    setGraphData(prev => ({
      ...prev,
      componentInstances: [...prev.componentInstances, newNode]
    }));
  }, [handleValueChange]);

  // Add a panel
  const addPanel = useCallback(() => {
    const id = nextId.current++;
    const newNode = {
      instanceId: id.toString(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      component: {
        type: 'panel',
        ...createPanelNodeData({
          nickname: `Panel ${id}`,
          text: 'Hello World!',
          isInput: false,
          onChange: handleValueChange
        })
      }
    };

    setGraphData(prev => ({
      ...prev,
      componentInstances: [...prev.componentInstances, newNode]
    }));
  }, [handleValueChange]);

  // Add a boolean toggle
  const addToggle = useCallback(() => {
    const id = nextId.current++;
    const newNode = {
      instanceId: id.toString(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      component: {
        type: 'booleanToggle',
        ...createBooleanToggleData({
          nickname: `Toggle ${id}`,
          value: false,
          onChange: handleValueChange
        })
      }
    };

    setGraphData(prev => ({
      ...prev,
      componentInstances: [...prev.componentInstances, newNode]
    }));
  }, [handleValueChange]);

  // Add a button
  const addButton = useCallback(() => {
    const id = nextId.current++;
    const newNode = {
      instanceId: id.toString(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      component: {
        type: 'button',
        ...createButtonData({
          nickname: `Button ${id}`,
          onClick: (nodeId) => handleValueChange(nodeId, 'clicked')
        })
      }
    };

    setGraphData(prev => ({
      ...prev,
      componentInstances: [...prev.componentInstances, newNode]
    }));
  }, [handleValueChange]);

  // Add a number input
  const addNumberInput = useCallback(() => {
    const id = nextId.current++;
    const newNode = {
      instanceId: id.toString(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      component: {
        type: 'numberInput',
        ...createNumberInputData({
          nickname: `Number ${id}`,
          value: 0,
          onChange: handleValueChange
        })
      }
    };

    setGraphData(prev => ({
      ...prev,
      componentInstances: [...prev.componentInstances, newNode]
    }));
  }, [handleValueChange]);

  // Handle connection changes
  const handleConnectionsChange = useCallback((newConnections) => {
    setGraphData(prev => ({
      ...prev,
      connections: newConnections
    }));
  }, []);

  // Handle node changes
  const handleNodesChange = useCallback((newNodes, newInstance, deletedIds, isPositionUpdate) => {
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
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    if (window.confirm('Clear all nodes?')) {
      setGraphData({ componentInstances: [], connections: [] });
      setOutputLog([]);
    }
  }, []);

  return (
    <div className="interactive-demo">
      <div className="demo-sidebar">
        <h2>Interactive Nodes</h2>
        <p className="demo-description">
          Custom UI components for Grasshopper-style inputs
        </p>

        <div className="component-buttons">
          <h3>Add Components:</h3>
          <button onClick={addSlider} className="btn btn-slider">
            <span className="btn-icon">━━○━━</span>
            Number Slider
          </button>
          <button onClick={addNumberInput} className="btn btn-number">
            <span className="btn-icon">123</span>
            Number Input
          </button>
          <button onClick={addPanel} className="btn btn-panel">
            <span className="btn-icon">📝</span>
            Panel
          </button>
          <button onClick={addToggle} className="btn btn-toggle">
            <span className="btn-icon">⚡</span>
            Boolean Toggle
          </button>
          <button onClick={addButton} className="btn btn-button">
            <span className="btn-icon">▶</span>
            Button
          </button>
        </div>

        <div className="demo-controls">
          <button onClick={handleClear} className="btn btn-clear">
            🗑️ Clear All
          </button>
        </div>

        <div className="output-log">
          <h3>Value Changes:</h3>
          <div className="log-container">
            {outputLog.length === 0 ? (
              <p className="log-empty">No changes yet. Interact with nodes to see output.</p>
            ) : (
              outputLog.map(entry => (
                <div key={entry.id} className="log-entry">
                  <span className="log-time">{entry.timestamp}</span>
                  <span className="log-node">Node-{entry.nodeId}</span>
                  <span className="log-value">{JSON.stringify(entry.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="demo-info">
          <h3>Features:</h3>
          <ul>
            <li>🎚️ <strong>Slider:</strong> Drag or double-click value</li>
            <li>📝 <strong>Panel:</strong> Double-click to edit text</li>
            <li>⚡ <strong>Toggle:</strong> Click to switch true/false</li>
            <li>▶ <strong>Button:</strong> Click to trigger action</li>
            <li>🔢 <strong>Number:</strong> Arrow keys to increment</li>
          </ul>
        </div>

        <div className="stats">
          <h3>Statistics:</h3>
          <div className="stat-item">
            <span className="stat-label">Nodes:</span>
            <span className="stat-value">{graphData.componentInstances.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Connections:</span>
            <span className="stat-value">{graphData.connections.length}</span>
          </div>
        </div>
      </div>

      <div className="demo-canvas">
        <NodeParser
          graphData={graphData}
          onConnectionsChange={handleConnectionsChange}
          onNodesChange={handleNodesChange}
          componentsDatabase={[]}
        />
      </div>
    </div>
  );
};

export default InteractiveNodesDemo;
