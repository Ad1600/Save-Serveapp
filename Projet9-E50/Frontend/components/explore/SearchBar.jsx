import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

const SearchBar = ({
  placeholder = 'Search nearby surplus food...',
  value = '',
  onChangeText,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.gray,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
});

export default SearchBar;
