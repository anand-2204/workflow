// src/types/workflow.ts

// ==========================================
// NODE INPUT SOURCE - Data flow from previous nodes
// ==========================================

export interface NodeInputSource {
  fromNode?: string;      // Source node ID to get data from
  field?: string;         // Specific field path (e.g., "data.users[0].email")
  defaultValue?: any;     // Default value if source not found
  transform?: string;     // Optional transform (json, string, array)
}

// ==========================================
// CONDITION TYPES
// ==========================================

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'regex'
  | 'in'
  | 'not_in';

export interface ConditionConfig {
  field: string;           // Field to evaluate (e.g., "status", "age", "score")
  operator: ConditionOperator;
  value: string;           // Value to compare against
  caseSensitive?: boolean;
}

export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: 'Greater or Equal' },
  { value: 'less_or_equal', label: 'Less or Equal' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'regex', label: 'Regex Match' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

// ==========================================
// WORKFLOW NODE
// ==========================================

export interface WorkflowNodeData {
  label: string;
  type?: string;
  description?: string;
  icon?: any;
  bgColor?: string;
  iconColor?: string;
  
  // Configuration
  config?: Record<string, any>;
  
  // Input mapping from previous nodes
  inputs?: Record<string, NodeInputSource>;
  
  // Output mapping for next nodes
  outputMapping?: Record<string, string>;
  
  // ✅ Condition configuration (for condition nodes)
  condition?: ConditionConfig;
  
  // ✅ Default branch for condition (true/false)
  defaultBranch?: 'true' | 'false';
  
  // Runtime status
  status?: 'idle' | 'running' | 'success' | 'error' | 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

// ==========================================
// WORKFLOW EDGE
// ==========================================

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  
  // ✅ Data mapping for this edge
  dataMapping?: Record<string, string>;
  
  // ✅ Whether data flows through this edge
  passData?: boolean;
  
  // ✅ Condition label for the edge (True/False) - for conditional workflows
  conditionLabel?: 'True' | 'False';
  
  // ✅ Edge color based on condition
  conditionColor?: string;
  
  // ✅ Source handle (for nodes with multiple outputs like condition)
  sourceHandle?: string | null;
  
  // ✅ Target handle
  targetHandle?: string | null;
}

// ==========================================
// WORKFLOW
// ==========================================

export interface Workflow {
  id?: number;
  workflowId?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  jsonData: string;
  status?: 'draft' | 'active' | 'archived';
  
  // Parsed data
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  
  // Scheduling fields
  isScheduled?: boolean;
  scheduledDateTime?: string | null;
  recurrenceType?: string;
  nextRunTime?: string | null;
  lastExecutionTime?: string | null;
  lastRunTime?: string | null;
  scheduledAt?: string | null;
}

// ==========================================
// REQUEST/RESPONSE MODELS
// ==========================================

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

// ==========================================
// EXECUTION
// ==========================================

export interface ExecuteWorkflowRequest {
  inputData?: Record<string, any>;
  runAsync?: boolean;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  url?: string;
  message?: string;
  error?: string;
  failedNodeId?: string;
  nodeResults?: Record<string, any>;
  logs?: string[];
  startedAt?: string;
  completedAt?: string;
  totalNodes?: number;
  completedNodes?: number;
}

// ==========================================
// EXECUTION DETAILS
// ==========================================

export interface NodeExecutionDetail {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: string;
  progress: number;
  input?: any;
  output?: any;
  error?: string;
  retryCount: number;
  startTime?: string;
  endTime?: string;
  
  // ✅ Data source info
  inputSources?: DataSourceInfo[];
}

export interface DataSourceInfo {
  fromNodeId: string;
  fromNodeLabel: string;
  fieldPath: string;
  value?: any;
}

export interface WorkflowExecutionDetailResponse {
  executionId: string;
  workflowId: number;
  workflowName: string;
  status: string;
  progress: number;
  currentNode?: string;
  error?: string;
  startTime: string;
  endTime?: string;
  nodes: NodeExecutionDetail[];
  logs: ExecutionLog[];
  
  // Overall workflow output
  workflowOutput?: any;
  nodeOutputs?: Record<string, any>;
}

// ==========================================
// LOGGING
// ==========================================

export interface ExecutionLog {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  timestamp: string;
}

export interface LogFilter {
  level?: string;
  nodeId?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}

// ==========================================
// SCHEDULING
// ==========================================

export interface ScheduleWorkflowRequest {
  workflowId: number;
  scheduledDateTime: string;
  recurrenceType?: 'once' | 'daily' | 'weekly' | 'monthly';
  cronExpression?: string;
}

export interface ScheduleResponse {
  scheduleId: number;
  workflowId: number;
  workflowName: string;
  scheduledDateTime: string;
  recurrenceType: string;
  nextRunTime?: string;
  status: string;
}

// ==========================================
// WORKFLOW STATUS
// ==========================================

export interface WorkflowStatusResponse {
  status: 'idle' | 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  executionId?: string;
  currentNode?: string;
  startTime?: string;
  endTime?: string;
  error?: string;
  nodes: WorkflowStatusNode[];
  logs: string[];
}

export interface WorkflowStatusNode {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: string;
  progress: number;
  output?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
}

// ==========================================
// PAGINATION
// ==========================================

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
  hasNext: boolean;
  hasPrevious: boolean;
}

