import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Color';

export default function ResendCodeButton({
  onResend,
  cooldownSeconds = 60,
  label = 'Resend Code',
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingSeconds]);

  const handlePress = async () => {
    if (remainingSeconds > 0 || sending) {
      return;
    }

    try {
      setSending(true);
      await onResend();
      setRemainingSeconds(cooldownSeconds);
    } finally {
      setSending(false);
    }
  };

  const disabled = sending || remainingSeconds > 0;
  const text = sending
    ? 'Sending...'
    : remainingSeconds > 0
      ? `${label} (${remainingSeconds}s)`
      : label;

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} style={styles.button}>
      {sending ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Text style={[styles.text, disabled && styles.disabledText]}>{text}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
    alignSelf: 'center',
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});
