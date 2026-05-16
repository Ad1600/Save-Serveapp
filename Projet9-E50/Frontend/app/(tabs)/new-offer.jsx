import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform, Switch, Alert, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  useFonts, PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold
} from "@expo-google-fonts/plus-jakarta-sans";
import { offerService } from '../../services/offerService';
import { BASE_URL } from '../../constants/Api';
import * as SecureStore from 'expo-secure-store';

const CATEGORIES = [
  { label: 'Bakery',     icon: '🥐', value: 'boulangerie' },
  { label: 'Restaurant', icon: '🍲', value: 'restaurant'  },
  { label: 'Grocery',    icon: '🍎', value: 'epicerie'    },
  { label: 'Other',      icon: '🍱', value: 'autre'       },
];

const DEFAULT_REGION = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Generate time slots every 30 minutes
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
})();

async function searchAddress(query) {
  if (!query || query.length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=dz`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SaveAndServeApp/1.0' }
    });
    const data = await res.json();
    return data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SaveAndServeApp/1.0' }
    });
    const data = await res.json();
    return data.display_name ?? '';
  } catch { return ''; }
}

function LocationPickerModal({ visible, onClose, onConfirm, initialCoords }) {
  const mapRef = useRef(null);
  const [pin, setPin] = useState(
    initialCoords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }
  );
  const [searchText, setSearchText]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const searchTimeout                 = useRef(null);

  useEffect(() => {
    if (visible && initialCoords) setPin(initialCoords);
  }, [visible, initialCoords]);

  const handleSearchChange = (text) => {
    setSearchText(text);
    clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddress(text);
      setSuggestions(results);
      setSearching(false);
    }, 500);
  };

  const handleSuggestionPress = (item) => {
    const coords = { latitude: item.lat, longitude: item.lng };
    setPin(coords);
    setSearchText(item.display_name);
    setSuggestions([]);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  };

  const handleMapPress = (e) => {
    setPin(e.nativeEvent.coordinate);
    setSuggestions([]);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const address = searchText.length > 5
      ? searchText
      : await reverseGeocode(pin.latitude, pin.longitude);
    setConfirming(false);
    onConfirm({ lat: pin.latitude, lng: pin.longitude, address });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={lStyles.root}>
        <StatusBar style="dark" />
        <View style={lStyles.header}>
          <View style={lStyles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={lStyles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color="#113521" />
            </TouchableOpacity>
          </View>
          <View style={lStyles.headerCenter}>
            <Text style={lStyles.headerTitle}>Pick Location</Text>
          </View>
          <View style={lStyles.headerRight}>
            <TouchableOpacity
              style={[lStyles.confirmBtn, confirming && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              {confirming
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={lStyles.confirmBtnText}>Confirm</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <View style={lStyles.searchWrapper}>
          <View style={lStyles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={lStyles.searchInput}
              placeholder="Search address, e.g. Kouba..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
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
                <TouchableOpacity
                  key={index}
                  style={[lStyles.suggestionItem, index < suggestions.length - 1 && lStyles.suggestionBorder]}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#2E7D32" style={{ marginRight: 8 }} />
                  <Text style={lStyles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={
            initialCoords?.latitude && initialCoords?.longitude
              ? { ...initialCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : DEFAULT_REGION
          }
          onPress={handleMapPress}
        >
          <Marker coordinate={pin} />
        </MapView>
      </View>
    </Modal>
  );
}

// ─── Pickup Time Picker Modal ─────────────────────────────────────────────────

function PickupTimeModal({ visible, onClose, onConfirm, pickupStart, pickupEnd }) {
  const [start, setStart] = useState(pickupStart || '08:00');
  const [end, setEnd]     = useState(pickupEnd   || '12:00');
  const [tab, setTab]     = useState('start'); // 'start' | 'end'

  useEffect(() => {
    if (visible) {
      setStart(pickupStart || '08:00');
      setEnd(pickupEnd     || '12:00');
      setTab('start');
    }
  }, [visible]);

  const validateAndConfirm = () => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    if (endMins <= startMins) {
      Alert.alert('Invalid Time', 'Pickup end time must be after start time.');
      return;
    }
    if (endMins - startMins < 30) {
      Alert.alert('Invalid Time', 'Pickup window must be at least 30 minutes.');
      return;
    }
    onConfirm({ start, end });
    onClose();
  };

  const currentValue = tab === 'start' ? start : end;
  const setCurrentValue = tab === 'start' ? setStart : setEnd;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tStyles.overlay}>
        <View style={tStyles.sheet}>
          <View style={tStyles.handle} />
          <Text style={tStyles.title}>Pickup Time Window</Text>

          {/* Tab switcher */}
          <View style={tStyles.tabRow}>
            <TouchableOpacity
              style={[tStyles.tabBtn, tab === 'start' && tStyles.tabBtnActive]}
              onPress={() => setTab('start')}
            >
              <Text style={[tStyles.tabText, tab === 'start' && tStyles.tabTextActive]}>From</Text>
              <Text style={[tStyles.tabValue, tab === 'start' && tStyles.tabValueActive]}>{start}</Text>
            </TouchableOpacity>
            <View style={tStyles.tabArrow}>
              <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
            </View>
            <TouchableOpacity
              style={[tStyles.tabBtn, tab === 'end' && tStyles.tabBtnActive]}
              onPress={() => setTab('end')}
            >
              <Text style={[tStyles.tabText, tab === 'end' && tStyles.tabTextActive]}>Until</Text>
              <Text style={[tStyles.tabValue, tab === 'end' && tStyles.tabValueActive]}>{end}</Text>
            </TouchableOpacity>
          </View>

          {/* Time slots */}
          <ScrollView style={tStyles.slotScroll} showsVerticalScrollIndicator={false}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[tStyles.slotItem, currentValue === slot && tStyles.slotItemActive]}
                onPress={() => setCurrentValue(slot)}
              >
                <Text style={[tStyles.slotText, currentValue === slot && tStyles.slotTextActive]}>{slot}</Text>
                {currentValue === slot && <Ionicons name="checkmark" size={16} color="#2E7D32" />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={tStyles.actions}>
            <TouchableOpacity style={tStyles.cancelBtn} onPress={onClose}>
              <Text style={tStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tStyles.confirmBtn} onPress={validateAndConfirm}>
              <Text style={tStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AddOffer() {
  const router = useRouter();
  const { offerId } = useLocalSearchParams();
  const currentOfferId = Array.isArray(offerId) ? offerId[0] : offerId;
  const isEditMode = Boolean(currentOfferId);
  const scrollRef = useRef(null);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [image, setImage]                       = useState(null);
  const [existingPhoto, setExistingPhoto]       = useState(null);
  const [title, setTitle]                       = useState('');
  const [description, setDescription]           = useState('');
  const [salePrice, setSalePrice]               = useState('');
  const [originalPrice, setOriginalPrice]       = useState('');
  const [quantity, setQuantity]                 = useState('1');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [isExpanded, setIsExpanded]             = useState(false);
  const [date, setDate]                         = useState(new Date());
  const [showDatePicker, setShowDatePicker]     = useState(false);
  const [dateString, setDateString]             = useState('Select Date');
  const [isWeekly, setIsWeekly]                 = useState(false);
  const [loadingOffer, setLoadingOffer]         = useState(false);
  const [publishing, setPublishing]             = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [address, setAddress]                   = useState('');
  const [locationCoords, setLocationCoords]     = useState(null);

  // Pickup time
  const [pickupStart, setPickupStart]           = useState('');
  const [pickupEnd, setPickupEnd]               = useState('');
  const [pickupModalVisible, setPickupModalVisible] = useState(false);

  // Android date picker temp state
  const [androidTempDate, setAndroidTempDate]   = useState(new Date());

  // Reset form for new offer
  useEffect(() => {
    if (!isEditMode) {
      setTitle(''); setDescription(''); setSalePrice(''); setOriginalPrice('');
      setQuantity('1'); setSelectedCategory(CATEGORIES[0]); setDate(new Date());
      setDateString('Select Date'); setIsWeekly(false);
      setImage(null); setExistingPhoto(null);
      setLocationCoords(null); setAddress('');
      setPickupStart(''); setPickupEnd('');
    }
  }, [isEditMode, currentOfferId]);

  // Load seller's shop location from SecureStore for new offers
  useEffect(() => {
    if (!isEditMode) {
      SecureStore.getItemAsync('userData').then(stored => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.latitude && parsed?.longitude) {
              setLocationCoords({
                lat: parseFloat(parsed.latitude),
                lng: parseFloat(parsed.longitude)
              });
              if (parsed?.adresseCommerce) setAddress(parsed.adresseCommerce);
            }
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }, [isEditMode]);

  // Fetch offer for edit mode
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      setImage(null); setExistingPhoto(null);
      setLocationCoords(null); setAddress('');
      setLoadingOffer(true);
      try {
        const res = await offerService.getOfferById(currentOfferId);
        const offer = res.data ?? res;

        setTitle(offer.titre ?? '');
        setDescription(offer.description ?? '');
        setSalePrice(String(offer.prix ?? ''));
        setOriginalPrice(String(offer.prixOriginal ?? ''));
        setQuantity(String(offer.quantiteDisponible ?? 1));
        setIsWeekly(offer.recurrence === 'hebdomadaire');
        if (offer.pickupStart) setPickupStart(offer.pickupStart);
        if (offer.pickupEnd)   setPickupEnd(offer.pickupEnd);

        const cat = CATEGORIES.find(c => c.value === (offer.categorie ?? 'autre'));
        if (cat) setSelectedCategory(cat);

        if (offer.dateExpiration) {
          const d = new Date(offer.dateExpiration);
          setDate(d);
          setDateString(d.toLocaleDateString('en-GB'));
        }

        if (offer.photo) {
          const url = offer.photo.startsWith('http')
            ? offer.photo
            : `${BASE_URL}/uploads/${offer.photo}`;
          setExistingPhoto(url);
        }

        if (offer.adresse) setAddress(offer.adresse);

        let parsedLat, parsedLng;
        if (Array.isArray(offer.location?.coordinates) && offer.location.coordinates.length >= 2) {
          parsedLng = Number(offer.location.coordinates[0]);
          parsedLat = Number(offer.location.coordinates[1]);
        } else if (offer.latitude !== undefined && offer.longitude !== undefined) {
          parsedLat = Number(offer.latitude);
          parsedLng = Number(offer.longitude);
        } else if (offer.location?.latitude !== undefined) {
          parsedLat = Number(offer.location.latitude);
          parsedLng = Number(offer.location.longitude);
        }

        if (
          parsedLat !== undefined && parsedLng !== undefined &&
          !isNaN(parsedLat) && !isNaN(parsedLng) &&
          !(parsedLat === 0 && parsedLng === 0)
        ) {
          setLocationCoords({ lat: parsedLat, lng: parsedLng });
        }

      } catch (e) {
        Alert.alert('Error', 'Could not load offer details.');
        router.back();
      } finally {
        setLoadingOffer(false);
      }
    })();
  }, [isEditMode, currentOfferId]);

  const handleDescriptionFocus = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 120, animated: true }), 100);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setExistingPhoto(null);
    }
  };

  // ─── Date picker handlers ──────────────────────────────────────────────────

  // iOS: spinner inline, Done button closes
  const onDateChangeiOS = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
      setDateString(selectedDate.toLocaleDateString('en-GB'));
    }
  };

  // Android: default picker, handle OK/dismiss properly
  const onDateChangeAndroid = (event, selectedDate) => {
    setShowDatePicker(false); // always close on Android
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      setDateString(selectedDate.toLocaleDateString('en-GB'));
    }
    // if event.type === 'dismissed', do nothing (user pressed cancel)
  };

  const handleNumericInput = (val, setter) => setter(val.replace(/[^0-9]/g, ''));

  const handleLocationConfirm = ({ lat, lng, address: addr }) => {
    setLocationCoords({ lat, lng });
    setAddress(addr);
  };

  const handlePublish = async () => {
    const sPrice = parseFloat(salePrice);
    const oPrice = parseFloat(originalPrice || '0');
    const qty    = parseInt(quantity || '1');
    const hasPhoto = image || existingPhoto;

    if (!title || !salePrice || !hasPhoto || dateString === 'Select Date') {
      Alert.alert('Missing Info', 'Please provide a Title, Sale Price, Date, and Image.');
      return;
    }

    if (!locationCoords) {
      Alert.alert('Missing Location', 'Please pick a location for your offer.');
      return;
    }

    if (!pickupStart || !pickupEnd) {
      Alert.alert('Missing Pickup Time', 'Please set a pickup time window.');
      return;
    }

    if (oPrice > 0 && sPrice > oPrice) {
      Alert.alert('Invalid Pricing', 'Sale Price cannot be higher than the Original Price.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity (minimum 1).');
      return;
    }

    // Validate pickup time is not in the past for today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      const [eh, em] = pickupEnd.split(':').map(Number);
      const endMins = eh * 60 + em;
      const nowMins = today.getHours() * 60 + today.getMinutes();
      if (endMins <= nowMins) {
        Alert.alert('Invalid Pickup Time', 'Pickup end time has already passed for today. Please choose a future time or a future date.');
        return;
      }
    }

    setPublishing(true);
    try {
      if (isEditMode) {
        const updateData = {
          titre:              title,
          description,
          prix:               salePrice,
          prixOriginal:       originalPrice || '0',
          quantiteDisponible: String(qty),
          categorie:          selectedCategory.value,
          dateExpiration:     date.toISOString(),
          recurrence:         isWeekly ? 'hebdomadaire' : '',
          adresse:            address || '',
          latitude:           String(locationCoords.lat),
          longitude:          String(locationCoords.lng),
          pickupStart,
          pickupEnd,
        };

        // ✅ REPLACED EDIT-MODE PHOTO BLOCK
        if (image) {
          const photoFormData = new FormData();
          const filename  = image.split('/').pop() || 'photo.jpg';
          const extension = filename.split('.').pop().toLowerCase();
          const mimeType  = extension === 'png' ? 'image/png' : 'image/jpeg';
          photoFormData.append('photo', { uri: image, name: filename, type: mimeType });
          const photoRes = await offerService.updateOfferPhoto(currentOfferId, photoFormData);
          if (photoRes?.success && photoRes?.data) {
            updateData.photo = photoRes.data; // just filename, same as user photo
          } else {
            Alert.alert('Warning', photoRes?.message || 'Image upload failed.');
            setPublishing(false);
            return;
          }
        }

        await offerService.updateOffer(currentOfferId, updateData);
        Alert.alert('Success', 'Offer updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const formData = new FormData();
        formData.append('titre',              title);
        formData.append('description',        description);
        formData.append('prix',               salePrice);
        formData.append('prixOriginal',       originalPrice || '0');
        formData.append('quantiteDisponible', String(qty));
        formData.append('categorie',          selectedCategory.value);
        formData.append('dateExpiration',     date.toISOString());
        formData.append('recurrence',         isWeekly ? 'hebdomadaire' : '');
        formData.append('adresse',            address || '');
        formData.append('latitude',           String(locationCoords.lat));
        formData.append('longitude',          String(locationCoords.lng));
        formData.append('pickupStart',        pickupStart);
        formData.append('pickupEnd',          pickupEnd);

        if (image) {
          const filename  = image.split('/').pop() || 'photo.jpg';
          const extension = filename.split('.').pop().toLowerCase();
          const mimeType  = extension === 'png' ? 'image/png' : 'image/jpeg';
          formData.append('photo', { uri: image, name: filename, type: mimeType });
        }

        await offerService.createOffer(formData);
        Alert.alert('Success', 'Offer published!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      const msg = typeof e === 'string' ? e : e?.message || 'Something went wrong.';
      Alert.alert('Error', msg);
    } finally {
      setPublishing(false);
    }
  };

  if (!fontsLoaded || loadingOffer) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        {loadingOffer && (
          <Text style={{ marginTop: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#666' }}>
            Loading offer…
          </Text>
        )}
      </SafeAreaView>
    );
  }

  const displayImage = image ?? existingPhoto;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onConfirm={handleLocationConfirm}
        initialCoords={locationCoords
          ? { latitude: locationCoords.lat, longitude: locationCoords.lng }
          : null
        }
      />

      <PickupTimeModal
        visible={pickupModalVisible}
        onClose={() => setPickupModalVisible(false)}
        onConfirm={({ start, end }) => { setPickupStart(start); setPickupEnd(end); }}
        pickupStart={pickupStart}
        pickupEnd={pickupEnd}
      />

      {/* iOS date picker modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.dateModalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity
                  style={styles.dateDoneBtn}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChangeiOS}
                minimumDate={new Date()}
                textColor="#113521"
                themeVariant="light"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android date picker — rendered inline, not in a modal */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChangeAndroid}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/sellpage')}>
          <Ionicons name="arrow-back" size={24} color="#113521" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Offer' : 'Add New Offer'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsExpanded(false); }}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Image Picker */}
            <TouchableOpacity
              style={[styles.uploadCard, displayImage && { borderWidth: 0, backgroundColor: 'transparent' }]}
              onPress={pickImage}
            >
              {displayImage ? (
                <>
                  <Image source={{ uri: displayImage }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.changePhotoOverlay}>
                    <Feather name="camera" size={16} color="#FFF" />
                    <Text style={styles.changePhotoText}>Tap to change</Text>
                  </View>
                </>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.cameraCircle}>
                    <Feather name="camera" size={24} color="#2E7D32" />
                  </View>
                  <Text style={styles.uploadTitle}>Upload Cover Image</Text>
                  <Text style={styles.uploadSub}>JPEG, PNG up to 10MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* General Info */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.cardTitle}>GENERAL INFORMATION</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OFFER TITLE</Text>
                <TextInput style={styles.input} placeholder="e.g. Mixed Pastry Box" value={title} onChangeText={setTitle} />
              </View>
              <View style={[styles.inputGroup, { marginTop: 15 }]}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe what's inside the bag..."
                  multiline value={description}
                  onChangeText={setDescription}
                  onFocus={handleDescriptionFocus}
                />
              </View>
            </View>

            {/* Pricing & Category */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="tag-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.cardTitle}>PRICING & CATEGORY</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>SALE PRICE</Text>
                  <View style={styles.priceInputWrapper}>
                    <TextInput style={styles.priceInput} placeholder="0" keyboardType="number-pad" value={salePrice} onChangeText={v => handleNumericInput(v, setSalePrice)} />
                    <Text style={styles.currencySymbol}>DA</Text>
                  </View>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>ORIGINAL</Text>
                  <View style={styles.priceInputWrapper}>
                    <TextInput style={styles.priceInput} placeholder="0" keyboardType="number-pad" value={originalPrice} onChangeText={v => handleNumericInput(v, setOriginalPrice)} />
                    <Text style={styles.currencySymbol}>DA</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.inputGroup, { marginTop: 15, zIndex: 99 }]}>
                <Text style={styles.label}>CATEGORY</Text>
                <TouchableOpacity
                  style={[styles.collapsibleHeader, isExpanded && styles.headerExpanded]}
                  onPress={() => { setIsExpanded(!isExpanded); Keyboard.dismiss(); }}
                >
                  <View style={styles.selectedContainer}>
                    <Text style={styles.selectedIcon}>{selectedCategory.icon}</Text>
                    <Text style={styles.selectedLabel}>{selectedCategory.label}</Text>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#2E7D32" />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.menuContainer}>
                    {CATEGORIES.map((item, index) => (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.menuItem, index === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => { setSelectedCategory(item); setIsExpanded(false); }}
                      >
                        <Text style={styles.menuItemIcon}>{item.icon}</Text>
                        <Text style={[styles.menuItemLabel, selectedCategory.label === item.label && styles.activeItemLabel]}>
                          {item.label}
                        </Text>
                        {selectedCategory.label === item.label && <Ionicons name="checkmark-sharp" size={16} color="#2E7D32" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Location */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.cardTitle}>LOCATION</Text>
              </View>
              <TouchableOpacity style={styles.locationPickerBtn} onPress={() => setLocationPickerVisible(true)}>
                <Ionicons name="map-outline" size={20} color="#2E7D32" />
                <Text style={styles.locationPickerBtnText}>
                  {locationCoords ? 'Change Location' : 'Pick Location on Map'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {locationCoords && address ? (
                <View style={styles.locationConfirmed}>
                  <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                  <Text style={styles.locationConfirmedText} numberOfLines={2}>{address}</Text>
                </View>
              ) : null}
            </View>

            {/* Availability */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.cardTitle}>AVAILABILITY</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>QUANTITY</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={quantity} onChangeText={v => handleNumericInput(v, setQuantity)} />
                </View>
                <View style={[styles.flex1, { marginLeft: 10 }]}>
                  <Text style={styles.label}>EXPIRATION DATE</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                    <Text style={[styles.dateText, dateString === 'Select Date' && { color: '#9E9E9E' }]}>{dateString}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#2E7D32" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pickup Time */}
              <View style={[styles.inputGroup, { marginTop: 15 }]}>
                <Text style={styles.label}>PICKUP TIME WINDOW</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setPickupModalVisible(true)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="time-outline" size={16} color={pickupStart ? '#113521' : '#9E9E9E'} />
                    <Text style={[styles.dateText, !pickupStart && { color: '#9E9E9E' }]}>
                      {pickupStart && pickupEnd ? `${pickupStart} – ${pickupEnd}` : 'Select pickup window'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Weekly Recurrence</Text>
                  <Text style={styles.switchSub}>AUTOMATE LISTING RENEWAL</Text>
                </View>
                <Switch value={isWeekly} onValueChange={setIsWeekly} trackColor={{ false: '#D1D1D1', true: '#2E7D32' }} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.publishBtn, publishing && { opacity: 0.7 }]}
              onPress={handlePublish}
              disabled={publishing}
            >
              {publishing
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <Text style={styles.publishBtnText}>{isEditMode ? 'Save Changes' : 'Publish Offer'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
              }
            </TouchableOpacity>

            <Text style={styles.disclaimer}>By publishing, you agree to our Marketplace Terms.</Text>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F9F1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: '#113521' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  uploadCard: { height: 180, backgroundColor: '#E4EDE4', borderRadius: 25, borderWidth: 1.5, borderColor: '#BDCDBE', borderStyle: 'dashed', marginBottom: 20, overflow: 'hidden' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  uploadTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#113521' },
  uploadSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#666' },
  previewImage: { width: '100%', height: '100%' },
  changePhotoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  changePhotoText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#FFF' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1a1a1a', letterSpacing: 0.5 },
  inputGroup: {},
  label: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  input: { backgroundColor: '#E4EDE4', borderRadius: 12, padding: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#113521' },
  textArea: { height: 100, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4EDE4', borderRadius: 12, paddingHorizontal: 14 },
  currencySymbol: { color: '#2E7D32', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, marginLeft: 5 },
  priceInput: { flex: 1, paddingVertical: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#113521' },

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

  locationPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E4EDE4', borderRadius: 12, padding: 14 },
  locationPickerBtnText: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#113521' },
  locationConfirmed: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  locationConfirmedText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#113521', flex: 1 },

  datePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E4EDE4', borderRadius: 12, padding: 14 },
  dateText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#113521' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#F4F9F1', padding: 15, borderRadius: 15 },
  switchTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#113521' },
  switchSub: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: '#9E9E9E' },

  publishBtn: { backgroundColor: '#2E7D32', height: 65, borderRadius: 35, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 10 },
  publishBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#FFF' },
  disclaimer: { textAlign: 'center', color: '#9E9E9E', fontSize: 12, marginTop: 15, paddingHorizontal: 40, fontFamily: 'PlusJakartaSans_400Regular' },

  dateModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  datePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  datePickerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#113521' },
  dateDoneBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  dateDoneText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#FFF' },
});

// ─── Pickup Time Modal Styles ─────────────────────────────────────────────────

const tStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28, maxHeight: '80%' },
  handle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#1a1a1a', marginBottom: 16 },
  tabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  tabBtn: { flex: 1, backgroundColor: '#F4F9F1', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#2E7D32', backgroundColor: '#F0FDF4' },
  tabText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  tabTextActive: { color: '#2E7D32' },
  tabValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#1a1a1a' },
  tabValueActive: { color: '#2E7D32' },
  tabArrow: { alignItems: 'center', justifyContent: 'center' },
  slotScroll: { maxHeight: 260, marginBottom: 16 },
  slotItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4, backgroundColor: '#F8FAFC' },
  slotItemActive: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#2E7D32' },
  slotText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#1a1a1a' },
  slotTextActive: { color: '#2E7D32' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#64748B' },
  confirmBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#FFFFFF' },
});

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