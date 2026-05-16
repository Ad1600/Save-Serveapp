// app/(intro)/intro2.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Animated } from 'react-native';
import { Link } from 'expo-router';
import Button from '../../components/djasser components/components/button';
import Bars from '../../components/djasser components/components/bars';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function Intro2() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });

  // Title: slides down from top + fades in
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;

  // Subtitle: fades in
  const subtitleFade = useRef(new Animated.Value(0)).current;

  // Each row: slides in from left + fades in
  const row1Slide = useRef(new Animated.Value(-60)).current;
  const row1Fade  = useRef(new Animated.Value(0)).current;
  const row2Slide = useRef(new Animated.Value(-60)).current;
  const row2Fade  = useRef(new Animated.Value(0)).current;
  const row3Slide = useRef(new Animated.Value(-60)).current;
  const row3Fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    // Reset all values on every mount — so animation replays when going back
    titleSlide.setValue(-30);
    titleFade.setValue(0);
    subtitleFade.setValue(0);
    row1Slide.setValue(-60);
    row1Fade.setValue(0);
    row2Slide.setValue(-60);
    row2Fade.setValue(0);
    row3Slide.setValue(-60);
    row3Fade.setValue(0);

    // Title appears first
    Animated.parallel([
      Animated.timing(titleFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Subtitle fades in after title
    setTimeout(() => {
      Animated.timing(subtitleFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 250);

    // Row 1 slides in from left
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(row1Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(row1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 350);

    // Row 2 — staggered after row 1
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(row2Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(row2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 500);

    // Row 3 — staggered after row 2
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

      {/* Bars */}
      <View style={{ position: "absolute", top: 18 }}>
        <View style={{ position: "absolute", top: 26, width: '100%', alignItems: 'center' }}>
          <Bars currentPage={2} totalPages={4} />
        </View>

        {/* Title slides down */}
        <Animated.Text style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 40,
          position: "absolute",
          top: 71,
          left: -140,
          lineHeight: 48,
          opacity: titleFade,
          transform: [{ translateY: titleSlide }],
        }}>
          How it works.
        </Animated.Text>

        {/* Subtitle fades in */}
        <Animated.Text style={{
          fontFamily: "PlusJakartaSans_400Regular",
          fontSize: 15,
          position: "absolute",
          top: 129,
          left: -140,
          lineHeight: 22,
          opacity: subtitleFade,
        }}>
          Connecting surplus food with{"\n"}local communities.
        </Animated.Text>
      </View>

      {/* Row 1 slides from left */}
      <Animated.View style={[styles.rect, { opacity: row1Fade, transform: [{ translateX: row1Slide }] }]}>
        <View style={styles.square}>
          <MaterialCommunityIcons name="storefront-outline" size={35} color="#005027" />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 48 }}>Merchants post</Text>
      </Animated.View>

      {/* Row 2 slides from left */}
      <Animated.View style={[styles.rect2, { opacity: row2Fade, transform: [{ translateX: row2Slide }] }]}>
        <View style={styles.square2}>
          <MaterialCommunityIcons name="gesture-tap-button" size={35} color="#005027" style={{ position: "absolute", top: 22 }} />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 20 }}>Browse & Claim</Text>
      </Animated.View>

      {/* Row 3 slides from left */}
      <Animated.View style={[styles.rect3, { opacity: row3Fade, transform: [{ translateX: row3Slide }] }]}>
        <View style={styles.square3}>
          <MaterialCommunityIcons name="leaf" size={30} color="#3B1F0E" />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 20 }}>Save & Serve</Text>
      </Animated.View>

      <Link href="/(intro)/Intro3" asChild>
        <Button />
      </Link>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F4F9F1",
  },
  square: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: "#2ECC71",
    alignItems: "center", justifyContent: "center",
  },
  square2: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: "#7BF8A1",
    alignItems: "center", justifyContent: "center",
  },
  square3: {
    height: 70, width: 70, borderRadius: 12,
    backgroundColor: "#FFDCC5",
    alignItems: "center", justifyContent: "center",
  },
  rect: {
    flexDirection: 'row', position: 'absolute', top: 250, left: 50,
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  rect2: {
    flexDirection: 'row', position: 'absolute', top: 370, left: 50,
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  rect3: {
    flexDirection: 'row', position: 'absolute', top: 490, left: 50,
    alignItems: "center", justifyContent: "center", gap: 16,
  },
});