import React from 'react';
import { Handle, Position } from 'reactflow';
import { TextField, Box, Typography } from '@mui/material';

/**
 * NumberNode - Custom node for number values
 * Input: Number value
 * Output: Number
 */
function NumberNode({ data, id }) {
  return (
    <Box
      sx={{
        background: '#fff',
        border: '2px solid #FF9800',
        borderRadius: 1,
        padding: 1,
        minWidth: 150,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#FF9800' }}>
        Number
      </Typography>
      
      <TextField
        label="Value"
        type="number"
        size="small"
        value={data.inputs?.value ?? ''}
        onChange={(e) => {
          if (data.onChange) {
            const value = e.target.value === '' ? '' : parseFloat(e.target.value);
            data.onChange(id, 'value', isNaN(value) ? 0 : value);
          }
        }}
        onBlur={(e) => {
          // Set to 0 if empty on blur
          if (e.target.value === '' && data.onChange) {
            data.onChange(id, 'value', 0);
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
        fullWidth
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="number"
        style={{ background: '#FF9800' }}
      />
    </Box>
  );
}

export default NumberNode;

