import axios from 'axios';

const API_BASE_URL = '/api'; 

export interface WorkflowData {
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  jsonData: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  data?: WorkflowData;
  isScheduled?: boolean;
  scheduledDateTime?: string;
  recurrenceType?: string;
  nextRunTime?: string;
  lastRunTime?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: number;
  status: string;
  progress: number;
  currentNodeId?: string;
  error?: string;
  inputData?: string;
  outputData?: string;
  triggeredBy: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

// Updated simplified status response
export interface WorkflowStatusResponse {
  success: boolean;
  status: string;
  progress: number;
  executionId?: string | null;
  isComplete: boolean;
  error?: string | null;
  endTime?: string | null;
  // For backward compatibility
  data?: {
    success: boolean;
    status: string;
    progress: number;
    executionId?: string;
    isComplete: boolean;
    error?: string;
    endTime?: string;
  };
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

export interface ExecuteWorkflowRequest {
  inputData?: Record<string, any>;
  runAsync?: boolean;
}

export interface WorkflowExecutionResult {
  executionId?: string;
  status?: string;
  url?: string;
  message?: string;
  success?: boolean;
  data?: {
    status: string;
    progress: number;
    executionId: string;
    startTime: string;
  };
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ExecutionLogResponse {
  level: string;
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

export interface NodeExecutionDetail {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: string;
  progress: number;
  input?: any;
  output?: any;
  error?: string;
  retryCount?: number;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowExecutionDetailResponse {
  executionId?: string;
  workflowId?: number;
  workflowName?: string;
  status?: string;
  progress?: number;
  currentNode?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
  nodes?: NodeExecutionDetail[];
  logs?: ExecutionLogResponse[];
}

export interface CreateWorkflowRequest {
  name: string;
  jsonData: string;
  description?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  jsonData?: string;
  description?: string;
  status?: string;
}

export interface PauseExecutionResult {
  executionId: string;
  status: string;
  message: string;
  pausedAt: string;
}

export interface ResumeExecutionResult {
  executionId: string;
  status: string;
  message: string;
  resumedAt: string;
}

export interface CancelExecutionResult {
  executionId: string;
  status: string;
  message: string;
  cancelledAt: string;
}

export interface CleanupExecutionResult {
  message: string;
}

export interface ScheduleWorkflowRequest {
  workflowId: number;
  scheduledDateTime: string;
  recurrenceType: string;
  cronExpression?: string;
}

export interface ScheduleWorkflowResponse {
  success: boolean;
  data?: {
    scheduleId: number;
    workflowId: number;
    workflowName: string;
    scheduledDateTime: string;
    recurrenceType: string;
    nextRunTime: string;
    status: string;
  };
  message?: string;
}

export interface ScheduledWorkflow {
  id: number;
  name: string;
  scheduledDateTime: string;
  recurrenceType: string;
  nextRunTime: string;
  isScheduled: boolean;
}

export interface ScheduledWorkflowsResponse {
  success: boolean;
  data: ScheduledWorkflow[];
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`Error ${error.response?.status || 'Network'} ${error.config?.url}`);
    console.error('Details:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const workflowApi = {
  // ============ WORKFLOW CRUD ============
  
  getAll: async (): Promise<Workflow[]> => {
    try {
      const response = await apiClient.get('/Workflow');
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Workflow> => {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error(`Invalid workflow ID: ${id}`);
    }

    try {
      const response = await apiClient.get(`/Workflow/${id}`);
      console.log('API Response for workflow', id, ':', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  },

  create: async (data: CreateWorkflowRequest): Promise<Workflow> => {
    try {
      console.log('Creating workflow with data:', data);
      const response = await apiClient.post('/Workflow', data);
      console.log('Workflow created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  },

  update: async (id: number, data: UpdateWorkflowRequest): Promise<Workflow> => {
    try {
      const response = await apiClient.put(`/Workflow/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/Workflow/${id}`);
    } catch (error: any) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  },

  // ============ WORKFLOW EXECUTION ============

  execute: async (id: number, payload: ExecuteWorkflowRequest): Promise<WorkflowExecutionResult> => {
    try {
      console.log(`Executing workflow ${id} with payload:`, payload);
      const response = await apiClient.post(`/Workflow/${id}/execute`, payload);
      console.log('Execution response:', response.data);
      
      // Handle wrapped response
      if (response.data && response.data.success && response.data.data) {
        return {
          executionId: response.data.data?.executionId,
          status: response.data.data?.status,
          message: response.data.message
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error executing workflow ${id}:`, error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  },

  // ============ GET STATUS - SIMPLIFIED ============
  getStatus: async (id: number): Promise<WorkflowStatusResponse> => {
    try {
      const response = await apiClient.get(`/Workflow/${id}/status`);
      console.log('Status response:', response.data);
      
      // The new API returns: { success: true/false, status: "...", progress: ..., executionId: ..., isComplete: ... }
      // If wrapped in data, extract it
      let statusData = response.data;
      
      // Handle both old and new formats
      if (response.data && response.data.data) {
        // Old format with data wrapper
        statusData = response.data.data;
      }
      
      // Ensure we have all required fields
      return {
        success: statusData.success === true,
        status: statusData.status || 'idle',
        progress: statusData.progress || 0,
        executionId: statusData.executionId || null,
        isComplete: statusData.isComplete || false,
        error: statusData.error || null,
        endTime: statusData.endTime || null
      };
      
    } catch (error: any) {
      console.error(`Error getting status for workflow ${id}:`, error);
      throw error;
    }
  },

  getExecutions: async (id: number, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<WorkflowExecution>> => {
    try {
      const response = await apiClient.get(`/Workflow/${id}/executions`, {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error getting executions for workflow ${id}:`, error);
      throw error;
    }
  },

  getExecutionDetails: async (executionId: string): Promise<WorkflowExecutionDetailResponse> => {
    try {
      const response = await apiClient.get(`/Workflow/executions/${executionId}`);
      console.log('Execution details response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error getting execution details ${executionId}:`, error);
      throw error;
    }
  },

  deleteExecution: async (executionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/Workflow/executions/${executionId}`);
    } catch (error: any) {
      console.error(`Error deleting execution ${executionId}:`, error);
      throw error;
    }
  },

  // ============ LOGS AND NODE STATUS ============

  getExecutionLogs: async (id: number, filter?: LogFilter): Promise<ExecutionLogResponse[]> => {
    try {
      const response = await apiClient.get(`/Workflow/${id}/logs`, {
        params: filter
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error getting logs for workflow ${id}:`, error);
      throw error;
    }
  },

  getNodeStatus: async (id: number, nodeId: string): Promise<NodeExecutionDetail> => {
    try {
      const response = await apiClient.get(`/Workflow/${id}/nodes/${nodeId}/status`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting node status for workflow ${id}, node ${nodeId}:`, error);
      throw error;
    }
  },

  // ============ EXECUTION CONTROL ============

  pauseExecution: async (id: number): Promise<PauseExecutionResult> => {
    try {
      const response = await apiClient.post(`/Workflow/${id}/pause`);
      return response.data;
    } catch (error: any) {
      console.error(`Error pausing execution for workflow ${id}:`, error);
      throw error;
    }
  },

  resumeExecution: async (id: number): Promise<ResumeExecutionResult> => {
    try {
      const response = await apiClient.post(`/Workflow/${id}/resume`);
      return response.data;
    } catch (error: any) {
      console.error(`Error resuming execution for workflow ${id}:`, error);
      throw error;
    }
  },

  cancelExecution: async (id: number): Promise<CancelExecutionResult> => {
    try {
      const response = await apiClient.post(`/Workflow/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error(`Error cancelling execution for workflow ${id}:`, error);
      throw error;
    }
  },

  // ============ SCHEDULING ============

  schedule: async (data: ScheduleWorkflowRequest): Promise<ScheduleWorkflowResponse> => {
    try {
      console.log('Scheduling workflow:', data);
      const response = await apiClient.post('/Workflow/schedule', data);
      console.log('Schedule response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error scheduling workflow:', error);
      throw error;
    }
  },

  getScheduled: async (): Promise<ScheduledWorkflowsResponse> => {
    try {
      const response = await apiClient.get('/Workflow/scheduled');
      return response.data;
    } catch (error: any) {
      console.error('Error getting scheduled workflows:', error);
      throw error;
    }
  },

  cancelSchedule: async (workflowId: number): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`Cancelling schedule for workflow ${workflowId}`);
      const response = await apiClient.delete(`/Workflow/schedule/${workflowId}`);
      console.log('Cancel schedule response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error cancelling schedule for workflow ${workflowId}:`, error);
      throw error;
    }
  },

  // ============ CLEANUP ============

  cleanupExecution: async (id: number): Promise<CleanupExecutionResult> => {
    try {
      const response = await apiClient.post(`/Workflow/${id}/cleanup`);
      return response.data;
    } catch (error: any) {
      console.error(`Error cleaning up execution for workflow ${id}:`, error);
      throw error;
    }
  },

  cleanupDatabase: async (id: number): Promise<CleanupExecutionResult> => {
    try {
      const response = await apiClient.post(`/Workflow/${id}/cleanup-db`);
      return response.data;
    } catch (error: any) {
      console.error(`Error cleaning up database for workflow ${id}:`, error);
      throw error;
    }
  },

  // ============ HEALTH CHECK ============

  healthCheck: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // ============ POLLING HELPER ============

  pollStatus: async (
    id: number, 
    onStatusUpdate: (status: WorkflowStatusResponse) => void,
    onComplete: (status: WorkflowStatusResponse) => void,
    onError: (error: any) => void,
    interval: number = 2000,
    maxAttempts: number = 60
  ): Promise<() => void> => {
    let attempts = 0;
    let isPolling = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!isPolling) return;
      
      attempts++;
      
      try {
        const status = await workflowApi.getStatus(id);
        
        // Extract status data
        const currentStatus = status.status;
        const progress = status.progress || 0;
        const isSuccess = status.success === true;
        const isComplete = status.isComplete === true;
        
        console.log(`Poll ${attempts}: Status = ${currentStatus}, Progress = ${progress}%, Success = ${isSuccess}, Complete = ${isComplete}`);
        
        onStatusUpdate(status);
        
        // Check if execution is complete or successful
        if (isSuccess || isComplete || 
            currentStatus === 'idle' || currentStatus === 'completed' || 
            currentStatus === 'failed' || currentStatus === 'cancelled') {
          isPolling = false;
          onComplete(status);
          return;
        }
        
        if (attempts >= maxAttempts) {
          isPolling = false;
          onError(new Error(`Polling timeout after ${maxAttempts} attempts`));
          return;
        }
        
        timeoutId = setTimeout(poll, interval);
        
      } catch (error) {
        console.error('Polling error:', error);
        isPolling = false;
        onError(error);
      }
    };

    poll();

    return () => {
      isPolling = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  },

  // ============ HELPER FUNCTIONS ============
  
  isExecutionComplete: (status: string): boolean => {
    const completedStatuses = ['idle', 'completed', 'success', 'failed', 'cancelled', 'done'];
    return completedStatuses.includes(status?.toLowerCase() || '');
  },

  isExecutionSuccessful: (status: string): boolean => {
    return status?.toLowerCase() === 'completed' || status?.toLowerCase() === 'success';
  },

  getNodeStatusSummary: (nodes: WorkflowStatusNode[]): { completed: number; pending: number; failed: number; running: number } => {
    const summary = { completed: 0, pending: 0, failed: 0, running: 0 };
    
    if (!nodes) return summary;
    
    nodes.forEach(node => {
      const status = node.status?.toLowerCase() || '';
      if (status === 'completed' || status === 'success') {
        summary.completed++;
      } else if (status === 'pending' || status === 'waiting') {
        summary.pending++;
      } else if (status === 'failed' || status === 'error') {
        summary.failed++;
      } else if (status === 'running' || status === 'in-progress') {
        summary.running++;
      }
    });
    
    return summary;
  },

  calculateProgress: (nodes: WorkflowStatusNode[]): number => {
    if (!nodes || nodes.length === 0) return 0;
    const completed = nodes.filter(n => n.status === 'completed' || n.status === 'success').length;
    return Math.round((completed / nodes.length) * 100);
  },


      // 1. Individual Node Execute
    
      executeNode: async (id: number, nodeId: string): Promise<WorkflowExecutionResult> => {
        try {
          console.log(`Executing node ${nodeId} in workflow ${id}`);
          const response = await apiClient.post(`/Workflow/${id}/nodes/${nodeId}/execute`);
          console.log('Node execution response:', response.data);
          
          if (response.data && response.data.success) {
            return {
              executionId: response.data.data?.executionId || response.data.executionId || null,
              status: response.data.data?.status || response.data.status || 'completed',
              message: response.data.message,
              outputData: response.data.data?.outputData || response.data.outputData || null
            };
          }
          
          return response.data;
        } catch (error: any) {
          console.error(`Error executing node ${nodeId} in workflow ${id}:`, error);
          throw error;
        }
      },

      // 2. Individual Execution Cancel
      cancelNodeExecution: async (executionId: string): Promise<CancelExecutionResult> => {
        try {
          console.log(`Cancelling execution ${executionId}`);
          const response = await apiClient.delete(`/Workflow/executions/${executionId}`);
          console.log('Cancel execution response:', response.data);
          return response.data;
        } catch (error: any) {
          console.error(`Error cancelling execution ${executionId}:`, error);
          throw error;
        }
      },
};

export default workflowApi;