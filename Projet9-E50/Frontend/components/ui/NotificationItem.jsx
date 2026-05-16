import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TYPE_CONFIG = {
  order: {
    icon: 'cart-outline',
    iconFilled: 'cart',
    bgColor: '#E8F5E9',
    iconColor: '#2E7D32',
    accentColor: '#2E7D32',
    label: 'Order',
  },
  reminder: {
    icon: 'bell-outline',
    iconFilled: 'bell',
    bgColor: '#FFF3E0',
    iconColor: '#F57C00',
    accentColor: '#F57C00',
    label: 'Reminder',
  },
  offer: {
    icon: 'star-outline',
    iconFilled: 'star',
    bgColor: '#E0F7FA',
    iconColor: '#00796B',
    accentColor: '#00796B',
    label: 'Offer',
  },
  completed: {
    icon: 'check-circle-outline',
    iconFilled: 'check-circle',
    bgColor: '#E8F5E9',
    iconColor: '#2E7D32',
    accentColor: '#2E7D32',
    label: 'Completed',
  },
  support: {
    icon: 'headset',
    iconFilled: 'headset',
    bgColor: '#EFF6FF',
    iconColor: '#3B82F6',
    accentColor: '#3B82F6',
    label: 'Support',
  },
};

export default function NotificationItem({ title, description, time, type, isRead, onRead }) {
  const [modalVisible, setModalVisible] = useState(false);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.order;

  const handlePress = () => {
    setModalVisible(true);
    if (!isRead && onRead) onRead();
  };

  return (
    <>
      {/* ── Collapsed card ── */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={[
          styles.card,
          isRead ? styles.cardRead : styles.cardUnread,
        ]}
      >
        {/* Unread indicator dot */}
        {!isRead && <View style={[styles.unreadDot, { backgroundColor: config.accentColor }]} />}

        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
          <MaterialCommunityIcons
            name={isRead ? config.icon : config.iconFilled}
            size={22}
            color={config.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.typeLabel, { color: config.iconColor }]}>
              {config.label.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={[styles.title, isRead ? styles.titleRead : styles.titleUnread]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {/* Time */}
          <Text style={styles.time}>{time}</Text>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={isRead ? '#CBD5E1' : '#94A3B8'}
        />
      </TouchableOpacity>

      {/* ── Expanded modal overlay ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          {/* Stop propagation so tapping the card doesn't close it */}
          <Pressable style={styles.detailCard} onPress={() => {}}>

            {/* Icon + type row */}
            <View style={styles.detailIconRow}>
              <View style={[styles.detailIconBox, { backgroundColor: config.bgColor }]}>
                <MaterialCommunityIcons
                  name={config.iconFilled}
                  size={30}
                  color={config.iconColor}
                />
              </View>
              <View style={[styles.detailTypePill, { backgroundColor: config.bgColor }]}>
                <Text style={[styles.detailTypeText, { color: config.accentColor }]}>
                  {config.label.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.detailTitle}>{title}</Text>

            {/* Divider */}
            <View style={styles.detailDivider} />

            {/* Full message */}
            <Text style={styles.detailDescription}>{description}</Text>

            {/* Time */}
            <Text style={styles.detailTime}>{time}</Text>

            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: config.accentColor }]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Collapsed card ──────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    position: 'relative',
    gap: 12,
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  cardRead: {
    backgroundColor: '#F8FAF8',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    opacity: 0.75,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  titleRead: {
    fontWeight: '400',
    color: '#64748B',
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },

  // ── Modal overlay ───────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },
  detailIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  detailIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  detailTypeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 16,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 24,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
