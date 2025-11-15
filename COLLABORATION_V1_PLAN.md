# Real-Time Collaboration V1 Plan
## Multiplayer Grasshopper in the Browser

**Goal**: Enable multiple users to work on the same Grasshopper script simultaneously in real-time.

**Time Estimate**: ~3 hours

---

## Architecture Overview

### Core Components
1. **WebSocket Server** (Flask-SocketIO) - Real-time bidirectional communication
2. **Workspace Management** - Workspace-based routing and state isolation
3. **State Synchronization** - Sync nodes/edges changes across clients
4. **User Presence** - Show who's online and what they're editing
5. **Conflict Resolution** - Simple last-write-wins for v1

### Technology Stack Additions
- **Backend**: `flask-socketio` for WebSocket support
- **Frontend**: `socket.io-client` for WebSocket client
- **State**: Extend Zustand store with collaboration layer

---

## Implementation Plan

### Phase 1: Backend WebSocket Infrastructure (45 min)

#### 1.1 Install Dependencies
```bash
cd backend
pip install flask-socketio python-socketio
```

#### 1.2 Create Collaboration Module
**File**: `backend/collaboration/workspace_manager.py`
- In-memory workspace storage (dict)
- Workspace state: `{ workspaceId: { nodes: [], edges: [], users: [] } }`
- User sessions: `{ userId: { workspaceId, username, color } }`

**File**: `backend/collaboration/events.py`
- Event handlers for:
  - `join_workspace` - User joins a workspace
  - `leave_workspace` - User leaves
  - `node_change` - Node added/updated/deleted
  - `edge_change` - Edge added/updated/deleted
  - `node_data_update` - Node parameter changes
  - `sync_request` - Request full state sync

#### 1.3 Update Flask App
**File**: `backend/app.py`
- Initialize SocketIO
- Add workspace routes:
  - `POST /api/workspaces` - Create workspace
  - `GET /api/workspaces/:id` - Get workspace info
- Register SocketIO event handlers

---

### Phase 2: Frontend WebSocket Client (45 min)

#### 2.1 Install Dependencies
```bash
cd frontend
npm install socket.io-client
```

#### 2.2 Create Collaboration Service
**File**: `frontend/src/services/collaborationService.js`
- Socket.IO client connection
- Event emitters:
  - `joinWorkspace(workspaceId, username)`
  - `leaveWorkspace()`
  - `emitNodeChange(change)`
  - `emitEdgeChange(change)`
  - `emitNodeDataUpdate(nodeId, data)`
- Event listeners:
  - `node_change` - Apply remote node changes
  - `edge_change` - Apply remote edge changes
  - `node_data_update` - Apply remote parameter updates
  - `user_joined` - Add user to presence list
  - `user_left` - Remove user from presence list
  - `workspace_sync` - Full state sync on join

#### 2.3 Create Collaboration Hook
**File**: `frontend/src/hooks/useCollaboration.js`
- Manage WebSocket connection lifecycle
- Handle workspace join/leave
- Integrate with workspace store
- Return connection status, users, errors

---

### Phase 3: Workspace-Based Routing (30 min)

#### 3.1 Update Routing
**File**: `frontend/src/App.js`
- Add route: `/workspace/:workspaceId`
- Update HomePage to support workspace creation/joining
- Add workspace ID to URL params

#### 3.2 Update WorkspacePage
**File**: `frontend/src/pages/WorkspacePage.js`
- Extract `workspaceId` from URL params
- Initialize collaboration on mount
- Clean up on unmount
- Show workspace ID in UI

#### 3.3 Update HomePage
**File**: `frontend/src/pages/HomePage.js`
- Add "Create Workspace" button
- Add "Join Workspace" input (workspace ID)
- Generate/validate workspace IDs (nanoid)

---

### Phase 4: State Synchronization (45 min)

#### 4.1 Extend Workspace Store
**File**: `frontend/src/store/workspaceStore.js`
- Add collaboration state:
  - `isCollaborative: boolean`
  - `workspaceId: string | null`
  - `currentUser: { id, username, color }`
  - `remoteUsers: []`
- Add collaboration actions:
  - `setWorkspace(workspaceId, user)`
  - `applyRemoteNodeChange(change)`
  - `applyRemoteEdgeChange(change)`
  - `applyRemoteNodeDataUpdate(nodeId, data)`
  - `addRemoteUser(user)`
  - `removeRemoteUser(userId)`

#### 4.2 Integrate with React Flow Handlers
- Wrap `onNodesChange` to emit changes if collaborative
- Wrap `onEdgesChange` to emit changes if collaborative
- Wrap `onConnect` to emit edge additions
- Wrap `addNode` to emit node additions
- Wrap `updateNodeData` to emit parameter updates
- Handle remote changes (prevent loops with `isRemote` flag)

#### 4.3 Conflict Resolution (Simple v1)
- Last-write-wins for node/edge updates
- Timestamp-based conflict resolution
- Queue local changes if connection is down (optional for v1)

---

### Phase 5: User Presence UI (30 min)

#### 5.1 Create Presence Component
**File**: `frontend/src/components/Collaboration/UserPresence.jsx`
- Display list of online users
- Show user colors/avatars
- Show "You" indicator
- MUI Chip or Avatar components

#### 5.2 Create Collaboration Status Bar
**File**: `frontend/src/components/Collaboration/CollaborationStatus.jsx`
- Connection status indicator (connected/disconnected)
- Workspace ID display
- User count
- Click to show user list

#### 5.3 Integrate into WorkspacePage
- Add CollaborationStatus to toolbar
- Add UserPresence panel (collapsible drawer or popover)

---

### Phase 6: Testing & Polish (15 min)

