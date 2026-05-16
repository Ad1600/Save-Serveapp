import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, Modal, Platform, Pressable, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Asset } from 'expo-asset';
import { Colors } from '../../constants/Color';
import Header from '../../components/explore/Header';
import { orderService } from '../../services/orderService';
import { offerService } from '../../services/offerService';
import { BASE_URL } from '../../constants/Api';
import { sellerService } from '../../services/sellerService';
import api from '../../services/api';
import imgfigma from '../../assets/images/images/dev2.png';

// ─── Gate Logic ───────────────────────────────────────────────────────────────

async function getUserData() {
  try {
    const stored = await SecureStore.getItemAsync('userData');
    const parsed = JSON.parse(stored);
    return parsed;
  } catch { return null; }
}

async function getUserRole() {
  const data = await getUserData();
  return data?.role || 'client';
}

async function getUserId() {
  const data = await getUserData();
  return data?._id || data?.id || 'default';
}

async function getApplicationStatus() {
  try {
    const response = await api.get('/vendeur/ma-demande');
    const demande = response?.data?.data;
    if (demande && demande.statut) {
      try { await SecureStore.setItemAsync('lastRequestStatus', demande.statut); } catch (e) {}

      // ✅ If refused but user already dismissed it, treat as null (show form)
      if (demande.statut === 'REFUSEE') {
        const dismissed = await SecureStore.getItemAsync('refusedDismissed');
        if (dismissed === 'true') return null;
      }

      return demande.statut;
    }
    return null;
  } catch (error) {
    try {
      const cachedStatus = await SecureStore.getItemAsync('lastRequestStatus');
      if (cachedStatus) {
        // ✅ Same check for cached status
        if (cachedStatus === 'REFUSEE') {
          const dismissed = await SecureStore.getItemAsync('refusedDismissed');
          if (dismissed === 'true') return null;
        }
        return cachedStatus;
      }
    } catch (e) {}
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ACTIVE:        { label: 'ACTIVE',        container: '#DCFCE7', text: '#15803D' },
  LOW:           { label: 'LOW STOCK',     container: '#FEE2E2', text: '#DC2626' },
  OUT_OF_STOCK:  { label: 'OUT OF STOCK',  container: '#E2E8F0', text: '#475569' },
  PENDING:       { label: 'PENDING',       container: '#EDE7F6', text: '#4527A0' },
  CONFIRMED:     { label: 'CONFIRMED',     container: '#E2E8F0', text: '#475569' },
  READY:         { label: 'READY',         container: '#166534', text: '#FFFFFF' },
  COLLECTED:     { label: 'COLLECTED',     container: '#FEF3C7', text: '#B45309' },
  CANCELLED:     { label: 'CANCELLED',     container: '#FEE2E2', text: '#DC2626' },
};

const ORDER_FILTERS = [
  { key: 'ALL',       label: 'All Orders' },
  { key: 'PENDING',   label: 'Pending'    },
  { key: 'CONFIRMED', label: 'Confirmed'  },
  { key: 'READY',     label: 'Ready'      },
  { key: 'COLLECTED', label: 'Collected'  },
  { key: 'CANCELLED', label: 'Cancelled'  },
];

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 30 + 72 : 20 + 72;

const BUSINESS_TYPES = [
  { label: 'Bakery',     icon: '🥐' },
  { label: 'Restaurant', icon: '🍲' },
  { label: 'Grocery',    icon: '🍎' },
  { label: 'Other',      icon: '🍱' },
];

const DEFAULT_REGION = {
  latitude: 36.7538, longitude: 3.0588,
  latitudeDelta: 0.05, longitudeDelta: 0.05,
};

function getStockColor(left) {
  if (left === 0) return '#94A3B8';
  if (left <= 2) return '#EF4444';
  if (left <= 5) return '#F59E0B';
  return Colors.primary;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.CONFIRMED;
  return (
    <View style={[styles.badge, { backgroundColor: s.container }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

// ─── Address Search ───────────────────────────────────────────────────────────

async function searchAddress(query) {
  if (!query || query.length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=dz`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'SaveAndServeApp/1.0' } });
    const data = await res.json();
    return data.map(item => ({ display_name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }));
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'SaveAndServeApp/1.0' } });
    const data = await res.json();
    return data.display_name ?? '';
  } catch { return ''; }
}

// ─── Location Picker Modal ────────────────────────────────────────────────────

function LocationPickerModal({ visible, onClose, onConfirm, initialCoords }) {
  const mapRef = useRef(null);
  const [pin, setPin] = useState(initialCoords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [searchText, setSearchText]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const searchTimeout                 = useRef(null);

  useEffect(() => { if (visible && initialCoords) setPin(initialCoords); }, [visible, initialCoords]);

  const handleSearchChange = (text) => {
    setSearchText(text);
    clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      setSuggestions(await searchAddress(text));
      setSearching(false);
    }, 500);
  };

  const handleSuggestionPress = (item) => {
    const coords = { latitude: item.lat, longitude: item.lng };
    setPin(coords); setSearchText(item.display_name); setSuggestions([]);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const address = searchText.length > 5 ? searchText : await reverseGeocode(pin.latitude, pin.longitude);
    setConfirming(false);
    onConfirm({ lat: pin.latitude, lng: pin.longitude, address });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={lStyles.root}>
        <View style={lStyles.header}>
          <View style={lStyles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={lStyles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color="#113521" />
            </TouchableOpacity>
          </View>
          <View style={lStyles.headerCenter}><Text style={lStyles.headerTitle}>Pick Location</Text></View>
          <View style={lStyles.headerRight}>
            <TouchableOpacity style={[lStyles.confirmBtn, confirming && { opacity: 0.6 }]} onPress={handleConfirm} disabled={confirming}>
              {confirming ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={lStyles.confirmBtnText}>Confirm</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <View style={lStyles.searchWrapper}>
          <View style={lStyles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput style={lStyles.searchInput} placeholder="Search address, e.g. Kouba..." placeholderTextColor="#94A3B8" value={searchText} onChangeText={handleSearchChange} autoCorrect={false} />
            {searching && <ActivityIndicator size="small" color="#2E7D32" />}
            {searchText.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          {suggestions.length > 0 && (
            <View style={lStyles.suggestions}>
              {suggestions.map((item, index) => (
                <TouchableOpacity key={index} style={[lStyles.suggestionItem, index < suggestions.length - 1 && lStyles.suggestionBorder]} onPress={() => handleSuggestionPress(item)}>
                  <Ionicons name="location-outline" size={16} color="#2E7D32" style={{ marginRight: 8 }} />
                  <Text style={lStyles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={{ flex: 1 }}
          initialRegion={initialCoords?.latitude ? { ...initialCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 } : DEFAULT_REGION}
          onPress={e => { setPin(e.nativeEvent.coordinate); setSuggestions([]); }}>
          <Marker coordinate={pin} />
        </MapView>
      </View>
    </Modal>
  );
}

// ─── Become a Seller Screen (with PDF upload) ─────────────────────────────────

function BecomeSellerScreen({ onApplicationSubmitted }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => { Asset.fromModule(require('../../assets/images/images/dev2.png')).downloadAsync().then(() => setImageLoaded(true)); }, []);

  const [selectedType, setSelectedType]     = useState(BUSINESS_TYPES[0]);
  const [isExpanded, setIsExpanded]         = useState(false);
  const [shopName, setShopName]             = useState('');
  const [aboutShop, setAboutShop]           = useState('');
  const [phone, setPhone]                   = useState('');
  const [phoneError, setPhoneError]         = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [address, setAddress]               = useState('');
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [validationError, setValidationError] = useState('');
  const [pdfAsset, setPdfAsset]             = useState(null);
  const [pdfUploading, setPdfUploading]     = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // ✅ NEW

  const scrollRef     = useRef(null);
  const textAreaRef   = useRef(null);
  const scrollYOffset = useRef(0);

  // ✅ NEW: keyboard height listener — moves content, NOT the tab bar
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const validatePhone = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    if (cleaned.length === 0) { setPhoneError(''); return; }
    if (!/^(05|06|07)/.test(cleaned)) { setPhoneError('Must start with 05, 06, or 07'); }
    else if (cleaned.length < 10) { setPhoneError('Must be exactly 10 digits'); }
    else { setPhoneError(''); }
  };

  const handleTextAreaFocus = () => {
    setTimeout(() => {
      if (!textAreaRef.current || !scrollRef.current) return;
      textAreaRef.current.measureInWindow((x, pageY) => {
        scrollRef.current.scrollTo({ y: scrollYOffset.current + pageY - 160, animated: true });
      });
    }, 350);
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPdfAsset({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/pdf',
      });
    } catch (err) {
      Alert.alert('Error', 'Could not select PDF.');
    }
  };

  const isFormValid = () =>
    shopName.trim() !== '' &&
    aboutShop.trim() !== '' &&
    selectedType &&
    phone.length === 10 &&
    phoneError === '' &&
    locationCoords !== null &&
    pdfAsset !== null;

  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!shopName.trim()) missing.push('Business Name');
    if (!aboutShop.trim()) missing.push('About Your Shop');
    if (phone.length !== 10 || phoneError) missing.push('Valid Phone Number');
    if (!locationCoords) missing.push('Shop Location');
    if (!pdfAsset) missing.push('Business Document (PDF)');
    return `Please fill in: ${missing.join(', ')}.`;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setValidationError(getMissingFieldsMessage());
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }
    setValidationError('');
    setSubmitting(true);
    setPdfUploading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const formData = new FormData();
      const categorieMap = { Bakery: 'boulangerie', Restaurant: 'restaurant', Grocery: 'epicerie', Other: 'autre' };

      formData.append('nomCommerce', shopName);
      formData.append('adresseCommerce', address || `${locationCoords.lat}, ${locationCoords.lng}`);
      formData.append('descriptionShop', aboutShop);
      formData.append('telephone', phone);
      formData.append('categorie', categorieMap[selectedType.label] || 'autre');
      formData.append('latitude', String(locationCoords.lat));
      formData.append('longitude', String(locationCoords.lng));

      formData.append('documentPdf', {
        uri: pdfAsset.uri,
        name: pdfAsset.name,
        type: pdfAsset.mimeType || 'application/pdf',
      });

      const response = await fetch(`${BASE_URL}/api/vendeur/postuler`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Submission failed');

      try { await SecureStore.deleteItemAsync('refusedDismissed'); } catch (e) {}

      onApplicationSubmitted();
    } catch (e) {
      setValidationError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setPdfUploading(false);
    }
  };

  return (
    <SafeAreaView style={bStyles.root} edges={['top']}>
      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onConfirm={({ lat, lng, address: addr }) => { setLocationCoords({ lat, lng }); setAddress(addr); }}
        initialCoords={locationCoords ? { latitude: locationCoords.lat, longitude: locationCoords.lng } : null}
      />
      <View style={bStyles.header}>
        <View style={bStyles.headerSide} />
        <Text style={bStyles.headerTitle}>Become a Seller</Text>
        <View style={bStyles.headerSide} />
      </View>

      {/* ✅ Plain View instead of KeyboardAvoidingView */}
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsExpanded(false); }}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              bStyles.scrollContent,
              // ✅ Dynamic bottom padding — pushes content up, tab bar stays fixed
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + TAB_BAR_HEIGHT + 20 : TAB_BAR_HEIGHT + 20 }
            ]}
            keyboardShouldPersistTaps="handled"
            onScroll={e => { scrollYOffset.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
          >
            {imageLoaded ? <Image source={imgfigma} style={bStyles.heroImage} /> : <View style={[bStyles.heroImage, { backgroundColor: '#E4EDE4' }]} />}
            <Text style={bStyles.heroTitle}>Start Your Food{'\n'}Rescue Today</Text>

            {/* ─── Shop Profile Card ─── */}
            <View style={bStyles.card}>
              <View style={bStyles.cardHeader}>
                <View style={bStyles.iconCircle}><MaterialCommunityIcons name="storefront-outline" size={20} color="#2E7D32" /></View>
                <Text style={bStyles.cardTitle}>SHOP PROFILE</Text>
              </View>
              <View style={bStyles.inputGroup}>
                <Text style={bStyles.label}>BUSINESS NAME</Text>
                <TextInput
                  style={bStyles.input}
                  placeholder="e.g. Fern & Flora"
                  placeholderTextColor="#9E9E9E"
                  value={shopName}
                  onChangeText={v => { setShopName(v); setValidationError(''); }}
                />
              </View>
              <View style={[bStyles.inputGroup, { marginTop: 15, zIndex: 99 }]}>
                <Text style={bStyles.label}>BUSINESS TYPE</Text>
                <TouchableOpacity
                  style={[bStyles.collapsibleHeader, isExpanded && bStyles.headerExpanded]}
                  onPress={() => { setIsExpanded(!isExpanded); Keyboard.dismiss(); }}
                >
                  <View style={bStyles.selectedContainer}>
                    <Text style={bStyles.selectedIcon}>{selectedType.icon}</Text>
                    <Text style={bStyles.selectedLabel}>{selectedType.label}</Text>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#2E7D32" />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={bStyles.menuContainer}>
                    {BUSINESS_TYPES.map((item, index) => (
                      <TouchableOpacity
                        key={item.label}
                        style={[bStyles.menuItem, index === BUSINESS_TYPES.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => { setSelectedType(item); setIsExpanded(false); }}
                      >
                        <Text style={bStyles.menuItemIcon}>{item.icon}</Text>
                        <Text style={[bStyles.menuItemLabel, selectedType.label === item.label && bStyles.activeItemLabel]}>{item.label}</Text>
                        {selectedType.label === item.label && <Ionicons name="checkmark-sharp" size={16} color="#2E7D32" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View ref={textAreaRef} style={[bStyles.inputGroup, { marginTop: 15 }]}>
                <Text style={bStyles.label}>ABOUT YOUR SHOP</Text>
                <TextInput
                  style={[bStyles.input, bStyles.textArea]}
                  placeholder="Tell customers what makes your shop unique..."
                  placeholderTextColor="#9E9E9E"
                  multiline
                  value={aboutShop}
                  onChangeText={v => { setAboutShop(v); setValidationError(''); }}
                  onFocus={handleTextAreaFocus}
                />
              </View>
            </View>

            {/* ─── Contact & Location Card ─── */}
            <View style={bStyles.card}>
              <View style={bStyles.cardHeader}>
                <View style={bStyles.iconCircle}><Ionicons name="location-outline" size={20} color="#2E7D32" /></View>
                <Text style={bStyles.cardTitle}>CONTACT & LOCATION</Text>
              </View>
              <Text style={bStyles.label}>PHONE NUMBER</Text>
              <View style={bStyles.phoneRow}>
                <View style={bStyles.countryCode}><Text style={bStyles.countryCodeText}>+213</Text></View>
                <TextInput
                  style={[bStyles.input, { flex: 1 }, phoneError && bStyles.inputError]}
                  placeholder="0612345678"
                  placeholderTextColor="#9E9E9E"
                  value={phone}
                  onChangeText={v => { validatePhone(v); setValidationError(''); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {phoneError
                ? <Text style={bStyles.errorText}>{phoneError}</Text>
                : phone.length === 10
                  ? <Text style={bStyles.successText}>✓ Valid number</Text>
                  : null
              }
              <View style={[bStyles.inputGroup, { marginTop: 20 }]}>
                <Text style={bStyles.label}>SHOP LOCATION</Text>
                <TouchableOpacity
                  style={bStyles.locationPickerBtn}
                  onPress={() => { setLocationPickerVisible(true); setValidationError(''); }}
                >
                  <Ionicons name="map-outline" size={20} color="#2E7D32" />
                  <Text style={bStyles.locationPickerBtnText}>
                    {locationCoords ? 'Change Location' : 'Pick Location on Map'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
                {locationCoords && address ? (
                  <View style={bStyles.locationConfirmed}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                    <Text style={bStyles.locationConfirmedText} numberOfLines={2}>{address}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ─── PDF Upload Card ─── */}
            <View style={bStyles.card}>
              <View style={bStyles.cardHeader}>
                <View style={bStyles.iconCircle}><Feather name="file-text" size={20} color="#2E7D32" /></View>
                <Text style={bStyles.cardTitle}>BUSINESS DOCUMENT</Text>
              </View>
              <TouchableOpacity style={bStyles.pdfPickerBtn} onPress={pickPDF} disabled={pdfUploading}>
                <Ionicons name="document-outline" size={24} color={pdfAsset ? '#2E7D32' : '#94A3B8'} />
                <Text style={[bStyles.pdfPickerText, pdfAsset && { color: '#2E7D32' }]}>
                  {pdfAsset ? pdfAsset.name : 'Upload your business registration (PDF)'}
                </Text>
                {pdfUploading && <ActivityIndicator size="small" color="#2E7D32" />}
              </TouchableOpacity>
              {pdfAsset && <Text style={bStyles.pdfSuccessText}>✓ Document attached</Text>}
            </View>

            {/* ─── Validation Error ─── */}
            {validationError ? (
              <View style={bStyles.validationBanner}>
                <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                <Text style={bStyles.validationBannerText}>{validationError}</Text>
              </View>
            ) : null}

            {/* ─── Submit Button ─── */}
            <TouchableOpacity
              style={[bStyles.registerBtn, (submitting || !isFormValid()) && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting || !isFormValid()}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#FFF" />
                : <><Text style={bStyles.registerBtnText}>REGISTER BUSINESS</Text><Ionicons name="arrow-forward" size={20} color="#FFF" /></>
              }
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}

// ─── Pending Screen ───────────────────────────────────────────────────────────

function PendingScreen() {
  return (
    <SafeAreaView style={pStyles.root} edges={['top']}>
      <View style={pStyles.container}>
        <View style={pStyles.iconCircle}>
          <View style={pStyles.innerCircle}>
            <Ionicons name="checkmark" size={40} color="#2E7D32" />
          </View>
        </View>
        <Text style={pStyles.title}>Application{"\n"}Received</Text>
        <Text style={pStyles.description}>
          Thank you for your interest! Your application is now in review. Check your notifications for status updates.
        </Text>
        <View style={pStyles.nextStepsCard}>
          <View style={pStyles.cardHeader}>
            <View style={pStyles.infoIconBg}><Feather name="info" size={16} color="#2E7D32" /></View>
            <Text style={pStyles.cardTitle}>NEXT STEPS</Text>
          </View>
          <Text style={pStyles.cardBody}>
            Our curators typically review applications within 48 hours. You will receive a push notification once a decision is reached.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Refused Screen ───────────────────────────────────────────────────────────

function RefusedScreen({ onTryAgain }) {
  return (
    <SafeAreaView style={rStyles.root} edges={['top']}>
      <View style={rStyles.container}>
        <View style={rStyles.iconCircle}>
          <View style={rStyles.innerCircle}>
            <Ionicons name="close" size={40} color="#D32F2F" />
          </View>
        </View>
        <Text style={rStyles.title}>Request{"\n"}Refused</Text>
        <Text style={rStyles.description}>
          Your application was not approved this time. Review your info and resubmit.
        </Text>
        <TouchableOpacity style={rStyles.tryAgainBtn} onPress={onTryAgain} activeOpacity={0.8}>
          <Text style={rStyles.tryAgainBtnText}>Try Again</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={rStyles.infoCard}>
          <View style={rStyles.cardHeader}>
            <View style={rStyles.infoIconBg}><Feather name="info" size={14} color="#D32F2F" /></View>
            <Text style={rStyles.cardTitle}>WHAT TO CHECK</Text>
          </View>
          <Text style={rStyles.cardBody}>
            Ensure your business name, description, phone, location, and uploaded PDF are accurate before resubmitting.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Offer Card (with edit + delete) ─────────────────────────────────────────

function OfferCard({ offer, onEdit, onDelete }) {
  const left = offer.quantiteDisponible ?? 0;
  let status = 'ACTIVE';
  let stockLabel = '';
  if (left === 0) {
    status = 'OUT_OF_STOCK';
    stockLabel = 'Out of stock';
  } else if (left <= 2) {
    status = 'LOW';
    stockLabel = `${left} left`;
  } else {
    status = 'ACTIVE';
    stockLabel = `${left} left`;
  }
  const stockColor = getStockColor(left);
  const imageUri = offer.photo ? (offer.photo.startsWith('http') ? offer.photo : `${BASE_URL}/uploads/${offer.photo}`) : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200';

  const confirmDelete = () => {
    Alert.alert(
      'Delete Offer',
      `Are you sure you want to delete "${offer.titre}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.offerCard}>
      <Image source={{ uri: imageUri }} style={styles.offerImage} />
      <View style={styles.offerInfo}>
        <View style={styles.offerTitleRow}>
          <Text style={styles.offerTitle} numberOfLines={1}>{offer.titre}</Text>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.offerPrice}>{offer.prix} DA<Text style={styles.offerUnit}> / unit</Text></Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <Text style={[styles.stockLabel, { color: stockColor }]}>{stockLabel}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={16} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function SellerOrderCard({ order, onAction }) {
  const [codeInput, setCodeInput]         = useState('');
  const [validating, setValidating]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (type) => {
    setActionLoading(true);
    try { await onAction(order.id, type); } finally { setActionLoading(false); }
  };

  const handleValidateCode = async () => {
    if (!codeInput.trim()) { Alert.alert('Error', 'Please enter the pickup code.'); return; }
    setValidating(true);
    try { await onAction(order.id, 'validate', codeInput.trim()); } finally { setValidating(false); }
  };

  return (
    <View style={[styles.orderCard, order.status === 'CANCELLED' && styles.orderCardCancelled]}>
      <View style={styles.orderTop}>
        <View style={styles.orderAvatarPlaceholder}><Ionicons name="person" size={20} color="#64748B" /></View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderName}>{order.customerName}</Text>
          {order.customerPhone ? <Text style={styles.orderTime}>{order.customerPhone}</Text> : null}
        </View>
        <View style={styles.orderRightCol}>
          <StatusBadge status={order.status} />
          <Text style={styles.orderAmount}>{order.amount} DA</Text>
        </View>
      </View>
      <View style={styles.orderDivider} />
      <View style={styles.orderDetailRow}><Text style={styles.orderDetailLabel}>Items</Text><Text style={styles.orderDetailValue}>{order.items}</Text></View>
      <View style={styles.orderDetailRow}><Text style={styles.orderDetailLabel}>Order ID</Text><Text style={styles.orderDetailValue}>#{order.id?.slice(-6)}</Text></View>
      {order.notes ? <View style={styles.orderDetailRow}><Text style={styles.orderDetailLabel}>Notes</Text><Text style={[styles.orderDetailValue, { flex: 1, textAlign: 'right' }]}>{order.notes}</Text></View> : null}
      {order.status === 'PENDING' && (
        <View style={styles.orderActions}>
          <TouchableOpacity style={[styles.rejectBtn, actionLoading && { opacity: 0.6 }]} onPress={() => handleAction('reject')} disabled={actionLoading}><Text style={styles.rejectBtnText}>Reject</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.acceptBtn, actionLoading && { opacity: 0.6 }]} onPress={() => handleAction('confirm')} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.acceptBtnText}>Accept</Text>}
          </TouchableOpacity>
        </View>
      )}
      {order.status === 'CONFIRMED' && (
        <TouchableOpacity style={[styles.readyBtn, actionLoading && { opacity: 0.6 }]} onPress={() => handleAction('ready')} disabled={actionLoading}>
          {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#FFF" /><Text style={styles.readyBtnText}>Mark as Ready</Text></>}
        </TouchableOpacity>
      )}
      {order.status === 'READY' && (
        <View style={styles.codeSection}>
          <View style={styles.codeHint}><Ionicons name="information-circle-outline" size={16} color={Colors.primary} /><Text style={styles.codeHintText}>Ask the customer for their pickup code</Text></View>
          <View style={styles.codeInputRow}>
            <TextInput style={styles.codeInput} placeholder="e.g. ABC-1234" placeholderTextColor="#94A3B8" value={codeInput} onChangeText={setCodeInput} autoCapitalize="characters" />
            <TouchableOpacity style={[styles.codeValidateBtn, validating && { opacity: 0.6 }]} onPress={handleValidateCode} disabled={validating}>
              {validating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.codeValidateBtnText}>Validate</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────

function FilterModal({ visible, activeFilter, onSelect, onClose }) {
  const [tempFilter, setTempFilter] = useState(activeFilter);
  React.useEffect(() => { if (visible) setTempFilter(activeFilter); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Filter Orders</Text>
          <View style={styles.filterList}>
            {ORDER_FILTERS.map(f => (
              <TouchableOpacity key={f.key} style={[styles.filterItem, tempFilter === f.key && styles.filterItemActive]} onPress={() => setTempFilter(f.key)}>
                <Text style={[styles.filterItemText, tempFilter === f.key && styles.filterItemTextActive]}>{f.label}</Text>
                {tempFilter === f.key && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setTempFilter('ALL'); onSelect('ALL'); onClose(); }}><Text style={styles.resetBtnText}>Reset</Text></TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onSelect(tempFilter); onClose(); }}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Seller Dashboard ─────────────────────────────────────────────────────────

function SellerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState('offers');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [offers, setOffers]             = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  const fetchOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOffers(true);
      const response = await offerService.getSellerOffers();
      if (response.success) {
        // Prefetch images for immediate display
        const prefetchPromises = (response.data || [])
          .filter(offer => offer.photo)
          .map(offer => {
            const uri = offer.photo.startsWith('http')
              ? offer.photo
              : `${BASE_URL}/uploads/${offer.photo}`;
            return Image.prefetch(uri).catch(() => {});
          });
        await Promise.all(prefetchPromises);
        setOffers(response.data);
      }
    } catch (e) { console.error('Fetch offers error:', e); }
    finally { setLoadingOffers(false); }
  }, []);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const result = await orderService.getSellerOrders();
      setOrders(result);
    } catch (e) { console.error('Fetch orders error:', e); }
    finally { setLoadingOrders(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchOffers(true); fetchOrders(true); }, [fetchOffers, fetchOrders]));

  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchOffers(true), fetchOrders(true)]); setRefreshing(false); };

  const handleOrderAction = async (orderId, type, code) => {
    try {
      if (type === 'confirm') { await orderService.confirmOrder(orderId); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED' } : o)); }
      else if (type === 'reject') { await orderService.rejectOrder(orderId); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o)); fetchOffers(true); }
      else if (type === 'ready') { await orderService.markOrderReady(orderId); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'READY' } : o)); }
      else if (type === 'validate') {
        const res = await orderService.validatePickup(orderId, code);
        if (res.success) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COLLECTED' } : o)); fetchOffers(true); Alert.alert('Success', 'Pickup validated successfully!'); }
        else { Alert.alert('Error', res.message || 'Validation failed.'); }
      }
    } catch (error) { Alert.alert('Error', typeof error === 'string' ? error : error?.message || 'Something went wrong.'); }
  };

  const handleDeleteOffer = async (offerId) => {
    try {
      await offerService.deleteOffer(offerId);
      setOffers(prev => prev.filter(o => o._id !== offerId));
      Alert.alert('Deleted', 'Offer removed successfully.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not delete offer.');
    }
  };

  const pendingCount   = orders.filter(o => o.status === 'PENDING').length;
  const filteredOrders = activeFilter === 'ALL' ? orders : orders.filter(o => o.status === activeFilter);
  const isFiltered     = activeFilter !== 'ALL';

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <FilterModal visible={filterModalVisible} activeFilter={activeFilter} onSelect={setActiveFilter} onClose={() => setFilterModalVisible(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'offers' && styles.tabBtnActive]} onPress={() => setActiveTab('offers')}>
            <Text style={[styles.tabBtnText, activeTab === 'offers' && styles.tabBtnTextActive]}>My Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]} onPress={() => setActiveTab('orders')}>
            <Text style={[styles.tabBtnText, activeTab === 'orders' && styles.tabBtnTextActive]}>Orders</Text>
            {pendingCount > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingCount}</Text></View>}
          </TouchableOpacity>
        </View>
        {activeTab === 'offers' && (
          <View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Active Inventory</Text><Text style={styles.sectionCount}>{offers.length} ITEMS</Text></View>
            {loadingOffers && offers.length === 0 ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
              : offers.length === 0 ? <View style={styles.emptyState}><MaterialCommunityIcons name="storefront-outline" size={48} color="#CBD5E1" /><Text style={styles.emptyText}>No offers yet. Tap + to add one.</Text></View>
              : offers.map(offer => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    // ✅ FIX: use navigate instead of push to avoid broken back stack
                    onEdit={() => router.navigate({ pathname: '/(tabs)/new-offer', params: { offerId: offer._id } })}
                    onDelete={() => handleDeleteOffer(offer._id)}
                  />
                ))}
          </View>
        )}
        {activeTab === 'orders' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isFiltered ? `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Orders` : 'All Orders'}</Text>
              <View style={styles.sectionRight}>
                <Text style={styles.sectionCount}>{filteredOrders.length} ORDERS</Text>
                <TouchableOpacity style={[styles.filterBtn, isFiltered && styles.filterBtnActive]} onPress={() => setFilterModalVisible(true)}>
                  <Ionicons name="options-outline" size={16} color={isFiltered ? '#FFFFFF' : Colors.primary} />
                  <Text style={[styles.filterBtnText, isFiltered && styles.filterBtnTextActive]}>Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
            {loadingOrders && orders.length === 0 ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
              : filteredOrders.length === 0 ? <View style={styles.emptyState}><Ionicons name="bag-handle-outline" size={48} color="#CBD5E1" /><Text style={styles.emptyText}>{isFiltered ? `No ${activeFilter.toLowerCase()} orders.` : 'No orders yet.'}</Text></View>
              : filteredOrders.map(order => <SellerOrderCard key={order.id} order={order} onAction={handleOrderAction} />)}
          </View>
        )}
        <View style={{ height: 160 }} />
      </ScrollView>
      <TouchableOpacity
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + 16 }]}
        // ✅ FIX: use navigate instead of push to avoid broken back stack
        onPress={() => router.navigate('/(tabs)/new-offer')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Offer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Main Gate ────────────────────────────────────────────────────────────────

export default function SellGate() {
  const [screen, setScreen] = useState('loading');
  const router = useRouter();

  const checkAccess = useCallback(async () => {
    setScreen('loading');
    try {
      const role = await getUserRole();

      if (role === 'commercant') {
        const userId = await getUserId();
        const hasSeenIntro = await SecureStore.getItemAsync(`hasSeenSellerIntro_${userId}`);
        if (!hasSeenIntro) {
          router.replace('/sellerintro/sellintro1');
          return;
        }
        setScreen('dashboard');
        return;
      }

      const statut = await getApplicationStatus();
      if (statut === 'EN_ATTENTE') setScreen('pending');
      else if (statut === 'REFUSEE') setScreen('refused');
      else setScreen('apply');
    } catch (error) { setScreen('apply'); }
  }, []);

  useFocusEffect(useCallback(() => { checkAccess(); }, [checkAccess]));

  if (screen === 'loading') {
    return <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (screen === 'dashboard') return <SellerDashboard />;
  if (screen === 'pending')   return <PendingScreen />;
  if (screen === 'refused')   return (
  <RefusedScreen onTryAgain={async () => {
    try {
      await SecureStore.deleteItemAsync('lastRequestStatus');
      // ✅ Mark refused as dismissed so it won't reappear on navigation
      await SecureStore.setItemAsync('refusedDismissed', 'true');
    } catch (e) {}
    setScreen('apply');
  }} />
);
  return <BecomeSellerScreen onApplicationSubmitted={() => setScreen('pending')} />;
}

// ─── Styles: Dashboard ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4, marginBottom: 24, marginTop: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tabBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#94A3B8' },
  tabBtnTextActive: { fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A1A' },
  tabBadge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tabBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#FFF', fontSize: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#1A1A1A' },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionCount: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: Colors.primary, letterSpacing: 0.5 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: '#FFFFFF' },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: Colors.primary },
  filterBtnTextActive: { color: '#FFFFFF' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 },
  offerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  offerImage: { width: 76, height: 76, borderRadius: 12 },
  offerInfo: { flex: 1, marginLeft: 12 },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  offerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#1A1A1A', flex: 1, marginRight: 8 },
  offerPrice: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: Colors.primary, marginBottom: 6 },
  offerUnit: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#94A3B8' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  actionButtons: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  orderCardCancelled: { backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#FFCDD2' },
  orderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  orderAvatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orderInfo: { flex: 1 },
  orderName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#1E293B' },
  orderTime: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#94A3B8', marginTop: 2 },
  orderRightCol: { alignItems: 'flex-end', gap: 6 },
  orderAmount: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: Colors.primary },
  orderDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  orderDetailLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#64748B' },
  orderDetailValue: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#1A1A1A' },
  orderActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  acceptBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', fontSize: 14 },
  rejectBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#64748B', fontSize: 14 },
  readyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, height: 44, borderRadius: 12, backgroundColor: '#166534' },
  readyBtnText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', fontSize: 14 },
  codeSection: { marginTop: 14, gap: 10 },
  codeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  codeHintText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: Colors.primary, flex: 1 },
  codeInputRow: { flexDirection: 'row', gap: 10 },
  codeInput: { flex: 1, height: 48, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#1A1A1A', letterSpacing: 1 },
  codeValidateBtn: { height: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  codeValidateBtnText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  fab: { position: 'absolute', right: 20, height: 52, paddingHorizontal: 20, borderRadius: 26, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8 },
  fabText: { fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: '#1A1A1A', marginBottom: 20 },
  filterList: { gap: 4, marginBottom: 24 },
  filterItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#F8FAFC' },
  filterItemActive: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: Colors.primary },
  filterItemText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#64748B' },
  filterItemTextActive: { fontFamily: 'PlusJakartaSans_700Bold', color: Colors.primary },
  modalActions: { flexDirection: 'row', gap: 12 },
  resetBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  resetBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#64748B' },
  applyBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#FFFFFF' },
});

