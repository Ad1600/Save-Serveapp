import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, useFocusEffect} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import Header from '../../components/explore/Header';
import SearchBar from '../../components/explore/SearchBar';
import FilterButton from '../../components/explore/FilterButton';
import SectionHeader from '../../components/explore/SectionHeader';
import Card from '../../components/explore/Card';
import { offerService } from '../../services/offerService';
import ReservationModal from '../../components/ui/ReservationModal';
import { getValidAvatarUri } from '../../services/ImageUserServeces';
import AdminHeader from '../../components/adminhead';
import * as SecureStore from 'expo-secure-store';


const CATEGORY_MAP = {
  bakery: 'boulangerie',
  restaurant: 'restaurant',
  grocery: 'epicerie',
  other: 'autre',
};

const normalizeCategory = (value = '') => {
  const cleaned = value.toString().trim().toLowerCase();
  return CATEGORY_MAP[cleaned] || cleaned;
};

export default function Explore() {
  const router = useRouter();
  const PAGE_SIZE = 12;
  const params = useLocalSearchParams();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offersPage, setOffersPage] = useState(1);
  const [offersHasMore, setOffersHasMore] = useState(false);
  const [totalOffers, setTotalOffers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const [searchError, setSearchError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // ← track logged-in user
  const searchRequestIdRef = useRef(0);
  const previousSearchQueryRef = useRef('');

  const selectedTypes = (params.types || '')
    .toString()
    .split(',')
    .map((item) => normalizeCategory(item))
    .filter(Boolean);
  const maxPrice = Number(params.maxPrice || 0);
  const maxDistanceKm = Number(params.maxDistanceKm || 0);
  const minRating = Number(params.minRating || 0);
  const hasActiveFilters = selectedTypes.length > 0 || maxPrice > 0 || maxDistanceKm > 0 || minRating > 0;

  const buildOfferQuery = () => {
    const query = {};
    if (selectedTypes.length > 0) query.types = selectedTypes.join(',');
    if (maxPrice > 0) query.maxPrice = String(maxPrice);
    if (minRating > 0) query.minRating = String(minRating);
    if (maxDistanceKm > 0) query.distance = String(maxDistanceKm * 1000);
    return query;
  };

  const fetchOffers = async ({ pageToLoad = 1, append = false, showLoading = false } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const result = await offerService.getOffers({
        ...buildOfferQuery(),
        page: pageToLoad,
        limit: PAGE_SIZE,
      });

      if (result.success) {
        const items = result?.data || [];
        const pagination = result?.pagination || {};
        setOffers((prev) => (append ? [...prev, ...items] : items));
        setOffersPage(pagination.page || pageToLoad);
        setOffersHasMore(Boolean(pagination.hasNextPage));
        setTotalOffers(pagination.total ?? items.length);
      }
    } catch (error) {
      console.error('Fetch Offers Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial load + filter changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchOffers({ pageToLoad: 1, showLoading: true });
    }
  }, [selectedTypes.join(','), maxPrice, maxDistanceKm, minRating]);

  // Prefetch offer images
  useEffect(() => {
    offers.forEach((offer) => {
      const url = offerService.getOfferImageUrl(offer.photo, false);
      if (url) Image.prefetch(url);
    });
  }, [offers]);

  // Silent background refresh + load avatar + load current user on focus
  useFocusEffect(
    useCallback(() => {
      if (!searchQuery.trim()) {
        fetchOffers({ pageToLoad: 1, showLoading: false });
      }

      const loadUserData = async () => {
        try {
          const raw = await SecureStore.getItemAsync('userData');
          if (raw) {
            const user = JSON.parse(raw);
            setCurrentUserId(user._id || user.id || null);
            setUserName(user.nom || user.name || '');
            const uri = await getValidAvatarUri(user.photo, true);
            setAvatarUri(uri ?? user.avatar ?? null);
          }
        } catch (e) {
          console.error('Failed to load user data in explore', e);
        }
      };
      loadUserData();
    }, [selectedTypes.join(','), maxPrice, maxDistanceKm, minRating])
  );

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setFilteredResults([]);
      setSearchError('');
      setSearchLoading(false);
      setSearchLoadingMore(false);
      setSearchPage(1);
      setSearchHasMore(false);
      setTotalSearchResults(0);

      if (previousSearchQueryRef.current) {
        fetchOffers({ pageToLoad: 1 });
      }

      previousSearchQueryRef.current = '';
      return;
    }

    previousSearchQueryRef.current = trimmedQuery;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearchLoading(true);
    setSearchError('');

    const timeoutId = setTimeout(async () => {
      try {
        const result = await offerService.searchOffersPaginated(trimmedQuery, 1, PAGE_SIZE);
        if (searchRequestIdRef.current === requestId) {
          setFilteredResults(result.items || []);
          setSearchPage(result?.pagination?.page || 1);
          setSearchHasMore(Boolean(result?.pagination?.hasNextPage));
          setTotalSearchResults(result?.pagination?.total ?? (result.items || []).length);
        }
      } catch (error) {
        if (searchRequestIdRef.current === requestId) {
          setFilteredResults([]);
          setSearchError(error.message || 'Search failed. Please try again.');
        }
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      const requestId = searchRequestIdRef.current + 1;
      searchRequestIdRef.current = requestId;

      offerService.searchOffersPaginated(searchQuery.trim(), 1, PAGE_SIZE)
        .then((result) => {
          if (searchRequestIdRef.current !== requestId) return;
          setFilteredResults(result.items || []);
          setSearchPage(result?.pagination?.page || 1);
          setSearchHasMore(Boolean(result?.pagination?.hasNextPage));
          setTotalSearchResults(result?.pagination?.total ?? (result.items || []).length);
        })
        .catch((error) => {
          if (searchRequestIdRef.current !== requestId) return;
          setSearchError(error.message || 'Search failed. Please try again.');
        })
        .finally(() => {
          setRefreshing(false);
        });
      return;
    }

    fetchOffers({ pageToLoad: 1 });
  };

  const onLoadMore = async () => {
    if (loadingMore || searchLoadingMore || loading || searchLoading || refreshing) return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      if (!searchHasMore) return;
      setSearchLoadingMore(true);
      try {
        const result = await offerService.searchOffersPaginated(trimmedQuery, searchPage + 1, PAGE_SIZE);
        setFilteredResults((prev) => [...prev, ...(result.items || [])]);
        setSearchPage(result?.pagination?.page || (searchPage + 1));
        setSearchHasMore(Boolean(result?.pagination?.hasNextPage));
        setTotalSearchResults(result?.pagination?.total ?? totalSearchResults);
      } catch (error) {
        console.error('Load more search offers error:', error);
      } finally {
        setSearchLoadingMore(false);
      }
      return;
    }

    if (!offersHasMore) return;
    setLoadingMore(true);
    fetchOffers({ pageToLoad: offersPage + 1, append: true });
  };

  const handleReservePress = (offer) => {
    const offerOwnerId =
      typeof offer.commercant === 'object'
        ? offer.commercant?._id || offer.commercant?.id
        : offer.commercant;

    if (currentUserId && String(offerOwnerId) === String(currentUserId)) {
      Alert.alert(
        "Can't Reserve Your Own Offer",
        "You cannot reserve an offer that you created. This offer is visible to buyers on the platform.",
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Block reservation if the seller is deactivated
    const sellerIsActive =
      typeof offer.commercant === 'object'
        ? offer.commercant?.actif !== false
        : true;

    if (!sellerIsActive) {
      Alert.alert(
        'Seller Unavailable',
        'This seller has been suspended. You cannot reserve their offers at this time.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const handleCardPress = (offer) => {
    router.push({ pathname: '/offerDetails', params: { offer: JSON.stringify(offer) } });
  };

  const handleReserveSuccess = (offerId, reservedQuantity) => {
    setOffers((prev) =>
      prev
        .map((o) => (o._id === offerId ? { ...o, quantiteDisponible: o.quantiteDisponible - reservedQuantity } : o))
        .filter((o) => o.quantiteDisponible > 0)
    );
  };

  const handleFilter = () => {
    router.push('/filter');
  };

  const handleMapView = () => {
    router.push('/map');
  };

  const sourceOffers = searchQuery.trim() ? filteredResults : offers;
  const canLoadMore = searchQuery.trim() ? searchHasMore : offersHasMore;

  const filteredOffers = sourceOffers.filter((offer) => {
    const offerCategory = normalizeCategory(offer.categorie || '');
    const offerPrice = Number(offer.prix || 0);
    const offerRating = Number(offer.moyenneAvis || 0);

    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(offerCategory);
    const matchesPrice = maxPrice <= 0 || offerPrice <= maxPrice;
    const matchesRating = minRating <= 0 || offerRating >= minRating;

    return matchesType && matchesPrice && matchesRating;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <StatusBar style="dark" />
      <ReservationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        offer={selectedOffer}
        onReserveSuccess={handleReserveSuccess}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <AdminHeader
          title="Explore"
          avatarUri={avatarUri}
          avatarLetter={userName.charAt(0).toUpperCase() || 'U'}
          onAvatarPress={() => router.push('/(tabs)/levels')}
        />
        <SearchBar
          placeholder="Search nearby surplus food..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {!!searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}
        <FilterButton onClick={handleFilter} />
        <SectionHeader title="Latest Baskets" onMapViewClick={handleMapView} />

        {loading && !refreshing && offers.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.cardsList}>
            <View style={styles.feedMetaRow}>
              <Text style={styles.feedMetaText}>
                {searchQuery.trim() ? `${totalSearchResults} results` : `${totalOffers} offers`}
              </Text>
            </View>

            {filteredOffers.map((offer) => {
              // Determine if this offer belongs to the current user
              const offerOwnerId =
                typeof offer.commercant === 'object'
                  ? offer.commercant?._id || offer.commercant?.id
                  : offer.commercant;
              const isOwnOffer = currentUserId && String(offerOwnerId) === String(currentUserId);

              return (
                <Card
                  key={offer._id}
                  offerId={offer._id}
                  isLiked={Boolean(offer.isLiked)}
                  title={offer.titre}
                  subtitle={offer.description}
                  price={`${offer.prix} DA`}
                  oldPrice={offer.prixOriginal ? `${offer.prixOriginal} DA` : undefined}
                  rating={offer.moyenneAvis}
                  reviewCount={offer.nombreAvis}
                  distance={offer.distance ? `${(offer.distance / 1000).toFixed(1)} km` : 'Nearby'}
                  image={offerService.getOfferImageUrl(offer.photo, false)}
                  onPress={() => handleCardPress(offer)}
                  onReserve={() => handleReservePress(offer)}
                  isOwnOffer={isOwnOffer} // ← new prop
                />
              );
            })}

            {filteredOffers.length === 0 && (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="basket-outline" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim()
                    ? 'No results found'
                    : hasActiveFilters
                      ? 'No offers match your filters'
                      : 'No offers available right now'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? 'Try a different keyword or clear search to browse all offers.'
                    : hasActiveFilters
                      ? 'Try changing type, price, distance, or rating to see more results.'
                      : 'Pull down to refresh and check back in a few minutes.'}
                </Text>
                <View style={styles.emptyActions}>
                  {!searchQuery.trim() && (
                    <TouchableOpacity style={styles.emptyOutlineBtn} onPress={handleFilter}>
                      <Text style={styles.emptyOutlineBtnText}>Adjust Filters</Text>
                    </TouchableOpacity>
                  )}

                  {(hasActiveFilters || searchQuery.trim()) && (
                    <TouchableOpacity
                      style={styles.emptyPrimaryBtn}
                      onPress={() => {
                        if (searchQuery.trim()) {
                          setSearchQuery('');
                          setSearchError('');
                        } else {
                          router.replace('/(tabs)/explore');
                        }
                      }}
                    >
                      <Text style={styles.emptyPrimaryBtnText}>
                        {searchQuery.trim() ? 'Clear Search' : 'Clear Filters'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {canLoadMore && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore || searchLoadingMore}>
                {loadingMore || searchLoadingMore ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more offers</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  cardsList: { paddingBottom: 16 },
  feedMetaRow: { marginHorizontal: 18, marginBottom: 8 },
  feedMetaText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  searchErrorText: { marginHorizontal: 18, marginBottom: 2, fontSize: 12, color: '#B45309' },
  emptyStateCard: {
    marginTop: 40,
    marginHorizontal: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  emptySubtitle: { marginTop: 8, fontSize: 13, lineHeight: 19, color: '#6B7280', textAlign: 'center' },
  emptyActions: { marginTop: 16, width: '100%', gap: 10 },
  emptyOutlineBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyOutlineBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  emptyPrimaryBtn: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  emptyPrimaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  loadMoreBtn: {
    marginTop: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadMoreText: { color: Colors.primary, fontWeight: '700' },
});
