import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { OrdersTabs } from '../../components/orders/OrdersTabs';
import { OrderCard } from '../../components/orders/OrderCard';
import ReviewModal from '../../components/orders/ReviewModal';
import AdminHeader from '../../components/adminhead';
import * as SecureStore from 'expo-secure-store';
import { getValidAvatarUri } from '../../services/ImageUserServeces';

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [reviewOrder, setReviewOrder] = useState(null);

  // Handle tab switching via params
  useEffect(() => {
    if (params.tab === 'history') {
      setActiveTab('history');
    } else if (params.tab === 'active') {
      setActiveTab('active');
    }
  }, [params.tab]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [screenError, setScreenError] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');
  const lastFetchRef = useRef(0);

  const activeStatuses = ['PENDING', 'CONFIRMED', 'READY'];
  const historyStatuses = ['COLLECTED', 'CANCELLED'];

  const fetchOrders = useCallback(async (silent = false) => {
    lastFetchRef.current = Date.now();
    if (!silent) setLoading(true);
    setScreenError('');
    try {
      const backendOrders = await orderService.getMyOrders();
      setOrders(backendOrders);
    } catch (error) {
      setScreenError(error?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchRef.current < 500) return;
      fetchOrders(true);
    }, [fetchOrders])
  );

  useFocusEffect(
    useCallback(() => {
      const loadAvatar = async () => {
        try {
          const raw = await SecureStore.getItemAsync('userData');
          if (raw) {
            const user = JSON.parse(raw);
            setUserName(user.nom || user.name || '');
            const uri = await getValidAvatarUri(user.photo, true);
            setAvatarUri(uri ?? user.avatar ?? null);
          }
        } catch (e) {}
      };
      loadAvatar();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (actionLoadingId) return;
    setActionLoadingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId ? { ...order, status: 'CANCELLED', pickupTime: 'Cancelled' } : order
        )
      );
    } catch (error) {
      setScreenError(error?.message || 'Unable to cancel order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOrderPress = (order) => {
    if (!order.rawOffer) return;
    router.push({
      pathname: '/offerDetails',
      params: { offer: JSON.stringify(order.rawOffer) },
    });
  };

  const filteredOrders = orders.filter(order =>
    activeTab === 'active'
      ? activeStatuses.includes(order.status)
      : historyStatuses.includes(order.status)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <AdminHeader
        title="My Orders"
        avatarUri={avatarUri}
        avatarLetter={userName.charAt(0).toUpperCase() || 'U'}
        onAvatarPress={() => router.push('/(tabs)/levels')}
      />

      <View style={styles.container}>
        <OrdersTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {loading && orders.length === 0 ? (
            <Text style={styles.emptyText}>Loading orders...</Text>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => handleOrderPress(order)}
                onCancel={
                  activeTab === 'active' && !actionLoadingId
                    ? () => handleCancelOrder(order.id)
                    : undefined
                }
                onRate={activeTab === 'history' ? () => setReviewOrder(order) : undefined}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No orders found.</Text>
          )}
        </ScrollView>
      </View>

      <ReviewModal
        visible={!!reviewOrder}
        orderId={reviewOrder?.id}
        onClose={() => setReviewOrder(null)}
        onSubmit={async (reviewData) => {
          await orderService.submitReview(reviewData);
          // Mark locally as rated so the button disappears immediately
          setOrders(currentOrders => 
            currentOrders.map(order => 
              order.id === reviewOrder.id ? { ...order, isRated: true } : order
            )
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontSize: 16 },
});