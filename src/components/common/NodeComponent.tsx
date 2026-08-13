import React,{ useState } from 'react';
import { Handle, Position } from 'reactflow';
import { X, CheckCircle, AlertCircle, Loader2, Settings, Trash2 } from 'lucide-react';
import type { NodeData } from '../../types/node.types';

interface NodeComponentProps {
  data: NodeData;
  selected: boolean;
  id: string;
  isConnectable?: boolean;
}

export const NodeComponent = ({ data, selected, id, isConnectable = true }: NodeComponentProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const status = data.status || 'idle';

  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return 'border-yellow-500 shadow-lg shadow-yellow-500/20';
      case 'success':
        return 'border-green-500 shadow-lg shadow-green-500/20';
      case 'error':
        return 'border-red-500 shadow-lg shadow-red-500/20';
      default:
        return selected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
          : 'border-gray-300 hover:border-blue-400 hover:shadow-lg';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return <Loader2 size={14} className="text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return <span className="text-[10px] text-yellow-600 animate-pulse">Running...</span>;
      case 'success':
        return <span className="text-[10px] text-green-600">✓ Done</span>;
      case 'error':
        return <span className="text-[10px] text-red-600">✗ Failed</span>;
      default:
        return null;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfig(!showConfig);
  };

  const bgColor = data.bgColor || 'bg-white';
  const iconColor = data.iconColor || 'text-gray-600';

  // Determine if node should have handles based on type
  const nodeType = data.type || '';
  const nodeLabel = data.label || '';
  
  // START node: Only outgoing (source) handle - NO incoming
  const isStartNode = nodeType === 'start' || nodeLabel === 'Start';
  
  // END node: Only incoming (target) handle - NO outgoing
  const isEndNode = nodeType === 'end' || nodeLabel === 'End';
  
  // Regular nodes: Both incoming and outgoing
  const isRegularNode = !isStartNode && !isEndNode;

  return (
    <div 
      className={`
        px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[160px] relative
        ${getStatusStyles()}
        ${status === 'running' ? 'animate-pulse' : ''}
        ${bgColor}
        cursor-grab active:cursor-grabbing
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Dot */}
      {status !== 'idle' && (
        <div className={`
          absolute -top-1 -right-1 w-3 h-3 rounded-full
          ${status === 'running' ? 'bg-yellow-500 animate-ping' : ''}
          ${status === 'success' ? 'bg-green-500' : ''}
          ${status === 'error' ? 'bg-red-500 animate-pulse' : ''}
        `} />
      )}

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transform transition-all z-10"
        title="Delete node"
      >
        
        <Trash2  size={14} />
      </button>

      {/* Configuration Button */}
      {/* {data.onConfigChange && (
        <button
          onClick={handleConfigClick}
          className={`absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-500 hover:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transform transition-all z-10 ${showConfig ? 'opacity-100' : ''}`}
          title="Configure node"
        >
          <Settings size={14} />
        </button>
      )} */}


        {data.onConfigChange && data.config && Object.keys(data.config).length > 0 && (
          <button
            onClick={handleConfigClick}
            className={`absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-500 hover:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transform transition-all z-10 ${showConfig ? 'opacity-100' : ''}`}
            title="Configure node"
          >
            <Settings size={14} />
          </button>
        )}



      {/* ============ INCOMING HANDLE (LEFT) ============ */}
      {/* Only show for regular nodes and End nodes - NOT for Start nodes */}
      {(isRegularNode || isEndNode) && (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className={`
            w-5 h-5 rounded-full border-2 transition-all duration-200
            ${isHovered ? 'scale-110' : ''}
            bg-blue-500 border-white hover:bg-blue-600
            shadow-md hover:shadow-lg
            ${!isConnectable ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ 
            left: -10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          isConnectable={isConnectable}
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-3">
       {data.icon && React.isValidElement(data.icon) && (
        <div className={`text-xl ${iconColor}`}>
          {data.icon}
        </div>
      )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
              {data.label || 'Node'}
            </div>
            {getStatusIndicator()}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
              <span className="truncate">{data.description}</span>
              {getStatusText()}
            </div>
          )}
          {showConfig && data.config && (
            <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg text-xs space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(data.config).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-mono truncate max-w-[100px]">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ OUTGOING HANDLE (RIGHT) ============ */}
      {/* Only show for regular nodes and Start nodes - NOT for End nodes */}
      {(isRegularNode || isStartNode) && (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className={`
            w-5 h-5 rounded-full border-2 transition-all duration-200
            ${isHovered ? 'scale-110' : ''}
            bg-blue-500 border-white hover:bg-blue-600
            shadow-md hover:shadow-lg
            ${!isConnectable ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ 
            right: -10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};