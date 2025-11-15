# Real-Time Collaboration V1 - Liveblocks Implementation Checklist

## Quick Reference for 2-Hour Implementation

---

## Phase 1: Setup & Installation (15 min)

### Account Setup
- [ ] Sign up at https://liveblocks.io
- [ ] Get public API key from dashboard
- [ ] Note: For production, you'd set up auth endpoint, but public key works for demo

### Dependencies
- [ ] Install `@liveblocks/client`
- [ ] Install `@liveblocks/react`
- [ ] Install `@liveblocks/zustand`
- [ ] Update `package.json` (should auto-update)

### Environment
- [ ] Create/update `frontend/.env` file
- [ ] Add `REACT_APP_LIVEBLOCKS_PUBLIC_KEY=your_key_here`
- [ ] Add `.env` to `.gitignore` (if not already)

---

## Phase 2: Liveblocks Client Setup (20 min)

### Files to Create
- [ ] `frontend/src/services/liveblocksClient.js`
  - [ ] Import `createClient` from `@liveblocks/client`
  - [ ] Create client with `publicApiKey` from env
  - [ ] Export default client

### Files to Create
- [ ] `frontend/src/hooks/useCollaboration.js`
  - [ ] Import `useRoom` from `@liveblocks/react`
  - [ ] Import `useConnectionStatus` from `@liveblocks/react`
  - [ ] Import `useOthers` from `@liveblocks/react`
  - [ ] Create hook that:
    - [ ] Takes `workspaceId` (room ID)
    - [ ] Returns `{ room, connectionStatus, others, isConnected }`
  - [ ] Handle room connection/disconnection

---

## Phase 3: Integrate with Zustand Store (45 min)

### Files to Modify
- [ ] `frontend/src/store/workspaceStore.js`
  - [ ] Import `createLiveblocksMiddleware` from `@liveblocks/zustand`
  - [ ] Import `liveblocksClient` from services
  - [ ] Wrap existing store with middleware:
    ```javascript
    createLiveblocksMiddleware(
      (set, get) => ({ /* existing store */ }),
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
    ```
  - [ ] Test that existing actions still work
  - [ ] Verify state syncs automatically

### Key Points
- [ ] Storage (nodes, edges) syncs automatically
- [ ] Presence (selectedNode, currentUser) broadcasts automatically
- [ ] No manual sync code needed!
- [ ] Existing store actions work unchanged

---

## Phase 4: Workspace-Based Routing (20 min)

### Files to Modify
- [ ] `frontend/src/App.js`
  - [ ] Add route: `<Route path="/workspace/:workspaceId" element={<WorkspacePage />} />`
  - [ ] Keep existing `/workspace` route for backward compatibility (optional)

- [ ] `frontend/src/pages/HomePage.js`
  - [ ] Add "Create Workspace" button
  - [ ] Add "Join Workspace" section:
    - [ ] Input field for workspace ID
    - [ ] Input field for username
  - [ ] Generate workspace ID on create (use `nanoid`)
  - [ ] Navigate to `/workspace/:id` on create/join
  - [ ] Store username in localStorage or state

- [ ] `frontend/src/pages/WorkspacePage.js`
  - [ ] Import `useParams` from `react-router-dom`
  - [ ] Import `useCollaboration` hook
  - [ ] Extract `workspaceId` from URL params
  - [ ] Call `useCollaboration(workspaceId)` hook
  - [ ] Display workspace ID in UI
  - [ ] Clean up on unmount (automatic with hooks)

---

## Phase 5: User Presence UI (20 min)

### Files to Create
- [ ] `frontend/src/components/Collaboration/UserPresence.jsx`
  - [ ] Import `useOthers` from `@liveblocks/react`
  - [ ] Get list of other users
  - [ ] Display user list with:
    - [ ] User avatars/chips
    - [ ] Username
    - [ ] User colors
    - [ ] "You" indicator for current user
  - [ ] Use MUI components (Chip, Avatar, List)

- [ ] `frontend/src/components/Collaboration/CollaborationStatus.jsx`
  - [ ] Import `useConnectionStatus` from `@liveblocks/react`
  - [ ] Display connection status (connected/disconnected)
  - [ ] Show workspace/room ID
  - [ ] Show user count (use `useOthers().length + 1`)
  - [ ] Click to show user list (Popover or Drawer)
  - [ ] Use MUI components

