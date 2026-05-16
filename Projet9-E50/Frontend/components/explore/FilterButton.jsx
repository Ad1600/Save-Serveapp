import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

const FilterButton = ({ onClick }) => (
  <TouchableOpacity style={styles.button} onPress={onClick}>
    <Ionicons
      name="funnel-outline" // changed from "filter-outline"
      size={18}
      color={Colors.success || Colors.primary}
      style={styles.icon}
    />
    <Text style={styles.text}>Filter</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.success || Colors.primary,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 16,
    marginBottom: 16,
  },
  icon: { marginRight: 8 },
  text: {
    color: Colors.success || Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FilterButton;
