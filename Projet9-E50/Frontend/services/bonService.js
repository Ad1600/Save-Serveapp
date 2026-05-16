import api from './api';

export const bonService = {
  getMesBons: async () => {
    try {
      const response = await api.get('/bons/mes-bons');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      return { success: false, data: [], message: error?.response?.data?.message || error.message };
    }
  },

  getTotalDepense: async () => {
    try {
      const response = await api.get('/commandes/mes-commandes');
      const commandes = response.data.data || [];
      const recuperated = commandes.filter(c => c.statut === 'RECUPEREE');
      const total = recuperated.reduce((sum, c) => sum + (c.prixTotal || 0), 0);
      const mealsSaved = recuperated.reduce((sum, c) => sum + (c.quantite || 0), 0);
      const co2Saved = parseFloat((mealsSaved * 2.5).toFixed(2));
      return { success: true, total, mealsSaved, co2Saved };
    } catch (error) {
      return { success: false, total: 0, mealsSaved: 0, co2Saved: 0 };
    }
  },
};