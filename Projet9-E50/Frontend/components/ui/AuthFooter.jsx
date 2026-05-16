import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Color';



export const AuthFooter = ({ label, linkText, onPress }) => (
  <TouchableOpacity style={styles.footer} onPress={onPress}>
    <Text style={styles.footerText}>{label} <Text style={styles.link}>{linkText}</Text></Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: { backgroundColor: Colors.primary, height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  link: { color: Colors.primary, fontWeight: 'bold' },
});