// app/(intro)/intro0.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Image, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Bars from '../../components/djasser components/components/bars';
import SaveServe from '../../components/djasser components/components/saveserve';
import GradientText from '../../components/djasser components/components/Gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts as useJockeyFonts, JockeyOne_400Regular } from '@expo-google-fonts/jockey-one';

const logo = require('../../assets/images/images/Rectangle.png');

export default function Intro0() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });
  const [jockeyLoaded] = useJockeyFonts({ JockeyOne_400Regular });
  const router = useRouter();

  // Logo + title slide up together as one block
  const topSlide = useRef(new Animated.Value(60)).current;
  const topFade  = useRef(new Animated.Value(0)).current;

  // Wide card slides up after
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;

  // Small cards slide up after wide card
  const smallSlide = useRef(new Animated.Value(60)).current;
  const smallFade  = useRef(new Animated.Value(0)).current;

  // Bottom fades in last
  const bottomFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded || !jockeyLoaded) return;

    // Reset all — so animation replays on back navigation
    topSlide.setValue(60);   topFade.setValue(0);
    cardSlide.setValue(60);  cardFade.setValue(0);
    smallSlide.setValue(60); smallFade.setValue(0);
    bottomFade.setValue(0);

    // Logo + title slide up first
    Animated.parallel([
      Animated.timing(topFade,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(topSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    // Wide card
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Small cards
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(smallFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(smallSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 380);

    // Bottom
    setTimeout(() => {
      Animated.timing(bottomFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 520);

  }, [fontsLoaded, jockeyLoaded]);

  if (!fontsLoaded || !jockeyLoaded) return null;

  return (
    <View style={styles.container}>

      {/* TOP — logo + SaveServe + tagline slide up together */}
      <Animated.View style={[styles.topSection, { opacity: topFade, transform: [{ translateY: topSlide }] }]}>
        <View style={{ paddingBottom: 50 }}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <SaveServe />
        <GradientText
          text="Waste less, Eat smarter"
          colors={["#006d1f", "#53A425"]}
          style={styles.tagline}
        />
      </Animated.View>

      {/* MIDDLE */}
      <View style={styles.middleSection}>

        {/* Wide card slides up */}
        <Animated.View style={[styles.wideCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.wideCardIcon}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#1A6B35" />
          </View>
          <Text style={styles.wideCardText}>
            Discover surplus meals from premium{'\n'}local boutiques.
          </Text>
        </Animated.View>

        {/* Small cards slide up */}
        <Animated.View style={[styles.smallCardsRow, { opacity: smallFade, transform: [{ translateY: smallSlide }] }]}>
          <View style={styles.smallCard}>
            <Ionicons name="flash" size={26} color="#B85C00" />
            <Text style={[styles.smallCardLabel, { color: '#B85C00' }]}>INSTANT</Text>
          </View>
          <View style={[styles.smallCard, { backgroundColor: '#D4F5E2' }]}>
            <MaterialCommunityIcons name="sprout" size={26} color="#1A6B35" />
            <Text style={[styles.smallCardLabel, { color: '#1A6B35' }]}>IMPACT</Text>
          </View>
        </Animated.View>

      </View>

      {/* BOTTOM */}
      <Animated.View style={[styles.bottomSection, { opacity: bottomFade }]}>
        <Bars style={{ paddingBottom: 22 }} currentPage={0} totalPages={4} />
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
          onPress={() => router.replace('/(intro)/Intro1')}
        >
          <Text style={styles.btnText}>Get Started  →</Text>
        </Pressable>
        <Text style={styles.socialProof}>
          Join others saving the planet, one meal at a time.
        </Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4F9F1',
  },
  topSection: {
    alignItems: 'center',
    marginTop: -45,
  },
  logo: {
    width: 380,
    height: 380,
    marginBottom: -180,
  },
  tagline: {
    fontSize: 17,
    fontFamily: 'JockeyOne_400Regular',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  middleSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
    paddingHorizontal: 20,
  },
  wideCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  wideCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#D4F5E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideCardText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  smallCardsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  smallCardLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  btn: {
    width: '100%',
    height: 60,
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  socialProof: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6B7C72',
    textAlign: 'center',
    lineHeight: 20,
  },
});