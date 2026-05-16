import api from './api';

export const adminService = {
  getUsers: async (params = {}) => {
    const requestParams = {};
    if (params.page) requestParams.page = params.page;
    if (params.limit) requestParams.limit = params.limit;
    if (params.role) requestParams.role = params.role;

    const response = await api.get('/users', { params: requestParams });

    return {
      success: response.data?.success ?? true,
      data: response.data?.data ?? response.data ?? [],
      message: response.data?.message ?? null,
      pagination: response.data?.pagination ?? null,
    };
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return {
      success: response.data?.success ?? true,
      data: response.data?.data ?? {},
      message: response.data?.message ?? null,
    };
  },

  toggleUserActive: async (userId, actif) => {
    const response = await api.put(`/users/${userId}`, { actif });
    return response.data;
  },

  getSellerRequests: async (status = 'EN_ATTENTE') => {
    const response = await api.get('/vendeur/demandes', {
      params: { statut: status },
    });

    return {
      success: response.data?.success ?? true,
      data: response.data?.data ?? [],
    };
  },

  reviewSellerRequest: async (requestId, action) => {
    const endpoint = action === 'approve' ? 'accepter' : 'refuser';
    const response = await api.put(`/vendeur/demandes/${requestId}/${endpoint}`, {});
    return response.data;
  },

updateCommandeStatus: async (commandeId, statut, raison = null) => {
  const response = await api.put(`/commandes/${commandeId}/status`, { statut, raison });
  return {
    success: response.data?.success ?? true,
    data:    response.data?.data    ?? null,
    message: response.data?.message ?? null,
  };
},

getCommandes: async (params = {}) => {
  const requestParams = {};
  if (params.statut) requestParams.statut = params.statut;
  if (params.page) requestParams.page = params.page;
  if (params.limit) requestParams.limit = params.limit;

  const response = await api.get('/commandes', { params: requestParams });
  return {
    success: response.data?.success ?? true,
    data:    response.data?.data    ?? [],
    message: response.data?.message ?? null,
    pagination: response.data?.pagination ?? null,
    total: response.data?.total ?? null,
  };
},

};

