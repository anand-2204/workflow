import  type { Node } from 'reactflow';
import type { NodeData, CustomNode } from '../types/node.types';
import { getNodeConfig } from '../components/constants/nodeDefinitions';

export interface CreateNodeOptions {
  type: string;
  label?: string;
  position?: { x: number; y: number };
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  onDelete?: (nodeId: string) => void;
  onConfigChange?: (nodeId: string, config: Record<string, any>) => void;
}

export class NodeFactory {
  static createNode(options: CreateNodeOptions): CustomNode {
    const config = getNodeConfig(options.type);
    
    if (!config) {
      throw new Error(`Unknown node type: ${options.type}`);
    }

    const nodeData: NodeData = {
      label: options.label || config.label,
      type: options.type,
      description: config.description,
      icon: config.icon,
      bgColor: config.bgColor,
      iconColor: config.iconColor,
      status: options.status || 'idle',
      config: options.config || {},
      onDelete: options.onDelete,
      onConfigChange: options.onConfigChange,
    };

    return {
      id: `${options.type}-${Date.now()}`,
      type: 'customNode',
      position: options.position || { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: nodeData,
    };
  }

  static createNodeFromDrop(type: string, position: { x: number; y: number }, handlers?: {
    onDelete?: (nodeId: string) => void;
    onConfigChange?: (nodeId: string, config: Record<string, any>) => void;
  }): CustomNode {
    return this.createNode({
      type,
      position,
      onDelete: handlers?.onDelete,
      onConfigChange: handlers?.onConfigChange,
    });
  }

  static createNodeWithDelete(node: CustomNode, onDelete: (nodeId: string) => void): CustomNode {
    return {
      ...node,
      data: {
        ...node.data,
        onDelete,
      },
    };
  }

  static createNodeWithConfigChange(node: CustomNode, onConfigChange: (nodeId: string, config: Record<string, any>) => void): CustomNode {
    return {
      ...node,
      data: {
        ...node.data,
        onConfigChange,
      },
    };
  }
}

// Helper function to update node status
export const updateNodeStatus = (node: CustomNode, status: 'idle' | 'running' | 'success' | 'error'): CustomNode => {
  return {
    ...node,
    data: {
      ...node.data,
      status,
    },
  };
};

// Helper to update node config
export const updateNodeConfig = (node: CustomNode, config: Record<string, any>): CustomNode => {
  return {
    ...node,
    data: {
      ...node.data,
      config: {
        ...node.data.config,
        ...config,
      },
    },
  };
};