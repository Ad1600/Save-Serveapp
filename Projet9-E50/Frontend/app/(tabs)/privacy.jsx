import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Color';

const SECTIONS = [
  {
    number: '1',
    title: 'Information We Collect',
    icon: 'document-text-outline',
    items: [
      { label: 'Account information', text: 'When you register, we collect your name, email address, password and your role (customer or merchant).' },
      { label: 'Profile data', text: 'Your profile picture (avatar), your phone number, and any dietary preferences.' },
      { label: 'Location data', text: 'With your permission, we collect your geographic location to show you unsold meals and nearby merchants.' },
      { label: 'Usage and impact data', text: 'Your order history, the number of meals saved and the amount of CO₂ avoided thanks to your actions.' },
    ],
  },
  {
    number: '2',
    title: 'How We Use Your Information',
    icon: 'settings-outline',
    items: [
      { text: 'Facilitating connections between merchants (sellers) and customers (buyers).' },
      { text: 'Process and track your meal reservations.' },
      { text: 'Calculate and display your environmental impact statistics (CO₂ and meals saved).' },
      { text: 'Secure your account (email verification, password reset).' },
      { text: 'To send you important notifications regarding your orders.' },
    ],
  },
  {
    number: '3',
    title: 'Sharing Your Information',
    icon: 'share-social-outline',
    items: [
      { label: 'Between users', text: "When a customer books a meal, the merchant has access to the customer's name to validate the order upon collection." },
      { label: 'Legal obligations', text: 'We may disclose your information if required by law.' },
    ],
    note: 'We never sell your personal data to third parties.',
  },
  {
    number: '4',
    title: 'Data Security',
    icon: 'shield-checkmark-outline',
    text: 'We implement technical security measures (such as password encryption and the use of secure tokens) to protect your data against unauthorized access, modification, or destruction.',
  },
  {
    number: '5',
    title: 'Your Rights and Controls',
    icon: 'person-outline',
    items: [
      { text: 'Access and modify your personal information directly from the "Settings / Profile" page of the application.' },
      { text: "You can disable location services at any time via your phone's settings." },
      { text: 'Delete your account: You can request the permanent deletion of your account and all associated data at any time from the application.' },
    ],
  },
  {
    number: '6',
    title: 'About This Project',
    icon: 'school-outline',
    text: 'Note: Save & Serve was developed as part of a Multidisciplinary Project at the National School of Computer Science (ESI). The data collected is used for academic demonstration and prototype functionality.',
  },
];

const CONTACTS = [
  { email: 'om_hamouda@esi.dz' },
  { email: 'od_guettaf@esi.dz' },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="leaf" size={28} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Welcome to Save & Serve</Text>
          <Text style={styles.heroSubtitle}>
            Protecting your personal data is a priority for us. This privacy policy explains how we collect, use, share, and protect your information when you use our mobile application.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.number} style={styles.sectionCard}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBadge}>
                <Text style={styles.sectionNumber}>{section.number}</Text>
              </View>
              <View style={styles.sectionIconWrap}>
                <Ionicons name={section.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {/* Optional highlight note */}
            {section.note && (
              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={15} color={Colors.primary} />
                <Text style={styles.noteText}>{section.note}</Text>
              </View>
            )}

            {/* Plain text body */}
            {section.text && (
              <Text style={styles.bodyText}>{section.text}</Text>
            )}

            {/* Bullet items */}
            {section.items && section.items.map((item, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  {item.label && (
                    <Text style={styles.bulletLabel}>{item.label}: </Text>
                  )}
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact section */}
        <View style={styles.contactCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumberBadge}>
              <Text style={styles.sectionNumber}>7</Text>
            </View>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          <Text style={styles.bodyText}>
            If you have any questions regarding this privacy policy or your personal data, please contact us at:
          </Text>
          {CONTACTS.map(({ email }) => (
            <TouchableOpacity
              key={email}
              style={styles.emailBtn}
              onPress={() => Linking.openURL(`mailto:${email}`)}
              activeOpacity={0.75}
            >
              <Ionicons name="at" size={15} color={Colors.primary} />
              <Text style={styles.emailText}>{email}</Text>
              <Ionicons name="open-outline" size={13} color={Colors.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Last updated · 3 May 2026 · Save &amp; Serve · ESI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F9F1' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F4F9F1',
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 48 },

  // Hero
  heroBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumber: { fontSize: 11, fontWeight: '800', color: '#fff' },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },

  // Note box
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 6,
  },
  noteText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', flex: 1, lineHeight: 18 },

  // Body text
  bodyText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  // Bullet
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: { fontSize: 13, color: '#475569', lineHeight: 20, flex: 1 },
  bulletLabel: { fontWeight: '700', color: '#1E293B' },

  // Contact card
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emailText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
});
