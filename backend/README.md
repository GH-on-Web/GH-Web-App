# GH-Web-App Backend

Flask backend for geometry computation using rhino3dm.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running

Start the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5000`

## API Endpoints

### GET /api/health
Health check endpoint.

### POST /api/compute
Compute geometry from graph definition.

**Request:**
```json
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "settings": { "tolerance": 0.01 }
}
```

**Response:**
```json
{
  "geometry": [{
    "type": "mesh",
    "vertices": [[x, y, z], ...],
    "faces": [[i, j, k], ...]
  }],
  "errors": []
}
```

## Development

- `app.py` - Main Flask application
- `compute/converter.py` - Graph to script conversion
- `compute/executor.py` - Geometry execution

