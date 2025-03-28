import axios from 'axios'
import { API_URL } from '../config/constants'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  // Skip auth header for login and register
  if (config.url === '/auth/login' || config.url === '/auth/register') {
    return config
  }

  // Get stored user data
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    // Add token to request headers if available
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
  }
  return config
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/user')) {
      // Clear stored data on authentication error
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Mock API implementation
export const mockAPI = {
  // Auth
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response
  },

  logout: async () => {
    const response = await api.get('/auth/logout')
    return response
  },
  
  requestPasswordReset: async (data) => {
    const response = await api.post('/auth/forgot-password', data)
    return response
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, { newPassword })
    return response
  },

  getLoggedUser: async () => {
    const response = await api.get('/auth/user')
    return response.user
  },

  // Reports
  createReport: async (reportData) => {
    const response = await api.post('/emergency/create', reportData, {
      headers: {
        'Content-Type': 'multipart/form-data' // Important for file uploads
      }
    })
    return response
  },

  withdrawReport: async (reportId) => {
    const response = await api.post(`/emergency/${reportId}/withdraw`)
    return response
  },

  createDistressReport: async (data, audioBlob) => {
    // Create FormData for multipart/form-data request
    const formData = new FormData()
    formData.append('latitude', data.latitude)
    formData.append('longitude', data.longitude)
    
    // If audio blob exists, append it as a file
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'distress-audio.mp3', {
        type: 'audio/mpeg'
      })
      formData.append('media', audioFile)
    }

    const response = await api.post('/emergency/distress', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  fetchReports: async () => {
    const response = await api.get('/emergency/getall')
    return response
  },

  fetchAllReports: async () => {
    const response = await api.get('/emergency/getallreports')
    return response
  },

  getUserReports: async () => {
    const response = await api.get('/users/user/reports')
    return response.reports
  },

  getAvailableReports: async () => {
    const response = await api.get('/emergency/available')
    return response
  },

  getAssignedReports: async () => {
    const response = await api.get('/emergency/assigned')
    return response
  },

  acceptReport: async (reportId) => {
    const response = await api.post(`/emergency/${reportId}/accept`)
    return response
  },

  rejectReport: async (reportId) => {
    const response = await api.post(`/emergency/${reportId}/reject`)
    return response
  },

  assignResponder: async (reportId, responderId) => {
    const response = await api.post(`/emergency/${reportId}/assign`, { responderId })
    return response
  },

  updateReportStatus: async (reportId, status) => {
    const response = await api.put(`/emergency/${reportId}/status`, { status })
    return response
  },

  notifyNearbyUsers: async (reportId, range) => {
    const response = await api.post(`/emergency/${reportId}/notify-nearby`, { range })
    return response
  },

  // Users
  getResponders: async () => {
    const response = await api.get('/users/admin/responders')
    return response
  },

  getAnalytics: async (timeFilter) => {
    const response = await api.get('/users/admin/analytics', {
      params: { timeFilter }
    })
    return response
  },

  getSafetyResources: async () => {
    const response = await api.get('/users/user/resources')
    return response
  },

  // Chatbot
  getChatbotResponse: async (message) => {
    const response = await api.post('/chatbot', { message })
    return response
  }
}

export default api