### Files to Modify
- [ ] `frontend/src/pages/WorkspacePage.js`
  - [ ] Import `CollaborationStatus` and `UserPresence`
  - [ ] Add `CollaborationStatus` to toolbar
  - [ ] Add `UserPresence` panel (optional drawer or popover)

---

## Phase 6: Testing & Polish (20 min)

### Error Handling
- [ ] Connection failure handling
  - [ ] Show error message if connection fails
  - [ ] Use `useConnectionStatus()` to detect disconnection
- [ ] Room not found error
  - [ ] Handle invalid room IDs gracefully
- [ ] Reconnection logic
  - [ ] Liveblocks handles this automatically, but show status

### Visual Feedback
- [ ] Connection status indicator (green/red dot)
- [ ] Loading state while connecting
- [ ] Success message on join (optional)
- [ ] User feedback (MUI Snackbar for errors)

### Testing
- [ ] Open two browser windows/tabs
- [ ] Create workspace in window 1
- [ ] Copy workspace ID
- [ ] Join workspace from window 2 (paste ID)
- [ ] Add node in window 1 → Verify appears in window 2
- [ ] Update node parameter in window 2 → Verify updates in window 1
- [ ] Connect nodes in window 1 → Verify edge appears in window 2
- [ ] Close window 2 → Verify user leaves in window 1
- [ ] Test disconnection/reconnection (disconnect network, reconnect)

---

## Key Implementation Notes

### No Manual Sync Needed!
```javascript
// This is all you need - Liveblocks handles the rest!
const useWorkspaceStore = create(
  createLiveblocksMiddleware(
    (set, get) => ({
      nodes: [],
      edges: [],
      addNode: (type, position) => {
        // This automatically syncs to all clients!
        set({ nodes: [...get().nodes, newNode] });
      },
    }),
    {
      client: liveblocksClient,
      storageMapping: { nodes: true, edges: true },
    }
  )
);
```

### Room Connection
```javascript
// In WorkspacePage
const { workspaceId } = useParams();
const { room, isConnected, others } = useCollaboration(workspaceId);
// Store automatically connects via middleware - no manual code needed!
```

### User Presence
```javascript
// Get other users
const others = useOthers();

// Get connection status
const status = useConnectionStatus(); // 'open' | 'closed' | 'connecting'
```

### Setting Presence
```javascript
// In store, presence is automatically broadcast
presenceMapping: {
  selectedNode: true,  // Automatically sent to others
  currentUser: true,   // Automatically sent to others
}
```

---

## Quick Test Commands

### Frontend
```bash
cd frontend
npm start
# Should see: "webpack compiled successfully"
```

### Test Liveblocks Connection
- Open browser console
- Check for Liveblocks connection logs
- Verify connection status in UI
- Check Liveblocks dashboard for active rooms

---

## Troubleshooting

### Connection not working
- Check API key in `.env` file
- Verify key is correct in Liveblocks dashboard
- Check browser console for errors
- Verify `.env` file is loaded (restart dev server)

### Changes not syncing
- Verify room ID matches in both windows
- Check that `storageMapping` includes nodes/edges
- Verify store is wrapped with middleware correctly
- Check Liveblocks dashboard for room activity

### Users not appearing
- Check `useOthers()` hook is called
- Verify presence is set in store
- Check `presenceMapping` configuration
- Verify users are in same room

### Store actions not working
- Verify middleware is wrapping store correctly
- Check that actions use `set()` and `get()` correctly
- Ensure storage items are in `storageMapping`

---

## Liveblocks Dashboard

### What to Check
- [ ] Active rooms (should see your workspace)
- [ ] Active users (should see connected users)
- [ ] Connection status
- [ ] Storage data (nodes, edges)
- [ ] Presence data (selectedNode, currentUser)

### Access
- Go to https://liveblocks.io/dashboard
- Sign in
- View your rooms and users

---

## Benefits Over Custom Implementation

✅ **No backend WebSocket code needed**  
✅ **No event handlers to write**  
✅ **No conflict resolution logic**  
✅ **Automatic state synchronization**  
✅ **Built-in presence system**  
✅ **Monitoring dashboard included**  
✅ **Handles scaling automatically**  
✅ **Battle-tested infrastructure**  

---

## Next Steps After V1

- Add cursor positions (presence)
- Add viewport sync (presence)
- Add node locking (prevent simultaneous edits)
- Add chat/comments (Liveblocks has this!)
- Add notifications (Liveblocks has this!)
- Add workspace persistence
- Add user authentication

---

**Start with Phase 1 and work sequentially! Much simpler than custom implementation!** ✅

