import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Connection, Node } from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component
const CustomNodeComponent = ({ data, selected }: any) => (
  <div className={`
    px-4 py-3 rounded-xl shadow-md border-2 transition-all duration-200 min-w-[140px]
    ${selected 
      ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
      : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
    }
    ${data.bgColor || 'bg-white'}
    cursor-grab active:cursor-grabbing
    group relative
  `}>
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
  </div>
);

const nodeTypes = { 
  customNode: CustomNodeComponent,
};

interface WorkflowCanvasProps {
  nodes?: Node[];
  setNodes?: (nodes: Node[]) => void;
  selectedNode?: Node | null;
  setSelectedNode?: (node: Node | null) => void;
}

export default function WorkflowCanvas({ 
  nodes: externalNodes = [], 
  setNodes: setExternalNodes,
  selectedNode,
  setSelectedNode 
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Sync external nodes with internal state
  useEffect(() => {
    if (externalNodes.length > 0) {
      setNodes(externalNodes);
    }
  }, [externalNodes, setNodes]);

  // Sync internal nodes to external
  useEffect(() => {
    if (setExternalNodes) {
      setExternalNodes(nodes);
    }
  }, [nodes, setExternalNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (setSelectedNode) {
      setSelectedNode(node);
    }
  }, [setSelectedNode]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (setExternalNodes) {
      const updatedNodes = nodes.map(n => 
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setExternalNodes(updatedNodes);
    }
  }, [nodes, setExternalNodes]);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      // Get the node type from the drag data
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) {
        return;
      }

      // Get the drop position
      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      // Create node label from type
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      
      // Get icon for node type
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

      // Get color for node type
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
        },
      };

      // Update internal state
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
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
      >
        <Background 
          color="#d1d5db" 
          gap={24} 
          size={1}
          className="bg-gray-50"
          variant="dots"
        />
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          showInteractive={false}
          position="bottom-right"
        />
       
      </ReactFlow>
    </div>
  );
}