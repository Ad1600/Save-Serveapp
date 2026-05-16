// app/(seller-intro)/SellerIntro1.jsx
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Bars from '../../components/djasser components/components/bars';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

export default function SellerIntro1() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });
  const router = useRouter();

  // Top icon block slides up
  const topSlide = useRef(new Animated.Value(60)).current;
  const topFade  = useRef(new Animated.Value(0)).current;

  // Wide card slides up
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;

  // Small cards slide up
  const smallSlide = useRef(new Animated.Value(60)).current;
  const smallFade  = useRef(new Animated.Value(0)).current;

  // Bottom fades in last
  const bottomFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    topSlide.setValue(60);   topFade.setValue(0);
    cardSlide.setValue(60);  cardFade.setValue(0);
    smallSlide.setValue(60); smallFade.setValue(0);
    bottomFade.setValue(0);

    Animated.parallel([
      Animated.timing(topFade,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(topSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(smallFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(smallSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 380);

    setTimeout(() => {
      Animated.timing(bottomFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 520);

  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>

      {/* TOP — icon + title + tagline */}
      <Animated.View style={[styles.topSection, { opacity: topFade, transform: [{ translateY: topSlide }] }]}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="storefront" size={54} color="#2E7D32" />
        </View>
        <Text style={styles.title}>Your Shop{"\n"}is Live! 🎉</Text>
        <Text style={styles.tagline}>Welcome to the seller community</Text>
      </Animated.View>

      {/* MIDDLE */}
      <View style={styles.middleSection}>

        {/* Wide card */}
        <Animated.View style={[styles.wideCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.wideCardIcon}>
            <MaterialCommunityIcons name="tag-plus-outline" size={20} color="#1A6B35" />
          </View>
          <Text style={styles.wideCardText}>
            Post surplus food offers with photos,{'\n'}pricing, quantity and expiry date.
          </Text>
        </Animated.View>

        {/* Small cards */}
        <Animated.View style={[styles.smallCardsRow, { opacity: smallFade, transform: [{ translateY: smallSlide }] }]}>
          <View style={styles.smallCard}>
            <MaterialCommunityIcons name="cash-multiple" size={26} color="#B85C00" />
            <Text style={[styles.smallCardLabel, { color: '#B85C00' }]}>EARN</Text>
          </View>
          <View style={[styles.smallCard, { backgroundColor: '#D4F5E2' }]}>
            <MaterialCommunityIcons name="earth" size={26} color="#1A6B35" />
            <Text style={[styles.smallCardLabel, { color: '#1A6B35' }]}>IMPACT</Text>
          </View>
        </Animated.View>

      </View>

      {/* BOTTOM */}
      <Animated.View style={[styles.bottomSection, { opacity: bottomFade }]}>
        <Bars currentPage={0} totalPages={3} />
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
          onPress={() => router.replace('/sellerintro/sellintro2')}
        >
          <Text style={styles.btnText}>Next  →</Text>
        </Pressable>
        <Text style={styles.socialProof}>
          Thousands of meals saved every day by sellers like you.
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
    marginTop: 110,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: '#D4F5E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 38,
    color: '#0D2B1D',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#6B7C72',
    textAlign: 'center',
    lineHeight: 22,
  },
  middleSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
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