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
    e.stopPropagation();
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    
    // Notify parent of value change
    if (data.onChange) {
      data.onChange(id, newValue);
    }
  }, [id, data]);

  // Prevent node dragging when interacting with slider
  const handleSliderMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleSliderPointerDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleSliderClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleSliderTouchStart = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback((e) => {
    e.stopPropagation();
    setTempValue(e.target.value);
  }, []);

  const handleInputMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleInputPointerDown = useCallback((e) => {
    e.stopPropagation();
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
        isConnectable={true}
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
            onMouseDown={handleInputMouseDown}
            onPointerDown={handleInputPointerDown}
            autoFocus
          />
        ) : (
          <div 
            className="slider-value-display"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setTempValue(value.toString());
            }}
            onMouseDown={handleInputMouseDown}
            onPointerDown={handleInputPointerDown}
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
          onMouseDown={handleSliderMouseDown}
          onPointerDown={handleSliderPointerDown}
          onClick={handleSliderClick}
          onTouchStart={handleSliderTouchStart}
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
