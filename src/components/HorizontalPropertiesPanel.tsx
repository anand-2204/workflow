
import React from 'react';
import type { Node } from 'reactflow';


import { getNodeConfig } from './constants/nodeDefinitions';

interface Props {
  node: Node;
  onUpdate: (data: any) => void;
}

export const HorizontalPropertiesPanel: React.FC<Props> = ({ node, onUpdate }) => {
  const config = getNodeConfig(node.type); 
  
  if (!config) return null;

  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const getValue = (key: string) => {
    if (!node.data) return config.defaultConfig?.[key] ?? '';
    return node.data?.[key] ?? config.defaultConfig?.[key] ?? '';
  };

  return (
    <div className="space-y-4">
      {Object.keys(config.defaultConfig || {}).map((key) => {
        const value = getValue(key);
        
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

        // Method Dropdown (HTTP node)
        if (key === 'method') {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <select
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          );
        }

        // Boolean fields (jaise isHtml, caseSensitive)
        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleChange(key, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">{label}</label>
            </div>
          );
        }

        // Code Block (Function node)
        if (key === 'code') {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <textarea
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono bg-gray-50"
              />
            </div>
          );
        }

        // Number fields (timeout, duration)
        if (typeof value === 'number') {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(key, parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
            </div>
          );
        }

        // Default Text Input
        return (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
          </div>
        );
      })}
    </div>
  );
};