import { useState, useCallback, useEffect } from 'react';
import type { Node } from 'reactflow';
import { X, Save, RefreshCw, GitBranch, CheckCircle, XCircle, Plus, Trash2, ChevronDown, Link } from 'lucide-react';
import { getConditionOperators, getNodeOutputs, hasMultipleOutputs } from '../components/constants/nodeDefinitions';
import type { NodeInputSource } from '../types/workflow';

interface PropertiesPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
  onClose: () => void;
  availableNodes?: Array<{ id: string; label: string; type: string }>;
}

export const PropertiesPanel = ({ node, onUpdate, onClose, availableNodes = [] }: PropertiesPanelProps) => {
  const [config, setConfig] = useState<Record<string, any>>(node.data?.config || {});
  const [inputs, setInputs] = useState<Record<string, NodeInputSource>>(node.data?.inputs || {});
  const [label, setLabel] = useState(node.data?.label || '');
  const [description, setDescription] = useState(node.data?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['config', 'inputs', 'condition']);

  const nodeType = node.data?.type || node.type || '';

  // Update local state when node changes
  useEffect(() => {
    setConfig(node.data?.config || {});
    setInputs(node.data?.inputs || {});
    setLabel(node.data?.label || '');
    setDescription(node.data?.description || '');
  }, [node]);

  const handleChange = useCallback((key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleInputChange = useCallback((key: string, value: Partial<NodeInputSource>) => {
    setInputs(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value }
    }));
  }, []);

  const handleAddInput = useCallback(() => {
    const newKey = `input_${Object.keys(inputs).length + 1}`;
    setInputs(prev => ({
      ...prev,
      [newKey]: { fromNode: '', field: '' }
    }));
  }, [inputs]);

  const handleRemoveInput = useCallback((key: string) => {
    setInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[key];
      return newInputs;
    });
  }, []);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    onUpdate({ 
      config: config,
      inputs: inputs,
      label: label,
      description: description
    });
    setTimeout(() => setIsSaving(false), 500);
  }, [config, inputs, label, description, onUpdate]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Get available previous nodes for input mapping
  const getPreviousNodes = () => {
    return availableNodes.filter(n => n.id !== node.id);
  };

  // Get available fields from previous nodes
  const getAvailableFields = () => {
    const fields: string[] = [];
    availableNodes.forEach(n => {
      if (n.id !== node.id) {
        fields.push(n.label);
      }
    });
    return fields;
  };

  // ==========================================
  // CONDITION CONFIG RENDERER
  // ==========================================

  const renderConditionConfig = () => {
    const condition = config?.condition || { field: '', operator: 'equals', value: '', caseSensitive: false };
    const operators = getConditionOperators();

    const updateCondition = (key: string, value: any) => {
      handleChange('condition', { ...condition, [key]: value });
    };

    // Check if condition is configured
    const isConfigured = condition.field && condition.value;

    return (
      <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Condition Configuration</span>
          {isConfigured && (
            <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Configured
            </span>
          )}
        </div>

        {/* Field */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field to Evaluate
            <span className="text-xs text-gray-400 ml-1">(from previous node output)</span>
          </label>
          <input
            type="text"
            value={condition.field || ''}
            onChange={(e) => updateCondition('field', e.target.value)}
            placeholder="e.g., status, data.user.age, score"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {/* Quick field suggestions */}
          {getAvailableFields().length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {getAvailableFields().slice(0, 4).map((f) => (
                <button
                  key={f}
                  onClick={() => updateCondition('field', f)}
                  className="text-[10px] bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-1">
            Use dot notation for nested fields: <span className="font-mono">data.user.age</span>
          </p>
        </div>

        {/* Operator */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
          <select
            value={condition.operator || 'equals'}
            onChange={(e) => updateCondition('operator', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Value to Compare</label>
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => updateCondition('value', e.target.value)}
            placeholder="e.g., active, 25, John, true"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Case Sensitive */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={condition.caseSensitive || false}
            onChange={(e) => updateCondition('caseSensitive', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label className="text-xs text-gray-700">Case Sensitive</label>
        </div>

        {/* Preview */}
        {condition.field && condition.value && (
          <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-gray-700">{condition.field}</span>
              <span className="text-gray-400">{condition.operator}</span>
              <span className="font-mono text-gray-700">"{condition.value}"</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-amber-600">True / False</span>
            </div>
          </div>
        )}

        {/* Branch Info */}
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle className="w-3 h-3" />
            <span>True branch connects from <span className="font-mono font-bold">True</span> handle</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-700 mt-1">
            <XCircle className="w-3 h-3" />
            <span>False branch connects from <span className="font-mono font-bold">False</span> handle</span>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // INPUT MAPPING RENDERER
  // ==========================================

  const renderInputMapping = () => {
    const previousNodes = getPreviousNodes();

    return (
      <div className="space-y-3">
        {Object.entries(inputs).map(([key, value]) => (
          <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">{key}</span>
              <button 
                onClick={() => handleRemoveInput(key)}
                className="p-1 hover:bg-red-100 rounded-lg text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">From Node</label>
                <select
                  value={value.fromNode || ''}
                  onChange={(e) => handleInputChange(key, { fromNode: e.target.value || undefined })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select previous node...</option>
                  {previousNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Field Path (optional)</label>
                <input
                  type="text"
                  value={value.field || ''}
                  onChange={(e) => handleInputChange(key, { field: e.target.value || undefined })}
                  placeholder="e.g., data.users[0].email"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Default Value (optional)</label>
                <input
                  type="text"
                  value={value.defaultValue || ''}
                  onChange={(e) => handleInputChange(key, { defaultValue: e.target.value || undefined })}
                  placeholder="Default if not found"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={handleAddInput}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Input Mapping
        </button>
      </div>
    );
  };

  // ==========================================
  // NODE CONFIG FIELDS
  // ==========================================

  const getConfigFields = () => {
    const commonFields: any[] = [
      { key: 'label', label: 'Label', type: 'text', value: label },
      { key: 'description', label: 'Description', type: 'text', value: description },
    ];

    const typeSpecificFields: Record<string, any[]> = {
      'email': [
        { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com', value: config.to || '' },
        { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject', value: config.subject || '' },
        { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email message content', value: config.body || '' },
        { key: 'from', label: 'From', type: 'text', placeholder: 'sender@example.com', value: config.from || '' },
      ],
      'whatsapp': [
        { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+1234567890', value: config.phone || '' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'WhatsApp message', value: config.message || '' },
      ],
      'message': [
        { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+1234567890', value: config.phone || '' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'WhatsApp message', value: config.message || '' },
      ],
      'http': [
        { key: 'url', label: 'URL', type: 'url', placeholder: 'https://api.example.com', value: config.url || '' },
        { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], value: config.method || 'GET' },
        { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}', value: JSON.stringify(config.headers || {}, null, 2) },
      ],
      'webhook': [
        { key: 'url', label: 'Webhook URL', type: 'url', placeholder: 'https://webhook.site/...', value: config.url || '' },
        { key: 'method', label: 'Method', type: 'select', options: ['POST', 'GET', 'PUT'], value: config.method || 'POST' },
      ],
      'database': [
        { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users', value: config.query || '' },
        { key: 'operation', label: 'Operation', type: 'select', options: ['query', 'insert', 'update', 'delete'], value: config.operation || 'query' },
      ],
      'transform': [
        { key: 'fieldMappings', label: 'Field Mappings (JSON)', type: 'textarea', placeholder: '{"target": "source"}', value: JSON.stringify(config.fieldMappings || {}, null, 2) },
      ],
      'filter': [
        { key: 'field', label: 'Field', type: 'text', placeholder: 'status', value: config.field || '' },
        { key: 'operator', label: 'Operator', type: 'select', options: ['contains', 'equals', 'starts_with', 'ends_with'], value: config.operator || 'contains' },
        { key: 'value', label: 'Value', type: 'text', placeholder: 'active', value: config.value || '' },
      ],
      'delay': [
        { key: 'duration', label: 'Duration (ms)', type: 'number', placeholder: '5000', value: config.duration || 5000 },
      ],
      'condition': [], // Handled separately
    };

    const fields = typeSpecificFields[nodeType] || [];
    return [...commonFields, ...fields];
  };

  const fields = getConfigFields();
  const isConditionNode = nodeType === 'condition' || nodeType === 'conditionNode';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Properties</h3>
          <p className="text-[10px] text-gray-500">{node.data?.type || node.type || 'Node'}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Fields */}
        {fields.map((field: any) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 block">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={field.value || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y min-h-[80px] font-mono text-xs"
              />
            ) : field.type === 'select' ? (
              <select
                value={field.value || field.options?.[0] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                {field.options?.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                value={field.value || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            )}
          </div>
        ))}

        {/* ✅ Condition Configuration - For Condition Node Only */}
        {isConditionNode && (
          <div className="space-y-1.5">
            <button 
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('condition')}
            >
              <span className="text-xs font-medium text-gray-700">Condition</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.includes('condition') ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.includes('condition') && renderConditionConfig()}
          </div>
        )}

        {/* ✅ Input Mapping - For nodes that support it */}
        {!isConditionNode && (
          <div className="space-y-1.5">
            <button 
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('inputs')}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Input Mapping</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {Object.keys(inputs).length}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.includes('inputs') ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.includes('inputs') && renderInputMapping()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Properties
            </>
          )}
        </button>
      </div>
    </div>
  );
};