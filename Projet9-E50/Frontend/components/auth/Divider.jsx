import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Color';

export const AuthToggle = ({ activeTab, setActiveTab }) => (
  <View style={styles.container}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'login' && styles.activeTab]} 
      onPress={() => setActiveTab('login')}
    >
      <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Log in</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'signup' && styles.activeTab]} 
      onPress={() => setActiveTab('signup')}
    >
      <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Sign Up</Text>
    </TouchableOpacity>
  </View>
);

export const Divider = () => (
  <View style={styles.divider}>
    <View style={styles.line} />
    <Text style={styles.dividerText}>Or continue with</Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row',
     backgroundColor: '#F1FDF5',
      borderRadius: 15, 
      padding: 5, 
      marginBottom: 25
     },
  tab: { flex: 1,
     paddingVertical: 10,
      alignItems: 'center',
       borderRadius: 12 
      },
  activeTab: { 
    backgroundColor: Colors.primary
   },
  tabText: { color: '#64748B', 
    fontWeight: '600'
   },
  activeTabText: { color: 'white',
     fontWeight: 'bold'
     },
  divider: { flexDirection: 'row',
     alignItems: 'center', 
     marginVertical:25 
    },
  line: { flex: 1,
     height: 1, 
     backgroundColor: '#E2E8F0'
     },
  dividerText: { marginHorizontal: 10,
     color: '#94A3B8', 
     fontSize: 13 
    },
});