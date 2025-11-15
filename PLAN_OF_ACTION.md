# Plan of Action - Grasshopper-for-Web Hackathon Project

## Current Status
- ✅ Project instructions documented
- ✅ Frontend initialized (Create React App + React Flow + MUI + Zustand)
- ✅ Basic React Flow canvas working in WorkspacePage
- ✅ State management with Zustand
- ✅ Routing setup (HomePage, WorkspacePage, DocumentationPage)
- ❌ Custom node types not yet created
- ❌ Component library sidebar missing
- ❌ AppLayout with Drawer not implemented
- ❌ Three.js not installed
- ❌ Backend not yet initialized
- **Current Phase:** Phase 1 - Foundation (60% complete)

---

## Phase 1: Foundation (Hours 1-4) - PRIORITY

### Frontend Setup (Hour 1)
**Goal:** Get development environment running

1. **Initialize Frontend Project**
   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   ```

2. **Install Core Dependencies**
   ```bash
   npm install reactflow @mui/material @emotion/react @emotion/styled
   npm install three @react-three/fiber @react-three/drei
   npm install axios  # For API calls
   ```

3. **Verify Setup**
   - Run `npm run dev` and confirm server starts
   - Check TypeScript compilation

### Frontend Core Components (Hours 2-3)
**Goal:** Basic node graph working

1. **Create Project Structure**
   ```
   frontend/src/
   ├── components/
   │   ├── Canvas/
   │   ├── Sidebar/
   │   ├── Viewer3D/
   │   └── Layout/
   ├── types/
   ├── services/
   └── hooks/
   ```

2. **Build AppLayout Component**
   - MUI Drawer for sidebar (left side)
   - Main canvas area (center)
   - Optional: 3D viewer panel (right side)
   - Use MUI Grid or Box for layout

3. **Implement FlowCanvas**
   - Set up React Flow with basic configuration
   - Handle node/edge creation
   - Basic pan/zoom controls

4. **Create 3 Basic Node Types**
   - **PointNode**: X, Y, Z inputs → Point output
   - **CircleNode**: Center (Point input), Radius (Number input) → Circle output
   - **NumberNode**: Single number value → Number output
   - Each node should have:
     - Custom styling
     - Input/output handles
     - Parameter fields (MUI TextField)

### Backend Setup (Hour 3-4)
**Goal:** API server ready to receive requests

1. **Initialize Backend Project**
   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Mac/Linux: source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install flask flask-cors rhino3dm
   ```

3. **Create Flask App Structure**
   ```
   backend/
   ├── app.py
   ├── compute/
   │   ├── executor.py
   │   └── converter.py
   └── requirements.txt
   ```

4. **Build Basic API**
   - Create Flask app with CORS enabled
   - Add `/api/compute` POST endpoint
   - Accept JSON graph definition
   - Return mock geometry data (for now)
   - Example response:
     ```json
     {
       "geometry": [{
         "type": "mesh",
         "vertices": [[0,0,0], [1,0,0], [1,1,0], [0,1,0]],
         "faces": [[0,1,2], [0,2,3]]
       }],
       "errors": []
     }
     ```

### Phase 1 Test Criteria
- ✅ Can add nodes to canvas
- ✅ Can connect nodes with edges
- ✅ Can see basic flow visualization
- ✅ Backend accepts requests (even if mocked)

---

## Phase 2: Core Functionality (Hours 5-12) - PRIORITY

### Frontend Expansion (Hours 5-8)

1. **Component Library Sidebar**
   - Draggable component list
   - Categories: Primitives, Parameters, Operations, Math
   - Components to implement:
     - **Primitives**: Point, Circle, Line, Rectangle
     - **Parameters**: Number Slider, Integer Slider
     - **Operations**: Move, Rotate, Scale
     - **Math**: Addition, Multiplication, Range
   - Drag-and-drop onto canvas creates node

2. **Graph Serialization**
   - Convert React Flow graph to JSON format
   - Structure:
     ```typescript
     {
       nodes: [...],
       edges: [...]
     }
     ```
   - Create `graphConverter.ts` service

3. **Parameter Panel**
   - Show when node is selected
   - Dynamic form based on node type
   - MUI components: TextField, Slider, Select
   - Update node data on change
   - Prevent event propagation to canvas

4. **Three.js Viewer Component**
   - Basic scene setup
   - Render geometry from backend response
   - Support mesh rendering (vertices + faces)
   - Basic camera controls

5. **Compute Integration**
   - Compute button in toolbar
   - Send graph JSON to `/api/compute`
   - Display loading state
   - Render results in 3D viewer
   - Show errors if any

### Backend Implementation (Hours 9-12)

1. **JSON to Python Converter**
   - Parse graph JSON
   - Convert to Python script that uses rhino3dm
   - Handle different node types
   - Generate geometry operations

2. **RhinoCompute Integration**
   - Set up rhino3dm library
   - Execute geometry operations
   - Convert Rhino geometry to JSON
   - Handle errors gracefully

3. **Geometry Serialization**
   - Convert Rhino objects to JSON
   - Format: vertices array, faces array
   - Support multiple geometry types

