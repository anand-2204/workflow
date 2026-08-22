import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronDown, 
  Play, Globe, Mail, Database, Calendar, Webhook, GitBranch, Code,
  Timer, Filter, Layers, MessageCircle,
  Plus, Minus, Trash2, Edit,
  ArrowRight, ArrowLeft, Check,
  AlertCircle, Info, Loader2, Settings
} from 'lucide-react';
import { NODE_DEFINITIONS, getConditionOperators } from '../constants/nodeDefinitions';
import type { Node } from 'reactflow';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
  onClose: () => void;
  executionData?: {
    input?: any;
    output?: any;
    status?: 'idle' | 'running' | 'success' | 'error';
    error?: string;
    timestamp?: string;
  };
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onUpdate,
  onClose,
  executionData
}) => {
  const [config, setConfig] = useState(node.data?.config || {});
  const [inputMapping, setInputMapping] = useState<Record<string, string>>(node.data?.inputMapping || {});
  const [inputExpanded, setInputExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [configExpanded, setConfigExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [mappingKey, setMappingKey] = useState('');
  const [mappingValue, setMappingValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const nodeConfig = NODE_DEFINITIONS[node.type];
  const isHttp = node.type === 'http';
  const isCondition = node.type === 'condition';

  // Handle config changes
  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  // Handle input mapping
  const handleAddMapping = () => {
    if (mappingKey.trim() && mappingValue.trim()) {
      const newMapping = { ...inputMapping, [mappingKey]: mappingValue };
      setInputMapping(newMapping);
      onUpdate({ inputMapping: newMapping });
      setMappingKey('');
      setMappingValue('');
    }
  };

  const handleRemoveMapping = (key: string) => {
    const { [key]: _, ...rest } = inputMapping;
    setInputMapping(rest);
    onUpdate({ inputMapping: rest });
  };

  const handleUpdateMapping = (oldKey: string, newKey: string, value: string) => {
    const { [oldKey]: _, ...rest } = inputMapping;
    const newMapping = { ...rest, [newKey]: value };
    setInputMapping(newMapping);
    onUpdate({ inputMapping: newMapping });
    setEditingKey(null);
  };

  // Render config fields based on node type
  const renderConfigFields = () => {
    switch (node.type) {
      case 'http':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Headers (JSON)</label>
              <textarea
                value={typeof config.headers === 'object' ? JSON.stringify(config.headers, null, 2) : config.headers || '{}'}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleConfigChange('headers', parsed);
                  } catch {
                    handleConfigChange('headers', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body (JSON)</label>
              <textarea
                value={typeof config.body === 'object' ? JSON.stringify(config.body, null, 2) : config.body || '{}'}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleConfigChange('body', parsed);
                  } catch {
                    handleConfigChange('body', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
              <input
                type="text"
                value={config.field || ''}
                onChange={(e) => handleConfigChange('field', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="data.value or {{input.field}}"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getConditionOperators().map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="expected value"
              />
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => handleConfigChange('to', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email Subject"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleConfigChange('body', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Email body content"
              />
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Operation</label>
              <select
                value={config.operation || 'query'}
                onChange={(e) => handleConfigChange('operation', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="query">Query</option>
                <option value="insert">Insert</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Query</label>
              <textarea
                value={config.query || ''}
                onChange={(e) => handleConfigChange('query', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="SELECT * FROM users WHERE id = {{input.userId}}"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-400 text-center py-4">
            No configuration available for this node type
          </div>
        );
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    const status = executionData?.status || 'idle';
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      idle: { color: 'bg-gray-100 text-gray-600', icon: null, label: 'Idle' },
      running: { color: 'bg-blue-100 text-blue-600', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Running' },
      success: { color: 'bg-green-100 text-green-600', icon: <Check className="w-3 h-3" />, label: 'Success' },
      error: { color: 'bg-red-100 text-red-600', icon: <AlertCircle className="w-3 h-3" />, label: 'Error' },
    };
    const config = statusConfig[status] || statusConfig.idle;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="w-[520px] h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${nodeConfig?.iconBg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
            <span className={nodeConfig?.iconColor || 'text-gray-600'}>
              {nodeConfig?.icon || <Play size={18} />}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {nodeConfig?.label || node.type}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate">{nodeConfig?.description || ''}</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Input Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setInputExpanded(!inputExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-50/50 hover:from-blue-100/50 hover:to-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Input</span>
                <span className="text-xs text-gray-400">
                  {Object.keys(inputMapping).length > 0 ? `(${Object.keys(inputMapping).length} mapped)` : ''}
                </span>
              </div>
              {inputExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            
            {inputExpanded && (
              <div className="p-3 bg-white space-y-3">
                {Object.entries(inputMapping).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(inputMapping).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg text-sm">
                        {editingKey === key ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={key}
                              className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateMapping(key, e.currentTarget.value, value);
                                }
                              }}
                              autoFocus
                            />
                            <span className="text-gray-400">→</span>
                            <input
                              type="text"
                              defaultValue={value}
                              className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateMapping(key, key, e.currentTarget.value);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-gray-700 flex-1">{key}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono text-blue-600 flex-1">{value}</span>
                            <button
                              onClick={() => setEditingKey(key)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Edit size={12} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleRemoveMapping(key)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mappingKey}
                    onChange={(e) => setMappingKey(e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    type="text"
                    value={mappingValue}
                    onChange={(e) => setMappingValue(e.target.value)}
                    placeholder="{{variable}}"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddMapping}
                    disabled={!mappingKey.trim() || !mappingValue.trim()}
                    className="p-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Plus size={16} className="text-blue-600" />
                  </button>
                </div>

                <div className="text-xs text-gray-400">
                  💡 Use {'{{variable}}'} to reference previous node outputs
                </div>
              </div>
            )}
          </div>

          {/* Configuration Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setConfigExpanded(!configExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Configuration</span>
              </div>
              {configExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            
            {configExpanded && (
              <div className="p-3 bg-white">
                {renderConfigFields()}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOutputExpanded(!outputExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-green-50 to-green-50/50 hover:from-green-100/50 hover:to-green-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">Output</span>
                {executionData?.output && (
                  <span className="text-xs text-green-600">(executed)</span>
                )}
              </div>
              {outputExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            
            {outputExpanded && (
              <div className="p-3 bg-white">
                {executionData?.output ? (
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {typeof executionData.output === 'object' 
                          ? JSON.stringify(executionData.output, null, 2)
                          : String(executionData.output)}
                      </pre>
                    </div>
                    {executionData.timestamp && (
                      <div className="text-xs text-gray-400">
                        ⏱ {new Date(executionData.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-gray-400">
                    <p>No output data</p>
                    <p className="text-xs mt-1">Execute workflow to see results</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setAdvancedExpanded(!advancedExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Advanced</span>
              </div>
              {advancedExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            
            {advancedExpanded && (
              <div className="p-3 bg-white space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Node ID</span>
                  <span className="font-mono text-gray-700 text-xs">{node.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-mono text-gray-700 text-xs">{node.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-mono text-gray-700 text-xs">{nodeConfig?.category || 'Unknown'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-gray-400">
          {nodeConfig?.category || 'Node'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const defaultConfig = NODE_DEFINITIONS[node.type]?.defaultConfig || {};
              setConfig(defaultConfig);
              onUpdate({ config: defaultConfig });
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};