# Grasshopper-for-Web Hackathon Project

## Project Overview
Building a web-based visual programming interface inspired by Grasshopper 3D for computational design. This is a 20-hour hackathon prototype demonstrating the core concept of browser-based parametric modeling.

## Core Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Web App       │────────▶│ Compute Server   │
│  (React Flow)   │◀────────│ (Python/Flask)   │
│  + MUI          │  JSON   │ + RhinoCompute   │
└─────────────────┘         └──────────────────┘
      │                              │
      ▼                              ▼
  Canvas UI                    3D Geometry
  + Controls                   Processing
```

## Tech Stack

### Frontend
- **React** (Vite for fast setup)
- **React Flow** - Node graph editor (NOT Rete.js - better docs/faster setup)
- **Material-UI (MUI)** - UI components (sidebars, panels, inputs)
- **Three.js** - 3D geometry visualization
- **TypeScript** (optional, but recommended)

### Backend
- **Python + Flask** - API server
- **RhinoCompute / rhinoinside** - Geometry computation
- **CORS enabled** for local development

## Project Structure

```
grasshopper-web/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── FlowCanvas.tsx       # Main React Flow canvas
│   │   │   │   ├── nodes/               # Custom node components
│   │   │   │   └── edges/               # Custom edge components
│   │   │   ├── Sidebar/
│   │   │   │   ├── ComponentLibrary.tsx # Draggable GH components
│   │   │   │   └── ParameterPanel.tsx   # Selected node parameters
│   │   │   ├── Viewer3D/
│   │   │   │   └── ThreeViewer.tsx      # Three.js 3D preview
│   │   │   └── Layout/
│   │   │       └── AppLayout.tsx        # Main layout with MUI
│   │   ├── types/
│   │   │   ├── nodes.ts                 # Node type definitions
│   │   │   └── graph.ts                 # Graph data structures
│   │   ├── services/
│   │   │   ├── computeAPI.ts            # Backend communication
│   │   │   └── graphConverter.ts        # Graph → GH script
│   │   ├── hooks/
│   │   │   └── useCompute.ts            # Computing state management
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── app.py                           # Flask server
│   ├── compute/
│   │   ├── executor.py                  # Run GH scripts
│   │   └── converter.py                 # JSON → Python/GH
│   ├── requirements.txt
│   └── README.md
└── PROJECT_INSTRUCTIONS.md              # This file
```

## Development Phases

### Phase 1: Foundation (Hours 1-4) ✓ Priority
**Goal:** Basic node graph working

**Frontend Tasks:**
1. Set up Vite + React + TypeScript project
2. Install dependencies: `react-flow-renderer`, `@mui/material`, `three`, `@react-three/fiber`
3. Create basic AppLayout with MUI (Drawer + main canvas area)
4. Implement FlowCanvas with React Flow
5. Create 3 basic node types:
   - `PointNode` - X, Y, Z inputs
   - `CircleNode` - Center (point), Radius (number)
   - `NumberNode` - Single number output

**Backend Tasks:**
1. Set up Flask project with CORS
2. Create `/api/compute` endpoint that accepts JSON
3. Return mock geometry data for now

**Test:** Can add nodes, connect them, see basic flow

### Phase 2: Core Functionality (Hours 5-12) ✓ Priority
**Goal:** Full pipeline working end-to-end

**Frontend Tasks:**
1. Build component library sidebar with 5-10 components:
   - Primitives: Point, Circle, Line, Rectangle
   - Operations: Move, Rotate, Scale
   - Math: Addition, Multiplication, Range
2. Implement graph → JSON serialization
3. Create parameter panel (MUI TextField, Slider) that updates on node selection
4. Build basic Three.js viewer component
5. Wire up compute button that sends graph to backend

**Backend Tasks:**
1. Implement JSON → Python script converter
2. Set up RhinoCompute or rhinoinside integration
3. Execute geometry operations
4. Return geometry as JSON (vertices, faces)
5. Error handling and validation

**Test:** Create simple definition (Point → Circle), compute, see result in 3D

### Phase 3: Integration & Polish (Hours 13-18)
**Goal:** Reliable, demo-ready system

**Tasks:**
1. Add data type validation (prevent connecting incompatible types)
2. Implement auto-compute on parameter change (debounced)
3. Add visual feedback (loading states, error highlights)
4. Style nodes to look Grasshopper-like (color coding by type)
5. Add keyboard shortcuts (Delete, Copy, Undo)
6. Improve 3D viewer (orbit controls, grid, axes)
7. Create 2-3 example definitions (load from JSON)

**Test:** Build increasingly complex definitions without crashes

### Phase 4: Demo Prep (Hours 18-20)
**Goal:** Impressive, presentable demo

**Tasks:**
1. Create showcase examples:
   - Example 1: Parametric circle pattern
   - Example 2: Simple building facade
2. Add help tooltips to components
3. Polish UI styling
4. Prepare talking points and demo script
5. Record backup video in case live demo fails
6. Deploy frontend (Vercel/Netlify) if time permits

## Key Implementation Details

### Node Definition Format
```typescript
interface GHNode {
  id: string;
  type: string;  // 'Point', 'Circle', etc.
  position: { x: number; y: number };
  data: {
    label: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  };
}
```

### Graph Serialization
```typescript
interface GraphDefinition {
  nodes: GHNode[];
  edges: Array<{
    id: string;
    source: string;      // node id
    sourceHandle: string; // output name
    target: string;       // node id
    targetHandle: string; // input name
  }>;
}
```

### API Contract
```typescript
// POST /api/compute
{
  "graph": GraphDefinition,
  "settings": { "tolerance": 0.01 }
}

