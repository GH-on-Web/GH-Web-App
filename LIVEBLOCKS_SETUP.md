# Liveblocks Setup Instructions

## Quick Start

### 1. Add Your API Key

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
```

Create `.env` file with your Liveblocks public API key:

```env
REACT_APP_LIVEBLOCKS_PUBLIC_KEY=your_public_api_key_here
```

**Important**: Replace `your_public_api_key_here` with your actual public API key from https://liveblocks.io/dashboard

### 2. Start the Development Server

```bash
npm start
```

The app should now connect to Liveblocks!

## How It Works

1. **Create Workspace**: Click "Create Workspace" on the home page
   - Generates a unique workspace ID
   - Opens the workspace in a new URL (e.g., `/workspace/abc123`)

2. **Join Workspace**: Enter a workspace ID to join an existing workspace
   - Share the workspace ID with others
   - All users in the same workspace see real-time updates

3. **Real-Time Collaboration**:
   - Nodes and edges sync automatically across all users
   - See who's online in the status bar
   - Connection status is shown in the toolbar

## Testing Multiplayer

1. Open the app in two browser windows/tabs
2. Create a workspace in window 1
3. Copy the workspace ID from the URL
4. In window 2, go to home page and join with that workspace ID
5. Add nodes/edges in one window → See them appear in the other!

## Troubleshooting

### Connection Issues
- Check that your API key is correct in `.env`
- Restart the dev server after adding/changing `.env`
- Check browser console for errors

### Changes Not Syncing
- Verify both windows are using the same workspace ID
- Check connection status (should show "Connected")
- Refresh both windows if needed

## Next Steps

- Add user presence (show who's editing what)
- Add cursor positions
- Add viewport sync
- Add chat/comments (Liveblocks supports this!)

---

**You're all set! Start collaborating!** 🚀

