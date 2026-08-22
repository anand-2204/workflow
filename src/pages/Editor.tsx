// Editor.tsx
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Node, Edge, Connection } from 'reactflow';
import {
  GitBranch, PlayCircle, Save, Loader2, X, Pause, Square, RefreshCw,
  CirclePlay, CircleStop, CheckCircle, AlertCircle, PauseCircle,
  ArrowRight, ArrowLeft, Menu, PanelRightClose
} from 'lucide-react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
// ✅ PURANA PROPERTIES PANEL IMPORT KAREIN (HorizontalPropertiesPanel HATA DIYA)
import { PropertiesPanel } from '../components/PropertiesPanel';
import { useWorkflowEditor } from '../hooks/useWorkflowEditor';
import { useToast } from '../hooks/useToast';

// ============= HELPER FUNCTIONS =============

const isExecutionComplete = (status?: string): boolean => {
  if (!status) return false;
  const completedStatuses = ['idle', 'completed', 'failed', 'cancelled', 'done', 'success'];
  return completedStatuses.includes(status.toLowerCase());
};

const isExecutionSuccessful = (status?: string): boolean => {
  if (!status) return false;
  return status.toLowerCase() === 'completed' || 
         status.toLowerCase() === 'done' || 
         status.toLowerCase() === 'success';
};

// ============= COMPLETION MODAL =============

