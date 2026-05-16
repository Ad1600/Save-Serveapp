import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Color';
import { StatusBar } from 'expo-status-bar';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.loginBackground },
        }}
      >
        <Stack.Screen name="AuthScreen" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="verify-reset" />
        <Stack.Screen
          name="reset"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen name="verify" />
      </Stack>
    </SafeAreaProvider>
  );
}