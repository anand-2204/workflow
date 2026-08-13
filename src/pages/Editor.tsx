
import React, { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Node, Edge, Connection } from 'reactflow';
import {
  GitBranch, PlayCircle, Download, Upload, Undo2, Redo2,
  ZoomIn, ZoomOut, ChevronDown, Save, Loader2, X
} from 'lucide-react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { useWorkflowEditor } from '../hooks/useWorkflowEditor';
import { useToast } from '../hooks/useToast';

export default function Editor() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNode,
    setSelectedNode,
    workflow,
    isLoading,
    isSaving,
    isExecuting,
    isDirty,
    emailLogs,
    setEmailLogs,
    showLogs,
    setShowLogs,
    canUndo,
    setCanUndo,
    canRedo,
    setCanRedo,
    zoom,
    setZoom,
    canvasRef,
    saveWorkflow,
    executeWorkflow,
    updateWorkflowMeta,
  } = useWorkflowEditor(workflowId ? parseInt(workflowId) : undefined);

  const onNodesChange = useCallback((changes: any) => {
    // Handle node changes
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    // Handle edge changes
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds: Edge[]) => {
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        animated: true,
      };
      return [...eds, newEdge];
    });
  }, [setEdges]);

  const updateNodeProperties = useCallback((newData: any) => {
    if (!selectedNode) return;
    
    setNodes((prev: Node[]) => 
      prev.map((node: Node) => 
        node.id === selectedNode.id 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    
    setSelectedNode((prev: Node | null) => 
      prev ? { ...prev, data: { ...prev.data, ...newData } } : null
    );
  }, [selectedNode, setNodes, setSelectedNode]);

  const closeProperties = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const exportWorkflow = useCallback(() => {
    if (!workflow) {
      showToast('warning', 'No workflow to export');
      return;
    }

    const exportData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      nodes: nodes.map((node: Node) => ({
        ...node,
        data: { ...node.data, status: undefined, result: undefined, error: undefined }
      })),
      edges,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Workflow exported successfully');
  }, [workflow, nodes, edges, showToast]);

  const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.nodes && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          setEdges(data.edges || []);
          
          if (data.name) {
            updateWorkflowMeta({ name: data.name, description: data.description });
          }
          
          showToast('success', `Imported workflow with ${data.nodes.length} nodes`);
        } else {
          showToast('error', 'Invalid workflow file format');
        }
      } catch (error) {
        showToast('error', 'Failed to import workflow');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setNodes, setEdges, updateWorkflowMeta, showToast]);

  const handleZoomIn = useCallback(() => {
    canvasRef.current?.zoomIn?.();
    requestAnimationFrame(() => {
      const zoom = canvasRef.current?.getZoom?.() || 1;
      setZoom(Math.round(zoom * 100));
    });
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    canvasRef.current?.zoomOut?.();
    requestAnimationFrame(() => {
      const zoom = canvasRef.current?.getZoom?.() || 1;
      setZoom(Math.round(zoom * 100));
    });
  }, [setZoom]);

  const handleZoomReset = useCallback(() => {
    canvasRef.current?.zoomReset?.();
    requestAnimationFrame(() => {
      const zoom = canvasRef.current?.getZoom?.() || 1;
      setZoom(Math.round(zoom * 100));
    });
  }, [setZoom]);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo?.();
    const state = canvasRef.current?.getState?.();
    if (state) {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, [setCanUndo, setCanRedo]);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo?.();
    const state = canvasRef.current?.getState?.();
    if (state) {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, [setCanUndo, setCanRedo]);

  const handleUndoRedoChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, [setCanUndo, setCanRedo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in ${
              toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

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
        <Sidebar onAddNode={() => {}} />
      </aside>

      {/* Canvas area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              value={workflow?.name || ''}
              onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
              className="text-base font-medium bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors px-1 min-w-[200px]"
              placeholder="Workflow Name"
            />
            {isDirty && (
              <span className="text-xs text-yellow-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Unsaved
              </span>
            )}
            {isSaving && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={saveWorkflow}
              disabled={isSaving || !isDirty}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>

            <button
              onClick={executeWorkflow}
              disabled={nodes.length === 0 || isExecuting || !workflow?.id}
              className={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isExecuting ? 'animate-pulse' : ''
              }`}
            >
              <PlayCircle size={14} className={isExecuting ? 'animate-spin' : ''} />
              {isExecuting ? 'Running...' : 'Run'}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button onClick={handleUndo} disabled={!canUndo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={!canRedo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Redo (Ctrl+Y)">
              <Redo2 size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleZoomReset} className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg min-w-[40px] transition-colors">
              {zoom}%
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Zoom In">
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button onClick={exportWorkflow} disabled={nodes.length === 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Export Workflow">
              <Download size={16} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Import Workflow">
              <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importWorkflow} className="hidden" />

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showLogs ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
              title="Toggle Logs"
            >
              <ChevronDown size={16} className={`transition-transform ${showLogs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </header>

        {/* Canvas + Properties + Logs */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              <WorkflowCanvas 
                ref={canvasRef}
                nodes={nodes} 
                setNodes={setNodes}
                edges={edges}
                setEdges={setEdges}
                selectedNode={selectedNode}
                setSelectedNode={(node) => {
                  setSelectedNode(node);
                }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onUndoRedoChange={handleUndoRedoChange}
                onNodeConfigChange={() => {}}
              />
            </div>

            {/* Logs Panel */}
            {showLogs && (
              <div className="h-48 bg-gray-900 border-t border-gray-700 overflow-y-auto flex-shrink-0">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">📋 Execution Logs</span>
                      <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                        {emailLogs.length} entries
                      </span>
                    </div>
                    <button 
                      onClick={() => setEmailLogs([])}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-0.5 font-mono text-xs max-h-[calc(100%-2rem)] overflow-y-auto">
                    {emailLogs.length === 0 ? (
                      <div className="text-gray-500 italic">No logs yet. Run the workflow to see execution logs.</div>
                    ) : (
                      emailLogs.map((log, index) => (
                        <div key={index} className="text-gray-300 hover:bg-gray-800/50 px-2 py-0.5 rounded">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {selectedNode && (
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