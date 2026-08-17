
import { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeComponent } from '../common/NodeComponent';
import { NodeFactory, updateNodeStatus, updateNodeConfig } from '../../utils/nodeFactory';
import { NODE_DEFINITIONS } from '../../components/constants/nodeDefinitions';
import { useConfirm } from '../../hooks/useConfirm';
import { ConnectionLineType } from 'reactflow';

// Define nodeTypes outside component to prevent re-creation
const nodeTypes = { 
  customNode: NodeComponent,
};

interface WorkflowCanvasProps {
  nodes?: Node[];
  edges?: Edge[];
  setNodes?: (nodes: Node[]) => void;
  setEdges?: (edges: Edge[]) => void;
  selectedNode?: Node | null;
  setSelectedNode?: (node: Node | null) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
  onNodeStatusChange?: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  onNodeConfigChange?: (nodeId: string, config: Record<string, any>) => void;
  onConnect?: (connection: Connection) => void; // Add this prop
}

export const WorkflowCanvas = forwardRef<any, WorkflowCanvasProps>(({ 
  nodes: externalNodes = [], 
  edges: externalEdges = [],
  setNodes: setExternalNodes,
  setEdges: setExternalEdges,
  selectedNode,
  setSelectedNode,
  onUndoRedoChange,
  onNodeStatusChange,
  onNodeConfigChange,
  onConnect: externalOnConnect // Add this
}, ref) => {
  // Initialize with external data
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<any>(null);
  const isInternalUpdate = useRef(false);
  const isUndoRedo = useRef(false);
  const isLoadingWorkflow = useRef(false);

  // Use confirmation hook
  const { confirm, ConfirmComponent } = useConfirm();

  // ============ SYNC EXTERNAL DATA ============
  // Update nodes when external nodes change
  useEffect(() => {
    if (!isInternalUpdate.current && !isUndoRedo.current) {
      console.log('🔄 Syncing external nodes:', externalNodes.length);
      setNodes(externalNodes);
    }
  }, [externalNodes, setNodes]);

  // Update edges when external edges change
  useEffect(() => {
    if (!isInternalUpdate.current && !isUndoRedo.current) {
      console.log('🔄 Syncing external edges:', externalEdges.length);
      if (externalEdges.length > 0) {
        console.log('🔗 External edges:', externalEdges);
      }
      setEdges(externalEdges);
    }
  }, [externalEdges, setEdges]);

  // ============ HELPER FUNCTIONS ============
  const getNodeLabel = useCallback((node: Node | undefined): string => {
    if (!node) return 'Unknown';
    return node.data?.label || node.type || node.id || 'Unknown';
  }, []);

  const getNodeType = useCallback((node: Node | undefined): string => {
    if (!node) return '';
    return node.data?.type || node.type || '';
  }, []);

  const checkForCycle = useCallback((sourceId: string, targetId: string, edgesList: Edge[]): boolean => {
    const visited = new Set<string>();
    const queue = [targetId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (currentId === sourceId) {
        return true;
      }
      
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);
      
      const outgoingEdges = edgesList.filter(e => e.source === currentId);
      for (const edge of outgoingEdges) {
        if (edge.target && !visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }
    
    return false;
  }, []);

  // ============ UNDO/REDO STATE ============
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [_canUndo, setCanUndo] = useState(false);
  const [_canRedo, setCanRedo] = useState(false);

  // ============ NODE HANDLERS ============
  const addNodeHandlers = useCallback((nodesList: Node[]) => {
    return nodesList.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: async (nodeId: string) => {
          const nodeLabel = getNodeLabel(nodesList.find(n => n.id === nodeId));
          const confirmed = await confirm({
            title: 'Delete Node',
            message: `Are you sure you want to delete "${nodeLabel}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
          });

          if (confirmed) {
            const updatedNodes = nodesList.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
            if (selectedNode?.id === nodeId && setSelectedNode) {
              setSelectedNode(null);
            }
            if (setExternalNodes) {
              setExternalNodes(updatedNodes);
            }
          }
        },
        onConfigChange: (nodeId: string, config: Record<string, any>) => {
          const updatedNodes = nodesList.map((n) => {
            if (n.id === nodeId) {
              return updateNodeConfig(n as any, config);
            }
            return n;
          });
          setNodes(updatedNodes);
          if (setExternalNodes) {
            setExternalNodes(updatedNodes);
          }
          if (onNodeConfigChange) {
            onNodeConfigChange(nodeId, config);
          }
        },
      }
    }));
  }, [setNodes, setExternalNodes, selectedNode, setSelectedNode, onNodeConfigChange, getNodeLabel, confirm]);

  // Initialize nodes with handlers
  useEffect(() => {
    if (externalNodes.length > 0 && !isLoadingWorkflow.current) {
      const nodesWithHandlers = addNodeHandlers(externalNodes);
      setNodes(nodesWithHandlers);
    }
  }, [externalNodes, addNodeHandlers, setNodes]);

  // ============ UNDO/REDO LOGIC ============
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

  const saveStateToHistory = useCallback(() => {
    if (isInternalUpdate.current || isUndoRedo.current || isLoadingWorkflow.current) return;
    
    const newState = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  useEffect(() => {
    saveStateToHistory();
  }, [nodes, edges, saveStateToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      isInternalUpdate.current = true;
      
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
      
      if (setExternalNodes) {
        setExternalNodes(prevState.nodes);
      }
      if (setExternalEdges) {
        setExternalEdges(prevState.edges);
      }
      
      setTimeout(() => {
        isInternalUpdate.current = false;
        isUndoRedo.current = false;
      }, 100);
      
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges, setExternalNodes, setExternalEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      isInternalUpdate.current = true;
      
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
      
      if (setExternalNodes) {
        setExternalNodes(nextState.nodes);
      }
      if (setExternalEdges) {
        setExternalEdges(nextState.edges);
      }
      
      setTimeout(() => {
        isInternalUpdate.current = false;
        isUndoRedo.current = false;
      }, 100);
      
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges, setExternalNodes, setExternalEdges]);

  const clearCanvas = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Canvas',
      message: 'Are you sure you want to clear all nodes? This action cannot be undone.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      setNodes([]);
      setEdges([]);
      setHistory([]);
      setHistoryIndex(-1);
      setCanUndo(false);
      setCanRedo(false);
      localStorage.removeItem('workflowNodes');
      
      if (setSelectedNode) {
        setSelectedNode(null);
      }
      if (setExternalNodes) {
        setExternalNodes([]);
      }
      if (setExternalEdges) {
        setExternalEdges([]);
      }
    }
  }, [setNodes, setEdges, setExternalNodes, setExternalEdges, setSelectedNode, confirm]);

  // ============ INIT HANDLER ============
  const onInit = useCallback((instance: any) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  // ============ ZOOM FUNCTIONS ============
  const zoomIn = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      const currentZoom = reactFlowInstanceRef.current.getZoom();
      const newZoom = Math.min(currentZoom + 0.1, 2);
      reactFlowInstanceRef.current.zoomTo(newZoom);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      const currentZoom = reactFlowInstanceRef.current.getZoom();
      const newZoom = Math.max(currentZoom - 0.1, 0.5);
      reactFlowInstanceRef.current.zoomTo(newZoom);
    }
  }, []);

  const zoomReset = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      reactFlowInstanceRef.current.zoomTo(1);
    }
  }, []);

  const getZoom = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      return reactFlowInstanceRef.current.getZoom();
    }
    return 1;
  }, []);

  // ============ EXPOSE FUNCTIONS TO PARENT ============
  useImperativeHandle(ref, () => ({
    undo,
    redo,
    getState: () => ({
      nodes,
      edges,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }),
    clearCanvas,
    updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return updateNodeStatus(node as any, status);
        }
        return node;
      });
      setNodes(updatedNodes);
      if (setExternalNodes) {
        setExternalNodes(updatedNodes);
      }
      if (onNodeStatusChange) {
        onNodeStatusChange(nodeId, status);
      }
    },
    updateNodeConfig: (nodeId: string, config: Record<string, any>) => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return updateNodeConfig(node as any, config);
        }
        return node;
      });
      setNodes(updatedNodes);
      if (setExternalNodes) {
        setExternalNodes(updatedNodes);
      }
      if (onNodeConfigChange) {
        onNodeConfigChange(nodeId, config);
      }
    },
    zoomIn,
    zoomOut,
    zoomReset,
    getZoom,
  }), [undo, redo, historyIndex, history.length, setNodes, setEdges, setExternalNodes, setExternalEdges, setSelectedNode, nodes, edges, onNodeStatusChange, onNodeConfigChange, clearCanvas, zoomIn, zoomOut, zoomReset, getZoom]);

  // ============ CONNECTION VALIDATION ============
  const isValidConnection = useCallback(
    (connection: Connection) => {
      try {
        if (!connection) {
          return false;
        }

        const { source, target } = connection;

        if (!source || !target) {
          return false;
        }

        if (source === target) {
          return false;
        }

        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);
        
        if (!sourceNode || !targetNode) {
          return false;
        }

        const sourceType = getNodeType(sourceNode);
        const targetType = getNodeType(targetNode);

        const existingEdge = edges.find(
          e => e.source === source && e.target === target
        );
        if (existingEdge) {
          return false;
        }

        if (!sourceType || !targetType) {
          return false;
        }

        if (sourceType === 'start' || sourceNode.data?.label === 'Start') {
          const outgoingCount = edges.filter(e => e.source === source).length;
          if (outgoingCount >= 1) {
            return false;
          }
        }

        if (sourceType === 'end' || sourceNode.data?.label === 'End') {
          return false;
        }

        if (targetType === 'start' || targetNode.data?.label === 'Start') {
          return false;
        }

        if (sourceType === 'end' || sourceNode.data?.label === 'End') {
          return false;
        }

        const sourceConfig = NODE_DEFINITIONS?.[sourceType];
        if (sourceConfig?.validation?.maxOutgoingConnections !== undefined) {
          const outgoingEdges = edges.filter(e => e.source === source);
          if (outgoingEdges.length >= sourceConfig.validation.maxOutgoingConnections) {
            return false;
          }
        }

        const targetConfig = NODE_DEFINITIONS?.[targetType];
        if (targetConfig?.validation?.maxIncomingConnections !== undefined) {
          const incomingEdges = edges.filter(e => e.target === target);
          if (incomingEdges.length >= targetConfig.validation.maxIncomingConnections) {
            return false;
          }
        }

        if (checkForCycle(source, target, edges)) {
          return false;
        }

        if (sourceType === 'webhook' || sourceType === 'schedule') {
          const outgoingEdges = edges.filter(e => e.source === source);
          if (outgoingEdges.length >= 1) {
            return false;
          }
        }

        return true;

      } catch (error) {
        console.error('Connection validation error:', error);
        return false;
      }
    },
    [nodes, edges, getNodeType, checkForCycle]
  );

  // ============ CONNECTION HANDLER - FIXED ============
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 WorkflowCanvas: Connection received:', params);
      
      // Validate the connection
      if (!isValidConnection(params)) {
        console.warn('⚠️ WorkflowCanvas: Invalid connection');
        return;
      }
      
      // Create the edge
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      };
      
      console.log('✅ WorkflowCanvas: New edge created:', newEdge);
      
      // Update internal state
      setEdges((eds) => {
        const exists = eds.some(e => e.source === params.source && e.target === params.target);
        if (exists) {
          console.warn('⚠️ WorkflowCanvas: Edge already exists');
          return eds;
        }
        const updated = addEdge(newEdge, eds);
        console.log('📊 WorkflowCanvas: Total edges after adding:', updated.length);
        return updated;
      });
      
      // CRITICAL: Call the external onConnect prop to sync with parent
      if (externalOnConnect) {
        console.log('📤 WorkflowCanvas: Calling external onConnect');
        externalOnConnect(params);
      } else {
        console.warn('⚠️ WorkflowCanvas: No external onConnect provided - edges will not sync to parent!');
        
        // Fallback: Manually update external edges if setExternalEdges is provided
        if (setExternalEdges) {
          setExternalEdges((prev: Edge[]) => {
            const exists = prev.some(e => e.source === params.source && e.target === params.target);
            if (exists) return prev;
            return [...prev, newEdge];
          });
        }
      }
    },
    [isValidConnection, setEdges, externalOnConnect, setExternalEdges]
  );

  // ============ NODE CLICK HANDLER ============
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (setSelectedNode) {
      setSelectedNode(node);
    }
  }, [setSelectedNode]);

  // ============ NODE DRAG HANDLER ============
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

  // ============ EDGE DELETE HANDLER ============
  const onEdgeClick = useCallback(async (_: React.MouseEvent, edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const confirmed = await confirm({
      title: 'Delete Connection',
      message: `Delete connection between "${getNodeLabel(sourceNode)}" and "${getNodeLabel(targetNode)}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (confirmed) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      
      // Also sync deletion to parent
      if (setExternalEdges) {
        setExternalEdges((prev: Edge[]) => prev.filter((e) => e.id !== edge.id));
      }
      if (externalOnConnect) {
        // Notify parent that edge was deleted by passing null or a deletion signal
        // Alternatively, use a separate callback for edge deletion
      }
    }
  }, [setEdges, nodes, getNodeLabel, confirm, setExternalEdges, externalOnConnect]);

  // ============ PANE CLICK HANDLER ============
  const onPaneClick = useCallback(() => {
    if (setSelectedNode) {
      setSelectedNode(null);
    }
  }, [setSelectedNode]);

  // ============ DRAG AND DROP HANDLERS ============
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const newNode = NodeFactory.createNodeFromDrop(type, position, {
        onDelete: async (nodeId: string) => {
          const nodeLabel = getNodeLabel(nodes.find(n => n.id === nodeId));
          const confirmed = await confirm({
            title: 'Delete Node',
            message: `Are you sure you want to delete "${nodeLabel}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
          });

          if (confirmed) {
            const updatedNodes = nodes.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
            if (selectedNode?.id === nodeId && setSelectedNode) {
              setSelectedNode(null);
            }
            if (setExternalNodes) {
              setExternalNodes(updatedNodes);
            }
          }
        },
        onConfigChange: (nodeId: string, config: Record<string, any>) => {
          const updatedNodes = nodes.map((n) => {
            if (n.id === nodeId) {
              return updateNodeConfig(n as any, config);
            }
            return n;
          });
          setNodes(updatedNodes);
          if (setExternalNodes) {
            setExternalNodes(updatedNodes);
          }
          if (onNodeConfigChange) {
            onNodeConfigChange(nodeId, config);
          }
        }
      });

      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      if (setExternalNodes) {
        setExternalNodes(updatedNodes);
      }
    },
    [nodes, setNodes, setExternalNodes, selectedNode, setSelectedNode, onNodeConfigChange, getNodeLabel, confirm]
  );

  // ============ RENDER ============
  return (
    <>
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
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50 dark:bg-gray-900"
          minZoom={0.5}
          maxZoom={2}
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodesDraggable={true}
          nodesConnectable={true}
          isValidConnection={isValidConnection}
          connectionLineStyle={{ 
            stroke: '#3b82f6', 
            strokeWidth: 3,
            strokeDasharray: '5,5'
          }}
          connectionLineType={ConnectionLineType.Bezier}
          connectionRadius={20}
        >
          <Background 
            color="#d1d5db" 
            gap={24} 
            size={1}
            className="bg-gray-50 dark:bg-gray-900"
          />
          <Controls 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            showInteractive={false}
            position="bottom-right"
          />
          <MiniMap 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            nodeColor="#3b82f6"
            maskColor="rgba(0,0,0,0.05)"
            position="bottom-left"
          />
        </ReactFlow>
      </div>
      
      {/* Render the confirmation dialog */}
      {ConfirmComponent}
    </>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;