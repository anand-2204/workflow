// hooks/useWorkflowEditor.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import { workflowApi } from '../api/workflowApi';
import type { Workflow } from '../types/workflow';
import { useToast } from './useToast';
import { useNavigate } from 'react-router-dom';

export const useWorkflowEditor = (workflowId?: number) => {
  const navigate = useNavigate();
  const { showToast, removeToast } = useToast();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionStatus, setExecutionStatus] = useState<string>('idle');
  const [toastId, setToastId] = useState<string | null>(null);
  
  const canvasRef = useRef<any>(null);
  const isPollingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 60;

  // ============ HELPER FUNCTIONS ============
  
  const isExecutionComplete = (status?: string): boolean => {
    if (!status) return false;
    const completedStatuses = ['idle', 'completed', 'finished', 'failed', 'cancelled', 'done', 'success'];
    return completedStatuses.includes(status.toLowerCase());
  };

  const isExecutionSuccessful = (status?: string): boolean => {
    if (!status) return false;
    return status.toLowerCase() === 'completed' || 
           status.toLowerCase() === 'finished' || 
           status.toLowerCase() === 'done' || 
           status.toLowerCase() === 'success';
  };

  // ============ SHOW AUTO-CLOSE TOAST ============
  const showAutoCloseToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number = 5000) => {
    // Remove any existing toast
    if (toastId) {
      removeToast(toastId);
    }
    
    // Show new toast and store its ID
    const id = showToast(type, message);
    setToastId(id);
    
    // Auto-close after duration
    setTimeout(() => {
      if (id) {
        removeToast(id);
        setToastId(null);
      }
    }, duration);
    
    return id;
  }, [showToast, removeToast, toastId]);

  // ============ LOAD WORKFLOW ============
  const loadWorkflow = useCallback(async (id: number) => {
    if (!id || isNaN(id) || id <= 0) {
      showToast('error', 'Invalid workflow ID');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await workflowApi.getById(id);
      
      let loadedNodes: Node[] = [];
      let loadedEdges: Edge[] = [];
      let workflowData = response;
      
      if (response.success && response.data) {
        workflowData = response.data;
      }
      
      if (workflowData.data && workflowData.data.nodes) {
        loadedNodes = workflowData.data.nodes || [];
        loadedEdges = workflowData.data.edges || [];
      } else if (workflowData.nodes) {
        loadedNodes = workflowData.nodes || [];
        loadedEdges = workflowData.edges || [];
      } else if (workflowData.jsonData) {
        try {
          const parsed = JSON.parse(workflowData.jsonData);
          loadedNodes = parsed.nodes || [];
          loadedEdges = parsed.edges || [];
        } catch (e) {
          console.error('Error parsing jsonData:', e);
        }
      }
      
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setWorkflow(workflowData);
      setIsDirty(false);
      
    } catch (error) {
      console.error('Load error:', error);
      showToast('error', 'Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // ============ SAVE WORKFLOW ============
  const saveWorkflow = useCallback(async () => {
    if (!workflow) {
      showToast('error', 'No workflow to save');
      return null;
    }

    try {
      setIsSaving(true);
      
      const currentNodes = nodes;
      const currentEdges = edges;
      
      const cleanNodes = currentNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { 
          ...node.data, 
          status: undefined, 
          result: undefined, 
          error: undefined 
        }
      }));
      
      const cleanEdges = currentEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        animated: edge.animated !== undefined ? edge.animated : true,
        style: edge.style || { stroke: '#3b82f6', strokeWidth: 2 }
      }));
      
      const workflowData = {
        nodes: cleanNodes,
        edges: cleanEdges,
        version: '1.0',
        updatedAt: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(workflowData);
      
      const updatePayload = {
        name: workflow.name || 'Untitled',
        jsonData: jsonData,
        description: workflow.description || '',
        status: workflow.status || 'draft'
      };
      
      let savedWorkflow;
      
      if (workflow.id) {
        savedWorkflow = await workflowApi.update(workflow.id, updatePayload);
        showToast('success', 'Workflow saved successfully');
      } else {
        savedWorkflow = await workflowApi.create(updatePayload);
        showToast('success', 'Workflow created successfully');
        navigate(`/workflows/${savedWorkflow.id}`);
      }
      
      setWorkflow(savedWorkflow);
      setIsDirty(false);
      
      return savedWorkflow;
      
    } catch (error: any) {
      console.error('Save error:', error);
      showToast('error', error.message || 'Failed to save workflow');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [workflow, nodes, edges, navigate, showToast]);

  // ============ STOP POLLING ============
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // ============ START POLLING ============
  const startPolling = useCallback((workflowId: number) => {
    stopPolling();
    isPollingRef.current = true;
    let attempts = 0;
    let isPollingComplete = false;
    let pendingCount = 0;

    intervalRef.current = setInterval(async () => {
      attempts++;
      
      if (isPollingComplete || !isPollingRef.current) return;
      
      try {
        const statusResponse = await workflowApi.getStatus(workflowId);
        
        // Extract status data from response
        const statusData = statusResponse.data || statusResponse;
        const currentStatus = statusData.status || statusResponse.status;
        const progress = statusData.progress || statusResponse.progress || 0;
        const execId = statusData.executionId || statusResponse.executionId;
        
        setExecutionProgress(progress);
        
        // Check if the response has success: true
        const hasSuccess = statusResponse.success === true || statusData.success === true;
        
        console.log('📊 Polling status:', { 
          currentStatus, 
          progress, 
          hasSuccess,
          execId,
          rawResponse: statusResponse 
        });
        
        // If success is true, consider it completed
        if (hasSuccess) {
          console.log('✅ Workflow completed with success: true');
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          setExecutionStatus('completed');
          setExecutionProgress(100);
          
          setNodes(prev => prev.map(node => ({ 
            ...node, 
            data: { ...node.data, status: 'completed' } 
          })));
          
          // Show auto-close toast
          showAutoCloseToast('success', '✅ Workflow completed successfully!', 5000);
          return;
        }
        
        if (currentStatus === 'pending') {
          pendingCount++;
          if (pendingCount > 10) {
            isPollingComplete = true;
            isPollingRef.current = false;
            clearInterval(intervalRef.current!);
            setIsExecuting(false);
            setExecutionStatus('timeout');
            showAutoCloseToast('warning', '⚠️ Execution stuck in pending state', 5000);
          }
          return;
        }
        
        pendingCount = 0;
        
        // Check for completion
        if (isExecutionComplete(currentStatus)) {
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          
          // Set the final status
          if (isExecutionSuccessful(currentStatus)) {
            setExecutionStatus('completed');
            setExecutionProgress(100);
            setNodes(prev => prev.map(node => ({ 
              ...node, 
              data: { ...node.data, status: 'completed' } 
            })));
            showAutoCloseToast('success', '✅ Workflow completed successfully!', 5000);
          } else if (currentStatus === 'failed' || currentStatus === 'error') {
            setExecutionStatus('failed');
            setNodes(prev => prev.map(node => ({ 
              ...node, 
              data: { ...node.data, status: 'error' } 
            })));
            showAutoCloseToast('error', '❌ Workflow execution failed', 5000);
          } else if (currentStatus === 'cancelled') {
            setExecutionStatus('cancelled');
            setNodes(prev => prev.map(node => ({ 
              ...node, 
              data: { ...node.data, status: 'idle' } 
            })));
            showAutoCloseToast('warning', '⏹️ Workflow execution cancelled', 5000);
          } else {
            setExecutionStatus(currentStatus);
          }
          return;
        }
        
        if (currentStatus === 'paused') {
          setIsPaused(true);
          setExecutionStatus('paused');
          return;
        }
        
        if (currentStatus === 'running' || currentStatus === 'in-progress') {
          setIsPaused(false);
          setExecutionStatus('running');
        }
        
        if (attempts >= MAX_POLLING_ATTEMPTS) {
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          setExecutionStatus('timeout');
          showAutoCloseToast('warning', '⏱️ Execution timeout', 5000);
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts >= MAX_POLLING_ATTEMPTS) {
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          setExecutionStatus('error');
        }
      }
    }, 2000);
  }, [stopPolling, setNodes, showAutoCloseToast]);

  // ============ EXECUTE WORKFLOW ============
  const executeWorkflow = useCallback(async () => {
    if (!workflow?.id) {
      showToast('error', 'Please save the workflow first');
      return;
    }

    if (nodes.length === 0) {
      showToast('warning', 'No nodes to execute');
      return;
    }

    try {
      setIsExecuting(true);
      setIsPaused(false);
      setExecutionStatus('starting');
      setExecutionProgress(0);
      setEmailLogs([]);
      
      const cleanNodes = nodes.map(node => ({
        ...node,
        data: { ...node.data, status: undefined, result: undefined, error: undefined }
      }));

      const payload = {
        nodes: cleanNodes,
        edges: edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      const result = await workflowApi.execute(workflow.id, payload);
      
      // Handle wrapped response
      const execId = result.executionId || result.data?.executionId;
      const status = result.status || result.data?.status || 'running';
      
      setExecutionId(execId);
      setExecutionStatus(status);
      
      // Show start toast (auto-close after 3 seconds)
      showAutoCloseToast('info', '🚀 Workflow execution started...', 3000);
      
      setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'running' } })));
      startPolling(workflow.id);
      
    } catch (error: any) {
      console.error('Execution error:', error);
      showAutoCloseToast('error', error.message || 'Failed to execute workflow', 5000);
      setIsExecuting(false);
      setExecutionStatus('error');
    }
  }, [workflow, nodes, edges, showAutoCloseToast, startPolling]);

  // ============ PAUSE EXECUTION ============
  const pauseExecution = useCallback(async () => {
    if (!workflow?.id) {
      showToast('error', 'No workflow to pause');
      return;
    }
    try {
      const result = await workflowApi.pauseExecution(workflow.id);
      setIsPaused(true);
      setExecutionStatus('paused');
      showAutoCloseToast('success', result.message || 'Execution paused', 3000);
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to pause execution');
      throw error;
    }
  }, [workflow, showAutoCloseToast, showToast]);

  // ============ RESUME EXECUTION ============
  const resumeExecution = useCallback(async () => {
    if (!workflow?.id) {
      showToast('error', 'No workflow to resume');
      return;
    }
    try {
      const result = await workflowApi.resumeExecution(workflow.id);
      setIsPaused(false);
      setExecutionStatus('running');
      showAutoCloseToast('success', result.message || 'Execution resumed', 3000);
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to resume execution');
      throw error;
    }
  }, [workflow, showAutoCloseToast, showToast]);

  // ============ CANCEL EXECUTION ============
  const cancelExecution = useCallback(async () => {
    if (!workflow?.id) {
      showToast('error', 'No workflow to cancel');
      return;
    }
    try {
      const result = await workflowApi.cancelExecution(workflow.id);
      setIsPaused(false);
      setIsExecuting(false);
      setExecutionStatus('cancelled');
      stopPolling();
      showAutoCloseToast('success', result.message || 'Execution cancelled', 3000);
      setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'idle' } })));
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel execution');
      throw error;
    }
  }, [workflow, stopPolling, showAutoCloseToast, showToast]);

  // ============ CLEANUP EXECUTION ============
  const cleanupExecution = useCallback(async () => {
    if (!workflow?.id) {
      showToast('error', 'No workflow to cleanup');
      return;
    }
    try {
      await workflowApi.cleanupExecution(workflow.id);
      setIsExecuting(false);
      setIsPaused(false);
      setExecutionId(null);
      setExecutionStatus('idle');
      setExecutionProgress(0);
      setEmailLogs([]);
      stopPolling();
      setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'idle' } })));
      showAutoCloseToast('success', 'Execution cleaned up', 3000);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cleanup');
    }
  }, [workflow, stopPolling, showAutoCloseToast, showToast]);

  // ============ UPDATE METADATA ============
  const updateWorkflowMeta = useCallback((updates: Partial<Workflow>) => {
    setWorkflow(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      stopPolling();
      // Clear any pending toast
      if (toastId) {
        removeToast(toastId);
      }
    };
  }, [stopPolling, toastId, removeToast]);

  // ============ AUTO-SAVE ============
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (isDirty && workflow?.id) {
        saveWorkflow();
      }
    }, 30000);
    return () => clearTimeout(saveTimeout);
  }, [isDirty, workflow, saveWorkflow]);

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveWorkflow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveWorkflow]);

  // ============ LOAD INITIAL DATA ============
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setIsDirty(false);
      setWorkflow({
        name: 'Untitled Workflow',
        jsonData: '{"nodes":[],"edges":[]}',
        status: 'draft',
        description: '',
        id: 0,
        createdAt: new Date().toISOString(),
      } as Workflow);
      
      localStorage.removeItem('workflowNodes');
      localStorage.removeItem('workflowEdges');
    }
  }, [workflowId, loadWorkflow]);

  // ============ CHECK EXISTING EXECUTION ============
  useEffect(() => {
    if (workflowId) {
      const checkExisting = async () => {
        try {
          const statusResponse = await workflowApi.getStatus(workflowId);
          const statusData = statusResponse.data || statusResponse;
          const currentStatus = statusData.status || statusResponse.status;
          const hasSuccess = statusResponse.success === true || statusData.success === true;
          
          // If success is true, mark as completed
          if (hasSuccess) {
            setExecutionStatus('completed');
            setExecutionProgress(100);
            return;
          }
          
          // Check if execution is running or paused
          if (['running', 'paused', 'pending'].includes(currentStatus)) {
            setExecutionId(statusData.executionId || statusResponse.executionId);
            setExecutionStatus(currentStatus);
            setExecutionProgress(statusData.progress || statusResponse.progress || 0);
            setIsExecuting(true);
            if (currentStatus === 'paused') setIsPaused(true);
            startPolling(workflowId);
          } 
          // Check if execution completed successfully
          else if (isExecutionSuccessful(currentStatus)) {
            setExecutionStatus('completed');
            setExecutionProgress(100);
          }
        } catch (error) {
          console.error('Error checking execution:', error);
        }
      };
      checkExisting();
    }
  }, [workflowId, startPolling]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNode,
    setSelectedNode,
    workflow,
    setWorkflow,
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
    loadWorkflow,
    saveWorkflow,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    cleanupExecution,
    updateWorkflowMeta,
    setExecutionId,
    stopPolling,
    isExecutionComplete,
    isExecutionSuccessful,
  };
};