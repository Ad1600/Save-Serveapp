import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickupTimeRow } from './PickupTimeRow';
import { LocationRow } from './LocationRow';

const STATUS_STYLES = {
  PENDING:   { label: 'RESERVED',  container: '#DCFCE7', text: '#15803D' },
  CONFIRMED: { label: 'CONFIRMED', container: '#E2E8F0', text: '#475569' },
  READY:     { label: 'READY',     container: '#DCFCE7', text: '#166534' },
  COLLECTED: { label: 'COLLECTED', container: '#FFF3E0', text: '#F57C00' },
  CANCELLED: { label: 'CANCELLED', container: '#FEE2E2', text: '#DC2626' },
};

const DEFAULT_STATUS = { label: 'ORDER', container: '#F1F5F9', text: '#475569' };

export const OrderCard = ({ order, onPress, onCancel, onRate }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const statusKey = order.status || 'PENDING';
  const status = STATUS_STYLES[statusKey] || DEFAULT_STATUS;
  const isActiveOrder = ['PENDING', 'CONFIRMED', 'READY'].includes(statusKey);
  const isCollected = statusKey === 'COLLECTED';
  const showCancel = isActiveOrder && order.status === 'PENDING' && !!onCancel;

  const displayCode = () => {
    if (!order.pickupCode) return 'Pending...';
    if (isRevealed || isCollected) return order.pickupCode;
    return '****';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      {/* ── Top Section ── */}
      <View style={styles.topSection}>
        <Image source={{ uri: order.image }} style={styles.image} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleArea}>
              <View style={[styles.badge, { backgroundColor: status.container }]}>
                <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
              </View>
              <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">{order.storeName}</Text>
              <Text
                style={[styles.description, isCollected && { textDecorationLine: 'line-through' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {order.description}
              </Text>
              <PickupTimeRow time={order.pickupTime} wide={isActiveOrder} />
            </View>

            <View style={styles.rightHeader}>
              <Text style={[styles.price, isCollected && { color: '#94A3B8' }]}>
                {Math.trunc(order.price)} DA
              </Text>
              {isCollected && !order.isRated && onRate && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={(e) => { e.stopPropagation(); onRate(); }}
                >
                  <Text style={styles.rateButtonText}>Rate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* ── Pickup Code ── */}
      <View style={styles.midSection}>
        <View style={[styles.ticketBadge, isCollected && styles.stampedBadge]}>
          <Text style={styles.ticketLabel}>Code de Retrait:</Text>
          <TouchableOpacity
            style={styles.revealArea}
            onPress={(e) => {
              if (isCollected) return;
              e.stopPropagation();
              setIsRevealed(!isRevealed);
            }}
            disabled={!order.pickupCode || isCollected}
          >
            <Text style={[styles.ticketCode, isCollected && styles.stampedText]}>
              {displayCode()}
            </Text>
            {order.pickupCode && !isCollected && (
              <Ionicons
                name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color="#64748B"
                style={{ marginLeft: 6 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location ── */}
      <LocationRow address={order.location} />

      {/* ── Cancel Button (own row, only for PENDING) ── */}
      {showCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={(e) => { e.stopPropagation?.(); onCancel(); }}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topSection: { flexDirection: 'row' },
  image: { width: 85, height: 85, borderRadius: 12 },
  content: { flex: 1, marginLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  titleArea: { flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  storeName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  description: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rightHeader: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  price: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },
  rateButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    marginTop: 8,
  },
  rateButtonText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
  midSection: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  ticketBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 140,
  },
  stampedBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    marginRight: 8,
  },
  revealArea: { flexDirection: 'row', alignItems: 'center' },
  ticketCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  stampedText: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  // ── Cancel button ──
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});