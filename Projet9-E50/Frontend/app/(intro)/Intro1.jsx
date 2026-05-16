// app/(intro)/intro1.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Animated } from 'react-native';
import { Link } from 'expo-router';
import Button from '../../components/djasser components/components/button';
import Bars from '../../components/djasser components/components/bars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";

export default function Intro() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });

  // Title slides down from top
  const titleSlide = useRef(new Animated.Value(-40)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;

  // Cards slide up from bottom — card3 is lowest on screen so it animates first
   const card3Slide = useRef(new Animated.Value(80)).current;
  const card3Fade  = useRef(new Animated.Value(0)).current;
  const card2Slide = useRef(new Animated.Value(80)).current;
   const card2Fade  = useRef(new Animated.Value(0)).current;
  const card1Slide = useRef(new Animated.Value(80)).current;
    const card1Fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    // Reset all on every mount — so animation replays on back navigation
    titleSlide.setValue(-40);
    titleFade.setValue(0);
    card3Slide.setValue(80);
    card3Fade.setValue(0);
    card2Slide.setValue(80);
    card2Fade.setValue(0);
    card1Slide.setValue(80);
    card1Fade.setValue(0);

    // Title slides down first
    Animated.parallel([
   Animated.timing(titleFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Card 3 (bottom card — Premium Quality) slides up first
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card3Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
   Animated.timing(card3Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Card 2 (middle — Eco Impact)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(card2Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
    Animated.timing(card2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 380);

    // Card 1 (top — Huge Savings)
    setTimeout(() => {
      Animated.parallel([
     Animated.timing(card1Fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 560);

  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>

      {/* Bars */}
      <View style={{ position: "absolute", top: 42 }}>
        <Bars currentPage={1} totalPages={4} />
      </View>

      {/* Title slides down */}
      <Animated.Text style={{
        fontFamily: "PlusJakartaSans_700Bold",
        fontSize: 40,
        position: "absolute",
        top: 87,
        right: 110,
        lineHeight: 48,
        opacity: titleFade,
        transform: [{ translateY: titleSlide }],
      }}>
        Save Food &{"\n"}Money.
      </Animated.Text>

      {/* Card 1 — Huge Savings — slides up last (top card) */}
      <Animated.View style={[styles.rectangle3, {
        opacity: card1Fade,
        transform: [{ translateY: card1Slide }],
      }]}>
        <View style={styles.pigcont}>
          <MaterialCommunityIcons name="piggy-bank-outline" size={26} color="#005027" />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 25 }}>Huge Savings</Text>
      </Animated.View>

      {/* Card 2 — Eco-Impact */}
      <Animated.View style={[styles.rectangle2, {
        opacity: card2Fade,
        transform: [{ translateY: card2Slide }],
      }]}>
        <View style={styles.leafcont}>
          <Ionicons name="leaf-outline" size={24} color="#7B3F00" />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 25 }}>Eco-Impact</Text>
      </Animated.View>

      {/* Card 3 — Premium Quality — slides up first (bottom card) */}
      <Animated.View style={[styles.rectangle, {
        opacity: card3Fade,
        transform: [{ translateY: card3Slide }],
      }]}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#005027" />
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, lineHeight: 25 }}>Premium Quality</Text>
      </Animated.View>

      <Link href="/(intro)/Intro2" asChild>
        <Button style={{}} />
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
  rectangle: {
    height: 120, width: 320,
    backgroundColor: "#2ECC7130",
    position: "absolute", bottom: 150,
    borderRadius: 8.5, borderWidth: 1, borderColor: '#2ECC7130',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, gap: 16,
  },
  rectangle2: {
    height: 120, width: 320,
    backgroundColor: "#e9f3eafe",
    position: "absolute", bottom: 290,
    borderRadius: 8.5, borderWidth: 1, borderColor: '#edf6ef7e',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, gap: 16,
  },
  rectangle3: {
    height: 120, width: 320,
    backgroundColor: "#FFFF",
    position: "absolute", bottom: 430,
    borderRadius: 8.5, borderWidth: 1, borderColor: '#edf6ef7e',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, gap: 16,
  },
  iconCircle: {
    width: 55, height: 55, borderRadius: 27.5,
    backgroundColor: '#2ECC71',
    alignItems: 'center', justifyContent: 'center',
  },
  leafcont: {
    width: 55, height: 55, borderRadius: 12,
    backgroundColor: '#FDDCBB',
    alignItems: 'center', justifyContent: 'center',
  },
  pigcont: {
    width: 55, height: 55, borderRadius: 12,
    backgroundColor: '#A8F0B8',
    alignItems: 'center', justifyContent: 'center',
  },
});