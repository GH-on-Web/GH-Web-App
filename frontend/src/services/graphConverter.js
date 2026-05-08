/**
 * graphConverter - Converts React Flow graph to backend-compatible JSON
 */

/**
 * Resolve node connections - when a node input is connected, use the source node's output
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Array} Nodes with resolved connections
 */
function resolveConnections(nodes, edges) {
  // Create a map of node outputs for quick lookup
  const nodeOutputs = new Map();
  nodes.forEach((node) => {
    if (node.type === 'point') {
      // Point node outputs its coordinates - get current values from inputs
      // Parse coordinates, handling both number and string types
      // Round to avoid floating point precision issues
      const x = Math.round((typeof node.data.inputs?.x === 'number' ? node.data.inputs.x : (parseFloat(node.data.inputs?.x) || 0)) * 1000) / 1000;
      const y = Math.round((typeof node.data.inputs?.y === 'number' ? node.data.inputs.y : (parseFloat(node.data.inputs?.y) || 0)) * 1000) / 1000;
      const z = Math.round((typeof node.data.inputs?.z === 'number' ? node.data.inputs.z : (parseFloat(node.data.inputs?.z) || 0)) * 1000) / 1000;
      
      nodeOutputs.set(node.id, {
        point: { x, y, z },
      });
      
      console.log(`Point node ${node.id} outputs:`, { x, y, z });
    } else if (node.type === 'number') {
      // Number node outputs its value
      const value = typeof node.data.inputs?.value === 'number' 
        ? node.data.inputs.value 
        : (parseFloat(node.data.inputs?.value) || 0);
      nodeOutputs.set(node.id, {
        number: value,
      });
    }
  });

  // Create a map of edges by target node and handle
  const edgeMap = new Map();
  edges.forEach((edge) => {
    const key = `${edge.target}:${edge.targetHandle}`;
    edgeMap.set(key, edge);
    console.log(`Edge: ${edge.source}:${edge.sourceHandle} -> ${edge.target}:${edge.targetHandle}`);
  });

  // Resolve connections for each node
  return nodes.map((node) => {
    const resolvedInputs = { ...(node.data.inputs || {}) };

    // Check each input handle for connections
    if (node.type === 'circle') {
      // Check if center input is connected
      const centerEdge = edgeMap.get(`${node.id}:center`);
      if (centerEdge) {
        const sourceNode = nodes.find((n) => n.id === centerEdge.source);
        console.log(`Circle ${node.id} center connected to:`, sourceNode?.type, sourceNode?.id);
        
        if (sourceNode && sourceNode.type === 'point') {
          // Use the connected point's coordinates as center
          const pointOutput = nodeOutputs.get(centerEdge.source);
          if (pointOutput && pointOutput.point) {
            const { x, y, z } = pointOutput.point;
            
            // Set center coordinates in multiple formats for backend compatibility
            // Most backends expect center as an array [x, y, z] or object {x, y, z}
            // Format 1: Array [x, y, z] (most common for coordinate data in geometry libraries)
            resolvedInputs.center = [x, y, z];
            // Format 2: Object {x, y, z}
            resolvedInputs.centerPoint = { x, y, z };
            // Format 3: Individual fields (some backends look for these)
            resolvedInputs.centerX = x;
            resolvedInputs.centerY = y;
            resolvedInputs.centerZ = z;
            // Format 4: Direct x, y, z in inputs (in case backend looks for these directly)
            resolvedInputs.x = x;
            resolvedInputs.y = y;
            resolvedInputs.z = z;
            
            console.log(`Circle ${node.id} center resolved to:`, { x, y, z });
            console.log(`Circle ${node.id} center array:`, resolvedInputs.center);
            console.log(`Circle ${node.id} full inputs:`, resolvedInputs);
          }
        }
      } else {
        console.log(`Circle ${node.id} center not connected`);
      }

      // Check if radius input is connected (if we add number node connections later)
      const radiusEdge = edgeMap.get(`${node.id}:radius`);
      if (radiusEdge) {
        const sourceNode = nodes.find((n) => n.id === radiusEdge.source);
        if (sourceNode && sourceNode.type === 'number') {
          const numberOutput = nodeOutputs.get(radiusEdge.source);
          if (numberOutput && numberOutput.number !== undefined) {
            resolvedInputs.radius = numberOutput.number;
            console.log(`Circle ${node.id} radius connected to number:`, numberOutput.number);
          }
        }
      }
    }

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data.label || node.type,
        inputs: resolvedInputs,
        outputs: node.data.outputs || {},
      },
    };
  });
}

/**
 * Convert React Flow nodes and edges to graph definition format
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Object} Graph definition for backend
 */
export function convertToGraphDefinition(nodes, edges) {
  // Resolve connections before sending to backend
  const resolvedNodes = resolveConnections(nodes, edges);

  // Log the final graph definition for debugging
  console.log('Final graph definition:', JSON.stringify({
    nodes: resolvedNodes.map(n => ({
      id: n.id,
      type: n.type,
      inputs: n.data.inputs
    })),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    }))
  }, null, 2));

  return {
    nodes: resolvedNodes,
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    })),
  };
}

/**
 * Convert graph definition to React Flow format
 * @param {Object} graphDefinition - Graph definition from backend
 * @returns {Object} React Flow nodes and edges
 */
export function convertFromGraphDefinition(graphDefinition) {
  return {
    nodes: graphDefinition.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data.label,
        inputs: node.data.inputs,
        outputs: node.data.outputs,
      },
    })),
    edges: graphDefinition.edges,
  };
}

