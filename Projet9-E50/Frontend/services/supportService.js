import api from './api';

export const supportService = {
  sendMessage: async ({ sujet, message }) => {
    const response = await api.post('/support', { sujet, message });
    return response.data;
  },

  getMessages: async () => {
    const response = await api.get('/support');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/support/${id}/lu`);
    return response.data;
  },
};
