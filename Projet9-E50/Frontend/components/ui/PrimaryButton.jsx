import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';

export const PrimaryButton = ({ label, icon, onPress, style, disabled = false }) => (
  <TouchableOpacity style={[styles.btn, disabled && styles.btnDisabled, style]} onPress={onPress} disabled={disabled}>
    <Text style={styles.btnText}>{label}</Text>
    {icon && <Ionicons name={icon} size={20} color="white" style={{ marginLeft: 8 }} />}
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  btn: { backgroundColor: Colors.primary, height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  link: { color: Colors.primary, fontWeight: 'bold' },
});