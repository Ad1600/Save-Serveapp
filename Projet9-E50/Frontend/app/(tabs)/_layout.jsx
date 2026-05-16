import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';
import { StatusBar } from 'expo-status-bar';

const TAB_ROUTES = ['explore', 'map', 'sellpage', 'orders', 'profile'];

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
      case 'explore':  return <Ionicons name={isFocused ? 'compass' : 'compass-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'map':      return <Ionicons name={isFocused ? 'location' : 'location-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'sellpage': return <Ionicons name={isFocused ? 'add-circle' : 'add-circle-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'orders':   return <Ionicons name={isFocused ? 'bag' : 'bag-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
      case 'profile':  return <Ionicons name={isFocused ? 'person' : 'person-outline'} size={size} color={isFocused ? '#FFF' : '#94A3B8'} />;
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
  if (!TAB_ROUTES.includes(activeRoute?.name)) return null;

  const visibleRoutes = state.routes.filter((r) => TAB_ROUTES.includes(r.name));

  return (
    <View style={styles.tabBarContainer}>
      <StatusBar style="dark" />
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

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen name="explore"         options={{ title: 'Explore' }} />
      <Tabs.Screen name="map"             options={{ title: 'Map' }} />
      <Tabs.Screen name="sellpage"        options={{ title: 'Sell' }} />
      <Tabs.Screen name="orders"          options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile"         options={{ title: 'Profile' }} />
      <Tabs.Screen name="edit-profile"    options={{ href: null }} />
      <Tabs.Screen name="filter"          options={{ href: null }} />
      <Tabs.Screen name="new-offer"       options={{ href: null }} />
      <Tabs.Screen name="seller-pending"  options={{ href: null }} />
      <Tabs.Screen name="notifications"   options={{ href: null }} />
      <Tabs.Screen name="become-a-seller" options={{ href: null }} />
      <Tabs.Screen name="offerDetails"      options={{ href: null, animation: 'none' }} />
      <Tabs.Screen name="contact-support"   options={{ href: null }} />
      <Tabs.Screen name="helpcenter"         options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0, right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mainWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '94%',
    height: 72,
    borderRadius: 36,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: 48, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  activeTabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginLeft: 6 },
});