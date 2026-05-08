# Grasshopper Node Parser

A React-based node parser that visualizes Grasshopper components using React Flow. Updated to work with the actual GH Components database structure with **separate connection management**.

## Features

- **Real GH Component Support**: Works with actual Grasshopper component database structure
- **Separate Connection Management**: Connections are handled independently from component definitions
- **Component Instances**: Multiple instances of the same component can be placed
- **Interactive Canvas**: Drag, zoom, and connect nodes
- **Real-time Parsing**: Edit JSON and see changes instantly
- **Connection Export**: Export connections separately for storage
- **Component Search**: Search components by name or GUID
- **Category Filtering**: Browse components by category and subcategory

## Database Structure

The parser works with the GH components database that has this structure:

```json
{
  "ExportedAt": "2025-11-15T18:40:57.8569443Z",
  "ComponentCount": 2868,
  "Components": [
    {
      "Guid": "unique-guid",
      "Name": "Component Name",
      "Nickname": "Nick",
      "Category": "Category",
      "SubCategory": "SubCategory",
      "Inputs": [
        {
          "Name": "Input Name",
          "Nickname": "I",
          "Description": "Input description",
          "TypeName": "Number",
          "DotNetType": "Grasshopper.Kernel.Parameters.Param_Number"
        }
      ],
      "Outputs": [
        {
          "Name": "Output Name",
          "Nickname": "O",
          "Description": "Output description",
          "TypeName": "Number",
          "DotNetType": "Grasshopper.Kernel.Parameters.Param_Number"
        }
      ]
    }
  ]
}
```

## Graph Format

### Component Instances

To create a graph, you define component instances (not the components themselves):

```json
{
  "componentInstances": [
    {
      "instanceId": "1",
      "position": { "x": 100, "y": 100 },
      "component": {
        // Full component object from database
        "Guid": "...",
        "Name": "...",
        "Inputs": [...],
        "Outputs": [...]
      }
    }
  ],
  "connections": [
    // Connections array (see below)
  ]
}
```

### Connections (Separate Management)

Connections are managed separately and reference node instances by ID:

```json
{
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

**Connection Properties:**
- `sourceNodeId`: ID of the source node instance (e.g., "node-1")
- `sourceHandleIndex`: Index of the output handle (0-based)
- `targetNodeId`: ID of the target node instance
- `targetHandleIndex`: Index of the input handle (0-based)

## Usage

### Basic Usage

```javascript
import NodeParser from './components/NodeParser';
import { loadComponentsDatabase } from './utils/nodeParser';

// Load the components database
const database = loadComponentsDatabase(ghComponentsJson);

// Create your graph
const graphData = {
  componentInstances: [
    {
      instanceId: "1",
      position: { x: 100, y: 100 },
      component: database.findByGuid("component-guid")
    }
  ],
  connections: []
};

// Render
<NodeParser 
  graphData={graphData} 
  onConnectionsChange={(connections) => {
    console.log('Connections updated:', connections);
  }}
/>
```

### Connection Manager

The `ConnectionManager` class handles connection operations:

```javascript
import { ConnectionManager } from './utils/connectionManager';

const manager = new ConnectionManager();

// Add connection
manager.addConnection({
  sourceNodeId: "node-1",
  sourceHandleIndex: 0,
  targetNodeId: "node-2",
  targetHandleIndex: 0
});

// Get all connections
const connections = manager.getAllConnections();

// Export/Import
const json = manager.exportToJSON();
manager.importFromJSON(json);

// Remove node connections
manager.removeNodeConnections("node-1");
```

## Components

### NodeParser
Main component that renders the React Flow canvas with connection management.

**Props:**
- `graphData`: Object with `componentInstances` and `connections`
- `onConnectionsChange`: Callback when connections change

### GrasshopperNode
Custom node component that displays:
- Component nickname/name
- Category and subcategory
- Input handles with nicknames and tooltips
- Output handles with nicknames and tooltips

### Utilities

#### nodeParser.js
- `parseGrasshopperComponent()` - Parse single component instance
- `parseComponentInstances()` - Parse array of instances
- `parseConnections()` - Parse connections to React Flow edges
- `parseGrasshopperGraph()` - Main parser
- `loadComponentsDatabase()` - Load and process component database
- `findComponentByGuid()` - Find component by GUID
- `searchComponentsByName()` - Search components

#### connectionManager.js
- `ConnectionManager` class - Manages connections
- `createConnection()` - Create connection object
- `validateConnection()` - Validate connection compatibility
- `convertReactFlowConnection()` - Convert React Flow events

## Why Separate Connections?

1. **Component Reusability**: The same component definition can be used in multiple instances
2. **Clean Separation**: Component library (read-only) vs. graph state (editable)
3. **Easy Export**: Connections can be exported/saved independently
4. **Performance**: Only connection data needs to be updated during editing
5. **Flexibility**: Different connection schemas can be used with the same components

## Demo Features

The demo page (`/node-parser`) includes:
- Example graph with real GH components
- JSON editor for graph data
- Live connection counter
- Connection export button
- Interactive node placement and wiring
- Real-time connection updates

## Files Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── NodeParser.js          (Main canvas with connection hooks)
│   │   ├── NodeParser.css
│   │   ├── GrasshopperNode.js     (Node display component)
│   │   └── GrasshopperNode.css
│   ├── utils/
│   │   ├── nodeParser.js          (Component parsing)
│   │   └── connectionManager.js   (Connection management)
│   ├── pages/
│   │   ├── NodeParserDemo.js
│   │   └── NodeParserDemo.css
│   └── data/
│       └── exampleGraph.json      (Example with real components)
```

## Interactive Features

- **Pan**: Click and drag canvas
- **Zoom**: Mouse wheel or pinch
- **Select**: Click nodes or connections
- **Connect**: Drag from output (right) to input (left)
- **Delete**: Select and press Delete key
- **Controls**: Zoom/fit controls panel
- **MiniMap**: Overview of entire graph

## Integration with Database

To load components from your database file:

```javascript
import ghDatabase from './gh components/gh_components v0.json';
import { loadComponentsDatabase } from './utils/nodeParser';

const db = loadComponentsDatabase(ghDatabase);

// Search for components
const additionComponents = db.searchByName('addition');
const specificComponent = db.findByGuid('guid-here');

// Browse by category
const categories = db.getCategories();
const mathComponents = db.filterByCategory('Maths');
```
