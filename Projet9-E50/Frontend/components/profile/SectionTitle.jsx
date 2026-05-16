import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Color';

export const SectionTitle = ({ title }) => (
  <Text style={styles.title}>{title}</Text>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});