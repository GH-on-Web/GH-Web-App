import React from 'react';
import { Handle, Position } from 'reactflow';
import { TextField, Box, Typography } from '@mui/material';

/**
 * PointNode - Custom node for creating 3D points
 * Inputs: X, Y, Z values
 * Output: Point geometry
 */
function PointNode({ data, id }) {
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
        Point
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          label="X"
          type="number"
          size="small"
          value={data.inputs?.x ?? ''}
          onChange={(e) => {
            if (data.onChange) {
              const value = e.target.value === '' ? '' : parseFloat(e.target.value);
              data.onChange(id, 'x', isNaN(value) ? 0 : value);
            }
          }}
          onBlur={(e) => {
            // Set to 0 if empty on blur
            if (e.target.value === '' && data.onChange) {
              data.onChange(id, 'x', 0);
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
        <TextField
          label="Y"
          type="number"
          size="small"
          value={data.inputs?.y ?? ''}
          onChange={(e) => {
            if (data.onChange) {
              const value = e.target.value === '' ? '' : parseFloat(e.target.value);
              data.onChange(id, 'y', isNaN(value) ? 0 : value);
            }
          }}
          onBlur={(e) => {
            // Set to 0 if empty on blur
            if (e.target.value === '' && data.onChange) {
              data.onChange(id, 'y', 0);
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
        <TextField
          label="Z"
          type="number"
          size="small"
          value={data.inputs?.z ?? ''}
          onChange={(e) => {
            if (data.onChange) {
              const value = e.target.value === '' ? '' : parseFloat(e.target.value);
              data.onChange(id, 'z', isNaN(value) ? 0 : value);
            }
          }}
          onBlur={(e) => {
            // Set to 0 if empty on blur
            if (e.target.value === '' && data.onChange) {
              data.onChange(id, 'z', 0);
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
        id="point"
        style={{ background: '#4CAF50' }}
      />
    </Box>
  );
}

export default PointNode;

