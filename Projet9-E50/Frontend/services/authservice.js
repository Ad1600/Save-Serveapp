import api from './api';
import * as SecureStore from 'expo-secure-store';

// In-memory token for compatibility with legacy reset-password flow.
// Not persisted to storage to avoid keeping sensitive data at rest.
let legacyResetToken = null;

export const authService = {
  // Matches backend router.post('/inscription')
  register: async (userData) => {
    const response = await api.post('/auth/inscription', userData);
    return response.data;
  },

  // Matches backend router.post('/connexion')
  login: async (email, motDePasse) => {
    const response = await api.post('/auth/connexion', { email, motDePasse });
    return response.data;
  },

  // Matches backend router.post('/verifier-email')
  verifyEmail: async (email, code) => {
    const response = await api.post('/auth/verifier-email', { email, code });
    return response.data;
  },
  resendCode: async (email) => {
    const response = await api.post('/auth/renvoyer-code', { email });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/deconnexion');
    return response.data;
  },
  getStoredUser: async () => {
    const raw = await SecureStore.getItemAsync('userData');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  ,
  updateProfile: async (profileData) => {
    // profileData should contain { nom, telephone, adresse }
    const response = await api.put('/auth/profil', profileData);
    return response.data;
  },

  // Forgot password step 1
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Forgot password step 2
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      if (error?.response?.status === 404) {
        const fallback = await api.post('/auth/verifier-code-reset', { email, code: otp });
        legacyResetToken = fallback?.data?.data?.resetToken || null;
        return fallback.data;
      }
      throw error;
    }
  },

  // Forgot password step 3
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      legacyResetToken = null;
      return response.data;
    } catch (error) {
      if (error?.response?.status === 404) {
        if (!legacyResetToken) {
          throw new Error('Reset session expired. Please verify OTP again.');
        }

        const fallback = await api.post('/auth/reinitialiser-mot-de-passe', {
          resetToken: legacyResetToken,
          nouveauMotDePasse: newPassword,
        });
        legacyResetToken = null;
        return fallback.data;
      }
      throw error;
    }
  },

  changePassword: async ({ ancienMotDePasse, nouveauMotDePasse }) => {
  const response = await api.put('/auth/changer-mot-de-passe', {
    ancienMotDePasse,
    nouveauMotDePasse,
  });
  return response.data;
},
};