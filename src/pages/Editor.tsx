import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node } from 'reactflow';
import Sidebar from '../components/Sidebar';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { 
  GitBranch, Trash2, Save, X, Settings, PlayCircle,
  Download, Upload, Undo2, Redo2, ZoomIn, ZoomOut
} from 'lucide-react';
import { initEmailJS, sendEmail } from '../services/mailService';

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
    console.log('💾 Saving node data:', localData);
    onUpdate(localData);
    
    if (node.type === 'email' || node.data?.type === 'email') {
      const config = localData.config || {};
      if (config.to && config.subject && config.message) {
        alert('✅ Email configuration saved successfully!\n\n' +
          `📧 To: ${config.to}\n` +
          `📝 Subject: ${config.subject}\n` +
          `📄 Message: ${config.message.substring(0, 50)}...`
        );
      } else {
        alert('⚠️ Please fill in all required fields:\n- To (recipient email)\n- Subject\n- Message');
      }
    }
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
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">📧 Email Configuration</h4>
              {localData.config?.to && localData.config?.subject && localData.config?.message && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Ready</span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter recipient email (e.g., john@example.com)"
                  value={localData.config?.to || ''}
                  onChange={(e) => setLocalData({ 
                    ...localData, 
                    config: { 
                      ...localData.config, 
                      to: e.target.value 
                    } 
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    localData.config?.to ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder="recipient@example.com"
                />
                {localData.config?.to && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {localData.config?.to ? `📧 Sending to: ${localData.config.to}` : '⚠️ Required: Enter recipient email'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter email subject"
                value={localData.config?.subject || ''}
                onChange={(e) => setLocalData({ 
                  ...localData, 
                  config: { 
                    ...localData.config, 
                    subject: e.target.value 
                  } 
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  localData.config?.subject ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-400 mt-1">
                {localData.config?.subject || '⚠️ Required: Enter email subject'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea 
                placeholder="Enter your email message..."
                value={localData.config?.message || ''}
                onChange={(e) => setLocalData({ 
                  ...localData, 
                  config: { 
                    ...localData.config, 
                    message: e.target.value 
                  } 
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  localData.config?.message ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                rows={5}
              />
              <p className="text-xs text-gray-400 mt-1">
                {localData.config?.message 
                  ? `📄 ${localData.config.message.length} characters` 
                  : '⚠️ Required: Enter your email message'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input 
                type="text" 
                placeholder="Your Name"
                value={localData.config?.fromName || ''}
                onChange={(e) => setLocalData({ 
                  ...localData, 
                  config: { 
                    ...localData.config, 
                    fromName: e.target.value 
                  } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to use "Workflow Editor"</p>
            </div>

            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600">📋 Configuration Preview:</p>
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">To:</span> {localData.config?.to || '❌ Not set'}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Subject:</span> {localData.config?.subject || '❌ Not set'}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Message:</span> {localData.config?.message ? `${localData.config.message.substring(0, 30)}...` : '❌ Not set'}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">From:</span> {localData.config?.fromName || 'Workflow Editor (default)'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              <Save size={16} />
              Save Email Configuration
            </button>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700">WhatsApp Configuration</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
              <input 
                type="text" 
                placeholder="+1234567890"
                value={localData.config?.phoneNumber || ''}
                onChange={(e) => setLocalData({ 
                  ...localData, 
                  config: { ...localData.config, phoneNumber: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message</label>
              <textarea 
                placeholder="WhatsApp message..."
                value={localData.config?.message || ''}
                onChange={(e) => setLocalData({ 
                  ...localData, 
                  config: { ...localData.config, message: e.target.value } 
                })}
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
  const [emailStatus, setEmailStatus] = useState<{status: 'idle' | 'sending' | 'success' | 'error', message?: string}>({status: 'idle'});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

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

  useEffect(() => {
    try {
      initEmailJS();
      console.log('✅ EmailJS initialized successfully');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
    }
  }, []);

  const handleUndoRedoChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  const updateNodeProperties = useCallback((newData: any) => {
    if (!selectedNode) return;
    
    console.log('🔄 Updating node properties:', newData);
    
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
  }, [selectedNode]);

  const closeProperties = useCallback(() => {
    setShowProperties(false);
    setSelectedNode(null);
  }, []);

  // Execute node function - FIXED with better error handling
  const executeNode = async (node: Node) => {
    const nodeType = node.type || node.data?.type;
    
    // Skip Start and End nodes
    if (nodeType === 'start' || nodeType === 'end' || node.data?.label === 'Start' || node.data?.label === 'End') {
      console.log(`⏭️ Skipping ${node.data?.label || nodeType} node`);
      return { success: true, skipped: true };
    }

    setNodes(prev => prev.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, status: 'running' as const } }
        : n
    ));

    try {
      let result;
      
      switch (nodeType) {
        case 'email': {
          const config = node.data?.config || {};
          const { to, subject, message, fromName } = config;
          
          console.log('📧 Email Node Config:', config);
          
          // Validate required fields
          const missingFields = [];
          if (!to) missingFields.push('To');
          if (!subject) missingFields.push('Subject');
          if (!message) missingFields.push('Message');
          
          if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}. Please configure the email node.`;
            setNodes(prev => prev.map(n => 
              n.id === node.id 
                ? { ...n, data: { ...n.data, status: 'error' as const, error: errorMsg } }
                : n
            ));
            throw new Error(errorMsg);
          }
          
          // Send email without confirmation dialog to avoid async issues
          console.log('📤 Sending email with:', { to, subject, message: message.substring(0, 50) + '...' });
          
          result = await sendEmail(to, subject, message, fromName || 'Workflow Editor');
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
          }
          
          console.log('✅ Email sent successfully:', result);
          break;
        }
        
        case 'whatsapp': {
          const { phoneNumber, message } = node.data.config || {};
          if (!phoneNumber || !message) {
            throw new Error('WhatsApp configuration incomplete');
          }
          const cleanNumber = phoneNumber.replace(/\D/g, '');
          const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
          result = { success: true };
          break;
        }
        
        case 'http': {
          const { url, method = 'GET' } = node.data.config || {};
          if (!url) throw new Error('HTTP URL is required');
          const response = await fetch(url, { method });
          result = await response.json();
          break;
        }
        
        case 'database': {
          const { query } = node.data.config || {};
          console.log('Database query:', query);
          result = { success: true, message: 'Query executed' };
          break;
        }
        
        default: {
          // For any other node type, simulate execution
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
          const success = Math.random() < 0.9;
          if (!success) throw new Error(`Node "${node.data.label}" failed`);
          result = { success: true };
        }
      }

      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'success' as const, result } }
          : n
      ));
      
      return result;
    } catch (error: any) {
      console.error('❌ Node execution error:', error);
      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'error' as const, error: error.message } }
          : n
      ));
      throw error;
    }
  };

  // Workflow execution engine
  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute! Add some nodes first.');
      return;
    }

    const startNode = nodes.find(n => n.type === 'start' || n.data?.label === 'Start');
    if (!startNode) {
      alert('No start node found! Add a Start node to begin.');
      return;
    }

    setIsExecuting(true);

    // Reset all node statuses
    const resetNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'idle' as const,
      }
    }));
    setNodes(resetNodes);

    try {
      // Get executable nodes (skip Start and End)
      const executableNodes = nodes.filter(node => {
        const nodeType = node.type || node.data?.type;
        return nodeType !== 'start' && nodeType !== 'end' && node.data?.label !== 'Start' && node.data?.label !== 'End';
      });

      console.log('🚀 Executing nodes:', executableNodes.map(n => n.data?.label || n.type));

      // Execute nodes sequentially
      for (const node of executableNodes) {
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
      
      alert('✅ Workflow executed successfully!');
    } catch (error: any) {
      alert(`❌ Workflow failed: ${error.message || 'Unknown error'}`);
      console.error('Workflow execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [nodes]);

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

  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
      const state = canvasRef.current.getState();
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.redo();
      const state = canvasRef.current.getState();
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    }
  }, []);

  const handleTestEmail = async () => {
    const emailNode = nodes.find(n => n.type === 'email' || n.data?.type === 'email');
    
    if (!emailNode) {
      setEmailStatus({ 
        status: 'error', 
        message: '❌ No email node found! Add an email node to the canvas first.' 
      });
      return;
    }
    
    const config = emailNode.data?.config || {};
    const { to, subject, fromName } = config;
    
    console.log('📧 Email node found:', emailNode);
    console.log('📧 Email config:', config);
    
    if (!to) {
      setEmailStatus({ 
        status: 'error', 
        message: '❌ Email node not configured! Click the email node and set the "To" field.' 
      });
      return;
    }
    
    setEmailStatus({ status: 'sending', message: `📧 Sending test email to ${to}...` });
    
    try {
      const result = await sendEmail(
        to,
        subject || 'Test Email from Workflow Editor',
        'This is a test email to verify the email service is working correctly. 🚀\n\n' +
        '📋 Your email node configuration:\n' +
        `• To: ${to}\n` +
        `• Subject: ${subject || 'Test Email'}\n` +
        `• From: ${fromName || 'Workflow Editor'}`,
        fromName || 'Workflow Editor'
      );
      
      if (result.success) {
        setEmailStatus({ 
          status: 'success', 
          message: `✅ Test email sent successfully to ${to}! Check your inbox.` 
        });
        setTimeout(() => setEmailStatus({ status: 'idle' }), 5000);
      } else {
        setEmailStatus({ 
          status: 'error', 
          message: `❌ Failed: ${result.error}` 
        });
      }
    } catch (error: any) {
      setEmailStatus({ 
        status: 'error', 
        message: `❌ Error: ${error.message}` 
      });
    }
  };

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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

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
            <button
              onClick={handleTestEmail}
              disabled={emailStatus.status === 'sending'}
              className={`px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                emailStatus.status === 'sending' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              title="Send test email to configured email node"
            >
              {emailStatus.status === 'sending' ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                '📧 Test Email'
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

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

            <button 
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px]"
            >
              {zoom}%
            </button>
            <button 
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

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
          </div>
        </header>

        {emailStatus.status !== 'idle' && (
          <div className={`px-6 py-2 text-sm ${
            emailStatus.status === 'sending' ? 'bg-yellow-50 text-yellow-700 animate-pulse' : ''
          } ${
            emailStatus.status === 'success' ? 'bg-green-50 text-green-700' : ''
          } ${
            emailStatus.status === 'error' ? 'bg-red-50 text-red-700' : ''
          }`}>
            {emailStatus.message}
          </div>
        )}

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