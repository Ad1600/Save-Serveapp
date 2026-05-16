import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LocationRow = ({ address }) => (
  <View style={styles.container}>
    <Ionicons name="location-outline" size={16} color="#94A3B8" />
    <Text style={styles.address} numberOfLines={2}>{address}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  address: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 4,
    flex: 1,
  },
});