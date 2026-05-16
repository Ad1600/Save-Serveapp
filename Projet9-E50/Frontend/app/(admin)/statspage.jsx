import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Easing, ActivityIndicator, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { adminService } from "../../services/adminService";
import AdminHeader from "../../components/adminhead";
import * as SecureStore from 'expo-secure-store';
import { getValidAvatarUri } from '../../services/ImageUserServeces';

function FadeSlideIn({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, speed: 14, bounciness: 4, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      {children}
    </Animated.View>
  );
}

function PulsingLeaf({ iconName = "leaf", bgColor = "#C8E6C9", iconColor = "#2E7D32", size = 52 }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.pulsingIconBox, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }, { transform: [{ scale }] }]}>
      <Ionicons name={iconName} size={size * 0.5} color={iconColor} />
    </Animated.View>
  );
}

function CountUp({ value, decimals = 0, delay = 0, style }) {
  const [display, setDisplay] = useState("0");
  const numeric = parseFloat(value) || 0;

  useEffect(() => {
    let start = null;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp + delay;
      if (timestamp < start) { requestAnimationFrame(step); return; }
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay((eased * numeric).toFixed(decimals));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState("250.00");
  const [co2Saved, setCo2Saved] = useState("2.50");
  const [orders, setOrders] = useState(6);
  const [completedOrders, setCompletedOrders] = useState(4);
  const [buyers, setBuyers] = useState(6);
  const [sellers, setSellers] = useState(2);
  const [savedMeals, setSavedMeals] = useState(1);
  const [canceledOrders, setCanceledOrders] = useState(2);
  const [avatarUri, setAvatarUri] = useState(null);
  const [userName, setUserName] = useState('');


  const loadStats = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await adminService.getStats();
      const statsData = result?.data;
      if (statsData) {
        const fmt = (v, d = 0) => { if (v == null || v === "") return "0"; const n = Number(v); return Number.isNaN(n) ? String(v) : n.toFixed(d); };
        if (statsData.totalRevenue != null) setTotalRevenue(fmt(statsData.totalRevenue, 2));
        if (statsData.co2Saved != null) setCo2Saved(fmt(statsData.co2Saved, 2));
        if (statsData.totalOrders != null) setOrders(statsData.totalOrders);
        if (statsData.totalClients != null) setBuyers(statsData.totalClients);
        if (statsData.totalSellers != null) setSellers(statsData.totalSellers);
        if (statsData.mealsSaved != null) setSavedMeals(statsData.mealsSaved);
        if (statsData.completedOrders != null) setCompletedOrders(statsData.completedOrders);
        if (statsData.canceledOrders != null) setCanceledOrders(statsData.canceledOrders);
      }
    } catch {
      setError("Failed to load stats. Please try again.");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStats({ showLoading: true }); }, []);
  useFocusEffect(useCallback(() => {
  loadStats();

  const loadAvatar = async () => {
    try {
      const raw = await SecureStore.getItemAsync('userData');
      if (raw) {
        const user = JSON.parse(raw);
        setUserName(user.nom || user.name || '');
        const uri = await getValidAvatarUri(user.photo, true);
        setAvatarUri(uri ?? user.avatar ?? null);
      }
    } catch (e) {
      console.error('Failed to load avatar in stats', e);
    }
  };
  loadAvatar();
}, []));        
  const onRefresh = () => { setRefreshing(true); loadStats(); };


  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
        <AdminHeader title="Stats" avatarUri={avatarUri} avatarLetter={userName.charAt(0).toUpperCase() || 'U'} />
        </View>
        <View style={styles.centerScreen}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <AdminHeader title="Stats" avatarUri={avatarUri} avatarLetter={userName.charAt(0).toUpperCase() || 'U'} />
        <View style={styles.centerScreen}>
          <Ionicons name="cloud-offline-outline" size={48} color="#BDBDBD" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setError(null)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <AdminHeader title="Stats" avatarUri={avatarUri} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />}
      >
        <FadeSlideIn delay={0}>
          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>Impact Overview</Text>
            <Text style={styles.pageSubtitle}>Real-time performance and sustainability metrics.</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={80}>
          <LinearGradient colors={["#1B5E20", "#2E7D32", "#43A047"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.revenueCard}>
            <View style={styles.revCircle1} /><View style={styles.revCircle2} /><View style={styles.revCircle3} />
            <View style={styles.revenueTop}>
              <View style={styles.revenueIconBox}><Ionicons name="cash-outline" size={22} color="#fff" /></View>
              <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
            </View>
            <View style={styles.revenueAmountRow}>
              <CountUp value={totalRevenue} decimals={2} delay={200} style={styles.revenueAmount} />
              <Text style={styles.revenueCurrency}> DA</Text>
            </View>
            
          </LinearGradient>
        </FadeSlideIn>

        <FadeSlideIn delay={160}>
          <LinearGradient colors={["#E8F5E9", "#F1F8F1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.co2Card}>
            <View style={styles.co2Row}>
              <View style={styles.co2Left}>
                <View style={styles.co2LabelRow}><Ionicons name="leaf-outline" size={13} color="#388E3C" /><Text style={styles.co2Label}>CO2 SAVED</Text></View>
                <View style={styles.co2ValueRow}><CountUp value={co2Saved} decimals={2} delay={300} style={styles.co2Value} /><Text style={styles.co2Unit}> kg</Text></View>
                <Text style={styles.co2Tagline}>🌿 Good for the planet</Text>
              </View>
              <PulsingLeaf iconName="leaf" bgColor="#C8E6C9" iconColor="#2E7D32" size={52} />
            </View>
          </LinearGradient>
        </FadeSlideIn>

        <FadeSlideIn delay={240}>
          <View style={styles.card}><View style={styles.statRow}><View style={[styles.statIconBox, { backgroundColor: "#E8F5E9" }]}><Ionicons name="cart-outline" size={22} color="#2E7D32" /></View><View style={styles.statInfo}><Text style={styles.statLabel}>ORDERS</Text><CountUp value={orders} decimals={0} delay={380} style={styles.statValue} /></View></View></View>
        </FadeSlideIn>

        <FadeSlideIn delay={300}>
          <View style={styles.card}><View style={styles.statRow}><View style={[styles.statIconBox, { backgroundColor: "#E8F5E9" }]}><Ionicons name="checkmark-done-outline" size={22} color="#2E7D32" /></View><View style={styles.statInfo}><Text style={styles.statLabel}>COMPLETED ORDERS</Text><CountUp value={completedOrders} decimals={0} delay={440} style={styles.statValue} /></View></View></View>
        </FadeSlideIn>

        <FadeSlideIn delay={360}>
          <View style={styles.card}><View style={styles.statRow}><View style={[styles.statIconBox, { backgroundColor: "#FFF3E0" }]}><Ionicons name="person-outline" size={22} color="#E65100" /></View><View style={styles.statInfo}><Text style={styles.statLabel}>BUYERS</Text><CountUp value={buyers} decimals={0} delay={500} style={styles.statValue} /></View></View></View>
        </FadeSlideIn>

        <FadeSlideIn delay={420}>
          <View style={styles.card}><View style={styles.statRow}><View style={[styles.statIconBox, { backgroundColor: "#E8F5E9" }]}><Ionicons name="storefront-outline" size={22} color="#2E7D32" /></View><View style={styles.statInfo}><Text style={styles.statLabel}>SELLERS</Text><CountUp value={sellers} decimals={0} delay={560} style={styles.statValue} /></View></View></View>
        </FadeSlideIn>

        <FadeSlideIn delay={480}>
          <View style={styles.sectionHeader}><Ionicons name="refresh-outline" size={18} color="#2E7D32" /><Text style={styles.sectionTitle}>Recovery Metrics</Text></View>
          <LinearGradient colors={["#F1F8E9", "#DCEDC8", "#F9FBE7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mealsCard}>
            <Text style={styles.mealsDecorLeaf1}>🌾</Text><Text style={styles.mealsDecorLeaf2}>🌱</Text>
            <View style={styles.mealsTop}>
              <View style={styles.mealsIconWrapper}><PulsingLeaf iconName="restaurant" bgColor="#AED581" iconColor="#33691E" size={56} /></View>
              <View style={styles.mealsInfo}>
                <View style={styles.mealsLabelRow}><Ionicons name="sparkles-outline" size={12} color="#689F38" /><Text style={styles.mealsLabel}>SAVED MEALS</Text></View>
                <CountUp value={savedMeals} decimals={0} delay={600} style={styles.mealsValue} />
                <Text style={styles.mealsTagline}>Meals saved from waste</Text>
              </View>
            </View>
            <View style={styles.mealsDivider} />
            <View style={styles.mealsFooter}>
              <View style={styles.mealsFooterBadge}><Text style={styles.mealsFooterEmoji}>♻️</Text><Text style={styles.mealsFooterText}>Every meal counts</Text></View>
              <View style={styles.mealsFooterBadge}><Text style={styles.mealsFooterEmoji}>🥗</Text><Text style={styles.mealsFooterText}>Less food waste</Text></View>
            </View>
          </LinearGradient>
        </FadeSlideIn>

        <FadeSlideIn delay={560}>
          <View style={styles.sectionHeader}><Ionicons name="close-circle-outline" size={18} color="#C62828" /><Text style={[styles.sectionTitle, { color: "#C62828" }]}>System Health</Text></View>
          <View style={[styles.card, styles.cardDanger]}>
            <Text style={styles.canceledLabel}>CANCELED ORDERS</Text>
            <CountUp value={canceledOrders} decimals={0} delay={660} style={styles.canceledValue} />
            {canceledOrders > 0 && <Text style={styles.canceledNote}>Requires investigation</Text>}
          </View>
        </FadeSlideIn>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 5, backgroundColor: "#F1F8F1" },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  centerScreen: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
  loadingText: { fontSize: 14, color: "#9E9E9E", marginTop: 8 },
  errorText: { fontSize: 14, color: "#C62828", textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 28, paddingVertical: 11, borderRadius: 20, marginTop: 4 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  titleBlock: { marginBottom: 20, marginTop: 20 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: "#757575", marginTop: 4, lineHeight: 18 },
  revenueCard: { borderRadius: 20, padding: 22, marginBottom: 14, overflow: "hidden", position: "relative" },
  revCircle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -50 },
  revCircle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: 10 },
  revCircle3: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.04)", top: 10, left: -20 },
  revenueTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  revenueIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  revenueLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.8)", letterSpacing: 1.2 },
  revenueAmountRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  revenueAmount: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1 },
  revenueCurrency: { fontSize: 20, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 12 },
  revenueChangeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  revenueChange: { fontSize: 13, color: "#A5D6A7", fontWeight: "500" },
  co2Card: { borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#C8E6C9" },
  co2Row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  co2Left: { flex: 1 },
  co2LabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  co2Label: { fontSize: 11, fontWeight: "700", color: "#388E3C", letterSpacing: 1 },
  co2ValueRow: { flexDirection: "row", alignItems: "baseline" },
  co2Value: { fontSize: 36, fontWeight: "800", color: "#1B5E20" },
  co2Unit: { fontSize: 16, fontWeight: "700", color: "#388E3C" },
  co2Tagline: { fontSize: 12, color: "#66BB6A", marginTop: 6, fontWeight: "500" },
  pulsingIconBox: { justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  cardDanger: { backgroundColor: "#FFF8F8", borderWidth: 1, borderColor: "#FFCDD2", alignItems: "center", paddingVertical: 24 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  statIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: "700", color: "#9E9E9E", letterSpacing: 1, marginBottom: 2 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#1A1A1A" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  mealsCard: { borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: "#C5E1A5", overflow: "hidden", position: "relative" },
  mealsDecorLeaf1: { position: "absolute", top: 8, right: 16, fontSize: 36, opacity: 0.15 },
  mealsDecorLeaf2: { position: "absolute", bottom: 8, right: 60, fontSize: 28, opacity: 0.12 },
  mealsTop: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  mealsIconWrapper: {},
  mealsInfo: { flex: 1 },
  mealsLabelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  mealsLabel: { fontSize: 11, fontWeight: "700", color: "#689F38", letterSpacing: 1 },
  mealsValue: { fontSize: 42, fontWeight: "900", color: "#33691E", letterSpacing: -1 },
  mealsTagline: { fontSize: 12, color: "#8BC34A", fontWeight: "500", marginTop: 2 },
  mealsDivider: { height: 1, backgroundColor: "#C5E1A5", marginBottom: 14 },
  mealsFooter: { flexDirection: "row", gap: 10 },
  mealsFooterBadge: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#C5E1A5" },
  mealsFooterEmoji: { fontSize: 14 },
  mealsFooterText: { fontSize: 11, fontWeight: "600", color: "#558B2F", flex: 1 },
  canceledLabel: { fontSize: 11, fontWeight: "700", color: "#9E9E9E", letterSpacing: 1, marginBottom: 8 },
  canceledValue: { fontSize: 52, fontWeight: "900", color: "#C62828", letterSpacing: -1 },
  canceledNote: { fontSize: 13, color: "#C62828", fontWeight: "500", marginTop: 4 },
});