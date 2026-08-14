// Editor.tsx - Complete Production Version
import React, { useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Node, Edge, Connection } from 'reactflow';
import {
  GitBranch, PlayCircle, Download, Upload, Undo2, Redo2,
  ZoomIn, ZoomOut, ChevronDown, Save, Loader2, X,
  Pause, Square, RefreshCw, CirclePlay, CircleStop, Calendar
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
    isPaused,
    isDirty,
    setIsDirty,
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
    executionId,
    executionProgress,
    executionStatus,
    saveWorkflow,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    cleanupExecution,
    updateWorkflowMeta,
    loadWorkflow,
  } = useWorkflowEditor(workflowId ? parseInt(workflowId) : undefined);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(parseInt(workflowId));
    }
  }, [workflowId, loadWorkflow]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    setEdges((eds: Edge[]) => {
      const newEdge: Edge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      };
      
      setIsDirty(true);
      return [...eds, newEdge];
    });
  }, [setEdges, setIsDirty]);

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
    
    setIsDirty(true);
  }, [selectedNode, setNodes, setSelectedNode, setIsDirty]);

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
      edges: edges,
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
          setIsDirty(true);
          
          if (data.name) {
            updateWorkflowMeta({ name: data.name, description: data.description });
          }
          
          showToast('success', `Imported ${data.nodes.length} nodes and ${data.edges?.length || 0} edges`);
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
  }, [setNodes, setEdges, updateWorkflowMeta, showToast, setIsDirty]);

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

  const getExecutionStatusColor = () => {
    switch (executionStatus) {
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return '';
    }
  };

  const getExecutionStatusIcon = () => {
    switch (executionStatus) {
      case 'running': return <CirclePlay className="w-4 h-4 animate-pulse" />;
      case 'completed': return <CirclePlay className="w-4 h-4" />;
      case 'failed': return <CircleStop className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <CircleStop className="w-4 h-4" />;
      default: return null;
    }
  };

  const getWorkflowStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
            <button onClick={() => removeToast(toast.id)} className="ml-4 hover:opacity-70">
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

      {/* Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="text"
              value={workflow?.name || ''}
              onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
              className="text-base font-medium bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors px-1 min-w-[200px]"
              placeholder="Workflow Name"
            />
            
            {workflow?.status && (
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getWorkflowStatusColor(workflow.status)}`}>
                {workflow.status}
              </span>
            )}
            
            {workflow?.isScheduled && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Scheduled
              </span>
            )}
            
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
            {/* Save Button */}
            <button
              onClick={saveWorkflow}
              disabled={isSaving || !isDirty}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>

            {/* Run Button */}
            {!isExecuting ? (
              <button
                onClick={executeWorkflow}
                disabled={nodes.length === 0 || !workflow?.id}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayCircle size={14} />
                Run
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? resumeExecution : pauseExecution}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    isPaused 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {isPaused ? <PlayCircle size={14} /> : <Pause size={14} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={cancelExecution}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <Square size={14} />
                  Cancel
                </button>

                <button
                  onClick={cleanupExecution}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Cleanup
                </button>
              </>
            )}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Undo/Redo */}
            <button onClick={handleUndo} disabled={!canUndo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={!canRedo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Redo (Ctrl+Y)">
              <Redo2 size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Zoom Controls */}
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

            {/* Export/Import */}
            <button onClick={exportWorkflow} disabled={nodes.length === 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50 transition-colors" title="Export Workflow">
              <Download size={16} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Import Workflow">
              <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importWorkflow} className="hidden" />

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Logs Toggle */}
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showLogs ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
              title="Toggle Logs"
            >
              <ChevronDown size={16} className={`transition-transform ${showLogs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </header>

        {/* Progress Bar for Running Workflows */}
        {isExecuting && (
          <div className="h-1 bg-gray-200 w-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                executionStatus === 'failed' ? 'bg-red-500' :
                executionStatus === 'paused' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${executionProgress}%` }}
            />
          </div>
        )}

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
                setSelectedNode={setSelectedNode}
                onUndoRedoChange={handleUndoRedoChange}
                onNodeConfigChange={() => {}}
                onConnect={onConnect}
              />
            </div>

            {/* Logs Panel */}
            {showLogs && (
              <div className="h-48 bg-gray-900 border-t border-gray-700 overflow-y-auto flex-shrink-0">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">Execution Logs</span>
                      <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                        {emailLogs.length} entries
                      </span>
                      {isExecuting && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {executionId && (
                        <span className="text-[10px] text-gray-500">
                          ID: {executionId.slice(0, 8)}...
                        </span>
                      )}
                      <button 
                        onClick={() => setEmailLogs([])}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5 font-mono text-xs max-h-[calc(100%-2rem)] overflow-y-auto">
                    {emailLogs.length === 0 ? (
                      <div className="text-gray-500 italic">No logs yet. Run the workflow to see execution logs.</div>
                    ) : (
                      emailLogs.map((log, index) => {
                        let logColor = 'text-gray-300';
                        if (log.includes('ERROR') || log.includes('Failed')) logColor = 'text-red-400';
                        else if (log.includes('SUCCESS') || log.includes('completed successfully')) logColor = 'text-green-400';
                        else if (log.includes('WARNING')) logColor = 'text-yellow-400';
                        else if (log.includes('Progress:')) logColor = 'text-blue-400';
                        
                        return (
                          <div key={index} className={`${logColor} hover:bg-gray-800/50 px-2 py-0.5 rounded transition-colors`}>
                            {log}
                          </div>
                        );
                      })
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