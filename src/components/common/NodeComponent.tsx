// components/common/NodeComponent.tsx
import { Handle, Position } from 'reactflow';
import { Play, Square, Trash2, Loader2, Package } from 'lucide-react';
import { useState, isValidElement } from 'react'; 

interface NodeComponentProps {
  data: any;
  selected: boolean;
}

export const NodeComponent = ({ data, selected }: NodeComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Agar execution chal raha hai toh status dikhao
  const isRunning = data.status === 'running';

  // Icon ko safe tarike se handle karein
  const renderIcon = () => {
    if (isValidElement(data.icon)) {
      return data.icon;
    }
    return <Package size={16} />;
  };

  // ✅ LOG: Check karo ki data mein functions hain ya nahi
  console.log('🔍 NodeComponent data:', {
    nodeId: data.id,
    label: data.label,
    hasOnExecute: typeof data.onExecute === 'function',
    hasOnDelete: typeof data.onDelete === 'function',
    hasOnCancel: typeof data.onCancelExecution === 'function',
  });

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[180px] transition-all duration-200
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}
        ${data.bgColor || 'bg-white'}
        ${isRunning ? 'ring-2 ring-blue-500 animate-pulse' : ''}
      `}
      style={{ zIndex: isHovered ? 100 : 1 }} 
    >
      {/* Top Handle (Input) */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />

      {/* Node Content */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.iconBg || 'bg-gray-100'}`}>
          {renderIcon()} 
        </div>
        
        {/* Labels */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label || 'Node'}</div>
          <div className="text-xs text-gray-500">{data.description || ''}</div>
        </div>

        {/* Running Spinner */}
        {isRunning && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Hover Actions (Top-Right Corner) */}
      {isHovered && !isRunning && (
        <div className="absolute top-1 right-1 flex gap-1 bg-white/95 rounded-full shadow-md border border-gray-200 p-1 z-50 animate-scale-in">
          {/* Execute Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('▶️ Execute Button Clicked for node:', data.id);
              data.onExecute?.(data.id);
            }}
            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            title="Execute Node"
          >
            <Play size={14} />
          </button>

          {/* Cancel Button (Sirf tab dikhega jab execution chal raha ho) */}
          {data.executionId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('⏹️ Cancel Button Clicked for node:', data.id, 'Execution ID:', data.executionId);
                data.onCancelExecution?.(data.id, data.executionId);
              }}
              className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Cancel Execution"
            >
              <Square size={14} />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('🗑️ Delete Button Clicked for node:', data.id);
              data.onDelete?.(data.id);
            }}
            className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Delete Node"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Bottom Handle (Output) */}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
};