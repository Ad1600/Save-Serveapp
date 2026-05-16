import api from './api';
import { BASE_URL } from '../constants/Api';

export const offerService = {
  getOffers: async (params = {}) => {
    try {
      const response = await api.get('/offres', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  searchOffers: async (query) => {
    const trimmedQuery = query?.toString().trim() || '';
    const response = await api.get('/offres/search', {
      params: { query: trimmedQuery },
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Search request failed.');
    }
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  searchOffersPaginated: async (query, page = 1, limit = 12) => {
    try {
      const trimmedQuery = query?.toString().trim() || '';
      const response = await api.get('/offres/search', {
        params: { query: trimmedQuery, page, limit },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Search request failed.');
      }
      return {
        items: Array.isArray(response.data.data) ? response.data.data : [],
        pagination: response.data?.pagination || {
          page, limit, total: 0, totalPages: 1,
          hasNextPage: false, hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      throw new Error(backendMessage || 'Unable to search offers right now.');
    }
  },

  /**
   * ✅ New helper – exactly like getValidAvatarUri but for offer photos.
   * If photo is a full URL, returns it (optionally with cache‑busting).
   * Otherwise constructs URL: BASE_URL/uploads/filename
   */
  getOfferImageUrl: (photo, bustCache = false) => {
    if (!photo) return null;
    if (photo.startsWith('http')) {
      return bustCache ? `${photo}?t=${Date.now()}` : photo;
    }
    const base = `${BASE_URL}/uploads/${photo}`;
    return bustCache ? `${base}?t=${Date.now()}` : base;
  },

  // Deprecated – kept for backward compatibility, but now uses getOfferImageUrl
  formatImageUrl: (photo) => offerService.getOfferImageUrl(photo, false),

  mapLocation: (offer) => {
    if (
      offer.location &&
      offer.location.coordinates &&
      offer.location.coordinates[0] !== 0 &&
      offer.location.coordinates[1] !== 0
    ) {
      return {
        latitude: offer.location.coordinates[1],
        longitude: offer.location.coordinates[0],
      };
    }
    return null;
  },

  getSellerOffers: async () => {
    try {
      const response = await api.get('/offres/seller/mes-offres');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getOfferById: async (offerId) => {
    try {
      const response = await api.get(`/offres/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createOffer: async (formData) => {
    try {
      const response = await api.post('/offres', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateOffer: async (offerId, data) => {
    try {
      const response = await api.put(`/offres/${offerId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateOfferPhoto: async (offerId, formData) => {
    try {
      const response = await api.put(`/offres/${offerId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photo = response.data?.data?.photo ?? null;
      return {
        success: response.data?.success ?? true,
        data: photo,
        message: response.data?.message ?? null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Upload failed',
      };
    }
  },

  deleteOffer: async (offerId) => {
    try {
      const response = await api.delete(`/offres/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};