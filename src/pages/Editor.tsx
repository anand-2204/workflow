import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node } from 'reactflow';
import Sidebar from '../components/Sidebar';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { 
  Save, Play, 
  ZoomIn, ZoomOut, GitBranch, Trash2,
  Download, Upload, Undo2, Redo2
} from 'lucide-react';

export default function Editor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(100);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

   const clearCanvas = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear all nodes?')) {
    
      setNodes([]);
      
      localStorage.removeItem('workflowNodes');
    }
  };

   const handleUndoRedoChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);


  // Export workflow
 const exportWorkflow = useCallback(() => {
    const workflow = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes,
      metadata: {
        nodeCount: nodes.length,
      }
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes]);

  // Import workflow
  const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        if (workflow.nodes && Array.isArray(workflow.nodes)) {
          if (window.confirm(`Import workflow with ${workflow.nodes.length} nodes?`)) {
            setNodes(workflow.nodes);
            localStorage.setItem('workflowNodes', JSON.stringify(workflow.nodes));
          }
        } else {
          alert('Invalid workflow file format');
        }
      } catch (error) {
        alert('Error reading workflow file');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setNodes]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
      const state = canvasRef.current.getState();
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.redo();
      const state = canvasRef.current.getState();
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
          <button 
            onClick={clearCanvas}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
            title="Clear canvas"
          >
            <Trash2 size={16} />
          </button>
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
            {/* Undo/Redo Buttons */}
            <button 
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            {/* Export/Import Buttons */}
            <button 
              onClick={exportWorkflow}
              disabled={nodes.length === 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export workflow"
            >
              <Download size={16} />
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title="Import workflow"
            >
              <Upload size={16} />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importWorkflow}
              className="hidden"
            />
            
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
           
            
            
           
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {/* Canvas */}
          <div className="w-full h-full">
            <WorkflowCanvas 
              ref={canvasRef}
              nodes={nodes} 
              setNodes={setNodes}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              onUndoRedoChange={handleUndoRedoChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
