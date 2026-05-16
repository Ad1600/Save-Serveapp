import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
// Importing your existing Card component
import Card from '../../components/explore/Card';
import favoriteService from '../../services/favoriteService';
import favoriteStore from '../../services/favoriteStore';
import { offerService } from '../../services/offerService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SavedOffers() {
  const router = useRouter();
  const [savedOffers, setSavedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      await favoriteStore.syncUserScopeFromStorage();
      const res = await favoriteService.getFavorites();
      if (res.success) {
        setSavedOffers(res.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchFavorites(true);
  };

  useFocusEffect(
    useCallback(() => {
      favoriteStore.syncUserScopeFromStorage();
      fetchFavorites();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = favoriteStore.subscribe(({ offerId, isFavorite }) => {
      if (!isFavorite) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSavedOffers(prev => prev.filter(item => String(item._id) !== String(offerId)));
      }
    });
    return unsubscribe;
  }, []);

  const handleCardPress = (offer) => {
    if (!offer) {
      Alert.alert('Error', "This offer is no longer available.");
      return;
    }
    router.push({
      pathname: '/offerDetails',
      params: { offer: JSON.stringify(offer) },
    });
  };

  const handleReservePress = (offer) => {
    handleCardPress(offer);
  };

  // 2. Empty State View
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="heart-dislike-outline" size={60} color={Colors.gray} />
      </View>
      <Text style={styles.emptyTitle}>No saved offer</Text>
      <Text style={styles.emptySubtitle}>
        Browse the offers nearby and click on the heart to save them here.
      </Text>
      <TouchableOpacity 
        style={styles.browseBtn} 
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.browseBtnText}>Browse Offers</Text>
        <Ionicons name="arrow-forward" size={18} color="white" style={{marginLeft: 8}} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 3. Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved offers</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* 4. The List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={savedOffers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card
              offerId={item._id}
              isLiked={true}
              title={item.titre}
              subtitle={item.description}
              price={`${item.prix} DA`}
              oldPrice={item.prixOriginal ? `${item.prixOriginal} DA` : undefined}
              rating={item.moyenneAvis}
              distance={item.distance}
              image={offerService.formatImageUrl(item.photo)}
              onPress={() => handleCardPress(item)}
              onReserve={() => handleReservePress(item)}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]} 
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Soft light green/gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  listContent: {
    paddingTop: 16,     // Space between header and first card
    paddingBottom: 100, // Space so it doesn't get hidden by the TabBar
  },
  /* Empty State Styles */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  browseBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});