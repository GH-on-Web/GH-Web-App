import React, { useState, useCallback, useEffect } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

/**
 * AppLayout - Main layout component with expandable sidebars and canvas area
 * Provides the structure: Sidebar (left, expandable) | Canvas (center) | Viewer (right, expandable)
 */
function AppLayout({ sidebar, main, viewer, sidebarWidth = 280, initialViewerWidth = 400 }) {
  const [viewerWidth, setViewerWidth] = useState(initialViewerWidth);
  const [sidebarWidthState, setSidebarWidthState] = useState(sidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isViewerCollapsed, setIsViewerCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleSidebarMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing && !isResizingSidebar) return;
    
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 200;
      const maxWidth = window.innerWidth * 0.6;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setViewerWidth(newWidth);
      }
    }
    
    if (isResizingSidebar) {
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = window.innerWidth * 0.6;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidthState(newWidth);
      }
    }
  }, [isResizing, isResizingSidebar]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsResizingSidebar(false);
  }, []);

  useEffect(() => {
    if (isResizing || isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, isResizingSidebar, handleMouseMove, handleMouseUp]);

  const toggleViewer = useCallback(() => {
    setIsViewerCollapsed(!isViewerCollapsed);
  }, [isViewerCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Left Sidebar - Component Library */}
      {!isSidebarCollapsed && (
        <Paper
          elevation={2}
          sx={{
            width: sidebarWidthState,
            height: '100%',
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minWidth: 200,
            overflow: 'visible',
          }}
        >
          {/* Collapse Button */}
          <IconButton
            size="small"
            onClick={toggleSidebar}
            sx={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          {sidebar}
        </Paper>
      )}
      
      {/* Sidebar Resize Handle */}
      {!isSidebarCollapsed && (
        <Box
          onMouseDown={handleSidebarMouseDown}
          sx={{
            width: '4px',
            cursor: 'col-resize',
            bgcolor: 'divider',
            '&:hover': {
              bgcolor: 'primary.main',
            },
            transition: 'background-color 0.2s',
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}
      
      {/* Collapsed Sidebar State - Show Button */}
      {isSidebarCollapsed && (
        <Box
          sx={{
            width: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <IconButton
            size="small"
            onClick={toggleSidebar}
            sx={{
              transform: 'rotate(0deg)',
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {/* Main Canvas Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0, // Allow shrinking
        }}
      >
        {main}
      </Box>
      
      {/* Right Panel - 3D Viewer (optional) */}
      {viewer && (
        <>
          {/* Resize Handle */}
          {!isViewerCollapsed && (
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                width: '4px',
                cursor: 'col-resize',
                bgcolor: 'divider',
                '&:hover': {
                  bgcolor: 'primary.main',
                },
                transition: 'background-color 0.2s',
                position: 'relative',
                zIndex: 1,
              }}
            />
          )}
          
          {/* Viewer Panel */}
          {!isViewerCollapsed && (
            <Paper
              elevation={2}
              sx={{
                width: viewerWidth,
                flexShrink: 0,
                borderLeft: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                minWidth: 200,
              }}
            >
              {/* Collapse Button */}
              <IconButton
                size="small"
                onClick={toggleViewer}
                sx={{
                  position: 'absolute',
                  left: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
              {viewer}
            </Paper>
          )}
          
          {/* Collapsed State - Show Button */}
          {isViewerCollapsed && (
            <Box
              sx={{
                width: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <IconButton
                size="small"
                onClick={toggleViewer}
                sx={{
                  transform: 'rotate(0deg)',
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default AppLayout;

