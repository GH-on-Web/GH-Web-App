# Backend Compute Gateway

This backend serves as a gateway between the frontend and Rhino Compute, handling authentication and providing specialized endpoints for Grasshopper functionality.

## Environment Setup

Copy `.env.example` to `.env` (or set the same variables in your environment). The backend expects:

- `RHINO_COMPUTE_URL` – the full base URL for the local Rhino Compute server (e.g., `http://localhost:5000`)
- `RHINO_COMPUTE_KEY` – optional API key/token for your compute instance
- `PORT` – optional port override (defaults to `4001`)

Once the variables are set, install dependencies and start the server:

```bash
npm install
npm run dev     # development with hot reload (nodemon)
npm start       # production mode
```

## Available Endpoints

### Core Endpoints

**`GET /health/alive`**
- Health check endpoint
- Returns server status

**`GET /version`**
- Forwards to Rhino Compute `/version`
- Returns Rhino and Compute version info

### Grasshopper Endpoints

**`POST /grasshopper/upload`**
- Upload a .gh file to get a cached pointer
- Body: `{ algo: "base64_gh_file", fileName: "definition.gh" }`
- Returns: `{ pointer: "cache_key" }`

**`POST /grasshopper/solve`**
- Solve a Grasshopper definition
- Body (with base64):
  ```json
  {
    "algo": "base64_gh_file",
    "pointer": null,
    "fileName": "definition.gh",
    "values": [],
    "cachesolve": true
  }
  ```
- Body (with cached pointer):
  ```json
  {
    "algo": null,
    "pointer": "cache_key",
    "values": [...]
  }
  ```
- Returns: Grasshopper solve results

### Utility Endpoints

**`POST /gh-to-json`**
- Convert .gh file to JSON using compute-gh-to-json.gh script
- Body: `{ ghFileBase64: "base64_gh_file", fileName: "file.gh" }`
- Returns: JSON representation from Grasshopper script output

**`POST /json-to-gh`**
- Convert JSON to .gh using compute-json-to-gh.gh script
- Body: Your JSON definition
- Returns: Grasshopper script results

**`POST /test-script`**
- Run test-script.gh with optional parameters
- Body (optional):
  ```json
  {
    "values": [
      {
        "ParamName": "Number 1",
        "InnerTree": { "{0}": [{ "type": "System.Double", "data": "5.0" }] }
      }
    ]
  }
  ```
- Returns: Solve results from test-script.gh

## Architecture

All Grasshopper endpoints:
1. Load .gh files from `src/scripts/` and convert to base64
2. Build standardized Grasshopper solve payloads
3. Send to Rhino Compute `/grasshopper` endpoint
4. Return results to frontend

This ensures consistent base64 handling and proper parameter formatting across all endpoints.

### Scripts Directory

The `src/scripts/` directory contains:
- `compute-gh-to-json.gh` - Grasshopper script for parsing .gh files to JSON
- `compute-json-to-gh.gh` - Grasshopper script for converting JSON to .gh files
- `test-script.gh` - Test Grasshopper definition for the `/test-script` endpoint

These scripts are loaded at runtime, encoded to base64, and sent to Rhino Compute as needed.
