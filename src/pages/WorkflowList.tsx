import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Trash2, Copy, Play, Edit, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading workflows...');
      const data = await workflowApi.getAll();
      console.log('✅ Workflows loaded:', data);
      setWorkflows(data);
    } catch (error: any) {
      console.error('❌ Error loading workflows:', error);
      const errorMessage = error.message || 'Failed to load workflows';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== FIX: Delete handler with proper ID validation =====
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
      showToast('success', 'Workflow deleted successfully');
    } catch (error: any) {
      console.error(`❌ Error deleting workflow ${id}:`, error);
      showToast('error', error.message || 'Failed to delete workflow');
    } finally {
      setDeletingId(null);
    }
  };

  // ===== FIX: Duplicate handler with proper error handling =====
  const handleDuplicate = async (workflow: Workflow, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Validate workflow
    if (!workflow) {
      showToast('error', 'Invalid workflow data');
      return;
    }

    // Check if workflow has an ID
    if (!workflow.id) {
      console.error('❌ Cannot duplicate: Workflow ID is missing', workflow);
      showToast('error', 'Cannot duplicate: Workflow ID is missing');
      return;
    }

    // Check if jsonData exists
    if (!workflow.jsonData) {
      console.error('❌ Cannot duplicate: jsonData is missing', workflow);
      showToast('error', 'Cannot duplicate: Workflow data is missing');
      return;
    }

    setDuplicatingId(workflow.id);
    console.log(`📋 Duplicating workflow: ${workflow.name} (ID: ${workflow.id})`);

    try {
      // Create new workflow from existing data
      const newWorkflow = {
        name: `${workflow.name} (Copy)`,
        jsonData: workflow.jsonData, // Use the existing jsonData
        description: workflow.description || '',
        status: 'draft', // Set status to draft for the copy
      };
      
      console.log('📡 Sending duplicate request:', newWorkflow);
      
      const created = await workflowApi.create(newWorkflow);
      console.log('✅ Workflow duplicated successfully:', created);
      
      // Add the new workflow to the list
      setWorkflows(prev => [created, ...prev]);
      showToast('success', `Workflow "${created.name}" created successfully`);
      
    } catch (error: any) {
      console.error('❌ Error duplicating workflow:', error);
      
      // Show detailed error message
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
        <button
          onClick={() => navigate('/workflows/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Workflow
        </button>
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
          let nodeCount = 0;
          try {
            if (workflow.jsonData) {
              const parsed = JSON.parse(workflow.jsonData);
              nodeCount = parsed.nodes?.length || 0;
            }
          } catch (e) {
            console.warn(`Could not parse jsonData for workflow ${workflow.id}:`, e);
          }
          
          return (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/workflows/${workflow.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                    {workflow.name || 'Unnamed Workflow'}
                  </h3>
                  <div className="flex items-center gap-1 ml-2">
                    {/* ===== FIXED: Duplicate button ===== */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('📋 Duplicate button clicked for workflow:', workflow);
                        console.log('📋 Workflow ID:', workflow.id);
                        console.log('📋 Workflow data:', workflow.jsonData);
                        handleDuplicate(workflow, e);
                      }}
                      disabled={duplicatingId === workflow.id || !workflow.id || !workflow.jsonData}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={workflow.id && workflow.jsonData ? "Duplicate workflow" : "Cannot duplicate: Missing data"}
                    >
                      {duplicatingId === workflow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* ===== FIXED: Delete button ===== */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Delete button clicked for workflow:', workflow);
                        console.log('🗑️ Workflow ID:', workflow.id);
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
                  <span>{nodeCount} nodes</span>
                  <span>•</span>
                  <span>
                    {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(workflow.status)}`}>
                    {workflow.status || 'draft'}
                  </span>
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