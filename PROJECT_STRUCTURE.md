# Project Structure

## Frontend Structure

```
frontend/src/
├── components/
│   ├── Canvas/
│   │   └── FlowCanvas.jsx          # Main React Flow canvas component
│   ├── Layout/
│   │   └── AppLayout.jsx            # Main layout with Drawer sidebar
│   ├── nodes/
│   │   ├── PointNode.jsx            # Point node component (X, Y, Z inputs)
│   │   ├── CircleNode.jsx           # Circle node component (Center, Radius)
│   │   ├── NumberNode.jsx           # Number node component
│   │   └── index.js                 # Node exports
│   ├── Sidebar/
│   │   ├── ComponentLibrary.jsx     # Draggable component library
│   │   └── ParameterPanel.jsx      # Parameter editing panel
│   └── Viewer3D/
│       └── ThreeViewer.jsx          # Three.js 3D geometry viewer
│
├── hooks/
│   └── useCompute.js                # Compute state management hook
│
├── services/
│   ├── computeAPI.js                # Backend API communication
│   └── graphConverter.js            # Graph serialization/conversion
│
├── types/
│   ├── nodes.js                     # Node type definitions and constants
│   └── graph.js                     # Graph data structure definitions
│
├── pages/
│   ├── HomePage.js                  # Home page
│   ├── WorkspacePage.js             # Main workspace page
│   └── DocumentationPage.js         # Documentation page
│
├── store/
│   └── workspaceStore.js            # Zustand store for workspace state
│
└── App.js                           # Main app component with routing
```

## Component Responsibilities

### Canvas Components
- **FlowCanvas.jsx**: Wraps React Flow with controls, minimap, and background

### Layout Components
- **AppLayout.jsx**: Provides Drawer-based layout structure (Sidebar | Canvas | Viewer)

### Node Components
- **PointNode.jsx**: Creates 3D points with X, Y, Z inputs
- **CircleNode.jsx**: Creates circles from center point and radius
- **NumberNode.jsx**: Provides number values

### Sidebar Components
- **ComponentLibrary.jsx**: List of draggable components to add to canvas
- **ParameterPanel.jsx**: Dynamic form for editing selected node parameters

### Viewer Components
- **ThreeViewer.jsx**: Renders 3D geometry using Three.js

### Services
- **computeAPI.js**: Handles HTTP requests to backend compute server
- **graphConverter.js**: Converts between React Flow format and backend JSON format

### Hooks
- **useCompute.js**: Manages compute state (loading, geometry, errors)

### Types
- **nodes.js**: Node type constants and categories
- **graph.js**: JSDoc type definitions for graph structures

## Backend Structure (To Be Created)

```
backend/
├── app.py                           # Flask server
├── compute/
│   ├── executor.py                  # Execute geometry operations
│   └── converter.py                 # JSON → Python/Rhino script
└── requirements.txt                 # Python dependencies
```

## Next Steps

1. ✅ Project structure created
2. ⏳ Install missing dependencies (axios, three.js)
3. ⏳ Implement ComponentLibrary with drag-and-drop
4. ⏳ Update WorkspacePage to use new components
5. ⏳ Wire up custom node types to React Flow
6. ⏳ Build backend structure

