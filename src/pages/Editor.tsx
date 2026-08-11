import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node } from 'reactflow';
import Sidebar from '../components/Sidebar';
import WorkflowCanvas from '../components/WorkflowCanvas';
import PropertiesPanel from '../components/PropertiesPanel';
import { 
  GitBranch, Trash2, PlayCircle,
  Download, Upload, Undo2, Redo2, ZoomIn, ZoomOut
} from 'lucide-react';
import { initEmailJS, sendEmail } from '../services/mailService';

export default function Editor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear all nodes?')) {
      canvasRef.current?.clearCanvas?.();
      setNodes([]);
      setSelectedNode(null);
      setShowProperties(false);
      localStorage.removeItem('workflowNodes');
      setCanUndo(false);
      setCanRedo(false);
      setEmailLogs([]);
    }
  }, [nodes]);

  // Initialize EmailJS
  useEffect(() => {
    try {
      initEmailJS();
      console.log('✅ EmailJS initialized successfully');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
    }
  }, []);

  // Undo/Redo handlers
  const handleUndoRedoChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo?.();
    const state = canvasRef.current?.getState?.();
    if (state) {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo?.();
    const state = canvasRef.current?.getState?.();
    if (state) {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  // Node properties
  const updateNodeProperties = useCallback((newData: any) => {
    if (!selectedNode) return;
    
    setNodes(prev => prev.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
    
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
  }, [selectedNode]);

  const closeProperties = useCallback(() => {
    setShowProperties(false);
    setSelectedNode(null);
  }, []);

  // Load saved nodes from localStorage
  useEffect(() => {
    const savedNodes = localStorage.getItem('workflowNodes');
    if (savedNodes) {
      try {
        const parsed = JSON.parse(savedNodes);
        setNodes(parsed);
        console.log('📂 Loaded saved nodes:', parsed.length);
      } catch (e) {
        console.error('Error loading saved nodes:', e);
      }
    }
  }, []);

  // Log email details
  const logEmail = (type: string, details: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type}: ${JSON.stringify(details, null, 2)}`;
    setEmailLogs(prev => [...prev, logEntry]);
    console.log(`📧 ${type}:`, details);
  };

  // Execute a single node - FIXED: Properly detect node type
  const executeNode = async (node: Node) => {
    // CRITICAL FIX: Get the actual node type from data.type or data.label
    const nodeType = node.data?.type || 
                     node.data?.label?.toLowerCase() || 
                     node.type || 
                     '';
    
    // Log the detected type for debugging
    console.log('🔍 Executing node with type:', nodeType, 'Full node:', node);
    
    // Skip Start and End nodes
    if (nodeType === 'start' || nodeType === 'end' || 
        node.data?.label === 'Start' || node.data?.label === 'End') {
      return { success: true, skipped: true };
    }

    setNodes(prev => prev.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, status: 'running' as const } }
        : n
    ));

    try {
      let result;
      const config = node.data?.config || {};

      // Log node execution start
      logEmail(`🔄 EXECUTING ${nodeType.toUpperCase()} NODE`, {
        nodeId: node.id,
        nodeLabel: node.data?.label,
        nodeType: nodeType,
        config: config
      });

      switch (nodeType) {
        case 'email': {
          const { to, subject, message, fromName } = config;
          
          // Log email details before sending
          logEmail('📧 EMAIL PREPARED', {
            to,
            subject,
            message: message || 'No message provided',
            fromName: fromName || 'Workflow Editor',
            nodeId: node.id,
            nodeLabel: node.data?.label || 'Email Node'
          });
          
          if (!to || !subject || !message) {
            const error = `Missing required fields: ${!to ? 'To' : ''} ${!subject ? 'Subject' : ''} ${!message ? 'Message' : ''}`;
            logEmail('❌ EMAIL ERROR', { error, config });
            throw new Error(error);
          }
          
          logEmail('📤 SENDING EMAIL', { 
            to, 
            subject, 
            messageLength: message.length,
            messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            fromName: fromName || 'Workflow Editor'
          });
          
          result = await sendEmail(to, subject, message, fromName || 'Workflow Editor');
          
          if (!result.success) {
            logEmail('❌ EMAIL FAILED', { error: result.error });
            throw new Error(result.error || 'Failed to send email');
          }
          
          logEmail('✅ EMAIL SENT SUCCESSFULLY', {
            to,
            subject,
            messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            fullMessage: message,
            fromName: fromName || 'Workflow Editor',
            response: result
          });
          
          break;
        }
        
        case 'whatsapp':
        case 'message': {
          const { phoneNumber, message } = config;
          if (!phoneNumber || !message) throw new Error('WhatsApp configuration incomplete');
          const cleanNumber = phoneNumber.replace(/\D/g, '');
          const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
          logEmail('💬 WHATSAPP MESSAGE', { phoneNumber: cleanNumber, message, url });
          window.open(url, '_blank');
          result = { success: true };
          break;
        }
        
        case 'http': {
          const { url, method = 'GET' } = config;
          if (!url) throw new Error('HTTP URL is required');
          logEmail('🌐 HTTP REQUEST', { url, method });
          const response = await fetch(url, { method });
          result = await response.json();
          logEmail('✅ HTTP RESPONSE', { status: response.status, data: result });
          break;
        }
        
        case 'webhook': {
          const { url, method = 'POST', headers } = config;
          if (!url) throw new Error('Webhook URL is required');
          logEmail('⚡ WEBHOOK REQUEST', { url, method, headers });
          const response = await fetch(url, { 
            method, 
            headers: headers ? JSON.parse(headers) : undefined 
          });
          result = await response.json();
          logEmail('✅ WEBHOOK RESPONSE', { status: response.status, data: result });
          break;
        }
        
        case 'database': {
          const { query } = config;
          logEmail('🗄️ DATABASE QUERY', { query });
          result = { success: true, message: 'Query executed' };
          break;
        }
        
        case 'function': {
          const { code } = config;
          logEmail('⚙️ FUNCTION EXECUTION', { code });
          // In a real implementation, you'd execute the code here
          result = { success: true, message: 'Function executed', code };
          break;
        }
        
        default: {
          logEmail('⚠️ UNKNOWN NODE TYPE', { 
            nodeType, 
            nodeLabel: node.data?.label,
            availableData: node.data
          });
          // Still simulate execution
          await new Promise(resolve => setTimeout(resolve, 500));
          result = { success: true, message: `Executed ${nodeType || 'unknown'} node` };
        }
      }

      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'success' as const, result } }
          : n
      ));
      
      logEmail(`✅ ${nodeType.toUpperCase()} NODE COMPLETED`, { result });
      return result;
    } catch (error: any) {
      logEmail(`❌ ${nodeType.toUpperCase()} NODE FAILED`, { 
        error: error.message,
        config: node.data?.config
      });
      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'error' as const, error: error.message } }
          : n
      ));
      throw error;
    }
  };

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute!');
      return;
    }

    const startNode = nodes.find(n => n.type === 'start' || n.data?.label === 'Start');
    if (!startNode) {
      alert('No start node found!');
      return;
    }

    setEmailLogs([]);
    logEmail('🚀 WORKFLOW EXECUTION STARTED', { 
      totalNodes: nodes.length,
      timestamp: new Date().toISOString()
    });

    setIsExecuting(true);

    // Reset all node statuses
    setNodes(prev => prev.map(node => ({
      ...node,
      data: { ...node.data, status: 'idle' as const }
    })));

    try {
      // Get executable nodes (skip Start and End)
      const executableNodes = nodes.filter(node => {
        const nodeType = node.data?.type || node.type || '';
        return nodeType !== 'start' && nodeType !== 'end' && 
               node.data?.label !== 'Start' && node.data?.label !== 'End';
      });

      logEmail('📋 EXECUTABLE NODES', { 
        count: executableNodes.length,
        nodes: executableNodes.map(n => ({ 
          id: n.id, 
          type: n.data?.type || n.type, 
          label: n.data?.label,
          config: n.data?.config
        }))
      });

      // Execute nodes sequentially
      for (let i = 0; i < executableNodes.length; i++) {
        const node = executableNodes[i];
        logEmail(`🔄 EXECUTING NODE ${i + 1}/${executableNodes.length}`, {
          id: node.id,
          type: node.data?.type || node.type,
          label: node.data?.label
        });
        await executeNode(node);
      }
      
      // Mark End node as success if it exists
      const endNode = nodes.find(n => n.type === 'end' || n.data?.label === 'End');
      if (endNode) {
        setNodes(prev => prev.map(n => 
          n.id === endNode.id 
            ? { ...n, data: { ...n.data, status: 'success' as const } }
            : n
        ));
      }
      
      logEmail('✅ WORKFLOW EXECUTION COMPLETED', { 
        timestamp: new Date().toISOString(),
        executedNodes: executableNodes.length
      });
      
      alert('✅ Workflow executed successfully! Check console for detailed logs.');
    } catch (error: any) {
      logEmail('❌ WORKFLOW EXECUTION FAILED', { 
        error: error.message,
        timestamp: new Date().toISOString()
      });
      alert(`❌ Workflow failed: ${error.message || 'Unknown error'}\n\nCheck console for detailed logs.`);
      console.error('Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes]);

  // Export/Import
  const exportWorkflow = useCallback(() => {
    const workflow = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(node => ({ ...node, data: { ...node.data, status: undefined } })),
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes]);

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
            setShowProperties(false);
            setSelectedNode(null);
            setEmailLogs([]);
          }
        } else {
          alert('Invalid workflow file format');
        }
      } catch (error) {
        alert('Error reading workflow file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if (e.key === 'Escape' && showProperties) closeProperties();
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
            <button onClick={handleUndo} disabled={!canUndo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50">
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={!canRedo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50">
              <Redo2 size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleZoomReset} className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg min-w-[40px]">
              {zoom}%
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button onClick={exportWorkflow} disabled={nodes.length === 0} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50">
              <Download size={16} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importWorkflow} className="hidden" />

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button 
              onClick={executeWorkflow}
              disabled={nodes.length === 0 || isExecuting}
              className={`px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 ${
                isExecuting ? 'animate-pulse' : ''
              }`}
            >
              <PlayCircle size={14} className={isExecuting ? 'animate-spin' : ''} />
              {isExecuting ? 'Running...' : 'Run'}
            </button>
          </div>
        </header>

        {/* Canvas + Properties */}
        <div className="flex-1 flex overflow-hidden">
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