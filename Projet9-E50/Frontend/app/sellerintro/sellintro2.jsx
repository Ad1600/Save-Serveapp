// app/(seller-intro)/SellerIntro2.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Animated, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Button from '../../components/djasser components/components/button';
import Bars from '../../components/djasser components/components/bars';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

export default function SellerIntro2() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });

  const titleSlide = useRef(new Animated.Value(-30)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;

  const subtitleFade = useRef(new Animated.Value(0)).current;

  const row1Slide = useRef(new Animated.Value(-60)).current;
  const row1Fade  = useRef(new Animated.Value(0)).current;
  const row2Slide = useRef(new Animated.Value(-60)).current;
  const row2Fade  = useRef(new Animated.Value(0)).current;
  const row3Slide = useRef(new Animated.Value(-60)).current;
  const row3Fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    titleSlide.setValue(-30); titleFade.setValue(0);
    subtitleFade.setValue(0);
    row1Slide.setValue(-60); row1Fade.setValue(0);
    row2Slide.setValue(-60); row2Fade.setValue(0);
    row3Slide.setValue(-60); row3Fade.setValue(0);

    Animated.parallel([
      Animated.timing(titleFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(subtitleFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 250);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(row1Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(row1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 350);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(row2Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(row2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 500);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(row3Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(row3Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 650);

  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>

      
      {/* All main content shifted down via marginTop */}
      <View style={{ width: '100%', flex: 1, marginTop: 40 }}>

        {/* Bars & Title Block */}
        <View style={{ position: 'absolute', top: 58, width: '100%' }}>

          {/* Progress Bars */}
          <View style={{ position: 'absolute', top: 26, width: '100%', alignItems: 'center' }}>
            <Bars currentPage={1} totalPages={3} />
          </View>

          {/* Title */}
          <Animated.Text style={{
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: 40,
            position: 'absolute',
            top: 110,
            left: 36,
            lineHeight: 48,
            opacity: titleFade,
            transform: [{ translateY: titleSlide }],
          }}>
            Manage Orders.
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 15,
            position: 'absolute',
            top: 164,
            left: 36,
            lineHeight: 22,
            color: '#6B7C72',
            opacity: subtitleFade,
          }}>
            Handle every order in a few simple steps.
          </Animated.Text>
        </View>

        {/* Row 1 — Accept or Reject */}
        <Animated.View style={[styles.rect, { opacity: row1Fade, transform: [{ translateX: row1Slide }] }]}>
          <View style={styles.square}>
            <Ionicons name="checkmark-circle-outline" size={35} color="#005027" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Accept or Reject</Text>
            <Text style={styles.rowSub}>Review incoming customer orders</Text>
          </View>
        </Animated.View>

        {/* Row 2 — Mark as Ready */}
        <Animated.View style={[styles.rect2, { opacity: row2Fade, transform: [{ translateX: row2Slide }] }]}>
          <View style={styles.square2}>
            <MaterialCommunityIcons name="shopping-outline" size={35} color="#005027" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Mark as Ready</Text>
            <Text style={styles.rowSub}>Let the customer know to pick up</Text>
          </View>
        </Animated.View>

        {/* Row 3 — Validate Pickup */}
        <Animated.View style={[styles.rect3, { opacity: row3Fade, transform: [{ translateX: row3Slide }] }]}>
          <View style={styles.square3}>
            <MaterialCommunityIcons name="qrcode-scan" size={30} color="#3B1F0E" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Validate Pickup</Text>
            <Text style={styles.rowSub}>Enter the customer's pickup code</Text>
          </View>
        </Animated.View>

        <Link href="/sellerintro/sellintro3" asChild>
          <Button />
        </Link>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4F9F1',
  },
  square: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: '#2ECC71',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  square2: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: '#7BF8A1',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  square3: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: '#FFDCC5',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  rowSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6B7C72',
    lineHeight: 18,
  },
  rect: {
    flexDirection: 'row', position: 'absolute', top: 300, left: 36,
    alignItems: 'center', gap: 16, right: 36,
  },
  rect2: {
    flexDirection: 'row', position: 'absolute', top: 420, left: 36,
    alignItems: 'center', gap: 16, right: 36,
  },
  rect3: {
    flexDirection: 'row', position: 'absolute', top: 540, left: 36,
    alignItems: 'center', gap: 16, right: 36,
  },
});