import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Color';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../../constants/Api';
import { notificationService } from '../../services/notificationService';
import { useCallback } from 'react';

const Header = () => {
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState(null);
  const [initials, setInitials] = useState('');
  const [imageReady, setImageReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await SecureStore.getItemAsync('userData');
        if (stored) {
          const user = JSON.parse(stored);
          const name = user.nom || user.name || '';
          if (name) setInitials(name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2));
          if (user.photo) {
            setAvatarUri(
              user.photo.startsWith('http')
                ? user.photo
                : `${BASE_URL}/uploads/${user.photo}`
            );
          }
        }
      } catch (e) {}
    };
    load();
  }, []);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    notificationService.getUnreadCount()
      .then((count) => { if (mounted) setUnreadCount(count); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarFallback}>
            {initials ? <Text style={styles.avatarText}>{initials}</Text> : null}
          </View>
          {avatarUri && (
            <Image
              source={{ uri: avatarUri }}
              style={[styles.avatar, !imageReady && styles.hidden]}
              onLoadEnd={() => setImageReady(true)}
            />
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.title}>Offers</Text>

      <TouchableOpacity style={styles.bellIcon} onPress={() => router.push('/(tabs)/notifications')}>
        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  avatarContainer: { width: 40, height: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20, position: 'absolute', top: 0, left: 0 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hidden: { opacity: 0 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  bellIcon: { position: 'relative', padding: 8 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, position: 'absolute', top: 4, right: 4, minWidth: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', lineHeight: 12 },
});

export default Header;