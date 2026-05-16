import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService } from '../services/notificationService';

export default function AdminHeader({ title, avatarUri, avatarLetter = 'A', onAvatarPress }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    notificationService.getUnreadCount()
      .then((count) => { if (mounted) setUnreadCount(count); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []));

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>

      <TouchableOpacity
        onPress={() => onAvatarPress ? onAvatarPress() : router.push('/(admin)/profile')}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
          </View>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={[styles.avatar, styles.avatarAbsolute]}
            />
          ) : null}
        </View>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <TouchableOpacity
        onPress={() => {(title === 'Explore' || title === 'My Orders') ? router.push('/(tabs)/notifications') : router.push('/(admin)/notifications')}}
        activeOpacity={0.8}
        style={styles.bellButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="notifications-outline" size={22} color="#1E293B" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F0FAF0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C8E6C9',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bellButton: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#F0FAF0',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});