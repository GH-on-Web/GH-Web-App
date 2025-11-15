/**
 * Parser utility for converting Grasshopper component JSON data to React Flow format
 * Based on the actual GH Components database structure
 */

/**
 * Maps Grasshopper component GUIDs to interactive node types
 */
const INTERACTIVE_NODE_MAPPING = {
  '57da07bd-ecab-415d-9d86-af36d7073abc': 'numberSlider', // Number Slider
  '59e0b89a-e487-49f8-bab8-b5bab16be14c': 'panel',        // Panel
  '2e78987b-9dfb-42a2-8b76-3923ac8bd91a': 'booleanToggle', // Boolean Toggle
  'a8b97322-2d53-47cd-905e-b932c3ccd74e': 'button',       // Button
  '3e8ca6be-fda8-4aaf-b5c0-3c54c8bb7312': 'numberInput'   // Number
};

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
 * Parses simplified JSON format (Test-Script-1.json style)
 * Uses GUID to look up component from database and extract only needed info
 * @param {Object} simplifiedData - {nodes: [], links: []}
 * @param {Array} componentsDatabase - Array of all available components from gh_components_native.json
 * @returns {Object} Object containing nodes and edges for React Flow
 */
export const parseSimplifiedGraph = (simplifiedData, componentsDatabase) => {
  if (!simplifiedData?.nodes || !Array.isArray(simplifiedData.nodes)) {
    console.error('Invalid simplified graph data');
    return { nodes: [], edges: [] };
  }

  const nodes = simplifiedData.nodes.map(nodeData => {
    const { id, guid, nickname, x, y, properties } = nodeData;
    const position = { x: x || 0, y: y || 0 };
    
    // Check if this is an interactive node type
    const interactiveType = INTERACTIVE_NODE_MAPPING[guid];
    
    if (interactiveType) {
      // Create interactive node
      return createInteractiveNodeFromSimplified(id, guid, nickname, position, properties, interactiveType);
    }
    
    // Look up component from database
    const component = findComponentByGuid(componentsDatabase, guid);
    
    if (!component) {
      console.warn(`Component with GUID ${guid} not found in database`);
      return {
        id: `node-${id}`,
        type: 'grasshopperNode',
        position,
        data: {
          guid,
          name: 'Unknown Component',
          nickname: nickname || 'Unknown',
          category: 'Unknown',
          subCategory: '',
          inputs: [],
          outputs: []
        }
      };
    }
    
    // Parse inputs
    const inputHandles = component.Inputs 
      ? component.Inputs.map((input, idx) => {
          const handle = {
            id: `input-${idx}`,
            name: input.Name,
            nickname: input.Nickname,
            description: input.Description,
            typeName: input.TypeName,
            type: 'target'
          };
          
          // Check if properties has a value for this input
          if (properties && input.Nickname && properties[input.Nickname] !== undefined) {
            handle.value = properties[input.Nickname];
          } else if (properties && input.Name && properties[input.Name] !== undefined) {
            handle.value = properties[input.Name];
          }
          
          return handle;
        })
      : [];

    // Parse outputs
    const outputHandles = component.Outputs
      ? component.Outputs.map((output, idx) => ({
          id: `output-${idx}`,
          name: output.Name,
          nickname: output.Nickname,
          description: output.Description,
          typeName: output.TypeName,
          type: 'source'
        }))
      : [];

    return {
      id: `node-${id}`,
      type: 'grasshopperNode',
      position,
      data: {
        guid: component.Guid,
        name: component.Name,
        nickname: nickname || component.Nickname || component.Name,
        category: component.Category,
        subCategory: component.SubCategory,
        inputs: inputHandles,
        outputs: outputHandles
      }
    };
  });

  // Parse links/connections
  const edges = (simplifiedData.links || []).map((link, index) => {
    const { fromNode, fromParam, toNode, toParam } = link;
    
    // Find source and target nodes to determine handle indices
    const sourceNode = nodes.find(n => n.id === `node-${fromNode}`);
    const targetNode = nodes.find(n => n.id === `node-${toNode}`);
    
    let sourceHandle = `output-${fromParam}`;
    let targetHandle = `input-${toParam}`;
    
    // If fromParam/toParam are strings (parameter names), find the index
    if (sourceNode && isNaN(fromParam)) {
      const outputIndex = sourceNode.data.outputs?.findIndex(
        o => o.nickname === fromParam || o.name === fromParam
      );
      if (outputIndex >= 0) sourceHandle = `output-${outputIndex}`;
    } else if (!isNaN(fromParam)) {
      sourceHandle = `output-${fromParam}`;
    }
    
    if (targetNode && isNaN(toParam)) {
      const inputIndex = targetNode.data.inputs?.findIndex(
        i => i.nickname === toParam || i.name === toParam
      );
      if (inputIndex >= 0) targetHandle = `input-${inputIndex}`;
    } else if (!isNaN(toParam)) {
      targetHandle = `input-${toParam}`;
    }
    
    return {
      id: `edge-${index}`,
      source: `node-${fromNode}`,
      sourceHandle,
      target: `node-${toNode}`,
      targetHandle,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#b1b1b7', strokeWidth: 2 }
    };
  });

  return { nodes, edges };
};

/**
 * Creates an interactive node from simplified format
 */
const createInteractiveNodeFromSimplified = (id, guid, nickname, position, properties, nodeType) => {
  const nodeId = `node-${id}`;
  
  switch (nodeType) {
    case 'numberSlider':
      return {
        id: nodeId,
        type: 'numberSlider',
        position,
        data: {
          id: nodeId,
          nickname: nickname || 'Slider',
          min: properties?.Min || 0,
          max: properties?.Max || 100,
          step: properties?.Step || 1,
          value: properties?.Value || properties?.min || 0
        }
      };
      
    case 'panel':
      return {
        id: nodeId,
        type: 'panel',
        position,
        data: {
          id: nodeId,
          nickname: nickname || 'Panel',
          text: properties?.Text || '',
          isInput: properties?.IsInput || false
        }
      };
      
    case 'booleanToggle':
      return {
        id: nodeId,
        type: 'booleanToggle',
        position,
        data: {
          id: nodeId,
          nickname: nickname || 'Toggle',
          value: properties?.Value || false
        }
      };
      
    case 'button':
      return {
        id: nodeId,
        type: 'button',
        position,
        data: {
          id: nodeId,
          nickname: nickname || 'Button'
        }
      };
      
    case 'numberInput':
      return {
        id: nodeId,
        type: 'numberInput',
        position,
        data: {
          id: nodeId,
          nickname: nickname || 'Number',
          value: properties?.Value || 0
        }
      };
      
    default:
      return null;
  }
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
