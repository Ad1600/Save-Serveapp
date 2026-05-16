//splash screen page sends u after 2 sec to index of (tabs) see line 136



import { StyleSheet, View, Animated, Image, Dimensions } from "react-native";
import logo from '../assets/images/images/Rectangle.png';
import GradientText from "../components/djasser components/components/Gradient";
import SaveServe from "../components/djasser components/components/saveserve";
import { useFonts, JockeyOne_400Regular } from '@expo-google-fonts/jockey-one';
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import favoriteStore from '../services/favoriteStore';

const { width } = Dimensions.get('window');

// Shockwave ring component
function Ring({ delay, trigger }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    scale.setValue(0.3);
    opacity.setValue(0.7);
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View style={[
      styles.ring,
      { opacity, transform: [{ scale }] }
    ]} />
  );
}

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ JockeyOne_400Regular });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const reset = async () => {
      // Temporary testing reset: always show intro on launch.
      await AsyncStorage.removeItem('hasSeenIntro');
      await AsyncStorage.removeItem('alreadyLaunched');
    };

    reset();
  }, []);

  // Logo slams down from above
  const logoY     = useRef(new Animated.Value(-400)).current;
  const logoScale = useRef(new Animated.Value(1.4)).current;
  const logoFade  = useRef(new Animated.Value(0)).current;

  // Logo squish on impact
  const logoSquishY = useRef(new Animated.Value(1)).current;
  const logoSquishX = useRef(new Animated.Value(1)).current;

  // Text shoots up from below with hard overshoot
  const textY    = useRef(new Animated.Value(120)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  // Tagline
  const tagFade  = useRef(new Animated.Value(0)).current;
  const tagY     = useRef(new Animated.Value(40)).current;

  const routeAfterSplash = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        const rawUserData = await SecureStore.getItemAsync('userData');
        let role = null;

        if (rawUserData) {
          try {
            const userData = JSON.parse(rawUserData);
            favoriteStore.setUserScope(userData?._id);
            role = userData?.role;
          } catch {
            favoriteStore.clearUserScope();
            role = null;
          }
        } else {
          favoriteStore.clearUserScope();
        }

        router.replace(role === 'admin' ? '/(admin)/statspage' : '/(tabs)/explore');
        return;
      }

      const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');

      if (hasSeenIntro === 'true') {
        router.replace('/(auth)/AuthScreen'); 
        return;
      }

      await AsyncStorage.setItem('hasSeenIntro', 'true');
      router.replace('/(intro)/Intro');
    } catch (error) {
      // If storage read fails, keep onboarding path safe by showing intro.
      router.replace('/(intro)/Intro');
    }
  };

  useEffect(() => {
    Asset.fromModule(require('../assets/images/images/Rectangle.png')).downloadAsync()
      .then(() => setImageLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !imageLoaded) return;

    // Phase 1: logo slams in fast from top
    Animated.parallel([
      Animated.timing(logoFade, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {

      // Phase 2: impact squish — squash wide, short
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoSquishY, { toValue: 0.82, duration: 100, useNativeDriver: true }),
          Animated.timing(logoSquishX, { toValue: 1.18, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(logoSquishY, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
          Animated.spring(logoSquishX, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        ]),
      ]).start();

      // Phase 3: shockwave rings burst out
      setShockwave(true);

      // Phase 4: text shoots up with hard overshoot spring
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(textY, {
          toValue: 0,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 5: tagline
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(tagFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(tagY, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      }, 250);
    });

    const timer = setTimeout(() => {
      routeAfterSplash();
    }, 2200);

    return () => clearTimeout(timer);
  }, [fontsLoaded, imageLoaded]);

  if (!fontsLoaded || !imageLoaded) return null;

  return (
    <View style={styles.container}>

      {/* Logo slams in */}
      <View style={[styles.logoWrapper,{marginTop:-35}]}>
        {/* Shockwave rings */}
        <View style={styles.ringsContainer}>
          <Ring delay={0}   trigger={shockwave} />
          <Ring delay={120} trigger={shockwave} />
          <Ring delay={240} trigger={shockwave} />
        </View>

        <Animated.Image
          source={logo}
          style={[styles.img, {
            opacity: logoFade,
            transform: [
              { translateY: logoY },
              { scale: logoScale },
              { scaleY: logoSquishY },
              { scaleX: logoSquishX },
            ],
          }]}
        />
      </View>

      {/* Text shoots up */}
      <Animated.View style={{
        opacity: textFade,
        transform: [{ translateY: textY }],
        marginTop: -80,
      }}>
        <SaveServe />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{
        marginTop: 150,
        opacity: tagFade,
        transform: [{ translateY: tagY }],
      }}>
        <GradientText
          text="Waste less, Eat smarter"
          colors={["#DB6C31", "#745133"]}
          style={[styles.gradientText,{marginTop:50}]}
        />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 220,
    backgroundColor: "#F4F9F1",
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  ringsContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: '#5BA224',
  },
  img: {
    height: 300,
    width: 300,
  },
  gradientText: {
    fontSize: 16.1,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: 'JockeyOne_400Regular',
  },
});