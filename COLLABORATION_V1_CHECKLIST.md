# Real-Time Collaboration V1 - Implementation Checklist

## Quick Reference for 3-Hour Implementation

---

## Phase 1: Backend WebSocket Infrastructure (45 min)

### Dependencies
- [ ] Install `flask-socketio` and `python-socketio` in backend
- [ ] Update `requirements.txt`

### Files to Create
- [ ] `backend/collaboration/__init__.py`
- [ ] `backend/collaboration/workspace_manager.py`
  - [ ] In-memory workspace storage dict
  - [ ] `get_workspace(workspace_id)` function
  - [ ] `create_workspace(workspace_id, name)` function
  - [ ] `add_user_to_workspace(workspace_id, user)` function
  - [ ] `remove_user_from_workspace(workspace_id, user_id)` function
  - [ ] `update_workspace_state(workspace_id, nodes, edges)` function

- [ ] `backend/collaboration/events.py`
  - [ ] `handle_join_workspace(socketio, data)`
  - [ ] `handle_leave_workspace(socketio, data)`
  - [ ] `handle_node_change(socketio, data)`
  - [ ] `handle_edge_change(socketio, data)`
  - [ ] `handle_node_data_update(socketio, data)`
  - [ ] `handle_sync_request(socketio, data)`

### Files to Modify
- [ ] `backend/app.py`
  - [ ] Import SocketIO and initialize
  - [ ] Add `POST /api/workspaces` route
  - [ ] Add `GET /api/workspaces/<id>` route
  - [ ] Register SocketIO event handlers
  - [ ] Update CORS to allow SocketIO

---

## Phase 2: Frontend WebSocket Client (45 min)

### Dependencies
- [ ] Install `socket.io-client` in frontend
- [ ] Update `package.json`

### Files to Create
- [ ] `frontend/src/services/collaborationService.js`
  - [ ] Socket.IO client initialization
  - [ ] `connect()` function
  - [ ] `disconnect()` function
  - [ ] `joinWorkspace(workspaceId, username)` function
  - [ ] `leaveWorkspace()` function
  - [ ] `emitNodeChange(change)` function
  - [ ] `emitEdgeChange(change)` function
  - [ ] `emitNodeDataUpdate(nodeId, data)` function
  - [ ] Event listener setup (on, off methods)
  - [ ] Connection status tracking

- [ ] `frontend/src/hooks/useCollaboration.js`
  - [ ] Initialize collaboration service
  - [ ] Handle workspace join/leave
  - [ ] Integrate with workspace store
  - [ ] Return: `{ isConnected, users, error, joinWorkspace, leaveWorkspace }`
  - [ ] Cleanup on unmount

---

## Phase 3: Workspace-Based Routing (30 min)

### Files to Modify
- [ ] `frontend/src/App.js`
  - [ ] Add route: `<Route path="/workspace/:workspaceId" element={<WorkspacePage />} />`
  - [ ] Keep existing `/workspace` route for backward compatibility (optional)

- [ ] `frontend/src/pages/HomePage.js`
  - [ ] Add "Create Workspace" button
  - [ ] Add "Join Workspace" section with input field
  - [ ] Add username input
  - [ ] Generate workspace ID on create (use nanoid)
  - [ ] Navigate to `/workspace/:id` on create/join

- [ ] `frontend/src/pages/WorkspacePage.js`
  - [ ] Import `useParams` from react-router-dom
  - [ ] Extract `workspaceId` from URL params
  - [ ] Import and use `useCollaboration` hook
  - [ ] Call `joinWorkspace` on mount if workspaceId exists
  - [ ] Call `leaveWorkspace` on unmount
  - [ ] Display workspace ID in UI

---

## Phase 4: State Synchronization (45 min)

### Files to Modify
- [ ] `frontend/src/store/workspaceStore.js`
  - [ ] Add state:
    - [ ] `isCollaborative: false`
    - [ ] `workspaceId: null`
    - [ ] `currentUser: null`
    - [ ] `remoteUsers: []`
    - [ ] `isRemoteUpdate: false` (flag to prevent loops)
  
  - [ ] Add actions:
    - [ ] `setWorkspace(workspaceId, user)`
    - [ ] `applyRemoteNodeChange(change)`
    - [ ] `applyRemoteEdgeChange(change)`
    - [ ] `applyRemoteNodeDataUpdate(nodeId, data)`
    - [ ] `addRemoteUser(user)`
    - [ ] `removeRemoteUser(userId)`
    - [ ] `setIsRemoteUpdate(flag)`
  
  - [ ] Modify existing actions to emit if collaborative:
    - [ ] `onNodesChange` - Check `isRemoteUpdate` flag, emit if not remote
    - [ ] `onEdgesChange` - Check `isRemoteUpdate` flag, emit if not remote
    - [ ] `onConnect` - Emit edge addition if collaborative
    - [ ] `addNode` - Emit node addition if collaborative
    - [ ] `updateNodeData` - Emit parameter update if collaborative

