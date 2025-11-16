/**
 * Connection management utility for Grasshopper node graphs
 * Handles connections between component instances separately from the component definitions
 */

/**
 * Creates a new connection between two nodes
 * @param {string} sourceNodeId - ID of the source node
 * @param {number} sourceHandleIndex - Index of the output handle
 * @param {string} targetNodeId - ID of the target node
 * @param {number} targetHandleIndex - Index of the input handle
 * @returns {Object} Connection object
 */
export const createConnection = (sourceNodeId, sourceHandleIndex, targetNodeId, targetHandleIndex) => {
  return {
    sourceNodeId,
    sourceHandleIndex,
    targetNodeId,
    targetHandleIndex
  };
};

/**
 * Validates a connection between two component instances
 * @param {Object} sourceNode - Source React Flow node
 * @param {number} sourceHandleIndex - Index of the output handle
 * @param {Object} targetNode - Target React Flow node
 * @param {number} targetHandleIndex - Index of the input handle
 * @returns {Object} {valid: boolean, error: string}
 */
export const validateConnection = (sourceNode, sourceHandleIndex, targetNode, targetHandleIndex) => {
  // Check if nodes exist
  if (!sourceNode || !targetNode) {
    return { valid: false, error: 'Source or target node not found' };
  }

  // Check if output exists
  const sourceOutput = sourceNode.data.outputs?.[sourceHandleIndex];
  if (!sourceOutput) {
    return { valid: false, error: 'Source output not found' };
  }

  // Check if input exists
  const targetInput = targetNode.data.inputs?.[targetHandleIndex];
  if (!targetInput) {
    return { valid: false, error: 'Target input not found' };
  }

  // Type compatibility check (can be enhanced later)
  // For now, just check if types exist
  if (sourceOutput.typeName && targetInput.typeName) {
    // Could add more sophisticated type checking here
    // For now, accept all connections
  }

  return { valid: true, error: null };
};

/**
 * Connection manager class for handling graph connections
 */
export class ConnectionManager {
  constructor() {
    this.connections = [];
  }

  /**
   * Add a new connection
   * @param {Object} connection - Connection object
   * @returns {boolean} Success status
   */
  addConnection(connection) {
    // Check for duplicate
    const exists = this.connections.some(c => 
      c.sourceNodeId === connection.sourceNodeId &&
      c.sourceHandleIndex === connection.sourceHandleIndex &&
      c.targetNodeId === connection.targetNodeId &&
      c.targetHandleIndex === connection.targetHandleIndex
    );

    if (!exists) {
      this.connections.push(connection);
      return true;
    }
    return false;
  }

  /**
   * Remove a connection
   * @param {string} sourceNodeId - Source node ID
   * @param {number} sourceHandleIndex - Source handle index
   * @param {string} targetNodeId - Target node ID
   * @param {number} targetHandleIndex - Target handle index
   * @returns {boolean} Success status
   */
  removeConnection(sourceNodeId, sourceHandleIndex, targetNodeId, targetHandleIndex) {
    const initialLength = this.connections.length;
    this.connections = this.connections.filter(c => 
      !(c.sourceNodeId === sourceNodeId &&
        c.sourceHandleIndex === sourceHandleIndex &&
        c.targetNodeId === targetNodeId &&
        c.targetHandleIndex === targetHandleIndex)
    );
    return this.connections.length < initialLength;
  }

  /**
   * Get all connections for a specific node
   * @param {string} nodeId - Node ID
   * @returns {Object} {incoming: [], outgoing: []}
   */
  getNodeConnections(nodeId) {
    return {
      incoming: this.connections.filter(c => c.targetNodeId === nodeId),
      outgoing: this.connections.filter(c => c.sourceNodeId === nodeId)
    };
  }

  /**
   * Get all connections
   * @returns {Array} All connections
   */
  getAllConnections() {
    return [...this.connections];
  }

  /**
   * Clear all connections
   */
  clearAll() {
    this.connections = [];
  }

  /**
   * Import connections from array
   * @param {Array} connections - Array of connection objects
   */
  importConnections(connections) {
    if (Array.isArray(connections)) {
      this.connections = [...connections];
    }
  }

  /**
   * Export connections to JSON
   * @returns {string} JSON string of connections
   */
  exportToJSON() {
    return JSON.stringify(this.connections, null, 2);
  }

  /**
   * Import connections from JSON
   * @param {string} jsonString - JSON string of connections
   * @returns {boolean} Success status
   */
  importFromJSON(jsonString) {
    try {
      const connections = JSON.parse(jsonString);
      if (Array.isArray(connections)) {
        this.connections = connections;
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import connections:', e);
      return false;
    }
  }

  /**
   * Remove all connections related to a specific node
   * @param {string} nodeId - Node ID to remove connections for
   */
  removeNodeConnections(nodeId) {
    this.connections = this.connections.filter(c => 
      c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );
  }

  /**
   * Get connection statistics
   * @returns {Object} Statistics about connections
   */
  getStats() {
    const nodes = new Set();
    this.connections.forEach(c => {
      nodes.add(c.sourceNodeId);
      nodes.add(c.targetNodeId);
    });

    return {
      totalConnections: this.connections.length,
      connectedNodes: nodes.size,
      avgConnectionsPerNode: nodes.size > 0 ? this.connections.length / nodes.size : 0
    };
  }
}

/**
 * Convert React Flow connection event to our connection format
 * @param {Object} reactFlowConnection - React Flow connection object
 * @returns {Object} Our connection format
 */
export const convertReactFlowConnection = (reactFlowConnection) => {
  // Extract handle index from handle ID (e.g., "output-2" -> 2)
  const sourceIndex = parseInt(reactFlowConnection.sourceHandle?.split('-')[1] || '0');
  const targetIndex = parseInt(reactFlowConnection.targetHandle?.split('-')[1] || '0');

  return createConnection(
    reactFlowConnection.source,
    sourceIndex,
    reactFlowConnection.target,
    targetIndex
  );
};
