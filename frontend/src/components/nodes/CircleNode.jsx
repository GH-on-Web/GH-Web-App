import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TextField, Box, Typography, useTheme } from '@mui/material';

/**
 * CircleNode - Custom node for creating circles
 * Inputs: Center (Point), Radius (Number)
 * Output: Circle geometry
 */
function CircleNode({ data, id }) {
  const theme = useTheme();
  const [focusedField, setFocusedField] = useState(null);
  const radiusInputRef = React.useRef(null);
  
  // Update node data to indicate if any input is focused (for drag prevention)
  React.useEffect(() => {
    if (focusedField) {
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (nodeElement) {
        nodeElement.setAttribute('data-input-focused', 'true');
      }
    } else {
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (nodeElement) {
        nodeElement.removeAttribute('data-input-focused');
      }
    }
  }, [focusedField, id]);
  
  // Convert number to string for display, handle empty strings
  // Allow empty strings to persist during editing
  const getDisplayValue = (val) => {
    if (focusedField === 'radius' && val === 0) return '';
    if (val === undefined || val === null) return '';
    // If it's already a string (empty or '-'), return it as-is
    if (typeof val === 'string') return val;
    // Otherwise convert number to string
    return String(val);
  };
  
  return (
    <Box
      sx={{
        background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#fff',
        border: '2px solid #4CAF50',
        borderRadius: 1,
        padding: 1,
        minWidth: 150,
        color: theme.palette.text.primary,
      }}
      onMouseDown={(e) => {
        // Prevent node dragging if clicking on input fields or their labels
        const target = e.target;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('.MuiInputBase-root') ||
          target.closest('.MuiInputBase-input') ||
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          e.stopPropagation();
          e.preventDefault();
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation();
          }
        }
      }}
      onDragStart={(e) => {
        // Prevent dragging if an input is focused
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
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
          style={{ 
            background: '#4CAF50', 
            top: '30%',
            width: '14px',
            height: '14px',
            border: '2px solid #fff',
          }}
        />
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          Center (Point)
        </Typography>
        
        <Box>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Radius
          </Typography>
          <TextField
            inputRef={radiusInputRef}
            type="number"
            size="small"
            value={getDisplayValue(data.inputs?.radius)}
            placeholder="1"
            onFocus={() => {
              setFocusedField('radius');
              if (data.inputs?.radius === 0 && data.onChange) {
                data.onChange(id, 'radius', '');
              }
            }}
            onBlur={(e) => {
              setFocusedField(null);
              // Only set default value on blur if field is empty
              if (data.onChange) {
                const inputValue = e.target.value.trim();
                if (inputValue === '' || inputValue === '-') {
                  data.onChange(id, 'radius', 1);
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    data.onChange(id, 'radius', value);
                  } else {
                    // Invalid input, reset to 1
                    data.onChange(id, 'radius', 1);
                  }
                }
              }
            }}
          onChange={(e) => {
            if (data.onChange) {
              const inputValue = e.target.value;
              // Allow empty string, '-', or valid numbers during editing
              if (inputValue === '' || inputValue === '-') {
                // Store as string to allow empty state during editing
                data.onChange(id, 'radius', inputValue);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'radius', value);
                }
                // If invalid, don't update (let user continue typing)
              }
            }
          }}
          onBlur={(e) => {
            // Only set default value on blur if field is empty
            if (data.onChange) {
              const inputValue = e.target.value.trim();
              if (inputValue === '' || inputValue === '-') {
                data.onChange(id, 'radius', 1);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'radius', value);
                } else {
                  // Invalid input, reset to 1
                  data.onChange(id, 'radius', 1);
                }
              }
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Prevent node dragging when interacting with input
            e.nativeEvent.stopImmediatePropagation();
          }}
          onSelectStart={(e) => {
            e.stopPropagation();
          }}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
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
      </Box>
      
      <Handle
        type="source"
        position={Position.Right}
        id="circle"
        style={{ 
          background: '#4CAF50',
          width: '14px',
          height: '14px',
          border: '2px solid #fff',
        }}
      />
    </Box>
  );
}

export default CircleNode;

