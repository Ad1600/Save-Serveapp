import React, { useState } from 'react';
import {
  StyleSheet, View, Text, KeyboardAvoidingView,
  Platform, LayoutAnimation, ScrollView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Colors } from '../../constants/Color';
import { AuthToggle } from '../../components/auth/Divider';
import { LoginForm } from '../../components/auth/LoginForm';
import { SignupForm } from '../../components/auth/SignupForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientText from '../../components/djasser components/components/Gradient';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState('login');

  const handleToggle = (tab) => {
    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Dismiss keyboard when tapping outside inputs */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.topSection}>
            {/* App Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoSave}>Save</Text>
              <Text style={styles.logoServe}>&Serve</Text>
            </View>

            {/* Slogan */}
            <View style={styles.sloganContainer}>
              <GradientText
                text="Waste less, Eat smarter"
                colors={[Colors.orange || "#DB6C31", Colors.primary || "#5BA224"]}
                style={styles.subtitle}
              />
            </View>

            {/* Toggle Switch */}
            <AuthToggle activeTab={activeTab} setActiveTab={handleToggle} />
          </View>
        </TouchableWithoutFeedback>

        {/* Scrollable form area — ensures inputs are never hidden by keyboard */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'login' ? (
            <LoginForm onToggle={() => handleToggle('signup')} />
          ) : (
            <SignupForm onToggle={() => handleToggle('login')} />
          )}
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topSection: {
    paddingHorizontal: 25,
    paddingTop: 10,
    backgroundColor: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 8,
  },
  logoSave: {
    fontSize: 36,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: Colors.orange,
  },
  logoServe: {
    fontSize: 36,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: Colors.primary,
  },
  sloganContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 25,
    paddingTop: 12,
    paddingBottom: 40,
  },
});