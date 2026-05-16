// app/application-success.jsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";

export default function ApplicationSuccess() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ 
    PlusJakartaSans_400Regular, 
    PlusJakartaSans_600SemiBold, 
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold 
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <View style={styles.innerCircle}>
            <Ionicons name="checkmark" size={40} color="#2E7D32" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Application{"\n"}Received</Text>

        {/* Description */}
        <Text style={styles.description}>
          Thank you for your interest! Your application is now in review. Check your notifications for status updates.
        </Text>

        {/* Explore Button */}
        <TouchableOpacity 
          style={styles.exploreBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreBtnText}>Explore Marketplace</Text>
        </TouchableOpacity>

        {/* Next Steps Card */}
        <View style={styles.nextStepsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.infoIconBg}>
              <Feather name="info" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>NEXT STEPS</Text>
          </View>
          
          <Text style={styles.cardBody}>
            Our curators typically review applications within 48 hours. You will receive a push notification once a decision is reached.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F9F1', // Matches your light green theme
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  innerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 36,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 20,
  },
  description: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  exploreBtn: {
    backgroundColor: '#2E7D32',
    width: '100%',
    height: 65,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    // Shadow for the button
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    // Soft shadow for the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  cardBody: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    paddingLeft: 44, // Aligns text under the title instead of under the icon
  },
});