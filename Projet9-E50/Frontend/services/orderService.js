import api from './api';
import { BASE_URL } from '../constants/Api';

const ORDER_STATUS_MAP = {
  EN_ATTENTE: 'PENDING',
  CONFIRMEE: 'CONFIRMED',
  PRETE: 'READY',
  RECUPEREE: 'COLLECTED',
  ANNULEE: 'CANCELLED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  READY: 'READY',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED',
};

const DEFAULT_ORDER_IMAGE =
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop';

const buildImageUrl = (photo) => {
  if (!photo) return DEFAULT_ORDER_IMAGE;
  if (photo.startsWith('http')) return photo;
  return `${BASE_URL}/uploads/${photo}`;
};

const formatPickupTime = (status, pickupDeadline) => {
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'COLLECTED') return 'Collected';
  if (!pickupDeadline) return 'Pickup pending';
  const date = new Date(pickupDeadline);
  if (Number.isNaN(date.getTime())) return 'Pickup pending';
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Before ${time}`;
};

const mapApiOrderToUiOrder = (rawOrder) => {
  const status = ORDER_STATUS_MAP[rawOrder?.statut] || 'PENDING';
  const unitPrice = Number(rawOrder?.prixUnitaire ?? rawOrder?.offre?.prix ?? 0);
  const quantity = Number(rawOrder?.quantite || 1);

  const offre      = rawOrder?.offre      || {};
  const commercant = rawOrder?.commercant || {};

  // ✅ Extract coordinates from every possible location in the raw API response
  // Priority: offer.location.coordinates → offer.latitude/longitude → commercant.latitude/longitude
  let resolvedLat, resolvedLng;

  if (
    Array.isArray(offre.location?.coordinates) &&
    offre.location.coordinates.length >= 2
  ) {
    resolvedLng = Number(offre.location.coordinates[0]);
    resolvedLat = Number(offre.location.coordinates[1]);
  } else if (offre.latitude != null && offre.longitude != null) {
    resolvedLat = Number(offre.latitude);
    resolvedLng = Number(offre.longitude);
  } else if (commercant.latitude != null && commercant.longitude != null) {
    resolvedLat = Number(commercant.latitude);
    resolvedLng = Number(commercant.longitude);
  } else if (commercant.location?.coordinates?.length >= 2) {
    resolvedLng = Number(commercant.location.coordinates[0]);
    resolvedLat = Number(commercant.location.coordinates[1]);
  }

  const hasValidCoords =
    resolvedLat != null &&
    resolvedLng != null &&
    !isNaN(resolvedLat) &&
    !isNaN(resolvedLng) &&
    !(resolvedLat === 0 && resolvedLng === 0);

  return {
    id: rawOrder?._id,
    status,
    storeName: commercant?.nomCommerce || commercant?.nom || 'Store',
    description: offre?.titre || 'Order',
    pickupTime: formatPickupTime(status, rawOrder?.pickupDeadline),
    price: unitPrice * quantity,
    location: commercant?.adresse || offre?.adresse || 'Address unavailable',
    image: buildImageUrl(offre?.photo),
    pickupCode: rawOrder?.codeRetrait || null, // Map backend codeRetrait to pickupCode
    isRated: rawOrder?.isRated || false,
    rawOffer: offre ? {
      ...offre,
      commercant,
      // ✅ Explicitly forward resolved coordinates so offerDetails always finds them
      ...(hasValidCoords ? { latitude: resolvedLat, longitude: resolvedLng } : {}),
    } : null,
  };
};

const mapSellerOrder = (rawOrder) => {
  const status = ORDER_STATUS_MAP[rawOrder?.statut] || 'PENDING';
  const unitPrice = Number(rawOrder?.prixUnitaire ?? rawOrder?.offre?.prix ?? 0);
  const quantity = Number(rawOrder?.quantite || 1);

  return {
    id: rawOrder?._id,
    status,
    customerName: rawOrder?.client?.nom || 'Client',
    customerPhone: rawOrder?.client?.telephone || '',
    items: `${quantity}x ${rawOrder?.offre?.titre || 'Order'}`,
    quantity,
    amount: unitPrice * quantity,
    pickupCode: rawOrder?.codeRetrait || '',
    notes: rawOrder?.notes || '',
    createdAt: rawOrder?.createdAt,
  };
};

export const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/commandes', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  validateCoupon: async (code) => {
    const response = await api.get(`/bons/valider/${code}`);
    return response.data;
  },

  getMyOrders: async () => {
    try {
      const response = await api.get('/commandes/mes-commandes');
      const apiOrders = response?.data?.data || [];
      return apiOrders.map(mapApiOrderToUiOrder);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  submitReview: async (reviewData) => {
    try {
      const response = await api.post('/avis', reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  cancelOrder: async (orderId, reason = 'Cancelled from mobile app') => {
    try {
      const response = await api.delete(`/commandes/${orderId}/annuler`, {
        data: { raison: reason },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ── Seller methods ─────────────────────────────────────────────────────────

  getSellerOrders: async () => {
    try {
      const response = await api.get('/commandes/mes-offres');
      const apiOrders = response?.data?.data || [];
      return apiOrders.map(mapSellerOrder);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  confirmOrder: async (orderId) => {
    try {
      const response = await api.put(`/commandes/${orderId}/confirmer`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  markOrderReady: async (orderId) => {
    try {
      const response = await api.put(`/commandes/${orderId}/prete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  validatePickup: async (orderId, codeRetrait) => {
    try {
      const response = await api.put(`/commandes/${orderId}/recuperee`, { codeRetrait });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  rejectOrder: async (orderId, reason = 'Refused by seller') => {
    try {
      const response = await api.put(`/commandes/${orderId}/refuser`, { raison: reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};