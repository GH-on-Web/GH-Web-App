import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import './InteractiveNodes.css';

/**
 * Panel Node - Text display/input like Grasshopper Panel
 * Can display multiline text or accept input
 */
const PanelNode = ({ data, id }) => {
  const [text, setText] = useState(data.text || '');
  const [isEditing, setIsEditing] = useState(false);
  const nickname = data.nickname || 'Panel';
  const isInput = data.isInput || false; // If false, acts as display only

  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (data.onChange) {
      data.onChange(id, newText);
    }
  }, [id, data]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="interactive-node panel-node">
      {/* Input Handle (if not an input panel) */}
      {!isInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="node-handle"
        />
      )}

      <div className="node-header">
        <span className="node-nickname">{nickname}</span>
      </div>

      <div className="panel-container">
        {isEditing || isInput ? (
          <textarea
            className="panel-textarea"
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            placeholder="Enter text..."
            autoFocus={isEditing}
          />
        ) : (
          <div 
            className="panel-display"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {text || <span className="panel-placeholder">Empty</span>}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="node-handle"
      />

      <div className="node-category">Params &gt; Input</div>
    </div>
  );
};

export default memo(PanelNode);
