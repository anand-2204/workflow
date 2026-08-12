import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isCollapsed: boolean;
}

export const SearchBar = ({ searchTerm, onSearchChange, isCollapsed }: SearchBarProps) => {
  if (isCollapsed) return null;

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};