// ==========================================
// NODE TYPE HELPERS
// ==========================================

export type NodeType = 
  | 'start'
  | 'end'
  | 'httpRequest'
  | 'email'
  | 'whatsapp'
  | 'transform'
  | 'filter'
  | 'database'
  | 'condition'
  | 'webhook'
  | 'schedule'
  | 'delay'
  | 'notification'
  | 'http';

export const NodeTypeLabels: Record<NodeType, string> = {
  start: 'Start',
  end: 'End',
  httpRequest: 'HTTP Request',
  email: 'Email',
  whatsapp: 'WhatsApp',
  transform: 'Transform',
  filter: 'Filter',
  database: 'Database',
  condition: 'Condition',
  webhook: 'Webhook',
  schedule: 'Schedule',
  delay: 'Delay',
  notification: 'Notification',
  http: 'HTTP Request'
};

export const NodeTypeColors: Record<NodeType, { bg: string; icon: string; border: string }> = {
  start: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
  end: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
  httpRequest: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  email: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  whatsapp: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
  transform: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  filter: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200' },
  database: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
  condition: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
  webhook: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' },
  schedule: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  delay: { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-200' },
  notification: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' },
  http: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// ✅ Check if node has multiple outputs (like condition node)
export const hasMultipleOutputs = (nodeType: string): boolean => {
  return nodeType === 'condition' || nodeType === 'conditionNode';
};

// ✅ Get node outputs for condition nodes
export const getNodeOutputs = (nodeType: string): { id: string; label: string; color: string }[] => {
  if (nodeType === 'condition' || nodeType === 'conditionNode') {
    return [
      { id: 'true', label: 'True', color: '#22c55e' },
      { id: 'false', label: 'False', color: '#ef4444' }
    ];
  }
  return [{ id: 'default', label: 'Default', color: '#3b82f6' }];
};

// ✅ Check if node supports input mapping
export const supportsInputMapping = (nodeType: string): boolean => {
  const supportedTypes = ['email', 'whatsapp', 'http', 'httpRequest', 'transform', 'filter', 'database', 'condition', 'webhook', 'notification'];
  return supportedTypes.includes(nodeType);
};

// ✅ Get default configuration for a node type
export const getDefaultConfig = (nodeType: string): Record<string, any> => {
  switch (nodeType) {
    case 'condition':
      return { field: '', operator: 'equals', value: '', caseSensitive: false };
    case 'email':
      return { to: '', subject: '', body: '' };
    case 'whatsapp':
      return { phone: '', message: '' };
    case 'http':
    case 'httpRequest':
      return { url: '', method: 'GET', headers: {} };
    case 'transform':
      return { fieldMappings: {} };
    case 'filter':
      return { field: '', operator: 'contains', value: '' };
    default:
      return {};
  }
};

// ✅ Get condition operator options
export const getConditionOperators = (): { value: ConditionOperator; label: string }[] => {
  return CONDITION_OPERATORS;
};