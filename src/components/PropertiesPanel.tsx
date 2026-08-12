import { useState, useCallback } from 'react';
import type { Node } from 'reactflow';
import { X, Save, RefreshCw } from 'lucide-react';

interface PropertiesPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
  onClose: () => void;
}

export const PropertiesPanel = ({ node, onUpdate, onClose }: PropertiesPanelProps) => {
  const [config, setConfig] = useState<Record<string, any>>(node.data?.config || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    onUpdate({ 
      config: config,
      label: node.data?.label,
      description: node.data?.description
    });
    setTimeout(() => setIsSaving(false), 500);
  }, [config, node.data?.label, node.data?.description, onUpdate]);

  const getConfigFields = () => {
    const type = node.data?.type || node.type || '';
    
    const commonFields = [
      { key: 'label', label: 'Label', type: 'text', value: node.data?.label || '' },
      { key: 'description', label: 'Description', type: 'text', value: node.data?.description || '' },
    ];

    const typeSpecificFields: Record<string, Array<{ key: string; label: string; type: string; placeholder?: string }>> = {
      'email': [
        { key: 'to', label: 'To (email)', type: 'email', placeholder: 'recipient@example.com' },
        { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Email message content' },
        { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your name' },
      ],
      'whatsapp': [
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'WhatsApp message' },
      ],
      'message': [
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'WhatsApp message' },
      ],
      'http': [
        { key: 'url', label: 'URL', type: 'url', placeholder: 'https://api.example.com' },
        { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
      ],
      'webhook': [
        { key: 'url', label: 'Webhook URL', type: 'url', placeholder: 'https://webhook.site/...' },
        { key: 'method', label: 'Method', type: 'select', options: ['POST', 'GET', 'PUT'] },
        { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}' },
      ],
      'database': [
        { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users' },
        { key: 'connection', label: 'Connection String', type: 'text', placeholder: 'mongodb://...' },
      ],
      'function': [
        { key: 'code', label: 'JavaScript Code', type: 'textarea', placeholder: '// Your code here\nreturn { success: true };' },
      ],
      'schedule': [
        { key: 'cron', label: 'Cron Expression', type: 'text', placeholder: '*/5 * * * *' },
        { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'UTC' },
      ],
    };

    const fields = typeSpecificFields[type] || [];
    return [...commonFields, ...fields];
  };

  const fields = getConfigFields();

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 block">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={config[field.key] || field.value || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y min-h-[80px]"
              />
            ) : field.type === 'select' ? (
              <select
                value={config[field.key] || field.value || field.options?.[0] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                value={config[field.key] || field.value || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            )}
          </div>
        ))}
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