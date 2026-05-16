import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { AuthInput } from './AuthInput';
import { AuthButton, SocialLoginButton } from './AuthButton';
import { Divider } from './Divider';
import { Colors } from '../../constants/Color';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useGoogleAuth } from '../../services/googleAuth';
import { authService } from '../../services/authservice';
import favoriteStore from '../../services/favoriteStore';

export const LoginForm = ({ onToggle }) => {
  const router = useRouter();
  const passwordRef = useRef(null);

  const getRouteByRole = (role) => {
    return role === 'admin' ? '/(admin)/userspage' : '/(tabs)/explore';
  };

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleGoogleSuccess = async (response) => {
    if (response.success) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
      favoriteStore.setUserScope(response.data?._id);
      router.replace('/(tabs)/map');
    }
  };

  const { promptAsync, disabled } = useGoogleAuth(
    handleGoogleSuccess,
    (err) => alert("Google Error: " + err)
  );

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        await SecureStore.setItemAsync('userToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
        favoriteStore.setUserScope(response.data?._id);
        router.replace(getRouteByRole(response.data?.role));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong. Check your connection.";
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <AuthInput
        label="Email"
        icon="email-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />

      <View style={styles.inputSpacer} />

      <View style={styles.forgotRow}>
        <Text style={styles.label}>Password</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot')}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <AuthInput
        inputRef={passwordRef}
        icon="lock-outline"
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
        onRightIconPress={() => setShowPassword(prev => !prev)}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <View style={styles.inputSpacer} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <AuthButton title="Login" onPress={handleLogin} />
      )}

      <Divider />

      <SocialLoginButton title="Google" onPress={() => promptAsync()} disabled={disabled} />
    </View>
  );
};

const styles = StyleSheet.create({
  inputSpacer: { height: 10 },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  linkText: { color: Colors.primaryLight, fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
});