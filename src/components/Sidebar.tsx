import { Play, Mail, Globe, StopCircle, Zap, Database, Code, Clock, Search, Plus, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { useState } from "react";

const nodeCategories = {
  'Triggers': [
    { 
      type: "start", 
      label: "Start", 
      description: "Start your workflow",
      bgColor: "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20", 
      borderColor: "border-emerald-300 dark:border-emerald-700", 
      hoverBorderColor: "hover:border-emerald-400 dark:hover:border-emerald-600",
      iconColor: "text-emerald-600 dark:text-emerald-400", 
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      shadowColor: "shadow-emerald-500/10",
      icon: <Play size={18} /> 
    },
    { 
      type: "webhook", 
      label: "Webhook", 
      description: "Trigger workflows via webhooks",
      bgColor: "bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20", 
      borderColor: "border-purple-300 dark:border-purple-700", 
      hoverBorderColor: "hover:border-purple-400 dark:hover:border-purple-600",
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      shadowColor: "shadow-purple-500/10",
      icon: <Zap size={18} /> 
    },
    { 
      type: "schedule", 
      label: "Schedule", 
      description: "Run workflows on a schedule",
      bgColor: "bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20", 
      borderColor: "border-indigo-300 dark:border-indigo-700", 
      hoverBorderColor: "hover:border-indigo-400 dark:hover:border-indigo-600",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
      shadowColor: "shadow-indigo-500/10",
      icon: <Clock size={18} /> 
    },
  ],
  'Actions': [
    { 
      type: "message", 
      label: "What'sApp", 
      description: "Make a what's app message",
      bgColor: "bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20", 
      borderColor: "border-green-300 dark:border-green-700", 
      hoverBorderColor: "hover:border-green-400 dark:hover:border-green-600",
      iconColor: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      shadowColor: "shadow-green-500/10",
      icon: <MessageCircle size={20}  /> 
    },
    { 
      type: "email", 
      label: "Email", 
      description: "Send and receive emails",
      bgColor: "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20", 
      borderColor: "border-amber-300 dark:border-amber-700", 
      hoverBorderColor: "hover:border-amber-400 dark:hover:border-amber-600",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      shadowColor: "shadow-amber-500/10",
      icon: <Mail size={18} /> 
    },
    { 
      type: "database", 
      label: "Database", 
      description: "Query and manage databases",
      bgColor: "bg-gradient-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20", 
      borderColor: "border-cyan-300 dark:border-cyan-700", 
      hoverBorderColor: "hover:border-cyan-400 dark:hover:border-cyan-600",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
      shadowColor: "shadow-cyan-500/10",
      icon: <Database size={18} /> 
    },
  ],
  'Logic': [
    { 
      type: "function", 
      label: "Function", 
      description: "Run custom JavaScript code",
      bgColor: "bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20", 
      borderColor: "border-violet-300 dark:border-violet-700", 
      hoverBorderColor: "hover:border-violet-400 dark:hover:border-violet-600",
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-900/50",
      shadowColor: "shadow-violet-500/10",
      icon: <Code size={18} /> 
    },
    { 
      type: "end", 
      label: "End", 
      description: "End your workflow",
      bgColor: "bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20", 
      borderColor: "border-rose-300 dark:border-rose-700", 
      hoverBorderColor: "hover:border-rose-400 dark:hover:border-rose-600",
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-100 dark:bg-rose-900/50",
      shadowColor: "shadow-rose-500/10",
      icon: <StopCircle size={18} /> 
    },
  ]
};

export default function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Triggers', 'Actions', 'Logic']);

  // Get all nodes for search
  const allNodes = Object.values(nodeCategories).flat();
  
  const filteredNodes = allNodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Node List with Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#2d2d2d] scrollbar-track-transparent">
        {searchTerm ? (
          // Show filtered results
          filteredNodes.length > 0 ? (
            filteredNodes.map((node) => (
              <NodeItem key={node.type} node={node} isCollapsed={isCollapsed} />
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-center">
                <Search size={20} className="text-gray-400 dark:text-[#666666]" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-[#888888]">No nodes found</p>
              <p className="text-xs text-gray-400 dark:text-[#666666] mt-1">Try adjusting your search</p>
            </div>
          )
        ) : (
          // Show categorized nodes
          Object.entries(nodeCategories).map(([categoryName, categoryNodes]) => (
            <div key={categoryName} className="space-y-1">
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
              >
                <span>{categoryName}</span>
                <span className="text-gray-400">
                  {expandedCategories.includes(categoryName) ? 
                    <ChevronDown size={14} /> : 
                    <ChevronRight size={14} />
                  }
                </span>
              </button>
              
              {expandedCategories.includes(categoryName) && (
                <div className="space-y-2 ml-1">
                  {categoryNodes.map((node) => (
                    <NodeItem key={node.type} node={node} isCollapsed={isCollapsed} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Drag hint */}
        {!isCollapsed && (
          <div className="pt-4 mt-2 border-t-2 border-dashed border-gray-200/50 dark:border-[#2d2d2d]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-[#666666]">
                <span>⬇</span>
                <span>Drag nodes to canvas</span>
                <span>⬇</span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-[#555555] mt-1">Hover for delete option</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Node Item Component
const NodeItem = ({ node, isCollapsed }: { node: any; isCollapsed: boolean }) => (
  <div
    draggable
    onDragStart={(e) => {
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
    }}
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
        {node.icon}
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
            onClick={() => console.log(`Add ${node.label} node`)}
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