// Response
{
  "geometry": [
    {
      "type": "mesh",
      "vertices": [[x, y, z], ...],
      "faces": [[i, j, k], ...]
    }
  ],
  "errors": []
}
```

### Custom Node Component Template
```tsx
import { Handle, Position } from 'reactflow';
import { TextField } from '@mui/material';

function PointNode({ data, id }) {
  return (
    <div className="gh-node">
      <div className="node-header">Point</div>
      <div className="node-content">
        <TextField 
          label="X" 
          size="small"
          value={data.inputs.x}
          onChange={(e) => data.onChange(id, 'x', e.target.value)}
          onMouseDown={(e) => e.stopPropagation()} // Important!
        />
      </div>
      <Handle type="source" position={Position.Right} id="point" />
    </div>
  );
}
```

## Component Library (Start with these 8)

### Primitives
1. **Point** - (X, Y, Z) → Point
2. **Circle** - (Center: Point, Radius: Number) → Circle
3. **Line** - (Start: Point, End: Point) → Line

### Parameters
4. **Number Slider** - () → Number
5. **Integer Slider** - () → Integer

### Operations
6. **Move** - (Geometry, Vector: Point) → Geometry
7. **Scale** - (Geometry, Factor: Number) → Geometry

### Math
8. **Addition** - (A: Number, B: Number) → Number

## Critical Shortcuts & Time Savers

### Don't Build These (Use Libraries)
- ❌ Node graph from scratch → Use React Flow
- ❌ UI components → Use MUI
- ❌ 3D rendering engine → Use Three.js
- ❌ State management (unless complex) → Use React hooks

### Do Build These (Core Value)
- ✅ Custom node types
- ✅ Graph → Script converter
- ✅ Compute integration
- ✅ Parameter UI

### Quick Wins
- Copy React Flow examples for node setup
- Use MUI templates for layout
- Start with 3-5 components, not 20
- Hardcode example graphs for demo
- Mock the compute server initially (return fake geometry)

## Common Pitfalls to Avoid

1. **Over-scoping components** - 5 working components > 20 broken ones
2. **Data tree complexity** - Keep it simple lists, no tree structure
3. **Perfect UI** - Functional > Beautiful for hackathon
4. **Real GH file parsing** - Don't touch XML unless Phase 4
5. **Authentication/deployment** - Local only is fine
6. **Unit tests** - Skip for hackathon (controversial but practical)

## Event Handling Issues to Watch

### React Flow + MUI Integration
```tsx
// Problem: MUI inputs inside nodes trigger canvas pan
// Solution: Stop propagation
<TextField 
  onMouseDown={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
/>

// Problem: Dialogs appear behind canvas
// Solution: Increase z-index
<Dialog sx={{ zIndex: 9999 }}>
```

## Development Commands

```bash
# Frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install reactflow @mui/material @emotion/react @emotion/styled
npm install three @react-three/fiber @react-three/drei
npm run dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install flask flask-cors rhino3dm
python app.py
```

## Success Criteria

### Minimum Viable Demo (Must Have)
- [ ] Add 3+ node types to canvas
- [ ] Connect nodes with edges
- [ ] Edit parameters in sidebar
- [ ] Click compute button
- [ ] See 3D geometry result
- [ ] One working example definition

### Impressive Demo (Nice to Have)
- [ ] 8+ component types
- [ ] Auto-compute on change
- [ ] Multiple example definitions
- [ ] Smooth UI/UX
- [ ] Error handling with helpful messages
- [ ] Data type validation

### Stretch Goals (If Time Permits)
- [ ] Save/load definitions
- [ ] Export geometry (STL/OBJ)
- [ ] Undo/redo
- [ ] .ghx file import
- [ ] Multi-select nodes
- [ ] Component grouping

## Demo Script Template

1. **Introduction** (30 sec)
   - "Grasshopper is powerful but requires Rhino license and desktop app"
   - "We built a web-based version accessible anywhere"

2. **Simple Example** (1 min)
   - Create point
   - Create circle from point
   - Adjust parameters
   - Show 3D result

3. **Complex Example** (1 min)
   - Load pre-built definition
   - Modify parameters in real-time
   - Show computational design power

4. **Architecture** (30 sec)
   - React Flow for visual programming
   - Backend compute server
   - Extensible component system

5. **Future Vision** (30 sec)
   - Collaborative editing
   - Cloud computation
   - Mobile support
   - Component marketplace

## Resources & Documentation

### React Flow
- Docs: https://reactflow.dev/
- Examples: https://reactflow.dev/examples
- Custom Nodes: https://reactflow.dev/examples/nodes/custom-node

### Material-UI
- Docs: https://mui.com/
- Component Library: https://mui.com/components/
- Templates: https://mui.com/getting-started/templates/

### Three.js
- Docs: https://threejs.org/docs/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber
- Examples: https://threejs.org/examples/

### Grasshopper Reference
- Component Index: https://grasshopperdocs.com/
- For understanding component behavior

## Getting Help from Cursor

When asking Cursor for help, be specific:

**Good prompts:**
- "Create a custom React Flow node component for a Circle with center and radius inputs"
- "Write the Flask endpoint that converts graph JSON to Python script"
- "Build a Three.js viewer component that renders mesh geometry from vertices and faces"

**Bad prompts:**
- "Make the app better"
- "Fix the bug"
- "Add more features"

## Final Notes

- **Timebox ruthlessly** - If stuck for 30+ minutes, move on or simplify
- **Commit often** - Every working feature
- **Test incrementally** - Don't wait until end-to-end is built
- **Focus on demo** - What looks good in 3 minutes?
- **Have fun!** - It's a hackathon, not production

## Emergency Fallback Plan

If compute server integration is taking too long (Hour 12+):

1. Mock the compute server with hardcoded geometry responses
2. Focus on making the UI/UX polished
3. Demo the visual programming interface
4. Explain "compute server would go here" in presentation

Better to have a beautiful frontend with mocked backend than a broken end-to-end system.

---

**Last Updated:** Start of hackathon
**Team Members:** [Add names]
**Hackathon Duration:** 20 hours
**Target Demo Time:** 3-5 minutes
