import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Colors } from '../../constants/Color';

// ─── Help Data ────────────────────────────────────────────────────────────────

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    icon: 'rocket-outline',
    iconLib: 'Ionicons',
    color: '#2E7D32',
    bg: '#E8F5E9',
    title: 'Getting Started',
    items: [
      {
        q: 'What is Save & Serve?',
        a: 'Save & Serve connects local food businesses — bakeries, restaurants, and grocery shops — with customers who want to buy surplus food at reduced prices. It helps reduce food waste while letting you save money on quality meals.',
      },
      {
        q: 'How do I create an account?',
        a: 'Tap "Sign Up" on the welcome screen, enter your name, email, and a secure password. Verify your email address and you\'re ready to go.',
      },
      {
        q: 'Is the app free to use?',
        a: 'Yes! Downloading and using Save & Serve as a customer is completely free. You only pay for the food offers you book.',
      },
    ],
  },
  {
    id: 'browsing-offers',
    icon: 'storefront-outline',
    iconLib: 'MaterialCommunityIcons',
    color: '#1565C0',
    bg: '#E3F2FD',
    title: 'Browsing & Booking Offers',
    items: [
      {
        q: 'How do I find food offers near me?',
        a: 'Open the Explore tab to browse all available offers from nearby shops. You can filter by category (bakery, restaurant, grocery) and see each offer\'s price, quantity, and pickup time.',
      },
      {
        q: 'How do I book an offer?',
        a: 'Tap on an offer you like, review the details, and press "Book Now". The reservation is confirmed instantly and you\'ll receive a unique pickup code in your Orders tab.',
      },
      {
        q: 'What does the stock indicator mean?',
        a: 'Each offer shows how many units are left. Green means plenty available, orange means low stock (5 or fewer), and red means very low (2 or fewer). Act fast when you see low stock!',
      },
      {
        q: 'What is a pickup time?',
        a: 'The pickup time is the window during which you should collect your order from the shop. It\'s set by the seller and shown on each offer card. Make sure to arrive within that window.',
      },
    ],
  },
  {
    id: 'orders',
    icon: 'bag-handle-outline',
    iconLib: 'Ionicons',
    color: '#E65100',
    bg: '#FFF3E0',
    title: 'Orders & Pickup',
    items: [
      {
        q: 'How does the pickup code work?',
        a: 'After booking, you receive a unique pickup code in your Orders tab. When you arrive at the shop, the seller will ask for this code to confirm your pickup. Tap the eye icon to reveal it — keep it private until you\'re at the counter.',
      },
      {
        q: 'What are the order statuses?',
        a: 'Reserved: your booking is received and awaiting seller confirmation.\nConfirmed: the seller has accepted your order.\nReady: your order is packed and ready for pickup.\nCollected: you\'ve successfully picked up your order.\nCancelled: the order was cancelled by you or the seller.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Yes, you can cancel a Pending (Reserved) order from the Orders tab by tapping the "Cancel Order" button on the order card. Once a seller confirms your order, cancellation may no longer be available.',
      },
      {
        q: 'Where can I see my past orders?',
        a: 'Go to the Orders tab and switch to the "History" section. You\'ll find all your collected and cancelled orders there.',
      },
    ],
  },
  {
    id: 'mastery',
    icon: 'trophy-outline',
    iconLib: 'Ionicons',
    color: '#F9A825',
    bg: '#FFFDE7',
    title: 'Levels, Mastery & Vouchers',
    items: [
      {
        q: 'How does the level system work?',
        a: 'Every Algerian Dinar you spend on orders counts as XP. For every 200 DA spent, you advance one level. Your level is shown on your Mastery profile and reflects your commitment to reducing food waste.',
      },
      {
        q: 'What do I get for levelling up?',
        a: 'Every time you reach a new level, you automatically earn a discount voucher. The voucher\'s discount percentage grows as you level up:\n\nLevel 1 → 2% off\nLevel 2 → 3% off\nLevels 3–4 → 4% off\nLevels 5–9 → 5% off\nLevels 10–19 → 6% off\nLevel 20+ → 7% off',
      },
      {
        q: 'How do I use my voucher?',
        a: 'Go to My Mastery from your profile. Under "Reward Vouchers", tap Copy next to an active code and apply it at checkout. Each voucher is single-use only and has an expiry date.',
      },
      {
        q: 'What are the mastery titles and what do they mean?',
        a: 'As you level up, you earn an honorary title that reflects your eco impact:\n\nLevel 1 → Fresh Saver\nLevel 5 → Food Rescuer\nLevel 10 → Green Warrior\nLevel 15 → Eco Guardian\nLevel 20 → Planet Defender\nLevel 30 → Sustainability Hero\nLevel 40 → Earth Legend\n\nYour title is displayed on your Mastery profile.',
      },
      {
        q: 'What are the mastery badges?',
        a: 'Along with titles, you earn badges based on your level:\n\n🍃 Eco Starter (Levels 1–10)\n♻️ Green Guardian (Levels 11–20)\n🛡️ Eco Champion (Levels 21–30)\n👑 Sustainability Hero (Level 31+)\n\nBadges are shown on your avatar in the Mastery profile.',
      },
      {
        q: 'What is CO2 Saved and Meals Saved on my profile?',
        a: 'These stats show your real-world environmental impact. Every order you collect contributes to meals rescued from waste and an estimated CO2 emission reduction. They\'re updated automatically as you collect orders.',
      },
      {
        q: 'My voucher says "Expired" or "Used" — what does that mean?',
        a: 'Each voucher can only be used once and has an expiry date. If it says "Used", you\'ve already applied it to an order. If it says "Expired", the validity period has passed. Keep collecting orders to earn new ones!',
      },
    ],
  },
  {
    id: 'reviews',
    icon: 'star-outline',
    iconLib: 'Ionicons',
    color: '#00897B',
    bg: '#E0F2F1',
    title: 'Ratings & Reviews',
    items: [
      {
        q: 'How do I rate a shop?',
        a: 'After your order is marked as Collected, a "Rate" button appears on the order in your History tab. Tap it, select a star rating, and optionally leave a comment.',
      },
      {
        q: 'Why can\'t I see the rate button on some orders?',
        a: 'The rate button only appears once per collected order and disappears after you\'ve submitted a review. If you\'ve already rated that order, it won\'t show again.',
      },
    ],
  },
  {
    id: 'become-seller',
    icon: 'storefront-outline',
    iconLib: 'Ionicons',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    title: 'Becoming a Seller',
    items: [
      {
        q: 'How do I register my business?',
        a: 'Go to the Sell tab and tap "Become a Seller". Fill in your business name, type (bakery, restaurant, grocery, or other), a short description, your phone number, and your shop\'s location on the map. Upload your business registration document (PDF) and submit your application.',
      },
      {
        q: 'How long does approval take?',
        a: 'Our team typically reviews seller applications within 48 hours. You\'ll receive a push notification once a decision is made.',
      },
      {
        q: 'What happens if my application is refused?',
        a: 'You\'ll be notified of the refusal. You can resubmit your application after reviewing and correcting your information — make sure your business name, description, phone number, location, and uploaded PDF are all accurate.',
      },
      {
        q: 'How do I add a food offer as a seller?',
        a: 'Once approved, go to the Sell tab and tap the "+ Add Offer" button. Fill in the offer title, price, available quantity, pickup time, and a photo. Your offer will be visible to customers immediately after posting.',
      },
      {
        q: 'How do I manage incoming orders?',
        a: 'In the Sell tab, switch to the "Orders" section. Accept or reject pending orders, mark confirmed orders as Ready, and validate pickups by entering the customer\'s pickup code.',
      },
    ],
  },
  {
    id: 'account',
    icon: 'person-circle-outline',
    iconLib: 'Ionicons',
    color: '#00695C',
    bg: '#E0F2F1',
    title: 'Account & Profile',
    items: [
      {
        q: 'How do I update my personal information?',
        a: 'Go to the Profile tab and tap "Edit Profile". You can update your full name, phone number, address, and profile photo from there.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'On the login screen, tap "Forgot Password?" and enter your email address. You\'ll receive a reset link in your inbox to set a new password.',
      },
      {
        q: 'Is my personal data secure?',
        a: 'Yes. All sensitive data including passwords is encrypted. Your personal information is never sold to third parties and is only used to operate the app and personalise your experience.',
      },
      {
        q: 'Can I have both a customer and a seller account?',
        a: 'Your account starts as a customer account. Once you apply and get approved as a seller, your account switches to a seller account with access to the full seller dashboard.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: 'notifications-outline',
    iconLib: 'Ionicons',
    color: '#C62828',
    bg: '#FFEBEE',
    title: 'Notifications',
    items: [
      {
        q: 'What notifications will I receive?',
        a: 'You\'ll be notified when a seller confirms or rejects your order, when your order is ready for pickup, when new offers are available, and when your seller application status changes.',
      },
      {
        q: 'How do I manage notifications?',
        a: 'Notification permissions can be managed in your device\'s system settings under the Save & Serve app. In-app notification preferences will be available in a future update.',
      },
    ],
  },
  {
    id: 'contact',
    icon: 'headset-outline',
    iconLib: 'Ionicons',
    color: '#2E7D32',
    bg: '#E8F5E9',
    title: 'Contact & Support',
    items: [
      {
        q: 'How do I contact the support team?',
        a: 'Go to your Profile tab and tap "Contact Support". Choose a subject (Question, Report, Suggestion, or Other), write your message, and tap Send. Our team usually responds within 24 hours.',
      },
      {
        q: 'What can I contact support about?',
        a: 'You can reach us for anything — order issues, shop complaints, technical bugs, feature suggestions, or general questions about the app. Use the "Report" subject for urgent issues.',
      },
      {
        q: 'How do I report a problem with an order?',
        a: 'Contact us via the in-app Contact Support form with the "Report" subject. Include your order details and a description of the issue and we\'ll get back to you as quickly as possible.',
      },
      {
        q: 'How do I report a fraudulent or problematic shop?',
        a: 'Use the Contact Support form in the app, select "Report" as the subject, and describe the issue. We take all reports seriously and investigate promptly.',
      },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({ item, accentColor }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    setOpen(!open);
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.75}>
        <Text style={styles.accordionQuestion}>{item.q}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={accentColor} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionAnswer}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, expanded, onToggle }) {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, { toValue: expanded ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [expanded]);

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const IconComp = section.iconLib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.sectionIconCircle, { backgroundColor: section.bg }]}>
          <IconComp name={section.icon} size={22} color={section.color} />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionMeta}>
          <Text style={[styles.sectionCount, { color: section.color }]}>{section.items.length} topics</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sectionBody}>
          <View style={[styles.sectionDivider, { backgroundColor: section.bg }]} />
          {section.items.map((item, idx) => (
            <AccordionItem key={idx} item={item} accentColor={section.color} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HelpCenter() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const toggle = (id) => setExpandedId(prev => (prev === id ? null : id));

  const filtered = search.trim().length < 2
    ? HELP_SECTIONS
    : HELP_SECTIONS.map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(section => section.items.length > 0);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="chatbubbles-outline" size={34} color="#2E7D32" />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>Browse topics below or search for a specific question.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Chips */}
        {search.trim().length === 0 && (
          <View style={styles.quickLinks}>
            <Text style={styles.quickLinksTitle}>POPULAR TOPICS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinksRow}>
              {[
                { label: 'How to book',     id: 'browsing-offers' },
                { label: 'Pickup code',     id: 'orders'          },
                { label: 'Levels & badges', id: 'mastery'         },
                { label: 'My vouchers',     id: 'mastery'         },
                { label: 'Become a seller', id: 'become-seller'   },
                { label: 'Contact us',      id: 'contact'         },
              ].map((chip, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => setExpandedId(chip.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sections */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No results for "{search}"</Text>
            <Text style={styles.emptySubText}>Try a different keyword or browse the sections below.</Text>
          </View>
        ) : (
          filtered.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              expanded={expandedId === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))
        )}

        {/* Contact Footer */}
        <View style={styles.contactCard}>
          <View style={styles.contactCardHeader}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="headset-outline" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.contactCardTitle}>Still need help?</Text>
          </View>
          <Text style={styles.contactCardBody}>
            Our support team is here for you. Send us a message directly from the app and we'll get back to you within 24 hours.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/contact-support')}
          >
            <Ionicons name="send-outline" size={17} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F9F1' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#1a1a1a' },

  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: '#1a1a1a', marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#64748B', textAlign: 'center',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1a1a1a',
  },

  quickLinks: { marginBottom: 20 },
  quickLinksTitle: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#94A3B8',
    letterSpacing: 1, marginBottom: 10,
  },
  quickLinksRow: { gap: 8, paddingRight: 4 },
  chip: {
    backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  chipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#2E7D32' },

  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  sectionIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#1a1a1a' },
  sectionMeta: { alignItems: 'flex-end', gap: 4 },
  sectionCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionDivider: { height: 1.5, borderRadius: 1, marginBottom: 8 },

  accordionItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 2 },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, gap: 12,
  },
  accordionQuestion: {
    flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#1E293B', lineHeight: 20,
  },
  accordionBody: { paddingBottom: 14 },
  accordionAnswer: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#475569', lineHeight: 22,
  },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#64748B' },
  emptySubText: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#94A3B8', textAlign: 'center',
  },

  contactCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginTop: 8,
    borderWidth: 1, borderColor: '#C8E6C9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  contactCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactIconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
  },
  contactCardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#1a1a1a' },
  contactCardBody: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 16,
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14,
  },
  contactBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#FFFFFF' },
});