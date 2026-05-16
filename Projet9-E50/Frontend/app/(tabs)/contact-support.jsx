import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Color';
import { StatusBar } from 'expo-status-bar';
import { supportService } from '../../services/supportService';

const SUBJECTS = [
  { key: 'question',    label: 'Question',    icon: 'help-circle-outline',   color: '#3B82F6' },
  { key: 'bug',         label: 'Report',      icon: 'bug-outline',           color: '#EF4444' },
  { key: 'suggestion',  label: 'Suggestion',  icon: 'bulb-outline',          color: '#F59E0B' },
  { key: 'autre',       label: 'Other',       icon: 'chatbubble-outline',    color: '#8B5CF6' },
];

export default function ContactSupport() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState('question');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await supportService.sendMessage({ sujet: selectedSubject, message: message.trim() });
      setSent(true);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successText}>
            Our team will get back to you as soon as possible.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroBanner}>
              <Ionicons name="help-circle-outline" size={36} color={Colors.primary} />
              <Text style={styles.heroTitle}>How can we help you?</Text>
              <Text style={styles.heroSubtitle}>
                Select a subject and describe your issue.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Subject</Text>
            <View style={styles.subjectGrid}>
              {SUBJECTS.map((s) => {
                const active = selectedSubject === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.subjectCard, active && { borderColor: s.color, backgroundColor: s.color + '12' }]}
                    onPress={() => setSelectedSubject(s.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={s.icon} size={22} color={active ? s.color : '#94A3B8'} />
                    <Text style={[styles.subjectLabel, active && { color: s.color, fontWeight: '700' }]}>
                      {s.label}
                    </Text>
                    {active && (
                      <View style={[styles.subjectCheck, { backgroundColor: s.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
              <Text style={styles.infoText}>
                We usually respond within 24 hours.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  heroBanner: {
    alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginTop: 12, textAlign: 'center' },
  heroSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, letterSpacing: 0.8 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  subjectCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.gray,
    paddingVertical: 12, paddingHorizontal: 12, position: 'relative',
  },
  subjectLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  subjectCheck: {
    position: 'absolute', top: 6, right: 6, width: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  textArea: {
    backgroundColor: '#E4EDE4', borderRadius: 14,
    padding: 16, fontSize: 14, color: Colors.textPrimary, minHeight: 130,
    marginBottom: 16, lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 24,
  },
  infoText: { fontSize: 12, color: Colors.primary, flex: 1, fontWeight: '500' },
  sendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, height: 52,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIconWrap: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  successText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  backButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
