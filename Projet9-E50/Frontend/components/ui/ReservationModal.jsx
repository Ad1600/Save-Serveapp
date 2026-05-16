import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Alert, Pressable,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import { orderService } from '../../services/orderService';

export default function ReservationModal({ visible, onClose, offer, onReserveSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const couponRef = useRef(null);

  useEffect(() => {
    if (visible && offer) {
      setQuantity(1);
      setNotes('');
      setCoupon('');
      setLoading(false);
    }
  }, [visible, offer?._id]);

  if (!offer) return null;

  const handleIncrement = () => {
    if (quantity < offer.quantiteDisponible) setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const submitOrder = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const orderData = {
        offreId: offer._id,
        quantite: quantity,
        notes: notes,
        bonCode: coupon,
      };
      const result = await orderService.createOrder(orderData);
      if (result.success) {
        Alert.alert(
          'Reservation Confirmed',
          `Your pickup code is: ${result.data.codeRetrait}`,
          [{
            text: 'OK', onPress: () => {
              onClose();
              onReserveSuccess?.(offer._id, quantity);
            }
          }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : -5}
          style={styles.kavWrapper}
        >
          <Pressable style={styles.sheet} onPress={Keyboard.dismiss}>
            <View style={styles.handle} />
            <Text style={styles.title}>{offer.titre}</Text>
            <Text style={styles.description}>{offer.description}</Text>

            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.priceLabel}>DISCOUNTED PRICE</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.activePrice}>{offer.prix} DA</Text>
                  {offer.prixOriginal ? (
                    <Text style={styles.oldPrice}>{offer.prixOriginal} DA</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{offer.quantiteDisponible} LEFT</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>QUANTITY</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyText}>{quantity}</Text>
              </View>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnActive]} onPress={handleIncrement}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="create-outline" size={18} color="#BDBDBD" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Allergies, preferences..."
                placeholderTextColor="#BDBDBD"
                value={notes}
                onChangeText={setNotes}
                returnKeyType="next"
                onSubmitEditing={() => couponRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <Text style={styles.inputLabel}>COUPON CODE (OPTIONAL)</Text>
            <View style={styles.couponRow}>
              <View style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="pricetag-outline" size={18} color="#BDBDBD" style={styles.inputIcon} />
                <TextInput
                  ref={couponRef}
                  style={styles.textInput}
                  placeholder="e.g. BON-ABC12345"
                  placeholderTextColor="#BDBDBD"
                  value={coupon}
                  onChangeText={setCoupon}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              <TouchableOpacity style={styles.okBtn} onPress={Keyboard.dismiss}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.reserveBtn, loading && styles.reserveBtnDisabled]}
              onPress={submitOrder}
              disabled={loading}
            >
              <Text style={styles.reserveBtnText}>
                {loading ? 'Processing...' : 'Reserve Now'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="white" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { flex: 1, width: '100%' },
  kavWrapper: { width: '100%' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  handle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  description: { color: '#666', marginTop: 6, lineHeight: 20, marginBottom: 4 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F8F1', padding: 14, borderRadius: 16, marginVertical: 14 },
  priceLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  activePrice: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  oldPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  stockBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  stockText: { fontSize: 11, fontWeight: '700', color: '#1A1A1A' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#9E9E9E', marginBottom: 8, letterSpacing: 0.5 },
  quantityRow: { flexDirection: 'row', marginBottom: 16 },
  qtyBtn: { width: 48, height: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEEEEE' },
  qtyBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  qtyDisplay: { flex: 1, marginHorizontal: 12, height: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEEEEE' },
  qtyText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 14, height: 50, backgroundColor: '#FAFAFA', marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#1A1A1A', height: '100%' },
  couponRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  okBtn: { backgroundColor: Colors.primary, width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  okText: { color: 'white', fontWeight: '700', fontSize: 14 },
  reserveBtn: { backgroundColor: Colors.primary, height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignSelf: 'center', marginTop: 12, padding: 10 },
  cancelText: { color: '#9E9E9E', fontSize: 14, fontWeight: '500' },
});