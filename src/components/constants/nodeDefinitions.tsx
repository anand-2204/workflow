import { 
  Play, Zap, Clock, MessageCircle, Mail, Database, 
  Code, StopCircle, Globe, GitBranch, Filter, Layers,
  Webhook, Calendar, Timer, Send, Link, Split,
  CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Plus, Minus, RefreshCw, Upload, Download
} from "lucide-react";
import type { NodeConfig, NodeCategoryMap } from "../../types/node.types";

export const NODE_DEFINITIONS: Record<string, NodeConfig> = {
  // ==========================================
  // TRIGGERS
  // ==========================================

  start: {
    type: "start",
    label: "Start",
    description: "Start your workflow",
    category: "Triggers",
    bgColor: "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    hoverBorderColor: "hover:border-emerald-400 dark:hover:border-emerald-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    shadowColor: "shadow-emerald-500/10",
    icon: <Play size={18} />,
    supportsInputs: false,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 0,
    },
    defaultConfig: {}
  },

  webhook: {
    type: "webhook",
    label: "Webhook",
    description: "Trigger workflows via webhooks",
    category: "Triggers",
    bgColor: "bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20",
    borderColor: "border-purple-300 dark:border-purple-700",
    hoverBorderColor: "hover:border-purple-400 dark:hover:border-purple-600",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    shadowColor: "shadow-purple-500/10",
    icon: <Webhook size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      method: "POST",
      headers: {}
    }
  },

  schedule: {
    type: "schedule",
    label: "Schedule",
    description: "Run workflows on a schedule",
    category: "Triggers",
    bgColor: "bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    hoverBorderColor: "hover:border-indigo-400 dark:hover:border-indigo-600",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    shadowColor: "shadow-indigo-500/10",
    icon: <Calendar size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      cronExpression: "0 9 * * *",
      timezone: "Asia/Kolkata"
    }
  },

  // ==========================================
  // ACTIONS
  // ==========================================

  http: {
    type: "http",
    label: "HTTP Request",
    description: "Make HTTP requests",
    category: "Actions",
    bgColor: "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    hoverBorderColor: "hover:border-blue-400 dark:hover:border-blue-600",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    shadowColor: "shadow-blue-500/10",
    icon: <Globe size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      method: "GET",
      url: "https://api.example.com",
      headers: {},
      body: "{}",
      bodyType: "json",
      timeout: 30
    }
  },

  email: {
    type: "email",
    label: "Email",
    description: "Send and receive emails",
    category: "Actions",
    bgColor: "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20",
    borderColor: "border-amber-300 dark:border-amber-700",
    hoverBorderColor: "hover:border-amber-400 dark:hover:border-amber-600",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    shadowColor: "shadow-amber-500/10",
    icon: <Mail size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      to: "",
      subject: "",
      body: "",
      from: "",
      cc: "",
      bcc: "",
      isHtml: false
    }
  },

  message: {
    type: "message",
    label: "WhatsApp",
    description: "Send WhatsApp messages",
    category: "Actions",
    bgColor: "bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20",
    borderColor: "border-green-300 dark:border-green-700",
    hoverBorderColor: "hover:border-green-400 dark:hover:border-green-600",
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    shadowColor: "shadow-green-500/10",
    icon: <MessageCircle size={20} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      phone: "",
      message: "",
      messageType: "text",
      templateName: ""
    }
  },

  database: {
    type: "database",
    label: "Database",
    description: "Query and manage databases",
    category: "Actions",
    bgColor: "bg-gradient-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    hoverBorderColor: "hover:border-cyan-400 dark:hover:border-cyan-600",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    shadowColor: "shadow-cyan-500/10",
    icon: <Database size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      operation: "query",
      query: "SELECT * FROM users",
      table: "",
      parameters: {}
    }
  },

  notification: {
    type: "notification",
    label: "Notification",
    description: "Send notifications",
    category: "Actions",
    bgColor: "bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20",
    borderColor: "border-teal-300 dark:border-teal-700",
    hoverBorderColor: "hover:border-teal-400 dark:hover:border-teal-600",
    iconColor: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    shadowColor: "shadow-teal-500/10",
    icon: <Send size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      title: "",
      message: "",
      type: "info"
    }
  },

  // ==========================================
  // LOGIC - Updated with Condition Node
  // ==========================================

  // ✅ NEW: Condition Node for branching
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch workflow based on condition",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20",
    borderColor: "border-amber-300 dark:border-amber-700",
    hoverBorderColor: "hover:border-amber-400 dark:hover:border-amber-600",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    shadowColor: "shadow-amber-500/10",
    icon: <GitBranch size={18} />,
    supportsInputs: true,
    // ✅ Multiple outputs for true/false branches
    outputs: [
      { id: 'true', label: 'True', color: '#22c55e' },
      { id: 'false', label: 'False', color: '#ef4444' }
    ],
    validation: {
      maxOutgoingConnections: 2,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      field: "",
      operator: "equals",
      value: "",
      caseSensitive: false
    }
  },

  transform: {
    type: "transform",
    label: "Transform",
    description: "Transform data from previous nodes",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    hoverBorderColor: "hover:border-orange-400 dark:hover:border-orange-600",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    shadowColor: "shadow-orange-500/10",
    icon: <Layers size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      fieldMappings: {},
      transformType: "map"
    }
  },

  filter: {
    type: "filter",
    label: "Filter",
    description: "Filter data from previous nodes",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    hoverBorderColor: "hover:border-cyan-400 dark:hover:border-cyan-600",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    shadowColor: "shadow-cyan-500/10",
    icon: <Filter size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      field: "",
      operator: "contains",
      value: "",
      filterType: "include"
    }
  },

  function: {
    type: "function",
    label: "Function",
    description: "Run custom JavaScript code",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20",
    borderColor: "border-violet-300 dark:border-violet-700",
    hoverBorderColor: "hover:border-violet-400 dark:hover:border-violet-600",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    shadowColor: "shadow-violet-500/10",
    icon: <Code size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      code: "// return data;\nreturn data;",
      returnType: "json"
    }
  },

  delay: {
    type: "delay",
    label: "Delay",
    description: "Wait before continuing",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-950/30 dark:to-gray-900/20",
    borderColor: "border-gray-300 dark:border-gray-700",
    hoverBorderColor: "hover:border-gray-400 dark:hover:border-gray-600",
    iconColor: "text-gray-600 dark:text-gray-400",
    iconBg: "bg-gray-100 dark:bg-gray-900/50",
    shadowColor: "shadow-gray-500/10",
    icon: <Timer size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      duration: 5000,
      unit: "ms"
    }
  },

  end: {
    type: "end",
    label: "End",
    description: "End your workflow",
    category: "Logic",
    bgColor: "bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20",
    borderColor: "border-rose-300 dark:border-rose-700",
    hoverBorderColor: "hover:border-rose-400 dark:hover:border-rose-600",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    shadowColor: "shadow-rose-500/10",
    icon: <StopCircle size={18} />,
    supportsInputs: true,
    validation: {
      maxOutgoingConnections: 0,
      maxIncomingConnections: 1,
    },
    defaultConfig: {
      outputData: {}
    }
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Helper function to get nodes by category
export const getNodesByCategory = (): NodeCategoryMap => {
  const categories: NodeCategoryMap = {};
  
  Object.values(NODE_DEFINITIONS).forEach(node => {
    if (!categories[node.category]) {
      categories[node.category] = [];
    }
    categories[node.category].push(node);
  });
  
  return categories;
};

// Helper to get all node types
export const getAllNodeTypes = (): string[] => {
  return Object.keys(NODE_DEFINITIONS);
};

// Helper to get node config by type
export const getNodeConfig = (type: string): NodeConfig | undefined => {
  return NODE_DEFINITIONS[type];
};

// ✅ NEW: Check if node has multiple outputs (like condition node)
export const hasMultipleOutputs = (nodeType: string): boolean => {
  const config = NODE_DEFINITIONS[nodeType];
  return config?.outputs?.length ? config.outputs.length > 1 : false;
};

// ✅ NEW: Get node outputs
export const getNodeOutputs = (nodeType: string): { id: string; label: string; color: string }[] => {
  const config = NODE_DEFINITIONS[nodeType];
  return config?.outputs || [{ id: 'default', label: 'Default', color: '#3b82f6' }];
};

// ✅ NEW: Check if node supports input mapping
export const supportsInputMapping = (nodeType: string): boolean => {
  const config = NODE_DEFINITIONS[nodeType];
  return config?.supportsInputs || false;
};

// ✅ NEW: Get default config for a node type
export const getDefaultConfig = (nodeType: string): Record<string, any> => {
  const config = NODE_DEFINITIONS[nodeType];
  return config?.defaultConfig || {};
};

// ✅ NEW: Get condition operators for condition node
export const getConditionOperators = () => {
  return [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_or_equal', label: 'Greater or Equal' },
    { value: 'less_or_equal', label: 'Less or Equal' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
    { value: 'regex', label: 'Regex Match' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' },
  ];
};