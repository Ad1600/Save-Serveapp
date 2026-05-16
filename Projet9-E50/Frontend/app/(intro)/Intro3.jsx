// app/(intro)/intro3.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Bars from '../../components/djasser components/components/bars';
import NotificationCard from '../../components/djasser components/components/NotificationCard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

import * as Notifications from 'expo-notifications';






export default function Intro3() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });
  const router = useRouter();
  // Enable Notifications permission
const enableNotifications = async () => {
  await Notifications.requestPermissionsAsync();
  router.replace('/(auth)/AuthScreen');  
};

  // ── Animation values ──────────────────────────────────────────────
  const bellRotate  = useRef(new Animated.Value(0)).current;  // bell shake
  const blobScale   = useRef(new Animated.Value(1)).current;  // pulse
  const card1Slide  = useRef(new Animated.Value(40)).current; // card 1 slide up
  const card1Fade   = useRef(new Animated.Value(0)).current;
  const card2Slide  = useRef(new Animated.Value(40)).current; // card 2 slide up
  const card2Fade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    // 1. Bell shakes after 300ms  feels like it's ringing to get attention
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(bellRotate, { toValue: 15,  duration: 80,  useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: -15, duration: 80,  useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 10,  duration: 60,  useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: -10, duration: 60,  useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 5,   duration: 50,  useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 0,   duration: 50,  useNativeDriver: true }),
      ]).start();
    }, 300);

    // 2. Blob pulses slowly and loops foreversubtle, not distracting
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobScale, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(blobScale, { toValue: 1.00, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // 3. Card 1 slides up after 200ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card1Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    // 4. Card 2 slides up after 400ms — staggered after card 1
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card2Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 400);

  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // Bell rotation interpolation
  const bellRotateInterp = bellRotate.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <View style={styles.container}>

      {/* TOP SECTION */}
      <View style={styles.topSection}>

        {/* Bars */}
        <View style={styles.barsWrapper}>
          <Bars currentPage={3} totalPages={4} />
        </View>

        {/* Illustration */}
        <View style={styles.illustrationArea}>

          {/* Blob — pulses subtly */}
          <Animated.View style={[styles.blob, { transform: [{ scale: blobScale }] }]} />

          {/* Bell card — shakes on mount */}
          <View style={styles.bellCard}>
            <Animated.View style={{ transform: [{ rotate: bellRotateInterp }] }}>
              <Ionicons name="notifications" size={34} color="#006D37" />
            </Animated.View>
          </View>

          {/* Card 1 — slides up */}
          <Animated.View style={[styles.card1Wrapper, {
            opacity: card1Fade,
            transform: [{ translateY: card1Slide }],
          }]}>
            <NotificationCard
              iconName="shopping"
              iconLib="mci"
              iconColor="#005027"
              iconBg="#D4F5E2"
              tag="FRESH DROP"
              tagColor="#B85C00"
              title="Artisan Bakery Surplus"
              subtitle="Available 200m away"
            />
          </Animated.View>

          {/* Card 2 — slides up staggered */}
          <Animated.View style={[styles.card2Wrapper, {
            opacity: card2Fade,
            transform: [{ translateY: card2Slide }, { rotate: '-3deg' }],
          }]}>
            <NotificationCard
              iconName="timer-outline"
              iconLib="ion"
              iconColor="#B85C00"
              iconBg="#FDEBD0"
              title="Organic Fruit Box"
              subtitle="Last box! Reserved 5 mins ago"
            />
          </Animated.View>

        </View>

        <Text style={styles.title}>Never Miss an{'\n'}Offer.</Text>

        <Text style={styles.subtitle}>
          Enable notifications to get alerted when fresh surplus offers are available near you.
        </Text>

      </View>

      {/* BOTTOM SECTION */}
      <View style={styles.bottomSection}>

         <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
          onPress={enableNotifications}
        >
          <Text style={styles.btnPrimaryText}>Enable Notifications</Text>
        </Pressable>
 
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
          onPress={() => router.replace('/(auth)/AuthScreen')}
        >
          <Text style={styles.btnSecondaryText}>Not Now</Text>
        </Pressable>
 

        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={12} color="#6B7C72" />
          <Text style={styles.privacyText}>PRIVACY FIRST: WE ONLY ALERT YOU FOR LOCAL SURPLUS</Text>
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
  topSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
    gap: 10,
  },
  barsWrapper: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  illustrationArea: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    maxHeight: 310,
  },
  blob: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    width: 300,
    height: 300,
    backgroundColor: '#C8F2D8',
    borderTopLeftRadius: 160,
    borderTopRightRadius: 120,
    borderBottomRightRadius: 150,
    borderBottomLeftRadius: 100,
    transform: [{ rotate: '-10deg' }],
  },
  bellCard: {
    position: 'absolute',
    top: 40,
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
    top: 150,
    left: 70,
    right: 60,
    zIndex: 2,
  },
  card2Wrapper: {
    position: 'absolute',
    top: 235,
    left: 52,
    right: 60,
    zIndex: 2,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 39,
    color: '#0D2B1D',
    textAlign: 'center',
    lineHeight: 42,
    marginTop: 43,
    paddingHorizontal: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#6B7C72',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  btnPrimary: {
    width: '88%',
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
    width: '88%',
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