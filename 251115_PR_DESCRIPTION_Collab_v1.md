# Add Real-Time Multiplayer Collaboration with Liveblocks

## 🎯 Overview

This PR implements real-time multiplayer collaboration for the Grasshopper workspace, enabling multiple users to work on the same script simultaneously in the browser. Powered by Liveblocks, this feature brings Google Docs/Figma-style collaboration to our visual programming interface.

## ✨ Features

- **Real-time node/edge synchronization** - Changes sync instantly across all connected users
- **User presence indicators** - See who's online and working in the workspace
- **Shareable workspace IDs** - Copy-to-clipboard functionality for easy collaboration
- **Workspace-based routing** - Each workspace has a unique URL for easy sharing
- **Connection status** - Visual indicators show connection state

## 🔧 Technical Changes

### New Dependencies
- `@liveblocks/client` - Liveblocks client SDK
- `@liveblocks/react` - React hooks and providers
- `@liveblocks/zustand` - Zustand integration (installed but not used in this PR)

### New Components
- `CollaborationStatus` - Status bar showing connection and user count
- `UserPresence` - List of online users with avatars
- `useCollaboration` - Custom hook for Liveblocks state management

### Modified Components
- `App.js` - Added `LiveblocksProvider` at root level
- `HomePage.js` - Added workspace creation/joining interface
- `WorkspacePage.js` - Integrated Liveblocks storage for nodes/edges sync
- `liveblocksClient.js` - Liveblocks client configuration

### Infrastructure
- Workspace-based routing (`/workspace/:workspaceId`)
- Environment variable setup for Liveblocks API key
- Error handling and connection status management

## 🧪 Testing

### Single User
1. Create a workspace
2. Add nodes and connect them
3. Verify connection status shows "Connected"

### Multiplayer (Same Computer)
1. Open two browser windows
2. Create workspace in window 1
3. Copy workspace ID and join in window 2
4. Make changes in one window → Verify they appear in the other

### Multiplayer (Different Computers)
1. User 1 creates workspace and shares workspace ID
2. User 2 joins using the workspace ID
3. Both users can edit simultaneously with real-time sync

### Test Cases
- ✅ Add nodes → Syncs to all users
- ✅ Move nodes → Syncs in real-time
- ✅ Connect nodes → Edges appear everywhere
- ✅ Update node parameters → Updates sync
- ✅ User presence → Shows all online users
- ✅ Copy workspace ID → Copies to clipboard
- ✅ Connection status → Shows "Connected" when active

## 📋 Setup Requirements

### Environment Variables
Create `frontend/.env` file:
```env
REACT_APP_LIVEBLOCKS_PUBLIC_KEY=pk_your_public_api_key_here
REACT_APP_API_URL=http://localhost:5000
```

**Note:** 
- Port 3000 = React frontend (Create React App dev server)
- Port 5000 = Flask backend API (for compute functionality, optional)
- `REACT_APP_API_URL` is the URL the React app uses to call the backend API
- Liveblocks collaboration works without the backend (frontend-only)

### Liveblocks Account
- Sign up at [liveblocks.io](https://liveblocks.io)
- Get public API key from dashboard
- Free tier supports up to 20,000 monthly active users

## 📚 Documentation

- Updated `README.md` with comprehensive setup instructions
- Added troubleshooting guide for common issues
- Included testing instructions for single and multiplayer scenarios

## 🔒 Security Notes

- Public API key is safe to share (it's public by design)
- For production, consider using authentication endpoint with secret key
- Workspace IDs are shareable - users must share IDs to collaborate

## 🚀 Deployment Notes

- Environment variables must be set in production environment
- Liveblocks free tier is sufficient for development/testing
- No backend changes required for collaboration (frontend-only feature)
- Frontend runs on port 3000, backend (optional) runs on port 5000
- Collaboration works with just the frontend - backend only needed for compute functionality

## 📸 Screenshots/Demo

[Add screenshots or demo video showing multiplayer collaboration in action]

## 🔗 Related

- Implements collaboration feature from project roadmap
- Enables real-time collaborative design workflows
- Foundation for future features (cursor positions, viewport sync, etc.)

## ✅ Checklist

- [x] Real-time node/edge synchronization working
- [x] User presence indicators functional
- [x] Workspace ID copy-to-clipboard implemented
- [x] Connection status indicators working
- [x] Workspace-based routing implemented
- [x] Error handling and edge cases covered
- [x] Documentation updated
- [x] Tested in regular and incognito modes
- [x] Tested across different computers

## 🎉 Impact

This PR enables true multiplayer collaboration for Grasshopper scripts, making it possible for teams to work together in real-time on the same design. This is a core feature that differentiates our product and enables collaborative design workflows.