const CompletionModal: React.FC<{
  isOpen: boolean;
  status: string;
  workflowId?: number;
  onClose: () => void;
}> = ({ isOpen, status, workflowId, onClose }) => {
  if (!isOpen) return null;

  const isSuccess = isExecutionSuccessful(status);
  const isFailed = status === 'failed' || status === 'error';
  const isCancelled = status === 'cancelled';

  const getStatusColor = () => {
    if (isSuccess) return 'border-green-200 bg-green-50';
    if (isFailed) return 'border-red-200 bg-red-50';
    if (isCancelled) return 'border-gray-200 bg-gray-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getStatusTitle = () => {
    if (isSuccess) return 'Workflow Completed Successfully!';
    if (isFailed) return 'Workflow Failed';
    if (isCancelled) return 'Workflow Cancelled';
    return 'Workflow Finished';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 border-2 ${getStatusColor()} animate-scale-in`}>
        <div className="flex flex-col items-center text-center">
          <h3 className="text-lg font-bold text-gray-800">{getStatusTitle()}</h3>
          {workflowId && (
            <p className="text-sm text-gray-500 mt-1">
              Workflow ID: <span className="font-mono text-gray-700">{workflowId}</span>
            </p>
          )}
          <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============

export default function Editor() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  // Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [previousExecutionStatus, setPreviousExecutionStatus] = useState<string | undefined>();
  const [executionResult, setExecutionResult] = useState<{ status: string; } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [executionStartedByUser, setExecutionStartedByUser] = useState(false);

  const {
    nodes, setNodes, edges, setEdges, selectedNode, setSelectedNode,
    workflow, isLoading, isSaving, isExecuting, isPaused, isDirty, setIsDirty,
    canvasRef, executionId, executionProgress, executionStatus,
    saveWorkflow, executeWorkflow: originalExecuteWorkflow, pauseExecution,
    resumeExecution, cancelExecution, cleanupExecution, updateWorkflowMeta, loadWorkflow,
  } = useWorkflowEditor(workflowId ? parseInt(workflowId) : undefined);

  const executeWorkflow = useCallback(async () => {
    setExecutionStartedByUser(true);
    setExecutionResult(null);
    setShowCompletionModal(false);
    await originalExecuteWorkflow();
  }, [originalExecuteWorkflow]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(parseInt(workflowId));
    }
    setIsInitialLoad(true);
  }, [workflowId, loadWorkflow]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setPreviousExecutionStatus(executionStatus);
      return;
    }

    const statusChanged = previousExecutionStatus !== executionStatus;
    const isComplete = executionStatus && isExecutionComplete(executionStatus);
    
    if (statusChanged && isComplete && executionStartedByUser) {
      setExecutionResult({ status: executionStatus });

      if (isExecutionSuccessful(executionStatus)) {
        showToast('success', 'Workflow completed successfully!');
      } else if (executionStatus === 'failed' || executionStatus === 'error') {
        showToast('error', 'Workflow execution failed.');
      } else if (executionStatus === 'cancelled') {
        showToast('warning', 'Workflow execution cancelled.');
      }

      setTimeout(() => {
        setShowCompletionModal(true);
      }, 500);

      setExecutionStartedByUser(false);
    }

    setPreviousExecutionStatus(executionStatus);
  }, [executionStatus, previousExecutionStatus, showToast, isInitialLoad, executionStartedByUser]);

  useEffect(() => {
    if (isInitialLoad) return;
    
    if (executionStartedByUser && executionStatus === 'running' && previousExecutionStatus !== 'running') {
      showToast('info', 'Workflow execution started...');
    }
  }, [executionStatus, previousExecutionStatus, executionStartedByUser, showToast, isInitialLoad]);

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

  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
  }, []);

  const getExecutionStatusIcon = () => {
    if (isExecutionSuccessful(executionStatus)) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    switch (executionStatus) {
      case 'running': return <CirclePlay className="w-4 h-4 animate-pulse" />;
      case 'failed': 
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <CircleStop className="w-4 h-4" />;
      default: return null;
    }
  };

  const getExecutionStatusColor = () => {
    if (isExecutionSuccessful(executionStatus)) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    
    switch (executionStatus) {
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': 
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return '';
    }
  };

  const renderExecutionStatusBadge = () => {
    if (!executionStatus || !isExecutionComplete(executionStatus)) return null;
    
    const isSuccess = isExecutionSuccessful(executionStatus);
    const displayStatus = isSuccess ? 'completed' : executionStatus.toLowerCase();
    
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed: { label: 'Completed', color: 'text-green-600 bg-green-50 border-green-200' },
      done: { label: 'Completed', color: 'text-green-600 bg-green-50 border-green-200' },
      success: { label: 'Completed', color: 'text-green-600 bg-green-50 border-green-200' },
      failed: { label: 'Failed', color: 'text-red-600 bg-red-50 border-red-200' },
      error: { label: 'Failed', color: 'text-red-600 bg-red-50 border-red-200' },
      cancelled: { label: 'Cancelled', color: 'text-gray-600 bg-gray-50 border-gray-200' },
      idle: { label: 'Idle', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    };

    const config = statusConfig[displayStatus];
    if (!config) return null;

    const getIcon = () => {
      if (isSuccess) return <CheckCircle className="w-3 h-3" />;
      if (displayStatus === 'failed' || displayStatus === 'error') return <AlertCircle className="w-3 h-3" />;
      if (displayStatus === 'cancelled') return <CircleStop className="w-3 h-3" />;
      if (displayStatus === 'idle') return <PauseCircle className="w-3 h-3" />;
      return null;
    };

    return (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${config.color} flex items-center gap-1`}>
        {getIcon()}
        {config.label}
      </span>
    );
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

      {/* Completion Modal */}
      {executionResult && (
        <CompletionModal
          isOpen={showCompletionModal}
          status={executionResult.status}
          workflowId={workflow?.id}
          onClose={handleCloseCompletionModal}
        />
      )}

      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="w-[320px] min-w-[320px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20 animate-slide-in-left">
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
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors">
              <PanelRightClose size={16} />
            </button>
          </div>
          <Sidebar onAddNode={() => {}} />
        </aside>
      )}

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0">
          
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 mr-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex items-center gap-3 flex-1">
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

            {renderExecutionStatusBadge()}
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
          </div>
        </header>

        {/* Progress Bar */}
        {isExecuting && (
          <div className="h-1 bg-gray-200 w-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                executionStatus === 'failed' || executionStatus === 'error' ? 'bg-red-500' :
                executionStatus === 'paused' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${executionProgress}%` }}
            />
          </div>
        )}

        {/* Canvas + Properties Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas 
            ref={canvasRef}
            workflowId={workflow?.id} 
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            onUndoRedoChange={() => {}}
            onNodeConfigChange={() => {}}
            onConnect={onConnect}
            />
          </div>

          {/* ✅ Horizontal Panel (80% Width, Center) - Purana PropertiesPanel */}
          {selectedNode && (
            <div className="h-[500px] w-[80%] mx-auto mb-4 border border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col animate-slide-up z-10 rounded-xl overflow-hidden">
              
              {/* Panel Header */}
              <div className="h-12 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <GitBranch size={16} className="text-blue-600" />
                    {selectedNode.data?.label || 'Node'}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Properties</span>
                </div>
                <button onClick={closeProperties} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Split Content */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT: Input Config (Purana PropertiesPanel ab w-full hai) */}
                <div className="w-1/2  border-r border-gray-200 overflow-hidden bg-white">
                  <PropertiesPanel 
                    node={selectedNode}
                    onUpdate={updateNodeProperties}
                    onClose={closeProperties}
                  />
                </div>

                {/* RIGHT: Output / Execution Data */}
              <div className="w-1/2 overflow-y-auto bg-gray-50/50 p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <ArrowLeft className="w-4 h-4 text-green-500" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Output / Execution Data</h4>
                </div>
                
                {/* ✅ Dynamic Output Dikhane ke liye */}
                {selectedNode?.data?.executionResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-green-700">Execution Successful</span>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Execution ID:</p>
                      <p className="text-sm font-mono text-gray-800 break-all">
                        {selectedNode.data.executionResult.executionId || 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Status:</p>
                      <p className="text-sm font-medium text-gray-800">{selectedNode.data.executionResult.status || 'Success'}</p>
                    </div>

                    {/* JSON Output */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Data:</p>
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all max-h-48 overflow-y-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(selectedNode.data.executionResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Agar execution nahi hua hai toh placeholder */
                  <div className="flex flex-col items-center justify-center h-[80%] text-center text-gray-400">
                    <RefreshCw className="w-8 h-8 mb-3 opacity-50 animate-spin-slow" />
                    <p className="text-sm font-medium">No output data</p>
                    <p className="text-xs mt-1">Click the Run button on a node to see results</p>
                  </div>
                )}
              </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}