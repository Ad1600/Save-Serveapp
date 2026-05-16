import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { adminService } from '../../services/adminService';
import { getValidAvatarUri } from '../../services/ImageUserServeces';
import AdminHeader from '../../components/adminhead';
import * as SecureStore from 'expo-secure-store';

const FILTER_ROWS = [
  ['All Orders', 'Confirmed', 'Ready'],
  ['Picked Up', 'Cancelled', 'Pending'],
];

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getStatusStyle(status) {
  switch (status) {
    case 'Ready':     return { bg: '#DCFCE7', color: '#166534' };
    case 'Confirmed': return { bg: '#E2E8F0', color: '#475569' };
    case 'Picked Up': return { bg: '#FFF3E0', color: '#F57C00' };
    case 'Cancelled': return { bg: '#FEE2E2', color: '#DC2626' };
    case 'Pending':   return { bg: '#DCFCE7', color: '#15803D' };
    default:          return { bg: '#F1F5F9', color: '#475569' };
  }
}

function OrderCard({ order }) {
  const { bg, color } = getStatusStyle(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: order.sellerAvatarColor }]}>
          <Text style={styles.avatarText}>{getInitials(order.sellerName)}</Text>
        </View>

        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.sellerName, isCancelled && styles.dimmedText]}>
            {order.sellerName}
          </Text>
          <Text style={styles.orderId}>#{order.id}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Customer</Text>
        <Text style={[styles.detailValue, isCancelled && styles.dimmedText]}>{order.customerName}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Items</Text>
        <Text style={[styles.detailValue, isCancelled && styles.dimmedText]}>{order.itemsSummary}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Amount</Text>
        <Text style={[styles.detailAmount, isCancelled && styles.dimmedText]}>{order.amount.toLocaleString()} DA</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const PAGE_SIZE = 20;
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');

  const mapStatus = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'Pending';
      case 'CONFIRMEE': return 'Confirmed';
      case 'PRETE': return 'Ready';
      case 'RECUPEREE': return 'Picked Up';
      case 'ANNULEE': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const mapOrder = (c) => ({
    id: c.codeRetrait || c._id,
    sellerName: c.commercant?.nomCommerce || c.commercant?.nom || '—',
    sellerAvatarColor: '#2E7D32',
    customerName: c.client?.nom || '—',
    itemsSummary: `${c.quantite} item${c.quantite > 1 ? 's' : ''} • ${c.offre?.titre || '—'}`,
    amount: c.prixTotal ?? 0,
    status: mapStatus(c.statut),
  });

  const statusFilterMap = {
    'All Orders': null,
    Confirmed: 'CONFIRMEE',
    Ready: 'PRETE',
    'Picked Up': 'RECUPEREE',
    Cancelled: 'ANNULEE',
    Pending: 'EN_ATTENTE',
  };

  const fetchOrders = async ({ showLoading = false, pageToLoad = 1, append = false } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await adminService.getCommandes({
        statut: statusFilterMap[activeFilter],
        page: pageToLoad,
        limit: PAGE_SIZE,
      });

      const mapped = (result.data ?? []).map(mapOrder);
      setOrders((prev) => (append ? [...prev, ...mapped] : mapped));
      setPage(result?.pagination?.page || pageToLoad);
      setHasMore(Boolean(result?.pagination?.hasNextPage));
      setTotalOrders(result?.pagination?.total ?? mapped.length);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders({ showLoading: true, pageToLoad: 1 });
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders({ pageToLoad: 1 });

      const loadAvatar = async () => {
        try {
          const raw = await SecureStore.getItemAsync('userData');
          if (raw) {
            const user = JSON.parse(raw);
            setUserName(user.nom || user.name || '');
            const uri = await getValidAvatarUri(user.photo, true);
            setAvatarUri(uri ?? user.avatar ?? null);
          }
        } catch (e) {
          console.error('Failed to load avatar in orders', e);
        }
      };
      loadAvatar();
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders({ pageToLoad: 1 });
  };

  const onLoadMore = () => {
    if (!hasMore || loadingMore || refreshing || loading) return;
    setLoadingMore(true);
    fetchOrders({ pageToLoad: page + 1, append: true });
  };

  const avatarLetter = userName.charAt(0).toUpperCase() || 'U';

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminHeader title="Orders" avatarUri={avatarUri} avatarLetter={avatarLetter} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminHeader title="Orders" avatarUri={avatarUri} avatarLetter={avatarLetter} />
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#BDBDBD" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchOrders({ showLoading: true, pageToLoad: 1 })}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AdminHeader title="Orders" avatarUri={avatarUri} avatarLetter={avatarLetter} />

      <View style={styles.filterWrapper}>
        {FILTER_ROWS.map((row, i) => (
          <View key={i} style={styles.filterRow}>
            {row.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}
                  numberOfLines={1}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{totalOrders} orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#C8E6C9" />
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}

        {hasMore && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : (
              <Text style={styles.loadMoreText}>Load more orders</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 5, backgroundColor: '#F1F8F1' },
  filterWrapper: { paddingHorizontal: 16, gap: 8, marginBottom: 20, paddingTop:15 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterTabText: { fontSize: 12, fontWeight: '500', color: '#555' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  metaRow: { paddingHorizontal: 16, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  loadMoreBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadMoreText: { color: '#2E7D32', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 8, fontSize: 15 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardCancelled: { backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#FFCDD2' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardHeaderInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  orderId: { fontSize: 11, color: '#BDBDBD', fontWeight: '400' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '400' },
  detailValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  detailAmount: { fontSize: 18, color: '#1A1A1A', fontWeight: '800' },
  dimmedText: { color: '#BDBDBD' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: '#9E9E9E', marginTop: 8 },
  errorText: { fontSize: 14, color: '#C62828', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 28, paddingVertical: 11, borderRadius: 20, marginTop: 4 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
