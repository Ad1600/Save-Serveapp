import React, { useState, useRef, useCallback, useLayoutEffect, useEffect, useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import ReservationModal from '../../components/ui/ReservationModal';
import favoriteService from '../../services/favoriteService';
import favoriteStore from '../../services/favoriteStore';
import { offerService } from '../../services/offerService';
import * as SecureStore from 'expo-secure-store'; // ← added

export const unstable_settings = {
  tabBarStyle: { display: 'none' },
};

const CATEGORY_MAP = {
  boulangerie: { label: 'Bakery',     emoji: '🥐' },
  restaurant:  { label: 'Restaurant', emoji: '🍲' },
  epicerie:    { label: 'Grocery',    emoji: '🍎' },
  autre:       { label: 'Other',      emoji: '🍱' },
};

export default function OfferDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const { offer } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  const [liveOffer, setLiveOffer] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); // ← added

  const parsedOffer = useMemo(() => {
    if (!offer) return null;
    try {
      return typeof offer === 'string' ? JSON.parse(offer) : offer;
    } catch (error) {
      return null;
    }
  }, [offer]);

  const offerId = useMemo(() => {
    if (!parsedOffer) return null;
    return parsedOffer._id || parsedOffer.id || parsedOffer.offerId || null;
  }, [parsedOffer]);

  useEffect(() => {
    if (parsedOffer) setLiveOffer(parsedOffer);
  }, [parsedOffer]);

  useEffect(() => {
    setImageLoaded(false);
    setLogoLoaded(false);
  }, [offerId]);

  // ── Load current user ID from secure storage ────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await SecureStore.getItemAsync('userData');
        if (raw) {
          const user = JSON.parse(raw);
          setCurrentUserId(user._id || user.id || null);
        }
      } catch (e) {
        console.error('Failed to load user data in offerDetails', e);
      }
    };
    loadUser();
  }, []);

  const displayOffer = liveOffer || parsedOffer;

  const heroImageUrl = useMemo(
    () => offerService.getOfferImageUrl(displayOffer?.photo || displayOffer?.commercant?.photo, false),
    [offerId, displayOffer?.photo, displayOffer?.commercant?.photo]
  );
  const storeLogoUrl = useMemo(
    () => offerService.getOfferImageUrl(displayOffer?.commercant?.photo || displayOffer?.photo, false),
    [offerId, displayOffer?.commercant?.photo, displayOffer?.photo]
  );

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (offerId) {
        offerService.getOfferById(offerId)
          .then((res) => {
            if (res?.data) setLiveOffer(prev => ({ ...prev, ...res.data }));
          })
          .catch(e => console.log('Refresh failed', e.message));
      }
    }, [offerId])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Offer Details',
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: Colors.background,
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTintColor: Colors.textPrimary,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={styles.headerBackButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!displayOffer) return;
    if (displayOffer.isLiked != null) {
      setIsFavorite(Boolean(displayOffer.isLiked));
      if (offerId) {
        favoriteStore.setFavorite(offerId, Boolean(displayOffer.isLiked));
      }
    }
  }, [displayOffer, offerId]);

  useEffect(() => {
    if (!offerId) return undefined;

    favoriteStore.syncUserScopeFromStorage();
    const storedValue = favoriteStore.getFavorite(offerId);
    if (typeof storedValue === 'boolean') {
      setIsFavorite(storedValue);
    }

    const unsubscribe = favoriteStore.subscribe(({ offerId: changedOfferId, isFavorite: nextIsFavorite }) => {
      if (String(changedOfferId) === String(offerId)) {
        setIsFavorite(nextIsFavorite);
      }
    });

    return unsubscribe;
  }, [offerId]);

  if (!displayOffer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>Offer not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const title         = displayOffer.titre || 'Surprise Bakery Basket';
  const description   = displayOffer.description || 'No description available.';
  const price         = displayOffer.prix != null ? `${displayOffer.prix} DA` : 'N/A';
  const oldPrice      = displayOffer.prixOriginal != null ? `${displayOffer.prixOriginal} DA` : '';
  const seller        = displayOffer.commercant || {};
  const phone         = seller.telephone || 'Non renseigné';
  const storeName     = seller.nomCommerce || seller.nom || displayOffer.storeName || 'Seller';

  const getStatusLabel = (status, quantity) => {
    const s = (status || 'disponible').toLowerCase();
    if (s === 'epuisee') return 'SOLD OUT';
    if (s === 'expiree') return 'EXPIRED';
    const qty = Number(quantity);
    if (quantity != null && !isNaN(qty) && qty <= 0) return 'SOLD OUT';
    return 'AVAILABLE';
  };

  const statusLabel = getStatusLabel(displayOffer.statut, displayOffer.quantiteDisponible);
  const statusColor = statusLabel === 'AVAILABLE' ? Colors.primary : '#EF4444';

  const distance      = displayOffer.distance != null && !Number.isNaN(Number(displayOffer.distance))
    ? `${(Number(displayOffer.distance) / 1000).toFixed(1)} km`
    : displayOffer.distanceLabel || 'Nearby';
  const locationLabel = displayOffer.adresse || seller.adresse || displayOffer.locationLabel || 'Location unavailable';

  const averageRating = displayOffer.moyenneAvis != null ? Number(displayOffer.moyenneAvis) : 0;
  const reviewCount   = displayOffer.nombreAvis || 0;
  const isNewSeller   = averageRating === 0 || reviewCount === 0;

  const rawCategorie  = (displayOffer.categorie || 'autre').toLowerCase();
  const matchedType   = CATEGORY_MAP[rawCategorie] || CATEGORY_MAP['autre'];

  const pickupStart = displayOffer.pickupStart || '';
  const pickupEnd   = displayOffer.pickupEnd   || '';

  const offerCoords = (() => {
    if (
      Array.isArray(displayOffer.location?.coordinates) &&
      displayOffer.location.coordinates.length >= 2
    ) {
      const lat = Number(displayOffer.location.coordinates[1]);
      const lng = Number(displayOffer.location.coordinates[0]);
      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0))
        return { latitude: lat, longitude: lng };
    }

    if (displayOffer.latitude != null && displayOffer.longitude != null) {
      const lat = Number(displayOffer.latitude);
      const lng = Number(displayOffer.longitude);
      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0))
        return { latitude: lat, longitude: lng };
    }

    if (displayOffer.commercant?.latitude != null && displayOffer.commercant?.longitude != null) {
      const lat = Number(displayOffer.commercant.latitude);
      const lng = Number(displayOffer.commercant.longitude);
      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0))
        return { latitude: lat, longitude: lng };
    }

    if (
      Array.isArray(displayOffer.commercant?.location?.coordinates) &&
      displayOffer.commercant.location.coordinates.length >= 2
    ) {
      const lat = Number(displayOffer.commercant.location.coordinates[1]);
      const lng = Number(displayOffer.commercant.location.coordinates[0]);
      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0))
        return { latitude: lat, longitude: lng };
    }

    if (displayOffer.location?.latitude != null && displayOffer.location?.longitude != null) {
      const lat = Number(displayOffer.location.latitude);
      const lng = Number(displayOffer.location.longitude);
      if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0))
        return { latitude: lat, longitude: lng };
    }

    return null;
  })();

  // ── Determine if this offer belongs to the logged-in user ────────────────
  const offerOwnerId =
    typeof displayOffer.commercant === 'object'
      ? displayOffer.commercant?._id || displayOffer.commercant?.id
      : displayOffer.commercant;
  const isOwnOffer = currentUserId && String(offerOwnerId) === String(currentUserId);
    const isSellerBlocked =
    typeof displayOffer.commercant === 'object'
      ? displayOffer.commercant?.actif === false
      : false;

  // ── Reserve handler with ownership guard ─────────────────────────────────
  const handleReservePress = (offer) => {
    if (isOwnOffer) {
      Alert.alert(
        "Can't Reserve Your Own Offer",
        "You cannot reserve an offer that you created. This offer is visible to buyers on the platform.",
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    if (isSellerBlocked) {
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

  const handleReserveSuccess = (reservedOfferId, reservedQuantity) => {
    setLiveOffer(prev => ({
      ...prev,
      quantiteDisponible: Math.max(0, prev.quantiteDisponible - reservedQuantity)
    }));
  };

  // ── Reserve button label & style ─────────────────────────────────────────
  const isButtonDisabled = statusLabel !== 'AVAILABLE' || isOwnOffer || isSellerBlocked;
  const buttonLabel = isOwnOffer
    ? 'Your Offer'
    : isSellerBlocked
      ? 'Seller Suspended'
      : statusLabel === 'AVAILABLE'
        ? 'Reserve Now'
        : statusLabel;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ReservationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        offer={selectedOffer}
        onReserveSuccess={handleReserveSuccess}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: heroImageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
            onLoadEnd={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
          {!imageLoaded && <View style={styles.imagePlaceholder} />}
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>

          {/* "Your Offer" badge on hero image */}
          {isOwnOffer && (
            <View style={styles.ownOfferBadge}>
              <Ionicons name="storefront" size={12} color="#2E7D32" />
              <Text style={styles.ownOfferBadgeText}>Your Offer</Text>
            </View>
          )}
        </View>

        {/* Store Info */}
        <View style={styles.storeInfoContainer}>
          <View style={styles.storeLogoWrapper}>
            {!logoLoaded && <View style={styles.storeLogoPlaceholder} />}
            <Image
              source={{ uri: storeLogoUrl }}
              style={[styles.storeLogo, !logoLoaded && { opacity: 0 }]}
              onLoadEnd={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
            />
          </View>
          <View style={styles.storeDetails}>
            <Text style={styles.offerTitle}>{title}</Text>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName}>{storeName}</Text>
              {isNewSeller ? (
                <View style={styles.newBadgeContainer}>
                  <Ionicons name="sparkles" size={12} color="#F57C00" />
                  <Text style={styles.newBadgeText}>Nouveau</Text>
                </View>
              ) : (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={averageRating >= 4.0 ? "#F57C00" : "#94A3B8"} />
                  <Text style={[styles.ratingText, { color: averageRating >= 4.0 ? "#F57C00" : "#94A3B8" }]}>
                    {averageRating.toFixed(1)} ★
                  </Text>
                  <Text style={styles.ratingSubtext}>
                    (Basé sur {reviewCount} avis)
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                <Text style={[styles.distanceText, { color: Colors.primary, fontWeight: '600' }]}>{phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PRICE</Text>
            <Text style={styles.infoValue}>{price}</Text>
            {oldPrice ? <Text style={styles.oldPrice}>{oldPrice}</Text> : null}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>TYPE</Text>
            <Text style={styles.typeEmoji}>{matchedType.emoji}</Text>
            <Text style={styles.typeLabel}>{matchedType.label}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PICKUP</Text>
            <Ionicons name="time-outline" size={18} color={pickupStart ? Colors.primary : Colors.textSecondary} style={{ marginBottom: 4 }} />
            <Text style={[styles.infoValue, { fontSize: 13 }]}>
              {pickupStart || '—'}
            </Text>
            {pickupEnd ? (
              <Text style={styles.pickupSubtext}>Until {pickupEnd}</Text>
            ) : (
              <Text style={styles.pickupSubtext}>Not set</Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{description}</Text>
        </View>

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          {offerCoords ? (
            <View style={styles.mapContainer}>
              <MapView
                key={`${offerCoords.latitude}-${offerCoords.longitude}`}
                provider={PROVIDER_GOOGLE}
                style={styles.realMap}
                region={{
                  latitude: offerCoords.latitude,
                  longitude: offerCoords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker coordinate={offerCoords} title={storeName} description={locationLabel} />
              </MapView>

              <View style={styles.locationBadge}>
                <Ionicons name="location" size={13} color={Colors.primary} />
                <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <Ionicons name="location-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.noMapText}>{locationLabel}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reserve Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            isButtonDisabled && styles.reserveButtonDisabled,
          ]}
          onPress={() => !isButtonDisabled && handleReservePress(displayOffer)}
          activeOpacity={isButtonDisabled ? 1 : 0.7}
        >
          {isOwnOffer ? (
            <>
              <Ionicons name="lock-closed" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.reserveButtonTextDisabled}>{buttonLabel}</Text>
            </>
          ) : isSellerBlocked ? (
            <>
              <Ionicons name="ban" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.reserveButtonTextDisabled}>{buttonLabel}</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="basket"
                size={20}
                color={statusLabel === 'AVAILABLE' ? Colors.white : Colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.reserveButtonText, statusLabel !== 'AVAILABLE' && { color: Colors.textSecondary }]}>
                {buttonLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  imageContainer: { position: 'relative', marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  heroImage: { width: '100%', height: 250, borderRadius: 16 },
  imagePlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#D1D5DB', borderRadius: 16 },
  badge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: Colors.primary, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  // "Your Offer" overlay badge on hero image (top-right)
  ownOfferBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  ownOfferBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  storeInfoContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  storeLogoWrapper: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden' },
  storeLogoPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E8F5E9', borderRadius: 8 },
  storeLogo: { width: 56, height: 56, borderRadius: 8 },
  storeDetails: { flex: 1 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  storeNameRow: { flexDirection: 'column' },
  storeName: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  ratingSubtext: { fontSize: 11, color: Colors.textSecondary },
  newBadgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#FFF3E0', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: '#F57C00' },
  distanceText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  infoCard: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  typeEmoji: { fontSize: 20, marginBottom: 2 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  oldPrice: { fontSize: 11, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  pickupSubtext: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sectionText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  mapContainer: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' },
  realMap: { width: '100%', height: '100%' },
  locationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  noMapContainer: { height: 80, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noMapText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  bottomButtonContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray },
  reserveButton: { backgroundColor: Colors.primary, height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  reserveButtonDisabled: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  reserveButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  reserveButtonTextDisabled: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  centerMessage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: Colors.googleRed, fontSize: 16, marginBottom: 12 },
  backButton: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  backButtonText: { color: Colors.white, fontWeight: '700' },
  headerBackButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
