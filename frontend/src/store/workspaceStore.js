import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const initialNodes = [
  {
    id: nanoid(),
    position: { x: 0, y: 0 },
    data: { label: 'Node A' },
    sourcePosition: 'right',
    targetPosition: 'left',
  },
  {
    id: nanoid(),
    position: { x: 200, y: 100 },
    data: { label: 'Node B' },
    sourcePosition: 'right',
    targetPosition: 'left',
  },
];

const initialEdges = [];

const useWorkspaceStore = create((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNode: null,
  
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
  
  // Add a new node to the canvas
  addNode: (type, position) => {
    const newNode = {
      id: nanoid(),
      type: type,
      position: position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        inputs: getDefaultInputs(type),
        onChange: (nodeId, inputKey, value) => {
          set({
            nodes: get().nodes.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      inputs: {
                        ...node.data.inputs,
                        [inputKey]: value,
                      },
                    },
                  }
                : node
            ),
          });
        },
      },
    };
    set({ nodes: [...get().nodes, newNode] });
    return newNode;
  },
  
  // Update node data
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },
  
  // Set selected node
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  // Delete selected nodes
  deleteNodes: (nodeIds) => {
    set({
      nodes: get().nodes.filter((node) => !nodeIds.includes(node.id)),
      edges: get().edges.filter(
        (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      ),
    });
  },
}));

// Helper function to get default inputs for node types
function getDefaultInputs(type) {
  switch (type) {
    case 'point':
      return { x: 0, y: 0, z: 0 };
    case 'circle':
      return { radius: 1 };
    case 'number':
      return { value: 0 };
    default:
      return {};
  }
}

export default useWorkspaceStore;
