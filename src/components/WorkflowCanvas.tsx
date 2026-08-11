import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
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
    {/* Drag handle indicator */}
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="w-1 h-6 bg-gray-300 rounded-full" />
    </div>
  </div>
);

const nodeTypes = { 
  customNode: CustomNodeComponent,
  default: CustomNodeComponent,
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
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync external nodes with internal state
  useEffect(() => {
    if (externalNodes.length > 0) {
      setNodes(externalNodes);
    }
  }, [externalNodes, setNodes]);

  // Also sync when nodes change internally
  useEffect(() => {
    if (setExternalNodes && nodes.length > 0) {
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
        n.id === node.id ? node : n
      );
      setExternalNodes(updatedNodes);
    }
  }, [nodes, setExternalNodes]);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Drop event triggered on canvas');
      
      // Get the node type from the drag data
      const type = event.dataTransfer.getData('application/reactflow');
      console.log('Node type from drag:', type);
      
      if (!type) {
        console.log('No node type found - check drag data');
        return;
      }

      // Get the drop position
      if (!reactFlowWrapper.current) {
        console.log('No wrapper ref found');
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // Calculate position relative to the React Flow container
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      console.log('Drop position:', position);

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

      console.log('Creating new node:', newNode);

      // Update internal state
      setNodes((nds) => {
        const updated = [...nds, newNode];
        console.log('Updated nodes count:', updated.length);
        return updated;
      });
      
      // Update external state
      if (setExternalNodes) {
        const updatedNodes = [...nodes, newNode];
        setExternalNodes(updatedNodes);
      }

      // Reset drag over state
      setIsDragOver(false);
    },
    [setNodes, nodes, setExternalNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  return (
    <div 
      ref={reactFlowWrapper}
      className={`w-full h-full relative ${isDragOver ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
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
       
        
        

       
      </ReactFlow>
    </div>
  );
}