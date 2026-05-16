import api from './api';

const toggleFavorite = async (offerId) => {
  const res = await api.post('/favorites/toggle', { offerId });
  return res.data;
};

const getFavorites = async () => {
  const res = await api.get('/favorites');
  return res.data;
};

export default { toggleFavorite, getFavorites };
