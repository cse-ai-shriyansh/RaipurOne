// Backend API Configuration
// Replace with your actual backend URL when deploying

// Auto-detect platform and use appropriate URL
const isWeb = typeof window !== 'undefined' && !window.navigator.product;
const isAndroidEmulator = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Local development URLs - Using your network IP
export const BACKEND_URL = 'http://10.10.119.86:3001';  // Works for both Expo Go and web
export const API_URL = 'http://10.10.119.86:3001/api';  // API base URL

// Supabase configuration (from environment variables)
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Alternative URLs for different scenarios:
// For Android Emulator: 'http://10.0.2.2:3001'
// For iOS Simulator: 'http://localhost:3001'
// For Physical Device: 'http://YOUR_LOCAL_IP:3001'

// Production URL (update when you deploy your backend)
// export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Worker Authentication
  WORKER_REGISTER: '/api/workers/register',
  WORKER_LOGIN: '/api/workers/login',
  WORKER_ATTENDANCE: '/api/workers/attendance',
  WORKER_TASKS: (workerId) => `/api/workers/${workerId}/tasks`,
  WORKER_COMPLETE: '/api/workers/complete',
  
  // Worker Management
  WORKERS_LIST: '/api/workers',
  WORKERS_AVAILABLE: '/api/workers/available',
  WORKER_ASSIGN: '/api/workers/assign',
  
  // Worker Task Actions
  VALIDATE_WORK: '/api/workers/validate-work',
  SUBMIT_WORK: '/api/workers/submit-work',
  CANCEL_TASK: '/api/workers/cancel-task',
  
  // Ticket/Complaint endpoints
  CREATE_TICKET: '/api/tickets',
  GET_TICKETS: '/api/tickets',
  GET_TICKET_BY_ID: '/api/tickets/:id',
  UPDATE_TICKET: '/api/tickets/:id',
  DELETE_TICKET: '/api/tickets/:id',
  
  // Auto-generated complaints from CCTV
  AUTO_COMPLAINTS: '/api/complaints/auto',
  CREATE_AUTO_COMPLAINT: '/api/complaints/auto-generate',
  ASSIGN_COMPLAINT: '/api/complaints/:id/assign',
};

export default { BACKEND_URL, API_ENDPOINTS };
