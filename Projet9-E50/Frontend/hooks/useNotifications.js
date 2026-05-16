import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { BASE_URL } from '../constants/Api';
import { authService } from '../services/authservice';
import { notificationService } from '../services/notificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const EVENT_TYPE_TO_CARD_TYPE = {
  reservationCreated: 'order',
  reservationConfirmed: 'order',
  orderReady: 'reminder',
  'nouvelle-notification': 'support',
};

const ROLE_ROOM = {
  admin: (id) => 'admin_room',
  commercant: (id) => `seller_${id}`,
  seller: (id) => `seller_${id}`,
  client: (id) => `user_${id}`,
};

const getRoomName = (role, userId) => {
  const build = ROLE_ROOM[role] || ROLE_ROOM.client;
  return build(userId);
};

const toUiNotificationFromSocket = (eventName, payload = {}) => ({
  id: payload.id || payload._id || `${eventName}-${Date.now()}`,
  title: payload.title || payload.titre || 'Notification',
  message: payload.message || payload.description || '',
  type: payload.type || EVENT_TYPE_TO_CARD_TYPE[eventName] || 'order',
  read: Boolean(payload.read || payload.lu),
  createdAt: payload.createdAt || new Date().toISOString(),
  raw: payload,
});

const upsertNewest = (prev, incoming) => {
  const withoutSame = prev.filter((item) => item.id !== incoming.id);
  return [incoming, ...withoutSame];
};

const mergeNotificationLists = (current, incoming) => {
  const map = new Map();

  [...current, ...incoming].forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
};

export const useNotifications = (forcedRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const userRef = useRef(null);

  const role = useMemo(() => {
    if (forcedRole) return forcedRole;
    return userRef.current?.role || 'client';
  }, [forcedRole]);

  const triggerLocalPush = useCallback(async (notification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message || 'You have a new notification',
          data: { type: notification.type },
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('Local notification failed:', error?.message || error);
    }
  }, []);

  const PAGE_SIZE = 20;

  const fetchNotificationsPage = useCallback(async (targetPage, mode = 'page') => {
    const currentUser = userRef.current || (await authService.getStoredUser());
    userRef.current = currentUser;

    const result = await notificationService.getNotifications(targetPage, PAGE_SIZE);
    const incoming = result.notifications || [];
    const pagination = result.pagination || {};

    setNotifications((prev) => {
      const base = mode === 'append' ? prev : [];
      return mergeNotificationLists(base, incoming);
    });
    setUnreadCount(result.unreadCount || 0);
    setPage(pagination.page || targetPage);
    setHasMore(Boolean(pagination.hasNextPage));
    setTotalCount(typeof pagination.total === 'number' ? pagination.total : incoming.length);
    setLastUpdatedAt(new Date().toISOString());
  }, []);

  const refreshNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotificationsPage(1, 'refresh');
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotificationsPage]);

  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore || refreshing || loading || !hasMore) return;

    setLoadingMore(true);
    try {
      await fetchNotificationsPage(page + 1, 'append');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchNotificationsPage, hasMore, loading, loadingMore, page, refreshing]);

  const markAsRead = useCallback(async (id) => {
    await notificationService.markAsRead(id);

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (e) {
      console.warn('markAllAsRead API failed:', e?.message || e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        const user = await authService.getStoredUser();
        userRef.current = user;

        if (!user?._id) {
          if (mounted) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
          }
          return;
        }

        await refreshNotifications();

        const socket = io(BASE_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setSocketConnected(true);

          const room = getRoomName(forcedRole || user.role, user._id);

          socket.emit('join', {
            userId: user._id,
            role: forcedRole || user.role,
            room,
          });

          // New explicit room API (kept in addition to join for backward compatibility)
          socket.emit('joinRoom', {
            room,
            userId: user._id,
            role: forcedRole || user.role,
          });
        });

        socket.on('disconnect', () => setSocketConnected(false));

        const handleSocketEvent = async (eventName, payload) => {
          const incoming = toUiNotificationFromSocket(eventName, payload);
          let isNew = false;

          setNotifications((prev) => {
            isNew = !prev.some((item) => item.id === incoming.id);
            return upsertNewest(prev, incoming);
          });

          if (isNew) {
            if (!incoming.read) {
              setUnreadCount((prev) => prev + 1);
            }
            await triggerLocalPush(incoming);
          }
        };

        socket.on('reservationCreated', (payload) => handleSocketEvent('reservationCreated', payload));
        socket.on('reservationConfirmed', (payload) => handleSocketEvent('reservationConfirmed', payload));
        socket.on('orderReady', (payload) => handleSocketEvent('orderReady', payload));

        // Support messages and generic backend notifications
        socket.on('nouvelle-notification', (payload) => handleSocketEvent('nouvelle-notification', payload));
      } catch (error) {
        console.warn('Notifications setup failed:', error?.message || error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [forcedRole, refreshNotifications, triggerLocalPush]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalCount,
    lastUpdatedAt,
    socketConnected,
    role,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
  };
};
