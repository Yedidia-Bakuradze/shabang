import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '../../store/useFlowStore';

// Entity Node - Rectangle with Header and Attribute Body
export const EntityNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isWeak = data.isWeak || false;
  const attributes = data.attributes || [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl min-w-[200px] overflow-hidden ${
      isWeak ? 'border-double border-4' : 'border-2'
    } ${
      selected ? 'border-blue-500' : 'border-gray-400 dark:border-gray-600'
    }`}>
      {/* Relationship Handles */}
      <Handle 
        type="target" 
        position={Position.Left}
        id="handle-relations-left"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-blue-600"
      />
      <Handle 
        type="source" 
        position={Position.Right}
        id="handle-relations-right"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-blue-600"
      />
      <Handle 
        type="target" 
        position={Position.Top}
        id="handle-relations-top"
        className="!bg-blue-400 !w-3 !h-3 !border-2 !border-blue-600"
      />
      
      {/* Header: Entity Name */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
        <input
          type="text"
          value={data.label || 'Entity'}
          onChange={handleLabelChange}
          className="nodrag w-full bg-transparent text-white font-bold text-center outline-none focus:bg-blue-800 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
          placeholder="Entity Name"
        />
        {isWeak && (
          <div className="text-center text-xs text-blue-200 mt-1 font-medium">
            Weak Entity
          </div>
        )}
      </div>

      {/* Body: Attribute List */}
      <div className="px-3 py-2 space-y-1 bg-gray-50 dark:bg-gray-900">
        {attributes.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center py-2">
            No attributes
          </div>
        ) : (
          attributes.map((attr) => (
            <div
              key={attr.id}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                attr.isKey ? 'font-bold text-yellow-600 dark:text-yellow-400' : 
                attr.isForeignKey ? 'italic text-gray-600 dark:text-gray-400' : 
                'text-gray-800 dark:text-gray-200'
              }`}
            >
              {/* Icon for PK or FK */}
              {attr.isKey && (
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              )}
              {attr.isForeignKey && (
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              )}
              <span className={attr.isKey ? 'underline decoration-2' : ''}>
                {attr.name}
              </span>
              {attr.isForeignKey && (
                <span className="text-xs text-gray-400"> (FK → {attr.referencedEntity || '?'})</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Attribute Handle - Bottom */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="handle-attributes"
        className="!bg-green-400 !w-3 !h-3 !border-2 !border-green-700"
      />
    </div>
  );
};

// Attribute Node - Ellipse/Oval
export const AttributeNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative">
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
      
      <div className={`bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg border-2 ${
        selected ? 'border-purple-300' : 'border-purple-700'
      } px-6 py-3 min-w-[120px] flex items-center justify-center`}>
        <input
          type="text"
          value={data.label || 'Attribute'}
          onChange={handleLabelChange}
          className={`nodrag w-full bg-transparent text-white font-medium text-sm text-center outline-none focus:bg-purple-700 focus:bg-opacity-30 px-2 py-1 rounded transition-colors ${
            data.isKey ? 'underline decoration-2 underline-offset-2' : ''
          }`}
          placeholder="Attribute"
        />
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-purple-300 !w-3 !h-3 !border-2 !border-purple-700"
      />
    </div>
  );
};

// Relationship Node - Diamond
export const RelationshipNode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  const isIdentifying = data.isIdentifying || false;

  return (
    <div className="relative" style={{ width: '140px', height: '140px' }}>
      <Handle 
        type="target" 
        position={Position.Left}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      
      {/* Diamond Shape */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg ${
          isIdentifying ? 'border-double border-4' : 'border-2'
        } ${
          selected ? 'border-orange-300' : 'border-orange-700'
        } flex items-center justify-center`}
        style={{ 
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        }}
      >
        {/* Text container with reverse rotation */}
        <div 
          style={{ 
            transform: 'rotate(-45deg)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <input
            type="text"
            value={data.label || 'Relationship'}
            onChange={handleLabelChange}
            className="nodrag w-full bg-transparent text-white font-medium text-sm text-center outline-none focus:bg-orange-700 focus:bg-opacity-30 px-2 py-1 rounded transition-colors"
            placeholder="Relationship"
          />
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-orange-300 !w-3 !h-3 !border-2 !border-orange-700"
      />
    </div>
  );
};

// ISA Node - Triangle for Inheritance Hierarchies
export const IsANode = ({ id, data, selected }) => {
  const { updateNodeLabel } = useFlowStore();

  const handleLabelChange = (e) => {
    updateNodeLabel(id, e.target.value);
  };

  return (
    <div className="relative" style={{ width: '120px', height: '120px' }}>
      {/* Handles for connecting superclass (top) and subclasses (bottom sides) */}
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
      />
      
      {/* Triangle Shape using clip-path */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 shadow-lg border-2 ${
          selected ? 'border-green-300' : 'border-green-700'
        } flex items-center justify-center`}
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        }}
      >
        <div className="mt-8">
          <input
            type="text"
            value={data.label || 'ISA'}
            onChange={handleLabelChange}
            className="nodrag w-16 bg-transparent text-white font-semibold text-xs text-center outline-none focus:bg-green-700 focus:bg-opacity-30 px-1 py-1 rounded transition-colors"
            placeholder="ISA"
          />
        </div>
      </div>

      {/* Bottom handles for subclasses */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="subclass-left"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '30%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="subclass-right"
        className="!bg-green-300 !w-3 !h-3 !border-2 !border-green-700"
        style={{ left: '70%' }}
      />
    </div>
  );
};

export default { EntityNode, AttributeNode, RelationshipNode, IsANode };