4. **Error Handling**
   - Validate graph structure
   - Catch computation errors
   - Return helpful error messages
   - Log errors for debugging

### Phase 2 Test Criteria
- ✅ Can create simple definition (Point → Circle)
- ✅ Can compute and see 3D result
- ✅ Parameter changes update node
- ✅ Multiple component types work
- ✅ Backend processes real geometry

---

## Phase 3: Integration & Polish (Hours 13-18)

### Data Validation (Hour 13)
- Prevent connecting incompatible types
- Visual feedback on invalid connections
- Type checking system

### Auto-Compute (Hour 14)
- Debounced auto-compute on parameter change
- Configurable delay (e.g., 500ms)
- Loading indicator during compute

### Visual Feedback (Hour 15)
- Loading states on nodes during compute
- Error highlights on failed nodes
- Success indicators
- Connection validation feedback

### Styling (Hour 16)
- Grasshopper-like node colors:
  - Primitives: Green
  - Parameters: Orange
  - Operations: Blue
  - Math: Purple
- Custom node styling
- Improved layout and spacing

### Keyboard Shortcuts (Hour 17)
- Delete: Remove selected nodes
- Copy/Paste: Duplicate nodes
- Undo/Redo: History management
- Escape: Deselect

### 3D Viewer Improvements (Hour 17-18)
- Orbit controls (mouse drag)
- Grid display
- Axes indicator
- Zoom controls
- Reset view button

### Example Definitions (Hour 18)
- Create 2-3 pre-built examples
- Save as JSON files
- Load button in UI
- Examples:
  1. Simple: Point → Circle
  2. Medium: Parametric pattern
  3. Complex: Building facade

### Phase 3 Test Criteria
- ✅ Complex definitions work without crashes
- ✅ UI is polished and responsive
- ✅ Error handling is helpful
- ✅ Examples load correctly

---

## Phase 4: Demo Prep (Hours 18-20)

### Showcase Examples (Hour 18-19)
1. **Parametric Circle Pattern**
   - Multiple circles in grid
   - Adjustable spacing and radius
   - Visual impact

2. **Simple Building Facade**
   - Parametric windows
   - Adjustable dimensions
   - Demonstrates real-world use

### Final Polish (Hour 19)
- Help tooltips on components
- UI styling refinements
- Smooth animations
- Professional appearance

### Demo Preparation (Hour 19-20)
- Create demo script
- Prepare talking points
- Test all examples
- Record backup video
- Optional: Deploy frontend (Vercel/Netlify)

### Phase 4 Deliverables
- ✅ 2+ impressive examples
- ✅ Polished UI
- ✅ Demo script ready
- ✅ Backup video recorded

---

## Critical Implementation Notes

### Event Handling
- Always use `e.stopPropagation()` on MUI inputs inside nodes
- Prevent canvas pan when interacting with node controls
- Handle z-index for dialogs/modals

### Node Component Template
```tsx
import { Handle, Position } from 'reactflow';
import { TextField } from '@mui/material';

function CustomNode({ data, id }) {
  return (
    <div className="gh-node">
      <div className="node-header">{data.label}</div>
      <div className="node-content">
        {/* Inputs */}
        <Handle type="target" position={Position.Left} id="input1" />
        {/* Controls */}
        <TextField 
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {/* Outputs */}
        <Handle type="source" position={Position.Right} id="output1" />
      </div>
    </div>
  );
}
```

### API Contract
```typescript
// Request
POST /api/compute
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "settings": { "tolerance": 0.01 }
}

// Response
{
  "geometry": [{
    "type": "mesh",
    "vertices": [[x,y,z], ...],
    "faces": [[i,j,k], ...]
  }],
  "errors": []
}
```

---

## Risk Mitigation

### If Backend Takes Too Long (Hour 12+)
- **Fallback:** Mock compute server with hardcoded geometry
- **Focus:** Polish frontend UI/UX
- **Demo:** Show visual programming interface
- **Explain:** "Compute server integration would go here"

### If Time Runs Short
- **Priority 1:** Phase 1 + Phase 2 (core functionality)
- **Priority 2:** One polished example
- **Priority 3:** Basic styling
- **Skip:** Advanced features, multiple examples

---

## Success Metrics

### Minimum Viable Demo ✅
- [ ] Add 3+ node types to canvas
- [ ] Connect nodes with edges
- [ ] Edit parameters in sidebar
- [ ] Click compute button
- [ ] See 3D geometry result
- [ ] One working example definition

### Impressive Demo 🎯
- [ ] 8+ component types
- [ ] Auto-compute on change
- [ ] Multiple example definitions
- [ ] Smooth UI/UX
- [ ] Error handling with helpful messages
- [ ] Data type validation

---

## Next Steps

**Immediate Action Items:**
1. Start with Phase 1 - Frontend Setup
2. Initialize both frontend and backend projects
3. Build basic node graph functionality
4. Test end-to-end flow with mocked backend

**Ready to begin?** Start with Phase 1, Frontend Setup!

