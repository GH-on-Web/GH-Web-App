# Contributing Guide - NodeParser Component

This guide explains how to merge the NodeParser component from the `node-parser` branch into `main`.

## Overview

The NodeParser component is a self-contained, reusable system for visualizing and editing Grasshopper component graphs. It has been developed on the `node-parser` branch and is ready for integration into the main branch.

## What's Included

### Component Files
```
frontend/src/components/NodeParser/
├── NodeParser.js              # Main canvas component
├── NodeParser.css             # Canvas styling
├── GrasshopperNode.js         # Node component
├── GrasshopperNode.css        # Node styling
├── ComponentSearch.js         # Search functionality
├── ComponentSearch.css        # Search styling
├── index.js                   # Easy imports
├── README.md                  # Full documentation
└── examples/
    ├── BasicExample.js        # Basic usage
    └── ImportExportExample.js # With I/O features
```

### Utility Files
```
frontend/src/utils/
├── nodeParser.js              # Graph parsing utilities
└── connectionManager.js       # Connection state management
```

### Data Files
```
frontend/src/data/
├── exampleGraph.json          # Sample graph data
└── exampleGrasshopperGraph.json

frontend/public/
├── gh_components v0.json      # Component database
└── gh_components_native.json  # Alternative database
```

### Demo Page
```
frontend/src/pages/
├── NodeParserDemo.js          # Full-featured demo
└── NodeParserDemo.css
```

## Dependencies

The NodeParser component requires:
- **React** 18+ (already in project)
- **reactflow** 11.11.4 (needs to be in package.json)

Check `frontend/package.json` to ensure reactflow is listed.

## Integration Steps

### Option 1: Merge the Entire Branch

```bash
# Switch to main
git checkout main

# Merge node-parser branch
git merge node-parser

# Resolve any conflicts (likely in App.js for routes)
# Build and test
cd frontend
npm install
npm start
```

### Option 2: Cherry-Pick the Component

If you only want the NodeParser component without other changes:

```bash
# From main branch
git checkout main

# Copy the component folder
git checkout node-parser -- frontend/src/components/NodeParser
git checkout node-parser -- frontend/src/utils/nodeParser.js
git checkout node-parser -- frontend/src/utils/connectionManager.js
git checkout node-parser -- frontend/src/data/exampleGraph.json
git checkout node-parser -- frontend/public/gh_components\ v0.json

# Commit
git commit -m "Add NodeParser component from node-parser branch"
```

## Usage in Other Projects

To use NodeParser in other parts of the application:

### Simple Import
```javascript
import { NodeParser } from './components/NodeParser';

<NodeParser
  graphData={graphData}
  onConnectionsChange={handleConnectionsChange}
  onNodesChange={handleNodesChange}
  componentsDatabase={components}
/>
```

### With All Utilities
```javascript
import { 
  NodeParser,
  GrasshopperNode,
  ComponentSearch,
  parseGrasshopperGraph,
  ConnectionManager
} from './components/NodeParser';
```

## API Reference

### NodeParser Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `graphData` | object | Yes | Graph data with componentInstances and connections |
| `onConnectionsChange` | function | No | Callback when connections change |
| `onNodesChange` | function | No | Callback when nodes change |
| `componentsDatabase` | array | No | Array of available components |

### Graph Data Structure

```typescript
{
  componentInstances: [
    {
      instanceId: string,
      position: { x: number, y: number },
      component: {
        Guid: string,
        Name: string,
        Nickname: string,
        Category: string,
        SubCategory: string,
        Inputs: Array<Input>,
        Outputs: Array<Output>
      }
    }
  ],
  connections: [
    {
      sourceNodeId: string,
      sourceHandleIndex: number,
      targetNodeId: string,
      targetHandleIndex: number
    }
  ]
}
```

## Handling Callbacks

### onNodesChange Callback
```javascript
const handleNodesChange = (newNodes, newInstance, deletedIds, isPositionUpdate) => {
  if (deletedIds) {
    // Handle deletion: remove nodes with IDs in deletedIds array
  } else if (newInstance) {
    // Handle addition: add newInstance to componentInstances
  } else if (isPositionUpdate) {
    // Handle movement: update positions from newNodes array
  }
};
```

### onConnectionsChange Callback
```javascript
const handleConnectionsChange = (newConnections) => {
  // Update connections array in graph data
  setGraphData(prev => ({
    ...prev,
    connections: newConnections
  }));
};
```

## Testing After Integration

1. **Start the dev server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Visit the demo page:**
   ```
   http://localhost:3000/node-parser
   ```

3. **Test key features:**
   - [ ] Components load in search bar
   - [ ] Can add components to canvas
   - [ ] Can drag nodes around
   - [ ] Can create connections
   - [ ] Can delete nodes (Delete/Backspace)
   - [ ] Can delete connections (Ctrl+drag or select+Delete)
   - [ ] Can export graph
   - [ ] Can import graph
   - [ ] Positions persist after moving nodes

## Potential Conflicts

When merging, you may encounter conflicts in:

### App.js
The node-parser branch adds a route:
```javascript
import NodeParserDemo from './pages/NodeParserDemo';

<Route path="/node-parser" element={<NodeParserDemo />} />
```

**Resolution:** Keep both routes or adjust as needed for your routing structure.

### package.json
Ensure reactflow dependency is included:
```json
"dependencies": {
  "reactflow": "^11.11.4"
}
```

## File Organization

The component is organized for easy reuse:

- **Self-contained:** All NodeParser files are in one folder
- **Clear exports:** index.js provides clean import paths
- **Documented:** README.md explains all functionality
- **Examples:** Working examples show integration patterns
- **No side effects:** Doesn't modify global state or other components

## Questions?

Check the documentation:
- [NodeParser README](../frontend/src/components/NodeParser/README.md)
- [Basic Example](../frontend/src/components/NodeParser/examples/BasicExample.js)
- [Import/Export Example](../frontend/src/components/NodeParser/examples/ImportExportExample.js)

## Contact

For questions about the NodeParser implementation, refer to the commit history on the `node-parser` branch.
