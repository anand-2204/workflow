import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Trash2, Copy, Play, Edit, AlertCircle,
  CircleCheck, CircleX, CircleAlert, CircleDot, RefreshCw
} from 'lucide-react';
import { workflowApi } from '../api/workflowApi';
import type { Workflow } from '../types/workflow';
import { useToast } from '../hooks/useToast';

export default function WorkflowList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [executionStatuses, setExecutionStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    loadWorkflows();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(executionStatuses).length > 0) {
        checkExecutionStatuses();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [executionStatuses]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading workflows...');
      const data = await workflowApi.getAll();
      console.log('✅ Workflows loaded:', data);
      setWorkflows(data);
      await checkExecutionStatuses();
    } catch (error: any) {
      console.error('❌ Error loading workflows:', error);
      const errorMessage = error.message || 'Failed to load workflows';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkExecutionStatuses = async () => {
    try {
      for (const workflow of workflows) {
        if (workflow.id) {
          try {
            const status = await workflowApi.getStatus(workflow.id);
            if (status.status && status.status !== 'idle') {
              setExecutionStatuses(prev => ({
                ...prev,
                [workflow.id!]: status.status
              }));
            } else {
              setExecutionStatuses(prev => {
                const newStatuses = { ...prev };
                delete newStatuses[workflow.id!];
                return newStatuses;
              });
            }
          } catch (error) {
            // Ignore errors for individual status checks
          }
        }
      }
    } catch (error) {
      console.error('Error checking execution statuses:', error);
    }
  };

  // Helper function to get node and edge counts from workflow data
  const getWorkflowStats = (workflow: Workflow) => {
    let nodeCount = 0;
    let edgeCount = 0;
    
    try {
      // Check if data is in the 'data' field (API response format)
      if (workflow.data) {
        if (workflow.data.nodes && Array.isArray(workflow.data.nodes)) {
          nodeCount = workflow.data.nodes.length;
        }
        
        if (workflow.data.edges && Array.isArray(workflow.data.edges)) {
          edgeCount = workflow.data.edges.length;
        }
      }
      // Fallback to jsonData (legacy format)
      else if (workflow.jsonData) {
        try {
          const parsed = JSON.parse(workflow.jsonData);
          if (parsed.nodes && Array.isArray(parsed.nodes)) {
            nodeCount = parsed.nodes.length;
          }
          if (parsed.edges && Array.isArray(parsed.edges)) {
            edgeCount = parsed.edges.length;
          }
        } catch (parseError) {
          console.error(`Error parsing jsonData for workflow ${workflow.id}:`, parseError);
        }
      }
    } catch (e) {
      console.error(`❌ Error getting stats for workflow ${workflow.id}:`, e);
    }
    
    return { nodeCount, edgeCount };
  };

  const handleDelete = async (id: number | undefined, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!id) {
      console.error('❌ Cannot delete: ID is undefined or null');
      showToast('error', 'Invalid workflow ID');
      return;
    }

    if (!confirm(`Are you sure you want to delete this workflow? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    console.log(`🗑️ Attempting to delete workflow with ID: ${id}`);
    
    try {
      await workflowApi.delete(id);
      console.log(`✅ Workflow ${id} deleted successfully`);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      setExecutionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[id];
        return newStatuses;
      });
      showToast('success', 'Workflow deleted successfully');
    } catch (error: any) {
      console.error(`❌ Error deleting workflow ${id}:`, error);
      showToast('error', error.message || 'Failed to delete workflow');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (workflow: Workflow, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!workflow) {
      showToast('error', 'Invalid workflow data');
      return;
    }

    if (!workflow.id) {
      console.error('❌ Cannot duplicate: Workflow ID is missing', workflow);
      showToast('error', 'Cannot duplicate: Workflow ID is missing');
      return;
    }

    const hasData = workflow.data || workflow.jsonData;
    if (!hasData) {
      console.error('❌ Cannot duplicate: No workflow data found', workflow);
      showToast('error', 'Cannot duplicate: Workflow data is missing');
      return;
    }

    setDuplicatingId(workflow.id);
    console.log(`📋 Duplicating workflow: ${workflow.name} (ID: ${workflow.id})`);

    try {
      let jsonDataToUse = workflow.jsonData;
      
      // If data is in 'data' field, convert it to jsonData
      if (workflow.data && !workflow.jsonData) {
        jsonDataToUse = JSON.stringify(workflow.data);
        console.log('📊 Converted data to jsonData for duplication');
      }

      const newWorkflow = {
        name: `${workflow.name} (Copy)`,
        jsonData: jsonDataToUse || '{"nodes":[],"edges":[]}',
        description: workflow.description || '',
        status: 'draft',
      };
      
      console.log('📡 Sending duplicate request:', newWorkflow);
      
      const created = await workflowApi.create(newWorkflow);
      console.log('✅ Workflow duplicated successfully:', created);
      
      setWorkflows(prev => [created, ...prev]);
      showToast('success', `Workflow "${created.name}" created successfully`);
      
    } catch (error: any) {
      console.error('❌ Error duplicating workflow:', error);
      
      let errorMessage = 'Failed to duplicate workflow';
      if (error.response) {
        console.error('Response data:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast('error', errorMessage);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExecute = async (workflow: Workflow, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!workflow?.id) {
      showToast('error', 'Invalid workflow');
      return;
    }

    setExecutingId(workflow.id);
    console.log(`▶️ Executing workflow: ${workflow.name} (ID: ${workflow.id})`);

    try {
      let nodes = [];
      let edges = [];
      
      try {
        if (workflow.data) {
          nodes = workflow.data.nodes || [];
          edges = workflow.data.edges || [];
          console.log(`📊 Using 'data' field - Nodes: ${nodes.length}, Edges: ${edges.length}`);
        } else if (workflow.jsonData) {
          const parsed = JSON.parse(workflow.jsonData);
          nodes = parsed.nodes || [];
          edges = parsed.edges || [];
          console.log(`📊 Using jsonData - Nodes: ${nodes.length}, Edges: ${edges.length}`);
        }
      } catch (e) {
        console.warn('Could not parse workflow data:', e);
      }

      if (nodes.length === 0) {
        showToast('warning', 'No nodes to execute');
        setExecutingId(null);
        return;
      }

      const payload = {
        nodes: nodes.map((node: any) => ({
          ...node,
          data: { ...node.data, status: undefined, result: undefined, error: undefined }
        })),
        edges: edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const result = await workflowApi.execute(workflow.id, payload);
      console.log('✅ Workflow executed:', result);
      
      setExecutionStatuses(prev => ({
        ...prev,
        [workflow.id!]: 'running'
      }));

      showToast('success', `Workflow execution started: ${result.executionId}`);
      pollExecutionStatus(workflow.id);
      
    } catch (error: any) {
      console.error('❌ Error executing workflow:', error);
      let errorMessage = 'Failed to execute workflow';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast('error', errorMessage);
    } finally {
      setExecutingId(null);
    }
  };

  const pollExecutionStatus = async (workflowId: number) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await workflowApi.getStatus(workflowId);
        console.log(`📊 Workflow ${workflowId} status:`, status);
        
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          setExecutionStatuses(prev => ({
            ...prev,
            [workflowId]: status.status
          }));
          clearInterval(interval);
          
          if (status.status === 'completed') {
            showToast('success', `Workflow completed successfully!`);
          } else if (status.status === 'failed') {
            showToast('error', `Workflow failed: ${status.error || 'Unknown error'}`);
          } else {
            showToast('warning', 'Workflow cancelled');
          }
          
          setTimeout(() => loadWorkflows(), 2000);
        } else if (status.status === 'idle') {
          setExecutionStatuses(prev => {
            const newStatuses = { ...prev };
            delete newStatuses[workflowId];
            return newStatuses;
          });
          clearInterval(interval);
        } else {
          setExecutionStatuses(prev => ({
            ...prev,
            [workflowId]: status.status
          }));
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setExecutionStatuses(prev => {
            const newStatuses = { ...prev };
            delete newStatuses[workflowId];
            return newStatuses;
          });
          showToast('warning', 'Execution status polling timeout');
        }
      } catch (error) {
        console.error('Error polling status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setExecutionStatuses(prev => {
            const newStatuses = { ...prev };
            delete newStatuses[workflowId];
            return newStatuses;
          });
        }
      }
    }, 3000);
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExecutionStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return '';
    }
  };

  const getExecutionStatusIcon = (status?: string) => {
    switch (status) {
      case 'running': return <CircleDot className="w-4 h-4 animate-pulse text-blue-600" />;
      case 'completed': return <CircleCheck className="w-4 h-4 text-green-600" />;
      case 'failed': return <CircleX className="w-4 h-4 text-red-600" />;
      case 'paused': return <CircleAlert className="w-4 h-4 text-yellow-600" />;
      case 'cancelled': return <CircleX className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const getExecutionStatusLabel = (status?: string) => {
    switch (status) {
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'paused': return 'Paused';
      case 'cancelled': return 'Cancelled';
      default: return '';
    }
  };

  const handleRetry = () => {
    loadWorkflows();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* Search Bar */}
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
              onClick={handleRetry}
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

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => {
          const { nodeCount, edgeCount } = getWorkflowStats(workflow);
          const executionStatus = workflow.id ? executionStatuses[workflow.id] : null;
          
          return (
            <div
              key={workflow.id}
              className={`bg-white rounded-lg shadow-sm border transition-all cursor-pointer group relative ${
                executionStatus === 'running' 
                  ? 'border-blue-300 shadow-md shadow-blue-100' 
                  : executionStatus === 'failed'
                  ? 'border-red-300 shadow-md shadow-red-100'
                  : executionStatus === 'completed'
                  ? 'border-green-300 shadow-md shadow-green-100'
                  : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={(e) => {
                if (e.target instanceof HTMLElement && e.target.closest('button')) {
                  return;
                }
                navigate(`/workflows/${workflow.id}`);
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                    {workflow.name || 'Unnamed Workflow'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    {/* Execute button */}
                    <button
                      onClick={(e) => handleExecute(workflow, e)}
                      disabled={executingId === workflow.id || executionStatus === 'running' || !workflow.id}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={executionStatus === 'running' ? 'Workflow is already running' : 'Execute workflow'}
                    >
                      {executingId === workflow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>

                    {/* Duplicate button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(workflow, e);
                      }}
                      disabled={duplicatingId === workflow.id || !workflow.id || !(workflow.data || workflow.jsonData)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={workflow.id && (workflow.data || workflow.jsonData) ? "Duplicate workflow" : "Cannot duplicate: Missing data"}
                    >
                      {duplicatingId === workflow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workflow.id, e);
                      }}
                      disabled={deletingId === workflow.id || !workflow.id}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={workflow.id ? "Delete workflow" : "Invalid workflow ID"}
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

                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">{nodeCount}</span> nodes
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">{edgeCount}</span> edges
                  </span>
                  <span>•</span>
                  <span>
                    {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status || 'draft'}
                    </span>
                    
                    {executionStatus && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getExecutionStatusColor(executionStatus)}`}>
                        {getExecutionStatusIcon(executionStatus)}
                        {getExecutionStatusLabel(executionStatus)}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workflows/${workflow.id}`);
                    }}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                {executionStatus === 'running' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Running...</p>
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
            <Play className="w-16 h-16 mx-auto" />
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