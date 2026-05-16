import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

const ReviewModal = ({ visible, onClose, onSubmit, orderId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleRating = (val) => {
    setRating(val);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Veuillez sélectionner une note.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        commandeId: orderId,
        note: rating,
        commentaire: comment,
      });
      
      setSubmitted(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setSubmitted(false);
          setRating(0);
          setComment('');
          fadeAnim.setValue(0);
        }, 300);
      }, 2000);

    } catch (error) {
      console.error('Submit review error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Erreur lors de l\'envoi de l\'avis.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {!submitted ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Votre expérience</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary || '#0F172A'} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Comment s'est passée votre commande ? Votre avis aide la communauté.
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => handleRating(star)}
                    style={styles.starTouch}
                  >
                    <Ionicons 
                      name={star <= rating ? "star" : "star-outline"} 
                      size={40} 
                      color={star <= rating ? "#FFD700" : "#CCC"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Racontez-nous votre expérience... (Optionnel)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity 
                style={[styles.submitButton, rating === 0 && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitText}>Envoyer l'avis</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
              </View>
              <Text style={styles.successTitle}>Merci !</Text>
              <Text style={styles.successMessage}>
                Votre avis aide la communauté Save&Serve.
              </Text>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    minHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary || '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  starTouch: {
    marginHorizontal: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: Colors.textPrimary || '#000',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.primary || '#2E7D32',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ReviewModal;
