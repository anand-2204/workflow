import { ChevronDown, ChevronRight } from "lucide-react";
import type { NodeConfig } from "../../types/node.types";
import { NodeItem } from "./NodeItem";

interface CategorySectionProps {
  categoryName: string;
  nodes: NodeConfig[];
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddNode?: (nodeType: string) => void;
}

export const CategorySection = ({ 
  categoryName, 
  nodes, 
  isExpanded, 
  isCollapsed,
  onToggle,
  onAddNode 
}: CategorySectionProps) => {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
      >
        <span>{categoryName}</span>
        <span className="text-gray-400">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      
      {isExpanded && (
        <div className="space-y-2 ml-1">
          {nodes.map((node) => (
            <NodeItem 
              key={node.type} 
              node={node} 
              isCollapsed={isCollapsed}
              onAddNode={onAddNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};