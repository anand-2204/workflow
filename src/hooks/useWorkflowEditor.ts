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
  const [isDirty, setIsDirty] = useState(false);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [executionInterval, setExecutionInterval] = useState<NodeJS.Timeout | null>(null);
  
  const canvasRef = useRef<any>(null);

  // Load workflow
  const loadWorkflow = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      const data = await workflowApi.getById(id);
      setWorkflow(data);
      
      if (data.jsonData) {
        const parsed = JSON.parse(data.jsonData);
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      }
      
      setIsDirty(false);
      showToast('success', 'Workflow loaded successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load workflow');
      navigate('/workflows');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  // Save workflow
  const saveWorkflow = useCallback(async () => {
    if (!workflow) {
      showToast('error', 'No workflow to save');
      return;
    }

    try {
      setIsSaving(true);
      
      // Clean nodes before saving
      const cleanNodes = nodes.map(node => ({
        ...node,
        data: { ...node.data, status: undefined, result: undefined, error: undefined }
      }));
      
      const jsonData = JSON.stringify({ 
        nodes: cleanNodes, 
        edges,
        version: '1.0',
        updatedAt: new Date().toISOString()
      });

      const updateData = {
        name: workflow.name,
        jsonData,
        description: workflow.description || '',
        status: workflow.status || 'draft',
      };

      let savedWorkflow: Workflow;
      
      if (workflow.id) {
        savedWorkflow = await workflowApi.update(workflow.id, updateData);
        showToast('success', 'Workflow updated successfully');
      } else {
        savedWorkflow = await workflowApi.create(updateData);
        showToast('success', 'Workflow created successfully');
        navigate(`/workflows/${savedWorkflow.id}`);
      }
      
      setWorkflow(savedWorkflow);
      setIsDirty(false);
      
      localStorage.setItem('workflowNodes', JSON.stringify(cleanNodes));
      
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [workflow, nodes, edges, navigate, showToast]);

  // ===== EXECUTE WORKFLOW USING BACKEND API =====
  // const executeWorkflow = useCallback(async () => {
  //   // 1. Validation checks
  //   if (!workflow?.id) {
  //     showToast('error', 'Please save the workflow before executing');
  //     return;
  //   }

  //   if (nodes.length === 0) {
  //     showToast('warning', 'No nodes to execute');
  //     return;
  //   }

  //   const startNode = nodes.find(n => n.type === 'start' || n.data?.label === 'Start');
  //   if (!startNode) {
  //     showToast('error', 'No start node found! Please add a Start node to begin your workflow.');
  //     return;
  //   }

  //   try {
  //     setIsExecuting(true);
  //     setEmailLogs([]);
      
  //     // Add initial log
  //     const timestamp = new Date().toLocaleTimeString();
  //     setEmailLogs(prev => [...prev, `[${timestamp}] 🚀 Starting workflow execution...`]);
      
  //     // ===== FIX: Send the current nodes and edges to the backend =====
  //     const cleanNodes = nodes.map(node => ({
  //       ...node,
  //       data: { ...node.data, status: undefined, result: undefined, error: undefined }
  //     }));

  //     const payload = {
  //       nodes: cleanNodes,
  //       edges: edges,
  //       viewport: { x: 0, y: 0, zoom: 1 }
  //     };
      
  //     // Call the execute API with the payload
  //     const result = await workflowApi.execute(workflow.id, payload);
  //     const executionId = result.executionId;
      
  //     setEmailLogs(prev => [...prev, `[${timestamp}] 📋 Execution ID: ${executionId}`]);
  //     showToast('success', `Workflow execution started: ${executionId}`);

  //     // Update node statuses to "running"
  //     setNodes(prev => prev.map(node => ({
  //       ...node,
  //       data: { ...node.data, status: 'running' as const }
  //     })));

  //     // Poll for status updates
  //     let attempts = 0;
  //     const maxAttempts = 60; // 60 * 2s = 2 minutes max
      
  //     const interval = setInterval(async () => {
  //       attempts++;
  //       try {
  //         const status = await workflowApi.getStatus(workflow.id!);
  //         const timestamp = new Date().toLocaleTimeString();
          
  //         setEmailLogs(prev => [...prev, `[${timestamp}] 📊 Status: ${status.status} - ${status.progress}%`]);
          
  //         // Check if execution is complete
  //         if (status.status === 'completed') {
  //           clearInterval(interval);
  //           setExecutionInterval(null);
  //           setIsExecuting(false);
            
  //           setNodes(prev => prev.map(node => ({
  //             ...node,
  //             data: { ...node.data, status: 'success' as const }
  //           })));
            
  //           setEmailLogs(prev => [...prev, `[${timestamp}] ✅ Workflow completed successfully!`]);
  //           showToast('success', 'Workflow completed successfully!');
            
  //         } else if (status.status === 'failed') {
  //           clearInterval(interval);
  //           setExecutionInterval(null);
  //           setIsExecuting(false);
            
  //           setNodes(prev => prev.map(node => ({
  //             ...node,
  //             data: { ...node.data, status: 'error' as const }
  //           })));
            
  //           // Include the backend error message if available
  //           const errorMsg = status.error ? `: ${status.error}` : '';
  //           setEmailLogs(prev => [...prev, `[${timestamp}] ❌ Workflow execution failed${errorMsg}`]);
  //           showToast('error', `Workflow execution failed${errorMsg}`);
            
  //         } else if (attempts >= maxAttempts) {
  //           clearInterval(interval);
  //           setExecutionInterval(null);
  //           setIsExecuting(false);
            
  //           setEmailLogs(prev => [...prev, `[${timestamp}] ⏰ Execution timeout after ${maxAttempts} attempts`]);
  //           showToast('warning', 'Execution timeout - check logs for details');
  //         }
          
  //       } catch (error: any) {
  //         console.error('Error polling status:', error);
  //         if (attempts >= maxAttempts) {
  //           clearInterval(interval);
  //           setExecutionInterval(null);
  //           setIsExecuting(false);
  //           showToast('error', 'Failed to get execution status');
  //         }
  //       }
  //     }, 2000); // Poll every 2 seconds
      
  //     setExecutionInterval(interval);
      
  //   } catch (error: any) {
  //     console.error('Execution error:', error);
  //     const timestamp = new Date().toLocaleTimeString();
  //     const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
  //     setEmailLogs(prev => [...prev, `[${timestamp}] ❌ Failed to start execution: ${errorMsg}`]);
  //     showToast('error', errorMsg || 'Failed to execute workflow');
  //     setIsExecuting(false);
      
  //     // Reset node statuses on failure
  //     setNodes(prev => prev.map(node => ({
  //       ...node,
  //       data: { ...node.data, status: 'idle' as const }
  //     })));
  //   }
  // }, [workflow, nodes, edges, showToast]);


  
const executeWorkflow = useCallback(async () => {
  
  if (!workflow?.id) {
    showToast('error', 'Please save the workflow before executing');
    return;
  }

  if (nodes.length === 0) {
    showToast('warning', 'No nodes to execute');
    return;
  }

  const startNode = nodes.find(n => n.type === 'start' || n.data?.label === 'Start');
  if (!startNode) {
    showToast('error', 'No start node found! Please add a Start node to begin your workflow.');
    return;
  }

  try {
    setIsExecuting(true);
    setEmailLogs([]);
    
    
    const timestamp = new Date().toLocaleTimeString();
    setEmailLogs(prev => [...prev, `[${timestamp}]  Starting workflow execution...`]);
    
    
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
    const executionId = result.executionId;
    
    setEmailLogs(prev => [...prev, `[${timestamp}]  Execution ID: ${executionId}`]);
    showToast('success', `Workflow execution started: ${executionId}`);

    
    if (result && result.url) {
      
      setTimeout(() => {
        window.open(result.url, '_blank');
        setEmailLogs(prev => [...prev, `[${timestamp}]  WhatsApp link opened in new tab`]);
      }, 500);
    }
    

    // Update node statuses to "running"
    setNodes(prev => prev.map(node => ({
      ...node,
      data: { ...node.data, status: 'running' as const }
    })));

    
    let attempts = 0;
    const maxAttempts = 60; 
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await workflowApi.getStatus(workflow.id!);
        const timestamp = new Date().toLocaleTimeString();
        
        setEmailLogs(prev => [...prev, `[${timestamp}]  Status: ${status.status} - ${status.progress}%`]);
        
        // Check if execution is complete
        if (status.status === 'completed') {
          clearInterval(interval);
          setExecutionInterval(null);
          setIsExecuting(false);
          
          setNodes(prev => prev.map(node => ({
            ...node,
            data: { ...node.data, status: 'success' as const }
          })));
          
          setEmailLogs(prev => [...prev, `[${timestamp}]  Workflow completed successfully!`]);
          showToast('success', 'Workflow completed successfully!');
          
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setExecutionInterval(null);
          setIsExecuting(false);
          
          setNodes(prev => prev.map(node => ({
            ...node,
            data: { ...node.data, status: 'error' as const }
          })));
          
          // Include the backend error message if available
          const errorMsg = status.error ? `: ${status.error}` : '';
          setEmailLogs(prev => [...prev, `[${timestamp}]  Workflow execution failed${errorMsg}`]);
          showToast('error', `Workflow execution failed${errorMsg}`);
          
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setExecutionInterval(null);
          setIsExecuting(false);
          
          setEmailLogs(prev => [...prev, `[${timestamp}]  Execution timeout after ${maxAttempts} attempts`]);
          showToast('warning', 'Execution timeout - check logs for details');
        }
        
      } catch (error: any) {
        console.error('Error polling status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setExecutionInterval(null);
          setIsExecuting(false);
          showToast('error', 'Failed to get execution status');
        }
      }
    }, 2000); 
    
    setExecutionInterval(interval);
    
  } catch (error: any) {
    console.error('Execution error:', error);
    const timestamp = new Date().toLocaleTimeString();
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    setEmailLogs(prev => [...prev, `[${timestamp}]  Failed to start execution: ${errorMsg}`]);
    showToast('error', errorMsg || 'Failed to execute workflow');
    setIsExecuting(false);
    
    // Reset node statuses on failure
    setNodes(prev => prev.map(node => ({
      ...node,
      data: { ...node.data, status: 'idle' as const }
    })));
  }
}, [workflow, nodes, edges, showToast]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (executionInterval) {
        clearInterval(executionInterval);
      }
    };
  }, [executionInterval]);

  // Update workflow metadata
  const updateWorkflowMeta = useCallback((updates: Partial<Workflow>) => {
    setWorkflow(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  // Auto-save
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (isDirty && workflow && workflow.id) {
        saveWorkflow();
      }
    }, 30000);

    return () => clearTimeout(saveTimeout);
  }, [isDirty, workflow, saveWorkflow]);

  // Keyboard shortcuts
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

  // Load initial data
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      const savedNodes = localStorage.getItem('workflowNodes');
      if (savedNodes) {
        try {
          const parsed = JSON.parse(savedNodes);
          setNodes(parsed);
        } catch (e) {
          console.error('Error loading saved nodes:', e);
        }
      }
      setWorkflow({
        name: 'Untitled Workflow',
        jsonData: '{"nodes":[],"edges":[]}',
        status: 'draft',
      });
    }
  }, [workflowId, loadWorkflow]);

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
    loadWorkflow,
    saveWorkflow,
    executeWorkflow,
    updateWorkflowMeta,
    setIsDirty,
  };
};