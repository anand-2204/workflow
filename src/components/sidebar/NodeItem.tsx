import { Plus } from "lucide-react";
import type { NodeConfig } from "../../types/node.types.ts";
import React from "react";


interface NodeItemProps {
  node: NodeConfig;
  isCollapsed: boolean;
  onAddNode?: (nodeType: string) => void;
}

export const NodeItem = ({ node, isCollapsed, onAddNode }: NodeItemProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/reactflow", node.type);
    e.dataTransfer.effectAllowed = "move";
    
    const dragImage = document.createElement('div');
    dragImage.textContent = node.label;
    dragImage.style.cssText = `
      padding: 8px 16px;
      background: white;
      border-radius: 8px;
      border: 2px solid ${node.borderColor.replace('border-', '')};
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-weight: 600;
      color: #1a1a1a;
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNode?.(node.type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        group relative flex items-start gap-3 px-3 py-3 rounded-xl 
        cursor-grab transition-all duration-200 
        border-2 ${node.borderColor} ${node.bgColor} 
        ${node.hoverBorderColor}
        hover:shadow-lg ${node.shadowColor}
        hover:scale-[1.02] hover:-translate-y-0.5
        active:cursor-grabbing active:scale-[0.98]
        ${isCollapsed ? 'justify-center px-2 py-3' : ''}
      `}
      title={isCollapsed ? node.label : ''}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${node.iconBg} ${node.borderColor} border-2 shadow-sm`}>
        <div className={`${node.iconColor} transition-transform duration-200 group-hover:scale-110`}>
         {node.icon && React.isValidElement(node.icon) ? node.icon : null}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-[#e0e0e0] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {node.label}
            </span>
            <button 
              className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-white/50 dark:hover:bg-[#3d3d3d] rounded-lg ${node.iconColor} hover:scale-110`}
              onClick={handleAddClick}
              aria-label={`Add ${node.label} node`}
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#888888] mt-0.5 line-clamp-2 leading-relaxed">
            {node.description}
          </p>
        </div>
      )}
    </div>
  );
};