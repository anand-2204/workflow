import { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Connection, Node } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import 'reactflow/dist/style.css';

// Custom Node Component with Handles, Delete Button, and Status
const CustomNodeComponent = ({ data, selected, id }: any) => {
  const onDelete = data.onDelete;
  const status = data.status || 'idle';

  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return 'border-yellow-500 shadow-lg shadow-yellow-500/20';
      case 'success':
        return 'border-green-500 shadow-lg shadow-green-500/20';
      case 'error':
        return 'border-red-500 shadow-lg shadow-red-500/20';
      default:
        return selected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return <Loader2 size={14} className="text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return <span className="text-[10px] text-yellow-600 animate-pulse">Running...</span>;
      case 'success':
        return <span className="text-[10px] text-green-600">✓ Done</span>;
      case 'error':
        return <span className="text-[10px] text-red-600">✗ Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`
      px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[140px] relative
      ${getStatusStyles()}
      ${status === 'running' ? 'animate-pulse' : ''}
      ${data.bgColor || 'bg-white'}
      cursor-grab active:cursor-grabbing
      group
    `}>
      {status !== 'idle' && (
        <div className={`
          absolute -top-1 -right-1 w-3 h-3 rounded-full
          ${status === 'running' ? 'bg-yellow-500 animate-ping' : ''}
          ${status === 'success' ? 'bg-green-500' : ''}
          ${status === 'error' ? 'bg-red-500 animate-pulse' : ''}
        `} />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) {
            onDelete(id);
          }
        }}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transform transition-all z-10"
        title="Delete node"
      >
        <X size={14} />
      </button>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ 
          left: -6,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      
      <div className="flex items-center gap-3">
        {data.icon && (
          <div className={`text-xl ${data.iconColor || 'text-gray-600'} ${status === 'running' ? 'animate-bounce' : ''}`}>
            {data.icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-800 text-sm">
              {data.label || 'Node'}
            </div>
            {getStatusIndicator()}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              {data.description}
              {getStatusText()}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ 
          right: -6,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
};

const nodeTypes = { 
  customNode: CustomNodeComponent,
};

interface WorkflowCanvasProps {
  nodes?: Node[];
  setNodes?: (nodes: Node[]) => void;
  selectedNode?: Node | null;
  setSelectedNode?: (node: Node | null) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
}

const WorkflowCanvas = forwardRef<any, WorkflowCanvasProps>(({ 
  nodes: externalNodes = [], 
  setNodes: setExternalNodes,
  selectedNode,
  setSelectedNode,
  onUndoRedoChange
}, ref) => {
  // Use externalNodes directly instead of internal state
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Undo/Redo state
  const [history, setHistory] = useState<{ nodes: Node[]; edges: any[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Add delete function to nodes
  const addDeleteFunction = useCallback((nodesList: Node[]) => {
    return nodesList.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: (nodeId: string) => {
          if (window.confirm('Are you sure you want to delete this node?')) {
            const updatedNodes = nodesList.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            if (selectedNode?.id === nodeId && setSelectedNode) {
              setSelectedNode(null);
            }
            // Update external
            if (setExternalNodes) {
              setExternalNodes(updatedNodes);
            }
          }
        },
      }
    }));
  }, [setNodes, setExternalNodes, selectedNode, setSelectedNode]);

  // Initialize nodes with delete function
  useEffect(() => {
    if (externalNodes.length > 0) {
      const nodesWithDelete = addDeleteFunction(externalNodes);
      setNodes(nodesWithDelete);
    }
  }, []);

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    if (nodes.length > 0) {
      const nodesToSave = nodes.map((node) => {
        const { onDelete, status, ...restData } = node.data;
        return {
          ...node,
          data: restData,
        };
      });
      localStorage.setItem('workflowNodes', JSON.stringify(nodesToSave));
    } else {
      localStorage.removeItem('workflowNodes');
    }
  }, [nodes]);

  // Update undo/redo state and notify parent
  const updateUndoRedoState = useCallback(() => {
    const undo = historyIndex > 0;
    const redo = historyIndex < history.length - 1;
    setCanUndo(undo);
    setCanRedo(redo);
    if (onUndoRedoChange) {
      onUndoRedoChange(undo, redo);
    }
  }, [historyIndex, history.length, onUndoRedoChange]);

  useEffect(() => {
    updateUndoRedoState();
  }, [historyIndex, history.length, updateUndoRedoState]);

  // Save state to history
  const saveStateToHistory = useCallback(() => {
    if (isInternalUpdate.current) return;
    
    const newState = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  useEffect(() => {
    saveStateToHistory();
  }, [nodes, edges, saveStateToHistory]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isInternalUpdate.current = true;
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
      
      if (setExternalNodes) {
        setExternalNodes(prevState.nodes);
      }
      
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 100);
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges, setExternalNodes]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isInternalUpdate.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
      
      if (setExternalNodes) {
        setExternalNodes(nextState.nodes);
      }
      
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 100);
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges, setExternalNodes]);

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    undo,
    redo,
    getState: () => ({
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }),
    clearCanvas: () => {
      setNodes([]);
      setEdges([]);
      setHistory([]);
      setHistoryIndex(-1);
      setCanUndo(false);
      setCanRedo(false);
      localStorage.removeItem('workflowNodes');
      if (setExternalNodes) {
        setExternalNodes([]);
      }
      if (setSelectedNode) {
        setSelectedNode(null);
      }
    }
  }), [undo, redo, historyIndex, history.length, setNodes, setEdges, setExternalNodes, setSelectedNode]);

  // Connection validation
  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) return false;
      
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return false;
      
      if (sourceNode.type === 'end' || sourceNode.data?.label === 'End') return false;
      if (targetNode.type === 'start' || targetNode.data?.label === 'Start') return false;
      
      const hasOutgoingConnection = edges.some(
        e => e.source === connection.source && e.sourceHandle === connection.sourceHandle
      );
      if (hasOutgoingConnection) return false;
      
      const hasIncomingConnection = edges.some(
        e => e.target === connection.target && e.targetHandle === connection.targetHandle
      );
      if (hasIncomingConnection) return false;
      
      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      } else {
        console.warn('Invalid connection attempt:', params);
      }
    },
    [setEdges, isValidConnection]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (setSelectedNode) {
      setSelectedNode(node);
    }
  }, [setSelectedNode]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setNodes(updatedNodes);
      if (setExternalNodes) {
        setExternalNodes(updatedNodes);
      }
    },
    [nodes, setNodes, setExternalNodes]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) {
        return;
      }

      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const label = type.charAt(0).toUpperCase() + type.slice(1);
      
      const getIcon = (type: string) => {
        const icons: Record<string, string> = {
          start: '▶️',
          http: '🌐',
          email: '✉️',
          end: '⏹️',
          webhook: '⚡',
          database: '🗄️',
          function: '💻',
          schedule: '⏰',
          whatsapp: '💬',
        };
        return icons[type] || '📦';
      };

      const getColor = (type: string) => {
        const colors: Record<string, string> = {
          start: 'bg-emerald-50 border-emerald-300',
          http: 'bg-blue-50 border-blue-300',
          email: 'bg-amber-50 border-amber-300',
          end: 'bg-rose-50 border-rose-300',
          webhook: 'bg-purple-50 border-purple-300',
          database: 'bg-cyan-50 border-cyan-300',
          function: 'bg-violet-50 border-violet-300',
          schedule: 'bg-indigo-50 border-indigo-300',
          whatsapp: 'bg-green-50 border-green-300',
        };
        return colors[type] || 'bg-gray-50 border-gray-300';
      };

      const getIconColor = (type: string) => {
        const colors: Record<string, string> = {
          start: 'text-emerald-600',
          http: 'text-blue-600',
          email: 'text-amber-600',
          end: 'text-rose-600',
          webhook: 'text-purple-600',
          database: 'text-cyan-600',
          function: 'text-violet-600',
          schedule: 'text-indigo-600',
          whatsapp: 'text-green-600',
        };
        return colors[type] || 'text-gray-600';
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'customNode',
        position,
        data: { 
          label: label,
          description: `New ${type} node`,
          icon: getIcon(type),
          bgColor: getColor(type),
          iconColor: getIconColor(type),
          status: 'idle',
        },
      };

      // Add delete function to new node
      const nodeWithDelete = {
        ...newNode,
        data: {
          ...newNode.data,
          onDelete: (nodeId: string) => {
            if (window.confirm('Are you sure you want to delete this node?')) {
              const updatedNodes = nodes.filter((n) => n.id !== nodeId);
              setNodes(updatedNodes);
              if (selectedNode?.id === nodeId && setSelectedNode) {
                setSelectedNode(null);
              }
              if (setExternalNodes) {
                setExternalNodes(updatedNodes);
              }
            }
          },
        }
      };

      const updatedNodes = [...nodes, nodeWithDelete];
      setNodes(updatedNodes);
      if (setExternalNodes) {
        setExternalNodes(updatedNodes);
      }
    },
    [nodes, setNodes, setExternalNodes, selectedNode, setSelectedNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div 
      ref={reactFlowWrapper}
      className="w-full h-full relative"
      style={{ background: 'transparent' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        minZoom={0.5}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        nodesConnectable={true}
        onDrop={onDrop}
        onDragOver={onDragOver}
        isValidConnection={isValidConnection}
        onSelectionChange={(params) => {
          if (params.nodes.length > 0 && setSelectedNode) {
            setSelectedNode(params.nodes[0]);
          } else if (setSelectedNode) {
            setSelectedNode(null);
          }
        }}
      >
        <Background 
          color="#d1d5db" 
          gap={24} 
          size={1}
          className="bg-gray-50"
        />
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0,0,0,0.05)"
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;