import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import favoriteService from '../../services/favoriteService';
import favoriteStore from '../../services/favoriteStore';

const Card = ({
  offerId,
  isLiked = false,
  title,
  subtitle,
  price,
  oldPrice,
  rating,
  reviewCount,
  distance,
  image,
  onPress,
  onReserve,
  isOwnOffer = false, // ← new prop: true when this offer belongs to the logged-in seller
}) => {
  const [isFavorite, setIsFavorite] = useState(() => {
    const storedValue = favoriteStore.getFavorite(offerId);
    return typeof storedValue === 'boolean' ? storedValue : !!isLiked;
  });
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!offerId) return undefined;

    favoriteStore.syncUserScopeFromStorage();
    const storedValue = favoriteStore.getFavorite(offerId);
    if (typeof storedValue === 'boolean') {
      setIsFavorite(storedValue);
    } else {
      favoriteStore.setFavorite(offerId, !!isLiked);
    }

    const unsubscribe = favoriteStore.subscribe(({ offerId: changedOfferId, isFavorite: nextIsFavorite }) => {
      if (String(changedOfferId) === String(offerId)) {
        setIsFavorite(nextIsFavorite);
      }
    });

    return unsubscribe;
  }, [offerId, isLiked]);

  const toggleFavorite = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const previous = isFavorite;
    const next = !previous;
    setIsFavorite(next);
    if (offerId) {
      favoriteStore.setFavorite(offerId, next);
      favoriteStore.incrementClickCount(offerId);
    }
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    (async () => {
      const currentPending = favoriteStore.getPending(offerId);

      const requestPromise = (async () => {
        try {
          const res = await favoriteService.toggleFavorite(offerId);
          favoriteStore.decrementClickCount(offerId);

          if (favoriteStore.getClickCount(offerId) === 0) {
            if (res && typeof res.favorited !== 'undefined') {
              const serverValue = Boolean(res.favorited);
              setIsFavorite(serverValue);
              if (offerId) favoriteStore.setFavorite(offerId, serverValue);
            }
          }
        } catch (err) {
          favoriteStore.decrementClickCount(offerId);

          if (favoriteStore.getClickCount(offerId) === 0 && favoriteStore.getPending(offerId) === requestPromise) {
            setIsFavorite(previous);
            if (offerId) favoriteStore.setFavorite(offerId, previous);
            try {
              Alert.alert('Erreur', "Erreur lors de l'enregistrement");
            } catch (e) {
              console.warn('Favorite toggle failed', err?.message || err);
            }
          }
        } finally {
          if (favoriteStore.getPending(offerId) === requestPromise) {
            favoriteStore.clearPending(offerId);
          }
        }
      })();

      if (offerId) favoriteStore.setPending(offerId, requestPromise);
    })();
  };

  const isRated = Number(rating) > 0 && Number(reviewCount) > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />

          {/* "Your Offer" badge — shown instead of heart when it's the seller's own offer */}
          {isOwnOffer ? (
            <View style={styles.ownOfferBadge}>
              <Ionicons name="storefront" size={12} color="#2E7D32" />
              <Text style={styles.ownOfferBadgeText}>Your Offer</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.heartTouch}
              onPress={(e) => { e.stopPropagation && e.stopPropagation(); toggleFavorite(e); }}
              activeOpacity={0.85}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Animated.View style={[styles.favoriteInner, { transform: [{ scale: heartScale }] }]}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#EF4444' : '#6B7280'} />
              </Animated.View>
            </TouchableOpacity>
          )}

          {isRated && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
              <Ionicons name="star" size={12} color={Colors.orange} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {distance && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={14} color={Colors.textSecondary} />
                <Text style={styles.distance}>{distance}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{price}</Text>
              {oldPrice && <Text style={styles.oldPrice}>{oldPrice}</Text>}
            </View>

            {/* Reserve button — disabled + different style when isOwnOffer */}
            <TouchableOpacity
              style={[styles.reserveButton, isOwnOffer && styles.reserveButtonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                onReserve && onReserve();
              }}
              activeOpacity={isOwnOffer ? 1 : 0.8}
            >
              {isOwnOffer ? (
                <View style={styles.reserveButtonInner}>
                  <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                  <Text style={styles.reserveButtonTextDisabled}>Your offer</Text>
                </View>
              ) : (
                <Text style={styles.reserveButtonText}>Reserve</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: Colors.gray,
  },
  heartTouch: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  favoriteInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Badge shown in top-right for the seller's own offer (replaces heart)
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
    zIndex: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  ownOfferBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  oldPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  reserveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  // Disabled state: grayed out, no green
  reserveButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  reserveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reserveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  reserveButtonTextDisabled: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Card;
