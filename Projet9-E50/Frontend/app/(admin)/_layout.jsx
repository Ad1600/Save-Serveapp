import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../../constants/Api';

const ADMIN_TAB_ROUTES = ['profile', 'statspage', 'userspage', 'demands', 'commands'];

export const AdminUserContext = createContext(null);
export function useAdminUser() { return useContext(AdminUserContext); }

function TabItem({ route, isFocused, onPress, options }) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
  }, [isFocused]);

  const animatedWidth = animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 120] });
  const backgroundColor = animValue.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255, 255, 255, 0)', Colors.primary] });

  const getIcon = (name) => {
    const size = 22;
    switch (name) {
      case 'profile':   return <Ionicons name={isFocused ? 'person' : 'person-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'statspage': return <Ionicons name={isFocused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'userspage': return <Ionicons name={isFocused ? 'people' : 'people-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'demands':   return <Ionicons name={isFocused ? 'list' : 'list-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'commands':  return <Ionicons name={isFocused ? 'receipt' : 'receipt-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      default: return null;
    }
  };

  const label = options.title || route.name.charAt(0).toUpperCase() + route.name.slice(1);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.tabButton}>
      <Animated.View style={[styles.pill, { width: animatedWidth, backgroundColor }]}>
        <Animated.View style={{ transform: [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }}>
          {getIcon(route.name)}
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[styles.activeTabText, {
            opacity: animValue,
            maxWidth: animValue.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 80] }),
            transform: [{ translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const activeRoute = state.routes[state.index];
  if (!ADMIN_TAB_ROUTES.includes(activeRoute?.name)) return null;
  const visibleRoutes = state.routes.filter((r) => ADMIN_TAB_ROUTES.includes(r.name));

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.mainWrapper}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return <TabItem key={route.name} route={route} isFocused={isFocused} onPress={onPress} options={options} />;
        })}
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const [adminUser, setAdminUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await SecureStore.getItemAsync('userData');
        if (stored) {
          const user = JSON.parse(stored);
          const rawPhoto = user.photo || null;
          const avatarUri = rawPhoto
            ? rawPhoto.startsWith('http') ? rawPhoto : `${BASE_URL}/uploads/${rawPhoto}`
            : null;

          if (avatarUri) await Image.prefetch(avatarUri).catch(() => {});

          setAdminUser({
            initials: (user.nom || user.name || 'AD').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            avatarUri,
          });
        }
      } catch (e) {}
      setReady(true);
    };
    load();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F1F8F1', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <AdminUserContext.Provider value={{ adminUser, setAdminUser }}>
      <Tabs
        backBehavior="firstRoute"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          sceneStyle: { backgroundColor: Colors.background },
        }}
      >
        <Tabs.Screen name="statspage"     options={{ title: 'Stats' }} />
        <Tabs.Screen name="userspage"     options={{ title: 'Users' }} />
        <Tabs.Screen name="demands"       options={{ title: 'Reqs' }} />
        <Tabs.Screen name="commands"      options={{ title: 'Orders' }} />
        <Tabs.Screen name="profile"       options={{ title: 'Profile' }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="edit-profile"   options={{ href: null }} />
        <Tabs.Screen name="support-inbox"  options={{ href: null }} />
        <Tabs.Screen name="change-password" options={{ href: null }} />
        <Tabs.Screen name="settings"       options={{ href: null }} />
      </Tabs>
    </AdminUserContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 0, right: 0, alignItems: 'center', backgroundColor: 'transparent' },
  mainWrapper: { flexDirection: 'row', backgroundColor: '#FFFFFF', width: '94%', height: 72, borderRadius: 36, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
  tabButton: { alignItems: 'center', justifyContent: 'center' },
  pill: { height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 10 },
  activeTabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginLeft: 6 },
});