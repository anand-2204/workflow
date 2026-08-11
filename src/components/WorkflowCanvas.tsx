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
import { X } from 'lucide-react';
import 'reactflow/dist/style.css';

// Custom Node Component with Handles and Delete Button
const CustomNodeComponent = ({ data, selected, id }: any) => {
  const onDelete = data.onDelete;

  return (
    <div className={`
      px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[140px] relative
      ${selected 
        ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }
      ${data.bgColor || 'bg-white'}
      cursor-grab active:cursor-grabbing
      group
    `}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) {
            onDelete(id);
          }
        }}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transform transition-all"
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
          <div className={`text-xl ${data.iconColor || 'text-gray-600'}`}>
            {data.icon}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-800 text-sm">
            {data.label || 'Node'}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-0.5">
              {data.description}
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUpdatingRef = useRef(false);
  const isUndoRedoRef = useRef(false);
  const isDeletingRef = useRef(false);

  // Undo/Redo state
  const [history, setHistory] = useState<{ nodes: Node[]; edges: any[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Delete node function - Fixed to prevent render loops
  const handleDeleteNode = useCallback((nodeId: string) => {
    if (isDeletingRef.current) return;
    if (!window.confirm('Are you sure you want to delete this node?')) return;
    
    isDeletingRef.current = true;
    
    setNodes((nds) => {
      const updatedNodes = nds.filter((node) => node.id !== nodeId);
      // Clear selection if the deleted node was selected
      if (selectedNode?.id === nodeId && setSelectedNode) {
        setSelectedNode(null);
      }
      return updatedNodes;
    });
    
    // Reset the deleting flag after a short delay
    setTimeout(() => {
      isDeletingRef.current = false;
    }, 100);
  }, [selectedNode, setSelectedNode]);

  // Load saved nodes from localStorage on mount
  useEffect(() => {
    const savedNodes = localStorage.getItem('workflowNodes');
    if (savedNodes) {
      try {
        const parsedNodes = JSON.parse(savedNodes);
        if (parsedNodes.length > 0) {
          const nodesWithDelete = parsedNodes.map((node: Node) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: handleDeleteNode,
            }
          }));
          setNodes(nodesWithDelete);
          if (setExternalNodes) {
            setExternalNodes(nodesWithDelete);
          }
          setHistory([{ nodes: nodesWithDelete, edges: [] }]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading saved nodes:', error);
      }
    }
    setIsInitialized(true);
  }, []); // Remove handleDeleteNode dependency to prevent re-run

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

  // Notify parent when undo/redo state changes
  useEffect(() => {
    updateUndoRedoState();
  }, [historyIndex, history.length, updateUndoRedoState]);

  // Save state to history
  const saveStateToHistory = useCallback(() => {
    if (isUndoRedoRef.current || !isInitialized || isDeletingRef.current) return;
    
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
  }, [nodes, edges, historyIndex, isInitialized]);

  // Save state on changes - Only when not deleting
  useEffect(() => {
    if (!isUndoRedoRef.current && !isDeletingRef.current && isInitialized) {
      saveStateToHistory();
    }
  }, [nodes, edges, isInitialized, saveStateToHistory]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
      
      if (setExternalNodes) {
        setExternalNodes(prevState.nodes);
      }
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges, setExternalNodes]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
      
      if (setExternalNodes) {
        setExternalNodes(nextState.nodes);
      }
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
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
    })
  }), [undo, redo, historyIndex, history.length]);

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && !isUpdatingRef.current && !isDeletingRef.current) {
      const nodesToSave = nodes.map((node) => {
        const { onDelete, ...restData } = node.data;
        return {
          ...node,
          data: restData,
        };
      });
      
      if (nodesToSave.length > 0) {
        localStorage.setItem('workflowNodes', JSON.stringify(nodesToSave));
      } else {
        localStorage.removeItem('workflowNodes');
      }
      if (setExternalNodes) {
        setExternalNodes(nodes);
      }
    }
  }, [nodes, setExternalNodes, isInitialized]);

  // Handle external nodes updates
  useEffect(() => {
    if (isInitialized && externalNodes.length > 0 && !isDeletingRef.current) {
      const currentNodesString = JSON.stringify(nodes);
      const externalNodesString = JSON.stringify(externalNodes);
      if (currentNodesString !== externalNodesString) {
        isUpdatingRef.current = true;
        const nodesWithDelete = externalNodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onDelete: handleDeleteNode,
          }
        }));
        setNodes(nodesWithDelete);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }
  }, [externalNodes, setNodes, isInitialized, nodes, handleDeleteNode]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
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
    },
    [nodes, setNodes]
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
          onDelete: handleDeleteNode,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, handleDeleteNode]
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