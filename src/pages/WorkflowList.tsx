// WorkflowList.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Trash2, AlertCircle,
  RefreshCw, Calendar, Clock, Layers, History,
  CheckCircle, XCircle, PlayCircle, PauseCircle,
  Timer, Calendar as CalendarIcon
} from 'lucide-react';
import { workflowApi } from '../api/workflowApi';
import type { Workflow } from '../types/workflow';
import { useToast } from '../hooks/useToast';

// ============= HELPER FUNCTIONS =============

// Simple formatter for IST times (backend sends IST directly)
const formatISTTime = (dateString?: string | null) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const now = new Date();
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const compareDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const isToday = compareDate.getDate() === nowIST.getDate() &&
                    compareDate.getMonth() === nowIST.getMonth() &&
                    compareDate.getFullYear() === nowIST.getFullYear();
    
    const isYesterday = compareDate.getDate() === nowIST.getDate() - 1 &&
                        compareDate.getMonth() === nowIST.getMonth() &&
                        compareDate.getFullYear() === nowIST.getFullYear();
    
    const timeStr = compareDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    } else {
      return compareDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch {
    return null;
  }
};

// Use this for all date displays
const formatDate = formatISTTime;

// ============= STATUS TYPE =============

type WorkflowExecutionStatus = 
  | 'idle'
  | 'scheduled'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ============= PERMANENT STORAGE =============

const STORAGE_KEY = 'workflow_permanent_status';

interface PermanentStatus {
  status: WorkflowExecutionStatus;
  lastExecutionTime?: string;
  executionCount?: number;
  updatedAt: string;
}

const savePermanentStatus = (workflowId: number, data: Partial<PermanentStatus>) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const statuses: Record<number, PermanentStatus> = stored ? JSON.parse(stored) : {};
    
    if (!statuses[workflowId]) {
      statuses[workflowId] = {
        status: 'idle',
        updatedAt: new Date().toISOString()
      };
    }
    
    statuses[workflowId] = {
      ...statuses[workflowId],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (e) {
    // Silent fail
  }
};

const getPermanentStatus = (workflowId: number): PermanentStatus | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const statuses: Record<number, PermanentStatus> = JSON.parse(stored);
    return statuses[workflowId] || null;
  } catch (e) {
    return null;
  }
};

const clearPermanentStatus = (workflowId: number) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const statuses: Record<number, PermanentStatus> = JSON.parse(stored);
    delete statuses[workflowId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (e) {}
};

// ============= STATUS BADGE COMPONENT =============

