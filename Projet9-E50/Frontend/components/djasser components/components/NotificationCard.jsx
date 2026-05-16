// components/NotificationCard.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationCard({
  iconName,
  iconLib = 'mci',
  iconColor = '#005027',
  iconBg = '#E8F5E9',
  tag,
  tagColor = '#B85C00',
  title,
  subtitle,
}) {
  const Icon = iconLib === 'ion'
    ? ({ name, size, color }) => <Ionicons name={name} size={size} color={color} />
    : ({ name, size, color }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.textContent}>
        {tag && (
          <Text style={[styles.tag, { color: tagColor }]} numberOfLines={1}>{tag}</Text>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  tag: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#0D2B1D',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7C72',
  },
});