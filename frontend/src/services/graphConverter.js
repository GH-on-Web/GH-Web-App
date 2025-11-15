/**
 * graphConverter - Converts React Flow graph to backend-compatible JSON
 */

/**
 * Convert React Flow nodes and edges to graph definition format
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Object} Graph definition for backend
 */
export function convertToGraphDefinition(nodes, edges) {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data.label || node.type,
        inputs: node.data.inputs || {},
        outputs: node.data.outputs || {},
      },
    })),
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

