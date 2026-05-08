import { useOthers, useSelf, useUpdateMyPresence } from '@liveblocks/react';
import { useEffect } from 'react';
import React from 'react';

/**
 * useLiveCursors - Hook for managing live cursor tracking
 * Uses presence to track cursor positions in real-time
 * Must be used within a RoomProvider context
 * 
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element to track cursor relative to
 * @param {boolean} options.enabled - Whether cursor tracking is enabled
 * @returns {Object} Cursor state and functions
 */
export function useLiveCursors({ container = null, enabled = true } = {}) {
  const others = useOthers();
  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();
  
  // Get current presence cursor position
  const myCursor = self?.presence?.cursor || null;
  
  // Debug logging in development (throttled)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enabled) {
      const othersWithCursors = others.filter(o => o.presence?.cursor).length;
      // Only log when values change significantly
      if (othersWithCursors > 0 || others.length > 0) {
        console.log('[LiveCursors] Room:', others.length, 'others |', othersWithCursors, 'with cursors | Container:', !!container, '| My cursor:', !!myCursor);
      }
    }
  }, [others.length, container, enabled]);
  
  // Get other users' cursors
  const otherCursors = others
    .filter(other => other.presence?.cursor)
    .map(other => {
      const connectionIdStr = String(other.connectionId);
      return {
        connectionId: other.connectionId,
        user: { 
          name: other.presence?.name || `User ${connectionIdStr.slice(0, 4)}` 
        },
        cursor: other.presence.cursor,
        color: other.presence.color || getColorForConnectionId(connectionIdStr),
      };
    });

  // Function to update own cursor position
  const updateMyCursor = React.useCallback((cursor) => {
    const currentPresence = self?.presence || {};
    updateMyPresence({
      ...currentPresence,
      cursor: cursor ? { x: cursor.x, y: cursor.y } : null,
    });
  }, [self?.presence, updateMyPresence]);

  // Function to set user info (name, color, etc.)
  const setUserInfo = (userInfo) => {
    const currentPresence = self?.presence || {};
    updateMyPresence({
      ...currentPresence,
      ...userInfo,
    });
  };

  // Track mouse movement with throttling
  useEffect(() => {
    if (!enabled || !container) return;

    let rafId = null;
    let lastUpdateTime = 0;
    const throttleMs = 50; // Update at most every 50ms (20fps)

    const handleMouseMove = (e) => {
      if (!container) return;
      
      const now = Date.now();
      if (now - lastUpdateTime < throttleMs) {
        // Throttle updates
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          updateMyCursor({ x, y });
          lastUpdateTime = Date.now();
        });
        return;
      }
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateMyCursor({ x, y });
      lastUpdateTime = now;
    };

    const handleMouseLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      updateMyCursor(null);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [container, enabled, updateMyCursor]);

  return {
    myCursor,
    otherCursors,
    othersCount: others.length, // Total users in room
    updateMyCursor,
    setUserInfo,
  };
}

/**
 * Generate a consistent color for a connection ID
 */
function getColorForConnectionId(connectionId) {
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  
  // Simple hash function to get consistent color per connection
  const connectionIdStr = String(connectionId);
  let hash = 0;
  for (let i = 0; i < connectionIdStr.length; i++) {
    hash = connectionIdStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

