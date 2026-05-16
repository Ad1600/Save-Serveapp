import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getValidAvatarUri } from '../../services/ImageUserServeces';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authservice';
import { SectionCard } from '../../components/profile/SectionCard';
import { ProfileRowItem } from '../../components/profile/ProfileRowItem';
import { SectionTitle } from '../../components/profile/SectionTitle';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [validPhotoUri, setValidPhotoUri] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const loadUser = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);
      if (storedUser?.photo) {
        const validUri = await getValidAvatarUri(storedUser.photo, true);
        setValidPhotoUri(validUri ?? storedUser.avatar ?? null);
      } else {
        setValidPhotoUri(storedUser?.avatar ?? null);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const onRefresh = () => { setRefreshing(true); loadUser(); };

  const displayName = useMemo(() => {
    if (user?.nom && user.nom.trim()) return user.nom;
    return 'Guest User';
  }, [user]);

  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || 'U';
  const photoUri = validPhotoUri;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header — back arrow only, no settings icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Profile card — horizontal layout like the image */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
            </View>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={[styles.avatar, styles.avatarAbsolute, !imageReady && { opacity: 0 }]}
                onLoadEnd={() => setImageReady(true)}
              />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            {!!user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </View>

        {/* APPEARANCE */}
        <SectionTitle title="APPEARANCE" />
        <SectionCard>
          <ProfileRowItem
            icon="moon-outline"
            label="Dark Mode"
            trailing={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <ProfileRowItem
            icon="globe-outline"
            label="Language"
            rightText="English"
            isLast
          />
        </SectionCard>

        {/* PREFERENCES */}
        <SectionTitle title="PREFERENCES" />
        <SectionCard>
          <ProfileRowItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(tabs)/notifications')}
          />
          <ProfileRowItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => router.push('/(tabs)/privacy')}
            isLast
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Horizontal profile card matching the screenshot
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarWrapper: { position: 'relative', width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarAbsolute: { position: 'absolute', top: 0, left: 0 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  avatarPlaceholderText: { color: '#475569', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
});