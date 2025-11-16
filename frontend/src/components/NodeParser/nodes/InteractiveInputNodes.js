import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import './InteractiveNodes.css';

/**
 * Boolean Toggle Node - On/Off switch like Grasshopper Boolean Toggle
 */
const BooleanToggleNode = ({ data, id }) => {
  const [value, setValue] = useState(data.value !== undefined ? data.value : false);
  const nickname = data.nickname || 'Toggle';

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    const newValue = !value;
    setValue(newValue);
    
    if (data.onChange) {
      data.onChange(id, newValue);
    }
  }, [value, id, data]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="interactive-node boolean-node">
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-0"
        className="node-handle"
        isConnectable={true}
      />

      <div className="node-header">
        <span className="node-nickname">{nickname}</span>
      </div>

      <div className="boolean-container">
        <button
          className={`boolean-toggle ${value ? 'active' : ''}`}
          onClick={handleToggle}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
        >
          <div className="toggle-track">
            <div className="toggle-thumb"></div>
          </div>
          <span className="toggle-label">{value ? 'True' : 'False'}</span>
        </button>
      </div>

      <div className="node-category">Params &gt; Input</div>
    </div>
  );
};

/**
 * Button Node - Trigger/Action button
 */
const ButtonNode = ({ data, id }) => {
  const [clickCount, setClickCount] = useState(0);
  const nickname = data.nickname || 'Button';

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setClickCount(prev => prev + 1);
    
    if (data.onClick) {
      data.onClick(id);
    }
  }, [id, data]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="interactive-node button-node">
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-0"
        className="node-handle"
        isConnectable={true}
      />

      <div className="node-header">
        <span className="node-nickname">{nickname}</span>
      </div>

      <div className="button-container">
        <button 
          className="action-button" 
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
        >
          <span className="button-icon">▶</span>
          <span className="button-text">Press</span>
        </button>
        {clickCount > 0 && (
          <div className="click-counter">{clickCount}</div>
        )}
      </div>

      <div className="node-category">Params &gt; Input</div>
    </div>
  );
};

/**
 * Number Input Node - Simple numeric input
 */
const NumberInputNode = ({ data, id }) => {
  const [value, setValue] = useState(data.value || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const nickname = data.nickname || 'Number';

  const handleChange = useCallback((e) => {
    e.stopPropagation();
    setTempValue(e.target.value);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleBlur = useCallback(() => {
    const newValue = parseFloat(tempValue);
    if (!isNaN(newValue)) {
      setValue(newValue);
      if (data.onChange) {
        data.onChange(id, newValue);
      }
    } else {
      setTempValue(value.toString());
    }
    setIsEditing(false);
  }, [tempValue, value, id, data]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = value + 1;
      setValue(newValue);
      setTempValue(newValue.toString());
      if (data.onChange) {
        data.onChange(id, newValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = value - 1;
      setValue(newValue);
      setTempValue(newValue.toString());
      if (data.onChange) {
        data.onChange(id, newValue);
      }
    }
  }, [handleBlur, value, id, data]);

  return (
    <div className="interactive-node number-input-node">
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-0"
        className="node-handle"
        isConnectable={true}
      />

      <div className="node-header">
        <span className="node-nickname">{nickname}</span>
      </div>

      <div className="number-input-container">
        {isEditing ? (
          <input
            type="text"
            className="number-input-field"
            value={tempValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            autoFocus
          />
        ) : (
          <div
            className="number-display"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setTempValue(value.toString());
            }}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            title="Double-click to edit, arrow keys to increment"
          >
            {value}
          </div>
        )}
      </div>

      <div className="node-category">Params &gt; Primitive</div>
    </div>
  );
};

export { BooleanToggleNode, ButtonNode, NumberInputNode };
