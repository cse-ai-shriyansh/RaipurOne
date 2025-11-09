import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const createAbortController = () => new AbortController();

const retryRequest = async (requestFn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      if (error.response?.status >= 500 || !error.response) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject({ cancelled: true, message: 'Request cancelled' });
    }
    
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        error,
      });
    }
    
    return Promise.reject(error);
  }
);

export const ticketAPI = {
  createTicket: (ticketData, signal) => {
    return retryRequest(() => axiosInstance.post('/tickets', ticketData, { signal }));
  },

  getAllTickets: (filters = {}, signal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return retryRequest(() => 
      axiosInstance.get(`/tickets?${params.toString()}`, { signal })
    );
  },

  getTicketById: (ticketId, signal) => {
    return retryRequest(() => axiosInstance.get(`/tickets/${ticketId}`, { signal }));
  },

  getUserTickets: (userId, signal) => {
    return retryRequest(() => axiosInstance.get(`/user/${userId}/tickets`, { signal }));
  },

  updateTicketStatus: (ticketId, status) => {
    return axiosInstance.patch(`/tickets/${ticketId}/status`, { status });
  },

  addTicketResponse: (ticketId, message) => {
    return axiosInstance.post(`/tickets/${ticketId}/response`, { message });
  },

  getDashboardStats: (signal) => {
    return retryRequest(() => axiosInstance.get('/dashboard/stats', { signal }));
  },
};

export const analysisAPI = {
  analyzeSingleTicket: (ticketId, signal) => {
    return axiosInstance.post(`/analysis/analyze/${ticketId}`, {}, { signal });
  },

  analyzeAllTickets: (signal) => {
    return axiosInstance.post('/analysis/analyze-all', {}, { signal });
  },

  getDepartmentStats: (signal) => {
    return retryRequest(() => axiosInstance.get('/analysis/departments/stats', { signal }));
  },

  getTicketsByDepartment: (department, signal) => {
    return retryRequest(() => 
      axiosInstance.get(`/analysis/departments/${department}`, { signal })
    );
  },
};

export const geminiAPI = {
  transcribeImage: (imageUrl, signal) => {
    return axiosInstance.post('/gemini/transcribe', { imageUrl }, { signal });
  },

  analyzeTicket: (ticketId, query, signal) => {
    return axiosInstance.post('/gemini/analyze', { ticketId, query }, { signal });
  },
};

export const imageAPI = {
  getTicketImages: (ticketId, signal) => {
    return retryRequest(() => axiosInstance.get(`/images/ticket/${ticketId}`, { signal }));
  },

  getUserImages: (userId, signal) => {
    return retryRequest(() => axiosInstance.get(`/images/user/${userId}`, { signal }));
  },

  deleteImage: (imageId) => {
    return axiosInstance.delete(`/images/${imageId}`);
  },
};

export { createAbortController };
export default axiosInstance;
