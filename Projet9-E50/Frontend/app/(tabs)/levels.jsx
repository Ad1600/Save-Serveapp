import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Clipboard, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { getValidAvatarUri } from '../../services/ImageUserServeces';
import { bonService } from '../../services/bonService';

// ─── Level Config ─────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 200;

function getLevelFromXP(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function getXPProgress(xp)  { return xp % XP_PER_LEVEL; }
const BADGES = [
  { minLevel: 1,   maxLevel: 10,   icon: 'leaf',       color: '#4CAF50', bg: '#E8F5E9', label: 'Eco Starter'        },
  { minLevel: 11,  maxLevel: 20,   icon: 'recycle',     color: '#2196F3', bg: '#E3F2FD', label: 'Green Guardian'    },
  { minLevel: 21,  maxLevel: 30,   icon: 'shield-star', color: '#9C27B0', bg: '#F3E5F5', label: 'Eco Champion'      },
  { minLevel: 31,  maxLevel: 9999, icon: 'crown',       color: '#FFB300', bg: '#FFF8E1', label: 'Sustainability Hero'},
];
function getBadge(level) { return BADGES.find(b => level >= b.minLevel && level <= b.maxLevel) || BADGES[3]; }

const TITLES = [
  { min: 1,  title: 'Fresh Saver'        },
  { min: 5,  title: 'Food Rescuer'        },
  { min: 10, title: 'Green Warrior'       },
  { min: 15, title: 'Eco Guardian'        },
  { min: 20, title: 'Planet Defender'     },
  { min: 30, title: 'Sustainability Hero' },
  { min: 40, title: 'Earth Legend'        },
];
function getTitle(level) { return [...TITLES].reverse().find(t => level >= t.min)?.title || 'Fresh Saver'; }

function getReductionForLevel(n) {
  if (n <= 1)  return 2;
  if (n <= 2)  return 3;
  if (n <= 4)  return 4;
  if (n <= 9)  return 5;
  if (n <= 19) return 6;
  return 7;
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────

function XPBar({ progress, total }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: total > 0 ? Math.min(progress / total, 1) : 0, duration: 1200, useNativeDriver: false }).start();
  }, [progress, total]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '100%'] });
  return (
    <View style={xS.track}>
      <Animated.View style={[xS.fill, { width }]}>
        <LinearGradient colors={['#69F0AE', '#2E7D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={xS.shimmer} />
      </Animated.View>
    </View>
  );
}
const xS = StyleSheet.create({
  track:   { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  fill:    { height: '100%', borderRadius: 6, overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: '55%', width: 28, backgroundColor: 'rgba(255,255,255,0.22)', transform: [{ skewX: '-20deg' }] },
});

// ─── Voucher Card ─────────────────────────────────────────────────────────────

function VoucherCard({ bon, onCopy }) {
  const scaleAnim   = useRef(new Animated.Value(0.93)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUsed    = bon.utilisé;
  const isExpired = new Date(bon.dateExpiration) < new Date();
  const locked    = isUsed || isExpired;

  return (
    <Animated.View style={[vS.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={locked ? ['#F0F0F0', '#E4E4E4'] : ['#F0FDF4', '#DCFCE7']} style={vS.gradient}>
        <LinearGradient colors={locked ? ['#BDBDBD', '#9E9E9E'] : ['#2E7D32', '#1B5E20']} style={vS.strip} />
        <View style={[vS.hole, vS.holeTop]} />
        <View style={[vS.hole, vS.holeBot]} />
        <View style={vS.body}>
          <View style={vS.topRow}>
            <View style={[vS.pctBadge, locked && vS.pctBadgeLocked]}>
              <Text style={[vS.pctTxt, locked && vS.pctTxtLocked]}>{bon.reduction}% OFF</Text>
            </View>
            <Text style={[vS.levelTag, locked && { color: '#BDBDBD' }]}>Level {bon.niveau} reward</Text>
          </View>
          <Text style={[vS.desc, locked && { color: '#BDBDBD' }]}>
            {isExpired ? 'This voucher has expired' : isUsed ? 'Already used' : 'Valid on your next order'}
          </Text>
          <View style={vS.codeRow}>
            <Text style={[vS.code, locked && vS.codeLocked]}>{locked ? '••••••••••••' : bon.code}</Text>
            {!locked ? (
              <TouchableOpacity style={vS.copyBtn} onPress={() => onCopy(bon.code)}>
                <Ionicons name="copy-outline" size={13} color="#FFF" />
                <Text style={vS.copyTxt}>Copy</Text>
              </TouchableOpacity>
            ) : (
              <View style={vS.usedBadge}>
                <Ionicons name="lock-closed" size={11} color="#9E9E9E" />
                <Text style={vS.usedTxt}>{isExpired ? 'Expired' : 'Used'}</Text>
              </View>
            )}
          </View>
          {!locked && (
            <Text style={vS.expiry}>
              Expires {new Date(bon.dateExpiration).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Locked Preview Card ──────────────────────────────────────────────────────

function LockedPreviewCard({ nextLevel }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.02, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[vS.card, { transform: [{ scale: pulse }] }]}>
      <LinearGradient colors={['#F8FAF8', '#EEF4EE']} style={vS.gradient}>
        <LinearGradient colors={['#C8E6C9', '#A5D6A7']} style={vS.strip} />
        <View style={[vS.hole, vS.holeTop]} />
        <View style={[vS.hole, vS.holeBot]} />
        <View style={[vS.body, vS.lockedBody]}>
          <View style={vS.lockCircle}>
            <Ionicons name="lock-closed" size={26} color="#C8E6C9" />
          </View>
          <Text style={vS.lockedTitle}>Next Reward Locked</Text>
          <Text style={vS.lockedSub}>
            Reach Level {nextLevel} to unlock {getReductionForLevel(nextLevel)}% off voucher
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const vS = StyleSheet.create({
  card:          { marginBottom: 12, borderRadius: 18, overflow: 'hidden', shadowColor: '#2E7D32', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3 },
  gradient:      { flexDirection: 'row', minHeight: 100 },
  strip:         { width: 7 },
  hole:          { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#F4F9F1', left: -1, zIndex: 2 },
  holeTop:       { top: -9 },
  holeBot:       { bottom: -9 },
  body:          { flex: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 5 },
  lockedBody:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 22 },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pctBadge:      { backgroundColor: '#2E7D32', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  pctBadgeLocked:{ backgroundColor: '#E0E0E0' },
  pctTxt:        { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 12, color: '#FFF' },
  pctTxtLocked:  { color: '#9E9E9E' },
  levelTag:      { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#4CAF50' },
  desc:          { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#546E7A' },
  codeRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  code:          { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#1B5E20', letterSpacing: 1.5 },
  codeLocked:    { color: '#BDBDBD', letterSpacing: 2 },
  copyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  copyTxt:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#FFF' },
  usedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  usedTxt:       { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#9E9E9E' },
  expiry:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: '#90A4AE', marginTop: 2 },
  lockCircle:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F1F8F1', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2, borderColor: '#C8E6C9', borderStyle: 'dashed' },
  lockedTitle:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#B0BEC5' },
  lockedSub:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#CFD8DC', textAlign: 'center', marginTop: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MasteryProfile() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  const [user,         setUser]         = useState(null);
  const [avatarUri,    setAvatarUri]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [bons,         setBons]         = useState([]);
  const [totalDepense, setTotalDepense] = useState(0);
  const [mealsSaved,   setMealsSaved]   = useState(0);
  const [co2Saved,     setCo2Saved]     = useState(0);

  const cardScale   = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load user
      const raw = await SecureStore.getItemAsync('userData');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        if (u.photo) {
          const uri = await getValidAvatarUri(u.photo, true);
          setAvatarUri(uri ?? null);
        }
      }

      // Fetch total spending and vouchers in parallel
      const [depRes, bonsRes] = await Promise.all([
        bonService.getTotalDepense(),
        bonService.getMesBons(),
      ]);

      if (depRes.success) {
        setTotalDepense(depRes.total || 0);
        setMealsSaved(depRes.mealsSaved || 0);
        setCo2Saved(depRes.co2Saved || 0);
      }
      if (bonsRes.success) setBons(bonsRes.data);

    } catch (e) {
      console.error('MasteryProfile error:', e);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.spring(cardScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleCopy = (code) => {
    Clipboard.setString(code);
    Alert.alert('✓ Copied!', `Code ${code} copied to clipboard.\nUse it at checkout — single use only.`);
  };

  if (!fontsLoaded || loading) {
    return <View style={{ flex: 1, backgroundColor: '#F4F9F1', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  const level      = getLevelFromXP(totalDepense);
  const xpProgress = getXPProgress(totalDepense);
  const badge      = getBadge(level);
  const honorTitle = getTitle(level);
  const displayName  = user?.nom?.trim() || 'Guest User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Mastery</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/edit-profile')} style={s.iconBtn}>
          <Ionicons name="pencil-outline" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarRing}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatar} />
              : <View style={[s.avatar, s.avatarFallback]}><Text style={s.avatarLetter}>{avatarLetter}</Text></View>
            }
            <View style={[s.badgePin, { backgroundColor: badge.bg }]}>
              <MaterialCommunityIcons name={badge.icon} size={13} color={badge.color} />
            </View>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <View style={s.honorPill}>
            <Ionicons name="shield-checkmark" size={12} color="#2E7D32" />
            <Text style={s.honorText}>{honorTitle.toUpperCase()}</Text>
          </View>
        </View>

        {/* Mastery Card */}
        <Animated.View style={[s.cardWrap, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <LinearGradient colors={['#1B4332', '#2D6A4F', '#1B4332']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
            <View style={s.deco1} /><View style={s.deco2} />
            <View style={s.cardTop}>
              <View>
                <Text style={s.masteryLbl}>CURRENT MASTERY</Text>
                <Text style={s.levelTxt}>Level {level}</Text>
              </View>
              <View style={[s.badgeCircle, { borderColor: badge.color, backgroundColor: badge.bg + '33' }]}>
                <MaterialCommunityIcons name={badge.icon} size={26} color={badge.color} />
              </View>
            </View>
            <Text style={s.progressLbl}>
              Progress to Level <Text style={s.progressHL}>{level + 1}</Text>
              {'   '}<Text style={s.progressVal}>{xpProgress} / {XP_PER_LEVEL} DA</Text>
            </Text>
            <XPBar progress={xpProgress} total={XP_PER_LEVEL} />
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statLbl}>CO2 SAVED</Text>
                <Text style={s.statVal}>{co2Saved} kg</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statBox}>
                <Text style={s.statLbl}>MEALS SAVED</Text>
                <Text style={s.statVal}>{mealsSaved}</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statBox}>
                <Text style={s.statLbl}>TOTAL SPENT</Text>
                <Text style={s.statVal}>{totalDepense} DA</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Vouchers */}
        <View style={s.secRow}>
          <Text style={s.secTitle}>Reward Vouchers</Text>
          <View style={s.secPill}><Text style={s.secPillTxt}>{bons.length} active</Text></View>
        </View>
        <Text style={s.secSub}>You earn a discount voucher each level. Copy code at checkout — single use only.</Text>

        {bons.length === 0
          ? <LockedPreviewCard nextLevel={level + 1} />
          : <>
              {bons.map(bon => <VoucherCard key={bon._id} bon={bon} onCopy={handleCopy} />)}
              <LockedPreviewCard nextLevel={level + 1} />
            </>
        }

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F4F9F1' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  iconBtn:      { padding: 4 },
  headerTitle:  { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#1a1a1a' },
  scroll:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  avatarSection:{ alignItems: 'center', marginBottom: 22, paddingTop: 6 },
  avatarRing:   { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: '#69F0AE', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' },
  avatar:       { width: 96, height: 96, borderRadius: 48 },
  avatarFallback:{ backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 34, color: '#1B5E20' },
  badgePin:     { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F4F9F1' },
  displayName:  { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 23, color: '#1a1a1a', marginBottom: 8 },
  honorPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  honorText:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#2E7D32', letterSpacing: 0.8 },
  cardWrap:     { borderRadius: 24, overflow: 'hidden', marginBottom: 26, shadowColor: '#1B4332', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 10 },
  card:         { padding: 22, overflow: 'hidden' },
  deco1:        { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40 },
  deco2:        { position: 'absolute', width: 100, height: 100, borderRadius: 50,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 20 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  masteryLbl:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, marginBottom: 4 },
  levelTxt:     { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 36, color: '#FFFFFF' },
  badgeCircle:  { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressLbl:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  progressHL:   { fontFamily: 'PlusJakartaSans_700Bold', color: '#69F0AE' },
  progressVal:  { fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  statsRow:     { flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 14, padding: 12 },
  statBox:      { flex: 1, alignItems: 'center' },
  statLbl:      { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, marginBottom: 3 },
  statVal:      { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15, color: '#FFFFFF' },
  statDiv:      { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  secRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  secTitle:     { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#1a1a1a' },
  secPill:      { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  secPillTxt:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#2E7D32' },
  secSub:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#78909C', marginBottom: 14, lineHeight: 18 },
});