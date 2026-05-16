import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

const SectionHeader = ({ title = 'Surprise Baskets', onMapViewClick }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.mapViewButton} onPress={onMapViewClick}>
        <Ionicons name="map" size={16} color={Colors.primary} style={styles.icon} />
        <Text style={styles.mapViewText}>Map view</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  mapViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  icon: {
    marginRight: 6,
  },
  mapViewText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default SectionHeader;
