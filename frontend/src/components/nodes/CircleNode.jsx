import React from 'react';
import { Handle, Position } from 'reactflow';
import { TextField, Box, Typography } from '@mui/material';

/**
 * CircleNode - Custom node for creating circles
 * Inputs: Center (Point), Radius (Number)
 * Output: Circle geometry
 */
function CircleNode({ data, id }) {
  return (
    <Box
      sx={{
        background: '#fff',
        border: '2px solid #4CAF50',
        borderRadius: 1,
        padding: 1,
        minWidth: 150,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#4CAF50' }}>
        Circle
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Handle
          type="target"
          position={Position.Left}
          id="center"
          style={{ background: '#4CAF50', top: '30%' }}
        />
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          Center (Point)
        </Typography>
        
        <TextField
          label="Radius"
          type="number"
          size="small"
          value={data.inputs?.radius ?? ''}
          onChange={(e) => {
            if (data.onChange) {
              const value = e.target.value === '' ? '' : parseFloat(e.target.value);
              data.onChange(id, 'radius', isNaN(value) ? 1 : value);
            }
          }}
          onBlur={(e) => {
            // Set to 1 if empty on blur
            if (e.target.value === '' && data.onChange) {
              data.onChange(id, 'radius', 1);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            // Prevent spinner auto-increment
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
            }
          }}
          inputProps={{
            step: 'any',
          }}
          slotProps={{
            htmlInput: {
              onWheel: (e) => {
                // Prevent scroll from changing number
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
      
      <Handle
        type="source"
        position={Position.Right}
        id="circle"
        style={{ background: '#4CAF50' }}
      />
    </Box>
  );
}

export default CircleNode;

