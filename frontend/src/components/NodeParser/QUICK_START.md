# NodeParser Component - Quick Reference

## Installation

```bash
npm install reactflow
```

## Basic Usage

```javascript
import { NodeParser } from './components/NodeParser';

function App() {
  const [graphData, setGraphData] = useState({
    componentInstances: [],
    connections: []
  });

  return (
    <NodeParser
      graphData={graphData}
      onConnectionsChange={(newConnections) => {
        setGraphData(prev => ({ ...prev, connections: newConnections }));
      }}
      onNodesChange={(nodes, newInst, deletedIds, isPosUpdate) => {
        // Handle node changes
      }}
      componentsDatabase={components}
    />
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Delete** or **Backspace** | Delete selected nodes/connections |
| **Ctrl + Drag over connection** | Delete connection (Grasshopper-style) |
| **Shift + Click** | Multi-select nodes |
| **Mouse wheel** | Zoom in/out |
| **Click + Drag** | Pan canvas |

## Props

```typescript
NodeParser({
  graphData: {
    componentInstances: ComponentInstance[],
    connections: Connection[]
  },
  onConnectionsChange?: (connections: Connection[]) => void,
  onNodesChange?: (
    nodes: Node[] | null,
    newInstance: ComponentInstance | null,
    deletedIds: string[] | null,
    isPositionUpdate: boolean
  ) => void,
  componentsDatabase?: Component[]
})
```

## Data Types

### ComponentInstance
```javascript
{
  instanceId: "1",
  position: { x: 100, y: 100 },
  component: {
    Guid: "unique-id",
    Name: "Component Name",
    Nickname: "Nick",
    Category: "Math",
    SubCategory: "Operators",
    Inputs: [{ Name: "A", Nickname: "A", TypeName: "Number" }],
    Outputs: [{ Name: "R", Nickname: "R", TypeName: "Number" }]
  }
}
```

### Connection
```javascript
{
  sourceNodeId: "node-1",
  sourceHandleIndex: 0,
  targetNodeId: "node-2",
  targetHandleIndex: 0
}
```

## Common Tasks

### Export Graph
```javascript
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
```javascript
const importGraph = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    setGraphData(data);
  };
  reader.readAsText(file);
};
```

### Load Component Database
```javascript
useEffect(() => {
  fetch('/gh_components v0.json')
    .then(res => res.json())
    .then(data => setComponents(data.Components));
}, []);
```

## Styling

Override CSS classes:
- `.node-parser-container` - Main container
- `.grasshopper-node` - Individual nodes
- `.component-search` - Search bar

## Files Structure

```
components/NodeParser/
├── index.js                # Import from here
├── NodeParser.js           # Main component
├── GrasshopperNode.js      # Node rendering
├── ComponentSearch.js      # Search UI
├── *.css                   # Styles
├── README.md               # Full docs
└── examples/               # Usage examples
```

## Tips

✅ **Do:**
- Keep component database in `public/` folder
- Handle all three node change types (add/delete/move)
- Persist positions on export
- Use functional updates for state

❌ **Don't:**
- Mutate graphData directly
- Forget to handle position updates
- Block the UI during large imports

## Need Help?

- 📖 [Full Documentation](README.md)
- 💡 [Examples](examples/)
- 🔧 [Contributing Guide](../../../CONTRIBUTING.md)
