import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

export const OfferPreviewCard = ({ offer }) => {
  if (!offer) return null;
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const numericPrice = Number(offer?.price ?? offer?.prix ?? 0);
  const numericOldPrice = Number(offer?.prixOriginal ?? offer?.oldPrice ?? 0);

  const toggleFavorite = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: offer.image || 'https://via.placeholder.com/90' }} style={styles.image} />
        <TouchableOpacity
          onPress={toggleFavorite}
          onPressIn={(e) => e.stopPropagation && e.stopPropagation()}
          style={styles.heartTouch}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#EF4444' : '#94A3B8'} />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{offer.storeName}</Text>
        </View>
        <View style={styles.timeRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
          <Text style={styles.timeText}>Pickup today {offer.pickupTime}</Text>
        </View>
        <View style={styles.footer}>
          <View>
             {numericOldPrice > 0 ? <Text style={styles.oldPrice}>{Math.round(numericOldPrice)} DA</Text> : null}
             <Text style={styles.price}>{Math.round(numericPrice)} DA</Text>
          </View>
          <TouchableOpacity style={styles.reserveBtn} onPress={offer.onReserve} disabled={!offer.onReserve}>
            <Text style={styles.reserveText}>Reserve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 100, // Above floating tab bar
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  imageWrapper: { width: 90, height: 90, borderRadius: 15, overflow: 'hidden', position: 'relative' },
  image: { width: 90, height: 90, borderRadius: 15 },
  heartTouch: { position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 20, elevation: 6 },
  content: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  oldPrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  price: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  reserveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  reserveText: { color: 'white', fontWeight: 'bold' }
});