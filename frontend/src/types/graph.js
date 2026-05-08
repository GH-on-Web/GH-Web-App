/**
 * Graph data structure definitions
 */

/**
 * Node definition structure
 * @typedef {Object} GraphNode
 * @property {string} id - Unique node identifier
 * @property {string} type - Node type (e.g., 'point', 'circle')
 * @property {Object} position - Node position {x, y}
 * @property {Object} data - Node data
 * @property {Object} data.inputs - Input values
 * @property {Object} data.outputs - Output values
 * @property {string} data.label - Node label
 */

/**
 * Edge definition structure
 * @typedef {Object} GraphEdge
 * @property {string} id - Unique edge identifier
 * @property {string} source - Source node id
 * @property {string} sourceHandle - Source output handle id
 * @property {string} target - Target node id
 * @property {string} targetHandle - Target input handle id
 */

/**
 * Graph definition structure
 * @typedef {Object} GraphDefinition
 * @property {GraphNode[]} nodes - Array of nodes
 * @property {GraphEdge[]} edges - Array of edges
 */