const StatusBadge: React.FC<{ status: WorkflowExecutionStatus }> = ({ status }) => {
  const configs: Record<WorkflowExecutionStatus, { icon: React.ReactNode; label: string; className: string }> = {
    idle: {
      icon: <PauseCircle className="w-3 h-3" />,
      label: 'Idle',
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    },
    scheduled: {
      icon: <CalendarIcon className="w-3 h-3" />,
      label: 'Scheduled',
      className: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    pending: {
      icon: <Timer className="w-3 h-3 animate-pulse" />,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    running: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: 'Running',
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    completed: {
      icon: <CheckCircle className="w-3 h-3" />,
      label: 'Completed',
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    failed: {
      icon: <XCircle className="w-3 h-3" />,
      label: 'Failed',
      className: 'bg-red-100 text-red-700 border-red-200'
    },
    cancelled: {
      icon: <XCircle className="w-3 h-3" />,
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  };

  const config = configs[status] || configs.idle;

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============= SCHEDULE MODAL =============

function ScheduleWorkflowModal({ 
  isOpen, 
  onClose, 
  workflow, 
  onSchedule,
  isReschedule = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  workflow: any | null; 
  onSchedule: (data: any) => Promise<void>;
  isReschedule?: boolean;
}) {
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('once');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const hours = String(tomorrow.getHours()).padStart(2, '0');
      const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
      setScheduledDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      
      setRecurrenceType('once');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!scheduledDateTime) {
        setError('Please select date and time');
        setLoading(false);
        return;
      }

      const scheduleData = {
        workflowId: workflow?.id,
        scheduledDateTime: scheduledDateTime,
        recurrenceType: recurrenceType,
      };

      await onSchedule(scheduleData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule workflow');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isReschedule ? 'Reschedule Workflow' : 'Schedule Workflow'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {isReschedule ? 'Rescheduling:' : 'Scheduling:'} <span className="font-medium">{workflow.name}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Time is in Indian Standard Time (IST)</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time (IST)
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence
              </label>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isReschedule ? 'Rescheduling...' : 'Scheduling...'}
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" />
                    {isReschedule ? 'Reschedule' : 'Schedule'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============= MAIN COMPONENT =============

export default function WorkflowList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [isReschedule, setIsReschedule] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const pollingIntervals = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    isMountedRef.current = true;
    loadWorkflows();
    
    refreshIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        loadWorkflows(true);
      }
    }, 10000);
    
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, []);

  const startPollingForWorkflow = useCallback((workflowId: number) => {
    if (pollingIntervals.current[workflowId]) {
      clearInterval(pollingIntervals.current[workflowId]);
    }

    pollingIntervals.current[workflowId] = setInterval(async () => {
      try {
        const statusResponse = await workflowApi.getStatus(workflowId);
        
        const statusData = statusResponse.data || statusResponse;
        const currentStatus = statusData.status || statusResponse.status;
        const hasSuccess = statusResponse.success === true || statusData.success === true;
        
        setWorkflows(prev => prev.map(w => {
          if (w.id === workflowId) {
            let newStatus: WorkflowExecutionStatus = 'idle';
            
            if (hasSuccess || currentStatus === 'completed') {
              newStatus = 'completed';
              savePermanentStatus(workflowId, {
                status: 'completed',
                lastExecutionTime: statusData.endTime || new Date().toISOString()
              });
              if (pollingIntervals.current[workflowId]) {
                clearInterval(pollingIntervals.current[workflowId]);
                delete pollingIntervals.current[workflowId];
              }
            } else if (currentStatus === 'running') {
              newStatus = 'running';
            } else if (currentStatus === 'pending') {
              newStatus = 'pending';
            } else if (currentStatus === 'failed') {
              newStatus = 'failed';
              savePermanentStatus(workflowId, {
                status: 'failed',
                lastExecutionTime: statusData.endTime || new Date().toISOString()
              });
              if (pollingIntervals.current[workflowId]) {
                clearInterval(pollingIntervals.current[workflowId]);
                delete pollingIntervals.current[workflowId];
              }
            } else if (currentStatus === 'cancelled') {
              newStatus = 'cancelled';
              if (pollingIntervals.current[workflowId]) {
                clearInterval(pollingIntervals.current[workflowId]);
                delete pollingIntervals.current[workflowId];
              }
            } else {
              newStatus = 'idle';
            }
            
            return {
              ...w,
              executionStatus: newStatus,
              lastExecutionTime: statusData.endTime || w.lastExecutionTime
            };
          }
          return w;
        }));
      } catch (error) {
        // Silent fail for polling errors
      }
    }, 3000);
  }, []);

  const loadWorkflows = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const data = await workflowApi.getAll();
      
      const scheduledData = await workflowApi.getScheduled();
      const scheduledList = scheduledData?.data || [];
      
      const workflowsWithStatus = await Promise.all(
        data.map(async (workflow: any) => {
          let executionStatus: WorkflowExecutionStatus = 'idle';
          let lastExecutionTime = null;
          let isScheduled = false;
          
          const scheduledInfo = scheduledList.find((s: any) => s.workflowId === workflow.id || s.id === workflow.id);
          if (scheduledInfo && !scheduledInfo.cancelled) {
            isScheduled = true;
          }
          
          const permanentStatus = getPermanentStatus(workflow.id);
          if (permanentStatus && permanentStatus.status !== 'idle') {
            executionStatus = permanentStatus.status;
            lastExecutionTime = permanentStatus.lastExecutionTime || null;
          } else {
            try {
              const statusResponse = await workflowApi.getStatus(workflow.id);
              const statusData = statusResponse.data || statusResponse;
              const currentStatus = statusData.status || statusResponse.status;
              const hasSuccess = statusResponse.success === true || statusData.success === true;
              
              if (hasSuccess || currentStatus === 'completed') {
                executionStatus = 'completed';
                lastExecutionTime = statusData.endTime || null;
                savePermanentStatus(workflow.id, {
                  status: 'completed',
                  lastExecutionTime: lastExecutionTime || new Date().toISOString()
                });
              } else if (currentStatus === 'running') {
                executionStatus = 'running';
                startPollingForWorkflow(workflow.id);
              } else if (currentStatus === 'pending') {
                executionStatus = 'pending';
              } else if (currentStatus === 'failed') {
                executionStatus = 'failed';
                savePermanentStatus(workflow.id, {
                  status: 'failed',
                  lastExecutionTime: statusData.endTime || new Date().toISOString()
                });
              } else if (currentStatus === 'cancelled') {
                executionStatus = 'cancelled';
              }
            } catch (e) {
              // Silent fail
            }
          }
          
          if (isScheduled && executionStatus === 'idle') {
            const scheduledTime = new Date(scheduledInfo.scheduledDateTime);
            const now = new Date();
            executionStatus = scheduledTime <= now ? 'pending' : 'scheduled';
          }
          
          return {
            ...workflow,
            executionStatus,
            lastExecutionTime,
            isScheduled,
            scheduledDateTime: scheduledInfo?.scheduledDateTime || null,
            recurrenceType: scheduledInfo?.recurrenceType || 'once',
          };
        })
      );
      
      if (isMountedRef.current) {
        setWorkflows(workflowsWithStatus);
      }
    } catch (error: any) {
      if (!silent) {
        const errorMessage = error.message || 'Failed to load workflows';
        setError(errorMessage);
        showToast('error', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        if (!silent) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    }
  };

  const getWorkflowStats = (workflow: any) => {
    let nodeCount = 0;
    let edgeCount = 0;
    
    try {
      if (workflow.data) {
        if (workflow.data.nodes && Array.isArray(workflow.data.nodes)) {
          nodeCount = workflow.data.nodes.length;
        }
        if (workflow.data.edges && Array.isArray(workflow.data.edges)) {
          edgeCount = workflow.data.edges.length;
        }
      } else if (workflow.jsonData) {
        try {
          const parsed = JSON.parse(workflow.jsonData);
          if (parsed.nodes && Array.isArray(parsed.nodes)) {
            nodeCount = parsed.nodes.length;
          }
          if (parsed.edges && Array.isArray(parsed.edges)) {
            edgeCount = parsed.edges.length;
          }
        } catch {
          // Invalid JSON
        }
      }
    } catch {
      // Error parsing
    }
    
    return { nodeCount, edgeCount };
  };

  const handleDelete = async (id: number | undefined, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!id) {
      showToast('error', 'Invalid workflow ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    
    try {
      await workflowApi.delete(id);
      clearPermanentStatus(id);
      if (pollingIntervals.current[id]) {
        clearInterval(pollingIntervals.current[id]);
        delete pollingIntervals.current[id];
      }
      setWorkflows(prev => prev.filter(w => w.id !== id));
      showToast('success', 'Workflow deleted successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete workflow');
    } finally {
      setDeletingId(null);
    }
  };

  const openScheduleModal = (workflow: any, reschedule: boolean = false) => {
    setSelectedWorkflow(workflow);
    setIsReschedule(reschedule);
    setShowScheduleModal(true);
  };

  const handleSchedule = async (scheduleData: any) => {
    try {
      // If rescheduling, first cancel existing schedule
      if (isReschedule && selectedWorkflow?.id) {
        try {
          await workflowApi.cancelSchedule(selectedWorkflow.id);
        } catch (e) {
          // If no schedule exists, continue
        }
      }
      
      await workflowApi.schedule(scheduleData);
      showToast('success', `Workflow "${selectedWorkflow?.name}" ${isReschedule ? 'rescheduled' : 'scheduled'} successfully`);
      setShowScheduleModal(false);
      setSelectedWorkflow(null);
      setIsReschedule(false);
      await loadWorkflows(false);
    } catch (error: any) {
      throw new Error(error.message || `Failed to ${isReschedule ? 'reschedule' : 'schedule'} workflow`);
    }
  };

  const handleCancelSchedule = async (workflowId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!workflowId) {
      showToast('error', 'Invalid workflow ID');
      return;
    }

    if (!confirm('Are you sure you want to cancel this schedule?')) {
      return;
    }

    setCancellingId(workflowId);
    
    try {
      const response = await workflowApi.cancelSchedule(workflowId);
      
      if (response.success) {
        showToast('success', 'Schedule cancelled successfully');
        await loadWorkflows(false);
      } else {
        showToast('error', response.message || 'Failed to cancel schedule');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel schedule';
      showToast('error', errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'archived': return 'Archived';
      default: return 'Ready';
    }
  };

  const getCardBorder = (workflow: any) => {
    if (workflow.executionStatus === 'completed') return 'border-green-300 shadow-green-100';
    if (workflow.executionStatus === 'failed') return 'border-red-300 shadow-red-100';
    if (workflow.executionStatus === 'running') return 'border-blue-300 shadow-blue-100';
    if (workflow.executionStatus === 'scheduled' || workflow.executionStatus === 'pending') 
      return 'border-purple-300 shadow-purple-100';
    if (workflow.executionStatus === 'cancelled') return 'border-gray-300 shadow-gray-100';
    return 'border-gray-200 hover:shadow-md';
  };

  const hasPendingWorkflows = workflows.some(w => w.executionStatus === 'pending');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScheduleWorkflowModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedWorkflow(null);
          setIsReschedule(false);
        }}
        workflow={selectedWorkflow}
        onSchedule={handleSchedule}
        isReschedule={isReschedule}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your automated workflows</p>
        </div>
        <div className="flex items-center gap-3">
          {isRefreshing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </span>
          )}
          {hasPendingWorkflows && (
            <span className="text-xs text-yellow-600 flex items-center gap-1 animate-pulse">
              <Timer className="w-3 h-3" />
              Pending workflows...
            </span>
          )}
          <button
            onClick={() => loadWorkflows(false)}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/workflows/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">Error loading workflows</h4>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => loadWorkflows(false)}
              className="mt-2 text-sm text-red-700 font-medium hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && workflows.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => {
          const { nodeCount, edgeCount } = getWorkflowStats(workflow);
          const isDeleting = deletingId === workflow.id;
          const isCancelling = cancellingId === workflow.id;
          const isScheduled = workflow.isScheduled === true;
          const hasExecution = !!workflow.lastExecutionTime;
          const isCompleted = workflow.executionStatus === 'completed';
          const isFailed = workflow.executionStatus === 'failed';

          return (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg shadow-sm border transition-all cursor-pointer group ${getCardBorder(workflow)}`}
              onClick={() => navigate(`/workflows/${workflow.id}`)}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                    {workflow.name || 'Unnamed Workflow'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openScheduleModal(workflow, isScheduled || isCompleted || isFailed);
                      }}
                      className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors opacity-70 hover:opacity-100"
                      title={isScheduled ? 'Reschedule workflow' : 'Schedule workflow'}
                    >
                      <CalendarIcon className={`w-4 h-4 ${isScheduled ? 'text-purple-600' : 'text-gray-400'}`} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(workflow.id, e)}
                      disabled={isDeleting || !workflow.id}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete workflow"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {workflow.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {nodeCount} node{nodeCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(workflow.status)}`}>
                    {getStatusLabel(workflow.status)}
                  </span>

                  <StatusBadge status={workflow.executionStatus || 'idle'} />

                  {isScheduled && workflow.executionStatus !== 'completed' && workflow.executionStatus !== 'failed' && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      Scheduled
                    </span>
                  )}

                 
                  {(isFailed || workflow.executionStatus === 'failed') && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Execution Failed
                    </span>
                  )}
                </div>

                {/* Schedule Info - Display IST directly from backend */}
                {isScheduled && workflow.scheduledDateTime && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-gray-600">Scheduled:</span>
                      <span className="font-medium text-gray-800 truncate">
                        {formatISTTime(workflow.scheduledDateTime)}
                      </span>
                      <span className="text-xs text-purple-600 flex-shrink-0">IST</span>
                    </div>
                    
                    {(isCompleted || workflow.executionStatus === 'completed') && workflow.lastExecutionTime && (
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-600">Executed:</span>
                        <span className="font-medium text-gray-800 truncate">
                          {formatISTTime(workflow.lastExecutionTime)}
                        </span>
                        <span className="text-xs text-green-600 flex-shrink-0">IST</span>
                      </div>
                    )}

                    {(isFailed || workflow.executionStatus === 'failed') && workflow.lastExecutionTime && (
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span className="text-gray-600">Failed at:</span>
                        <span className="font-medium text-red-700 truncate">
                          {formatISTTime(workflow.lastExecutionTime)}
                        </span>
                        <span className="text-xs text-red-600 flex-shrink-0">IST</span>
                      </div>
                    )}

                    {workflow.executionStatus === 'pending' && (
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4 text-yellow-600 flex-shrink-0 animate-pulse" />
                        <span className="text-yellow-700 font-medium">Waiting to execute...</span>
                      </div>
                    )}

                    {workflow.recurrenceType && workflow.recurrenceType !== 'once' && (
                      <div className="mt-1 text-xs text-gray-500">
                        Recurrence: {workflow.recurrenceType}
                      </div>
                    )}

                    {/* Cancel Schedule Button */}
                    {workflow.executionStatus !== 'completed' && 
                     workflow.executionStatus !== 'failed' &&
                     workflow.executionStatus !== 'cancelled' && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => handleCancelSchedule(workflow.id!, e)}
                          disabled={isCancelling}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Cancel Schedule'
                          )}
                        </button>
                      </div>
                    )}

                    {/* Reschedule button for completed/failed workflows */}
                    {(isCompleted || isFailed || workflow.executionStatus === 'completed' || workflow.executionStatus === 'failed') && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openScheduleModal(workflow, true);
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Last Execution Info - For non-scheduled workflows */}
                {!isScheduled && hasExecution && 
                 (isCompleted || isFailed || workflow.executionStatus === 'completed' || workflow.executionStatus === 'failed') && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      {(isCompleted || workflow.executionStatus === 'completed') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-gray-600">
                        {(isCompleted || workflow.executionStatus === 'completed') ? 'Executed:' : 'Failed at:'}
                      </span>
                      <span className={`font-medium truncate ${
                        (isCompleted || workflow.executionStatus === 'completed') ? 'text-gray-800' : 'text-red-700'
                      }`}>
                        {formatISTTime(workflow.lastExecutionTime)}
                      </span>
                      <span className={`text-xs flex-shrink-0 ${
                        (isCompleted || workflow.executionStatus === 'completed') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        IST
                      </span>
                    </div>

                    {/* Reschedule button for completed/failed non-scheduled workflows */}
                    {(isCompleted || isFailed || workflow.executionStatus === 'completed' || workflow.executionStatus === 'failed') && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openScheduleModal(workflow, true);
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule button for idle workflows */}
                {!isScheduled && !hasExecution && workflow.executionStatus === 'idle' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openScheduleModal(workflow, false);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                    >
                      <CalendarIcon className="w-3 h-3" />
                      Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && !error && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CalendarIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No matching workflows found' : 'No workflows yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first workflow to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/workflows/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Workflow
            </button>
          )}
        </div>
      )}
    </div>
  );
}