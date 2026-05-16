import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

export const AuthButton = ({ title, onPress, icon }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
    {icon && <Ionicons name={icon} size={20} color="white" style={{ marginLeft: 8 }} />}
  </TouchableOpacity>
);

export const SocialLoginButton = ({ title, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
    <Text style={styles.socialText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 55,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginTop: 10,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  socialButton: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  socialText: { color: '#1E293B', fontSize: 16, fontWeight: '600' },
});