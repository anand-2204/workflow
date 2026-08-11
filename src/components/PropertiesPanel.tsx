import { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import { Settings, X, Save } from 'lucide-react';

interface NodeData {
  label?: string;
  description?: string;
  icon?: string;
  type?: string;
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  bgColor?: string;
  iconColor?: string;
}

const PropertiesPanel = ({ 
  node, 
  onUpdate, 
  onClose 
}: { 
  node: Node | null; 
  onUpdate: (data: any) => void;
  onClose: () => void;
}) => {
  if (!node) return null;

  const nodeType = node.data?.type || node.type || '';
  const [localData, setLocalData] = useState<NodeData>(node.data || {});

  useEffect(() => {
    setLocalData(node.data || {});
  }, [node]);

  const handleFieldChange = (field: string, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setLocalData(prev => ({
      ...prev,
      config: { ...(prev.config || {}), [key]: value }
    }));
  };

  const handleSave = () => {
    onUpdate(localData);
    
    if (nodeType === 'email') {
      const config = localData.config || {};
      if (config.to && config.subject && config.message) {
        alert('✅ Email configuration saved successfully!');
      } else {
        alert('⚠️ Please fill in all required fields:\n- To\n- Subject\n- Message');
      }
    } else if (nodeType === 'message' || nodeType === 'whatsapp') {
      const config = localData.config || {};
      if (config.phoneNumber && config.message) {
        alert('✅ WhatsApp configuration saved successfully!');
      } else {
        alert('⚠️ Please fill in all required fields:\n- Phone Number\n- Message');
      }
    } else {
      alert('✅ Properties saved successfully!');
    }
  };

  const renderNodeSpecificFields = () => {
    switch (nodeType) {
      case 'webhook':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-purple-500">⚡</span> Webhook Configuration
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
              <input 
                type="text" 
                placeholder="https://api.example.com/webhook"
                value={localData.config?.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select 
                value={localData.config?.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Headers (JSON)</label>
              <textarea 
                placeholder='{"Content-Type": "application/json"}'
                value={localData.config?.headers || ''}
                onChange={(e) => handleConfigChange('headers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                rows={3}
              />
            </div>
          </div>
        );

      case 'http':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-blue-500">🌐</span> HTTP Configuration
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select 
                value={localData.config?.method || 'GET'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="https://api.example.com"
                value={localData.config?.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-amber-500">📧</span> Email Configuration
              </h4>
              {localData.config?.to && localData.config?.subject && localData.config?.message && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Ready</span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="recipient@example.com"
                  value={localData.config?.to || ''}
                  onChange={(e) => handleConfigChange('to', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                    localData.config?.to ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                />
                {localData.config?.to && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Email subject"
                value={localData.config?.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  localData.config?.subject ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea 
                placeholder="Enter your email message..."
                value={localData.config?.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  localData.config?.message ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input 
                type="text" 
                placeholder="Your Name"
                value={localData.config?.fromName || ''}
                onChange={(e) => handleConfigChange('fromName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        );

      case 'message':
      case 'whatsapp':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-green-500">💬</span> WhatsApp Configuration
              </h4>
              {localData.config?.phoneNumber && localData.config?.message && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Ready</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="+1234567890"
                  value={localData.config?.phoneNumber || ''}
                  onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    localData.config?.phoneNumber ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                />
                {localData.config?.phoneNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea 
                placeholder="Enter your WhatsApp message..."
                value={localData.config?.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  localData.config?.message ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                rows={5}
              />
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-cyan-500">🗄️</span> Database Configuration
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Connection String</label>
              <input 
                type="text" 
                placeholder="mongodb://localhost:27017"
                value={localData.config?.connectionString || ''}
                onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Query <span className="text-red-500">*</span></label>
              <textarea 
                placeholder="SELECT * FROM users WHERE id = ?"
                value={localData.config?.query || ''}
                onChange={(e) => handleConfigChange('query', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                rows={4}
              />
            </div>
          </div>
        );

      case 'function':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-violet-500">⚙️</span> Function Configuration
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Function Name</label>
              <input 
                type="text" 
                placeholder="myFunction"
                value={localData.config?.functionName || ''}
                onChange={(e) => handleConfigChange('functionName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">JavaScript Code <span className="text-red-500">*</span></label>
              <textarea 
                placeholder="return { result: 'Hello World' };"
                value={localData.config?.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                rows={6}
              />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-indigo-500">⏰</span> Schedule Configuration
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cron Expression <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="0 9 * * *"
                value={localData.config?.cron || ''}
                onChange={(e) => handleConfigChange('cron', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., "0 9 * * *" for 9:00 AM daily</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Timezone</label>
              <select 
                value={localData.config?.timezone || 'UTC'}
                onChange={(e) => handleConfigChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>
        );

      case 'start':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-emerald-500">▶️</span> Start Node
            </h4>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">This is the starting point of your workflow.</p>
              <p className="text-xs text-emerald-600 mt-1">No additional configuration needed.</p>
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-rose-500">⏹️</span> End Node
            </h4>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-sm text-rose-700">This marks the end of your workflow.</p>
              <p className="text-xs text-rose-600 mt-1">No additional configuration needed.</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">⚠️ Unknown node type: {nodeType || 'undefined'}</p>
              <p className="text-xs text-yellow-600 mt-1">Please check that the node type is properly set.</p>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                node.type: {node.type || 'undefined'}<br />
                node.data.type: {node.data?.type || 'undefined'}<br />
                node.data.label: {node.data?.label || 'undefined'}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-800">Properties</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <span className="text-xs text-gray-500">Node Type</span>
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-xl">{localData.icon || '📦'}</span>
              {localData.label || nodeType || 'Node'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input 
              type="text" 
              value={localData.label || ''}
              onChange={(e) => handleFieldChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter node label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              value={localData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter node description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Emoji)
            </label>
            <input 
              type="text" 
              value={localData.icon || ''}
              onChange={(e) => handleFieldChange('icon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 🚀"
              maxLength={2}
            />
          </div>

          {renderNodeSpecificFields()}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          Save Properties
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;