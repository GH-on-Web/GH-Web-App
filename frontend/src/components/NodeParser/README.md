# Node Parser Component

A reusable React component system for visualizing and editing Grasshopper component graphs using React Flow.

## Overview

The Node Parser provides a visual interface for working with Grasshopper components, allowing users to:
- Visualize component instances and their connections
- Add components from a searchable database
- Create and delete connections between nodes
- Export graph data as JSON
- Import graph data from files

## Components

### Core Components

#### `NodeParser`
The main canvas component that handles the graph visualization and interaction.

**Props:**
- `graphData` (object): Graph data containing componentInstances and connections
- `onConnectionsChange` (function): Callback when connections are modified
- `onNodesChange` (function): Callback when nodes are added, removed, or moved
- `componentsDatabase` (array): Array of available components for search

**Example:**
```jsx
import NodeParser from './components/NodeParser';

<NodeParser
  graphData={graphData}
  onConnectionsChange={handleConnectionsChange}
  onNodesChange={handleNodesChange}
  componentsDatabase={components}
/>
```

#### `GrasshopperNode`
Custom React Flow node component that renders individual Grasshopper components.

**Features:**
- Displays component nickname and category
- Shows input/output handles
- Tooltips for handle information
- Custom styling

#### `ComponentSearch`
Search bar component for finding and adding components to the canvas.

**Props:**
- `componentsDatabase` (array): Array of components to search through
- `onComponentSelect` (function): Callback when a component is selected

**Example:**
```jsx
import ComponentSearch from './components/ComponentSearch';

<ComponentSearch
  componentsDatabase={components}
  onComponentSelect={handleAddComponent}
/>
```

### Utility Modules

#### `nodeParser.js`
Parsing utilities for converting between Grasshopper data and React Flow format.

**Functions:**
- `parseGrasshopperComponent(component, instanceId, position)` - Parse single component
- `parseComponentInstances(instances)` - Parse array of component instances
- `parseConnections(connections)` - Parse connection data to React Flow edges
- `parseGrasshopperGraph(graphData)` - Parse complete graph
- `loadComponentsDatabase(jsonData)` - Load and validate component database

#### `connectionManager.js`
Connection management utilities for handling node connections separately.

**Classes:**
- `ConnectionManager` - Manages connections independently from nodes
  - `addConnection(connection)` - Add a new connection
  - `removeConnection(sourceNodeId, sourceHandleIndex, targetNodeId, targetHandleIndex)` - Remove connection
  - `removeNodeConnections(nodeId)` - Remove all connections for a node
  - `getAllConnections()` - Get all connections
  - `importConnections(connections)` - Import connection array
  - `exportConnections()` - Export connections as JSON

## Data Structures

### Component Database
```json
{
  "Components": [
    {
      "Guid": "unique-identifier",
      "Name": "Component Name",
      "Nickname": "Nick",
      "Category": "Category",
      "SubCategory": "SubCategory",
      "Inputs": [
        {
          "Name": "Input Name",
          "Nickname": "I",
          "Description": "Input description",
          "TypeName": "Number"
        }
      ],
      "Outputs": [
        {
          "Name": "Output Name",
          "Nickname": "O",
          "Description": "Output description",
          "TypeName": "Number"
        }
      ]
    }
  ]
}
```

### Graph Data
```json
{
  "componentInstances": [
    {
      "instanceId": "1",
      "position": { "x": 100, "y": 100 },
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
}
```

## Installation

1. Install required dependencies:
```bash
npm install reactflow
```

2. Copy the following files to your project:
```
src/
├── components/
│   ├── NodeParser.js
│   ├── NodeParser.css
│   ├── GrasshopperNode.js
│   ├── GrasshopperNode.css
│   ├── ComponentSearch.js
│   └── ComponentSearch.css
└── utils/
    ├── nodeParser.js
    └── connectionManager.js
```

## Usage

### Basic Implementation

```jsx
import React, { useState } from 'react';
import NodeParser from './components/NodeParser';

function MyApp() {
  const [graphData, setGraphData] = useState({
    componentInstances: [],
    connections: []
  });
  const [components, setComponents] = useState([]);

  // Load component database
  React.useEffect(() => {
    fetch('/path/to/components.json')
      .then(res => res.json())
      .then(data => setComponents(data.Components));
  }, []);

  const handleConnectionsChange = (newConnections) => {
    setGraphData({
      ...graphData,
      connections: newConnections
    });
  };

  const handleNodesChange = (newNodes, newInstance, deletedIds, isPositionUpdate) => {
    // Handle node additions, deletions, and position updates
    if (deletedIds) {
      // Remove deleted nodes
      const updated = graphData.componentInstances.filter(
        inst => !deletedIds.includes(`node-${inst.instanceId}`)
      );
      setGraphData({ ...graphData, componentInstances: updated });
    } else if (newInstance) {
      // Add new instance
      setGraphData({
        ...graphData,
        componentInstances: [...graphData.componentInstances, newInstance]
      });
    } else if (isPositionUpdate && newNodes) {
      // Update positions
      const updated = graphData.componentInstances.map(inst => {
        const node = newNodes.find(n => n.id === `node-${inst.instanceId}`);
        return node ? { ...inst, position: node.position } : inst;
      });
      setGraphData({ ...graphData, componentInstances: updated });
    }
  };

  return (
    <NodeParser
      graphData={graphData}
      onConnectionsChange={handleConnectionsChange}
      onNodesChange={handleNodesChange}
      componentsDatabase={components}
    />
  );
}
```

### Export Graph

```jsx
const exportGraph = () => {
  const json = JSON.stringify(graphData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'graph.json';
  a.click();
  URL.revokeObjectURL(url);
};
```

### Import Graph

```jsx
const importGraph = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    setGraphData(data);
  };
  reader.readAsText(file);
};
```

## Features

### Keyboard Shortcuts
- **Delete/Backspace**: Delete selected nodes or connections
- **Ctrl + Drag**: Delete connection (Grasshopper-style)
- **Shift + Click**: Multi-select nodes

### Mouse Interactions
- **Drag nodes**: Move components around the canvas
- **Drag from output to input**: Create connections
- **Click connection + Delete**: Remove connection
- **Ctrl + Drag over connection**: Remove connection

## Customization

### Styling
Modify the CSS files to customize appearance:
- `NodeParser.css` - Canvas and layout styling
- `GrasshopperNode.css` - Node component styling
- `ComponentSearch.css` - Search bar styling

### Node Types
Extend `GrasshopperNode` or create new node types:

```jsx
const CustomNode = ({ data }) => {
  return (
    <div className="custom-node">
      {/* Custom node implementation */}
    </div>
  );
};

// In NodeParser.js
const nodeTypes = useMemo(() => ({
  grasshopperNode: GrasshopperNode,
  customNode: CustomNode
}), []);
```

## Dependencies

- React 18+
- React Flow 11.11.4+

## License

MIT
