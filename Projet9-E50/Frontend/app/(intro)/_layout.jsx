// app/(intro)/_layout.jsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function IntroHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstIntroScreen = pathname === '/(intro)/Intro' || pathname.endsWith('/Intro');

  const goBack = () => {
    if (pathname.includes('Intro4')) router.replace('/(intro)/Intro3');
    else if (pathname.includes('Intro3')) router.replace('/(intro)/Intro2');
    else if (pathname.includes('Intro2')) router.replace('/(intro)/Intro1');
    else if (pathname.includes('Intro1')) router.replace('/(intro)/Intro');
    else router.replace('/(auth)/AuthScreen');
  };

  return (
    <View style={styles.header}>
      {isFirstIntroScreen ? (
        <View style={styles.backPlaceholder} />
      ) : (
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.replace('/(auth)/AuthScreen')}>
        <Text style={styles.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function IntroLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <IntroHeader />,
        contentStyle: { backgroundColor: '#F4F9F1' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F4F9F1',
  },
  skip: {
    color: '#2E7D32',
    fontSize: 16,
  },
  backPlaceholder: {
    width: 24,
    height: 24,
  },
});