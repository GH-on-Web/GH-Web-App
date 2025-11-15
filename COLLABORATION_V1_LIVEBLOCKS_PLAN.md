# Real-Time Collaboration V1 Plan - Using Liveblocks
## Multiplayer Grasshopper in the Browser

**Goal**: Enable multiple users to work on the same Grasshopper script simultaneously in real-time using Liveblocks.

**Time Estimate**: ~2 hours (faster than custom implementation!)

**Why Liveblocks?**
- ✅ Pre-built, battle-tested infrastructure
- ✅ Built-in presence, multiplayer editing, conflict resolution
- ✅ Zustand integration (we already use Zustand!)
- ✅ Free tier for development
- ✅ Monitoring dashboard included
- ✅ Focus on features, not infrastructure

---

## Architecture Overview

### Core Components
1. **Liveblocks Service** - Handles all real-time infrastructure
2. **Liveblocks + Zustand Integration** - Sync store state across clients
3. **Workspace Management** - Workspace-based routing (using Liveblocks rooms)
4. **User Presence** - Built-in presence indicators
5. **State Synchronization** - Automatic via Liveblocks storage

### Technology Stack
- **Frontend**: `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/zustand`
- **Backend**: Liveblocks REST API for auth (or use public key for demo)
- **State**: Zustand store with Liveblocks middleware

---

## Implementation Plan

### Phase 1: Setup & Installation (15 min)

#### 1.1 Create Liveblocks Account
- Sign up at https://liveblocks.io
- Get your public API key (for demo) or set up auth endpoint

#### 1.2 Install Dependencies
```bash
cd frontend
npm install @liveblocks/client @liveblocks/react @liveblocks/zustand
```

#### 1.3 Environment Variables
**File**: `frontend/.env`
```env
REACT_APP_LIVEBLOCKS_PUBLIC_KEY=your_public_key_here
```

---

### Phase 2: Liveblocks Client Setup (20 min)

#### 2.1 Create Liveblocks Client
**File**: `frontend/src/services/liveblocksClient.js`
```javascript
import { createClient } from "@liveblocks/client";

const client = createClient({
  publicApiKey: process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY,
});

export default client;
```

#### 2.2 Create Collaboration Hook
**File**: `frontend/src/hooks/useCollaboration.js`
- Initialize Liveblocks room
- Handle presence updates
- Return connection status, users, room

---

### Phase 3: Integrate with Zustand Store (45 min)

#### 3.1 Install Liveblocks Zustand Middleware
The `@liveblocks/zustand` package provides middleware to sync Zustand state.

#### 3.2 Update Workspace Store
**File**: `frontend/src/store/workspaceStore.js`
- Wrap store with Liveblocks middleware
- Use `liveblocks` storage for nodes/edges
- Add presence for current user
- Handle remote updates automatically

**Key Changes:**
```javascript
import { create } from 'zustand';
import { createLiveblocksMiddleware } from '@liveblocks/zustand';
import liveblocksClient from '../services/liveblocksClient';

const useWorkspaceStore = create(
  createLiveblocksMiddleware(
    (set, get) => ({
      // Your existing store state
      nodes: [],
      edges: [],
      // ...
    }),
    {
      client: liveblocksClient,
      storageMapping: {
        nodes: true,
        edges: true,
      },
      presenceMapping: {
        selectedNode: true,
        currentUser: true,
      },
    }
  )
);
```

---

### Phase 4: Workspace-Based Routing (20 min)

#### 4.1 Update Routing
**File**: `frontend/src/App.js`
- Add route: `/workspace/:workspaceId`
- Workspace ID = Liveblocks room ID

#### 4.2 Update HomePage
**File**: `frontend/src/pages/HomePage.js`
- Add "Create Workspace" button
- Generate room ID (nanoid)
- Navigate to `/workspace/:roomId`

#### 4.3 Update WorkspacePage
**File**: `frontend/src/pages/WorkspacePage.js`
- Extract `workspaceId` from URL params
- Initialize Liveblocks room with that ID
- Connect store to room
- Clean up on unmount

---

### Phase 5: User Presence UI (20 min)

#### 5.1 Use Liveblocks Presence Components
**File**: `frontend/src/components/Collaboration/UserPresence.jsx`
- Use `useOthers()` hook from `@liveblocks/react`
- Display list of online users
- Show user info and presence

#### 5.2 Create Collaboration Status
**File**: `frontend/src/components/Collaboration/CollaborationStatus.jsx`
- Use `useConnectionStatus()` hook
- Show connection status
- Display room ID
- Show user count

#### 5.3 Integrate into WorkspacePage
- Add CollaborationStatus to toolbar
- Add UserPresence component

---

### Phase 6: Testing & Polish (20 min)

#### 6.1 Test Multiplayer
- Open two browser windows
- Join same workspace
- Make changes in both
- Verify real-time sync

#### 6.2 Error Handling
- Connection failures
- Room not found
- Reconnection logic

---

## Key Differences from Custom Implementation

### What We DON'T Need to Build
- ❌ WebSocket server
- ❌ Event handlers
- ❌ Conflict resolution logic
- ❌ User session management
- ❌ State synchronization logic
- ❌ Connection management
- ❌ Monitoring infrastructure

### What Liveblocks Provides
- ✅ WebSocket infrastructure (hosted)
- ✅ Automatic state synchronization
- ✅ Built-in conflict resolution
- ✅ Presence system
- ✅ Room management
- ✅ Connection management
- ✅ Monitoring dashboard
- ✅ Scalability (handles millions of users)

