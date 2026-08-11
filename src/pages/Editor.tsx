import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { 
  Plus, Save, Play, Settings, Undo2, Redo2, 
  ZoomIn, ZoomOut, Maximize, GitBranch, Trash2 
} from 'lucide-react';

export default function Editor() {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  const clearCanvas = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear all nodes?')) {
      setNodes([]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[320px] min-w-[320px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GitBranch size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Nodes Panel</h2>
              <p className="text-[10px] text-gray-500">{nodes.length} nodes on canvas</p>
            </div>
          </div>
          
        </div>
        <Sidebar />
      </aside>

      {/* Canvas area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-medium text-gray-800">Workflow Editor</h1>
            {nodes.length > 0 && (
              <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 font-medium">
                {nodes.length} node{nodes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="ml-auto flex items-center gap-1.5">
            {/* Undo/Redo */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
              <Undo2 size={16} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
              <Redo2 size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Actions */}
            <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30">
              <Save size={14} />
              Save
            </button>
            
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30">
              <Play size={14} />
              Run
            </button>
            
            
          </div>
        </header>

        
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas */}
          <div className="w-full h-full">
            <WorkflowCanvas 
              nodes={nodes} 
              setNodes={setNodes}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
            />
          </div>


         

        
        </div>
      </main>
    </div>
  );
}