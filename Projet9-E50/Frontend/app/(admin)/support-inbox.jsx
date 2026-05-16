import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Color';
import { StatusBar } from 'expo-status-bar';
import { supportService } from '../../services/supportService';
import { BASE_URL } from '../../constants/Api';

const SUBJECT_META = {
  question:   { label: 'Question',    icon: 'help-circle-outline',  color: '#3B82F6', bg: '#EFF6FF' },
  bug:        { label: 'Report',      icon: 'bug-outline',          color: '#EF4444', bg: '#FEF2F2' },
  suggestion: { label: 'Suggestion',  icon: 'bulb-outline',         color: '#F59E0B', bg: '#FFFBEB' },
  autre:      { label: 'Other',       icon: 'chatbubble-outline',   color: '#8B5CF6', bg: '#F5F3FF' },
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getAvatarLetter = (nom) => (nom || 'U').charAt(0).toUpperCase();

const getPhotoUri = (photo) => {
  if (!photo) return null;
  return photo.startsWith('http') ? photo : `${BASE_URL}/uploads/${photo}`;
};

export default function SupportInbox() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await supportService.getMessages();
      setMessages(res.data || []);
    } catch (e) {
      console.log('Support inbox error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadMessages(); }, []));

  const openMessage = async (msg) => {
    setSelected(msg);
    if (!msg.lu) {
      supportService.markAsRead(msg._id).catch(() => {});
      setMessages((prev) => prev.map((m) => m._id === msg._id ? { ...m, lu: true } : m));
    }
  };

  const unreadCount = messages.filter((m) => !m.lu).length;

  const renderItem = ({ item }) => {
    const meta = SUBJECT_META[item.sujet] || SUBJECT_META.autre;
    return (
      <TouchableOpacity
        style={[styles.card, !item.lu && styles.cardUnread]}
        onPress={() => openMessage(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.avatarCircle, { backgroundColor: meta.color + '20' }]}>
          {getPhotoUri(item.client?.photo) ? (
            <Image source={{ uri: getPhotoUri(item.client.photo) }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarLetter, { color: meta.color }]}>
              {getAvatarLetter(item.nom)}
            </Text>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName} numberOfLines={1}>{item.nom}</Text>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.cardMid}>
            <View style={[styles.subjectBadge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={12} color={meta.color} />
              <Text style={[styles.subjectBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {!item.lu && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardPreview} numberOfLines={1}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Support Inbox</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity onPress={loadMessages} style={styles.backBtn}>
          <Ionicons name="refresh-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : messages.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-open-outline" size={52} color="#CBD5E1" />
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Message detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selected && (() => {
              const meta = SUBJECT_META[selected.sujet] || SUBJECT_META.autre;
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <View style={[styles.avatarCircleLg, { backgroundColor: meta.color + '20' }]}>
                      {getPhotoUri(selected.client?.photo) ? (
                        <Image source={{ uri: getPhotoUri(selected.client.photo) }} style={styles.avatarImgLg} />
                      ) : (
                        <Text style={[styles.avatarLetterLg, { color: meta.color }]}>
                          {getAvatarLetter(selected.nom)}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalName}>{selected.nom}</Text>
                      <Text style={styles.modalEmail}>{selected.email}</Text>
                      <Text style={styles.modalDate}>{formatDate(selected.createdAt)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                      <Ionicons name="close" size={22} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.subjectRow, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                    <Text style={[styles.subjectRowText, { color: meta.color }]}>{meta.label}</Text>
                  </View>

                  <Text style={styles.modalMessage}>{selected.message}</Text>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
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
  headerSub: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardUnread: { borderColor: Colors.primary + '40', borderWidth: 1.5 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '800' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
  cardDate: { fontSize: 11, color: '#94A3B8' },
  cardMid: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  subjectBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  subjectBadgeText: { fontSize: 11, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cardPreview: { fontSize: 12, color: '#64748B' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  avatarCircleLg: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetterLg: { fontSize: 22, fontWeight: '800' },
  avatarImgLg: { width: 52, height: 52, borderRadius: 26 },
  modalName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  modalEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  subjectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
  },
  subjectRowText: { fontSize: 13, fontWeight: '700' },
  modalMessage: { fontSize: 15, color: '#334155', lineHeight: 24 },
});
