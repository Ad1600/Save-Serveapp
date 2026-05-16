import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

export const AuthInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, rightIcon, onRightIconPress, isValid }) => (
  <View style={styles.inputWrapper}>
    <MaterialCommunityIcons name={icon} size={20} color="#94A3B8" style={styles.icon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
    {isValid && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
    {rightIcon && (
      <TouchableOpacity onPress={onRightIconPress}>
        <Ionicons name={rightIcon} size={20} color="#94A3B8" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1E293B' },
});