// ─── Styles: Become a Seller ──────────────────────────────────────────────────

const bStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F9F1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerSide: { flex: 1 },
  headerTitle: { flex: 2, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: '#113521', textAlign: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  heroImage: { width: '100%', height: 200, borderRadius: 25, marginBottom: 20 },
  heroTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: '#2E7D32', lineHeight: 38, marginBottom: 25 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#1a1a1a', letterSpacing: 1 },
  inputGroup: { marginBottom: 4 },
  label: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  input: { backgroundColor: '#E4EDE4', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1a1a1a' },
  textArea: { height: 100, textAlignVertical: 'top' },
  collapsibleHeader: { backgroundColor: '#E4EDE4', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  selectedContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedIcon: { fontSize: 18 },
  selectedLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#113521' },
  menuContainer: { backgroundColor: '#F2F4F2', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#E1E4E1' },
  menuItemIcon: { fontSize: 16 },
  menuItemLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#555', flex: 1 },
  activeItemLabel: { fontFamily: 'PlusJakartaSans_700Bold', color: '#2E7D32' },
  phoneRow: { flexDirection: 'row', gap: 10 },
  inputError: { borderWidth: 1.5, borderColor: '#D32F2F', borderRadius: 12 },
  countryCode: { backgroundColor: '#E4EDE4', borderRadius: 12, width: 60, alignItems: 'center', justifyContent: 'center' },
  countryCodeText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#888' },
  errorText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#D32F2F', marginTop: 5, marginLeft: 5 },
  successText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#2E7D32', marginTop: 5, marginLeft: 5 },
  locationPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E4EDE4', borderRadius: 12, padding: 14 },
  locationPickerBtnText: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#113521' },
  locationConfirmed: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  locationConfirmedText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#113521', flex: 1 },
  pdfPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E4EDE4', borderRadius: 12, padding: 14, marginBottom: 8 },
  pdfPickerText: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#64748B' },
  pdfSuccessText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#2E7D32', marginLeft: 12 },
  validationBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
  validationBannerText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#D32F2F', flex: 1 },
  registerBtn: { backgroundColor: '#2E7D32', height: 65, borderRadius: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  registerBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
});

// ─── Styles: Pending ──────────────────────────────────────────────────────────

const pStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F9F1' },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  innerCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 36, color: '#1a1a1a', textAlign: 'center', lineHeight: 42, marginBottom: 20 },
  description: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#444', textAlign: 'center', lineHeight: 24, marginBottom: 40, paddingHorizontal: 10 },
  nextStepsCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  infoIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#1a1a1a', letterSpacing: 0.5 },
  cardBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#666', lineHeight: 22, paddingLeft: 44 },
});

// ─── Styles: Refused ──────────────────────────────────────────────────────────

const rStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F9F1' },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 30 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  innerCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#D32F2F', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 36, color: '#1a1a1a', textAlign: 'center', lineHeight: 42, marginBottom: 12 },
  description: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  tryAgainBtn: { backgroundColor: '#2E7D32', width: '100%', height: 60, borderRadius: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tryAgainBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#FFFFFF' },
  infoCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1a1a1a', letterSpacing: 0.5 },
  cardBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#666', lineHeight: 20, paddingLeft: 38 },
});

// ─── Styles: Location Modal ───────────────────────────────────────────────────

const lStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 48 : 32, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  headerCenter: { flex: 2, alignItems: 'center' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  closeBtn: { padding: 4 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#113521' },
  confirmBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  confirmBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#FFF' },
  searchWrapper: { zIndex: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#113521' },
  suggestions: { backgroundColor: '#FFF', borderRadius: 12, marginTop: 4, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#1A1A1A' },
});