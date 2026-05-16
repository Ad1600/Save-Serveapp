// Set EXPO_PUBLIC_API_URL to override per environment/device.
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const BASE_URL = ENV_BASE_URL || 'http://10.54.165.13:5000';
export const API_URL = `${BASE_URL}/api`;