import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Color';
import { AuthInput } from '../../components/auth/AuthInput';
import { authService } from '../../services/authservice';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePress = async () => {
    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authService.requestPasswordReset(trimmedEmail);
      if (result?.success) {
        router.push({
          pathname: '/(auth)/verify-reset',
          params: { email: trimmedEmail },
        });
        return;
      }
    } catch (e) {
      if (isTimeoutError(e) || !e?.response) {
        Alert.alert('Connection Error', 'Please check your internet connection.');
        return;
      }

      if (e?.response?.status === 404) {
        setError('No account is associated with this email.');
        return;
      }

      setError(e?.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header — same style as verify screen, centered */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SECURITY</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.illustrationContainer}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="email" size={50} color={Colors.primary} />
              <View style={styles.badge}>
                <MaterialCommunityIcons name="lock-reset" size={14} color="white" />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Troubles logging in?</Text>
          <Text style={styles.subtitle}>
            Enter your registered email below, and we'll send you instructions to reset your password.
          </Text>

          {/* Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <AuthInput
              icon="email-outline"
              placeholder="hello@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handlePress}
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* Button */}
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.btn} onPress={handlePress}>
              <Text style={styles.btnText}>Send Code</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.replace('/(auth)/AuthScreen')}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3FEF7' },

  // Header — identical to verify screen
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

  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Icon
  illustrationContainer: { marginBottom: 40 },
  iconBox: {
    width: 100, height: 100,
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.primary,
    padding: 6, borderRadius: 12,
    borderWidth: 3, borderColor: '#F3FEF7',
  },

  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 32 },

  inputWrapper: { width: '100%', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },

  errorText: { color: '#B91C1C', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' },

  btn: {
    backgroundColor: Colors.primary,
    width: '100%', height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 5,
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '700' },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
  },
  backText: { color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
});