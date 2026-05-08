import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLiveCursors } from '../../hooks/useLiveCursors';

/**
 * LiveCursors - Component for rendering live cursors from other users
 * 
 * @param {Object} props
 * @param {HTMLElement} props.container - Container element to track cursors relative to
 * @param {boolean} props.enabled - Whether cursor tracking is enabled
 */
export function LiveCursors({ container, enabled = true }) {
  const { otherCursors } = useLiveCursors({ container, enabled });

  if (!enabled || otherCursors.length === 0) {
    return null;
  }

  return (
    <>
      {otherCursors.map(({ connectionId, user, cursor, color }) => (
        <Box
          key={connectionId}
          sx={{
            position: 'absolute',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor pointer */}
          <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `8px solid ${color}`,
              position: 'relative',
            }}
          />
          {/* User name label */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 0,
              backgroundColor: color,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {user.name || `User ${String(connectionId).slice(0, 4)}`}
          </Box>
        </Box>
      ))}
    </>
  );
}

/**
 * LiveCursorsContainer - Wrapper component that provides container ref
 * Use this when you need to track cursors within a specific container
 */
export function LiveCursorsContainer({ children, enabled = true, className, style }) {
  const containerRef = React.useRef(null);
  const [container, setContainer] = React.useState(null);
  
  // Update container state when ref is set
  React.useEffect(() => {
    if (containerRef.current) {
      setContainer(containerRef.current);
    }
  }, []);

  const { otherCursors, myCursor, othersCount } = useLiveCursors({ container, enabled });

  return (
    <Box
      ref={containerRef}
      className={className}
      style={{ position: 'relative', ...style }}
      sx={{ position: 'relative' }}
    >
      {children}
      {enabled && otherCursors.length > 0 && (
        <LiveCursors container={container} enabled={enabled} />
      )}
      {/* Debug indicator - remove in production */}
      {enabled && process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            zIndex: 2000,
            pointerEvents: 'none',
            fontFamily: 'monospace',
            minWidth: '180px',
          }}
        >
          <div>👥 Room: {othersCount} user(s)</div>
          <div>🖱️ With cursors: {otherCursors.length}</div>
          <div>My cursor: {myCursor ? '✓' : '✗'}</div>
          <div>Container: {container ? '✓' : '✗'}</div>
          {otherCursors.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#4ade80' }}>
              ✓ Live cursors active!
            </div>
          )}
          {othersCount > 0 && otherCursors.length === 0 && (
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#fbbf24' }}>
              ⚠ Users connected, cursors not active yet
            </div>
          )}
        </Box>
      )}
    </Box>
  );
}

