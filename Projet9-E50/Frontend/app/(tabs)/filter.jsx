import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';

const TYPES = [
  { label: 'Bakery',     emoji: '🥐' },
  { label: 'Restaurant', emoji: '🍲' },
  { label: 'Grocery',    emoji: '🍎' },
  { label: 'Other',      emoji: '🍱' }, // Replaced Cafe with Other
];

export default function FilterPage() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [price, setPrice] = useState(0);
  const [distance, setDistance] = useState(0);
  const [rating, setRating] = useState(0);

  const toggleType = (label) => {
    setSelectedTypes((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const resetAll = () => {
    setSelectedTypes([]);
    setPrice(0);
    setDistance(0);
    setRating(0);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter</Text>
        <TouchableOpacity onPress={resetAll}>
          <Text style={styles.resetText}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.content}>

        {/* Type */}
        <Text style={styles.sectionTitle}>Type</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((item) => {
            const isSelected = selectedTypes.includes(item.label);
            return (
              <Pressable
                key={item.label}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                onPress={() => toggleType(item.label)}
              >
                <Text style={styles.typeEmoji}>{item.emoji}</Text>
                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );  
          })}
        </View>

        {/* Price Range */}
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>{price} DA</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0} maximumValue={5000} step={1}
          value={price} onValueChange={setPrice}
          minimumTrackTintColor="#2E7D32"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#2E7D32"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0 DA</Text>
        </View>

        {/* Distance */}
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>{distance} km</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0} maximumValue={50} step={1}
          value={distance} onValueChange={setDistance}
          minimumTrackTintColor="#2E7D32"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#2E7D32"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0 km</Text>
          <Text style={styles.sliderLabel}>25 km</Text>
          <Text style={styles.sliderLabel}>50 km</Text>
        </View>

        {/* Rating */}
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Rating</Text>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>{rating}</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0} maximumValue={5} step={0.5}
          value={rating} onValueChange={setRating}
          minimumTrackTintColor="#2E7D32"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#2E7D32"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0</Text>
          <Text style={styles.sliderLabel}>2.5</Text>
          <Text style={styles.sliderLabel}>5</Text>
        </View>

      </View>

      {/* Apply button pinned to bottom */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
          onPress={() =>
            router.replace({
              pathname: '/(tabs)/explore',
              params: {
                types: selectedTypes.join(','),
                maxPrice: String(price),
                maxDistanceKm: String(distance),
                minRating: String(rating),
              },
            })
          }
        >
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F9F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 17,
    color: '#1a1a1a',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#1a1a1a',
  },
  resetText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#2E7D32',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#1a1a1a',
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  typeCard: {
    width: '47.5%',
    paddingVertical: 14,   
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    gap: 6,
  },
  typeCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FAF3',
  },
  typeEmoji: {
    fontSize: 22,          
  },
  typeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#1a1a1a',
  },
  typeLabelSelected: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#2E7D32',
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  valueBadge: {
    backgroundColor: '#D4F5E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  valueBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#2E7D32',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: -6,
  },
  sliderLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: '#F4F9F1',
  },
  applyBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
  },
});
