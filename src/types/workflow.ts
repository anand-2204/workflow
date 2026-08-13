

// src/types/workflow.ts
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type?: string;
    description?: string;
    icon?: any;
    bgColor?: string;
    iconColor?: string;
    config?: Record<string, any>;
    status?: 'idle' | 'running' | 'success' | 'error';
    result?: any;
    error?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id?: number;
  workflowId?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  jsonData: string;
  status?: 'draft' | 'active' | 'archived';
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface WorkflowCreateRequest {
  name: string;
  jsonData: string;
  description?: string;
}

export interface WorkflowUpdateRequest {
  name?: string;
  jsonData?: string;
  description?: string;
  status?: string;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  progress: number;
  logs?: string[];
}