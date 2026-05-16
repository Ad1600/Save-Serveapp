import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authservice';
import { SectionCard } from '../../components/profile/SectionCard';
import { ProfileRowItem } from '../../components/profile/ProfileRowItem';
import { SectionTitle } from '../../components/profile/SectionTitle';
import { BASE_URL } from '../../constants/Api';
import favoriteStore from '../../services/favoriteStore';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [validPhotoUri, setValidPhotoUri] = useState(null);

  const loadUser = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);
      if (storedUser?.photo) {
        const uri = storedUser.photo.startsWith('http')
          ? storedUser.photo
          : `${BASE_URL}/uploads/${storedUser.photo}`;
        setValidPhotoUri(uri);
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

  const displayEmail = user?.email || '';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch (error) {
      Alert.alert('Logout Warning', error.response?.data?.message || 'Could not log out from server.');
    } finally {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('temp_email');
      favoriteStore.clearUserScope();
      setIsLoggingOut(false);
      router.replace('/(auth)/AuthScreen');
    }
  };

  const photoUri = validPhotoUri;
  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ✅ Clean header — no avatar here */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="settings-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >

        {/* ✅ Single read-only avatar in the center */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
            </View>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={[styles.avatar, styles.avatarAbsolute]}
              />
            )}
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          {!!displayEmail && <Text style={styles.userEmail}>{displayEmail}</Text>}
          {!!user?.telephone && <Text style={styles.userMeta}>{user.telephone}</Text>}
          {!!user?.adresse && <Text style={styles.userMeta}>{user.adresse}</Text>}
        </View>

        <SectionTitle title="ACCOUNT" />
        <SectionCard>
          <ProfileRowItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/(tabs)/edit-profile')} />
          <ProfileRowItem icon="lock-closed-outline" label="Change Password" onPress={() => router.push('/(tabs)/change-password')} isLast />
        </SectionCard>

        <SectionTitle title="ORDERS" />
        <SectionCard>
          <ProfileRowItem 
            icon="bag-handle-outline" 
            label="My Orders" 
            onPress={() => router.push({ pathname: '/(tabs)/orders', params: { tab: 'active' } })} 
          />
          <ProfileRowItem 
            icon="time-outline" 
            label="Order History" 
            onPress={() => router.push({ pathname: '/(tabs)/orders', params: { tab: 'history' } })} 
            isLast 
          />
        </SectionCard>

        <SectionTitle title="FAVORITES" />
        <SectionCard>
          <ProfileRowItem icon="heart-outline" label="Saved Offers" onPress={() => router.push('/(tabs)/SavedOffers')} isLast />
        </SectionCard>

        <SectionTitle title="SETTINGS" />
        <SectionCard>
          <ProfileRowItem icon="notifications-outline" label="Notifications" rightText="on_wireless" onPress={() => router.push('/(tabs)/notifications')} isLast />
        </SectionCard>

        <SectionTitle title="SUPPORT" />
        <SectionCard>
          <ProfileRowItem icon="help-circle-outline" label="Help Center" onPress={() => router.push('/(tabs)/helpcenter')} />
          <ProfileRowItem icon="mail-outline" label="Contact Support" onPress={() => router.push('/(tabs)/contact-support')} isLast />
        </SectionCard>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  userInfo: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15, width: 100, height: 100 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarAbsolute: { position: 'absolute', top: 0, left: 0 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  avatarPlaceholderText: { color: '#475569', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B' },
  userMeta: { marginTop: 4, fontSize: 13, color: '#64748B' },
  logoutButton: { flexDirection: 'row', backgroundColor: '#F1F5F9', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});