# GH-Web-App

AECTech 2025 - Grasshopper on the Web - lets gooo

## Features

### 🔷 Node Parser Component
A reusable React component system for visualizing and editing Grasshopper component graphs.

**Features:**
- Visual node-based graph editor using React Flow
- Search and add components from the Grasshopper database (2,868+ components)
- Create and delete connections between nodes
- Import/Export graph data as JSON
- Drag to reposition nodes with auto-save
- Keyboard shortcuts (Delete, Ctrl+drag)

**Quick Start:**
```javascript
import { NodeParser } from './components/NodeParser';

<NodeParser
  graphData={graphData}
  onConnectionsChange={handleConnectionsChange}
  onNodesChange={handleNodesChange}
  componentsDatabase={components}
/>
```

📖 [Full Documentation](frontend/src/components/NodeParser/README.md)  
💡 [Example Usage](frontend/src/components/NodeParser/examples/)

## Project Structure

```
GH-Web-App/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── NodeParser/          # Reusable node parser component
│   │   │       ├── NodeParser.js    # Main canvas component
│   │   │       ├── GrasshopperNode.js
│   │   │       ├── ComponentSearch.js
│   │   │       ├── examples/        # Usage examples
│   │   │       ├── README.md        # Full documentation
│   │   │       └── index.js         # Easy imports
│   │   ├── utils/
│   │   │   ├── nodeParser.js        # Parsing utilities
│   │   │   └── connectionManager.js # Connection management
│   │   ├── pages/
│   │   │   └── NodeParserDemo.js    # Demo page
│   │   └── data/
│   │       └── exampleGraph.json    # Sample data
│   └── public/
│       ├── gh_components v0.json    # Component database
│       └── gh_components_native.json
└── gh components/                   # Source component data
```

## Getting Started

### Installation

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000/node-parser` to see the demo.

### Using NodeParser in Your Project

1. Copy the NodeParser component folder:
```bash
cp -r frontend/src/components/NodeParser your-project/src/components/
cp -r frontend/src/utils your-project/src/
```

2. Install dependencies:
```bash
npm install reactflow
```

3. Import and use:
```javascript
import { NodeParser } from './components/NodeParser';
```

See [examples](frontend/src/components/NodeParser/examples/) for detailed usage patterns.

## Development

### Branch: `node-parser`
Contains the visual node editor implementation.

**Key Components:**
- `NodeParser` - Main canvas component with React Flow
- `GrasshopperNode` - Custom node rendering
- `ComponentSearch` - Component search/add functionality
- `nodeParser.js` - Data parsing utilities
- `connectionManager.js` - Connection state management

## Contributing

When merging to main:
1. The NodeParser component is self-contained in `frontend/src/components/NodeParser/`
2. All dependencies are clearly documented
3. Examples show integration patterns
4. No breaking changes to existing code

## License

MIT
