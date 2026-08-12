import { Search } from "lucide-react";
import { type NodeConfig, type NodeCategoryMap } from "../../types/node.types";
import { CategorySection } from "./CategorySection";
import { NodeItem } from "./NodeItem";

interface CategoryListProps {
  searchTerm: string;
  nodeCategories: NodeCategoryMap;
  expandedCategories: string[];
  isCollapsed: boolean;
  onToggleCategory: (categoryName: string) => void;
  onAddNode?: (nodeType: string) => void;
}

export const CategoryList = ({ 
  searchTerm, 
  nodeCategories, 
  expandedCategories, 
  isCollapsed,
  onToggleCategory,
  onAddNode 
}: CategoryListProps) => {
  // Get all nodes for search
  const allNodes = Object.values(nodeCategories).flat();
  
  const filteredNodes = allNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (searchTerm) {
    // Show filtered results
    return (
      <div className="space-y-2">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node) => (
            <NodeItem 
              key={node.type} 
              node={node} 
              isCollapsed={isCollapsed}
              onAddNode={onAddNode}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-center">
              <Search size={20} className="text-gray-400 dark:text-[#666666]" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-[#888888]">No nodes found</p>
            <p className="text-xs text-gray-400 dark:text-[#666666] mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    );
  }

  // Show categorized nodes
  return (
    <div className="space-y-3">
      {Object.entries(nodeCategories).map(([categoryName, categoryNodes]) => (
        <CategorySection
          key={categoryName}
          categoryName={categoryName}
          nodes={categoryNodes}
          isExpanded={expandedCategories.includes(categoryName)}
          isCollapsed={isCollapsed}
          onToggle={() => onToggleCategory(categoryName)}
          onAddNode={onAddNode}
        />
      ))}
    </div>
  );
};