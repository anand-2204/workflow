// hooks/useWorkflowEditor.ts - Fixed Save Function
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import { workflowApi } from '../api/workflowApi';
import type { Workflow } from '../types/workflow';
import { useToast } from './useToast';
import { useNavigate } from 'react-router-dom';

export const useWorkflowEditor = (workflowId?: number) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
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
  const [executionInterval, setExecutionInterval] = useState<NodeJS.Timeout | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionStatus, setExecutionStatus] = useState<string>('idle');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
  const canvasRef = useRef<any>(null);
  const isPollingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 60;

  // ============ LOAD WORKFLOW ============
  const loadWorkflow = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading workflow:', id);
      
      const data = await workflowApi.getById(id);
      console.log('📥 Workflow data:', data);
      
      let loadedNodes: Node[] = [];
      let loadedEdges: Edge[] = [];
      
      if (data.data) {
        loadedNodes = data.data.nodes || [];
        loadedEdges = data.data.edges || [];
        console.log(`📊 From data.data: ${loadedNodes.length} nodes, ${loadedEdges.length} edges`);
      }
      
      if (data.jsonData && loadedNodes.length === 0) {
        try {
          const parsed = JSON.parse(data.jsonData);
          loadedNodes = parsed.nodes || [];
          loadedEdges = parsed.edges || [];
          console.log(`📊 From jsonData: ${loadedNodes.length} nodes, ${loadedEdges.length} edges`);
        } catch (e) {
          console.error('Error parsing jsonData:', e);
        }
      }
      
      console.log(`✅ Loaded: ${loadedNodes.length} nodes, ${loadedEdges.length} edges`);
      if (loadedEdges.length > 0) {
        console.log('🔗 Loaded edges:', JSON.stringify(loadedEdges, null, 2));
      }
      
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setWorkflow(data);
      setIsDirty(false);
      
    } catch (error) {
      console.error('❌ Load error:', error);
      showToast('error', 'Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // ============ SAVE WORKFLOW - FIXED ============
  const saveWorkflow = useCallback(async () => {
    if (!workflow) {
      showToast('error', 'No workflow to save');
      return null;
    }

    try {
      setIsSaving(true);
      
      // CRITICAL: Get current state values
      const currentNodes = nodes;
      const currentEdges = edges;
      
      console.log('💾 SAVING WORKFLOW');
      console.log('📊 Current Nodes:', currentNodes.length);
      console.log('📊 Current Edges:', currentEdges.length);
      
      if (currentEdges.length > 0) {
        console.log('🔗 EDGES TO SAVE:', JSON.stringify(currentEdges, null, 2));
      } else {
        console.warn('⚠️ NO EDGES to save!');
      }
      
      // Clean nodes
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
      
      // Clean edges - PRESERVE EXACT USER CONNECTIONS
      const cleanEdges = currentEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        animated: edge.animated !== undefined ? edge.animated : true,
        style: edge.style || { stroke: '#3b82f6', strokeWidth: 2 }
      }));
      
      console.log(`🧹 Clean Nodes: ${cleanNodes.length}, Clean Edges: ${cleanEdges.length}`);
      
      // Build the data object
      const workflowData = {
        nodes: cleanNodes,
        edges: cleanEdges,
        version: '1.0',
        updatedAt: new Date().toISOString()
      };
      
      // Stringify
      const jsonData = JSON.stringify(workflowData);
      
      // VERIFY: Parse back to check
      const verify = JSON.parse(jsonData);
      console.log(`✅ VERIFIED: ${verify.nodes?.length || 0} nodes, ${verify.edges?.length || 0} edges`);
      
      // Prepare update payload
      const updatePayload = {
        name: workflow.name || 'Untitled',
        jsonData: jsonData,
        description: workflow.description || '',
        status: workflow.status || 'draft'
      };
      
      console.log('📤 SENDING TO API:', {
        name: updatePayload.name,
        jsonDataLength: updatePayload.jsonData.length,
        edgesCount: cleanEdges.length
      });
      
      let savedWorkflow;
      
      if (workflow.id) {
        savedWorkflow = await workflowApi.update(workflow.id, updatePayload);
        console.log('✅ Workflow updated:', savedWorkflow.id);
        showToast('success', 'Workflow saved successfully');
      } else {
        savedWorkflow = await workflowApi.create(updatePayload);
        console.log('✅ Workflow created:', savedWorkflow.id);
        showToast('success', 'Workflow created successfully');
        navigate(`/workflows/${savedWorkflow.id}`);
      }
      
      // Update local state
      setWorkflow(savedWorkflow);
      setIsDirty(false);
      
      return savedWorkflow;
      
    } catch (error: any) {
      console.error('❌ Save error:', error);
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
    if (executionInterval) {
      clearInterval(executionInterval);
      setExecutionInterval(null);
    }
    isPollingRef.current = false;
    setPollingAttempts(0);
  }, [executionInterval]);

  // ============ START POLLING ============
  const startPolling = useCallback((workflowId: number) => {
    stopPolling();
    isPollingRef.current = true;
    let attempts = 0;
    let isPollingComplete = false;
    let pendingCount = 0;

    intervalRef.current = setInterval(async () => {
      attempts++;
      setPollingAttempts(attempts);
      
      if (isPollingComplete || !isPollingRef.current) return;
      
      try {
        const status = await workflowApi.getStatus(workflowId);
        const timestamp = new Date().toLocaleTimeString();
        
        setExecutionProgress(status.progress || 0);
        setEmailLogs(prev => [...prev, `[${timestamp}] Status: ${status.status} - ${status.progress}%`]);
        
        if (status.status === 'pending') {
          pendingCount++;
          if (pendingCount > 10) {
            isPollingComplete = true;
            isPollingRef.current = false;
            clearInterval(intervalRef.current!);
            setIsExecuting(false);
            setExecutionStatus('timeout');
            showToast('warning', 'Execution stuck in pending state');
          }
          return;
        }
        
        pendingCount = 0;
        
        if (['idle', 'completed', 'failed', 'cancelled'].includes(status.status)) {
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          setExecutionStatus(status.status);
          
          if (status.status === 'completed') {
            setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'success' } })));
            setEmailLogs(prev => [...prev, `[${timestamp}] ✅ Workflow completed!`]);
            showToast('success', 'Workflow completed successfully!');
          } else if (status.status === 'failed') {
            setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'error' } })));
            setEmailLogs(prev => [...prev, `[${timestamp}] ❌ Workflow failed`]);
            showToast('error', 'Workflow execution failed');
          }
          return;
        }
        
        if (status.status === 'paused') {
          setIsPaused(true);
          setExecutionStatus('paused');
          setEmailLogs(prev => [...prev, `[${timestamp}] ⏸️ Workflow paused`]);
          return;
        }
        
        if (status.status === 'running') {
          setIsPaused(false);
          setExecutionStatus('running');
        }
        
        if (attempts >= MAX_POLLING_ATTEMPTS) {
          isPollingComplete = true;
          isPollingRef.current = false;
          clearInterval(intervalRef.current!);
          setIsExecuting(false);
          setExecutionStatus('timeout');
          showToast('warning', 'Execution timeout');
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
  }, [stopPolling, setNodes, showToast]);

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
      setEmailLogs([]);
      
      const timestamp = new Date().toLocaleTimeString();
      setEmailLogs(prev => [...prev, `[${timestamp}] 🚀 Starting execution...`]);
      
      const cleanNodes = nodes.map(node => ({
        ...node,
        data: { ...node.data, status: undefined, result: undefined, error: undefined }
      }));

      const payload = {
        nodes: cleanNodes,
        edges: edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      console.log(`📤 Executing with ${nodes.length} nodes, ${edges.length} edges`);
      
      const result = await workflowApi.execute(workflow.id, payload);
      setExecutionId(result.executionId);
      setExecutionStatus('running');
      
      setEmailLogs(prev => [...prev, `[${timestamp}] 📋 Execution ID: ${result.executionId}`]);
      showToast('success', `Execution started: ${result.executionId}`);
      
      setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'running' } })));
      startPolling(workflow.id);
      
    } catch (error: any) {
      console.error('Execution error:', error);
      const timestamp = new Date().toLocaleTimeString();
      setEmailLogs(prev => [...prev, `[${timestamp}] ❌ Failed: ${error.message}`]);
      showToast('error', error.message || 'Failed to execute workflow');
      setIsExecuting(false);
      setExecutionStatus('error');
    }
  }, [workflow, nodes, edges, showToast, startPolling]);

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
      showToast('success', result.message || 'Execution paused');
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to pause execution');
      throw error;
    }
  }, [workflow, showToast]);

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
      showToast('success', result.message || 'Execution resumed');
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to resume execution');
      throw error;
    }
  }, [workflow, showToast]);

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
      setEmailLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏹️ Cancelled`]);
      showToast('success', result.message || 'Execution cancelled');
      setNodes(prev => prev.map(node => ({ ...node, data: { ...node.data, status: 'idle' } })));
      return result;
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel execution');
      throw error;
    }
  }, [workflow, stopPolling, showToast]);

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
      showToast('success', 'Execution cleaned up');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cleanup');
    }
  }, [workflow, stopPolling, showToast]);

  // ============ UPDATE METADATA ============
  const updateWorkflowMeta = useCallback((updates: Partial<Workflow>) => {
    setWorkflow(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

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
      console.log('📝 Starting new workflow');
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setIsDirty(false);
      setWorkflow({
        name: 'Untitled Workflow',
        jsonData: '{"nodes":[],"edges":[]}',
        status: 'draft',
        description: '',
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
          const status = await workflowApi.getStatus(workflowId);
          if (['running', 'paused'].includes(status.status)) {
            setExecutionId(status.executionId);
            setExecutionStatus(status.status);
            setExecutionProgress(status.progress);
            setIsExecuting(true);
            if (status.status === 'paused') setIsPaused(true);
            startPolling(workflowId);
          }
        } catch (error) {
          console.error('Error checking execution:', error);
        }
      };
      checkExisting();
    }
  }, [workflowId, startPolling]);

  // ============ DEBUG: Log edges on change ============
  useEffect(() => {
    console.log(`📊 EDGES CHANGED: ${edges.length} edges`);
    if (edges.length > 0) {
      console.log('🔗 Current edges:', JSON.stringify(edges, null, 2));
    }
  }, [edges]);

  // ============ RETURN ============
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
    pollingAttempts,
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
  };
};