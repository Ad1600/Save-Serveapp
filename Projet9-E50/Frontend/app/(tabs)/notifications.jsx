import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import NotificationItem from '../../components/ui/NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';

const TYPE_MAP = {
  confirmation: 'order',
  annulation: 'reminder',
  prete: 'reminder',
  recuperee: 'completed',
  nouvelle_offre: 'offer',
  support: 'support',
};

const formatRelativeTime = (value) => {
  if (!value) return "just now";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "just now";

  // 🔥 Add +1 hour (Algeria offset)
  const now = Date.now() + 60 * 60 * 1000;

  let diffMs = now - date.getTime();

  if (diffMs < 0) diffMs = 0;

  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;

  if (diffHours < 48) return "Yesterday";

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    totalCount,
    socketConnected,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useFocusEffect(useCallback(() => {
    refreshNotifications();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [refreshNotifications]));

  const renderItem = ({ item }) => (
    <NotificationItem
      title={item.title}
      description={item.message}
      time={formatRelativeTime(item.createdAt)}
      type={TYPE_MAP[item.type] || item.type || 'order'}
      isRead={item.read}
      onRead={() => markAsRead(item.id)}
    />
  );

  const renderHeader = () => {
    if (unreadCount === 0) return null;
    return (
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>UNREAD</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
          <MaterialCommunityIcons name="check-all" size={15} color="#2E7D32" />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F4F9F1" translucent={false} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <View style={styles.backBtn} />
      </View>

      {/* ── Live status indicator ── */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: socketConnected ? '#2E7D32' : '#F57C00' }]} />
        <Text style={styles.statusText}>
          {socketConnected ? 'Live' : 'Reconnecting...'}
        </Text>
        <Text style={styles.statusCount}>{unreadCount} unread</Text>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loaderText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          onRefresh={refreshNotifications}
          refreshing={refreshing}
          onEndReachedThreshold={0.25}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMoreNotifications();
          }}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#2E7D32" style={styles.footerLoader} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <MaterialCommunityIcons name="bell-off-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySubtitle}>No notifications yet. You're up to date!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  unreadPill: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  statusCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyWrapper: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});