import React from 'react';
import { Box, Typography, TextField, Divider } from '@mui/material';

/**
 * ParameterPanel - Shows editable parameters for selected node
 * Displays dynamic form based on node type
 */
function ParameterPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a node to edit its parameters
        </Typography>
      </Box>
    );
  }

  const handleInputChange = (key, value) => {
    if (selectedNode.data.onChange) {
      selectedNode.data.onChange(selectedNode.id, key, value);
    }
  };

  const renderInputs = () => {
    const inputs = selectedNode.data.inputs || {};
    const nodeType = selectedNode.type;

    switch (nodeType) {
      case 'point':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <TextField
              label="X"
              type="number"
              size="small"
              value={inputs.x ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                handleInputChange('x', isNaN(value) ? 0 : value);
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  handleInputChange('x', 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputProps={{ step: 'any' }}
              slotProps={{
                htmlInput: {
                  onWheel: (e) => {
                    e.target.blur();
                  },
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
            <TextField
              label="Y"
              type="number"
              size="small"
              value={inputs.y ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                handleInputChange('y', isNaN(value) ? 0 : value);
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  handleInputChange('y', 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputProps={{ step: 'any' }}
              slotProps={{
                htmlInput: {
                  onWheel: (e) => {
                    e.target.blur();
                  },
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
            <TextField
              label="Z"
              type="number"
              size="small"
              value={inputs.z ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                handleInputChange('z', isNaN(value) ? 0 : value);
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  handleInputChange('z', 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputProps={{ step: 'any' }}
              slotProps={{
                htmlInput: {
                  onWheel: (e) => {
                    e.target.blur();
                  },
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Box>
        );
      case 'circle':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Center: Connect a Point node
            </Typography>
            <TextField
              label="Radius"
              type="number"
              size="small"
              value={inputs.radius ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                handleInputChange('radius', isNaN(value) ? 1 : value);
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  handleInputChange('radius', 1);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputProps={{ step: 'any' }}
              slotProps={{
                htmlInput: {
                  onWheel: (e) => {
                    e.target.blur();
                  },
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Box>
        );
      case 'number':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <TextField
              label="Value"
              type="number"
              size="small"
              value={inputs.value ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                handleInputChange('value', isNaN(value) ? 0 : value);
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  handleInputChange('value', 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputProps={{ step: 'any' }}
              slotProps={{
                htmlInput: {
                  onWheel: (e) => {
                    e.target.blur();
                  },
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No parameters available
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Parameters
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedNode.data.label || selectedNode.type}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{renderInputs()}</Box>
    </Box>
  );
}

export default ParameterPanel;

