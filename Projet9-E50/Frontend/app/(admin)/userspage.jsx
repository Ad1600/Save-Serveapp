import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { adminService } from '../../services/adminService';
import { BASE_URL } from '../../constants/Api';
import * as SecureStore from 'expo-secure-store';
import AdminHeader from '../../components/adminhead';
import { getValidAvatarUri } from '../../services/ImageUserServeces';

const ROLE_LABEL = { client: 'Client', commercant: 'Seller', admin: 'Admin' };
const PAGE_SIZE = 20;

const formatJoinedDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const mapUser = (user) => {
  const rawPhoto = user.photo || user.avatar || null;
  const avatar = rawPhoto
    ? rawPhoto.startsWith('http')
      ? rawPhoto
      : `${BASE_URL}/uploads/${rawPhoto}`
    : null;

  return {
    id: user._id || user.id,
    name: user.nom || user.name || 'User',
    email: user.email || '',
    role: ROLE_LABEL[user.role] || 'Client',
    joinedDate: formatJoinedDate(user.createdAt || user.joinedDate),
    avatar,
    blocked: user.actif === false || user.blocked === true,
  };
};

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleBadgeStyle(role) {
  switch (role) {
    case 'Seller': return { container: styles.badgeSeller, text: styles.badgeSellerText };
    case 'Client': return { container: styles.badgeClient, text: styles.badgeClientText };
    case 'Admin': return { container: styles.badgeAdmin, text: styles.badgeAdminText };
    default: return { container: styles.badgeSeller, text: styles.badgeSellerText };
  }
}

function getAvatarBg(role) {
  switch (role) {
    case 'Seller': return '#1B5E20';
    case 'Client': return '#0D47A1';
    case 'Admin': return '#2E7D32';
    default: return '#555';
  }
}

