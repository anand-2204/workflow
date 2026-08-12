import { useState } from 'react';
import { Search } from 'lucide-react';
import { getNodesByCategory } from '../constants/nodeDefinitions';
import { SearchBar }  from './SearchBar';
import { CategoryList } from './CategoryList';
import { DragHint } from './DragHint';

interface SidebarProps {
  isCollapsed?: boolean;
  onAddNode?: (nodeType: string) => void;
}

export const Sidebar = ({ 
  isCollapsed: initialIsCollapsed = false,
  onAddNode 
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(initialIsCollapsed);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Triggers', 'Actions', 'Logic']);

  const nodeCategories = getNodesByCategory();

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <div className={`
      w-[320px] min-w-[320px] 
      bg-white dark:bg-[#1a1a1a] 
      text-gray-800 dark:text-[#e0e0e0] 
      flex flex-col h-full select-none
      border-r border-gray-200/50 dark:border-[#2d2d2d]
      transition-all duration-300
      ${isCollapsed ? 'w-14 min-w-14' : ''}
    `}>
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isCollapsed={isCollapsed}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#2d2d2d] scrollbar-track-transparent">
        <CategoryList
          searchTerm={searchTerm}
          nodeCategories={nodeCategories}
          expandedCategories={expandedCategories}
          isCollapsed={isCollapsed}
          onToggleCategory={toggleCategory}
          onAddNode={onAddNode}
        />

        <DragHint isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};