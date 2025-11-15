"""
Flask application for GH-Web-App backend
Handles geometry computation requests from the frontend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from compute.converter import convert_graph_to_script
from compute.executor import execute_geometry_script

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend is running'}), 200

@app.route('/api/compute', methods=['POST', 'OPTIONS'])
def compute():
    """
    Compute geometry from graph definition
    
    Request body:
    {
        "graph": {
            "nodes": [...],
            "edges": [...]
        },
        "settings": { "tolerance": 0.01 }
    }
    
    Response:
    {
        "geometry": [{
            "type": "mesh",
            "vertices": [[x, y, z], ...],
            "faces": [[i, j, k], ...]
        }],
        "errors": []
    }
    """
    import sys
    sys.stdout.flush()
    
    print("=" * 50, flush=True)
    print("COMPUTE REQUEST RECEIVED", flush=True)
    print(f"Method: {request.method}", flush=True)
    print("=" * 50, flush=True)
    
    # Handle OPTIONS preflight
    if request.method == 'OPTIONS':
        print("OPTIONS preflight request", flush=True)
        return '', 200
    try:
        import sys
        print("Getting request JSON...", flush=True)
        sys.stdout.flush()
        data = request.get_json()
        print(f"Request data received: {data is not None}", flush=True)
        sys.stdout.flush()
        
        if not data or 'graph' not in data:
            print("ERROR: Missing graph in request", flush=True)
            sys.stdout.flush()
            return jsonify({
                'geometry': [],
                'errors': ['Invalid request: missing graph definition']
            }), 400
        
        graph = data.get('graph', {})
        settings = data.get('settings', { 'tolerance': 0.01 })
        
        nodes = graph.get('nodes', [])
        edges = graph.get('edges', [])
        print(f"Processing graph with {len(nodes)} nodes and {len(edges)} edges", flush=True)
        sys.stdout.flush()
        
        # Convert graph to Python script
        print("Converting graph to script...", flush=True)
        sys.stdout.flush()
        script = convert_graph_to_script(graph, settings)
        print(f"Script data: nodes={len(script.get('nodes', {}))}, edges={len(script.get('edges', []))}", flush=True)
        sys.stdout.flush()
        
        # Execute script and get geometry
        print("Executing geometry script...", flush=True)
        sys.stdout.flush()
        result = execute_geometry_script(script)
        print(f"Execution complete: {len(result.get('geometry', []))} geometry items, {len(result.get('errors', []))} errors", flush=True)
        sys.stdout.flush()
        
        return jsonify(result), 200
        
    except Exception as e:
        import sys
        import traceback
        print(f"Error in compute endpoint: {str(e)}", flush=True)
        traceback.print_exc()
        sys.stdout.flush()
        return jsonify({
            'geometry': [],
            'errors': [f'Computation error: {str(e)}']
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

