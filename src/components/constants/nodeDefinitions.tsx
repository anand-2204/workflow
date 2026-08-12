import { 
  Play, Zap, Clock, MessageCircle, Mail, Database, 
  Code, StopCircle, Globe 
} from "lucide-react";
import type { NodeConfig, NodeCategoryMap } from "../../types/node.types";

export const NODE_DEFINITIONS: Record<string, NodeConfig> = {
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 0,
    }
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
    icon: <Zap size={18} />,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    icon: <Clock size={18} />,
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
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
    validation: {
      maxOutgoingConnections: 0,
      maxIncomingConnections: 1,
    }
  },
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
    validation: {
      maxOutgoingConnections: 1,
      maxIncomingConnections: 1,
    }
  }
};

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