import axios from 'axios';
import { API_URL } from '../constants/Api';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// This "Interceptor" runs BEFORE every request is sent
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.warn('API 401: Unauthorized request.');
    }

    if (status >= 500) {
      console.warn('API 5xx: Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;