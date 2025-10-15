import axios from 'axios';

// Base URLs
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';
const NODE_API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

// Axios instance with auth token
const createAxiosInstance = (baseURL) => {
  const instance = axios.create({ baseURL });
  
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  return instance;
};

const pythonApi = createAxiosInstance(PYTHON_API_URL);
const nodeApi = createAxiosInstance(NODE_API_URL);

// ============================================
// AUTHENTICATION
// ============================================
export const authAPI = {
  login: (credentials) => nodeApi.post('/api/auth/login', credentials),
  register: (data) => nodeApi.post('/api/auth/register', data),
  logout: () => nodeApi.post('/api/auth/logout'),
};

// ============================================
// USER MANAGEMENT (RFID Users)
// ============================================
export const usersAPI = {
  // Get all users
  getAll: () => pythonApi.get('/api/users'),
  
  // Get user by RFID
  getByRFID: (rfidId) => pythonApi.get(`/api/users/${rfidId}`),
  
  // Create new user
  create: (userData) => pythonApi.post('/api/users', userData),
  
  // Update user
  update: (rfidId, userData) => pythonApi.patch(`/api/users/${rfidId}`, userData),
  
  // Delete user
  delete: (rfidId) => pythonApi.delete(`/api/users/${rfidId}`),
  
  // Get user wallet balance
  getWalletBalance: (rfidId) => pythonApi.get(`/api/wallet/${rfidId}`),
};

// ============================================
// PARKING SESSIONS
// ============================================
export const sessionsAPI = {
  // Get all active sessions
  getActive: () => pythonApi.get('/api/sessions/active'),
  
  // Get all sessions (with filters)
  getAll: (params) => pythonApi.get('/api/sessions', { params }),
  
  // Get session by ID
  getById: (sessionId) => pythonApi.get(`/api/sessions/${sessionId}`),
  
  // Entry - Start session
  entry: (entryData) => pythonApi.post('/api/sessions/entry', entryData),
  
  // Exit - End session
  exit: (exitData) => pythonApi.post('/api/sessions/exit', exitData),
  
  // Manual exit (admin override)
  manualExit: (sessionId) => pythonApi.post(`/api/sessions/${sessionId}/manual-exit`),
};

// ============================================
// PARKING SLOTS
// ============================================
export const slotsAPI = {
  // Get all slots
  getAll: () => pythonApi.get('/api/slots'),
  
  // Get slot by ID
  getById: (slotId) => pythonApi.get(`/api/slots/${slotId}`),
  
  // Update slot status
  updateStatus: (slotId, statusData) => pythonApi.patch(`/api/slots/${slotId}`, statusData),
  
  // Get slots by camera
  getByCamera: (cameraId) => pythonApi.get(`/api/slots/camera/${cameraId}`),
  
  // Bulk update slots (from vision service)
  bulkUpdate: (slotsData) => pythonApi.post('/api/slots/bulk-update', slotsData),
};

// ============================================
// WALLET & PAYMENTS
// ============================================
export const walletAPI = {
  // Get wallet balance
  getBalance: (rfidId) => pythonApi.get(`/api/wallet/${rfidId}`),
  
  // Top up wallet
  topup: (topupData) => pythonApi.post('/api/wallet/topup', topupData),
  
  // Get transaction history
  getTransactions: (rfidId, params) => pythonApi.get(`/api/wallet/${rfidId}/transactions`, { params }),
  
  // Verify payment
  verifyPayment: (verificationData) => pythonApi.post('/api/wallet/verify-payment', verificationData),
};

// Razorpay Payment
export const paymentAPI = {
  // Create Razorpay order
  createOrder: (orderData) => pythonApi.post('/api/payment/create-order', orderData),
  
  // Verify payment
  verifyPayment: (verificationData) => pythonApi.post('/api/payment/verify', verificationData),
  
  // Initiate refund
  refund: (refundData) => pythonApi.post('/api/payment/refund', refundData),
  
  // Simulate payment (for testing)
  simulatePayment: (paymentData) => pythonApi.post('/api/payment/simulate', paymentData),
};

// ============================================
// SYSTEM STATUS & MONITORING
// ============================================
export const systemAPI = {
  // Get overall system status
  getStatus: () => pythonApi.get('/api/status'),
  
  // Get system logs
  getLogs: (params) => pythonApi.get('/api/logs', { params }),
  
  // Get component health
  getHealth: () => pythonApi.get('/health'),
  
  // Get ESP32 gate status
  getGateStatus: (gateId) => axios.get(`http://${gateId}/status`).catch(() => ({ 
    data: { connected: false, error: 'Cannot reach gate controller' }
  })),
  
  // Control gate (open/close)
  controlGate: (gateId, action) => axios.post(`http://${gateId}/${action}`),
};

// ============================================
// ANALYTICS & REPORTS
// ============================================
export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: () => nodeApi.get('/api/dashboard/stats').catch(() => 
    pythonApi.get('/api/status').then(status => ({
      data: {
        slots: {
          total: status.data.total_slots,
          occupied: status.data.occupied_slots,
          free: status.data.free_slots
        },
        sessions: { active: 0 },
        revenue: { today: 0 },
        users: { total: 0 }
      }
    }))
  ),
  
  // Get revenue data
  getRevenue: (params) => pythonApi.get('/api/analytics/revenue', { params }),
  
  // Get occupancy trends
  getOccupancy: (params) => pythonApi.get('/api/analytics/occupancy', { params }),
  
  // Get peak hours
  getPeakHours: (params) => pythonApi.get('/api/analytics/peak-hours', { params }),
  
  // Get user statistics
  getUserStats: () => pythonApi.get('/api/analytics/users'),
};

// ============================================
// VISION SERVICE
// ============================================
export const visionAPI = {
  // Get vision service status
  getStatus: () => axios.get('http://localhost:8001/status').catch(() => ({
    data: { 
      status: 'offline',
      cameras: [],
      slots_detected: 0
    }
  })),
  
  // Get camera list
  getCameras: () => axios.get('http://localhost:8001/cameras').catch(() => ({
    data: { cameras: [] }
  })),
  
  // Get camera frame
  getCameraFrame: (cameraId) => `http://localhost:8001/camera/${cameraId}/frame`,
  
  // Get slot detection results
  getDetections: (cameraId) => axios.get(`http://localhost:8001/camera/${cameraId}/detections`),
};

// ============================================
// AGGREGATOR SERVICE
// ============================================
export const aggregatorAPI = {
  // Get aggregator status
  getStatus: () => axios.get('http://localhost:8002/status').catch(() => ({
    data: {
      status: 'offline',
      mqtt_connected: false,
      vision_connected: false,
      backend_connected: false
    }
  })),
  
  // Get slot state
  getSlotState: () => axios.get('http://localhost:8002/slots'),
  
  // Force sync
  forceSync: () => axios.post('http://localhost:8002/sync'),
};

// ============================================
// BILLING CONFIGURATION
// ============================================
export const billingAPI = {
  // Get billing config
  getConfig: () => pythonApi.get('/api/billing/config'),
  
  // Update billing config
  updateConfig: (configData) => pythonApi.post('/api/billing/config', configData),
};

export default {
  auth: authAPI,
  users: usersAPI,
  sessions: sessionsAPI,
  slots: slotsAPI,
  wallet: walletAPI,
  payment: paymentAPI,
  system: systemAPI,
  analytics: analyticsAPI,
  vision: visionAPI,
  aggregator: aggregatorAPI,
  billing: billingAPI,
};
