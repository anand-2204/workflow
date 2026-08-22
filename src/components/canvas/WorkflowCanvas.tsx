// components/canvas/WorkflowCanvas.tsx
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
import { NodeFactory } from '../../utils/nodeFactory';
import { NODE_DEFINITIONS } from '../../components/constants/nodeDefinitions';
import { useConfirm } from '../../hooks/useConfirm';
import { ConnectionLineType } from 'reactflow';
import { workflowApi } from '../../api/workflowApi';

// ✅ nodeTypes ko BAHAR define karein (React Flow ke liye constant zaroori hai)
const nodeTypes = { customNode: NodeComponent };

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
  onConnect?: (connection: Connection) => void;
  workflowId?: number;
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
  onConnect: externalOnConnect,
  workflowId
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<any>(null);
  const isInternalUpdate = useRef(false);
  const isUndoRedo = useRef(false);
  const isLoadingWorkflow = useRef(false);
  const { confirm, ConfirmComponent } = useConfirm();

  // ✅ nodeFunctionsRef - Functions ko hamesha fresh rakhta hai
  const nodeFunctionsRef = useRef({
    onDelete: (nodeId: string) => {},
    onExecute: (nodeId: string) => {},
    onCancelExecution: (nodeId: string, executionId: string) => {},
  });

  // ============ HELPER FUNCTIONS ============
  const getNodeLabel = useCallback((node: Node | undefined): string => {
    if (!node) return 'Unknown';
    return node.data?.label || node.type || node.id || 'Unknown';
  }, []);

  const getNodeType = useCallback((node: Node | undefined): string => {
    if (!node) return '';
    return node.data?.type || node.type || '';
  }, []);

  // ============ NODE HANDLERS ============
  const executeSingleNode = useCallback(async (nodeId: string) => {
    if (!workflowId) {
      console.error('No workflow ID available');
      return;
    }
    try {
      const runningNodes = nodes.map((n) => 
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n
      );
      setNodes(runningNodes);
      if (setExternalNodes) setExternalNodes(runningNodes);

      const result = await workflowApi.executeNode(workflowId, nodeId);
      console.log('✅ Executed node:', nodeId, result);

      const successNodes = nodes.map((n) => 
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'success', executionId: result.executionId, executionResult: result } } : n
      );
      setNodes(successNodes);
      if (setExternalNodes) setExternalNodes(successNodes);
      if (setSelectedNode) {
        setSelectedNode((prev) => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, executionResult: result } } : prev);
      }
    } catch (error) {
      console.error('Execution failed:', error);
      const errorNodes = nodes.map((n) => 
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'error', error } } : n
      );
      setNodes(errorNodes);
      if (setExternalNodes) setExternalNodes(errorNodes);
    }
  }, [workflowId, nodes, setNodes, setExternalNodes, setSelectedNode]);

  const cancelSingleNodeExecution = useCallback(async (nodeId: string, executionId: string) => {
    try {
      await workflowApi.cancelNodeExecution(executionId);
      const idleNodes = nodes.map((n) => 
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle', executionId: null } } : n
      );
      setNodes(idleNodes);
      if (setExternalNodes) setExternalNodes(idleNodes);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  }, [nodes, setNodes, setExternalNodes]);

  const handleNodeDelete = useCallback(async (nodeId: string) => {
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
      if (selectedNode?.id === nodeId && setSelectedNode) setSelectedNode(null);
      if (setExternalNodes) setExternalNodes(updatedNodes);
      if (setExternalEdges) setExternalEdges((prev: Edge[]) => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    }
  }, [nodes, setNodes, setEdges, setExternalNodes, setExternalEdges, selectedNode, setSelectedNode, confirm]);

  // ============ FUNCTIONS KO REF MEIN STORE KAREIN ============
  useEffect(() => {
    nodeFunctionsRef.current = {
      onDelete: handleNodeDelete,
      onExecute: executeSingleNode,
      onCancelExecution: cancelSingleNodeExecution,
    };
  }, [handleNodeDelete, executeSingleNode, cancelSingleNodeExecution]);

  // ============ INJECT HANDLERS IN NODES ============
  // ✅ Ye function har node ke data mein functions inject karega
  const injectNodeHandlers = useCallback((nodesList: Node[]) => {
    return nodesList.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        id: node.id, // ✅ IMPORTANT: data mein id inject karein!
        onExecute: (nodeId: string) => nodeFunctionsRef.current.onExecute(nodeId),
        onDelete: (nodeId: string) => nodeFunctionsRef.current.onDelete(nodeId),
        onCancelExecution: (nodeId: string, executionId: string) => nodeFunctionsRef.current.onCancelExecution(nodeId, executionId),
      }
    }));
  }, []);

  // ============ SYNC EXTERNAL DATA + INJECT HANDLERS ============
  useEffect(() => {
    if (!isInternalUpdate.current && !isUndoRedo.current) {
      const nodesWithHandlers = injectNodeHandlers(externalNodes);
      setNodes(nodesWithHandlers);
    }
  }, [externalNodes, injectNodeHandlers, setNodes]);

  useEffect(() => {
    if (!isInternalUpdate.current && !isUndoRedo.current) {
      setEdges(externalEdges);
    }
  }, [externalEdges, setEdges]);

  // ============ UNDO/REDO LOGIC ============
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [_canUndo, setCanUndo] = useState(false);
  const [_canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    const undo = historyIndex > 0;
    const redo = historyIndex < history.length - 1;
    setCanUndo(undo);
    setCanRedo(redo);
    if (onUndoRedoChange) onUndoRedoChange(undo, redo);
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
      if (setExternalNodes) setExternalNodes(prevState.nodes);
      if (setExternalEdges) setExternalEdges(prevState.edges);
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
      if (setExternalNodes) setExternalNodes(nextState.nodes);
      if (setExternalEdges) setExternalEdges(nextState.edges);
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
      if (setSelectedNode) setSelectedNode(null);
      if (setExternalNodes) setExternalNodes([]);
      if (setExternalEdges) setExternalEdges([]);
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
      reactFlowInstanceRef.current.zoomTo(Math.min(currentZoom + 0.1, 2));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      const currentZoom = reactFlowInstanceRef.current.getZoom();
      reactFlowInstanceRef.current.zoomTo(Math.max(currentZoom - 0.1, 0.5));
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
    undo, redo,
    getState: () => ({ nodes, edges, canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 }),
    clearCanvas,
    updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) return updateNodeStatus(node as any, status);
        return node;
      });
      setNodes(updatedNodes);
      if (setExternalNodes) setExternalNodes(updatedNodes);
      if (onNodeStatusChange) onNodeStatusChange(nodeId, status);
    },
    updateNodeConfig: (nodeId: string, config: Record<string, any>) => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) return updateNodeConfig(node as any, config);
        return node;
      });
      setNodes(updatedNodes);
      if (setExternalNodes) setExternalNodes(updatedNodes);
      if (onNodeConfigChange) onNodeConfigChange(nodeId, config);
    },
    zoomIn, zoomOut, zoomReset, getZoom,
  }), [undo, redo, historyIndex, history.length, setNodes, setEdges, setExternalNodes, setExternalEdges, setSelectedNode, nodes, edges, onNodeStatusChange, onNodeConfigChange, clearCanvas, zoomIn, zoomOut, zoomReset, getZoom]);

  // ============ CONNECTION VALIDATION ============
  const isValidConnection = useCallback((connection: Connection) => {
    try {
      if (!connection) return false;
      const { source, target } = connection;
      if (!source || !target) return false;
      if (source === target) return false;
      const sourceNode = nodes.find(n => n.id === source);
      const targetNode = nodes.find(n => n.id === target);
      if (!sourceNode || !targetNode) return false;
      
      const existingEdge = edges.find(e => e.source === source && e.target === target);
      if (existingEdge) return false;
      
      const sourceConfig = NODE_DEFINITIONS?.[sourceNode.data?.type];
      if (sourceConfig?.validation?.maxOutgoingConnections !== undefined) {
        const outgoingEdges = edges.filter(e => e.source === source);
        if (outgoingEdges.length >= sourceConfig.validation.maxOutgoingConnections) return false;
      }
      
      const targetConfig = NODE_DEFINITIONS?.[targetNode.data?.type];
      if (targetConfig?.validation?.maxIncomingConnections !== undefined) {
        const incomingEdges = edges.filter(e => e.target === target);
        if (incomingEdges.length >= targetConfig.validation.maxIncomingConnections) return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, [nodes, edges]);

  // ============ CONNECTION HANDLER ============
  const onConnect = useCallback((params: Connection) => {
    if (!isValidConnection(params)) return;
    const newEdge = { ...params, id: `edge-${params.source}-${params.target}-${Date.now()}`, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } };
    setEdges((eds) => addEdge(newEdge, eds));
    if (externalOnConnect) externalOnConnect(params);
  }, [isValidConnection, setEdges, externalOnConnect]);

  // ============ NODE CLICK, DRAG, EDGE CLICK, PANE CLICK ============
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (setSelectedNode) setSelectedNode(node);
  }, [setSelectedNode]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const updatedNodes = nodes.map((n) => n.id === node.id ? { ...n, position: node.position } : n);
    setNodes(updatedNodes);
    if (setExternalNodes) setExternalNodes(updatedNodes);
  }, [nodes, setNodes, setExternalNodes]);

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
      if (setExternalEdges) setExternalEdges((prev: Edge[]) => prev.filter((e) => e.id !== edge.id));
    }
  }, [setEdges, nodes, getNodeLabel, confirm, setExternalEdges]);

  const onPaneClick = useCallback(() => {
    if (setSelectedNode) setSelectedNode(null);
  }, [setSelectedNode]);

  // ============ DRAG AND DROP HANDLERS ============
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowWrapper.current) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = { x: event.clientX - reactFlowBounds.left - 75, y: event.clientY - reactFlowBounds.top - 40 };

    const newNode = NodeFactory.createNodeFromDrop(type, position, {
      onDelete: async (nodeId: string) => {
        await handleNodeDelete(nodeId);
      },
      onConfigChange: (nodeId: string, config: Record<string, any>) => {
        const updatedNodes = nodes.map((n) => {
          if (n.id === nodeId) return updateNodeConfig(n as any, config);
          return n;
        });
        setNodes(updatedNodes);
        if (setExternalNodes) setExternalNodes(updatedNodes);
        if (onNodeConfigChange) onNodeConfigChange(nodeId, config);
      },
      onExecute: async (nodeId: string) => {
        await executeSingleNode(nodeId);
      },
      onCancelExecution: async (nodeId: string, executionId: string) => {
        await cancelSingleNodeExecution(nodeId, executionId);
      }
    });

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    if (setExternalNodes) setExternalNodes(updatedNodes);
  }, [nodes, setNodes, setExternalNodes, handleNodeDelete, executeSingleNode, cancelSingleNodeExecution, onNodeConfigChange]);

  // ============ RENDER ============
  return (
    <>
      <div ref={reactFlowWrapper} className="w-full h-full relative" style={{ background: 'transparent' }}>
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
          connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 3, strokeDasharray: '5,5' }}
          connectionLineType={ConnectionLineType.Bezier}
          connectionRadius={20}
        >
          <Background color="#d1d5db" gap={24} size={1} className="bg-gray-50 dark:bg-gray-900" />
          <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" showInteractive={false} position="bottom-right" />
          <MiniMap className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.05)" position="bottom-left" />
        </ReactFlow>
      </div>
      {ConfirmComponent}
    </>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;