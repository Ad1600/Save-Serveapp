// app/(seller-intro)/SellerIntro3.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Bars from '../../components/djasser components/components/bars';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SecureStore from 'expo-secure-store';

export default function SellerIntro3() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });
  const router = useRouter();

  const iconRotate = useRef(new Animated.Value(0)).current;
  const blobScale  = useRef(new Animated.Value(1)).current;
  const card1Slide = useRef(new Animated.Value(40)).current;
  const card1Fade  = useRef(new Animated.Value(0)).current;
  const card2Slide = useRef(new Animated.Value(40)).current;
  const card2Fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    setTimeout(() => {
      Animated.sequence([
        Animated.timing(iconRotate, { toValue: 15,  duration: 80,  useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: -15, duration: 80,  useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 10,  duration: 60,  useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: -10, duration: 60,  useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 5,   duration: 50,  useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 0,   duration: 50,  useNativeDriver: true }),
      ]).start();
    }, 300);

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobScale, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(blobScale, { toValue: 1.00, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card1Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card2Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 400);

  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const iconRotateInterp = iconRotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const markIntroSeen = async () => {
    const stored = await SecureStore.getItemAsync('userData');
    const parsed = JSON.parse(stored);
    const userId = parsed?._id || parsed?.id || 'default';
    await SecureStore.setItemAsync(`hasSeenSellerIntro_${userId}`, 'true');
  };

  const handleStart = async () => {
    try { await markIntroSeen(); } catch (e) {}
    router.replace('/(tabs)/new-offer');
  };

  const handleLater = async () => {
    try { await markIntroSeen(); } catch (e) {}
    router.replace('/(tabs)/sellpage');
  };

  return (
    <View style={styles.container}>
      {/* Bars at the top */}
      <View style={styles.barsWrapper}>
        <Bars currentPage={2} totalPages={3} />
      </View>

      {/* Illustration area with animated elements */}
      <View style={styles.illustrationArea}>
        <Animated.View style={[styles.blob, { transform: [{ scale: blobScale }] }]} />
        <View style={styles.iconCard}>
          <Animated.View style={{ transform: [{ rotate: iconRotateInterp }] }}>
            <MaterialCommunityIcons name="storefront" size={34} color="#006D37" />
          </Animated.View>
        </View>
        <Animated.View style={[styles.card1Wrapper, { opacity: card1Fade, transform: [{ translateY: card1Slide }] }]}>
          <View style={styles.notifCard}>
            <View style={styles.notifIcon}>
              <MaterialCommunityIcons name="tag-plus-outline" size={20} color="#005027" />
            </View>
            <View style={styles.notifText}>
              <Text style={styles.notifTag}>NEW OFFER</Text>
              <Text style={styles.notifTitle}>Bakery Surplus Box</Text>
              <Text style={styles.notifSub}>Posted · visible to customers nearby</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View style={[styles.card2Wrapper, { opacity: card2Fade, transform: [{ translateY: card2Slide }, { rotate: '-3deg' }] }]}>
          <View style={styles.notifCard}>
            <View style={[styles.notifIcon, { backgroundColor: '#FDEBD0' }]}>
              <Ionicons name="bag-check-outline" size={20} color="#B85C00" />
            </View>
            <View style={styles.notifText}>
              <Text style={styles.notifTitle}>Order Received!</Text>
              <Text style={styles.notifSub}>A customer just reserved your offer</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Text Section */}
      <Text style={styles.title}>Ready to{'\n'}Start Earning?</Text>
      <Text style={styles.subtitle}>
        Add your first offer and start reaching hungry customers who want to save food and money.
      </Text>

      <View style={styles.spacer} />

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
          onPress={handleStart}
        >
          <Text style={styles.btnPrimaryText}>Add My First Offer</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
          onPress={handleLater}
        >
          <Text style={styles.btnSecondaryText}>Later</Text>
        </Pressable>
        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={12} color="#6B7C72" />
          <Text style={styles.privacyText}>YOUR OFFERS ONLY APPEAR TO NEARBY CUSTOMERS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F1',
    alignItems: 'center',
  },
  barsWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 16,
  },
  illustrationArea: {
    width: '100%',
    height: 280,
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 260,
    height: 260,
    backgroundColor: '#C8F2D8',
    borderTopLeftRadius: 160,
    borderTopRightRadius: 120,
    borderBottomRightRadius: 150,
    borderBottomLeftRadius: 100,
    transform: [{ rotate: '-10deg' }],
  },
  iconCard: {
    position: 'absolute',
    top: 16,
    width: 82,
    height: 82,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 2,
  },
  card1Wrapper: {
    position: 'absolute',
    top: 115,
    left: 30,
    right: 30,
    zIndex: 2,
  },
  card2Wrapper: {
    position: 'absolute',
    top: 195,
    left: 30,
    right: 30,
    zIndex: 2,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#D4F5E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifText: { flex: 1 },
  notifTag: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#B85C00',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notifTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#1a1a1a',
  },
  notifSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#6B7C72',
    marginTop: 2,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 36,
    color: '#0D2B1D',
    textAlign: 'center',
    lineHeight: 44,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#6B7C72',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 24,
  },
  spacer: {
    flex: 0.7,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 10,
    paddingHorizontal: 20,
  },
  btnPrimary: {
    width: '100%',
    height: 58,
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  btnSecondary: {
    width: '100%',
    height: 58,
    backgroundColor: '#E0EBE2',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#2E7D32',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  privacyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: '#6B7C72',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
});