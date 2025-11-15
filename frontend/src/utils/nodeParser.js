/**
 * Parser utility for converting Grasshopper component JSON data to React Flow format
 * Based on the actual GH Components database structure
 */

/**
 * Parses a single Grasshopper component and converts it to React Flow node format
 * @param {Object} ghComponent - Grasshopper component object from the database
 * @param {number|string} instanceId - Unique instance ID for this node placement
 * @param {Object} position - Optional position {x, y} for the node
 * @returns {Object} React Flow node object
 */
export const parseGrasshopperComponent = (ghComponent, instanceId, position = null) => {
  // Parse inputs from the component structure
  const inputHandles = ghComponent.Inputs 
    ? ghComponent.Inputs.map((input, idx) => ({
        id: `input-${idx}`,
        name: input.Name,
        nickname: input.Nickname,
        description: input.Description,
        typeName: input.TypeName,
        type: 'target'
      }))
    : [];

  // Parse outputs from the component structure
  const outputHandles = ghComponent.Outputs
    ? ghComponent.Outputs.map((output, idx) => ({
        id: `output-${idx}`,
        name: output.Name,
        nickname: output.Nickname,
        description: output.Description,
        typeName: output.TypeName,
        type: 'source'
      }))
    : [];

  // Auto-position if not provided
  const nodePosition = position || {
    x: 250 * (instanceId % 4),
    y: 150 * Math.floor(instanceId / 4)
  };

  return {
    id: `node-${instanceId}`,
    type: 'grasshopperNode',
    position: nodePosition,
    data: {
      guid: ghComponent.Guid,
      name: ghComponent.Name || 'Unnamed Component',
      nickname: ghComponent.Nickname || ghComponent.Name,
      category: ghComponent.Category,
      subCategory: ghComponent.SubCategory,
      inputs: inputHandles,
      outputs: outputHandles
    }
  };
};

/**
 * Parses an array of Grasshopper component instances
 * @param {Array} componentInstances - Array of objects with {component, instanceId, position}
 * @returns {Array} Array of React Flow nodes
 */
export const parseComponentInstances = (componentInstances) => {
  if (!Array.isArray(componentInstances)) {
    console.error('Expected an array of component instances');
    return [];
  }

  return componentInstances.map((instance) => {
    const { component, instanceId, position } = instance;
    
    // Check if this is an interactive node (has a 'type' field that's not grasshopperNode)
    const interactiveNodeTypes = ['numberSlider', 'panel', 'booleanToggle', 'button', 'numberInput'];
    
    if (component.type && interactiveNodeTypes.includes(component.type)) {
      // For interactive nodes, create a node directly without parsing as Grasshopper component
      const nodePosition = position || {
        x: 250 * (instanceId % 4),
        y: 150 * Math.floor(instanceId / 4)
      };
      
      return {
        id: `node-${instanceId}`,
        type: component.type,
        position: nodePosition,
        data: {
          ...component,
          id: `node-${instanceId}`
        }
      };
    }
    
    // For standard Grasshopper components, use the existing parser
    return parseGrasshopperComponent(component, instanceId, position);
  });
};

/**
 * Finds a component by GUID from the components database
 * @param {Array} componentsDatabase - Array of all available components
 * @param {string} guid - The GUID of the component to find
 * @returns {Object|null} The component object or null if not found
 */
export const findComponentByGuid = (componentsDatabase, guid) => {
  if (!Array.isArray(componentsDatabase)) {
    return null;
  }
  return componentsDatabase.find(comp => comp.Guid === guid) || null;
};

/**
 * Finds a component by name (case-insensitive partial match)
 * @param {Array} componentsDatabase - Array of all available components
 * @param {string} name - The name or nickname to search for
 * @returns {Array} Array of matching components
 */
export const searchComponentsByName = (componentsDatabase, name) => {
  if (!Array.isArray(componentsDatabase) || !name) {
    return [];
  }
  
  const searchTerm = name.toLowerCase();
  return componentsDatabase.filter(comp => 
    comp.Name?.toLowerCase().includes(searchTerm) ||
    comp.Nickname?.toLowerCase().includes(searchTerm)
  );
};

/**
 * Parses connections/edges between nodes
 * @param {Array} connections - Array of connection objects 
 *   {sourceNodeId, sourceHandleIndex, targetNodeId, targetHandleIndex}
 * @returns {Array} Array of React Flow edges
 */
export const parseConnections = (connections) => {
  if (!Array.isArray(connections)) {
    return [];
  }

  return connections.map((conn, index) => ({
    id: `edge-${index}`,
    source: conn.sourceNodeId,
    sourceHandle: `output-${conn.sourceHandleIndex || 0}`,
    target: conn.targetNodeId,
    targetHandle: `input-${conn.targetHandleIndex || 0}`,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#b1b1b7', strokeWidth: 2 }
  }));
};

/**
 * Main parser function that processes a Grasshopper graph with component instances
 * @param {Object} graphData - Complete graph data
 *   {componentInstances: [], connections: []}
 * @returns {Object} Object containing nodes and edges for React Flow
 */
export const parseGrasshopperGraph = (graphData) => {
  const nodes = parseComponentInstances(graphData.componentInstances || []);
  const edges = parseConnections(graphData.connections || []);

  return { nodes, edges };
};

/**
 * Loads the complete components database
 * @param {Object} databaseJson - The complete GH components database JSON
 * @returns {Object} Processed database with helper methods
 */
export const loadComponentsDatabase = (databaseJson) => {
  const components = databaseJson?.Components || [];
  
  return {
    components,
    count: components.length,
    exportedAt: databaseJson?.ExportedAt,
    
    // Helper methods
    findByGuid: (guid) => findComponentByGuid(components, guid),
    searchByName: (name) => searchComponentsByName(components, name),
    
    // Get all categories
    getCategories: () => {
      const categories = new Set();
      components.forEach(comp => {
        if (comp.Category) categories.add(comp.Category);
      });
      return Array.from(categories).sort();
    },
    
    // Get subcategories for a category
    getSubCategories: (category) => {
      const subCategories = new Set();
      components.forEach(comp => {
        if (comp.Category === category && comp.SubCategory) {
          subCategories.add(comp.SubCategory);
        }
      });
      return Array.from(subCategories).sort();
    },
    
    // Filter by category
    filterByCategory: (category) => {
      return components.filter(comp => comp.Category === category);
    }
  };
};