function UserCard({ user, onToggleBlock }) {
  const badge = getRoleBadgeStyle(user.role);
  const isAdmin = user.role === 'Admin';
  const isBlocked = user.blocked;

  const handleToggleBlock = () => {
    if (isBlocked) {
      Alert.alert('Unblock User', `Allow ${user.name} to access the platform again?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => onToggleBlock(user.id) },
      ]);
    } else {
      Alert.alert('Block User', `Are you sure you want to block ${user.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => onToggleBlock(user.id) },
      ]);
    }
  };

  return (
    <View style={[styles.card, isBlocked && styles.cardBlocked]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={[styles.avatar, isBlocked && styles.avatarDimmed]} />
          ) : (
            <View style={[styles.avatarInitials, { backgroundColor: isBlocked ? '#BDBDBD' : getAvatarBg(user.role) }]}>
              <Text style={styles.avatarInitialsText}>{getInitials(user.name)}</Text>
            </View>
          )}
          {isBlocked && (
            <View style={styles.avatarBlockedOverlay}>
              <Ionicons name="ban" size={16} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.userName, isBlocked && styles.userNameBlocked]}>{user.name}</Text>
          <Text style={styles.joinedDate}>Joined {user.joinedDate}</Text>
        </View>

        {!isAdmin && (
          <TouchableOpacity
            style={[styles.blockBtn, isBlocked ? styles.unblockBtn : styles.blockBtnActive]}
            onPress={handleToggleBlock}
          >
            <Ionicons name={isBlocked ? 'lock-open-outline' : 'ban'} size={15} color={isBlocked ? '#2E7D32' : '#C62828'} />
            <Text style={[styles.blockBtnText, isBlocked ? styles.unblockBtnText : styles.blockBtnTextRed]}>
              {isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.badge, badge.container]}>
          <Text style={[styles.badgeText, badge.text]}>{user.role}</Text>
        </View>
        {isBlocked && (
          <View style={styles.blockedBadge}>
            <Ionicons name="ban" size={11} color="#C62828" />
            <Text style={styles.blockedBadgeText}>Blocked</Text>
          </View>
        )}
      </View>

      <Text style={[styles.email, isBlocked && styles.emailBlocked]}>{user.email}</Text>
    </View>
  );
}

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');

  const roleFilterMap = {
    All: null,
    Sellers: 'seller',
    Clients: 'client',
    Admins: 'admin',
  };

  const loadUsers = async ({ pageToLoad = 1, append = false, showLoading = false } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const result = await adminService.getUsers({
        page: pageToLoad,
        limit: PAGE_SIZE,
        role: roleFilterMap[activeFilter],
      });

      const usersData = result?.data ?? [];
      const mapped = Array.isArray(usersData) ? usersData.map(mapUser) : [];

      setUsers((prev) => (append ? [...prev, ...mapped] : mapped));
      setPage(result?.pagination?.page || pageToLoad);
      setHasMore(Boolean(result?.pagination?.hasNextPage));
      setTotalUsers(result?.pagination?.total ?? mapped.length);
    } catch (error) {
      console.warn('Error fetching users', error);
      if (!append) setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Reload users list when filter changes
  useEffect(() => {
    loadUsers({ pageToLoad: 1, showLoading: true });
  }, [activeFilter]);

  // On screen focus: reload users list + reload avatar from SecureStore
  useFocusEffect(
    useCallback(() => {
      loadUsers({ pageToLoad: 1 });

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
    loadUsers({ pageToLoad: 1 });
  };

  const onLoadMore = () => {
    if (!hasMore || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    loadUsers({ pageToLoad: page + 1, append: true });
  };

  const handleToggleBlock = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    // target.blocked means isCurrentlyBlocked. 
    // To unblock, we send actif=true. To block, we send actif=false.
    const newActif = target.blocked; 

    try {
      await adminService.toggleUserActive(id, newActif);
      loadUsers({ pageToLoad: 1, showLoading: true });
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
     
      <AdminHeader
        title="Users"
        avatarUri={avatarUri}
        avatarLetter={userName.charAt(0).toUpperCase() || 'U'}
      />

      <View style={styles.tabRow}>
        {['All', 'Sellers', 'Clients', 'Admins'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.tabButton, activeFilter === filter && styles.tabButtonActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.tabText, activeFilter === filter && styles.tabTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{totalUsers} users</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      >
        {users.length > 0 ? (
          users.map((user) => <UserCard key={user.id} user={user} onToggleBlock={handleToggleBlock} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#A5D6A7" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>Try another filter or pull to refresh.</Text>
          </View>
        )}

        {hasMore && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator size="small" color="#2E7D32" />
              : <Text style={styles.loadMoreText}>Load more users</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 5, backgroundColor: '#F1F8F1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  bellButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16, paddingTop: 15 },
  tabButton: { flex: 1, paddingVertical: 11, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#4D4D4D' },
  tabTextActive: { color: '#FFFFFF' },
  metaRow: { paddingHorizontal: 16, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  cardBlocked: { backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#F5D0D0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrapper: { width: 54, height: 54, marginRight: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarDimmed: { opacity: 0.45 },
  avatarInitials: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarInitialsText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  avatarBlockedOverlay: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#C62828', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  cardInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: '#111' },
  userNameBlocked: { color: '#8B8B8B' },
  joinedDate: { marginTop: 4, color: '#6B7280', fontSize: 13 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  blockBtnActive: { backgroundColor: '#FFF1F1' },
  unblockBtn: { backgroundColor: '#E8F5E9' },
  blockBtnText: { fontSize: 13, fontWeight: '700' },
  blockBtnTextRed: { color: '#C62828' },
  unblockBtnText: { color: '#2E7D32' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeSeller: { backgroundColor: '#E8F5E9' },
  badgeClient: { backgroundColor: '#E3F2FD' },
  badgeAdmin: { backgroundColor: '#F3E5F5' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeSellerText: { color: '#1B5E20' },
  badgeClientText: { color: '#0D47A1' },
  badgeAdminText: { color: '#6A1B9A' },
  blockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FDECEA', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  blockedBadgeText: { color: '#C62828', fontSize: 11, fontWeight: '700' },
  email: { marginTop: 12, color: '#374151', fontSize: 13 },
  emailBlocked: { color: '#9CA3AF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { marginTop: 48, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { marginTop: 18, fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  emptySubtitle: { marginTop: 8, fontSize: 14, color: '#63746D', textAlign: 'center', lineHeight: 20 },
  loadMoreBtn: { marginTop: 4, borderWidth: 1, borderColor: '#C8E6C9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadMoreText: { color: '#2E7D32', fontWeight: '700' },
});
