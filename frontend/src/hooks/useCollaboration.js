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