- [ ] `frontend/src/hooks/useCollaboration.js`
  - [ ] Set up event listeners for:
    - [ ] `workspace_sync` - Apply full state
    - [ ] `node_change` - Apply remote node change
    - [ ] `edge_change` - Apply remote edge change
    - [ ] `node_data_update` - Apply remote parameter update
    - [ ] `user_joined` - Add to remote users
    - [ ] `user_left` - Remove from remote users
  - [ ] Use `setIsRemoteUpdate(true)` before applying remote changes
  - [ ] Use `setIsRemoteUpdate(false)` after applying

---

## Phase 5: User Presence UI (30 min)

### Files to Create
- [ ] `frontend/src/components/Collaboration/UserPresence.jsx`
  - [ ] Display list of users
  - [ ] Show user avatars/chips with colors
  - [ ] Highlight current user ("You")
  - [ ] Use MUI components (Chip, Avatar, List)

- [ ] `frontend/src/components/Collaboration/CollaborationStatus.jsx`
  - [ ] Connection status indicator (green/red dot)
  - [ ] Workspace ID display
  - [ ] User count badge
  - [ ] Click to show user list (Popover or Drawer)

### Files to Modify
- [ ] `frontend/src/pages/WorkspacePage.js`
  - [ ] Import CollaborationStatus and UserPresence
  - [ ] Add CollaborationStatus to toolbar
  - [ ] Add UserPresence panel (optional drawer or popover)

---

## Phase 6: Testing & Polish (15 min)

### Error Handling
- [ ] Connection failure handling
- [ ] Workspace not found error
- [ ] Reconnection logic (auto-reconnect on disconnect)
- [ ] User feedback (MUI Snackbar for errors)

### Visual Feedback
- [ ] Connection status indicator (connected/disconnected)
- [ ] Loading state while joining workspace
- [ ] Success message on join

### Testing
- [ ] Open two browser windows/tabs
- [ ] Create workspace in window 1
- [ ] Join workspace from window 2 (use workspace ID)
- [ ] Add node in window 1 → Verify appears in window 2
- [ ] Update node parameter in window 2 → Verify updates in window 1
- [ ] Connect nodes in window 1 → Verify edge appears in window 2
- [ ] Close window 2 → Verify user leaves in window 1
- [ ] Test disconnection/reconnection

---

## Key Implementation Notes

### Preventing Update Loops
```javascript
// In workspaceStore.js
onNodesChange: (changes) => {
  const isRemote = get().isRemoteUpdate;
  if (!isRemote && get().isCollaborative) {
    // Emit to server
    collaborationService.emitNodeChange(changes);
  }
  set({ nodes: applyNodeChanges(changes, get().nodes) });
}
```

### Applying Remote Changes
```javascript
// In useCollaboration.js
socket.on('node_change', (data) => {
  store.setIsRemoteUpdate(true);
  store.applyRemoteNodeChange(data);
  store.setIsRemoteUpdate(false);
});
```

### User Colors
```javascript
// Generate consistent color from user ID
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
const colorIndex = user.id.charCodeAt(0) % colors.length;
const userColor = colors[colorIndex];
```

---

## Quick Test Commands

### Backend
```bash
cd backend
python app.py
# Should see: "Running on http://0.0.0.0:5000"
```

### Frontend
```bash
cd frontend
npm start
# Should see: "webpack compiled successfully"
```

### Test WebSocket Connection
- Open browser console
- Check for Socket.IO connection logs
- Verify connection status in UI

---

## Troubleshooting

### WebSocket not connecting
- Check CORS settings in backend
- Verify SocketIO is initialized correctly
- Check browser console for errors
- Verify backend is running

### Changes not syncing
- Check `isRemoteUpdate` flag logic
- Verify event names match (client/server)
- Check WebSocket connection status
- Verify workspace ID matches

### Users not appearing
- Check `user_joined` event is emitted
- Verify user list state updates
- Check UserPresence component rendering

---

**Start with Phase 1 and work sequentially!** ✅

