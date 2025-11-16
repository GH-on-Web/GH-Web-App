import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TextField, Box, Typography, useTheme } from '@mui/material';

/**
 * PointNode - Custom node for creating 3D points
 * Inputs: X, Y, Z values
 * Output: Point geometry
 */
function PointNode({ data, id, selected }) {
  const theme = useTheme();
  const [focusedField, setFocusedField] = useState(null);
  const xInputRef = React.useRef(null);
  const yInputRef = React.useRef(null);
  const zInputRef = React.useRef(null);
  
  // Update node data to indicate if any input is focused (for drag prevention)
  React.useEffect(() => {
    if (data.onChange && focusedField) {
      // Store focus state in node data so parent can check it
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
  }, [focusedField, id, data.onChange]);
  
  // Convert number to string for display, handle empty strings
  // Allow empty strings to persist during editing
  const getDisplayValue = (val, fieldName) => {
    // If this field is focused and the value is 0, show empty to allow editing
    if (focusedField === fieldName && val === 0) return '';
    if (val === undefined || val === null) return '';
    // If it's already a string (empty or '-'), return it as-is
    if (typeof val === 'string') return val;
    // Otherwise convert number to string
    return String(val);
  };

  // Handle Enter key to move to next field or blur if last field
  const handleKeyDown = (e, currentField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentField === 'x' && yInputRef.current) {
        yInputRef.current.focus();
        yInputRef.current.select();
      } else if (currentField === 'y' && zInputRef.current) {
        zInputRef.current.focus();
        zInputRef.current.select();
      } else if (currentField === 'z' && zInputRef.current) {
        // Last field - blur to exit
        zInputRef.current.blur();
      }
    }
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
        Point
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.secondary' }}>
            X
          </Typography>
          <TextField
            inputRef={xInputRef}
            type="number"
            size="small"
            value={getDisplayValue(data.inputs?.x, 'x')}
            placeholder="0"
            onFocus={() => {
              setFocusedField('x');
              // If value is 0, store as empty string to allow editing
              if (data.inputs?.x === 0 && data.onChange) {
                data.onChange(id, 'x', '');
              }
            }}
            onBlur={(e) => {
              setFocusedField(null);
              // Only set default value on blur if field is empty
              if (data.onChange) {
                const inputValue = e.target.value.trim();
                if (inputValue === '' || inputValue === '-') {
                  data.onChange(id, 'x', 0);
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    data.onChange(id, 'x', value);
                  } else {
                    // Invalid input, reset to 0
                    data.onChange(id, 'x', 0);
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
                data.onChange(id, 'x', inputValue);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'x', value);
                }
                // If invalid, don't update (let user continue typing)
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
            // Handle Enter to move to next field
            handleKeyDown(e, 'x');
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
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : undefined,
              },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? '#90caf9' : undefined,
                borderWidth: theme.palette.mode === 'dark' ? '2px' : undefined,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
            },
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
        <Box>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Y
          </Typography>
          <TextField
            inputRef={yInputRef}
            type="number"
            size="small"
            value={getDisplayValue(data.inputs?.y, 'y')}
            placeholder="0"
            onFocus={() => {
              setFocusedField('y');
              // If value is 0, store as empty string to allow editing
              if (data.inputs?.y === 0 && data.onChange) {
                data.onChange(id, 'y', '');
              }
            }}
            onBlur={(e) => {
              setFocusedField(null);
              // Only set default value on blur if field is empty
              if (data.onChange) {
                const inputValue = e.target.value.trim();
                if (inputValue === '' || inputValue === '-') {
                  data.onChange(id, 'y', 0);
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    data.onChange(id, 'y', value);
                  } else {
                    // Invalid input, reset to 0
                    data.onChange(id, 'y', 0);
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
                data.onChange(id, 'y', inputValue);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'y', value);
                }
                // If invalid, don't update (let user continue typing)
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
            // Handle Enter to move to next field
            handleKeyDown(e, 'y');
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
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : undefined,
              },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? '#90caf9' : undefined,
                borderWidth: theme.palette.mode === 'dark' ? '2px' : undefined,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
            },
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
        <Box>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Z
          </Typography>
          <TextField
            inputRef={zInputRef}
            type="number"
            size="small"
            value={getDisplayValue(data.inputs?.z, 'z')}
            placeholder="0"
            onFocus={() => {
              setFocusedField('z');
              // If value is 0, store as empty string to allow editing
              if (data.inputs?.z === 0 && data.onChange) {
                data.onChange(id, 'z', '');
              }
            }}
            onBlur={(e) => {
              setFocusedField(null);
              // Only set default value on blur if field is empty
              if (data.onChange) {
                const inputValue = e.target.value.trim();
                if (inputValue === '' || inputValue === '-') {
                  data.onChange(id, 'z', 0);
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    data.onChange(id, 'z', value);
                  } else {
                    // Invalid input, reset to 0
                    data.onChange(id, 'z', 0);
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
                data.onChange(id, 'z', inputValue);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  data.onChange(id, 'z', value);
                }
                // If invalid, don't update (let user continue typing)
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
            // Handle Enter to move to next field (Z is last, so no action)
            handleKeyDown(e, 'z');
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
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : undefined,
              },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? '#90caf9' : undefined,
                borderWidth: theme.palette.mode === 'dark' ? '2px' : undefined,
              },
            },
            '& .MuiOutlinedInput-input': {
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined,
            },
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
        id="point"
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

export default PointNode;



