import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './GrasshopperNode.css';

/**
 * Custom node component for Grasshopper components in React Flow
 */
const GrasshopperNode = ({ data }) => {
  const { name, nickname, category, subCategory, inputs, outputs } = data;

  return (
    <div className="grasshopper-node">
      {/* Input Handles */}
      {inputs && inputs.length > 0 && (
        <div className="node-handles input-handles">
          {inputs.map((input, index) => (
            <div key={input.id} className="handle-wrapper" title={`${input.name}\n${input.description}\nType: ${input.typeName}`}>
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{
                  top: `${((index + 1) * 100) / (inputs.length + 1)}%`,
                  background: '#555',
                }}
              />
              <span className="handle-label input-label">{input.nickname}</span>
            </div>
          ))}
        </div>
      )}

      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <strong>{nickname || name}</strong>
        </div>
        {category && (
          <div className="node-category">
            {subCategory ? `${category} > ${subCategory}` : category}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {outputs && outputs.length > 0 && (
        <div className="node-handles output-handles">
          {outputs.map((output, index) => (
            <div key={output.id} className="handle-wrapper" title={`${output.name}\n${output.description}\nType: ${output.typeName}`}>
              <span className="handle-label output-label">{output.nickname}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{
                  top: `${((index + 1) * 100) / (outputs.length + 1)}%`,
                  background: '#555',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(GrasshopperNode);
