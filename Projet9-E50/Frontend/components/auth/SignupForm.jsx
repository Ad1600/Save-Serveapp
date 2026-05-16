import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Keyboard,
} from 'react-native';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';
import { Colors } from '../../constants/Color';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../../services/authservice';

export const SignupForm = ({ onToggle }) => {
  const router = useRouter();
  const scrollRef       = useRef(null);
  const emailRef        = useRef(null);
  const passwordRef     = useRef(null);
  const confirmPassRef  = useRef(null);

  const [nom, setNom]                         = useState('');
  const [email, setEmail]                     = useState('');
  const [telephone, setTelephone]             = useState('');
  const [adresse, setAdresse]                 = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1]     = useState(false);
  const [showPassword2, setShowPassword2]     = useState(false);
  const [agreed, setAgreed]                   = useState(false);
  const [loading, setLoading]                 = useState(false);

  const handleSignup = async () => {
    Keyboard.dismiss();
    if (!nom || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'You must agree to the Terms of Service');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userData = { nom, email, motDePasse: password, telephone, adresse, role: 'client' };
      const response = await authService.register(userData);
      if (response.success) {
        await SecureStore.setItemAsync('temp_email', email);
        Alert.alert('Verification Sent', 'Please check your email for the 6-digit code.');
        router.push('/(auth)/verify');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed. Try again.";
      Alert.alert('Signup Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <AuthInput
        label="Full Name"
        icon="account-outline"
        placeholder="Hamouda Hatem"
        value={nom}
        onChangeText={setNom}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />

      <AuthInput
        inputRef={emailRef}
        label="Email Address"
        icon="email-outline"
        placeholder="example@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />

      <AuthInput
        inputRef={passwordRef}
        label="Password"
        icon="lock-outline"
        placeholder="Create a password"
        secureTextEntry={!showPassword1}
        value={password}
        onChangeText={setPassword}
        rightIcon={showPassword1 ? 'eye-outline' : 'eye-off-outline'}
        onRightIconPress={() => setShowPassword1(prev => !prev)}
        returnKeyType="next"
        onSubmitEditing={() => {
          confirmPassRef.current?.focus();
          setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 300);
        }}
        blurOnSubmit={false}
      />

      <AuthInput
        inputRef={confirmPassRef}
        label="Confirm Password"
        icon="refresh"
        placeholder="Repeat your password"
        secureTextEntry={!showPassword2}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        rightIcon={showPassword2 ? 'eye-outline' : 'eye-off-outline'}
        onRightIconPress={() => setShowPassword2(prev => !prev)}
        returnKeyType="done"
        onSubmitEditing={handleSignup}
        blurOnSubmit={true}
        onFocus={() => { setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 300); }}
      />

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreed(prev => !prev)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <View style={styles.checkboxInner} />}
        </View>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.bold}>Terms of Service</Text> and{' '}
          <Text style={styles.bold}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primaryLight} style={{ marginVertical: 15 }} />
      ) : (
        <AuthButton title="Create Account" icon="arrow-forward" onPress={handleSignup} />
      )}

      <TouchableOpacity onPress={onToggle} style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.linkText}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 20 },
  termsRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center', marginTop: 5 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#CBD5E1', marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  checkboxInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  termsText: { flex: 1, fontSize: 12, color: '#64748B' },
  bold: { fontWeight: 'bold', color: '#1E293B' },
  footer: { marginTop: 15, alignItems: 'center' },
  footerText: { color: '#64748B' },
  linkText: { color: Colors.primaryLight, fontWeight: 'bold' },
});