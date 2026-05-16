import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Color';
import { OTPInput } from '../../components/auth/OTPInput';
import { authService } from '../../services/authservice';
import ResendCodeButton from '../../components/auth/ResendCodeButton';

const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');

export default function VerifyResetScreen() {
  const params = useLocalSearchParams();
  const email = (params?.email || '').toString();
  const router = useRouter();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(900);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastSubmittedOtpRef = useRef('');

  const otp = code.join('').trim();

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (otpValue = otp) => {
    const currentOtp = otpValue.toString().trim();
    if (!email) { setError('Missing email. Please restart the reset flow.'); return; }
    if (currentOtp.length !== 6) { setError('Please enter the full 6-digit code.'); return; }

    if (loading) {
      return;
    }

    lastSubmittedOtpRef.current = currentOtp;
    setLoading(true);
    setError('');
    try {
      const result = await authService.verifyOTP(email, currentOtp);
      if (result?.success) {
        router.push({ pathname: '/(auth)/reset', params: { email, otp: currentOtp } });
        return;
      }
    } catch (e) {
      setLoading(false);

      if (isTimeoutError(e) || !e?.response) {
        Alert.alert('Connection Error', 'Please check your internet connection.');
        return;
      }

      setError('Incorrect code');
      return;
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.length !== 6) {
      lastSubmittedOtpRef.current = '';
      return;
    }
    if (otp === lastSubmittedOtpRef.current) {
      return;
    }
    handleVerify(otp);
  }, [otp]);

  const handleResend = async () => {
    setError('');
    try {
      await authService.requestPasswordReset(email);
      setTimer(900);
      lastSubmittedOtpRef.current = '';
      setCode(['', '', '', '', '', '']);
    } catch (e) {
      if (isTimeoutError(e) || !e?.response) {
        Alert.alert('Connection Error', 'Please check your internet connection.');
        return;
      }

      setError(e?.response?.data?.message || 'Could not resend code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.illustrationContainer}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="lock-reset" size={50} color={Colors.primary} />
              <View style={styles.badge}>
                <MaterialCommunityIcons name="email-check" size={14} color="white" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailText}>{email}</Text>.{'\n'}
            Enter it below to reset your password.
          </Text>

          <Text style={styles.timer}>
            Code expires in{' '}
            <Text style={[styles.timerBold, timer < 60 && styles.timerRed]}>
              {formatTime()}
            </Text>
          </Text>

          <OTPInput otp={code} setOtp={setCode} />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity
              style={[styles.btn, otp.length !== 6 && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={otp.length !== 6}
            >
              <Text style={styles.btnText}>Verify & Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}

          <Text style={styles.helpText}>Didn't receive the code?</Text>
          <ResendCodeButton onResend={handleResend} cooldownSeconds={60} label="Resend Code" />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3FEF7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
  content: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 40, paddingBottom: 40 },
  illustrationContainer: { marginBottom: 40 },
  iconBox: { width: 100, height: 100, backgroundColor: '#D1FAE5', borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.primary, padding: 6, borderRadius: 12, borderWidth: 3, borderColor: '#F3FEF7' },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  emailText: { color: '#1E293B', fontWeight: 'bold' },
  timer: { fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  timerBold: { fontWeight: '700', color: '#64748B' },
  timerRed: { color: '#B91C1C' },
  errorText: { color: '#B91C1C', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, width: '100%', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 5 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  helpText: { marginTop: 30, fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  resendLink: { marginTop: 8, color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
  resendDisabled: { color: '#9CA3AF' },
});