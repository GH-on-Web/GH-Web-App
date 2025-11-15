# Real-Time Collaboration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ WorkspacePage│      │  Zustand     │      │ Collaboration│  │
│  │              │◄─────┤  Store       │◄─────┤  Service     │  │
│  │  - Canvas    │      │              │      │              │  │
│  │  - Nodes     │      │  - nodes[]   │      │  - Socket.IO │  │
│  │  - Edges     │      │  - edges[]   │      │  - Events    │  │
│  └──────────────┘      │  - users[]   │      │  - Status    │  │
│         │              └──────────────┘      └──────────────┘  │
│         │                       │                    │         │
│         └───────────────────────┴────────────────────┘         │
│                            │                                     │
│                            ▼                                     │
│                    ┌──────────────┐                             │
│                    │  WebSocket   │                             │
│                    │  Connection  │                             │
│                    └──────────────┘                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ WebSocket (Socket.IO)
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                            ▼                                     │
│                    ┌──────────────┐                             │
│                    │ Flask-SocketIO│                            │
│                    │   Server      │                             │
│                    └──────────────┘                             │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │Workspace │      │  Event   │      │  User    │              │
│  │ Manager  │      │ Handlers │      │ Sessions │              │
│  │          │      │          │      │          │              │
│  │ - State  │      │ - join   │      │ - Track  │              │
│  │ - Users  │      │ - leave  │      │ - Colors │              │
│  │ - Sync   │      │ - change │      │ - IDs    │              │
│  └──────────┘      └──────────┘      └──────────┘              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Action → Sync Flow

```
User Action (Add Node)
    │
    ▼
┌─────────────────┐
│ WorkspaceStore  │  Update local state
│  addNode()      │
└────────┬────────┘
         │
         │ (if isCollaborative && !isRemoteUpdate)
         ▼
┌─────────────────┐
│ Collaboration   │  Emit WebSocket event
│ Service         │  emit('node_change', { type: 'add', node })
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│ Backend         │  Receive event
│ Event Handler   │  handle_node_change()
└────────┬────────┘
         │
         │ Update workspace state
         ▼
┌─────────────────┐
│ Workspace       │  Store node in workspace
│ Manager         │  Broadcast to all clients
└────────┬────────┘
         │
         │ Broadcast
         ▼
┌─────────────────┐
│ Other Clients   │  Receive broadcast
│ Collaboration   │  socket.on('node_change')
│ Service         │
└────────┬────────┘
         │
         │ Apply change
         ▼
┌─────────────────┐
│ WorkspaceStore  │  Apply remote change
│ applyRemote...  │  setIsRemoteUpdate(true)
│                 │  applyNodeChange()
│                 │  setIsRemoteUpdate(false)
└─────────────────┘
```

### Join Workspace Flow

```
User navigates to /workspace/:id
    │
    ▼
┌─────────────────┐
│ WorkspacePage   │  Component mounts
│                 │  Extract workspaceId from URL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useCollaboration│  Initialize hook
│ Hook            │  Connect to WebSocket
└────────┬────────┘
         │
         │ connect()
         ▼
┌─────────────────┐
│ Collaboration   │  Socket.IO connects
│ Service         │  emit('join_workspace', { workspaceId, username })
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│ Backend         │  handle_join_workspace()
│ Event Handler   │  - Add user to workspace
│                 │  - Get workspace state
└────────┬────────┘
         │
         │ Send sync
         ▼
┌─────────────────┐
│ Backend         │  emit('workspace_sync', { nodes, edges, users })
│                 │  emit('user_joined', { user }) to others
└────────┬────────┘
         │
         │ Receive sync
         ▼
┌─────────────────┐
│ Frontend        │  socket.on('workspace_sync')
│ Collaboration   │  Apply full state to store
│ Service         │  Update users list
└─────────────────┘
```

## Component Hierarchy

```
App
├── Router
│   ├── HomePage
│   │   ├── Create Workspace Button
│   │   └── Join Workspace Form
│   │
│   └── WorkspacePage (:workspaceId)
│       ├── useCollaboration Hook
│       │   ├── CollaborationService
│       │   └── WorkspaceStore (collaboration state)
│       │
│       ├── AppLayout
│       │   ├── Sidebar (ComponentLibrary)
│       │   ├── Main Canvas
│       │   │   └── FlowCanvas
│       │   │       └── React Flow Nodes/Edges
│       │   └── Viewer (ThreeViewer)
│       │
│       └── CollaborationStatus (Toolbar)
│           └── UserPresence (Popover/Drawer)
```

## State Management

### WorkspaceStore State Structure

```javascript
{
  // Graph state
  nodes: [],
  edges: [],
  selectedNode: null,
  
  // Collaboration state
  isCollaborative: false,
  workspaceId: null,
  currentUser: {
    id: "user_abc123",
    username: "Alice",
    color: "#FF6B6B"
  },
  remoteUsers: [
    {
      id: "user_xyz789",
      username: "Bob",
      color: "#4ECDC4"
    }
  ],
  isRemoteUpdate: false  // Flag to prevent update loops
}
```

### Workspace Manager State (Backend)

```python
workspaces = {
  "workspace_abc123": {
    "workspaceId": "workspace_abc123",
    "name": "My Workspace",
    "nodes": [...],
    "edges": [...],
    "users": [
      {
        "id": "user_abc123",
        "username": "Alice",
        "color": "#FF6B6B",
        "socketId": "socket_xyz"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Event Types

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_workspace` | `{ workspaceId, username }` | User joins a workspace |
| `leave_workspace` | `{ workspaceId }` | User leaves workspace |
| `node_change` | `{ type, node, workspaceId }` | Node added/updated/deleted |
| `edge_change` | `{ type, edge, workspaceId }` | Edge added/updated/deleted |
| `node_data_update` | `{ nodeId, data, workspaceId }` | Node parameter changed |
| `sync_request` | `{ workspaceId }` | Request full state sync |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `workspace_sync` | `{ nodes, edges, users }` | Full workspace state |
| `node_change` | `{ type, node, userId }` | Remote node change |
| `edge_change` | `{ type, edge, userId }` | Remote edge change |
| `node_data_update` | `{ nodeId, data, userId }` | Remote parameter update |
| `user_joined` | `{ user }` | New user joined |
| `user_left` | `{ userId }` | User left |
| `error` | `{ message }` | Error occurred |

## Conflict Resolution Strategy (V1)

### Last-Write-Wins
- Each change includes a timestamp
- Server stores latest timestamp
- Client applies changes in order received
- Simple and fast for v1

### Future: Operational Transform
- More sophisticated conflict resolution
- Handles simultaneous edits better
- Requires more complex implementation

## Scalability Considerations

### Current (V1)
- In-memory storage (workspaces dict)
- Single server instance
- Suitable for 2-10 concurrent users per workspace
- No persistence (workspaces lost on restart)

### Future Enhancements
- Database persistence (PostgreSQL/MongoDB)
- Redis for pub/sub across servers
- Horizontal scaling with load balancer
- Workspace persistence and history
- Rate limiting and throttling

## Security Considerations (V1)

### Current
- No authentication (anyone with workspace ID can join)
- No authorization (all users have full access)
- Workspace IDs are guessable (nanoid)

### Future
- User authentication (JWT tokens)
- Workspace permissions (owner, editor, viewer)
- Encrypted WebSocket connections (WSS)
- Rate limiting per user
- Workspace access control lists

---

**This architecture supports real-time collaboration with minimal complexity for V1!** 🚀

