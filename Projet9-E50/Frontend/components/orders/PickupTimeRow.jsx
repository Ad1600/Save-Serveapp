import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PickupTimeRow = ({ time, wide = false }) => (
  <View style={[styles.container, wide && styles.wideContainer]}>
    <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" />
    <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
      Pickup: {time}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    flexShrink: 1,
  },
  wideContainer: {
    width: '100%',
  },
  text: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
    fontWeight: '600',
    flexShrink: 1,
  },
});