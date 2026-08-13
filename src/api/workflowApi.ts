// src/api/workflowApi.ts
import axiosInstance from './axiosConfig';
import type { Workflow, WorkflowCreateRequest, WorkflowUpdateRequest } from '../types/workflow';

// Define the payload type for execution
export interface WorkflowExecutionPayload {
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
}

// Define the full status response type
export interface WorkflowStatusResponse {
  status: string;
  progress: number;
  executionId: string | null;
  startTime?: string;
  endTime?: string;
  logs: string[];
  error: string | null;
}

export const workflowApi = {
  // Get all workflows
  getAll: async (): Promise<Workflow[]> => {
    const response = await axiosInstance.get('/Workflow');
    return response.data;
  },

  // Get workflow by ID
  getById: async (id: number): Promise<Workflow> => {
    const response = await axiosInstance.get(`/Workflow/${id}`);
    return response.data;
  },

  // Create workflow
  create: async (data: WorkflowCreateRequest): Promise<Workflow> => {
    const response = await axiosInstance.post('/Workflow', data);
    return response.data;
  },

  // Update workflow
  update: async (id: number, data: WorkflowUpdateRequest): Promise<Workflow> => {
    const response = await axiosInstance.put(`/Workflow/${id}`, data);
    return response.data;
  },

  // Delete workflow
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/Workflow/${id}`);
  },

  // Execute workflow with payload
  execute: async (id: number, payload: WorkflowExecutionPayload): Promise<{ executionId: string }> => {
    const response = await axiosInstance.post(`/Workflow/${id}/execute`, payload);
    return response.data;
  },

  // Get full workflow status
  getStatus: async (id: number): Promise<WorkflowStatusResponse> => {
    const response = await axiosInstance.get(`/Workflow/${id}/status`);
    return response.data;
  },

  // ===== CLEANUP (To clear backend memory after polling finishes) =====
  cleanup: async (id: number): Promise<void> => {
    await axiosInstance.post(`/Workflow/${id}/cleanup`);
  },
};