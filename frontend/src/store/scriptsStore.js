import { create } from 'zustand';

// Scripts store holds metadata for Grasshopper Hops (.gh) scripts.
// In a full setup, you would fetch this metadata from a backend that can
// inspect .gh files via Rhino Compute / Hops.

const initialScripts = [
  {
    id: 'sample-box',
    name: 'Sample Box',
    fileName: 'SampleBox.gh',
    path: '/gh-scripts/SampleBox.gh',
    inputs: [
      { name: 'Width', type: 'number' },
      { name: 'Depth', type: 'number' },
      { name: 'Height', type: 'number' },
    ],
    outputs: [
      { name: 'Mesh', type: 'mesh' },
    ],
  },
];

const useScriptsStore = create((set, get) => ({
  scripts: initialScripts,
  selectedScriptId: null,

  selectScript: (id) => set({ selectedScriptId: id }),

  // Placeholder for future integration with a backend / Rhino Compute.
  // You could replace this with an async call that returns parsed
  // metadata for all .gh files.
  loadScripts: (scripts) => {
    if (Array.isArray(scripts) && scripts.length > 0) {
      set({ scripts });
    }
  },
}));

export default useScriptsStore;
