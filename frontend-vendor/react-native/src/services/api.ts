import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// START_HERE: Change this to your current backend URL
export const BASE_URL = 'https://2a6717c6fa2a.ngrok-free.app/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auto-attach Token
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching token:', error);
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: Handle Errors (e.g., 401 Logout)
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Optional: Trigger logout via a global event emitter or Redux if needed
      // For now, we'll just log it. The UI can react to this if needed.
      console.log('Unauthorized! Token might be expired.');
      // await AsyncStorage.clear(); // Careful with auto-clearing, might annoy user if intermittent
    }
    return Promise.reject(error);
  }
);



export const getOrderById = (orderId: string) => api.get(`/vendor/orders/${orderId}`);
export const acceptOrder = (orderId: string) => api.put(`/vendor/orders/${orderId}/accept`);
export const rejectOrder = (orderId: string, reason: string) => api.put(`/vendor/orders/${orderId}/reject`, { reason });
export const updateVendorProfile = (data: any) => api.put('/vendor/me', data);


export default api;
