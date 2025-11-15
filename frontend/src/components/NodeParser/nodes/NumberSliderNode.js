import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import './InteractiveNodes.css';

/**
 * Number Slider Node - Interactive slider component like Grasshopper
 * Represents a numeric input with min/max range
 */
const NumberSliderNode = ({ data, id }) => {
  const [value, setValue] = useState(data.value || data.min || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const min = data.min || 0;
  const max = data.max || 100;
  const step = data.step || 1;
  const nickname = data.nickname || 'Slider';

  const handleSliderChange = useCallback((e) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    
    // Notify parent of value change
    if (data.onChange) {
      data.onChange(id, newValue);
    }
  }, [id, data]);

  const handleInputChange = useCallback((e) => {
    setTempValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const newValue = parseFloat(tempValue);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setValue(newValue);
      if (data.onChange) {
        data.onChange(id, newValue);
      }
    } else {
      setTempValue(value.toString());
    }
    setIsEditing(false);
  }, [tempValue, value, min, max, id, data]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  }, [handleInputBlur, value]);

  return (
    <div className="interactive-node slider-node">
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="node-handle"
      />

      <div className="node-header">
        <span className="node-nickname">{nickname}</span>
      </div>

      <div className="slider-container">
        {/* Value Display/Input */}
        {isEditing ? (
          <input
            type="text"
            className="slider-value-input"
            value={tempValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
        ) : (
          <div 
            className="slider-value-display"
            onDoubleClick={() => {
              setIsEditing(true);
              setTempValue(value.toString());
            }}
            title="Double-click to edit"
          >
            {value.toFixed(step < 1 ? 2 : 0)}
          </div>
        )}

        {/* Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="slider-input"
        />

        {/* Min/Max Labels */}
        <div className="slider-range-labels">
          <span className="range-min">{min}</span>
          <span className="range-max">{max}</span>
        </div>
      </div>

      <div className="node-category">Params &gt; Input</div>
    </div>
  );
};

export default memo(NumberSliderNode);
