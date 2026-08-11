import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node } from 'reactflow';
import Sidebar from '../components/Sidebar';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { 
  GitBranch, Trash2, Download, Upload, Undo2, Redo2,
  Play, Save, X, Settings, PlayCircle, ZoomIn, ZoomOut
} from 'lucide-react';

// Properties Panel Component
const PropertiesPanel = ({ node, onUpdate, onClose }: { 
  node: Node | null; 
  onUpdate: (data: any) => void;
  onClose: () => void;
}) => {
  if (!node) return null;

  const [localData, setLocalData] = useState(node.data);

  useEffect(() => {
    setLocalData(node.data);
  }, [node]);

  const handleSave = () => {
    onUpdate(localData);
  };

  const renderNodeSpecificFields = () => {
    const nodeType = node.type || node.data?.type;
    
    switch (nodeType) {
      case 'http':
        return (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700">HTTP Configuration</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
                <option>PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL</label>
              <input 
                type="text" 
                placeholder="https://api.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Email Configuration</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="email" placeholder="recipient@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <input type="text" placeholder="Email subject" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message</label>
              <textarea 
                placeholder="Email body..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        );
      
      case 'database':
        return (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Database Configuration</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Query</label>
              <textarea 
                placeholder="SELECT * FROM users WHERE id = ?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        );
      
      case 'whatsapp':
        return (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700">WhatsApp Configuration</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
              <input type="text" placeholder="+1234567890" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message</label>
              <textarea 
                placeholder="WhatsApp message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-800">Properties</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <span className="text-xs text-gray-500">Node Type</span>
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-xl">{localData.icon || '📦'}</span>
              {localData.label || 'Node'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input 
              type="text" 
              value={localData.label || ''}
              onChange={(e) => setLocalData({ ...localData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter node label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              value={localData.description || ''}
              onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={3}
              placeholder="Enter node description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Emoji)
            </label>
            <input 
              type="text" 
              value={localData.icon || ''}
              onChange={(e) => setLocalData({ ...localData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., 🚀"
              maxLength={2}
            />
          </div>

          {renderNodeSpecificFields()}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
        >
          <Save size={16} />
          Save Properties
        </button>
      </div>
    </div>
  );
};

export default function Editor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  const clearCanvas = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear all nodes?')) {
      if (canvasRef.current && canvasRef.current.clearCanvas) {
        canvasRef.current.clearCanvas();
      }
      setNodes([]);
      setSelectedNode(null);
      setShowProperties(false);
      localStorage.removeItem('workflowNodes');
      setCanUndo(false);
      setCanRedo(false);
    }
  };

  const handleUndoRedoChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  // Update node properties
  const updateNodeProperties = useCallback((newData: any) => {
    if (!selectedNode) return;
    
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
  }, [selectedNode]);

  // Close properties panel
  const closeProperties = useCallback(() => {
    setShowProperties(false);
    setSelectedNode(null);
  }, []);

  // Workflow execution engine
  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute! Add some nodes first.');
      return;
    }

    const startNode = nodes.find(n => n.type === 'start' || n.data.label === 'Start');
    if (!startNode) {
      alert('No start node found! Add a Start node to begin.');
      return;
    }

    setIsExecuting(true);

    const resetNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'idle' as const,
      }
    }));
    setNodes(resetNodes);

    const executeNode = async (node: Node) => {
      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'running' as const } }
          : n
      ));

      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

      const success = Math.random() < 0.9;
      
      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: success ? 'success' as const : 'error' as const } }
          : n
      ));

      if (!success) {
        throw new Error(`Node "${node.data.label}" failed`);
      }
    };

    try {
      for (const node of nodes) {
        if (node.type !== 'start' && node.type !== 'end') {
          await executeNode(node);
        }
      }
      
      const endNode = nodes.find(n => n.type === 'end');
      if (endNode) {
        await executeNode(endNode);
      }
      
      alert('✅ Workflow executed successfully!');
    } catch (error) {
      alert(`❌ Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, setNodes]);

  // Export workflow
  const exportWorkflow = useCallback(() => {
    const workflow = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(node => {
        const { status, ...restData } = node.data;
        return { ...node, data: restData };
      }),
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
            setCanUndo(false);
            setCanRedo(false);
            setShowProperties(false);
            setSelectedNode(null);
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
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Escape' && showProperties) {
        closeProperties();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, showProperties, closeProperties]);

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
            {/* Run Button */}
            <button 
              onClick={executeWorkflow}
              disabled={nodes.length === 0 || isExecuting}
              className={`px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                isExecuting ? 'animate-pulse' : ''
              }`}
            >
              <PlayCircle size={14} className={isExecuting ? 'animate-spin' : ''} />
              {isExecuting ? 'Running...' : 'Run'}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

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
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas 
              ref={canvasRef}
              nodes={nodes} 
              setNodes={setNodes}
              selectedNode={selectedNode}
              setSelectedNode={(node) => {
                setSelectedNode(node);
                setShowProperties(!!node);
              }}
              onUndoRedoChange={handleUndoRedoChange}
            />
          </div>

          {/* Properties Panel */}
          {showProperties && selectedNode && (
            <PropertiesPanel 
              node={selectedNode}
              onUpdate={updateNodeProperties}
              onClose={closeProperties}
            />
          )}
        </div>
      </main>
    </div>
  );
}