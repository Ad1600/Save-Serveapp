import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const SearchBar = ({ value = '', onChangeText, onFilterPress }) => (
  <View style={styles.container}>
    <View style={styles.searchBox}>
      <Ionicons name="search" size={20} color="#94A3B8" />
      <TextInput 
        style={styles.input} 
        placeholder="Search bakeries, restaurants..." 
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
    <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress}>
      <MaterialCommunityIcons name="tune-variant" size={22} color="#1E293B" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B' },
  filterBtn: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  }
});