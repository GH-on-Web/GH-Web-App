import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

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
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
}));

export default useWorkspaceStore;
