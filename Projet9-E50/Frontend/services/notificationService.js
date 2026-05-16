import api from './api';

const toUiNotification = (item) => ({
  id: item._id || item.id,
  title: item.titre || item.title || 'Notification',
  message: item.message || item.description || '',
  type: item.type || 'order',
  read: Boolean(item.lu || item.read),
  createdAt: item.createdAt || item.date || new Date().toISOString(),
  raw: item,
});

export const notificationService = {
  async getNotifications(page = 1, limit = 20) {
    const response = await api.get('/stats/notifications', {
      params: { page, limit },
    });
    const apiList = response?.data?.data || [];
    const mapped = apiList.map(toUiNotification);
    const pagination = response?.data?.pagination || {
      page,
      limit,
      total: mapped.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    };

    return {
      success: response?.data?.success ?? true,
      notifications: mapped,
      unreadCount: typeof response?.data?.nonLues === 'number'
        ? response.data.nonLues
        : mapped.filter((item) => !item.read).length,
      pagination,
    };
  },

  async markAsRead(id) {
    const response = await api.put(`/stats/notifications/${id}/lu`);
    return {
      success: response?.data?.success ?? true,
      message: response?.data?.message || 'Notification marked as read',
    };
  },

  async markAllAsRead() {
    const response = await api.put('/stats/notifications/mark-all-read');
    return {
      success: response?.data?.success ?? true,
      message: response?.data?.message || 'All notifications marked as read',
    };
  },

  async getUnreadCount() {
    const response = await api.get('/stats/notifications');
    const apiList = response?.data?.data || [];
    if (typeof response?.data?.nonLues === 'number') {
      return response.data.nonLues;
    }

    return apiList.map(toUiNotification).filter((item) => !item.read).length;
  },
};
