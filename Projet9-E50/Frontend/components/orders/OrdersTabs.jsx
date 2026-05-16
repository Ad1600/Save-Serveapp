import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Color';

export const OrdersTabs = ({ activeTab, onTabChange }) => (
  <View style={styles.container}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'active' && styles.activeTab]} 
      onPress={() => onTabChange('active')}
    >
      <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active Orders</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
      onPress={() => onTabChange('history')}
    >
      <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Order History</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  activeTabText: { color: Colors.primary },
});