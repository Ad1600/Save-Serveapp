import React, { useState, useEffect } from 'react';
import {
  Text, StyleSheet, View, TextInput,
  TouchableOpacity, Image, Pressable,
  KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform, ScrollView, Modal,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, getValidAvatarUri  } from '../../services/ImageUserServeces';
import * as SecureStore from 'expo-secure-store'; // Added for data persistence
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { Colors } from '../../constants/Color';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../../services/authservice'; // Import your service
import { BASE_URL } from '../../constants/Api';


export default function EditProfile() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_700Bold });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [validPhotoUri, setValidPhotoUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [photoVisible, setPhotoVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null); // Store local URI until save


  // Compute display name (same logic as profile page)
  const displayName = user?.nom && user.nom.trim() ? user.nom : 'Guest User';
  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || 'U';

  // Compute the avatar URI for display (same logic as profile page)
  const displayAvatarUri = selectedImageUri || validPhotoUri || null;

  // 1. Load current user data from SecureStore on Mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedRaw = await SecureStore.getItemAsync('userData');
        if (storedRaw) {
          const user = JSON.parse(storedRaw);
          setUser(user);
          setName(user.nom || '');
          setPhone(user.telephone || '');
          setAddress(user.adresse || '');
          // If you have avatar logic in backend, set it here
          if (user.photo) {
  const validUri = await getValidAvatarUri(user.photo, true);
  setValidPhotoUri(validUri ?? user.avatar ?? null);
} else {
  setValidPhotoUri(user.avatar ?? null);
}
        }
      } catch (e) {
        console.error("Failed to load user data", e);
      } finally {
        setInitialLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleChangePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access gallery is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.cancelled || result.canceled) return;
      const uri = result.assets?.[0]?.uri ?? result.uri;
      if (!uri) return;

      // Just show local preview - don't upload yet
      setSelectedImageUri(uri);
    } catch (error) {
      Alert.alert('Error', error.message || 'Unknown error');
    }
  };

  const validatePhone = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    if (cleaned.length === 0) {
      setPhoneError('');
      return;
    }
    if (!/^(05|06|07)/.test(cleaned)) {
      setPhoneError('Must start with 05, 06, or 07');
    } else if (cleaned.length < 10) {
      setPhoneError('Must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  // 2. Link Save Logic to Backend
  const handleSave = async () => {
  if (phone.length > 0 && (phoneError || phone.length !== 10)) {
    Alert.alert('Invalid Phone', 'Please enter a valid Algerian phone number');
    return;
  }
  if (!name.trim()) {
    Alert.alert('Invalid Name', 'Full Name cannot be empty');
    return;
  }

  setLoading(true);

  try {
    let photoUrl = user?.photo || null;

    if (selectedImageUri) {
      setIsUploading(true);
      const userId = user?._id;
      const res = await uploadProfilePhoto(selectedImageUri, userId);
      setIsUploading(false);

      if (res.success && res.data) {
        photoUrl = res.data;
      } else {
        Alert.alert('Warning', res.message || "Image upload failed, but profile will be saved.");
        return;
      }
    }

    const updateData = { nom: name, telephone: phone, adresse: address, photo: photoUrl };

    const response = await authService.updateProfile(updateData);

    // If axios didn't throw but backend signals failure
    if (!response?.success) {
      Alert.alert("Error", response?.message || "Failed to update profile");
      return;  // ← stops here, no success message
    }

    // Safe to update local storage now
    const storedRaw = await SecureStore.getItemAsync('userData');
    const currentUser = JSON.parse(storedRaw);
    const updatedUser = { ...currentUser, ...response.data };
    await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));

    try {
      const newValidUri = await getValidAvatarUri(updatedUser.photo, true);
      setValidPhotoUri(newValidUri ?? updatedUser.avatar ?? null);
    } catch {
      // non-critical
    }

    setSelectedImageUri(null);
    Alert.alert("Success", "Profile updated successfully!", [
      { text: "OK", onPress: () => router.replace('/(admin)/profile') }
    ]);

  } catch (error) {
    // Network errors, timeouts, 4xx/5xx — only shows error, never success
    const msg = error?.response?.data?.message || error?.message || "Failed to update profile";
    Alert.alert("Error", msg);
  } finally {
    setLoading(false);
    setIsUploading(false);
  }
};

  if (!fontsLoaded || initialLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Full screen photo modal */}
      <Modal visible={photoVisible} transparent={true} animationType="fade" onRequestClose={() => setPhotoVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPhotoVisible(false)}>
          <View style={styles.modalOverlay}>
            {displayAvatarUri ? (
  <Image source={{ uri: displayAvatarUri }} style={styles.fullPhoto} />
) : (
  <View style={[styles.fullPhoto, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
    <Text style={{ color: '#475569', fontSize: 60, fontWeight: '700' }}>{avatarLetter}</Text>
  </View>
)}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(admin)/profile')}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#2E7D32" />
        ) : (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Pressable onPress={handleChangePhoto} onLongPress={() => setPhotoVisible(true)} delayLongPress={400}>
                  {displayAvatarUri ? (
  <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
) : (
  <View style={[styles.avatar, styles.avatarPlaceholder]}>
    <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
  </View>
)}
                </Pressable>
                <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto}>
                  <Ionicons name="camera" size={15} color="#FFFFFF" />
                </TouchableOpacity>
                {isUploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={handleChangePhoto}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Hamouda Hatem"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={[styles.phoneInput, phoneError ? styles.inputError : null]}>
                <Text style={styles.phonePrefix}>+213</Text>
                <View style={styles.phoneDivider} />
                <TextInput
                  style={styles.phoneField}
                  value={phone}
                  onChangeText={validatePhone}
                  placeholder="0612345678"
                  keyboardType="phone-pad"
                  placeholderTextColor="#AAAAAA"
                  maxLength={10}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            {/* Address Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="123 Green Street, Alger"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Deactivate Button (Optional Placeholder) 
            <Pressable style={({ pressed }) => [styles.deactivateBtn, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#D32F2F" />
              <Text style={styles.deactivateText}>Deactivate Account</Text>
            </Pressable>*/}

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPhoto: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#1a1a1a',
  },
  saveBtn: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#2E7D32',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.background,
  },
  changePhotoText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#2E7D32',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E4EDE4',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#1a1a1a',
  },
  phoneInput: {
    backgroundColor: '#E4EDE4',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: '#D32F2F',
  },
  phonePrefix: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#888888',
    marginRight: 10,
  },
  phoneDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#BBBBBB',
    marginRight: 12,
  },
  phoneField: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#1a1a1a',
    padding: 0,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 5,
    marginLeft: 4,
  },
  successText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
    marginLeft: 4,
  },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    backgroundColor: '#FFF5F5',
    alignSelf: 'center',
  },
  deactivateText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#D32F2F',
  },
  avatarPlaceholder: {
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#E2E8F0',
},
avatarPlaceholderText: {
  color: '#475569',
  fontSize: 28,
  fontWeight: '700',
},
});