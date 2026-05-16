import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, TextInput } from 'react-native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";

// Apply Plus Jakarta Sans as the default font for all Text components
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'PlusJakartaSans_400Regular' };
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = { fontFamily: 'PlusJakartaSans_400Regular' };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          presentation: 'card',
          contentStyle: { backgroundColor: '#F6F8F4' },
        }}
      />
    </SafeAreaProvider>
  );
}
