import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Color';
import { AuthInput } from '../../components/auth/AuthInput';
import { authService } from '../../services/authservice';

export default function ResetScreen() {
  const params = useLocalSearchParams();
  const email = (params?.email || '').toString();
  const otp   = (params?.otp   || '').toString();
  const router = useRouter();

  const confirmRef  = useRef(null);

  const [pwd, setPwd]         = useState('');
  const [conf, setConf]       = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePress = async () => {
    Keyboard.dismiss();
    if (!email || !otp) { setError('Reset session expired. Please restart from Forgot Password.'); return; }
    if (!pwd || !conf)  { setError('Please fill in both password fields.'); return; }
    if (pwd.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (pwd !== conf)   { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      const result = await authService.resetPassword(email, otp, pwd);
      if (result?.success) {
        Alert.alert('Success', 'Password reset successful. You can now log in.');
        router.replace('/(auth)/AuthScreen');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const isLongEnough = pwd.length >= 6;
  const matches      = pwd.length > 0 && pwd === conf;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>SECURITY</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon — smaller to save space */}
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="lock-reset" size={40} color={Colors.primary} />
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from previously used passwords.
          </Text>

          {/* Form card */}
          <View style={styles.formBlock}>
            <AuthInput
              label="New Password"
              icon="lock-outline"
              placeholder="Enter new password"
              secureTextEntry={!showPwd}
              value={pwd}
              onChangeText={(v) => { setPwd(v); setError(''); }}
              rightIcon={showPwd ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowPwd(p => !p)}
              returnKeyType="next"
              onSubmitEditing={() => {
                confirmRef.current?.focus();
              }}
              blurOnSubmit={false}
            />

            <AuthInput
              inputRef={confirmRef}
              label="Confirm Password"
              icon="lock-outline"
              placeholder="Repeat new password"
              secureTextEntry={!showConf}
              value={conf}
              onChangeText={(v) => { setConf(v); setError(''); }}
              rightIcon={showConf ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowConf(p => !p)}
              returnKeyType="done"
              onSubmitEditing={handlePress}
              blurOnSubmit={true}
            />

            {/* Validation hints */}
            <View style={styles.hints}>
              <View style={styles.hintRow}>
                <Ionicons name={isLongEnough ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={isLongEnough ? Colors.primary : '#CBD5E1'} />
                <Text style={[styles.hintText, isLongEnough && styles.hintActive]}>At least 6 characters</Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons name={matches ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={matches ? Colors.primary : '#CBD5E1'} />
                <Text style={[styles.hintText, matches && styles.hintActive]}>Passwords match</Text>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <TouchableOpacity style={styles.btn} onPress={handlePress}>
                <Text style={styles.btnText}>Reset Password</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* Back to login — always visible, inside scroll so never cut off */}
          <TouchableOpacity style={styles.backRow} onPress={() => router.replace('/(auth)/AuthScreen')}>
            <Ionicons name="log-in-outline" size={18} color={Colors.primary} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3FEF7' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },

  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Smaller icon to save vertical space
  iconBox: {
    width: 80, height: 80,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.primary,
    padding: 5, borderRadius: 10,
    borderWidth: 2, borderColor: '#F3FEF7',
  },

  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  formBlock: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },

  hints: { marginBottom: 12, gap: 6 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontSize: 12, color: '#CBD5E1' },
  hintActive: { color: Colors.primary, fontWeight: '600' },

  errorText: { color: '#B91C1C', fontSize: 13, marginBottom: 10, textAlign: 'center' },

  btn: {
    backgroundColor: Colors.primary,
    width: '100%', height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
});