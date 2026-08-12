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

const nodeTypes = { 
  customNode: NodeComponent,
};

interface WorkflowCanvasProps {
  nodes?: Node[];
  setNodes?: (nodes: Node[]) => void;
  selectedNode?: Node | null;
  setSelectedNode?: (node: Node | null) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
  onNodeStatusChange?: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  onNodeConfigChange?: (nodeId: string, config: Record<string, any>) => void;
}

export const WorkflowCanvas = forwardRef<any, WorkflowCanvasProps>(({ 
  nodes: externalNodes = [], 
  setNodes: setExternalNodes,
  selectedNode,
  setSelectedNode,
  onUndoRedoChange,
  onNodeStatusChange,
  onNodeConfigChange
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // ============ HELPER FUNCTIONS ============
  
  const getNodeLabel = useCallback((node: Node | undefined): string => {
    if (!node) return 'Unknown';
    return node.data?.label || node.type || node.id || 'Unknown';
  }, []);

  const getNodeType = useCallback((node: Node | undefined): string => {
    if (!node) return '';
    return node.data?.type || node.type || '';
  }, []);

  const logConnectionStatus = useCallback((status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    const prefix = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${prefix} Connection: ${message}`, data || '');
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
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ============ NODE HANDLERS ============
  const addNodeHandlers = useCallback((nodesList: Node[]) => {
    return nodesList.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: (nodeId: string) => {
          if (window.confirm('Are you sure you want to delete this node?')) {
            const updatedNodes = nodesList.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
            if (selectedNode?.id === nodeId && setSelectedNode) {
              setSelectedNode(null);
            }
            if (setExternalNodes) {
              setExternalNodes(updatedNodes);
            }
            logConnectionStatus('success', `Node "${getNodeLabel(nodesList.find(n => n.id === nodeId))}" deleted`);
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
          logConnectionStatus('success', `Node "${getNodeLabel(nodesList.find(n => n.id === nodeId))}" configured`);
        },
      }
    }));
  }, [setNodes, setExternalNodes, selectedNode, setSelectedNode, onNodeConfigChange, getNodeLabel, logConnectionStatus]);

  // Initialize nodes with handlers
  useEffect(() => {
    if (externalNodes.length > 0) {
      const nodesWithHandlers = addNodeHandlers(externalNodes);
      setNodes(nodesWithHandlers);
    }
  }, [externalNodes, addNodeHandlers, setNodes]);

  // Save nodes to localStorage
  useEffect(() => {
    if (nodes.length > 0) {
      const nodesToSave = nodes.map((node) => {
        const { onDelete, onConfigChange, ...restData } = node.data;
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

  // ============ EXPOSE FUNCTIONS TO PARENT ============
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
    },
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
    }
  }), [undo, redo, historyIndex, history.length, setNodes, setEdges, setExternalNodes, setSelectedNode, nodes, onNodeStatusChange, onNodeConfigChange]);

  // ============ CONNECTION VALIDATION ============
  const isValidConnection = useCallback(
    (connection: Connection) => {
      logConnectionStatus('warning', 'Validating connection', { source: connection.source, target: connection.target });

      try {
        if (!connection) {
          logConnectionStatus('error', 'Connection object is null or undefined');
          return false;
        }

        const { source, target } = connection;

        if (!source || !target) {
          logConnectionStatus('error', 'Missing source or target', { source, target });
          return false;
        }

        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);
        
        if (!sourceNode) {
          logConnectionStatus('error', `Source node not found: ${source}`);
          return false;
        }
        
        if (!targetNode) {
          logConnectionStatus('error', `Target node not found: ${target}`);
          return false;
        }

        // Prevent self-connection
        if (source === target) {
          logConnectionStatus('error', `Cannot connect node "${getNodeLabel(sourceNode)}" to itself`);
          return false;
        }

        const sourceType = getNodeType(sourceNode);
        const targetType = getNodeType(targetNode);

        // Prevent duplicate connections
        const existingEdge = edges.find(
          e => e.source === source && e.target === target
        );
        if (existingEdge) {
          logConnectionStatus('error', `Connection already exists between "${getNodeLabel(sourceNode)}" and "${getNodeLabel(targetNode)}"`);
          return false;
        }

        // Validate node types
        if (!sourceType || !targetType) {
          logConnectionStatus('error', 'Missing node type', { sourceType, targetType });
          return false;
        }

        // ============ HANDLE VALIDATION ============
        
        // 1. START node: Only has outgoing connection (no incoming)
        if (sourceType === 'start' || sourceNode.data?.label === 'Start') {
          // Start node can only have outgoing connections
          const outgoingCount = edges.filter(e => e.source === source).length;
          if (outgoingCount >= 1) {
            logConnectionStatus('error', `Start node "${getNodeLabel(sourceNode)}" can only have one outgoing connection`);
            return false;
          }
        }

        // 2. END node: Only has incoming connection (no outgoing)
        if (sourceType === 'end' || sourceNode.data?.label === 'End') {
          logConnectionStatus('error', `End node "${getNodeLabel(sourceNode)}" cannot have outgoing connections`);
          return false;
        }

        // 3. Target cannot be Start node (Start nodes don't have incoming connections)
        if (targetType === 'start' || targetNode.data?.label === 'Start') {
          logConnectionStatus('error', `Cannot connect to Start node "${getNodeLabel(targetNode)}" - Start nodes don't accept incoming connections`);
          return false;
        }

        // 4. Source cannot be End node (End nodes don't have outgoing connections)
        if (sourceType === 'end' || sourceNode.data?.label === 'End') {
          logConnectionStatus('error', `Cannot connect from End node "${getNodeLabel(sourceNode)}" - End nodes don't have outgoing connections`);
          return false;
        }

        // 5. Check max outgoing connections for source
        const sourceConfig = NODE_DEFINITIONS?.[sourceType];
        if (sourceConfig?.validation?.maxOutgoingConnections !== undefined) {
          const outgoingEdges = edges.filter(e => e.source === source);
          const outgoingCount = outgoingEdges.length;
          
          if (outgoingCount >= sourceConfig.validation.maxOutgoingConnections) {
            logConnectionStatus(
              'error', 
              `Source node "${getNodeLabel(sourceNode)}" already has ${outgoingCount} outgoing connections (max: ${sourceConfig.validation.maxOutgoingConnections})`
            );
            return false;
          }
        }

        // 6. Check max incoming connections for target
        const targetConfig = NODE_DEFINITIONS?.[targetType];
        if (targetConfig?.validation?.maxIncomingConnections !== undefined) {
          const incomingEdges = edges.filter(e => e.target === target);
          const incomingCount = incomingEdges.length;
          
          if (incomingCount >= targetConfig.validation.maxIncomingConnections) {
            logConnectionStatus(
              'error', 
              `Target node "${getNodeLabel(targetNode)}" already has ${incomingCount} incoming connections (max: ${targetConfig.validation.maxIncomingConnections})`
            );
            return false;
          }
        }

        // 7. Check for cycles
        if (checkForCycle(source, target, edges)) {
          logConnectionStatus('error', `Connection would create a cycle between "${getNodeLabel(sourceNode)}" and "${getNodeLabel(targetNode)}"`);
          return false;
        }

        // 8. Trigger nodes (webhook, schedule) can only have one outgoing
        if (sourceType === 'webhook' || sourceType === 'schedule') {
          const outgoingEdges = edges.filter(e => e.source === source);
          if (outgoingEdges.length >= 1) {
            logConnectionStatus(
              'error', 
              `Trigger node "${getNodeLabel(sourceNode)}" can only have one outgoing connection`
            );
            return false;
          }
        }

        // All validations passed
        logConnectionStatus(
          'success', 
          `Connection valid: "${getNodeLabel(sourceNode)}" → "${getNodeLabel(targetNode)}"`
        );
        return true;

      } catch (error) {
        logConnectionStatus('error', 'Unexpected error in connection validation', error);
        return false;
      }
    },
    [nodes, edges, getNodeLabel, getNodeType, logConnectionStatus, checkForCycle]
  );

  // ============ CONNECTION HANDLER ============
  const onConnect = useCallback(
    (params: Connection) => {
      logConnectionStatus('warning', 'Connection attempt', { source: params.source, target: params.target });
      
      if (isValidConnection(params)) {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          data: {
            sourceLabel: getNodeLabel(sourceNode),
            targetLabel: getNodeLabel(targetNode),
          }
        };
        
        setEdges((eds) => addEdge(newEdge, eds));
        logConnectionStatus(
          'success', 
          `Edge added: "${getNodeLabel(sourceNode)}" → "${getNodeLabel(targetNode)}"`
        );
      } else {
        logConnectionStatus('error', 'Connection rejected - validation failed');
      }
    },
    [setEdges, isValidConnection, nodes, getNodeLabel, logConnectionStatus]
  );

  // ============ NODE CLICK HANDLER ============
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (setSelectedNode) {
      setSelectedNode(node);
      logConnectionStatus('success', `Node selected: "${getNodeLabel(node)}"`);
    }
  }, [setSelectedNode, getNodeLabel, logConnectionStatus]);

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
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (window.confirm(`Delete connection between "${getNodeLabel(sourceNode)}" and "${getNodeLabel(targetNode)}"?`)) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      logConnectionStatus(
        'success', 
        `Edge deleted: "${getNodeLabel(sourceNode)}" → "${getNodeLabel(targetNode)}"`
      );
    }
  }, [setEdges, nodes, getNodeLabel, logConnectionStatus]);

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
    (event: React.DragEvent) => {
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
        onDelete: (nodeId: string) => {
          if (window.confirm('Are you sure you want to delete this node?')) {
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
      
      logConnectionStatus('success', `Node dropped: "${getNodeLabel(newNode)}"`);
    },
    [nodes, setNodes, setExternalNodes, selectedNode, setSelectedNode, onNodeConfigChange, getNodeLabel, logConnectionStatus]
  );

  // ============ RENDER ============
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
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
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
        connectionLineType="bezier"
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
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;