---

## File Structure

### New Files

**Frontend:**
```
frontend/src/
├── services/
│   └── liveblocksClient.js      # Liveblocks client instance
├── hooks/
│   └── useCollaboration.js      # Collaboration hook (simplified)
├── components/
│   └── Collaboration/
│       ├── UserPresence.jsx     # User list (uses useOthers)
│       └── CollaborationStatus.jsx  # Status bar
└── store/
    └── workspaceStore.js        # Updated with Liveblocks middleware
```

### Modified Files
- `frontend/src/App.js` - Add workspace route
- `frontend/src/pages/WorkspacePage.js` - Add Liveblocks room connection
- `frontend/src/pages/HomePage.js` - Add workspace creation/joining
- `frontend/src/store/workspaceStore.js` - Add Liveblocks middleware
- `frontend/package.json` - Add Liveblocks dependencies
- `frontend/.env` - Add Liveblocks API key

---

## Liveblocks Concepts

### Rooms
- Each workspace = one Liveblocks room
- Room ID = workspace ID in URL
- Rooms persist state automatically

### Storage
- Shared state (nodes, edges) stored in Liveblocks
- Automatically synced across all clients
- Conflict resolution handled automatically

### Presence
- Temporary state (selected node, cursor position)
- Broadcast to other users
- Cleared when user disconnects

### Others
- List of other users in the room
- Includes their presence data
- Updates in real-time

---

## Code Examples

### Store with Liveblocks Middleware
```javascript
import { create } from 'zustand';
import { createLiveblocksMiddleware } from '@liveblocks/zustand';
import liveblocksClient from '../services/liveblocksClient';

const useWorkspaceStore = create(
  createLiveblocksMiddleware(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNode: null,
      
      // Actions work normally
      addNode: (type, position) => {
        // Changes automatically sync via Liveblocks!
        set({ nodes: [...get().nodes, newNode] });
      },
    }),
    {
      client: liveblocksClient,
      storageMapping: {
        nodes: true,  // Sync nodes across clients
        edges: true,  // Sync edges across clients
      },
      presenceMapping: {
        selectedNode: true,  // Broadcast selected node
      },
    }
  )
);
```

### Connecting to Room
```javascript
import { useRoom } from '@liveblocks/react';
import useWorkspaceStore from '../store/workspaceStore';

function WorkspacePage() {
  const { workspaceId } = useParams();
  const room = useRoom(workspaceId);
  const store = useWorkspaceStore();
  
  // Store automatically connects to room via middleware
  // No manual sync needed!
}
```

### User Presence
```javascript
import { useOthers } from '@liveblocks/react';

function UserPresence() {
  const others = useOthers();
  
  return (
    <div>
      {others.map((other) => (
        <div key={other.connectionId}>
          {other.presence?.currentUser?.username}
        </div>
      ))}
    </div>
  );
}
```

---

## Pricing Considerations

### Free Tier
- ✅ Up to 20,000 MAU (Monthly Active Users)
- ✅ Unlimited rooms
- ✅ Perfect for development and demos

### Paid Tiers
- For production with more users
- Still very affordable
- Pay-as-you-scale model

**For a hackathon/demo**: Free tier is perfect!

---

## Benefits for This Project

1. **Time Savings**: ~1 hour saved (no backend WebSocket code)
2. **Reliability**: Battle-tested infrastructure
3. **Features**: Presence, conflict resolution out of the box
4. **Monitoring**: Built-in dashboard to see active users
5. **Scalability**: Handles millions of users automatically
6. **Focus**: Can focus on Grasshopper features, not infrastructure

---

## Migration Path

If we started with custom implementation, we can easily migrate:
1. Keep existing Zustand store structure
2. Wrap with Liveblocks middleware
3. Replace WebSocket service with Liveblocks client
4. Remove custom event handlers
5. Use Liveblocks hooks for presence

---

## Success Criteria

✅ Multiple users can join the same workspace  
✅ Node/edge changes sync in real-time (automatic!)  
✅ Parameter updates sync in real-time  
✅ User presence is visible (built-in!)  
✅ Connection status is shown  
✅ Workspace ID is in URL (shareable)  
✅ No custom WebSocket code needed  

---

## Next Steps

1. **Sign up for Liveblocks** (5 min)
   - Go to https://liveblocks.io
   - Create account
   - Get public API key

2. **Install dependencies** (2 min)
   ```bash
   npm install @liveblocks/client @liveblocks/react @liveblocks/zustand
   ```

3. **Set up client** (5 min)
   - Create `liveblocksClient.js`
   - Add API key to `.env`

4. **Update store** (30 min)
   - Add Liveblocks middleware
   - Configure storage/presence mapping

5. **Add routing** (20 min)
   - Update routes for workspace IDs
   - Connect rooms to workspaces

6. **Add UI** (20 min)
   - Presence components
   - Status indicators

7. **Test!** (20 min)
   - Open two windows
   - Verify sync works

**Total: ~2 hours** (vs 3 hours for custom implementation)

---

## Resources

- [Liveblocks Docs](https://liveblocks.io/docs)
- [Zustand Integration](https://liveblocks.io/docs/getting-started/zustand)
- [React Hooks](https://liveblocks.io/docs/api-reference/liveblocks-react)
- [Examples](https://liveblocks.io/examples)

---

**This approach is faster, more reliable, and lets us focus on building great Grasshopper features!** 🚀

