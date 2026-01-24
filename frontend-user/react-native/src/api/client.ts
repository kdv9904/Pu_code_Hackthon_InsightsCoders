import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// UPDATE THIS BASE URL IF NGROK CHANGES
const BASE_URL = 'https://2a6717c6fa2a.ngrok-free.app/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
client.interceptors.request.use(
  async (config) => {
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Errors
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.log('API Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        // Handle unauthorized (optional: logout user)
        console.log('Unauthorized access - maybe token expired?');
      }
    } else if (error.request) {
      // Request made but no response received
      console.log('Network Error:', error.request);
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else {
      // Something happened in setting up the request
      console.log('Error', error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
