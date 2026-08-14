import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Trash2, AlertCircle,
  RefreshCw, Calendar, Clock, Layers
} from 'lucide-react';
import { workflowApi } from '../api/workflowApi';
import type { Workflow } from '../types/workflow';
import { useToast } from '../hooks/useToast';

function ScheduleWorkflowModal({ 
  isOpen, 
  onClose, 
  workflow, 
  onSchedule 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  workflow: Workflow | null; 
  onSchedule: (data: any) => Promise<void>;
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
      setScheduledDateTime(tomorrow.toISOString().slice(0, 16));
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
        scheduledDateTime: new Date(scheduledDateTime).toISOString(),
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
          <h2 className="text-xl font-semibold text-gray-900">Schedule Workflow</h2>
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
            Scheduling: <span className="font-medium">{workflow.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule
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

export default function WorkflowList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getAll();
      
      const scheduledData = await workflowApi.getScheduled();
      const scheduledList = scheduledData?.data || [];
      
      const workflowsWithSchedule = data.map((workflow: Workflow) => {
        const scheduledInfo = scheduledList.find((s: any) => s.id === workflow.id);
        return {
          ...workflow,
          isScheduled: !!scheduledInfo,
          nextRunTime: scheduledInfo?.nextRunTime || null,
          recurrenceType: scheduledInfo?.recurrenceType || workflow.recurrenceType || 'once',
          scheduledDateTime: scheduledInfo?.scheduledDateTime || workflow.scheduledDateTime || null
        };
      });
      
      setWorkflows(workflowsWithSchedule);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load workflows';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowStats = (workflow: Workflow) => {
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
          // Invalid JSON, return defaults
        }
      }
    } catch {
      // Error parsing, return defaults
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
      setWorkflows(prev => prev.filter(w => w.id !== id));
      showToast('success', 'Workflow deleted successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete workflow');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSchedule = async (scheduleData: any) => {
    try {
      await workflowApi.schedule(scheduleData);
      showToast('success', `Workflow "${selectedWorkflow?.name}" scheduled successfully`);
      setShowScheduleModal(false);
      setSelectedWorkflow(null);
      await loadWorkflows();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to schedule workflow');
    }
  };

  // Cancel Schedule - Updated with loading state
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
        await loadWorkflows(); // Refresh the list
      } else {
        showToast('error', response.message || 'Failed to cancel schedule');
      }
    } catch (error: any) {
      console.error('Error cancelling schedule:', error);
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isWorkflowScheduled = (workflow: Workflow) => {
    return workflow.isScheduled === true;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScheduleWorkflowModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedWorkflow(null);
        }}
        workflow={selectedWorkflow}
        onSchedule={handleSchedule}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your automated workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadWorkflows}
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">Error loading workflows</h4>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={loadWorkflows}
              className="mt-2 text-sm text-red-700 font-medium hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading && workflows.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => {
          const { nodeCount, edgeCount } = getWorkflowStats(workflow);
          const isScheduled = isWorkflowScheduled(workflow);
          const isCancelling = cancellingId === workflow.id;
          
          return (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg shadow-sm border transition-all cursor-pointer group relative ${
                isScheduled
                  ? 'border-purple-300 shadow-md shadow-purple-100'
                  : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={() => navigate(`/workflows/${workflow.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                    {workflow.name || 'Unnamed Workflow'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkflow(workflow);
                        setShowScheduleModal(true);
                      }}
                      disabled={!workflow.id}
                      className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Schedule workflow"
                    >
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workflow.id, e);
                      }}
                      disabled={deletingId === workflow.id || !workflow.id}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete workflow"
                    >
                      {deletingId === workflow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {workflow.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {workflow.description}
                  </p>
                )}

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

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status || 'draft'}
                    </span>
                    
                    {isScheduled && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Scheduled
                      </span>
                    )}
                  </div>
                  
                  {isScheduled && workflow.nextRunTime && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-600">
                        Next: {new Date(workflow.nextRunTime).toLocaleString()}
                      </span>
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
                          'Cancel'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
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