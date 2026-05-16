import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/Color';

const TYPE_OPTIONS = [
  { id: 'bakery', label: 'Bakery', emoji: '🥐' },
  { id: 'restaurant', label: 'Restaurant', emoji: '🍲' },
  { id: 'grocery', label: 'Grocery', emoji: '🍎' },
  { id: 'cafe', label: 'Cafe', emoji: '☕' },
];

const FilterModal = ({ visible, onClose, onApply }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [price, setPrice] = useState(15);
  const [distance, setDistance] = useState(5);
  const [rating, setRating] = useState(5);

  const toggleType = (id) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const resetAll = () => {
    setSelectedTypes([]);
    setPrice(15);
    setDistance(5);
    setRating(5);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={resetAll}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((item) => {
                const active = selectedTypes.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleType(item.id)}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                  >
                    <Text style={styles.typeEmoji}>{item.emoji}</Text>
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.sliderHeader}>
              <Text style={styles.pill}>${price}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50}
              step={1}
              value={price}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.gray}
              thumbTintColor={Colors.primary}
              onValueChange={setPrice}
            />

            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.sliderHeader}>
              <Text style={styles.pill}>{distance.toFixed(0)} km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              step={1}
              value={distance}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.gray}
              thumbTintColor={Colors.primary}
              onValueChange={setDistance}
            />

            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.sliderHeader}>
              <Text style={styles.pill}>{rating.toFixed(1)}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.5}
              value={rating}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.gray}
              thumbTintColor={Colors.primary}
              onValueChange={setRating}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                onApply && onApply({ selectedTypes, price, distance, rating });
              }}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: Dimensions.get('window').height * 0.9,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resetText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 12,
    backgroundColor: Colors.white,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  typeLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
    padding: 16,
    backgroundColor: Colors.white,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FilterModal;