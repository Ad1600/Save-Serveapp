import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

export const ProfileRowItem = ({ icon, label, rightText, onPress, isLast }) => (
  <TouchableOpacity 
    style={[styles.container, !isLast && styles.border]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.leftSection}>
      <Ionicons name={icon} size={22} color={Colors.primary} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </View>
    
    <View style={styles.rightSection}>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 8,
  },
});