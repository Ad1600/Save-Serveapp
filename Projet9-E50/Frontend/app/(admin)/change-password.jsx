import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authservice';

const Colors = {
  primary: '#2E7D32',
  primaryLight: '#66BB6A',
  primaryBg: '#E8F5E9',
  background: '#F4F9F1',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F8FAF8',
  white: '#FFFFFF',
};

const PasswordField = ({ label, value, onChangeText, show, onToggle }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name="lock-closed-outline" size={17} color={Colors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        placeholderTextColor={Colors.textSecondary}
        placeholder="••••••••"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={show ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleOld     = useCallback(() => setShowOld(v => !v), []);
  const toggleNew     = useCallback(() => setShowNew(v => !v), []);
  const toggleConfirm = useCallback(() => setShowConfirm(v => !v), []);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from the old one.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.changePassword({
        ancienMotDePasse: oldPassword,
        nouveauMotDePasse: newPassword,
      });
      if (response.success) {
        Alert.alert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon Header */}
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Secure Your Account</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to protect your admin access.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="key-outline" size={16} color={Colors.primary} />
              <Text style={styles.cardHeaderText}>Update credentials</Text>
            </View>

            <View style={styles.divider} />

            <PasswordField
              label="CURRENT PASSWORD"
              value={oldPassword}
              onChangeText={setOldPassword}
              show={showOld}
              onToggle={toggleOld}
            />
            <PasswordField
              label="NEW PASSWORD"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              onToggle={toggleNew}
            />
            <PasswordField
              label="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              onToggle={toggleConfirm}
            />

            {/* Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.infoText}>Min. 8 characters</Text>
              </View>
              <View style={styles.infoBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.infoText}>Different from current</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  iconHeader: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: 12 },
  iconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(46,125,50,0.15)',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },

  card: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 22,
    shadowColor: '#1B4332', shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(46,125,50,0.07)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  cardHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 20 },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: Colors.textSecondary, marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 15, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },

  infoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 22, marginTop: 4 },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryBg,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  infoText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 30,
    height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
