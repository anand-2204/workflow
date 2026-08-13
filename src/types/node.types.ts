import type { ReactNode } from 'react';
import type { Node as ReactFlowNode } from 'reactflow';

export interface NodeConfig {
  type: string;
  label: string;
  description: string;
  bgColor: string;
  borderColor: string;
  hoverBorderColor: string;
  iconColor: string;
  iconBg: string;
  shadowColor: string;
  icon: ReactNode;
  defaultStatus?: 'idle' | 'running' | 'success' | 'error';
  category: 'Triggers' | 'Actions' | 'Logic';
  validation?: {
    maxOutgoingConnections?: number;
    maxIncomingConnections?: number;
    allowMultipleConnections?: boolean;
  };
}

export interface NodeData {
  label: string;
  type?: string;
  description?: string;
  icon?: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  onDelete?: (id: string) => void;
  onConfigChange?: (id: string, config: Record<string, any>) => void;
}

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  defaultConfig: Record<string, any>;
  category: string;
}
export type CustomNode = ReactFlowNode<NodeData>;

export interface NodeCategoryMap {
  [key: string]: NodeConfig[];
}