# GH-Web-App

AECTech 2025 - Grasshopper on the Web - lets gooo

A web-based visual programming interface inspired by Grasshopper 3D, with **real-time multiplayer collaboration** powered by Liveblocks. Multiple users can work on the same Grasshopper script simultaneously in the browser.

## Features

- 🎨 **Visual Node Editor** - Drag-and-drop node-based programming
- 🤝 **Real-Time Collaboration** - Multiple users can edit simultaneously
- 👥 **User Presence** - See who's online and working
- 🔗 **Shareable Workspaces** - Share workspace IDs to collaborate
- 🧮 **Geometry Computation** - Python/Flask backend for geometry processing
- 🎯 **3D Visualization** - Three.js viewer for geometry preview
- 🔷 **Node Parser Component** - Reusable graph visualization system with 2,868+ Grasshopper components

## Tech Stack

### Frontend
- React (Create React App)
- React Flow - Node graph editor
- Material-UI (MUI) - UI components
- Zustand - State management
- Liveblocks - Real-time collaboration
- Three.js - 3D visualization

### Backend
- Python 3.x
- Flask - Web framework
- rhino3dm - Geometry computation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.x
- pip

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GH-Web-App
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Get Liveblocks API Key

1. Sign up for a free account at [https://liveblocks.io](https://liveblocks.io)
2. Go to your dashboard and copy your **Public API Key** (starts with `pk_`)
3. Create a `.env` file in the `frontend` directory:

```bash
cd frontend
```

Create `.env` file with:

```env
REACT_APP_LIVEBLOCKS_PUBLIC_KEY=pk_your_public_api_key_here
REACT_APP_API_URL=http://localhost:5000
```

**Important:**
- Replace `pk_your_public_api_key_here` with your actual public API key
- No quotes around the value
- No spaces around the `=` sign
- The key should start with `pk_`

### 4. Backend Setup (Optional - for compute functionality)

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Application

### Start Frontend

```bash
The app will open at [http://localhost:3000](http://localhost:3000)

### Start Backend (Optional - for compute)

```bash
cd backend
python app.py
```

Backend runs on [http://localhost:5000](http://localhost:5000)

## Testing Multiplayer Collaboration

### Single User Test

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Create Workspace"
3. Add nodes from the sidebar
4. Connect nodes together
5. Check connection status (should show "Connected")

### Multiplayer Test (2+ Users)

**Option 1: Same Computer**
- Open two browser windows
- Create workspace in window 1
- Copy workspace ID from window 1
- Join workspace in window 2 using the workspace ID
- Make changes in one window → See them appear in the other!

**Option 2: Different Computers**
1. **User 1**: Create a workspace and copy the workspace ID (click the workspace ID chip to copy)
2. **User 2**: 
   - Open the app on their computer
   - Click "Join Workspace"
   - Paste the workspace ID
   - Start collaborating!

### What to Test

- ✅ Add nodes in one window → Appears in other windows
- ✅ Move nodes → Syncs in real-time
- ✅ Connect nodes → Edges appear everywhere
- ✅ Update node parameters → Updates sync
- ✅ User presence → See who's online
- ✅ Connection status → Shows "Connected"

### Node Parser Component

The reusable NodeParser component provides visual node-based graph editing:

**Features:**
- Search and add from 2,868+ Grasshopper components
- Create/delete connections between nodes
- Import/Export graph data as JSON
- Drag to reposition with auto-save
- Keyboard shortcuts (Delete, Ctrl+drag)

**Quick Start:**
```javascript
import { NodeParser } from './components/NodeParser';

<NodeParser
  graphData={graphData}
  onConnectionsChange={handleConnectionsChange}
  onNodesChange={handleNodesChange}
  componentsDatabase={components}
/>
```

📖 [Full Documentation](frontend/src/components/NodeParser/README.md)  
💡 [Example Usage](frontend/src/components/NodeParser/examples/)

## Project Structure

```
GH-Web-App/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/          # React Flow canvas
│   │   │   ├── Collaboration/   # User presence, status
│   │   │   ├── Layout/          # App layout
│   │   │   ├── nodes/          # Custom node components
│   │   │   ├── Sidebar/        # Component library
│   │   │   ├── Viewer3D/       # Three.js viewer
│   │   │   └── NodeParser/      # Reusable node parser component
│   │   │       ├── NodeParser.js    # Main canvas component
│   │   │       ├── GrasshopperNode.js
│   │   │       ├── ComponentSearch.js
│   │   │       ├── examples/        # Usage examples
│   │   │       ├── README.md        # Full documentation
│   │   │       └── index.js         # Easy imports
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── utils/
│   │   │   ├── nodeParser.js        # Parsing utilities
│   │   │   └── connectionManager.js # Connection management
│   │   └── store/              # Zustand stores
│   ├── .env                    # Environment variables (create this!)
│   └── package.json
├── backend/
│   ├── app.py                  # Flask server
│   ├── compute/                # Geometry computation
│   └── requirements.txt
└── README.md
```

## Troubleshooting

### "LiveblocksProvider is missing" Error
- Make sure you've added the API key to `frontend/.env`
- Restart the dev server after creating/updating `.env`

### "Invalid Liveblocks client options" Error
- Check that your API key is correct in `.env`
- Verify the key starts with `pk_`
- Make sure there are no quotes or spaces in `.env` file
- Restart the dev server

### Changes Not Syncing
- Verify both users are using the same workspace ID
- Check connection status (should show "Connected")
- Refresh both windows if needed

### Backend Not Connecting
- Make sure backend is running on port 5000
- Check `REACT_APP_API_URL` in `.env` matches your backend URL

## Development Notes

- Environment variables are loaded at server startup - restart after changing `.env`
- Liveblocks public API key is safe to share (it's public!)
- Workspace IDs are shareable - use them to collaborate
- Free tier supports up to 20,000 monthly active users
- NodeParser component is self-contained in `frontend/src/components/NodeParser/`
- All dependencies are clearly documented with integration examples

## Contributing

This is a hackathon project for AECTech 2025. Feel free to contribute!

## License

[Add your license here]

---

**Happy Collaborating!** 🚀
