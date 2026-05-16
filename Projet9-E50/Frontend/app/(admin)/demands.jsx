import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { adminService } from '../../services/adminService';
import * as SecureStore from 'expo-secure-store';
import { getValidAvatarUri } from '../../services/ImageUserServeces';
import AdminHeader from '../../components/adminhead';
import { BASE_URL } from '../../constants/Api';

const STATUS_FILTERS = ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'];

const STATUS_LABELS = {
  EN_ATTENTE: 'Pending',
  ACCEPTEE: 'Accepted',
  REFUSEE: 'Rejected',
};

const STORE_TYPE_META = {
  boulangerie: { label: 'Bakery', icon: 'cafe-outline', color: '#388E3C' },
  restaurant: { label: 'Restaurant', icon: 'restaurant-outline', color: '#D84315' },
  epicerie: { label: 'Grocery', icon: 'cart-outline', color: '#1565C0' },
  autre: { label: 'Other', icon: 'storefront-outline', color: '#6A1B9A' },
};

function getTypeMeta(type) {
  return STORE_TYPE_META[type] || STORE_TYPE_META.autre;
}

function SellerRequestCard({ item, onApprove, onDecline }) {
  const typeMeta = getTypeMeta(item.categorie);
  const isPending = item.statut === 'EN_ATTENTE';
  const isRejected = item.statut === 'REFUSEE';
  const userName = item.user?.nom || '—';
  const userEmail = item.user?.email || '';

  const handleViewPdf = async () => {
    if (!item.documentPdf) {
      Alert.alert('No document', 'No PDF document was submitted with this request.');
      return;
    }
    const pdfUrl = item.documentPdf.startsWith('http')
      ? item.documentPdf
      : `${BASE_URL}/uploads/${item.documentPdf}`;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Cannot open', 'Unable to open the document on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open the document.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeCircle, { backgroundColor: `${typeMeta.color}22` }]}>
          <Ionicons name={typeMeta.icon} size={22} color={typeMeta.color} />
        </View>
        <View style={styles.cardTitleWrapper}>
          <Text style={styles.cardTitle}>{item.nomCommerce}</Text>
          <Text style={styles.cardSubtitle}>{typeMeta.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#4E4E4E" />
          <Text style={styles.cardText}>{userName}</Text>
        </View>
        {!!userEmail && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#4E4E4E" />
            <Text style={styles.cardText}>{userEmail}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#4E4E4E" />
          <Text style={styles.cardText}>{item.telephone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#4E4E4E" />
          <Text style={styles.cardText}>{item.adresseCommerce}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4E4E4E" />
          <Text style={styles.cardText} numberOfLines={2}>{item.descriptionShop}</Text>
        </View>
        <TouchableOpacity
          style={[styles.pdfButton, !item.documentPdf && styles.pdfButtonDisabled]}
          onPress={handleViewPdf}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={16} color={item.documentPdf ? '#1565C0' : '#BDBDBD'} />
          <Text style={[styles.pdfButtonText, !item.documentPdf && styles.pdfButtonTextDisabled]}>
            {item.documentPdf ? 'View Business Document' : 'No document submitted'}
          </Text>
          {item.documentPdf && <Ionicons name="open-outline" size={14} color="#1565C0" />}
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        {isPending ? (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => onApprove(item._id)}>
              <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={() => onDecline(item._id)}>
              <Text style={[styles.actionText, styles.declineText]}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.statusFooter}>
            <View style={[styles.statusBadge, item.statut === 'ACCEPTEE' ? styles.statusApproved : styles.statusRejected]}>
              <Text style={[styles.statusBadgeText, item.statut === 'ACCEPTEE' ? styles.statusApprovedText : styles.statusRejectedText]}>
                {STATUS_LABELS[item.statut] || item.statut}
              </Text>
            </View>
            {isRejected && item.raisonRefus ? (
              <Text style={styles.rejectionReason} numberOfLines={2}>{item.raisonRefus}</Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

export default function DemandsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('EN_ATTENTE');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');

  const fetchRequests = async (status = activeFilter) => {
    try {
      const result = await adminService.getSellerRequests(status);
      setRequests(result.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeFilter);
  }, [activeFilter]);


    useFocusEffect(
    useCallback(() => {
      fetchRequests(activeFilter);

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
          console.error('Failed to load avatar in users', e);
        }
      };
      loadAvatar();
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests(activeFilter);
  };

  const handleApprove = async (id) => {
    await adminService.reviewSellerRequest(id, 'approve');
    fetchRequests(activeFilter);
  };

  const handleDecline = async (id) => {
    await adminService.reviewSellerRequest(id, 'reject');
    fetchRequests(activeFilter);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
   
        <AdminHeader title="Seller Requests" avatarUri={avatarUri} avatarLetter={userName.charAt(0).toUpperCase() || 'U'} />
  

      <View style={styles.tabRow}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.tabButton, activeFilter === filter && styles.tabButtonActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.tabText, activeFilter === filter && styles.tabTextActive]}>
              {STATUS_LABELS[filter] || filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      >
        {requests.length > 0 ? (
          requests.map((request) => (
            <SellerRequestCard
              key={request._id}
              item={request}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#A5D6A7" />
            <Text style={styles.emptyTitle}>No requests here yet</Text>
            <Text style={styles.emptySubtitle}>Try another status tab to continue reviewing sellers.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 5, backgroundColor: '#F1F8F1' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#A5D6A7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerAvatarText: { color: '#1B5E20', fontWeight: '700', fontSize: 13 },
  headerTitleWrapper: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  bellBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 24, paddingTop: 15 },
  tabButton: { flex: 1, paddingVertical: 11, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#4D4D4D' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  typeCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardTitleWrapper: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 2 },
  cardSubtitle: { color: '#4E4E4E', fontSize: 13, fontWeight: '600' },
  cardBody: { gap: 10, marginBottom: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardText: { color: '#4B4B4B', fontSize: 14, lineHeight: 20, flexShrink: 1, flex: 1 },
  pdfButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#BFDBFE', marginTop: 4,
  },
  pdfButtonDisabled: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  pdfButtonText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1565C0' },
  pdfButtonTextDisabled: { color: '#BDBDBD' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  approveButton: { backgroundColor: '#2E7D32' },
  declineButton: { backgroundColor: '#F1F5F1', borderWidth: 1, borderColor: '#D7E4D7' },
  actionText: { fontSize: 14, fontWeight: '700' },
  approveText: { color: '#FFFFFF' },
  declineText: { color: '#4A4A4A' },
  statusBadge: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18, alignSelf: 'flex-start' },
  statusApproved: { backgroundColor: '#E8F5E9' },
  statusRejected: { backgroundColor: '#FDECEA' },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  statusApprovedText: { color: '#1B5E20' },
  statusRejectedText: { color: '#B71C1C' },
  statusFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rejectionReason: { color: '#7F1D1D', fontSize: 12, flexShrink: 1, flex: 1 },
  emptyContainer: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { marginTop: 18, fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  emptySubtitle: { marginTop: 8, fontSize: 14, color: '#63746D', textAlign: 'center', lineHeight: 20 },
});
