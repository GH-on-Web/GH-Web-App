import { useStorage, useMutation, useOthers, useStatus } from '@liveblocks/react';

/**
 * useCollaboration - Hook for managing Liveblocks collaboration
 * Must be used within a RoomProvider context
 * @returns {Object} Collaboration state and functions
 */
export function useCollaboration() {
  const status = useStatus();
  const others = useOthers();
  
  // Get nodes and edges from Liveblocks storage
  // useStorage can return undefined initially, so we handle that
  const storageRoot = useStorage((root) => root);
  const nodes = storageRoot?.nodes ?? [];
  const edges = storageRoot?.edges ?? [];
  
  // Mutation to update nodes
  const updateNodes = useMutation(({ storage }, newNodes) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }
    storage.set('nodes', newNodes);
  }, []);
  
  // Mutation to update edges
  const updateEdges = useMutation(({ storage }, newEdges) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }
    storage.set('edges', newEdges);
  }, []);
  
  // Check connection status from status object
  const isConnected = status === 'connected';
  
  return {
    connectionStatus: status,
    others,
    isConnected,
    nodes: Array.isArray(nodes) ? nodes : [],
    edges: Array.isArray(edges) ? edges : [],
    updateNodes,
    updateEdges,
  };
}

/**
 * useGraphCollaboration - Hook for managing graph data collaboration (NodeParserDemo)
 * Handles the simplified graph format with nodes and links
 * @returns {Object} Collaboration state and functions
 */
export function useGraphCollaboration() {
  const status = useStatus();
  const others = useOthers();
  
  // Get graph data from Liveblocks storage
  const storageRoot = useStorage((root) => root);
  const graphData = storageRoot?.graphData ?? { nodes: [], links: [] };
  
  // Mutation to update entire graph data
  const updateGraphData = useMutation(({ storage }, newGraphData) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }
    storage.set('graphData', newGraphData);
  }, []);
  
  // Mutation to update just nodes
  const updateGraphNodes = useMutation(({ storage }, newNodes) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }
    const currentData = storage.get('graphData') || { nodes: [], links: [] };
    storage.set('graphData', {
      ...currentData,
      nodes: newNodes
    });
  }, []);
  
  // Mutation to update just links
  const updateGraphLinks = useMutation(({ storage }, newLinks) => {
    if (!storage) {
      console.error('Storage not available');
      return;
    }
    const currentData = storage.get('graphData') || { nodes: [], links: [] };
    storage.set('graphData', {
      ...currentData,
      links: newLinks
    });
  }, []);
  
  const isConnected = status === 'connected';
  
  return {
    connectionStatus: status,
    others,
    isConnected,
    graphData: graphData || { nodes: [], links: [] },
    updateGraphData,
    updateGraphNodes,
    updateGraphLinks,
  };
}

