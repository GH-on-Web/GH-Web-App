import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TextField, Box, Typography, useTheme } from '@mui/material';

/**
 * NumberNode - Custom node for number values
 * Input: Number value
 * Output: Number
 */
function NumberNode({ data, id }) {
  const theme = useTheme();
  const [focusedField, setFocusedField] = useState(null);
  const valueInputRef = React.useRef(null);
  
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
    if (focusedField === 'value' && val === 0) return '';
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
        border: '2px solid #FF9800',
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
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#FF9800' }}>
        Number
      </Typography>
      
      <Box>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.secondary' }}>
          Value
        </Typography>
        <TextField
          inputRef={valueInputRef}
          type="number"
          size="small"
          value={getDisplayValue(data.inputs?.value)}
          placeholder="0"
          onFocus={() => {
            setFocusedField('value');
            if (data.inputs?.value === 0 && data.onChange) {
              data.onChange(id, 'value', '');
            }
          }}
          onBlur={(e) => {
            setFocusedField(null);
            // Only set default value on blur if field is empty
            if (data.onChange) {
              const inputValue = e.target.value.trim();
              if (inputValue === '' || inputValue === '-') {
                data.onChange(id, 'value', 0);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'value', value);
                } else {
                  // Invalid input, reset to 0
                  data.onChange(id, 'value', 0);
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
              data.onChange(id, 'value', inputValue);
            } else {
              const value = parseFloat(inputValue);
              if (!isNaN(value)) {
                data.onChange(id, 'value', value);
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
              data.onChange(id, 'value', 0);
            } else {
              const value = parseFloat(inputValue);
              if (!isNaN(value)) {
                data.onChange(id, 'value', value);
              } else {
                // Invalid input, reset to 0
                data.onChange(id, 'value', 0);
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
        fullWidth
        />
      </Box>
      
      <Handle
        type="source"
        position={Position.Right}
        id="number"
        style={{ 
          background: '#FF9800',
          width: '14px',
          height: '14px',
          border: '2px solid #fff',
        }}
      />
    </Box>
  );
}

export default NumberNode;