#### 6.1 Error Handling
- Connection failures
- Workspace not found
- Reconnection logic
- User feedback (snackbars/alerts)

#### 6.2 Visual Feedback
- Highlight nodes being edited by others (optional for v1)
- Show typing indicators (optional for v1)
- Connection status indicator

#### 6.3 Basic Testing
- Open two browser windows
- Create workspace in one
- Join from second
- Make changes in both
- Verify synchronization

---

## Data Flow

### User Action → Sync Flow
```
User Action (e.g., add node)
  ↓
WorkspaceStore updates local state
  ↓
CollaborationService emits WebSocket event
  ↓
Backend receives event
  ↓
Backend broadcasts to all clients in workspace
  ↓
Other clients receive event
  ↓
CollaborationService handles event
  ↓
WorkspaceStore applies remote change (with isRemote flag)
```

### Join Workspace Flow
```
User navigates to /workspace/:id
  ↓
WorkspacePage mounts
  ↓
useCollaboration hook initializes
  ↓
CollaborationService connects to WebSocket
  ↓
CollaborationService emits 'join_workspace'
  ↓
Backend adds user to workspace
  ↓
Backend sends 'workspace_sync' with full state
  ↓
Frontend applies full state to store
  ↓
Backend broadcasts 'user_joined' to other clients
```

---

## File Structure

### New Files

**Backend:**
```
backend/
├── collaboration/
│   ├── __init__.py
│   ├── workspace_manager.py    # Workspace state management
│   └── events.py                # SocketIO event handlers
└── app.py                       # Updated with SocketIO
```

**Frontend:**
```
frontend/src/
├── services/
│   └── collaborationService.js  # WebSocket client service
├── hooks/
│   └── useCollaboration.js      # Collaboration hook
├── components/
│   └── Collaboration/
│       ├── UserPresence.jsx     # User list component
│       └── CollaborationStatus.jsx  # Status bar
└── store/
    └── workspaceStore.js        # Extended with collaboration
```

### Modified Files
- `backend/app.py` - Add SocketIO, workspace routes
- `frontend/src/App.js` - Add workspace route
- `frontend/src/pages/WorkspacePage.js` - Add collaboration integration
- `frontend/src/pages/HomePage.js` - Add workspace creation/joining
- `frontend/src/store/workspaceStore.js` - Add collaboration state/actions

---

## API/Event Contract

### HTTP Endpoints
```
POST /api/workspaces
  Body: { "name": "Workspace Name" }
  Response: { "workspaceId": "abc123", "name": "..." }

GET /api/workspaces/:id
  Response: { "workspaceId": "abc123", "userCount": 2, "nodes": [...], "edges": [...] }
```

### WebSocket Events (Client → Server)
```javascript
join_workspace: { workspaceId, username }
leave_workspace: { workspaceId }
node_change: { type: 'add'|'update'|'remove', node, workspaceId }
edge_change: { type: 'add'|'update'|'remove', edge, workspaceId }
node_data_update: { nodeId, data, workspaceId }
sync_request: { workspaceId }
```

### WebSocket Events (Server → Client)
```javascript
workspace_sync: { nodes, edges, users }
node_change: { type, node, userId }
edge_change: { type, edge, userId }
node_data_update: { nodeId, data, userId }
user_joined: { user }
user_left: { userId }
error: { message }
```

---

## User Experience Flow

1. **Create Workspace**
   - User clicks "Create Workspace" on HomePage
   - System generates workspace ID
   - User enters username
   - Redirects to `/workspace/:id`
   - WorkspacePage loads and connects

2. **Join Workspace**
   - User enters workspace ID on HomePage
   - User enters username
   - Redirects to `/workspace/:id`
   - WorkspacePage loads and connects
   - Receives full state sync

3. **Collaborative Editing**
   - User A adds a node → Appears on User B's screen
   - User B updates node parameter → Updates on User A's screen
   - User A connects nodes → Edge appears on User B's screen
   - Both users see each other in presence list

4. **Leave Workspace**
   - User closes tab or navigates away
   - WebSocket disconnects
   - Other users see "user_left" event
   - User removed from presence list

---

## Success Criteria

✅ Multiple users can join the same workspace  
✅ Node/edge changes sync in real-time  
✅ Parameter updates sync in real-time  
✅ User presence is visible  
✅ Connection status is shown  
✅ Workspace ID is in URL (shareable)  
✅ Basic error handling works  

---

## Future Enhancements (Post-V1)

- Operational Transform for better conflict resolution
- Cursor positions / viewport sync
- Node locking (prevent simultaneous edits)
- Chat/comment system
- Workspace persistence (database)
- User authentication
- Workspace permissions
- History/undo with collaboration
- Optimistic updates with rollback

---

## Risk Mitigation

1. **WebSocket Connection Issues**
   - Show connection status
   - Auto-reconnect logic
   - Queue changes if disconnected

2. **State Conflicts**
   - Simple last-write-wins for v1
   - Can upgrade to OT later

3. **Performance with Many Users**
   - Throttle/debounce updates
   - Only sync visible changes
   - Optimize for 2-5 users initially

4. **Browser Compatibility**
   - Socket.IO handles fallbacks
   - Test in Chrome, Firefox, Safari

---

## Time Breakdown

- **Backend Setup**: 45 min
- **Frontend Client**: 45 min
- **Routing & Integration**: 30 min
- **State Sync**: 45 min
- **UI Components**: 30 min
- **Testing & Polish**: 15 min
- **Total**: ~3 hours

---

## Getting Started

1. Start with Phase 1 (Backend)
2. Test WebSocket connection manually
3. Move to Phase 2 (Frontend Client)
4. Test basic connection
5. Continue through phases sequentially
6. Test end-to-end with 2 browser windows

---

**Ready to implement!** 🚀

