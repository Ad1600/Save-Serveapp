import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Color';
import { OTPInput } from '../../components/auth/OTPInput';
import { authService } from '../../services/authservice';
import favoriteStore from '../../services/favoriteStore';

export default function VerifyScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const getEmail = async () => {
      const savedEmail = await SecureStore.getItemAsync('temp_email');
      if (savedEmail) {
        setEmail(savedEmail);
      } else {
        Alert.alert("Error", "Session expired. Please sign up again.");
        router.back();
      }
    };
    getEmail();
  }, []);

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Error", "Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyEmail(email, code);
      if (response.success) {
        await SecureStore.setItemAsync('userToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
        favoriteStore.setUserScope(response.data?._id);
        Alert.alert("Success", "Email verified successfully!");
        router.replace('/(tabs)/explore');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Verification failed. Please try again.";
      Alert.alert("Verification Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      await authService.resendCode(email);
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Could not resend code.";
      Alert.alert("Error", errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header — centered title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SECURITY</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustrationContainer}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="email" size={50} color={Colors.primary} />
              <View style={styles.badge}>
                <MaterialCommunityIcons name="email-check" size={14} color="white" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Almost There!</Text>
          <Text style={styles.subtitle}>
            Enter the code we sent to <Text style={styles.emailText}>{email}</Text> to continue.
          </Text>

          <OTPInput otp={otp} setOtp={setOtp} />

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
              <Text style={styles.verifyBtnText}>Verify & Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}

          <Text style={styles.helpText}>Can't find the email? Resend the code.</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending || !email}>
            <Text style={[styles.resendLink, (resending || !email) && styles.resendLinkDisabled]}>
              {resending ? 'Resending...' : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3FEF7' },

  // Header — same as forgot, centered
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },

  content: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 40, paddingBottom: 40 },
  illustrationContainer: { marginBottom: 40 },
  iconBox: {
    width: 100, height: 100,
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.primary,
    padding: 6, borderRadius: 12,
    borderWidth: 3, borderColor: '#F3FEF7',
  },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  emailText: { color: '#1E293B', fontWeight: 'bold' },
  verifyBtn: {
    backgroundColor: Colors.primary,
    width: '100%', height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 20, elevation: 5,
  },
  verifyBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  helpText: { marginTop: 30, fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  resendLink: { marginTop: 8, color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
  resendLinkDisabled: { color: '#9CA3AF' },
});