// src/api/axiosConfig.ts
import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use relative URL for proxy or absolute for direct
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5081/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, 
});

// Request interceptor - No auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(` API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log(' Request Data:', config.data);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    console.error(' Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(` API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(' Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      // Extract error message from response
      const errorData = error.response.data as any;
      const errorMessage = errorData?.message || 
                          errorData?.title ||
                          errorData?.errors?.join(', ') ||
                          error.message ||
                          'An error occurred';
      
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // The request was made but no response was received
      console.error(' No Response:', error.request);
      return Promise.reject(new Error('Server is not responding. Please check if the backend is running.'));
    } else {
      // Something happened in setting up the request
      console.error(' Request Setup Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;