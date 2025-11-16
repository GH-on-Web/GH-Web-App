import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider, useTheme } from '@mui/material';
import { NODE_TYPES, NODE_CATEGORIES } from '../../types/nodes';

/**
 * ComponentLibrary - Sidebar with draggable Grasshopper components
 * Allows users to drag components onto the canvas
 */
function ComponentLibrary({ onAddNode }) {
  const theme = useTheme();
  const componentCategories = [
    {
      name: 'Primitives',
      category: NODE_CATEGORIES.PRIMITIVES,
      components: [
        { type: NODE_TYPES.POINT, label: 'Point', description: 'Create a 3D point' },
        { type: NODE_TYPES.CIRCLE, label: 'Circle', description: 'Create a circle' },
      ],
    },
    {
      name: 'Parameters',
      category: NODE_CATEGORIES.PARAMETERS,
      components: [
        { type: NODE_TYPES.NUMBER, label: 'Number', description: 'Number value' },
      ],
    },
  ];

  const handleComponentClick = (componentType) => {
    if (onAddNode) {
      onAddNode(componentType);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Components
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click to add to canvas
        </Typography>
      </Box>
      
      {componentCategories.map((category, idx) => (
        <Box key={category.name}>
          <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}>
            <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              {category.name}
            </Typography>
          </Box>
          <List dense>
            {category.components.map((component) => (
              <ListItem key={component.type} disablePadding>
                <ListItemButton
                  onClick={() => handleComponentClick(component.type)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={component.label}
                    secondary={component.description}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {idx < componentCategories.length - 1 && <Divider />}
        </Box>
      ))}
    </Box>
  );
}

export default ComponentLibrary;

