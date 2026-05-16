import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { offerService } from '../../services/offerService';
import { SearchBar } from '../../components/map/SearchBar';
import { MapOfferMarker } from '../../components/map/MapOfferMarker';
import ReservationModal from '../../components/ui/ReservationModal';

const DEFAULT_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MIN_DELTA = 0.002;
const MAX_DELTA = 0.5;
const CATEGORY_MAP = {
  bakery: 'boulangerie',
  restaurant: 'restaurant',
  grocery: 'epicerie',
  other: 'autre',
};

const normalizeCategoryValue = (value = '') => {
  const cleaned = value.toString().trim().toLowerCase();
  return CATEGORY_MAP[cleaned] || cleaned;
};

const OfferMarkers = memo(({ offers, onPress }) => (
  <>
    {offers.map((offer) => (
      <MapOfferMarker
        key={offer._id}
        offer={{
          ...offer,
          price: Number(offer.prix ?? offer.price ?? 0),
          coordinates: offerService.mapLocation(offer),
        }}
        onPress={() => onPress(offer)}
      />
    ))}
  </>
));

export default function MapScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationOffer, setReservationOffer] = useState(null);
  const [reservationVisible, setReservationVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const mapRef = useRef(null);
  const mapRegionRef = useRef(DEFAULT_REGION);
  const searchRequestIdRef = useRef(0);
  const previousSearchQueryRef = useRef('');
  const lastFetchRef = useRef(0);

  const categories = ['All', 'Bakery', 'Restaurant', 'Grocery', 'Other'];
  const categoryIcons = {
    Bakery: 'pizza',
    Restaurant: 'restaurant',
    Grocery: 'cart',
    Other: 'apps',
  };

  const loadMapData = useCallback(async (silent = false) => {
    lastFetchRef.current = Date.now();
    try {
      if (!silent) setLoading(true);
      const params = activeCategory !== 'All' ? { categorie: normalizeCategoryValue(activeCategory) } : {};
      const response = await offerService.getOffers(params);
      if (response.success) setOffers(response.data);
    } catch (error) {
      console.error('Map Load Error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadMapData();
    }
  }, [activeCategory, loadMapData, searchQuery]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);

      if (previousSearchQueryRef.current) {
        loadMapData();
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
        const results = await offerService.searchOffers(trimmedQuery);
        if (searchRequestIdRef.current === requestId) {
          setSearchResults(results);
        }
      } catch (error) {
        if (searchRequestIdRef.current === requestId) {
          setSearchResults([]);
          setSearchError(error.message || 'Search failed.');
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
  }, [searchQuery, loadMapData]);

  useEffect(() => {
    loadMapData(false);
  }, [loadMapData]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchRef.current < 500) return;
      loadMapData(true);
    }, [loadMapData])
  );

  const animateToRegion = useCallback((nextRegion) => {
    if (!mapRef.current || !nextRegion) return;
    mapRef.current.animateToRegion(nextRegion, 250);
    mapRegionRef.current = nextRegion;
  }, []);

  const handleZoom = useCallback((direction) => {
    const region = mapRegionRef.current;
    const factor = direction === 'in' ? 0.7 : 1.4;
    const nextLatitudeDelta = Math.min(Math.max(region.latitudeDelta * factor, MIN_DELTA), MAX_DELTA);
    const nextLongitudeDelta = Math.min(Math.max(region.longitudeDelta * factor, MIN_DELTA), MAX_DELTA);
    animateToRegion({ ...region, latitudeDelta: nextLatitudeDelta, longitudeDelta: nextLongitudeDelta });
  }, [animateToRegion]);

  const handleLocateMe = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow location access to center the map on your position.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(currentLocation);
      animateToRegion({ ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    } catch {
      Alert.alert('Location error', 'Could not get your current position. Please try again.');
    }
  }, [animateToRegion]);

  const handleMarkerPress = useCallback((offer) => {
    setReservationOffer(offer);
    setReservationVisible(true);
  }, []);

  const handleRegionChange = useCallback((region) => {
    mapRegionRef.current = region;
  }, []);

  const handleReserveSuccess = useCallback((offerId, reservedQuantity) => {
    setOffers((prev) =>
      prev
        .map((o) => (o._id === offerId ? { ...o, quantiteDisponible: o.quantiteDisponible - reservedQuantity } : o))
        .filter((o) => o.quantiteDisponible > 0)
    );
  }, []);

  const sourceOffers = searchQuery.trim() ? searchResults : offers;
  const visibleOffers = activeCategory === 'All'
    ? sourceOffers
    : sourceOffers.filter((offer) => normalizeCategoryValue(offer.categorie || '') === normalizeCategoryValue(activeCategory));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={handleRegionChange}
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        loadingEnabled
        loadingColor={Colors.primary}
      >
        {!loading && !searchLoading && visibleOffers.map((offer) => (
          <MapOfferMarker
            key={offer._id}
            offer={{
              ...offer,
              price: Number(offer.prix ?? offer.price ?? 0),
              coordinates: offerService.mapLocation(offer),
            }}
            onPress={() => handleMarkerPress(offer)}
          />
        ))}

        {userLocation && (
          <Marker coordinate={userLocation} title="My location" tracksViewChanges={false}>
            <View style={styles.myLocationMarker}>
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlayTop}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        {!!searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.pill, activeCategory === cat && styles.activePill]}
            >
              <View style={styles.pillContent}>
                {categoryIcons[cat] && (
                  <Ionicons name={categoryIcons[cat]} size={16} color={activeCategory === cat ? 'white' : '#64748B'} />
                )}
                <Text style={[styles.pillText, activeCategory === cat && styles.activePillText]}> {cat}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {(loading || searchLoading) && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {!loading && !searchLoading && visibleOffers.length === 0 && (
        <View style={styles.emptyResultsWrap}>
          <Text style={styles.emptyResultsTitle}>No results found</Text>
          <Text style={styles.emptyResultsSubtitle}>
            {searchQuery.trim()
              ? 'Try another keyword or clear search to see all map offers.'
              : 'Try changing your category filter.'}
          </Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleLocateMe}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.zoomGroup}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('in')}>
            <Ionicons name="add" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.line} />
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('out')}>
            <Ionicons name="remove" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ReservationModal
        visible={reservationVisible}
        onClose={() => {
          setReservationVisible(false);
          setReservationOffer(null);
        }}
        offer={reservationOffer}
        onReserveSuccess={handleReserveSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { ...StyleSheet.absoluteFillObject },
  overlayTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  filters: { paddingLeft: 20, marginTop: 15 },
  filtersContent: { paddingRight: 20 },
  searchErrorText: { marginTop: 8, marginHorizontal: 24, color: '#B45309', fontSize: 12 },
  pill: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, elevation: 3, shadowOpacity: 0.1 },
  activePill: { backgroundColor: Colors.primary },
  pillContent: { flexDirection: 'row', alignItems: 'center' },
  pillText: { fontWeight: '600', color: '#64748B' },
  activePillText: { color: 'white' },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.8)', padding: 20, borderRadius: 50 },
  emptyResultsWrap: { position: 'absolute', top: '48%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, maxWidth: '80%' },
  emptyResultsTitle: { textAlign: 'center', fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  emptyResultsSubtitle: { textAlign: 'center', color: '#64748B', fontSize: 12, lineHeight: 18 },
  controls: { position: 'absolute', right: 16, bottom: 32, alignItems: 'center', gap: 12 },
  controlBtn: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, elevation: 4 },
  zoomGroup: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', elevation: 4 },
  zoomBtn: { padding: 12 },
  line: { height: 1, backgroundColor: '#E5E7EB' },
  myLocationMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
});
